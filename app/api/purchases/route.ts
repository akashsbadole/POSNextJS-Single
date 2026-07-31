import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateInvoiceNumber } from "@/lib/utils";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: { select: { name: true } },
          branch: { select: { name: true } },
          createdBy: { select: { name: true } },
          items: { include: { medicine: { select: { name: true } } } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return NextResponse.json({ orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("Error fetching purchases:", error);
    return NextResponse.json({ error: "Failed to fetch purchases" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const { items, branchId, supplierId, notes, expectedDate } = body;
    if (!Array.isArray(items) || items.length === 0 || !branchId || !supplierId) {
      return NextResponse.json({ error: "Items, branch and supplier required" }, { status: 400 });
    }

    const itemsData = items.map((item: { medicineId: string; quantity: number; unitPrice: number; gstRate?: number }) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      const totalAmount = quantity * unitPrice;
      return { medicineId: item.medicineId, quantity, unitPrice, gstRate: Number(item.gstRate || 0), totalAmount };
    });
    const subtotal = itemsData.reduce((sum, i) => sum + i.totalAmount, 0);
    const gstTotal = itemsData.reduce((sum, i) => sum + (i.totalAmount * i.gstRate) / 100, 0);

    const order = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          branchId,
          supplierId,
          notes,
          expectedDeliveryDate: expectedDate ? new Date(expectedDate) : undefined,
          createdById: session.user.id,
          poNumber: await generateInvoiceNumber("PO"),
          status: "DRAFT",
          subtotal,
          taxableAmount: subtotal,
          cgstAmount: gstTotal / 2,
          sgstAmount: gstTotal / 2,
          totalAmount: subtotal + gstTotal,
          items: {
            create: itemsData,
          },
        },
        include: { items: true },
      });
      return po;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase order:", error);
    return NextResponse.json({ error: "Failed to create purchase order" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "Purchase order ID required" }, { status: 400 });
    if (data.status && !["DRAFT", "PENDING", "RECEIVED", "CANCELLED"].includes(data.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const order = await prisma.purchaseOrder.update({ where: { id }, data });
    return NextResponse.json(order);
  } catch (error) {
    console.error("Error updating purchase order:", error);
    return NextResponse.json({ error: "Failed to update purchase order" }, { status: 500 });
  }
}
