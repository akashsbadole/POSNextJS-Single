import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { postJournal } from "@/lib/accounting";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only owners and admins can post journal entries" }, { status: 403 });
    }
    const body = await req.json();
    const { date, memo, lines } = body;
    if (!memo || !Array.isArray(lines) || lines.length < 2) {
      return NextResponse.json({ error: "memo and at least two lines are required" }, { status: 400 });
    }
    const entry = await prisma.$transaction(async (tx) => {
      return postJournal(tx, {
        date: date ? new Date(date) : new Date(),
        memo,
        createdById: session.user.id,
        lines: lines.map((l: { accountCode: string; debit?: number; credit?: number }) => ({
          accountCode: l.accountCode,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
        })),
      });
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to post journal entry";
    const status = message.startsWith("Unknown account") || message.startsWith("Unbalanced") ? 400 : 500;
    if (status === 500) console.error("Error posting journal entry:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
