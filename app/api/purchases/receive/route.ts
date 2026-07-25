import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const { orderId, items, branchId } = await req.json();
    if (!orderId || !items?.length) {
      return NextResponse.json({ error: "Order ID and items required" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.purchaseOrder.update({
        where: { id: orderId },
        data: { status: "RECEIVED" },
      });

      for (const item of items) {
        const { medicineId, quantity } = item;
        if (!medicineId || !quantity) continue;

        const existing = await tx.inventory.findFirst({
          where: { medicineId, branchId },
        });

        if (existing) {
          await tx.inventory.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + quantity },
          });
        } else {
          await tx.inventory.create({
            data: { medicineId, branchId, quantity },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error receiving goods:", error);
    return NextResponse.json({ error: "Failed to receive goods" }, { status: 500 });
  }
}
