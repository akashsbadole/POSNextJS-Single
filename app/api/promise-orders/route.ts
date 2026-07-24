import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const orders = await prisma.promiseOrder.findMany({
      where,
      include: { medicine: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching promise orders:", error);
    return NextResponse.json({ error: "Failed to fetch promise orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const order = await prisma.promiseOrder.create({ data: body });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating promise order:", error);
    return NextResponse.json({ error: "Failed to create promise order" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
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
