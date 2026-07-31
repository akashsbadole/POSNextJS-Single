import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET() {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const branchFilter = session.user.role !== "OWNER" && session.user.branchId
      ? { branchId: session.user.branchId }
      : {};

    const [
      totalMedicines,
      totalPatients,
      totalSales,
      totalRevenue,
      lowStockCount,
      recentSales,
    ] = await Promise.all([
      prisma.medicine.count({ where: { isActive: true } }),
      prisma.patient.count(), // patients are global — no branchId on Patient
      prisma.sale.count({ where: branchFilter }),
      prisma.sale.aggregate({ where: branchFilter, _sum: { finalAmount: true } }),
      prisma.inventory.count({
        where: { quantity: { lte: 10 }, ...branchFilter },
      }),
      prisma.sale.findMany({
        where: branchFilter,
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          cashier: { select: { name: true } },
          patient: { select: { name: true } },
        },
      }),
    ]);

    const stats = {
      totalMedicines,
      totalPatients,
      totalSales,
      totalRevenue: totalRevenue._sum.finalAmount || 0,
      lowStockCount,
      recentSales,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
