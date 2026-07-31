import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateInvoiceNumber } from "@/lib/utils";
import { requireAuth, unauthorized } from "@/lib/api-auth";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const { items, shippingAddress, shippingCity, shippingState, shippingPincode, paymentMode } = body;
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items are required" }, { status: 400 });
    }
    if (!shippingAddress || !shippingCity || !shippingState || !shippingPincode) {
      return NextResponse.json({ error: "Complete shipping address required" }, { status: 400 });
    }

    const medicineIds = items.map((i: { medicineId: string }) => i.medicineId);
    const medicines = await prisma.medicine.findMany({
      where: { id: { in: medicineIds } },
      include: { inventories: true },
    });
    const medicineMap = new Map(medicines.map((m) => [m.id, m]));
    let subtotal = 0;
    const stockErrors: string[] = [];

    for (const it of items) {
      const med = medicineMap.get(it.medicineId);
      if (!med) { stockErrors.push(`Medicine not found: ${it.medicineId}`); continue; }
      const qty = it.quantity || 1;
      const stock = med.inventories.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0);
      if (stock < qty) {
        stockErrors.push(`Insufficient stock for ${med.name}: available ${stock}, requested ${qty}`);
      }
      subtotal += med.sellingPrice * qty;
    }
    if (stockErrors.length > 0) {
      return NextResponse.json({ error: stockErrors.join("; ") }, { status: 400 });
    }

    // ponytail: order created PENDING with no stock movement — stock is deducted on payment capture in the webhook.
    const order = await prisma.onlineOrder.create({
      data: {
        orderNumber: await generateInvoiceNumber("ORD"),
        customerId: session.user.id,
        shippingAddress,
        shippingCity,
        shippingState,
        shippingPincode,
        subtotal,
        totalAmount: Math.round(subtotal * 1.05 * 100) / 100, // 5% GST, matches storefront display
        paymentMode: paymentMode || "prepaid",
        paymentStatus: "PENDING",
        status: "PENDING",
        items: {
          create: items.map((it: { medicineId: string; quantity: number }) => ({
            medicineId: it.medicineId,
            quantity: it.quantity || 1,
            unitPrice: medicineMap.get(it.medicineId)?.sellingPrice || 0,
            totalAmount: (medicineMap.get(it.medicineId)?.sellingPrice || 0) * (it.quantity || 1),
          })),
        },
      },
      include: { items: true },
    });

    let razorpayOrderId: string | null = null;
    if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
      const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
      const rpRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
        body: JSON.stringify({
          amount: Math.round(order.totalAmount * 100),
          currency: "INR",
          receipt: order.orderNumber,
          notes: { orderId: order.id },
        }),
      });
      if (!rpRes.ok) {
        const errBody = await rpRes.text();
        console.error("Razorpay order creation failed:", rpRes.status, errBody);
        return NextResponse.json({ error: "Payment provider error", details: errBody }, { status: 502 });
      }
      const rpData = await rpRes.json();
      razorpayOrderId = rpData.id;
    }

    return NextResponse.json({
      order,
      razorpayOrderId,
      razorpayKeyId: RAZORPAY_KEY_ID,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating checkout:", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
