"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, ChevronLeft, ChevronRight, Truck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface PurchaseOrder {
  id: string; poNumber: string; status: string; subtotal: number; totalAmount: number;
  createdAt: string; expectedDeliveryDate: string | null;
  supplier: { name: string };
  branch: { name: string };
  createdBy: { name: string };
  items: { quantity: number; medicine: { name: string } }[];
}

interface Supplier { id: string; name: string; }
interface Medicine { id: string; name: string; purchasePrice: number; gstRate: number; }

const statusVariant: Record<string, "secondary" | "warning" | "success" | "destructive"> = {
  DRAFT: "secondary", PENDING: "warning", APPROVED: "success", RECEIVED: "success", CANCELLED: "destructive",
};

export default function PurchaseOrdersPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([{ medicineId: "", quantity: 1, unitPrice: 0, gstRate: 5 }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/purchases?page=${page}&limit=20`)
      .then((r) => r.json())
      .then((d) => { setOrders(d.orders); setTotalPages(d.pagination.totalPages); })
      .catch(() => toast.error("Failed to load purchase orders"))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    if (showForm) {
      Promise.all([
        fetch("/api/suppliers").then((r) => r.json()),
        fetch("/api/medicines?limit=200").then((r) => r.json()),
      ]).then(([sd, md]) => {
        setSuppliers(sd || []);
        setMedicines(md.medicines || []);
      }).catch(() => {});
    }
  }, [showForm]);

  const addItem = () => setItems([...items, { medicineId: "", quantity: 1, unitPrice: 0, gstRate: 5 }]);
  const removeItem = (i: number) => items.length > 1 && setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string | number) => {
    const next = [...items];
    (next[i] as Record<string, unknown>)[field] = value;
    if (field === "medicineId") {
      const med = medicines.find((m) => m.id === value);
      if (med) { next[i].unitPrice = med.purchasePrice; next[i].gstRate = med.gstRate; }
    }
    setItems(next);
  };

  const calcSubtotal = () => items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
  const calcGst = () => items.reduce((s, it) => {
    const itemTotal = it.unitPrice * it.quantity;
    return s + itemTotal * it.gstRate / 100;
  }, 0);

  const handleCreate = async () => {
    if (!supplierId) { toast.error("Supplier is required"); return; }
    if (!items[0]?.medicineId) { toast.error("At least one item required"); return; }
    setSaving(true);
    const subtotal = calcSubtotal();
    const totalGst = calcGst();
    const totalAmount = subtotal + totalGst;
    const user = session?.user as { id?: string; branchId?: string };
    try {
      const res = await fetch("/api/purchases", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items, supplierId, expectedDeliveryDate: expectedDeliveryDate || undefined, notes,
          branchId: user?.branchId || "",
          createdById: user?.id || "",
          subtotal, discountAmount: 0, taxableAmount: subtotal,
          cgstAmount: totalGst / 2, sgstAmount: totalGst / 2, totalAmount,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to create");
      toast.success("Purchase order created");
      setShowForm(false);
      setItems([{ medicineId: "", quantity: 1, unitPrice: 0, gstRate: 5 }]);
      setSupplierId(""); setExpectedDeliveryDate(""); setNotes("");
      setPage(1);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Something went wrong"); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Purchase Orders</h1>
          <p className="text-gray-500">Manage supplier orders and procurement</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" />New Order</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Orders</CardTitle></CardHeader>
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
                    <TableHead>Items</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.poNumber}</TableCell>
                      <TableCell><Truck className="w-3 h-3 inline mr-1" />{o.supplier.name}</TableCell>
                      <TableCell>{o.items.length} items</TableCell>
                      <TableCell className="font-medium">₹{o.totalAmount.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-xs">{o.branch.name}</TableCell>
                      <TableCell><Badge variant={statusVariant[o.status] || "secondary"}>{o.status}</Badge></TableCell>
                      <TableCell className="text-xs">{o.createdBy.name}</TableCell>
                      <TableCell className="text-xs">{new Date(o.createdAt).toLocaleDateString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                  {orders.length === 0 && (<TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-500">No orders found</TableCell></TableRow>)}
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

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg space-y-4 max-h-screen overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">New Purchase Order</h3>
            <div className="space-y-3">
              <div><label className="text-sm font-medium">Supplier *</label><select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}><option value="">Select supplier...</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-sm font-medium">Expected Delivery</label><Input type="date" value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)} /></div>
                <div><label className="text-sm font-medium">Notes</label><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
              </div>
              <div className="border-t pt-2">
                <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium">Items</span><Button size="sm" variant="outline" onClick={addItem}><Plus className="w-3 h-3 mr-1" />Add</Button></div>
                {items.map((item, i) => (
                  <div key={i} className="border rounded p-2 mb-2 space-y-1">
                    <div className="flex items-center justify-between"><span className="text-xs font-medium">Item {i + 1}</span>{items.length > 1 && <Button variant="ghost" size="icon" className="w-6 h-6 text-red-500" onClick={() => removeItem(i)}><Trash2 className="w-3 h-3" /></Button>}</div>
                    <div className="grid grid-cols-2 gap-1">
                      <div className="col-span-2"><label className="text-xs">Medicine *</label><select className="w-full h-8 text-sm rounded-md border border-input bg-background px-2" value={item.medicineId} onChange={(e) => updateItem(i, "medicineId", e.target.value)}><option value="">Select...</option>{medicines.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                      <div><label className="text-xs">Qty</label><Input type="number" className="h-8 text-sm" value={item.quantity} onChange={(e) => updateItem(i, "quantity", Number(e.target.value))} /></div>
                      <div><label className="text-xs">Unit Price</label><Input type="number" step="0.01" className="h-8 text-sm" value={item.unitPrice} onChange={(e) => updateItem(i, "unitPrice", Number(e.target.value))} /></div>
                      <div><label className="text-xs">GST Rate (%)</label><Input type="number" className="h-8 text-sm" value={item.gstRate} onChange={(e) => updateItem(i, "gstRate", Number(e.target.value))} /></div>
                      <div className="text-xs text-gray-500 flex items-end pb-1">Line total: ₹{(item.unitPrice * item.quantity).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
                <div className="text-sm font-medium text-right pt-2 border-t">
                  Subtotal: ₹{calcSubtotal().toFixed(2)} | GST: ₹{calcGst().toFixed(2)} | <span className="text-lg">Total: ₹{(calcSubtotal() + calcGst()).toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}Create Order</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
