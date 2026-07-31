import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { enforceFeature } from "@/lib/features";

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  if (!enforceFeature("subscriptions", session.user.businessType as import("@/lib/features").BusinessType)) return NextResponse.json({ error: "Feature not enabled" }, { status: 403 });
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        include: {
          customer: { select: { name: true, email: true } },
          items: { include: { medicine: true } },
          deliveries: { orderBy: { scheduledDate: "desc" } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.subscription.count({ where }),
    ]);

    return NextResponse.json({
      subscriptions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const { customerId, name, frequency, items, nextDeliveryDate } = body;
    if (!customerId || !name || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "customerId, name and items are required" }, { status: 400 });
    }

    const medicineIds = items.map((it: { medicineId: string }) => it.medicineId);
    const medicines = await prisma.medicine.findMany({
      where: { id: { in: medicineIds } },
      select: { id: true, sellingPrice: true },
    });
    const priceMap = new Map(medicines.map((m) => [m.id, m.sellingPrice]));

    let subtotal = 0;
    for (const it of items) {
      const price = priceMap.get(it.medicineId);
      if (!price) return NextResponse.json({ error: `Medicine not found: ${it.medicineId}` }, { status: 404 });
      subtotal += price * (it.quantity || 1);
    }

    const subscription = await prisma.subscription.create({
      data: {
        customerId,
        name,
        frequency: frequency || "MONTHLY",
        subtotal,
        totalAmount: subtotal,
        status: "ACTIVE",
        nextDeliveryDate: nextDeliveryDate ? new Date(nextDeliveryDate) : new Date(Date.now() + 30 * 86400000),
        items: {
          create: items.map((it: { medicineId: string; quantity: number }) => ({
            medicineId: it.medicineId,
            quantity: it.quantity || 1,
            unitPrice: priceMap.get(it.medicineId) || 0,
          })),
        },
      },
      include: { items: true, customer: true },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const { id, status } = body;
    if (!id) return NextResponse.json({ error: "Subscription id required" }, { status: 400 });

    const subscription = await prisma.subscription.update({
      where: { id },
      data: status ? { status } : {},
    });

    return NextResponse.json(subscription);
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Subscription id required" }, { status: 400 });

    await prisma.subscription.update({ where: { id }, data: { status: "CANCELLED" } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }
}
