"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ClipboardList } from "lucide-react";
import { toast } from "sonner";

interface InventoryItem {
  id: string; quantity: number;
  medicine: { id: string; name: string; genericName: string };
}

export default function AdjustmentsPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [history, setHistory] = useState<{ medicine: string; type: string; qty: number; reason: string; date: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [adjType, setAdjType] = useState<"increase" | "decrease">("increase");
  const [adjQty, setAdjQty] = useState(1);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/inventory?limit=100")
      .then((r) => r.json())
      .then((d) => setItems(d.inventory || []))
      .catch(() => toast.error("Failed to load inventory"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((it) =>
    it.medicine.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdjust = async () => {
    if (!selected || adjQty <= 0) { toast.error("Invalid adjustment"); return; }
    setSaving(true);
    const change = adjType === "increase" ? adjQty : -adjQty;
    const newQty = Math.max(0, selected.quantity + change);
    try {
      const res = await fetch("/api/inventory", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, quantity: newQty }),
      });
      if (!res.ok) throw new Error("Failed to adjust");
      toast.success(`Stock ${adjType}d by ${adjQty}`);
      setShowForm(false);
      setHistory([{ medicine: selected.medicine.name, type: adjType, qty: adjQty, reason, date: new Date().toISOString() }, ...history]);
      setItems(items.map((it) => it.id === selected.id ? { ...it, quantity: newQty } : it));
    } catch { toast.error("Failed to adjust stock"); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stock Adjustments</h1>
          <p className="text-gray-500">Manually adjust inventory quantities</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Inventory</CardTitle></CardHeader>
        <CardContent>
          <Input placeholder="Search medicine..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4" />
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell>
                      <p className="font-medium">{it.medicine.name}</p>
                      <p className="text-xs text-gray-500">{it.medicine.genericName}</p>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${it.quantity <= 10 ? "text-red-600" : it.quantity <= 25 ? "text-amber-600" : ""}`}>
                        {it.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => { setSelected(it); setAdjQty(1); setAdjType("increase"); setReason(""); setShowForm(true); }}>
                        <ClipboardList className="w-4 h-4 mr-1" />Adjust
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (<TableRow><TableCell colSpan={3} className="text-center py-8 text-gray-500">No inventory items found</TableCell></TableRow>)}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Adjustment History</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Medicine</TableHead><TableHead>Type</TableHead><TableHead>Qty</TableHead><TableHead>Reason</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
              <TableBody>
                {history.map((h, i) => (
                  <TableRow key={i}>
                    <TableCell>{h.medicine}</TableCell>
                    <TableCell><Badge variant={h.type === "increase" ? "success" : "destructive"}>{h.type === "increase" ? "+" : "-"}{h.qty}</Badge></TableCell>
                    <TableCell>{h.type === "increase" ? "+" : "-"}{h.qty}</TableCell>
                    <TableCell className="text-xs">{h.reason || "—"}</TableCell>
                    <TableCell className="text-xs">{new Date(h.date).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {showForm && selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Adjust Stock</h3>
            <p className="text-sm font-medium">{selected.medicine.name}</p>
            <p className="text-sm text-gray-500">Current stock: {selected.quantity}</p>
            <div className="flex gap-2">
              <Button variant={adjType === "increase" ? "default" : "outline"} className="flex-1" onClick={() => setAdjType("increase")}>Increase</Button>
              <Button variant={adjType === "decrease" ? "default" : "outline"} className="flex-1" onClick={() => setAdjType("decrease")}>Decrease</Button>
            </div>
            <div>
              <label className="text-sm font-medium">Quantity</label>
              <Input type="number" min={1} value={adjQty} onChange={(e) => setAdjQty(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Damage, expiry, manual count..." />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleAdjust} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
