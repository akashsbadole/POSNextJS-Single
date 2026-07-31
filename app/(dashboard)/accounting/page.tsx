"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

type Tab = "trial-balance" | "profit-loss" | "balance-sheet" | "ledger";

export default function AccountingPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<Tab>("trial-balance");
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ report: tab });
      if (tab === "ledger" && account) params.set("account", account);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const r = await fetch(`/api/accounting?${params}`);
      const d = await r.json();
      setData(d);
    } finally { setLoading(false); }
  }, [tab, account, startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  const isOwner = session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";

  const trialBalance = data as { accounts: { code: string; name: string; type: string; debit: number; credit: number }[] } | null;
  const pnl = data as { revenue: number; cogs: number; grossProfit: number; operatingExpenses: number; otherIncome: number; netProfit: number } | null;
  const bs = data as { assets: number; liabilities: number; equity: number; retainedEarnings: number; balanced: boolean } | null;
  const ledger = data as { account: { code: string; name: string }; closingBalance: number; rows: { entryNumber: string; date: string; memo: string; debit: number; credit: number; balance: number }[] } | null;

  const tabs: { key: Tab; label: string }[] = [
    { key: "trial-balance", label: "Trial Balance" },
    { key: "profit-loss", label: "Profit & Loss" },
    { key: "balance-sheet", label: "Balance Sheet" },
    { key: "ledger", label: "Ledger" },
  ];

  const totalDebit = trialBalance?.accounts.reduce((s, a) => s + a.debit, 0) ?? 0;
  const totalCredit = trialBalance?.accounts.reduce((s, a) => s + a.credit, 0) ?? 0;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Accounting</h1>
        <p className="text-gray-500">Double-entry ledger, auto-posted from sales, purchases, returns and expenses</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Button key={t.key} variant={tab === t.key ? "default" : "outline"} size="sm" onClick={() => { setTab(t.key); setAccount(""); }}>
            {t.label}
          </Button>
        ))}
      </div>

      {tab === "ledger" && (
        <Card>
          <CardContent className="p-4 flex flex-wrap gap-2 items-end">
            <div>
              <label className="text-sm font-medium block mb-1">Account</label>
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={account} onChange={(e) => setAccount(e.target.value)}>
                <option value="">Select account...</option>
                {trialBalance?.accounts.map((a) => (
                  <option key={a.code} value={a.code}>{a.code} — {a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">From</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">To</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <Button onClick={load}>Apply</Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" /></div>
      ) : (
        <>
          {tab === "trial-balance" && trialBalance && (
            <Card>
              <CardHeader><CardTitle>Trial Balance</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead><TableHead>Account</TableHead><TableHead>Type</TableHead>
                      <TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trialBalance.accounts.filter((a) => a.debit !== 0 || a.credit !== 0).map((a) => (
                      <TableRow key={a.code}>
                        <TableCell className="font-mono text-xs">{a.code}</TableCell>
                        <TableCell>{a.name}</TableCell>
                        <TableCell><span className="text-xs text-gray-500">{a.type}</span></TableCell>
                        <TableCell className="text-right">{a.debit ? `₹${a.debit.toLocaleString("en-IN")}` : ""}</TableCell>
                        <TableCell className="text-right">{a.credit ? `₹${a.credit.toLocaleString("en-IN")}` : ""}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-semibold">
                      <TableCell colSpan={3}>Total</TableCell>
                      <TableCell className="text-right">₹{totalDebit.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right">₹{totalCredit.toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {tab === "profit-loss" && pnl && (
            <Card>
              <CardHeader><CardTitle>Profit & Loss</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-w-lg">
                {[
                  ["Sales Revenue", pnl.revenue],
                  ["Cost of Goods Sold", pnl.cogs],
                  ["Gross Profit", pnl.grossProfit],
                  ["Operating Expenses", pnl.operatingExpenses],
                  ["Other Income (Rounding)", pnl.otherIncome],
                  ["Net Profit", pnl.netProfit],
                ].map(([label, value]) => (
                  <div key={label as string} className={`flex justify-between py-1 border-b ${label === "Net Profit" ? "font-bold text-base" : ""}`}>
                    <span>{label}</span>
                    <span>₹{(value as number).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {tab === "balance-sheet" && bs && (
            <Card>
              <CardHeader><CardTitle>Balance Sheet</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-w-lg">
                {[
                  ["Total Assets", bs.assets],
                  ["Total Liabilities", bs.liabilities],
                  ["Owner's Equity", bs.equity],
                  ["(Retained Earnings)", bs.retainedEarnings],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex justify-between py-1 border-b">
                    <span>{label}</span>
                    <span>₹{(value as number).toLocaleString("en-IN")}</span>
                  </div>
                ))}
                <div className="flex justify-between py-1 font-bold">
                  <span>Balanced</span>
                  <span className={bs.balanced ? "text-green-600" : "text-red-600"}>{bs.balanced ? "Yes" : "No"}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {tab === "ledger" && ledger && (
            <Card>
              <CardHeader><CardTitle>{ledger.account.code} — {ledger.account.name} <span className="text-sm font-normal text-gray-500">Closing: ₹{ledger.closingBalance.toLocaleString("en-IN")}</span></CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entry</TableHead><TableHead>Date</TableHead><TableHead>Memo</TableHead>
                      <TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead><TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledger.rows.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{r.entryNumber}</TableCell>
                        <TableCell className="text-xs">{new Date(r.date).toLocaleDateString("en-IN")}</TableCell>
                        <TableCell className="text-xs">{r.memo}</TableCell>
                        <TableCell className="text-right">{r.debit ? `₹${r.debit.toLocaleString("en-IN")}` : ""}</TableCell>
                        <TableCell className="text-right">{r.credit ? `₹${r.credit.toLocaleString("en-IN")}` : ""}</TableCell>
                        <TableCell className="text-right font-medium">₹{r.balance.toLocaleString("en-IN")}</TableCell>
                      </TableRow>
                    ))}
                    {ledger.rows.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No entries for this account{account ? "" : " — select an account above"}</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {isOwner && (
        <Card className="max-w-lg">
          <CardHeader><CardTitle>Manual Journal Entry</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-gray-500">For adjustments the automated flows can't make (capital, loans, corrections). Debits must equal credits.</p>
            <ManualJournalForm onPosted={load} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ManualJournalForm({ onPosted }: { onPosted: () => void }) {
  const [date, setDate] = useState("");
  const [memo, setMemo] = useState("");
  const [lines, setLines] = useState([{ accountCode: "", debit: "", credit: "" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const post = async () => {
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/accounting/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: date || undefined,
          memo,
          lines: lines.map((l) => ({
            accountCode: l.accountCode,
            debit: Number(l.debit) || 0,
            credit: Number(l.credit) || 0,
          })),
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to post entry");
      setMemo(""); setLines([{ accountCode: "", debit: "", credit: "" }]);
      onPosted();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to post entry"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-2">
      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <Input placeholder="Memo (e.g. Owner capital infusion)" value={memo} onChange={(e) => setMemo(e.target.value)} />
      {lines.map((l, i) => (
        <div key={i} className="flex gap-2">
          <Input placeholder="Account code (e.g. 1010)" className="w-36 font-mono" value={l.accountCode} onChange={(e) => {
            const next = [...lines]; next[i] = { ...next[i], accountCode: e.target.value }; setLines(next);
          }} />
          <Input placeholder="Debit" type="number" className="w-28" value={l.debit} onChange={(e) => {
            const next = [...lines]; next[i] = { ...next[i], debit: e.target.value }; setLines(next);
          }} />
          <Input placeholder="Credit" type="number" className="w-28" value={l.credit} onChange={(e) => {
            const next = [...lines]; next[i] = { ...next[i], credit: e.target.value }; setLines(next);
          }} />
          <Button variant="ghost" size="sm" onClick={() => setLines(lines.filter((_, j) => j !== i))}>×</Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => setLines([...lines, { accountCode: "", debit: "", credit: "" }])}>+ Add line</Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button onClick={post} disabled={saving || !memo}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}Post Entry</Button>
    </div>
  );
}
