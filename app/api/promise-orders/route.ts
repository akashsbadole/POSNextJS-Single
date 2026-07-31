import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    const [orders, total] = await Promise.all([
      prisma.promiseOrder.findMany({
        where,
        include: { medicine: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.promiseOrder.count({ where }),
    ]);

    return NextResponse.json({ orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("Error fetching promise orders:", error);
    return NextResponse.json({ error: "Failed to fetch promise orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const { customerName, customerPhone, medicineId, quantity, notes } = body;
    if (!customerName || !medicineId || !quantity) {
      return NextResponse.json({ error: "customerName, medicineId, and quantity are required" }, { status: 400 });
    }
    const order = await prisma.promiseOrder.create({ data: { customerName, customerPhone, medicineId, quantity, notes } });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating promise order:", error);
    return NextResponse.json({ error: "Failed to create promise order" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "Promise order ID required" }, { status: 400 });
    const order = await prisma.promiseOrder.update({ where: { id }, data });
    return NextResponse.json(order);
  } catch (error) {
    console.error("Error updating promise order:", error);
    return NextResponse.json({ error: "Failed to update promise order" }, { status: 500 });
  }
}
