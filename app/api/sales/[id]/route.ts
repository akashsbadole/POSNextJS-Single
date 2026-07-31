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
    const action = body.action || "settle";

    const sale = await prisma.sale.findUnique({ where: { id } });
    if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    if (session.user.branchId && session.user.role !== "OWNER" && sale.branchId !== session.user.branchId) {
      return NextResponse.json({ error: "Sale belongs to another branch" }, { status: 403 });
    }

    if (action === "settle") {
      if (sale.paymentStatus !== "PENDING") {
        return NextResponse.json({ error: "Sale is not pending payment" }, { status: 400 });
      }
      const updated = await prisma.$transaction(async (tx) => {
        await postJournal(tx, {
          memo: `Settle credit sale ${sale.invoiceNumber}`,
          referenceType: "sale_settle",
          referenceId: id,
          createdById: session.user.id,
          lines: [
            { accountCode: "1010", debit: sale.finalAmount },
            { accountCode: "1100", credit: sale.finalAmount },
          ],
        });
        return [
          await tx.sale.update({ where: { id }, data: { paymentStatus: "PAID" } }),
          await tx.payment.updateMany({ where: { saleId: id }, data: { status: "PAID" } }),
          await tx.auditLog.create({
            data: {
              userId: session.user.id,
              action: "UPDATE",
              entityType: "sale",
              entityId: id,
              newData: JSON.stringify({ paymentStatus: "PAID", action: "settle" }),
            },
          }),
        ];
      });
      return NextResponse.json(updated[0]);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Error settling sale:", error);
    return NextResponse.json({ error: "Failed to update sale" }, { status: 500 });
  }
}
