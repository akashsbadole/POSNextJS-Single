import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateInvoiceNumber } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const [orders, total] = await Promise.all([
      prisma.onlineOrder.findMany({
        where,
        include: {
          customer: { select: { name: true, email: true } },
          items: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.onlineOrder.count({ where }),
    ]);

    return NextResponse.json({ orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("Error fetching online orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, items, shippingAddress, shippingCity, shippingState, shippingPincode, paymentMode } = body;

    if (!customerId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "customerId and items are required" }, { status: 400 });
    }

    let subtotal = 0;
    for (const it of items) {
      const med = await prisma.medicine.findUnique({ where: { id: it.medicineId } });
      if (!med) return NextResponse.json({ error: `Medicine not found: ${it.medicineId}` }, { status: 404 });
      subtotal += med.sellingPrice * (it.quantity || 1);
    }

    const order = await prisma.onlineOrder.create({
      data: {
        orderNumber: generateInvoiceNumber("ORD"),
        customerId,
        shippingAddress: shippingAddress || "",
        shippingCity: shippingCity || "",
        shippingState: shippingState || "",
        shippingPincode: shippingPincode || "",
        subtotal,
        totalAmount: subtotal,
        paymentMode: paymentMode || "prepaid",
        paymentStatus: "PAID",
        status: "PROCESSING",
        items: {
          create: items.map((it: { medicineId: string; quantity: number }) => ({
            medicineId: it.medicineId,
            quantity: it.quantity || 1,
            unitPrice: 0,
            totalAmount: 0,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating online order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;
    if (!id) return NextResponse.json({ error: "Order id required" }, { status: 400 });
    const order = await prisma.onlineOrder.update({ where: { id }, data: status ? { status } : {} });
    return NextResponse.json(order);
  } catch (error) {
    console.error("Error updating online order:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
