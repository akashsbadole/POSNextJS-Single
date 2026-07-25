import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { orderId, items, branchId } = await req.json();
    if (!orderId || !items?.length) {
      return NextResponse.json({ error: "Order ID and items required" }, { status: 400 });
    }

    // Update PO status to RECEIVED
    await prisma.purchaseOrder.update({
      where: { id: orderId },
      data: { status: "RECEIVED" },
    });

    // Update inventory for each item
    for (const item of items) {
      const { medicineId, quantity } = item;
      if (!medicineId || !quantity) continue;

      const existing = await prisma.inventory.findFirst({
        where: { medicineId, branchId },
      });

      if (existing) {
        await prisma.inventory.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + quantity },
        });
      } else {
        await prisma.inventory.create({
          data: { medicineId, branchId, quantity },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error receiving goods:", error);
    return NextResponse.json({ error: "Failed to receive goods" }, { status: 500 });
  }
}
