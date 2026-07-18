import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [
      totalMedicines,
      totalPatients,
      totalSales,
      totalRevenue,
      lowStockCount,
      recentSales,
    ] = await Promise.all([
      prisma.medicine.count({ where: { isActive: true } }),
      prisma.patient.count(),
      prisma.sale.count(),
      prisma.sale.aggregate({ _sum: { finalAmount: true } }),
      prisma.inventory.count({
        where: { quantity: { lte: 10 } },
      }),
      prisma.sale.findMany({
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
