import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateInvoiceNumber, calculateGST } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, patientId, prescriptionId, paymentMode, discountType, discountValue, branchId, cashierId } = body;

    let subtotal = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    const saleItemsData: { medicineId: string; quantity: number; unitPrice: number; mrp: number; gstRate: number; cgstAmount: number; sgstAmount: number; totalAmount: number }[] = [];

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

      const inventory = await prisma.inventory.findUnique({
        where: { medicineId_branchId: { medicineId: item.medicineId, branchId } },
      });

      if (!inventory || inventory.quantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${medicine.name}. Available: ${inventory?.quantity || 0}, requested: ${item.quantity}` },
          { status: 400 }
        );
      }

      const itemTotal = medicine.sellingPrice * item.quantity;
      const gst = calculateGST(itemTotal, medicine.gstRate);

      subtotal += itemTotal;
      totalCGST += gst.cgst;
      totalSGST += gst.sgst;

      saleItemsData.push({
        medicineId: item.medicineId,
        quantity: item.quantity,
        unitPrice: medicine.sellingPrice,
        mrp: medicine.mrp,
        gstRate: medicine.gstRate,
        cgstAmount: gst.cgst,
        sgstAmount: gst.sgst,
        totalAmount: itemTotal + gst.total,
      });
    }

    let discountAmount = 0;
    if (discountType === "percentage") {
      discountAmount = (subtotal * discountValue) / 100;
    } else if (discountType === "flat") {
      discountAmount = discountValue;
    }

    const taxableAmount = subtotal - discountAmount;
    const totalGst = totalCGST + totalSGST;
    const totalAmount = taxableAmount + totalGst;
    const finalAmount = Math.round(totalAmount);
    const roundOff = finalAmount - totalAmount;

    const paymentStatus = paymentMode === "credit" ? "PENDING" : "PAID";

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          invoiceNumber: generateInvoiceNumber("INV"),
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
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};

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
