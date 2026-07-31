import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

// ponytail: registers are rate-wise summaries of existing data (no buyer GSTIN
// captured at POS -> everything reports as B2C). Upgrade path: capture
// patient GSTIN on credit invoices when corporate billing lands.
function rateSummary(items: { gstRate: number; taxable: number; tax: number }[]) {
  const byRate = new Map<number, { rate: number; taxable: number; cgst: number; sgst: number; total: number }>();
  for (const it of items) {
    const r = byRate.get(it.gstRate) || { rate: it.gstRate, taxable: 0, cgst: 0, sgst: 0, total: 0 };
    r.taxable += it.taxable;
    r.cgst += it.tax / 2;
    r.sgst += it.tax / 2;
    r.total += it.taxable + it.tax;
    byRate.set(it.gstRate, r);
  }
  return [...byRate.values()].sort((a, b) => a.rate - b.rate);
}

function csv(rows: (string | number)[][]) {
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
}

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const { searchParams } = new URL(req.url);
    const report = searchParams.get("report") || "gstr1";
    const format = searchParams.get("format") || "json";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const dateRange = startDate && endDate ? { gte: new Date(startDate), lte: new Date(endDate) } : undefined;
    const branchFilter = session.user.branchId && session.user.role !== "OWNER" ? session.user.branchId : undefined;

    if (report === "gstr1") {
      const where: Record<string, unknown> = {};
      if (branchFilter) where.branchId = branchFilter;
      if (dateRange) where.createdAt = dateRange;
      const sales = await prisma.sale.findMany({
        where,
        include: { items: true, branch: { select: { gstin: true, name: true, address: true, state: true } } },
        orderBy: { createdAt: "asc" },
      });
      const items = sales.flatMap((s) =>
        s.items.map((i) => ({
          gstRate: i.gstRate,
          taxable: i.totalAmount - i.cgstAmount - i.sgstAmount,
          tax: i.cgstAmount + i.sgstAmount,
        }))
      );
      const summary = rateSummary(items);
      const branch = sales[0]?.branch || (branchFilter ? await prisma.branch.findUnique({ where: { id: branchFilter } }) : null);
      const invoices = sales.map((s) => ({
        invoiceNumber: s.invoiceNumber,
        date: s.createdAt,
        taxableAmount: s.taxableAmount,
        gst: s.totalGst,
        total: s.finalAmount,
        mode: s.paymentMode,
        status: s.paymentStatus,
      }));
      if (format === "csv") {
        const rows: (string | number)[][] = [
          ["Invoice No", "Date", "Taxable Value", "CGST", "SGST", "Total"],
          ...invoices.map((i) => [i.invoiceNumber, i.date.toISOString(), i.taxableAmount, i.gst / 2, i.gst / 2, i.total]),
          [],
          ["GST Rate %", "Taxable", "CGST", "SGST", "Total"],
          ...summary.map((r) => [r.rate, r.taxable.toFixed(2), r.cgst.toFixed(2), r.sgst.toFixed(2), r.total.toFixed(2)]),
        ];
        return new NextResponse(csv(rows), { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=gstr1.csv" } });
      }
      return NextResponse.json({ branch, summary, invoices, totals: { taxable: summary.reduce((s, r) => s + r.taxable, 0), tax: summary.reduce((s, r) => s + r.cgst + r.sgst, 0) } });
    }

    if (report === "gstr2a") {
      const where: Record<string, unknown> = { status: "RECEIVED" };
      if (branchFilter) where.branchId = branchFilter;
      if (dateRange) where.updatedAt = dateRange;
      const pos = await prisma.purchaseOrder.findMany({
        where,
        include: { items: { include: { medicine: { select: { name: true } } } }, supplier: { select: { name: true, gstin: true } } },
        orderBy: { updatedAt: "asc" },
      });
      const items = pos.flatMap((po) =>
        po.items.map((i) => ({
          gstRate: i.gstRate,
          taxable: i.unitPrice * i.receivedQty,
          tax: (i.unitPrice * i.receivedQty * i.gstRate) / 100,
        }))
      );
      const summary = rateSummary(items);
      const purchases = pos.map((po) => ({
        poNumber: po.poNumber,
        date: po.updatedAt,
        supplier: po.supplier.name,
        gstin: po.supplier.gstin || "",
        taxable: po.items.reduce((s, i) => s + i.unitPrice * i.receivedQty, 0),
      }));
      if (format === "csv") {
        const rows: (string | number)[][] = [
          ["PO No", "Date", "Supplier", "GSTIN", "Taxable"],
          ...purchases.map((p) => [p.poNumber, p.date.toISOString(), p.supplier, p.gstin, p.taxable.toFixed(2)]),
          [],
          ["GST Rate %", "Taxable", "CGST", "SGST", "Total"],
          ...summary.map((r) => [r.rate, r.taxable.toFixed(2), r.cgst.toFixed(2), r.sgst.toFixed(2), r.total.toFixed(2)]),
        ];
        return new NextResponse(csv(rows), { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=gstr2a.csv" } });
      }
      return NextResponse.json({ summary, purchases, totals: { taxable: summary.reduce((s, r) => s + r.taxable, 0), tax: summary.reduce((s, r) => s + r.cgst + r.sgst, 0) } });
    }

    if (report === "licenses") {
      const licenses = await prisma.drugLicense.findMany({
        where: branchFilter && !searchParams.get("all") ? { OR: [{ holderId: branchFilter }, { holderType: "SUPPLIER" }] } : {},
        orderBy: { expiryDate: "asc" },
      });
      const now = Date.now();
      const rows = licenses.map((l) => ({
        ...l,
        daysUntilExpiry: Math.ceil((l.expiryDate.getTime() - now) / 86400000),
        expiringSoon: l.expiryDate.getTime() - now <= 90 * 86400000,
        expired: l.expiryDate.getTime() < now,
      }));
      if (format === "csv") {
        const out: (string | number)[][] = [
          ["License No", "Type", "Holder", "Issuing Authority", "Expiry", "Days Left"],
          ...rows.map((r) => [r.licenseNumber, r.licenseType, r.holderName, r.issuingAuthority || "", r.expiryDate.toISOString(), r.daysUntilExpiry]),
        ];
        return new NextResponse(csv(out), { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=licenses.csv" } });
      }
      return NextResponse.json({ licenses: rows });
    }

    return NextResponse.json({ error: "Unknown report" }, { status: 400 });
  } catch (error) {
    console.error("Error generating compliance report:", error);
    return NextResponse.json({ error: "Failed to generate compliance report" }, { status: 500 });
  }
}
