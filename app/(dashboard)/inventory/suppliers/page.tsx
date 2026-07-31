"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchInput } from "@/components/ui/search-input";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Building2,
  Phone,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

interface Supplier {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ id?: string; name: string; contactPerson: string; email: string; phone: string; address: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () =>
    fetch("/api/suppliers")
      .then((r) => r.json())
      .then(setSuppliers)
      .catch(() => toast.error("Failed to load suppliers"))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const filtered = suppliers.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.contactPerson || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!modal || !modal.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const body = { name: modal.name, contactPerson: modal.contactPerson, email: modal.email, phone: modal.phone, address: modal.address };
      const res = await fetch("/api/suppliers", {
        method: modal.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modal.id ? { id: modal.id, ...body } : body),
      });
      if (!res.ok) throw new Error("Failed to save supplier");
      toast.success(modal.id ? "Supplier updated" : "Supplier created");
      setModal(null);
      load();
    } catch { toast.error("Failed to save supplier"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (s: Supplier) => {
    if (!confirm(`Delete supplier "${s.name}"?`)) return;
    try {
      const res = await fetch(`/api/suppliers?id=${s.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete supplier");
      toast.success("Supplier deleted");
      load();
    } catch { toast.error("Failed to delete supplier"); }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Suppliers</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your suppliers and distributors</p>
        </div>
        <Button size="sm" onClick={() => setModal({ name: "", contactPerson: "", email: "", phone: "", address: "" })}>
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <SearchInput
            searchValue={search}
            onSearch={(value) => setSearch(value)}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Suppliers</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{s.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{s.contactPerson || "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        {s.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{s.email}</span>}
                        {s.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.isActive ? "success" : "secondary"}>
                        {s.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="w-8 h-8" aria-label="Edit" onClick={() => setModal({ id: s.id, name: s.name, contactPerson: s.contactPerson || "", email: s.email || "", phone: s.phone || "", address: s.address || "" })}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500" aria-label="Delete" onClick={() => handleDelete(s)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No suppliers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">{modal.id ? "Edit Supplier" : "Add Supplier"}</h3>
            <div className="space-y-1">
              <label className="text-sm font-medium">Name</label>
              <Input value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} placeholder="e.g. MediCorp" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Contact Person</label>
              <Input value={modal.contactPerson} onChange={(e) => setModal({ ...modal, contactPerson: e.target.value })} placeholder="Optional" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" value={modal.email} onChange={(e) => setModal({ ...modal, email: e.target.value })} placeholder="Optional" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Phone</label>
              <Input value={modal.phone} onChange={(e) => setModal({ ...modal, phone: e.target.value })} placeholder="Optional" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Address</label>
              <Input value={modal.address} onChange={(e) => setModal({ ...modal, address: e.target.value })} placeholder="Optional" />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
