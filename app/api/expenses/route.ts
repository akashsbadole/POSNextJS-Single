import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { postJournal } from "@/lib/accounting";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    const where: Record<string, unknown> = {};
    if (session.user.branchId && session.user.role !== "OWNER") {
      where.branchId = session.user.branchId;
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    return NextResponse.json({ expenses, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const { category, description, amount, date, paymentMode } = body;
    if (!category || !description || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: "category, description and amount are required" }, { status: 400 });
    }
    const mode = ["cash", "bank", "upi", "card"].includes(paymentMode) ? paymentMode : "cash";

    const expense = await prisma.$transaction(async (tx) => {
      const created = await tx.expense.create({
        data: {
          category,
          description,
          amount: Number(amount),
          date: date ? new Date(date) : new Date(),
          branchId: session.user.branchId,
        },
      });
      await postJournal(tx, {
        memo: `${category}: ${description}`,
        referenceType: "expense",
        referenceId: created.id,
        createdById: session.user.id,
        lines: [
          { accountCode: "6010", debit: Number(amount) },
          { accountCode: mode === "bank" ? "1020" : "1010", credit: Number(amount) },
        ],
      });
      return created;
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
