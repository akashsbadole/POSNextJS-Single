import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(_req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: { items: { include: { medicine: { select: { id: true, name: true, sellingPrice: true, isPrescriptionRequired: true } } } } },
  });
  return NextResponse.json(cart?.items || []);
}

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  const { medicineId, quantity } = await req.json();
  if (!medicineId) return NextResponse.json({ error: "medicineId required" }, { status: 400 });
  if (!Number.isInteger(quantity) || quantity < 0) {
    return NextResponse.json({ error: "Quantity must be a non-negative integer" }, { status: 400 });
  }

  let cart = await prisma.cart.findUnique({ where: { userId: session.user.id } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId: session.user.id } });
  }

  if (quantity === 0) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, medicineId } });
  } else {
    await prisma.cartItem.upsert({
      where: { cartId_medicineId: { cartId: cart.id, medicineId } },
      update: { quantity },
      create: { cartId: cart.id, medicineId, quantity },
    });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  await prisma.cart.deleteMany({ where: { userId: session.user.id } });
  return NextResponse.json({ success: true });
}
