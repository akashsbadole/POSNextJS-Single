import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const saleId = (await params).id;
    const sale = await prisma.sale.findUnique({ where: { id: saleId } });
    if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    if (sale.eInvoiceId) return NextResponse.json({ error: "E-invoice already generated" }, { status: 400 });

    const eInvoiceId = `EI-STUB-${Date.now()}`;
    const updated = await prisma.sale.update({
      where: { id: saleId },
      data: { eInvoiceId },
    });

    await prisma.auditLog.create({
      data: {
        userId: sale.cashierId,
        action: "E_INVOICE_STUB",
        entityType: "sale",
        entityId: sale.invoiceNumber,
        newData: JSON.stringify({ eInvoiceId }),
      },
    });

    return NextResponse.json({ ...updated, eInvoiceId });
  } catch (error) {
    console.error("Error generating e-invoice stub:", error);
    return NextResponse.json({ error: "Failed to generate e-invoice" }, { status: 500 });
  }
}
