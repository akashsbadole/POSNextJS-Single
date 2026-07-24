import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateInvoiceNumber } from "@/lib/utils";

export async function GET(req: NextRequest) {
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
  try {
    const body = await req.json();
    const { items, ...orderData } = body;

    const order = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          ...orderData,
          poNumber: generateInvoiceNumber("PO"),
          status: "DRAFT",
          items: {
            create: items,
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
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "Purchase order ID required" }, { status: 400 });
    const order = await prisma.purchaseOrder.update({ where: { id }, data });
    return NextResponse.json(order);
  } catch (error) {
    console.error("Error updating purchase order:", error);
    return NextResponse.json({ error: "Failed to update purchase order" }, { status: 500 });
  }
}
