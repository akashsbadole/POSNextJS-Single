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
  Stethoscope,
  Phone,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

interface Doctor {
  id: string;
  name: string;
  specialty: string | null;
  phone: string | null;
  email: string | null;
  rmpNumber: string | null;
  isVerified: boolean;
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ id?: string; name: string; specialty: string; phone: string; email: string; rmpNumber: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () =>
    fetch("/api/doctors")
      .then((r) => r.json())
      .then(setDoctors)
      .catch(() => toast.error("Failed to load doctors"))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const filtered = doctors.filter(
    (d) => d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.specialty || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!modal || !modal.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const body = { name: modal.name, specialty: modal.specialty, phone: modal.phone, email: modal.email, rmpNumber: modal.rmpNumber };
      const res = await fetch("/api/doctors", {
        method: modal.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modal.id ? { id: modal.id, ...body } : body),
      });
      if (!res.ok) throw new Error("Failed to save doctor");
      toast.success(modal.id ? "Doctor updated" : "Doctor added");
      setModal(null);
      load();
    } catch { toast.error("Failed to save doctor"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (d: Doctor) => {
    if (!confirm(`Delete doctor "${d.name}"?`)) return;
    try {
      const res = await fetch(`/api/doctors?id=${d.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete doctor");
      }
      toast.success("Doctor deleted");
      load();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to delete doctor"); }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Doctors</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage referring doctors and practitioners</p>
        </div>
        <Button size="sm" onClick={() => setModal({ name: "", specialty: "", phone: "", email: "", rmpNumber: "" })}>
          <Plus className="w-4 h-4 mr-2" />
          Add Doctor
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <SearchInput
            searchValue={search}
            onSearch={(value) => setSearch(value)}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doctors..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Doctor Directory</CardTitle>
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
                  <TableHead>Doctor</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>License No.</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                          <Stethoscope className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium">{d.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{d.specialty || "General"}</TableCell>
                    <TableCell className="text-xs font-mono">{d.rmpNumber || "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        {d.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{d.email}</span>}
                        {d.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{d.phone}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={d.isVerified ? "success" : "secondary"}>
                        {d.isVerified ? "Verified" : "Unverified"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="w-8 h-8" aria-label="Edit" onClick={() => setModal({ id: d.id, name: d.name, specialty: d.specialty || "", phone: d.phone || "", email: d.email || "", rmpNumber: d.rmpNumber || "" })}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500" aria-label="Delete" onClick={() => handleDelete(d)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No doctors found
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
            <h3 className="text-lg font-semibold">{modal.id ? "Edit Doctor" : "Add Doctor"}</h3>
            <div className="space-y-1">
              <label className="text-sm font-medium">Name</label>
              <Input value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} placeholder="Dr. Name" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Specialty</label>
              <Input value={modal.specialty} onChange={(e) => setModal({ ...modal, specialty: e.target.value })} placeholder="e.g. Cardiologist" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">RMP Number</label>
              <Input value={modal.rmpNumber} onChange={(e) => setModal({ ...modal, rmpNumber: e.target.value })} placeholder="Optional" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Phone</label>
              <Input value={modal.phone} onChange={(e) => setModal({ ...modal, phone: e.target.value })} placeholder="Optional" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" value={modal.email} onChange={(e) => setModal({ ...modal, email: e.target.value })} placeholder="Optional" />
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
