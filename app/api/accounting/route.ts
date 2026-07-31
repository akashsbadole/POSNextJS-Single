import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { postJournal } from "@/lib/accounting";
import { requireAuth, unauthorized } from "@/lib/api-auth";

const REVENUE = ["4010", "4020"];
const EXPENSE = ["5010", "6010"];
const ASSET = ["1010", "1020", "1100", "1200", "2040", "2050"];
const LIABILITY = ["2010", "2020", "2030", "2090"];

async function balancesByCode(where: Record<string, unknown> = {}) {
  const rows = await prisma.journalLine.groupBy({
    by: ["accountId"],
    where,
    _sum: { debit: true, credit: true },
  });
  const accounts = await prisma.ledgerAccount.findMany();
  const byId = new Map(accounts.map((a) => [a.id, a]));
  return rows.map((r) => {
    const acc = byId.get(r.accountId)!;
    return {
      code: acc.code,
      name: acc.name,
      type: acc.type,
      debit: (r._sum.debit || 0) - (r._sum.credit || 0),
    };
  });
}

// debit-positive convention; assets/expenses DR, liabilities/equity/revenue CR
export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const { searchParams } = new URL(req.url);
    const report = searchParams.get("report") || "trial-balance";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (report === "ledger") {
      const accountCode = searchParams.get("account");
      if (!accountCode) return NextResponse.json({ error: "account code required" }, { status: 400 });
      const account = await prisma.ledgerAccount.findUnique({ where: { code: accountCode } });
      if (!account) return NextResponse.json({ error: "Unknown account" }, { status: 404 });
      const where: Record<string, unknown> = { account: { code: accountCode } };
      if (startDate && endDate) where.journal = { date: { gte: new Date(startDate), lte: new Date(endDate) } };
      const lines = await prisma.journalLine.findMany({
        where,
        include: { journal: { select: { entryNumber: true, date: true, memo: true } } },
        orderBy: { journal: { date: "asc" } },
      });
      let running = 0;
      const rows = lines.map((l) => {
        running += l.debit - l.credit;
        return {
          entryNumber: l.journal.entryNumber,
          date: l.journal.date,
          memo: l.journal.memo,
          debit: l.debit,
          credit: l.credit,
          balance: Math.round(running * 100) / 100,
        };
      });
      return NextResponse.json({ account, rows, closingBalance: rows.length ? rows[rows.length - 1].balance : 0 });
    }

    const dateFilter: Record<string, unknown> = {};
    if (startDate && endDate) dateFilter.journal = { date: { gte: new Date(startDate), lte: new Date(endDate) } };
    const balances = await balancesByCode(dateFilter);
    const byCode = (codes: string[]) => balances.filter((b) => codes.includes(b.code));

    if (report === "profit-loss") {
      const revenue = byCode(REVENUE).reduce((s, b) => s + b.debit, 0); // 4010 - 4020
      const cogs = byCode(["5010"]).reduce((s, b) => s - b.debit, 0); // CR 5010 reverses
      const opex = byCode(["6010"]).reduce((s, b) => s - b.debit, 0);
      const rounding = byCode(["2090"]).reduce((s, b) => s - b.debit, 0);
      return NextResponse.json({
        revenue: Math.round(revenue * 100) / 100,
        cogs: Math.round(cogs * 100) / 100,
        grossProfit: Math.round((revenue + cogs) * 100) / 100,
        operatingExpenses: Math.round(opex * 100) / 100,
        otherIncome: Math.round(rounding * 100) / 100,
        netProfit: Math.round((revenue + cogs + opex + rounding) * 100) / 100,
      });
    }

    if (report === "balance-sheet") {
      const allTime = await balancesByCode();
      const assets = allTime.filter((b) => ASSET.includes(b.code)).reduce((s, b) => s + b.debit, 0);
      const liabilities = allTime.filter((b) => LIABILITY.includes(b.code)).reduce((s, b) => s - b.debit, 0);
      const capital = allTime.filter((b) => b.code === "3010").reduce((s, b) => s - b.debit, 0);
      const retained = (await GET_pl_alltime());
      const equity = capital + retained;
      return NextResponse.json({
        assets: Math.round(assets * 100) / 100,
        liabilities: Math.round(liabilities * 100) / 100,
        equity: Math.round(equity * 100) / 100,
        retainedEarnings: Math.round(retained * 100) / 100,
        balanced: Math.abs(assets - liabilities - equity) < 0.02,
      });
    }

    return NextResponse.json({ accounts: balances.map((b) => ({ ...b, credit: -b.debit })) });
  } catch (error) {
    console.error("Error generating accounting report:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}

async function GET_pl_alltime() {
  const balances = await balancesByCode();
  const revenue = balances.filter((b) => REVENUE.includes(b.code)).reduce((s, b) => s + b.debit, 0);
  const costs = balances.filter((b) => EXPENSE.includes(b.code)).reduce((s, b) => s - b.debit, 0);
  const rounding = balances.filter((b) => b.code === "2090").reduce((s, b) => s - b.debit, 0);
  return revenue + costs + rounding;
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ error: "Use /api/accounting/journal for manual entries" }, { status: 400 });
}
