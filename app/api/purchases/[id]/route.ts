import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { postJournal } from "@/lib/accounting";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const action = body.action || "pay";
    if (action !== "pay") return NextResponse.json({ error: "Unknown action" }, { status: 400 });

    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
    }
    if (!["cash", "bank", "upi", "card"].includes(body.mode)) {
      return NextResponse.json({ error: "Invalid payment mode" }, { status: 400 });
    }

    const po = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    if (session.user.branchId && session.user.role !== "OWNER" && po.branchId !== session.user.branchId) {
      return NextResponse.json({ error: "PO belongs to another branch" }, { status: 403 });
    }
    if (po.status !== "RECEIVED") {
      return NextResponse.json({ error: "Only received orders can be paid" }, { status: 400 });
    }

    const payment = await prisma.$transaction(async (tx) => {
      const created = await tx.supplierPayment.create({
        data: {
          supplierId: po.supplierId,
          amount,
          mode: body.mode,
          transactionId: body.transactionId || null,
          notes: body.notes || null,
        },
      });
      // ponytail: cash/upi/card hit Cash in Hand; bank hits Bank. Splitting exact
      // UPI/bank accounts is a chart-of-accounts extension, not a code change.
      await postJournal(tx, {
        memo: `Supplier payment ${po.poNumber} (${created.id})`,
        referenceType: "supplier_pay",
        referenceId: created.id,
        createdById: session.user.id,
        lines: [
          { accountCode: "2010", debit: amount },
          { accountCode: body.mode === "bank" ? "1020" : "1010", credit: amount },
        ],
      });
      return created;
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Error recording supplier payment:", error);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
