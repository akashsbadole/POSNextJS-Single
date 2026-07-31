"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { sendTemplate } from "@/lib/whatsapp";

interface PromiseOrder {
  id: string;
  customerName: string;
  customerPhone?: string | null;
  medicineId: string;
  medicine: { name: string };
  quantity: number;
  status: string;
  notes?: string | null;
}

interface Medicine { id: string; name: string; }

export default function PromiseOrdersPage() {
  const [orders, setOrders] = useState<PromiseOrder[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ customerName: "", customerPhone: "", medicineId: "", quantity: 1, notes: "" });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/promise-orders");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrders(data);
    } catch {
      toast.error("Failed to load promise orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetch("/api/medicines?limit=100")
      .then((r) => r.json())
      .then((d) => setMedicines(d.medicines || []))
      .catch(() => toast.error("Failed to load medicines"));
  }, []);

  const handleCreate = async () => {
    if (!form.customerName || !form.medicineId) {
      toast.error("Customer name and medicine are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/promise-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Promise order created");
      setOpen(false);
      setForm({ customerName: "", customerPhone: "", medicineId: "", quantity: 1, notes: "" });
      fetchOrders();
    } catch {
      toast.error("Failed to create promise order");
    } finally {
      setSaving(false);
    }
  };

  const handleFulfill = async (order: PromiseOrder) => {
    try {
      await fetch("/api/promise-orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, status: "FULFILLED", fulfilledAt: new Date().toISOString() }),
      });
      toast.success("Order fulfilled");
      fetchOrders();
      if (order.customerPhone) {
        sendTemplate(order.customerPhone, "promise_order_fulfilled", { customerName: order.customerName, medicineName: order.medicine.name });
      }
    } catch {
      toast.error("Failed to fulfill order");
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Promise Orders</h1>
          <p className="text-gray-500">Manage out-of-stock promises and notify customers</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Promise Order
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>All Promise Orders</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" /></div>
          ) : orders.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">No promise orders yet.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">{order.customerName}</p>
                    <p className="text-xs text-gray-500">{order.medicine.name} x {order.quantity}</p>
                    {order.customerPhone && <p className="text-xs text-gray-400">{order.customerPhone}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={order.status === "FULFILLED" ? "success" : order.status === "CANCELLED" ? "destructive" : "warning"}>
                      {order.status}
                    </Badge>
                    {order.status === "PENDING" && (
                      <Button size="sm" onClick={() => handleFulfill(order)}>Fulfill</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DialogRoot open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Promise Order</DialogTitle>
            <DialogDescription>Create a promise order for a customer</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input id="customerName" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone</Label>
              <Input id="customerPhone" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medicine">Medicine</Label>
              <select
                id="medicine"
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.medicineId}
                onChange={(e) => setForm({ ...form, medicineId: e.target.value })}
              >
                <option value="">Select a medicine</option>
                {medicines.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value || "1") })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </div>
  );
}
