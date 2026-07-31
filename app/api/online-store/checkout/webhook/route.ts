import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "RAZORPAY_KEY_SECRET not configured" }, { status: 503 });
  }
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";
    const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
    if (signature !== expected) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
    const parsed = JSON.parse(body);
    const event = parsed.event;
    const payload = parsed.payload;

    if (event === "payment.captured" || event === "order.paid") {
      const ref = payload?.payment?.entity?.notes?.orderNumber
        || payload?.payment?.entity?.notes?.orderId
        || payload?.order?.entity?.receipt;

      if (!ref) {
        return NextResponse.json({ error: "Missing order reference" }, { status: 400 });
      }

      const order = await prisma.onlineOrder.findFirst({
        where: { OR: [{ id: ref }, { orderNumber: ref }] },
      });

      if (order && order.paymentStatus !== "PAID") {
        await prisma.$transaction(async (tx) => {
          const items = await tx.onlineOrderItem.findMany({ where: { orderId: order.id } });
          // pre-check every line before moving any stock — a shortfall cancels the order with nothing deducted
          const picks: { inventoryId: string; quantity: number }[] = [];
          for (const item of items) {
            const inv = await tx.inventory.findFirst({
              where: { medicineId: item.medicineId, quantity: { gte: item.quantity } },
              orderBy: { quantity: "desc" },
            });
            if (!inv) {
              await tx.onlineOrder.update({
                where: { id: order.id },
                data: { status: "CANCELLED" },
              });
              return;
            }
            picks.push({ inventoryId: inv.id, quantity: item.quantity });
          }
          for (const pick of picks) {
            await tx.inventory.update({
              where: { id: pick.inventoryId },
              data: { quantity: { decrement: pick.quantity } },
            });
          }
          await tx.onlineOrder.update({
            where: { id: order.id },
            data: { paymentStatus: "PAID", status: "PROCESSING" },
          });
        });
      }
    } else if (event === "payment.failed" || event === "order.failed") {
      const ref = payload?.payment?.entity?.notes?.orderNumber
        || payload?.payment?.entity?.notes?.orderId
        || payload?.order?.entity?.receipt;
      if (!ref) return NextResponse.json({ error: "Missing order reference" }, { status: 400 });

      const order = await prisma.onlineOrder.findFirst({
        where: { OR: [{ id: ref }, { orderNumber: ref }] },
      });
      if (order && order.paymentStatus !== "PAID") {
        await prisma.onlineOrder.update({
          where: { id: order.id },
          data: { paymentStatus: "FAILED", status: "CANCELLED" },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
// ponytail: minimal Razorpay webhook — captured/paid/failed events only. Stock is deducted here on confirmed payment.
