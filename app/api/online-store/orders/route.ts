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
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const { customerId, items, shippingAddress, shippingCity, shippingState, shippingPincode, paymentMode } = body;

    if (!customerId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "customerId and items are required" }, { status: 400 });
    }

    const medicineIds = items.map((i: { medicineId: string }) => i.medicineId);
    const medicines = await prisma.medicine.findMany({
      where: { id: { in: medicineIds } },
      include: { inventories: true },
    });

    const medicineMap = new Map(medicines.map((m) => [m.id, m]));
    let subtotal = 0;
    const stockErrors: string[] = [];

    for (const it of items) {
      const med = medicineMap.get(it.medicineId);
      if (!med) {
        stockErrors.push(`Medicine not found: ${it.medicineId}`);
        continue;
      }
      const qty = it.quantity || 1;
      const totalStock = med.inventories.reduce((s, inv) => s + inv.quantity, 0);
      if (totalStock < qty) {
        stockErrors.push(`Insufficient stock for ${med.name}: available ${totalStock}, requested ${qty}`);
      }
      subtotal += med.sellingPrice * qty;
    }

    if (stockErrors.length > 0) {
      return NextResponse.json({ error: stockErrors.join("; ") }, { status: 400 });
    }

    const order = await prisma.onlineOrder.create({
      data: {
        orderNumber: await generateInvoiceNumber("ORD"),
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
            unitPrice: medicineMap.get(it.medicineId)?.sellingPrice || 0,
            totalAmount: (medicineMap.get(it.medicineId)?.sellingPrice || 0) * (it.quantity || 1),
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
  const session = await requireAuth();
  if (!session) return unauthorized();
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
