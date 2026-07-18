import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateInvoiceNumber, calculateGST } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, patientId, prescriptionId, paymentMode, discountType, discountValue, branchId, cashierId } = body;

    // Calculate totals
    let subtotal = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    const saleItems = [];

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

      const itemTotal = medicine.sellingPrice.toNumber() * item.quantity;
      const gst = calculateGST(itemTotal, medicine.gstRate.toNumber());

      subtotal += itemTotal;
      totalCGST += gst.cgst;
      totalSGST += gst.sgst;

      saleItems.push({
        medicineId: item.medicineId,
        quantity: item.quantity,
        unitPrice: medicine.sellingPrice,
        mrp: medicine.mrp,
        gstRate: medicine.gstRate,
        cgstAmount: gst.cgst,
        sgstAmount: gst.sgst,
        totalAmount: itemTotal + gst.total,
      });

      // Update inventory
      await prisma.inventory.updateMany({
        where: { medicineId: item.medicineId, branchId },
        data: { quantity: { decrement: item.quantity } },
      });
    }

    // Apply discount
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

    // Create sale
    const sale = await prisma.sale.create({
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
        paymentStatus: "PAID",
        items: {
          create: saleItems,
        },
        payments: {
          create: {
            amount: finalAmount,
            mode: paymentMode,
            status: "PAID",
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

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: cashierId,
        action: "CREATE",
        entityType: "sale",
        entityId: sale.id,
        newData: sale,
      },
    });

    return NextResponse.json(sale, { status: 201 });
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
