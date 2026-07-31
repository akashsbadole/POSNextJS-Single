import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

const ORDER_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "FAILED"];

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { trackingNumber: { contains: search } },
      ];
    }

    const orders = await prisma.onlineOrder.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        trackingNumber: true,
        status: true,
        shippingAddress: true,
        shippingCity: true,
        shippingState: true,
        deliveryDate: true,
        items: { select: { quantity: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const deliveries = orders.map((o) => ({
      id: o.id,
      order: o.orderNumber,
      trackingNumber: o.trackingNumber,
      status: o.status,
      address: [o.shippingAddress, o.shippingCity, o.shippingState].filter(Boolean).join(", "),
      eta: o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString("en-IN") : "—",
      items: o.items.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0),
    }));

    return NextResponse.json({ deliveries });
  } catch (error) {
    console.error("Error fetching deliveries:", error);
    return NextResponse.json({ error: "Failed to fetch deliveries" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const { id, status, trackingNumber, courierPartner } = body;
    if (!id) return NextResponse.json({ error: "Order id required" }, { status: 400 });

    const update: Record<string, unknown> = {};
    if (status) {
      if (!ORDER_STATUSES.includes(status)) {
        return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
      }
      update.status = status;
    }
    if (trackingNumber) update.trackingNumber = trackingNumber;
    if (courierPartner) update.courierPartner = courierPartner;

    const order = await prisma.onlineOrder.update({ where: { id }, data: update });
    return NextResponse.json(order);
  } catch (error) {
    console.error("Error updating delivery:", error);
    return NextResponse.json({ error: "Failed to update delivery" }, { status: 500 });
  }
}
