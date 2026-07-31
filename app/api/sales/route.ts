import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateInvoiceNumber, calculateGST, calculateGSTInclusive } from "@/lib/utils";
import { pickBatchFEFO } from "@/lib/inventory";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const { items, patientId, prescriptionId, paymentMode, discountType, discountValue, branchId } = body;
    if (!Array.isArray(items) || items.length === 0 || !branchId) {
      return NextResponse.json({ error: "Items and branch are required" }, { status: 400 });
    }
    if (items.some((i: { quantity?: number }) => !Number.isInteger(i.quantity) || (i.quantity ?? 0) <= 0)) {
      return NextResponse.json({ error: "Item quantities must be positive integers" }, { status: 400 });
    }
    if (discountType && !["percentage", "flat"].includes(discountType)) {
      return NextResponse.json({ error: "discountType must be percentage or flat" }, { status: 400 });
    }
    if (discountValue < 0 || (discountType === "percentage" && discountValue > 100)) {
      return NextResponse.json({ error: "Invalid discount value" }, { status: 400 });
    }
    if (paymentMode && !["cash", "card", "upi", "credit"].includes(paymentMode.toLowerCase())) {
      return NextResponse.json({ error: "Invalid payment mode" }, { status: 400 });
    }
    const mode = paymentMode ? paymentMode.toLowerCase() : "cash";
    const cashierId = session.user.id;

    const taxSetting = await prisma.setting.findUnique({ where: { key: "taxInclusive" } });
    const taxInclusive = taxSetting?.value === "true";

    const result = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const saleItemsData: { medicineId: string; quantity: number; unitPrice: number; mrp: number; gstRate: number; discountAmount: number; cgstAmount: number; sgstAmount: number; totalAmount: number; batchNumber?: string }[] = [];

      const scheduleHMeds: string[] = [];
      const itemTotals: number[] = [];
      const itemDiscounts: number[] = [];
      const batchPicksMap = new Map<string, Awaited<ReturnType<typeof pickBatchFEFO>>>();

      for (const item of items) {
        const medicine = await tx.medicine.findUnique({
          where: { id: item.medicineId },
        });

        if (!medicine) {
          throw new Error(`Medicine not found: ${item.medicineId}`);
        }

        if (medicine.scheduleType === "H" || medicine.scheduleType === "H1") {
          scheduleHMeds.push(medicine.name);
        }

        const itemDiscount = item.discountAmount || 0;
        const itemTotal = medicine.sellingPrice * item.quantity;
        if (itemDiscount < 0 || itemDiscount > itemTotal) {
          throw new Error(`Invalid discount on ${medicine.name}`);
        }

        const picks = await pickBatchFEFO(item.medicineId, branchId, item.quantity, tx);
        // ponytail: merge picks per medicine — duplicate lines in one bill must decrement each batch once
        const existing = batchPicksMap.get(item.medicineId) || [];
        const byBatch = new Map(existing.map((p) => [p.batchId, p]));
        for (const p of picks) {
          const prev = byBatch.get(p.batchId);
          byBatch.set(p.batchId, prev ? { ...prev, pickQty: prev.pickQty + p.pickQty } : p);
        }
        batchPicksMap.set(item.medicineId, [...byBatch.values()]);
        subtotal += itemTotal;
        itemTotals.push(itemTotal);
        itemDiscounts.push(itemDiscount);
        saleItemsData.push({
          medicineId: item.medicineId,
          quantity: item.quantity,
          unitPrice: medicine.sellingPrice,
          mrp: medicine.mrp,
          gstRate: medicine.gstRate,
          discountAmount: itemDiscount,
          batchNumber: picks[0]?.batchNumber,
          cgstAmount: 0,
          sgstAmount: 0,
          totalAmount: 0,
        });
      }

      if (scheduleHMeds.length > 0 && !prescriptionId) {
        throw new Error(`Prescription required for Schedule H/H1 medicines: ${scheduleHMeds.join(", ")}`);
      }

      let discountAmount = 0;
      if (discountType === "percentage") {
        discountAmount = (subtotal * discountValue) / 100;
      } else if (discountType === "flat") {
        discountAmount = discountValue;
      }

      let totalCGST = 0;
      let totalSGST = 0;

      for (let i = 0; i < saleItemsData.length; i++) {
        const ratio = subtotal > 0 ? itemTotals[i] / subtotal : 1 / saleItemsData.length;
        const discountedItemTotal = itemTotals[i] - itemDiscounts[i] - discountAmount * ratio;
        const gst = taxInclusive
          ? calculateGSTInclusive(discountedItemTotal, saleItemsData[i].gstRate)
          : calculateGST(discountedItemTotal, saleItemsData[i].gstRate);
        saleItemsData[i].cgstAmount = gst.cgst;
        saleItemsData[i].sgstAmount = gst.sgst;
        // exclusive: gst.total is tax only, add base back; inclusive: gst.total already is the customer price
        saleItemsData[i].totalAmount = taxInclusive ? gst.total : discountedItemTotal + gst.total;
        totalCGST += gst.cgst;
        totalSGST += gst.sgst;
      }

      const totalItemDiscount = itemDiscounts.reduce((s, d) => s + d, 0);
      // ponytail: inclusive mode — customer-facing total already contains GST, so tax is backed out for taxableAmount
      const totalAmount = taxInclusive
        ? subtotal - discountAmount - totalItemDiscount
        : subtotal - discountAmount - totalItemDiscount + totalCGST + totalSGST;
      const taxableAmount = totalAmount - (totalCGST + totalSGST);
      const totalGst = totalCGST + totalSGST;
      const finalAmount = Math.round(totalAmount);
      const roundOff = finalAmount - totalAmount;

      if (mode === "credit") {
        if (!patientId) throw new Error("Credit sales require a patient");
        const patient = await tx.patient.findUnique({ where: { id: patientId } });
        if (!patient || patient.creditLimit <= 0) throw new Error("Credit not allowed for this patient");
        const outstanding = await tx.sale.aggregate({
          where: { patientId, paymentStatus: "PENDING" },
          _sum: { finalAmount: true },
        });
        if ((outstanding._sum.finalAmount || 0) + finalAmount > patient.creditLimit) {
          throw new Error("Credit limit exceeded");
        }
      }

      const paymentStatus = mode === "credit" ? "PENDING" : "PAID";
      const invoiceNumber = await generateInvoiceNumber("INV");

      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          branchId,
          patientId,
          prescriptionId,
          cashierId,
          subtotal,
          discountAmount,
          discountType,
          discountValue: discountValue || 0,
          taxableAmount,
          cgstAmount: totalCGST,
          sgstAmount: totalSGST,
          totalGst,
          totalAmount,
          roundOff,
          finalAmount,
          paymentMode: mode,
          paymentStatus,
          items: {
            create: saleItemsData,
          },
          payments: {
            create: {
              amount: finalAmount,
              mode,
              status: paymentStatus,
            },
          },
        },
        include: {
          items: {
            include: { medicine: true },
          },
          patient: true,
        },
      });

      for (const item of items) {
        await tx.inventory.update({
          where: { medicineId_branchId: { medicineId: item.medicineId, branchId } },
          data: { quantity: { decrement: item.quantity } },
        });

        const picks = batchPicksMap.get(item.medicineId);
        if (picks) {
          for (const pick of picks) {
            await tx.batch.update({
              where: { id: pick.batchId },
              data: { quantity: { decrement: pick.pickQty } },
            });
          }
        }
      }

      await tx.auditLog.create({
        data: {
          userId: cashierId,
          action: "CREATE",
          entityType: "sale",
          entityId: sale.id,
          newData: JSON.stringify(sale),
        },
      });

      return sale;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create sale";
    const status = message.startsWith("Medicine not found:") ? 404
      : message.startsWith("Prescription required") ? 422
      : message.startsWith("Insufficient stock") ? 400
      : message.startsWith("Invalid discount") ? 400
      : message.startsWith("Credit") ? 400
      : 500;
    if (status === 500) console.error("Error creating sale:", error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = {};

    // ponytail: non-OWNER users see only their branch's sales; OWNER sees all (multi-branch)
    if (session.user.branchId && session.user.role !== "OWNER") {
      where.branchId = session.user.branchId;
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          items: { include: { medicine: true } },
          patient: true,
          cashier: { select: { name: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.sale.count({ where }),
    ]);

    return NextResponse.json({
      sales,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales" },
      { status: 500 }
    );
  }
}
