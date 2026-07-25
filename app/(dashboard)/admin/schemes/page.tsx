"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Plus, Sparkles, Pencil, Trash2 } from "lucide-react";

type Scheme = {
  id: string; name: string; description?: string | null; schemeType: string;
  conditions?: string | null; rewards?: string | null; priority: number;
  isActive: boolean; validFrom?: string | null; validTo?: string | null;
};

export default function SchemesPage() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", schemeType: "CASH_DISCOUNT", conditions: "", rewards: "", priority: 0, validFrom: "", validTo: "" });

  const load = async () => {
    const res = await fetch("/api/schemes");
    if (res.ok) setSchemes(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ name: "", description: "", schemeType: "CASH_DISCOUNT", conditions: "", rewards: "", priority: 0, validFrom: "", validTo: "" });
    setEditId(null); setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!form.name) { toast.error("Scheme name required"); return; }
    const url = "/api/schemes";
    const method = editId ? "PUT" : "POST";
    const body = editId ? { id: editId, ...form } : form;
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { toast.success(editId ? "Scheme updated" : "Scheme created"); resetForm(); load(); }
    else toast.error("Failed to save scheme");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this scheme?")) return;
    const res = await fetch(`/api/schemes?id=${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Scheme deleted"); load(); }
  };

  const edit = (s: Scheme) => {
    setForm({ name: s.name, description: s.description || "", schemeType: s.schemeType, conditions: s.conditions ? JSON.stringify(JSON.parse(s.conditions), null, 2) : "", rewards: s.rewards ? JSON.stringify(JSON.parse(s.rewards), null, 2) : "", priority: s.priority, validFrom: s.validFrom?.split("T")[0] || "", validTo: s.validTo?.split("T")[0] || "" });
    setEditId(s.id); setShowForm(true);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Promotional Schemes</h1>
          <p className="text-gray-500">Create and manage discount schemes and offers</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" />Add Scheme</Button>
      </div>

      <Card>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : schemes.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No schemes created yet</p>
              <p className="text-sm text-gray-400 mt-1">Schemes are evaluated during billing (wiring pending)</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Valid From</TableHead>
                  <TableHead>Valid To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schemes.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell><Badge variant="outline">{s.schemeType}</Badge></TableCell>
                    <TableCell>{s.priority}</TableCell>
                    <TableCell>{s.validFrom ? new Date(s.validFrom).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>{s.validTo ? new Date(s.validTo).toLocaleDateString() : "-"}</TableCell>
                    <TableCell><Badge variant={s.isActive ? "success" : "secondary"}>{s.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => edit(s)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(s.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg space-y-4 overflow-y-auto max-h-screen" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">{editId ? "Edit" : "Add"} Scheme</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Scheme Type</label>
                <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.schemeType} onChange={(e) => setForm({ ...form, schemeType: e.target.value })}>
                  <option value="CASH_DISCOUNT">Cash Discount</option>
                  <option value="FREE_GOODS">Free Goods</option>
                  <option value="COMBO">Combo Offer</option>
                  <option value="BULK_DISCOUNT">Bulk Discount</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Conditions (JSON)</label>
                <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono h-20" value={form.conditions} onChange={(e) => setForm({ ...form, conditions: e.target.value })} placeholder='{"minCartValue": 500, "applicableItems": ["all"]}' />
              </div>
              <div>
                <label className="text-sm font-medium">Rewards (JSON)</label>
                <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono h-20" value={form.rewards} onChange={(e) => setForm({ ...form, rewards: e.target.value })} placeholder='{"discountPercent": 10}' />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Valid From</label>
                  <Input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Valid To</label>
                  <Input type="date" value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>{editId ? "Update" : "Create"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
