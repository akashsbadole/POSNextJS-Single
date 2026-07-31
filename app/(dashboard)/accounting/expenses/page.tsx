"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, ChevronLeft, ChevronRight, Wallet } from "lucide-react";
import { toast } from "sonner";

interface Expense {
  id: string; category: string; description: string; amount: number; date: string; paymentMode?: string;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ category: "", description: "", amount: "", date: "", paymentMode: "cash" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/expenses?page=${page}&limit=20`);
      const d = await r.json();
      setExpenses(d.expenses || []);
      setTotalPages(d.pagination?.totalPages || 1);
    } catch { toast.error("Failed to load expenses"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  const create = async () => {
    if (!form.category || !form.description || Number(form.amount) <= 0) {
      toast.error("Category, description and amount are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount), date: form.date || undefined }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to create expense");
      toast.success("Expense recorded");
      setModal(false);
      setForm({ category: "", description: "", amount: "", date: "", paymentMode: "cash" });
      load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to create expense"); }
    finally { setSaving(false); }
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-gray-500">Recorded to Operating Expenses in the ledger</p>
        </div>
        <Button onClick={() => setModal(true)}><Plus className="w-4 h-4 mr-2" />Add Expense</Button>
      </div>

      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <Wallet className="w-8 h-8 text-pharmacy-500" />
          <div>
            <p className="text-sm text-gray-500">This page total</p>
            <p className="text-2xl font-bold">₹{total.toLocaleString("en-IN")}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>History</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" /></div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead><TableHead>Category</TableHead><TableHead>Description</TableHead>
                    <TableHead>Paid Via</TableHead><TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs">{new Date(e.date).toLocaleDateString("en-IN")}</TableCell>
                      <TableCell><span className="text-xs font-medium bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{e.category}</span></TableCell>
                      <TableCell className="text-sm">{e.description}</TableCell>
                      <TableCell className="text-xs capitalize">{e.paymentMode || "cash"}</TableCell>
                      <TableCell className="text-right font-medium">₹{e.amount.toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                  {expenses.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No expenses recorded yet</TableCell></TableRow>}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Add Expense</h3>
            <Input placeholder="Category (e.g. Rent, Electricity, Salary)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Input placeholder="Amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={form.paymentMode}
              onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
            </select>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setModal(false)}>Cancel</Button>
              <Button onClick={create} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
