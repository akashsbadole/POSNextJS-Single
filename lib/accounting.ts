import { prisma } from "@/lib/db";
import { generateInvoiceNumber } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

export const CHART: { code: string; name: string; type: string }[] = [
  { code: "1010", name: "Cash in Hand", type: "ASSET" },
  { code: "1020", name: "Bank", type: "ASSET" },
  { code: "1100", name: "Accounts Receivable", type: "ASSET" },
  { code: "1200", name: "Inventory", type: "ASSET" },
  { code: "2040", name: "Input CGST", type: "ASSET" },
  { code: "2050", name: "Input SGST", type: "ASSET" },
  { code: "2010", name: "Accounts Payable", type: "LIABILITY" },
  { code: "2020", name: "CGST Payable", type: "LIABILITY" },
  { code: "2030", name: "SGST Payable", type: "LIABILITY" },
  { code: "2090", name: "Rounding Off", type: "LIABILITY" },
  { code: "3010", name: "Owner's Capital", type: "EQUITY" },
  { code: "4010", name: "Sales Revenue", type: "REVENUE" },
  { code: "4020", name: "Sales Returns", type: "REVENUE" },
  { code: "5010", name: "Cost of Goods Sold", type: "EXPENSE" },
  { code: "6010", name: "Operating Expenses", type: "EXPENSE" },
];

export async function ensureChartOfAccounts(tx: Prisma.TransactionClient) {
  for (const a of CHART) {
    await tx.ledgerAccount.upsert({ where: { code: a.code }, update: {}, create: a });
  }
}

export type JournalLineInput = { accountCode: string; debit?: number; credit?: number; memo?: string };

// ponytail: referenceType+referenceId makes posting idempotent — reruns of the same
// business flow (e.g. webhook retry) skip instead of double-posting. Ceiling: a
// manual correction of a posted document needs a reversing entry, not an edit.
export async function postJournal(
  tx: Prisma.TransactionClient,
  opts: {
    date?: Date;
    memo: string;
    referenceType?: string;
    referenceId?: string;
    createdById?: string;
    lines: JournalLineInput[];
  }
): Promise<Prisma.JournalEntryGetPayload<{}>> {
  await ensureChartOfAccounts(tx);
  if (opts.referenceType && opts.referenceId) {
    const existing = await tx.journalEntry.findUnique({
      where: { referenceType_referenceId: { referenceType: opts.referenceType, referenceId: opts.referenceId } },
    });
    if (existing) return existing;
  }

  const lines: { accountId: string; debit: number; credit: number; memo?: string }[] = [];
  for (const l of opts.lines) {
    const account = await tx.ledgerAccount.findUnique({ where: { code: l.accountCode } });
    if (!account) throw new Error(`Unknown account code: ${l.accountCode}`);
    lines.push({
      accountId: account.id,
      debit: Math.round((l.debit || 0) * 100) / 100,
      credit: Math.round((l.credit || 0) * 100) / 100,
      memo: l.memo,
    });
  }

  const debits = lines.reduce((s, l) => s + l.debit, 0);
  const credits = lines.reduce((s, l) => s + l.credit, 0);
  if (Math.abs(debits - credits) > 0.01) {
    throw new Error(`Unbalanced journal entry: debits ${debits} != credits ${credits}`);
  }

  return tx.journalEntry.create({
    data: {
      entryNumber: await generateInvoiceNumber("JRN"),
      date: opts.date || new Date(),
      memo: opts.memo,
      referenceType: opts.referenceType,
      referenceId: opts.referenceId,
      createdById: opts.createdById,
      lines: { create: lines },
    },
  });
}
