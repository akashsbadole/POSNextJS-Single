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

    if (event === "payment.captured" || event === "order.paid") {
      const payload = parsed.payload;
      const orderId = payload?.payment?.entity?.notes?.orderId
        || payload?.order?.entity?.receipt;

      if (!orderId) {
        return NextResponse.json({ error: "Missing order reference" }, { status: 400 });
      }

      const order = await prisma.onlineOrder.findFirst({
        where: { OR: [{ id: orderId }, { orderNumber: orderId }] },
      });

      if (order && order.paymentStatus !== "PAID") {
        await prisma.$transaction(async (tx) => {
          await tx.onlineOrder.update({
            where: { id: order.id },
            data: { paymentStatus: "PAID", status: "PROCESSING" },
          });
          const items = await tx.onlineOrderItem.findMany({ where: { orderId: order.id } });
          for (const item of items) {
            // ponytail: online orders pick any branch with stock (findFirst). Upgrade path: per-order fulfillment branch.
            const inv = await tx.inventory.findFirst({
              where: { medicineId: item.medicineId, quantity: { gte: item.quantity } },
              orderBy: { quantity: "desc" },
            });
            if (inv) {
              await tx.inventory.update({
                where: { id: inv.id },
                data: { quantity: { decrement: item.quantity } },
              });
            } else {
              await tx.onlineOrder.update({
                where: { id: order.id },
                data: { status: "CANCELLED" },
              });
              break;
            }
          }
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
// ponytail: minimal Razorpay webhook — payment.captured / order.paid events only. Stock is deducted here on confirmed payment.
