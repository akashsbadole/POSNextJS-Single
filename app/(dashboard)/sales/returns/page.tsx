"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2, Undo2, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface SaleReturn {
  id: string; returnNumber: string; reason: string;
  refundAmount: number; refundMode: string; status: string;
  createdAt: string;
  sale: { invoiceNumber: string };
}

interface SaleItem { medicineId: string; medicine: { name: string }; quantity: number; }

interface Sale {
  id: string; invoiceNumber: string; branchId: string;
  items: SaleItem[];
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState<SaleReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modal, setModal] = useState<{ sales: Sale[]; saleId: string; quantities: Record<string, number>; reason: string; refundMode: string; saving: boolean } | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/sales/returns?page=${page}&limit=20`)
      .then((r) => r.json())
      .then((d) => { setReturns(d.returns); setTotalPages(d.pagination.totalPages); })
      .catch(() => toast.error("Failed to load returns"))
      .finally(() => setLoading(false));
  }, [page]);

  const statusVariant: Record<string, "warning" | "success" | "destructive"> = {
    PENDING: "warning", APPROVED: "success", REJECTED: "destructive",
  };

  const openModal = async () => {
    try {
      const res = await fetch("/api/sales?limit=100");
      const d = await res.json();
      const sales: Sale[] = (d.sales || []).filter((s: Sale) => s.items.length > 0);
      if (sales.length === 0) { toast.error("No sales available to return"); return; }
      const saleId = sales[0].id;
      setModal({ sales, saleId, quantities: {}, reason: "", refundMode: "CASH", saving: false });
    } catch { toast.error("Failed to load sales"); }
  };

  const handleCreate = async () => {
    if (!modal) return;
    const selected = modal.sales.find((s) => s.id === modal.saleId)!;
    const items = selected.items
      .map((it) => ({ medicineId: it.medicineId, quantity: modal.quantities[it.medicineId] || 0 }))
      .filter((i) => i.quantity > 0);
    if (items.length === 0) { toast.error("Select at least one item to return"); return; }
    setModal({ ...modal, saving: true });
    try {
      const res = await fetch("/api/sales/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saleId: selected.id, branchId: selected.branchId, items, reason: modal.reason, refundMode: modal.refundMode }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to create return"); }
      toast.success("Return created");
      setModal(null);
      fetch(`/api/sales/returns?page=${page}&limit=20`)
        .then((r) => r.json())
        .then((d) => setReturns(d.returns))
        .catch(() => {});
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to create return"); }
    finally { if (modal) setModal({ ...modal, saving: false }); }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales Returns</h1>
          <p className="text-gray-500">Manage returned items and refunds</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/sales/invoices"><ArrowLeft className="w-4 h-4 mr-1" />Invoices</Link>
          </Button>
          <Button size="sm" onClick={openModal}><Undo2 className="w-4 h-4 mr-2" />New Return</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Return Requests</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" /></div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Return #</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Refund</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returns.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.returnNumber}</TableCell>
                      <TableCell className="font-mono text-xs">{r.sale.invoiceNumber}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{r.reason}</TableCell>
                      <TableCell className="font-medium">₹{r.refundAmount.toFixed(2)}</TableCell>
                      <TableCell className="capitalize">{r.refundMode}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[r.status] || "secondary"}>{r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{new Date(r.createdAt).toLocaleDateString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                  {returns.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No returns found</TableCell></TableRow>
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

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => !modal.saving && setModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">New Return</h3>
            <div className="space-y-1">
              <label className="text-sm font-medium">Invoice</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={modal.saleId}
                onChange={(e) => setModal({ ...modal, saleId: e.target.value, quantities: {} })}
              >
                {modal.sales.map((s) => <option key={s.id} value={s.id}>{s.invoiceNumber}</option>)}
              </select>
            </div>
            {(() => {
              const selected = modal.sales.find((s) => s.id === modal.saleId)!;
              return (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selected.items.map((it) => (
                    <div key={it.medicineId} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex-1">{it.medicine.name} <span className="text-gray-500">(sold: {it.quantity})</span></span>
                      <Input
                        type="number"
                        min={0}
                        max={it.quantity}
                        className="w-20"
                        value={modal.quantities[it.medicineId] || 0}
                        onChange={(e) => setModal({ ...modal, quantities: { ...modal.quantities, [it.medicineId]: Math.max(0, Math.min(it.quantity, parseInt(e.target.value || "0"))) } })}
                      />
                    </div>
                  ))}
                </div>
              );
            })()}
            <div className="space-y-1">
              <label className="text-sm font-medium">Reason</label>
              <Input value={modal.reason} onChange={(e) => setModal({ ...modal, reason: e.target.value })} placeholder="e.g. Damaged, wrong item..." />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Refund Mode</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={modal.refundMode}
                onChange={(e) => setModal({ ...modal, refundMode: e.target.value })}
              >
                {["CASH", "UPI", "CARD", "BANK_TRANSFER"].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setModal(null)} disabled={modal.saving}>Cancel</Button>
              <Button onClick={handleCreate} disabled={modal.saving}>{modal.saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}Create Return</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
