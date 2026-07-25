import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = {};
    if (startDate && endDate) {
      where.createdAt = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const sales = await prisma.sale.findMany({
      where,
      include: { items: { include: { medicine: true } } },
    });

    let totalRevenue = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalTaxable = 0;
    const monthly: Record<string, { sales: number; orders: number }> = {};
    const medicineAgg: Record<string, { name: string; units: number; revenue: number }> = {};

    for (const s of sales) {
      totalRevenue += s.finalAmount;
      totalCGST += s.cgstAmount;
      totalSGST += s.sgstAmount;
      totalTaxable += s.taxableAmount;

      const key = monthKey(new Date(s.createdAt));
      if (!monthly[key]) monthly[key] = { sales: 0, orders: 0 };
      monthly[key].sales += s.finalAmount;
      monthly[key].orders += 1;

      for (const item of s.items) {
        const id = item.medicineId;
        if (!medicineAgg[id]) {
          medicineAgg[id] = { name: item.medicine?.name || "Unknown", units: 0, revenue: 0 };
        }
        medicineAgg[id].units += item.quantity;
        medicineAgg[id].revenue += item.totalAmount;
      }
    }

    const trend = Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, sales: Math.round(v.sales), orders: v.orders }));

    const topMedicines = Object.values(medicineAgg)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const totalOrders = sales.length;
    const avgOrderValue = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;

    return NextResponse.json({
      kpis: {
        totalRevenue: Math.round(totalRevenue),
        totalOrders,
        avgOrderValue,
        totalCGST: Math.round(totalCGST),
        totalSGST: Math.round(totalSGST),
        totalGST: Math.round(totalCGST + totalSGST),
        totalTaxable: Math.round(totalTaxable),
      },
      trend,
      topMedicines,
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
