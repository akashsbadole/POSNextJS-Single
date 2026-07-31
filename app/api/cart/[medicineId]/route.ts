import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ medicineId: string }> }) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  const medicineId = (await params).medicineId;
  const cart = await prisma.cart.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, medicineId } });
  }
  return NextResponse.json({ success: true });
}
