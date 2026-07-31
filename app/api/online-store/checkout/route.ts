import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateInvoiceNumber } from "@/lib/utils";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/rate-limit";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    if (!(await checkRateLimit(`checkout:${session.user.id}`, 10, 10 * 60 * 1000))) {
      return NextResponse.json({ error: "Too many checkout attempts, try later" }, { status: 429 });
    }

    const body = await req.json();
    const { items, shippingAddress, shippingCity, shippingState, shippingPincode, paymentMode } = body;
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items are required" }, { status: 400 });
    }
    if (!shippingAddress || !shippingCity || !shippingState || !shippingPincode) {
      return NextResponse.json({ error: "Complete shipping address required" }, { status: 400 });
    }

    for (const it of items) {
      const q = Number(it.quantity);
      if (!Number.isInteger(q) || q <= 0 || q > 999) {
        return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
      }
    }

    const medicineIds = items.map((i: { medicineId: string }) => i.medicineId);
    const medicines = await prisma.medicine.findMany({
      where: { id: { in: medicineIds } },
      include: { inventories: true },
    });
    const medicineMap = new Map(medicines.map((m) => [m.id, m]));
    let subtotal = 0;
    let tax = 0;
    const stockErrors: string[] = [];

    // ponytail: fulfillment picks ONE branch with enough stock (see webhook), so check the best single branch, not the sum across branches.
    const lines = items.map((it: { medicineId: string; quantity: number }) => {
      const med = medicineMap.get(it.medicineId);
      if (!med) { stockErrors.push(`Medicine not found: ${it.medicineId}`); return null; }
      const q = Number(it.quantity);
      const bestBranchStock = Math.max(0, ...med.inventories.map((i: { quantity: number }) => i.quantity));
      if (bestBranchStock < q) {
        stockErrors.push(`Insufficient stock for ${med.name}: available ${bestBranchStock}, requested ${q}`);
      }
      subtotal += med.sellingPrice * q;
      tax += (med.sellingPrice * q * (med.gstRate || 0)) / 100;
      return { med, q };
    });
    if (stockErrors.length > 0) {
      return NextResponse.json({ error: stockErrors.join("; ") }, { status: 400 });
    }
    const orderLines = lines.filter((l): l is NonNullable<typeof l> => l !== null);

    const totalAmount = Math.round((subtotal + tax) * 100) / 100;
    const orderNumber = await generateInvoiceNumber("ORD");

    // Razorpay order first, so a failed payment provider never leaves an orphan PENDING order.
    // ponytail: if DB insert fails after Razorpay succeeds, the razorpay order self-expires in 15 min (expire_by).
    let razorpayOrderId: string | null = null;
    if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
      const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
      const rpRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
        body: JSON.stringify({
          amount: Math.round(totalAmount * 100),
          currency: "INR",
          receipt: orderNumber,
          notes: { orderNumber },
          expire_by: Math.floor(Date.now() / 1000) + 15 * 60,
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

    const order = await prisma.onlineOrder.create({
      data: {
        orderNumber,
        customerId: session.user.id,
        shippingAddress,
        shippingCity,
        shippingState,
        shippingPincode,
        subtotal,
        totalAmount,
        paymentMode: paymentMode || "prepaid",
        paymentStatus: "PENDING",
        status: "PENDING",
        items: {
          create: orderLines.map((l) => ({
            medicineId: l.med.id,
            quantity: l.q,
            unitPrice: l.med.sellingPrice,
            totalAmount: l.med.sellingPrice * l.q,
          })),
        },
      },
      include: { items: true },
    });

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
