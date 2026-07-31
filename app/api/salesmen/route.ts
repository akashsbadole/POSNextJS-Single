import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const salesmen = await prisma.salesman.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: "asc" },
    });

    const withTotals = await Promise.all(salesmen.map(async (s) => {
      const agg = await prisma.sale.aggregate({
        where: {
          salesmanId: s.id,
          paymentStatus: "PAID",
          ...(session.user.branchId && session.user.role !== "OWNER" ? { branchId: session.user.branchId } : {}),
        },
        _sum: { finalAmount: true },
        _count: true,
      });
      const salesValue = agg._sum.finalAmount || 0;
      return {
        ...s,
        salesCount: agg._count,
        salesValue: Math.round(salesValue * 100) / 100,
        commissionEarned: Math.round((salesValue * s.commissionRate) / 100 * 100) / 100,
      };
    }));

    return NextResponse.json({ salesmen: withTotals });
  } catch (error) {
    console.error("Error fetching salesmen:", error);
    return NextResponse.json({ error: "Failed to fetch salesmen" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    if (session.user.role === "CASHIER") {
      return NextResponse.json({ error: "Cashiers cannot manage salesmen" }, { status: 403 });
    }
    const body = await req.json();
    const { name, phone, commissionRate } = body;
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const rate = Number(commissionRate) || 0;
    if (rate < 0 || rate > 100) {
      return NextResponse.json({ error: "Commission rate must be between 0 and 100" }, { status: 400 });
    }
    const salesman = await prisma.salesman.create({
      data: { name: name.trim(), phone: phone || null, commissionRate: rate },
    });
    return NextResponse.json(salesman, { status: 201 });
  } catch (error) {
    console.error("Error creating salesman:", error);
    return NextResponse.json({ error: "Failed to create salesman" }, { status: 500 });
  }
}
