"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface PurchaseOrder {
  id: string; poNumber: string; status: string; totalAmount: number; subtotal: number;
  createdAt: string;
  supplier: { name: string };
}

export default function PaymentsPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    load();
  }, [page]);

  const load = () => {
    fetch(`/api/purchases?page=${page}&limit=20`)
      .then((r) => r.json())
      .then((d) => { setOrders(d.orders); setTotalPages(d.pagination.totalPages); })
      .catch(() => toast.error("Failed to load payments"))
      .finally(() => setLoading(false));
  };

  const totalPayable = orders.reduce((s, o) => s + o.totalAmount, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Supplier Payments</h1>
        <p className="text-gray-500">Track payments to suppliers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Total Payable</p>
            <p className="text-2xl font-bold">₹{totalPayable.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Pending Orders</p>
            <p className="text-2xl font-bold">{orders.filter((o) => o.status !== "RECEIVED").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold">{orders.filter((o) => o.status === "RECEIVED").length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" /></div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.poNumber}</TableCell>
                      <TableCell>{o.supplier.name}</TableCell>
                      <TableCell className="font-medium">₹{o.totalAmount.toLocaleString("en-IN")}</TableCell>
                      <TableCell>
                        <Badge variant={o.status === "RECEIVED" ? "success" : o.status === "APPROVED" ? "warning" : "secondary"}>
                          {o.status === "RECEIVED" ? "Paid" : o.status === "APPROVED" ? "Pending" : o.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{new Date(o.createdAt).toLocaleDateString("en-IN")}</TableCell>
                      <TableCell>
                        <RecordPaymentButton poId={o.id} amount={o.totalAmount} disabled={o.status !== "RECEIVED"} onPaid={load} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {orders.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No payments found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RecordPaymentButton({ poId, amount, disabled, onPaid }: { poId: string; amount: number; disabled: boolean; onPaid: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ amount: String(amount), mode: "cash", transactionId: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const pay = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/purchases/${poId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pay", amount: Number(form.amount), mode: form.mode, transactionId: form.transactionId || undefined, notes: form.notes || undefined }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to record payment");
      toast.success("Payment recorded");
      setOpen(false);
      onPaid();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to record payment"); }
    finally { setSaving(false); }
  };

  return (
    <>
      <Button size="sm" variant="outline" disabled={disabled} onClick={() => setOpen(true)}>Record Payment</Button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setOpen(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Record Payment</h3>
            <Input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
            </select>
            <Input placeholder="Transaction ID (optional)" value={form.transactionId} onChange={(e) => setForm({ ...form, transactionId: e.target.value })} />
            <Input placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={pay} disabled={saving || Number(form.amount) <= 0}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}Record</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
