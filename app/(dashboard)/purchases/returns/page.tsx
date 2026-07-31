"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, ChevronLeft, ChevronRight, ArrowUpLeft } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface PO {
  id: string; poNumber: string; status: string; supplier: { name: string };
  items: { medicineId: string; medicine: { name: string }; quantity: number; receivedQty: number; unitPrice: number }[];
}

interface PurchaseReturn {
  id: string; returnNumber: string; reason: string | null; status: string;
  totalAmount: number; createdAt: string;
  po: { poNumber: string } | null; supplier: { name: string };
  items: { quantity: number; medicine: { name: string } }[];
}

export default function PurchaseReturnsPage() {
  const { data: session } = useSession();
  const branchId = session?.user?.branchId;
  const [returns, setReturns] = useState<PurchaseReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [orders, setOrders] = useState<PO[]>([]);
  const [modal, setModal] = useState<{ poId: string; quantities: Record<string, number>; reason: string; saving: boolean } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/purchases/returns?page=${page}&limit=20`);
      const d = await r.json();
      setReturns(d.returns || []);
      setTotalPages(d.pagination?.totalPages || 1);
    } catch { toast.error("Failed to load returns"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  const openModal = async () => {
    try {
      const r = await fetch("/api/purchases?limit=100");
      const d = await r.json();
      setOrders((d.orders || []).filter((o: PO) => o.status !== "DRAFT"));
      setModal({ poId: "", quantities: {}, reason: "", saving: false });
    } catch { toast.error("Failed to load purchase orders"); }
  };

  const selectedPO = orders.find((o) => o.id === modal?.poId);

  const handleCreate = async () => {
    if (!modal || !modal.poId) { toast.error("Select a purchase order"); return; }
    const items = Object.entries(modal.quantities)
      .map(([medicineId, quantity]) => ({ medicineId, quantity: Number(quantity) }))
      .filter((i) => i.quantity > 0);
    if (items.length === 0) { toast.error("Enter at least one item quantity"); return; }
    setModal({ ...modal, saving: true });
    try {
      const res = await fetch("/api/purchases/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId, poId: modal.poId, reason: modal.reason, items }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to create return");
      toast.success("Purchase return created");
      setModal(null);
      load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to create return"); }
    finally { if (modal) setModal({ ...modal, saving: false }); }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Purchase Returns</h1>
          <p className="text-gray-500">Return stock to suppliers</p>
        </div>
        <Button onClick={openModal}><Plus className="w-4 h-4 mr-2" />New Return</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Returns</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" /></div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Return #</TableHead>
                    <TableHead>PO</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returns.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs font-medium">{r.returnNumber}</TableCell>
                      <TableCell className="font-mono text-xs">{r.po?.poNumber || "—"}</TableCell>
                      <TableCell>{r.supplier.name}</TableCell>
                      <TableCell>{r.items.reduce((s, i) => s + i.quantity, 0)} units</TableCell>
                      <TableCell className="font-medium">₹{r.totalAmount.toLocaleString("en-IN")}</TableCell>
                      <TableCell><Badge variant="success">{r.status}</Badge></TableCell>
                      <TableCell className="text-xs">{new Date(r.createdAt).toLocaleDateString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                  {returns.length === 0 && (<TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No purchase returns found</TableCell></TableRow>)}
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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg space-y-4 max-h-screen overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold flex items-center gap-2"><ArrowUpLeft className="w-5 h-5 text-pharmacy-500" />New Purchase Return</h3>
            <div>
              <label className="text-sm font-medium block mb-1">Purchase Order</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={modal.poId}
                onChange={(e) => setModal({ ...modal, poId: e.target.value, quantities: {} })}
              >
                <option value="">Select PO...</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>{o.poNumber} — {o.supplier.name} ({o.status})</option>
                ))}
              </select>
            </div>
            {selectedPO && (
              <div className="space-y-3">
                <p className="text-sm font-medium">Items</p>
                {selectedPO.items.filter((it) => it.receivedQty > 0).map((it) => (
                  <div key={it.medicineId} className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm">{it.medicine.name}</p>
                      <p className="text-xs text-gray-500">Received: {it.receivedQty} × ₹{it.unitPrice}</p>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={it.receivedQty}
                      placeholder="0"
                      className="w-24"
                      value={modal.quantities[it.medicineId] ?? ""}
                      onChange={(e) => setModal({ ...modal, quantities: { ...modal.quantities, [it.medicineId]: Math.min(it.receivedQty, Math.max(0, Number(e.target.value) || 0)) } })}
                    />
                  </div>
                ))}
                <div>
                  <label className="text-sm font-medium block mb-1">Reason</label>
                  <Input value={modal.reason} onChange={(e) => setModal({ ...modal, reason: e.target.value })} placeholder="e.g. Damaged goods, wrong expiry..." />
                </div>
              </div>
            )}
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={modal.saving || !modal.poId}>{modal.saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}Create Return</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
