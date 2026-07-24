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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Scheme {
  id: string;
  name: string;
  description: string;
  schemeType: string;
  conditions: string;
  rewards: string;
  priority: number;
  isActive: boolean;
  validFrom: string;
  validTo: string;
}

const emptyForm: Omit<Scheme, "id" | "isActive"> = {
  name: "",
  description: "",
  schemeType: "FREE_GOODS",
  conditions: "",
  rewards: "",
  priority: 0,
  validFrom: "",
  validTo: "",
};

export default function SchemesPage() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Scheme | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchSchemes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/schemes");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSchemes(data);
    } catch {
      toast.error("Failed to load schemes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (scheme: Scheme) => {
    setEditing(scheme);
    setForm({
      name: scheme.name,
      description: scheme.description || "",
      schemeType: scheme.schemeType,
      conditions: scheme.conditions || "",
      rewards: scheme.rewards || "",
      priority: scheme.priority,
      validFrom: scheme.validFrom || "",
      validTo: scheme.validTo || "",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.schemeType) {
      toast.error("Name and scheme type are required");
      return;
    }
    setSaving(true);
    try {
      const url = "/api/schemes";
      const method = editing ? "PUT" : "POST";
      const body = editing ? { ...form, id: editing.id } : form;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(editing ? "Scheme updated" : "Scheme created");
      setOpen(false);
      fetchSchemes();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deactivate this scheme?")) return;
    try {
      const res = await fetch(`/api/schemes?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Scheme deactivated");
      fetchSchemes();
    } catch {
      toast.error("Failed to deactivate");
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Schemes</h1>
          <p className="text-gray-500">Configure promotions and discount schemes</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Scheme
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>All Schemes</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" /></div>
          ) : schemes.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">No schemes configured.</p>
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schemes.map((scheme) => (
                  <TableRow key={scheme.id}>
                    <TableCell className="text-xs font-medium">{scheme.name}</TableCell>
                    <TableCell><Badge variant="secondary">{scheme.schemeType}</Badge></TableCell>
                    <TableCell className="text-xs">{scheme.priority}</TableCell>
                    <TableCell className="text-xs">{scheme.validFrom ? new Date(scheme.validFrom).toLocaleDateString("en-IN") : "—"}</TableCell>
                    <TableCell className="text-xs">{scheme.validTo ? new Date(scheme.validTo).toLocaleDateString("en-IN") : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={scheme.isActive ? "success" : "secondary"}>
                        {scheme.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(scheme)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(scheme.id)}>
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DialogRoot open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Scheme" : "New Scheme"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update the scheme details" : "Create a new scheme"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Scheme Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schemeType">Scheme Type</Label>
              <Input id="schemeType" value={form.schemeType} onChange={(e) => setForm({ ...form, schemeType: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conditions">Conditions (JSON)</Label>
              <Input id="conditions" value={form.conditions} onChange={(e) => setForm({ ...form, conditions: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rewards">Rewards (JSON)</Label>
              <Input id="rewards" value={form.rewards} onChange={(e) => setForm({ ...form, rewards: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input id="priority" type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value || "0") })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validFrom">Valid From</Label>
                <Input id="validFrom" type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validTo">Valid To</Label>
                <Input id="validTo" type="date" value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </div>
  );
}
