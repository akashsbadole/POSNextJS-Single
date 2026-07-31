"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, UserCheck } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface Salesman {
  id: string; name: string; phone: string | null; commissionRate: number;
  isActive: boolean; salesCount: number; salesValue: number; commissionEarned: number;
}

export default function SalesmenPage() {
  const { data: session } = useSession();
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", commissionRate: "0" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/salesmen?includeInactive=true");
      const d = await r.json();
      setSalesmen(d.salesmen || []);
    } catch { toast.error("Failed to load salesmen"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const isManager = session?.user?.role !== "CASHIER";

  const create = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/salesmen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, phone: form.phone, commissionRate: Number(form.commissionRate) || 0 }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to create salesman");
      toast.success("Salesman added");
      setModal(false);
      setForm({ name: "", phone: "", commissionRate: "0" });
      load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to create salesman"); }
    finally { setSaving(false); }
  };

  const toggleActive = async (s: Salesman) => {
    try {
      const res = await fetch(`/api/salesmen/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !s.isActive }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success(s.isActive ? "Deactivated" : "Activated");
      load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to update"); }
  };

  const totalCommission = salesmen.reduce((s, x) => s + x.commissionEarned, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Salesmen</h1>
          <p className="text-gray-500">Track sales performance and commissions</p>
        </div>
        {isManager && <Button onClick={() => setModal(true)}><Plus className="w-4 h-4 mr-2" />Add Salesman</Button>}
      </div>

      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <UserCheck className="w-8 h-8 text-pharmacy-500" />
          <div>
            <p className="text-sm text-gray-500">Estimated commission payable</p>
            <p className="text-2xl font-bold">₹{totalCommission.toLocaleString("en-IN")}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Salesmen</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead><TableHead>Phone</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead className="text-right">Sales Value</TableHead>
                  <TableHead className="text-right">Commission Earned</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesmen.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-xs">{s.phone || "—"}</TableCell>
                    <TableCell className="text-right">{s.commissionRate}%</TableCell>
                    <TableCell className="text-right">{s.salesCount}</TableCell>
                    <TableCell className="text-right">₹{s.salesValue.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right font-medium">₹{s.commissionEarned.toLocaleString("en-IN")}</TableCell>
                    <TableCell>
                      {isManager ? (
                        <Button size="sm" variant="ghost" onClick={() => toggleActive(s)}>
                          {s.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                        </Button>
                      ) : s.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
                {salesmen.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No salesmen yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Add Salesman</h3>
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input placeholder="Commission % (0-100)" type="number" min={0} max={100} value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} />
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
