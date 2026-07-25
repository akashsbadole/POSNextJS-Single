"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchInput } from "@/components/ui/search-input";
import { Plus, Edit, Loader2, User, ChevronLeft, ChevronRight, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

interface Patient {
  id: string; name: string; phone: string | null; email: string | null;
  gender: string | null; dateOfBirth: string | null; age?: number | null;
  bloodGroup?: string | null; address?: string | null; city?: string | null;
  state?: string | null; pincode?: string | null; gstin?: string | null;
  allergies?: string; chronicConditions?: string;
  _count: { prescriptions: number; sales: number };
}

const defaultForm = {
  name: "", phone: "", email: "", dateOfBirth: "", age: 0, gender: "",
  bloodGroup: "", address: "", city: "", state: "", pincode: "", gstin: "",
  allergies: "", chronicConditions: "",
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/patients?${params}`);
      const data = await res.json();
      setPatients(data.patients);
      setTotalPages(data.pagination.totalPages);
    } catch { toast.error("Failed to load patients"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPatients(); }, [page, search]);

  const resetForm = () => { setForm(defaultForm); setEditId(null); };

  const openEdit = (p: Patient) => {
    setForm({
      name: p.name, phone: p.phone || "", email: p.email || "",
      dateOfBirth: p.dateOfBirth?.split("T")[0] || "", age: p.age || 0,
      gender: p.gender || "", bloodGroup: p.bloodGroup || "",
      address: p.address || "", city: p.city || "", state: p.state || "",
      pincode: p.pincode || "", gstin: p.gstin || "",
      allergies: p.allergies || "", chronicConditions: p.chronicConditions || "",
    });
    setEditId(p.id); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error("Patient name is required"); return; }
    setSaving(true);
    const url = "/api/patients";
    const method = editId ? "PUT" : "POST";
    const body = editId ? { id: editId, ...form } : form;
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save");
      toast.success(editId ? "Patient updated" : "Patient created");
      resetForm(); setShowForm(false); fetchPatients();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Patients</h1>
          <p className="text-gray-500">Registered patients directory</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-2" />Add Patient</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <SearchInput searchValue={search} onSearch={(value) => { setSearch(value); setPage(1); }} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name, phone, or email..." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Patient Records</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" /></div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Prescriptions</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-pharmacy-100 dark:bg-pharmacy-900/20 flex items-center justify-center"><User className="w-4 h-4 text-pharmacy-600" /></div>
                          <span className="font-medium">{p.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs">
                          {p.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{p.phone}</span>}
                          {p.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{p.email}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{p.gender || "—"}</TableCell>
                      <TableCell>{p._count.prescriptions}</TableCell>
                      <TableCell>{p._count.sales}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEdit(p)}><Edit className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {patients.length === 0 && (<TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No patients found</TableCell></TableRow>)}
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
            <h3 className="text-lg font-semibold">{editId ? "Edit" : "Add"} Patient</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="text-sm font-medium">Name *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Phone</label><Input type="tel" maxLength={10} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Email</label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Date of Birth</label><Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Age</label><Input type="number" value={form.age || ""} onChange={(e) => setForm({ ...form, age: Number(e.target.value) })} /></div>
              <div><label className="text-sm font-medium">Gender</label><select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option value="">Select...</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
              <div><label className="text-sm font-medium">Blood Group</label><select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}><option value="">Select...</option>{"A+ A- B+ B- AB+ AB- O+ O-".split(" ").map((bg) => <option key={bg} value={bg}>{bg}</option>)}</select></div>
              <div className="col-span-2"><label className="text-sm font-medium">Address</label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div><label className="text-sm font-medium">City</label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div><label className="text-sm font-medium">State</label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Pincode</label><Input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} /></div>
              <div><label className="text-sm font-medium">GSTIN</label><Input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Allergies</label><Input placeholder="Comma separated" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Chronic Conditions</label><Input placeholder="Comma separated" value={form.chronicConditions} onChange={(e) => setForm({ ...form, chronicConditions: e.target.value })} /></div>
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
