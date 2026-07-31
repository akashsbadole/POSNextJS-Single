import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";
    const expected = crypto.createHmac("sha256", RAZORPAY_KEY_SECRET).update(body).digest("hex");
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
        await prisma.onlineOrder.update({
          where: { id: order.id },
          data: { paymentStatus: "PAID", status: "PROCESSING" },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
// ponytail: minimal Razorpay webhook — payment.captured / order.paid events only. Signature verification skipped; add when processing real payments.
