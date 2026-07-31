import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const { orderId, items, branchId } = await req.json();
    if (!orderId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Order ID and items required" }, { status: 400 });
    }

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { medicine: { select: { mrp: true, name: true } } } },
      },
    });
    if (!po) return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    if (po.status === "RECEIVED") {
      return NextResponse.json({ error: "This purchase order was already received" }, { status: 400 });
    }

    const poItemsByMedicine = new Map(po.items.map((i) => [i.medicineId, i]));

    // ponytail: one-shot receive (no partial receipts). Upgrade path: track receivedQty per line and allow increments.
    for (const item of items) {
      const line = poItemsByMedicine.get(item.medicineId);
      if (!line) return NextResponse.json({ error: `Item ${item.medicineId} is not on this purchase order` }, { status: 400 });
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty <= 0 || qty > line.quantity) {
        return NextResponse.json({ error: `Invalid quantity for ${line.medicine.name || line.medicineId}` }, { status: 400 });
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const [index, item] of items.entries()) {
        const line = poItemsByMedicine.get(item.medicineId)!;
        const qty = Number(item.quantity);

        const inventory = await tx.inventory.upsert({
          where: { medicineId_branchId: { medicineId: item.medicineId, branchId } },
          update: { quantity: { increment: qty } },
          create: { medicineId: item.medicineId, branchId, quantity: qty },
        });

        await tx.batch.create({
          data: {
            batchNumber: item.batchNumber || `B-${po.poNumber}-${index + 1}`,
            medicineId: item.medicineId,
            inventoryId: inventory.id,
            quantity: qty,
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000),
            purchasePrice: line.unitPrice,
            mrp: line.medicine.mrp,
          },
        });
      }

      await tx.purchaseOrder.update({
        where: { id: orderId },
        data: {
          status: "RECEIVED",
          items: {
            update: items.map((item) => ({
              where: { id: poItemsByMedicine.get(item.medicineId)!.id },
              data: { receivedQty: { increment: Number(item.quantity) } },
            })),
          },
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error receiving goods:", error);
    return NextResponse.json({ error: "Failed to receive goods" }, { status: 500 });
  }
}
