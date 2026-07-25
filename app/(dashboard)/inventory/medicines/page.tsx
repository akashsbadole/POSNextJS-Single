"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchInput } from "@/components/ui/search-input";
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Medicine {
  id: string; name: string; genericName: string; brandName?: string; hsnCode?: string;
  gstRate: number; dosageForm?: string; strength?: string; mrp: number; purchasePrice: number;
  sellingPrice: number; reorderLevel: number; reorderQuantity: number;
  isPrescriptionRequired: boolean; isActive: boolean;
  categoryId: string; supplierId?: string;
  category: { id: string; name: string };
  supplier: { id: string; name: string } | null;
  inventories: { quantity: number; batches: { expiryDate: string }[] }[];
}

interface Category { id: string; name: string; }
interface Supplier { id: string; name: string; }

const defaultForm = {
  name: "", genericName: "", brandName: "", categoryId: "", hsnCode: "", gstRate: 5,
  dosageForm: "", strength: "", mrp: 0, purchasePrice: 0, sellingPrice: 0,
  supplierId: "", reorderLevel: 10, reorderQuantity: 50, isPrescriptionRequired: false,
};

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const fetchMedicines = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/medicines?${params}`);
      const data = await res.json();
      setMedicines(data.medicines);
      setTotalPages(data.pagination.totalPages);
    } catch {
      toast.error("Failed to load medicines");
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => { fetchMedicines(); }, [fetchMedicines]);

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/suppliers").then((r) => r.json()),
    ]).then(([cats, supps]) => {
      setCategories(cats || []);
      setSuppliers(supps || []);
    }).catch(() => {});
  }, []);

  const resetForm = () => { setForm(defaultForm); setEditId(null); setShowForm(false); };

  const openEdit = (med: Medicine) => {
    setForm({
      name: med.name, genericName: med.genericName, brandName: med.brandName || "",
      categoryId: med.categoryId, hsnCode: med.hsnCode || "", gstRate: med.gstRate,
      dosageForm: med.dosageForm || "", strength: med.strength || "",
      mrp: med.mrp, purchasePrice: med.purchasePrice, sellingPrice: med.sellingPrice,
      supplierId: med.supplierId || "", reorderLevel: med.reorderLevel,
      reorderQuantity: med.reorderQuantity, isPrescriptionRequired: med.isPrescriptionRequired,
    });
    setEditId(med.id); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.genericName || !form.categoryId) {
      toast.error("Name, generic name, and category are required");
      return;
    }
    setSaving(true);
    const url = "/api/medicines";
    const method = editId ? "PUT" : "POST";
    const body = editId ? { id: editId, ...form } : form;
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save");
      toast.success(editId ? "Medicine updated" : "Medicine created");
      resetForm(); fetchMedicines();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this medicine?")) return;
    try {
      const res = await fetch(`/api/medicines?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Medicine deleted"); fetchMedicines();
    } catch {
      toast.error("Failed to delete medicine");
    }
  };

  function getStockStatus(inv: { quantity: number }[]) {
    const totalStock = inv.reduce((s, i) => s + i.quantity, 0);
    if (totalStock === 0) return "out";
    if (totalStock <= 10) return "critical";
    if (totalStock <= 25) return "low";
    return "active";
  }

  function getNearestExpiry(inv: { batches: { expiryDate: string }[] }[]) {
    const dates = inv.flatMap((i) => i.batches.map((b) => b.expiryDate)).filter(Boolean);
    if (dates.length === 0) return "—";
    return dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0].split("T")[0];
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Medicines</h1>
          <p className="text-gray-500">Manage your medicine inventory</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" />Add Medicine
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <SearchInput
            searchValue={searchQuery}
            onSearch={(value) => { setSearchQuery(value); setPage(1); }}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search by name or generic name..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Medicine List</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" /></div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Selling Price</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicines.map((med) => {
                    const status = getStockStatus(med.inventories);
                    const totalStock = med.inventories.reduce((s, i) => s + i.quantity, 0);
                    return (
                      <TableRow key={med.id}>
                        <TableCell>
                          <div><p className="font-medium">{med.name}</p><p className="text-xs text-gray-500">{med.genericName}</p></div>
                        </TableCell>
                        <TableCell>{med.category?.name || "—"}</TableCell>
                        <TableCell><span className={`font-medium ${status === "critical" || status === "out" ? "text-red-600" : status === "low" ? "text-amber-600" : "text-green-600"}`}>{totalStock}</span></TableCell>
                        <TableCell>₹{med.sellingPrice?.toFixed(2)}</TableCell>
                        <TableCell>{getNearestExpiry(med.inventories)}</TableCell>
                        <TableCell className="text-xs">{med.supplier?.name || "—"}</TableCell>
                        <TableCell><Badge variant={status === "active" ? "success" : status === "low" ? "warning" : "destructive"}>{status === "active" ? "In Stock" : status === "low" ? "Low Stock" : status === "out" ? "Out of Stock" : "Critical"}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEdit(med)}><Edit className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500" onClick={() => handleDelete(med.id)}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
            <h3 className="text-lg font-semibold">{editId ? "Edit" : "Add"} Medicine</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="text-sm font-medium">Name *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="col-span-2"><label className="text-sm font-medium">Generic Name *</label><Input value={form.genericName} onChange={(e) => setForm({ ...form, genericName: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Brand Name</label><Input value={form.brandName} onChange={(e) => setForm({ ...form, brandName: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Category *</label><select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}><option value="">Select...</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><label className="text-sm font-medium">HSN Code</label><Input value={form.hsnCode} onChange={(e) => setForm({ ...form, hsnCode: e.target.value })} /></div>
              <div><label className="text-sm font-medium">GST Rate (%)</label><Input type="number" value={form.gstRate} onChange={(e) => setForm({ ...form, gstRate: Number(e.target.value) })} /></div>
              <div><label className="text-sm font-medium">Dosage Form</label><Input value={form.dosageForm} onChange={(e) => setForm({ ...form, dosageForm: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Strength</label><Input value={form.strength} onChange={(e) => setForm({ ...form, strength: e.target.value })} /></div>
              <div><label className="text-sm font-medium">MRP *</label><Input type="number" step="0.01" value={form.mrp || ""} onChange={(e) => setForm({ ...form, mrp: Number(e.target.value) })} /></div>
              <div><label className="text-sm font-medium">Purchase Price *</label><Input type="number" step="0.01" value={form.purchasePrice || ""} onChange={(e) => setForm({ ...form, purchasePrice: Number(e.target.value) })} /></div>
              <div><label className="text-sm font-medium">Selling Price *</label><Input type="number" step="0.01" value={form.sellingPrice || ""} onChange={(e) => setForm({ ...form, sellingPrice: Number(e.target.value) })} /></div>
              <div><label className="text-sm font-medium">Supplier</label><select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}><option value="">None</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div><label className="text-sm font-medium">Reorder Level</label><Input type="number" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: Number(e.target.value) })} /></div>
              <div><label className="text-sm font-medium">Reorder Qty</label><Input type="number" value={form.reorderQuantity} onChange={(e) => setForm({ ...form, reorderQuantity: Number(e.target.value) })} /></div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="rx" checked={form.isPrescriptionRequired} onChange={(e) => setForm({ ...form, isPrescriptionRequired: e.target.checked })} />
                <label htmlFor="rx" className="text-sm">Requires Prescription (Schedule H/H1)</label>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}{editId ? "Update" : "Create"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
