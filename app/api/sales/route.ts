import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateInvoiceNumber, calculateGST } from "@/lib/utils";
import { pickBatchFEFO } from "@/lib/inventory";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const { items, patientId, prescriptionId, paymentMode, discountType, discountValue, branchId, cashierId } = body;

    let subtotal = 0;
    const saleItemsData: { medicineId: string; quantity: number; unitPrice: number; mrp: number; gstRate: number; cgstAmount: number; sgstAmount: number; totalAmount: number; batchNumber?: string }[] = [];

    const scheduleHMeds: string[] = [];
    const itemTotals: number[] = [];

    for (const item of items) {
      const medicine = await prisma.medicine.findUnique({
        where: { id: item.medicineId },
      });

      if (!medicine) {
        return NextResponse.json(
          { error: `Medicine not found: ${item.medicineId}` },
          { status: 404 }
        );
      }

      if (medicine.scheduleType === "H" || medicine.scheduleType === "H1") {
        scheduleHMeds.push(medicine.name);
      }

      try {
        const picks = await pickBatchFEFO(item.medicineId, branchId, item.quantity);
        const itemTotal = medicine.sellingPrice * item.quantity;
        subtotal += itemTotal;
        itemTotals.push(itemTotal);
        saleItemsData.push({
          medicineId: item.medicineId,
          quantity: item.quantity,
          unitPrice: medicine.sellingPrice,
          mrp: medicine.mrp,
          gstRate: medicine.gstRate,
          batchNumber: picks[0]?.batchNumber,
          cgstAmount: 0,
          sgstAmount: 0,
          totalAmount: 0,
        });
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : "Insufficient stock" },
          { status: 400 }
        );
      }
    }

    if (scheduleHMeds.length > 0 && !prescriptionId) {
      return NextResponse.json(
        { error: `Prescription required for Schedule H/H1 medicines: ${scheduleHMeds.join(", ")}` },
        { status: 422 }
      );
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
      const discountedItemTotal = itemTotals[i] - discountAmount * ratio;
      const gst = calculateGST(discountedItemTotal, saleItemsData[i].gstRate);
      saleItemsData[i].cgstAmount = gst.cgst;
      saleItemsData[i].sgstAmount = gst.sgst;
      saleItemsData[i].totalAmount = discountedItemTotal + gst.total;
      totalCGST += gst.cgst;
      totalSGST += gst.sgst;
    }

    const taxableAmount = subtotal - discountAmount;
    const totalGst = totalCGST + totalSGST;
    const totalAmount = taxableAmount + totalGst;
    const finalAmount = Math.round(totalAmount);
    const roundOff = finalAmount - totalAmount;

    const paymentStatus = paymentMode === "credit" ? "PENDING" : "PAID";
    const invoiceNumber = await generateInvoiceNumber("INV");

    const result = await prisma.$transaction(async (tx) => {
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
          paymentMode,
          paymentStatus,
          items: {
            create: saleItemsData,
          },
          payments: {
            create: {
              amount: finalAmount,
              mode: paymentMode,
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

        const batches = await tx.batch.findMany({
          where: {
            medicineId: item.medicineId,
            inventory: { branchId },
            expiryDate: { gt: new Date() },
          },
          orderBy: { expiryDate: "asc" },
        });

        let remainingQty = item.quantity;
        for (const batch of batches) {
          if (remainingQty <= 0) break;
          const decrement = Math.min(batch.quantity, remainingQty);
          await tx.batch.update({
            where: { id: batch.id },
            data: { quantity: { decrement } },
          });
          remainingQty -= decrement;
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
    console.error("Error creating sale:", error);
    return NextResponse.json(
      { error: "Failed to create sale" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = {};

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
