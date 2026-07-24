"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, Plus, X, CheckCircle2, Package } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface SubItem { id: string; quantity: number; medicine: { name: string } | null; }
interface Delivery { id: string; scheduledDate: string; status: string; }
interface Subscription {
  id: string; name: string; frequency: string; status: string;
  totalAmount: number; nextDeliveryDate: string | null;
  customer: { name: string | null; email: string | null };
  items: SubItem[];
  deliveries: Delivery[];
}

export default function SubscriptionsPage() {
  const { data: session } = useSession();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [medicines, setMedicines] = useState<{ id: string; name: string }[]>([]);
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("MONTHLY");
  const [formItems, setFormItems] = useState<{ medicineId: string; quantity: number }[]>([{ medicineId: "", quantity: 1 }]);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/subscriptions")
      .then((r) => r.json())
      .then((d) => setSubs(d.subscriptions || []))
      .catch(() => toast.error("Failed to load subscriptions"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    fetch("/api/medicines?limit=100").then((r) => r.json()).then((d) => {
      setMedicines((d.medicines || []).map((m: { id: string; name: string }) => ({ id: m.id, name: m.name })));
    }).catch(() => {});
  }, []);

  const statusVariant: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
    ACTIVE: "success", PAUSED: "warning", CANCELLED: "destructive",
  };

  const setStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) { toast.success(`Subscription ${status.toLowerCase()}`); load(); }
      else toast.error("Update failed");
    } catch { toast.error("Update failed"); }
  };

  const addItem = () => setFormItems((p) => [...p, { medicineId: "", quantity: 1 }]);
  const updateItem = (i: number, patch: Partial<{ medicineId: string; quantity: number }>) =>
    setFormItems((p) => p.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const removeItem = (i: number) => setFormItems((p) => p.filter((_, idx) => idx !== i));

  const create = async () => {
    if (!session?.user?.id) { toast.error("Sign in required"); return; }
    if (!name || formItems.some((it) => !it.medicineId)) { toast.error("Fill all fields"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: session.user.id, name, frequency, items: formItems }),
      });
      if (res.ok) {
        toast.success("Subscription created");
        setName(""); setFormItems([{ medicineId: "", quantity: 1 }]); setShowForm(false); load();
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Creation failed");
      }
    } catch { toast.error("Creation failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Medicine Subscriptions</h1>
          <p className="text-gray-500">Recurring medicine deliveries for customers</p>
        </div>
        <Button size="sm" onClick={() => setShowForm((s) => !s)}>
          {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {showForm ? "Cancel" : "New Subscription"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Create Subscription</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Monthly Diabetics Pack" />
              </div>
              <div>
                <label className="text-sm font-medium">Frequency</label>
                <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option>DAILY</option><option>WEEKLY</option><option>MONTHLY</option><option>QUARTERLY</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Medicines</label>
              {formItems.map((it, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select
                    value={it.medicineId}
                    onChange={(e) => updateItem(i, { medicineId: e.target.value })}
                    className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Select medicine</option>
                    {medicines.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <Input
                    type="number" min={1} className="w-24"
                    value={it.quantity}
                    onChange={(e) => updateItem(i, { quantity: parseInt(e.target.value) || 1 })}
                  />
                  {formItems.length > 1 && (
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500" onClick={() => removeItem(i)}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addItem}><Plus className="w-4 h-4 mr-1" />Add Medicine</Button>
            </div>

            <Button onClick={create} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Create Subscription
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" /></div>
      ) : subs.length === 0 ? (
        <Card><CardContent className="text-center py-12 text-gray-500">No subscriptions yet. Create one above.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {subs.map((s) => (
            <Card key={s.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base">{s.name}</CardTitle>
                  <p className="text-xs text-gray-500 mt-1">{s.customer.name || s.customer.email} · {s.frequency}</p>
                </div>
                <Badge variant={statusVariant[s.status] || "secondary"}>{s.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">₹{s.totalAmount.toLocaleString("en-IN")}</span>
                  <span className="text-gray-500">· Next: {s.nextDeliveryDate ? new Date(s.nextDeliveryDate).toLocaleDateString("en-IN") : "—"}</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Items</p>
                  <ul className="text-sm space-y-1">
                    {s.items.map((it) => (
                      <li key={it.id} className="flex justify-between">
                        <span>{it.medicine?.name || "Unknown"}</span>
                        <span className="text-gray-500">x{it.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {s.deliveries.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Upcoming deliveries</p>
                    <div className="flex flex-wrap gap-2">
                      {s.deliveries.slice(0, 3).map((d) => (
                        <Badge key={d.id} variant="outline">
                          {new Date(d.scheduledDate).toLocaleDateString("en-IN")} · {d.status}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  {s.status === "ACTIVE" ? (
                    <Button variant="outline" size="sm" onClick={() => setStatus(s.id, "PAUSED")}><RefreshCw className="w-4 h-4 mr-1" />Pause</Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setStatus(s.id, "ACTIVE")}><RefreshCw className="w-4 h-4 mr-1" />Resume</Button>
                  )}
                  <Button variant="outline" size="sm" className="text-red-500" onClick={() => setStatus(s.id, "CANCELLED")}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
