"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";

type License = {
  id: string; licenseType: string; licenseNumber: string; holderName: string;
  holderType: string; holderId: string; issuingAuthority?: string | null;
  issueDate?: string | null; expiryDate: string; isActive: boolean;
};

export default function DrugLicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ licenseType: "RETAIL", licenseNumber: "", holderName: "", holderType: "BRANCH", holderId: "", issuingAuthority: "", issueDate: "", expiryDate: "" });

  const load = async () => {
    const res = await fetch("/api/drug-licenses");
    if (res.ok) setLicenses(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ licenseType: "RETAIL", licenseNumber: "", holderName: "", holderType: "BRANCH", holderId: "", issuingAuthority: "", issueDate: "", expiryDate: "" });
    setEditId(null); setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!form.licenseNumber || !form.holderName || !form.expiryDate) {
      toast.error("License number, holder name, and expiry date required");
      return;
    }
    const url = "/api/drug-licenses";
    const method = editId ? "PUT" : "POST";
    const body = editId ? { id: editId, ...form } : form;
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { toast.success(editId ? "License updated" : "License created"); resetForm(); load(); }
    else { const err = await res.json(); toast.error(err.error || "Failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this license?")) return;
    const res = await fetch(`/api/drug-licenses?id=${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("License deleted"); load(); }
  };

  const edit = (l: License) => {
    setForm({ licenseType: l.licenseType, licenseNumber: l.licenseNumber, holderName: l.holderName, holderType: l.holderType, holderId: l.holderId, issuingAuthority: l.issuingAuthority || "", issueDate: l.issueDate?.split("T")[0] || "", expiryDate: l.expiryDate.split("T")[0] });
    setEditId(l.id); setShowForm(true);
  };

  const getExpiryStatus = (date: string) => {
    const daysLeft = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return <Badge variant="destructive">Expired</Badge>;
    if (daysLeft <= 30) return <Badge variant="warning">{daysLeft} days</Badge>;
    return <Badge variant="success">{daysLeft} days</Badge>;
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Drug Licenses</h1>
          <p className="text-gray-500">Manage pharmacy and supplier drug licenses</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" />Add License</Button>
      </div>

      <Card>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : licenses.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No drug licenses registered</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>License #</TableHead>
                  <TableHead>Holder</TableHead>
                  <TableHead>Issuing Authority</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell><Badge variant="outline">{l.licenseType}</Badge></TableCell>
                    <TableCell className="font-mono">{l.licenseNumber}</TableCell>
                    <TableCell>{l.holderName}</TableCell>
                    <TableCell>{l.issuingAuthority || "-"}</TableCell>
                    <TableCell>{new Date(l.expiryDate).toLocaleDateString()}</TableCell>
                    <TableCell>{getExpiryStatus(l.expiryDate)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => edit(l)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(l.id)}><Trash2 className="w-4 h-4" /></Button>
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
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">{editId ? "Edit" : "Add"} Drug License</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">License Type</label>
                <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.licenseType} onChange={(e) => setForm({ ...form, licenseType: e.target.value })}>
                  <option value="RETAIL">RETAIL</option>
                  <option value="WHOLESALE">WHOLESALE</option>
                  <option value="DL_21B">DL 21B</option>
                  <option value="DL_20B">DL 20B</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">License Number</label>
                <Input value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Holder Name</label>
                <Input value={form.holderName} onChange={(e) => setForm({ ...form, holderName: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Holder Type</label>
                <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.holderType} onChange={(e) => setForm({ ...form, holderType: e.target.value })}>
                  <option value="BRANCH">Branch</option>
                  <option value="SUPPLIER">Supplier</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Issuing Authority</label>
                <Input value={form.issuingAuthority} onChange={(e) => setForm({ ...form, issuingAuthority: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Issue Date</label>
                  <Input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Expiry Date*</label>
                  <Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
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
