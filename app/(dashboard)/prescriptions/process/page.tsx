"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, FileText, Plus, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Prescription {
  id: string; prescriptionNumber: string; status: string; notes: string | null;
  createdAt: string;
  patient: { name: string };
  doctor: { name: string } | null;
  items: { id: string; medicineName: string; quantity: number | null; isDispensed: boolean }[];
}

interface Patient { id: string; name: string; }
interface Doctor { id: string; name: string; }

export default function ProcessPage() {
  const { data: session } = useSession();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [form, setForm] = useState({ patientId: "", doctorId: "" });
  const [items, setItems] = useState([{ medicineName: "", dosage: "", frequency: "", duration: "", quantity: 0, instructions: "" }]);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/prescriptions?limit=20`)
      .then((r) => r.json())
      .then((d) => setPrescriptions(d.prescriptions || []))
      .catch(() => setPrescriptions([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    if (showForm) {
      Promise.all([
        fetch("/api/patients?limit=100").then((r) => r.json()),
        fetch("/api/doctors").then((r) => r.json()),
      ]).then(([pd, dd]) => {
        setPatients(pd.patients || []);
        setDoctors(dd || []);
      }).catch(() => {});
    }
  }, [showForm]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/prescriptions`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) { toast.success(`Prescription ${status.toLowerCase()}`); load(); }
      else toast.error("Failed to update prescription");
    } catch { toast.error("Failed to update prescription"); }
    finally { setUpdating(null); }
  };

  const addItem = () => setItems([...items, { medicineName: "", dosage: "", frequency: "", duration: "", quantity: 0, instructions: "" }]);
  const removeItem = (i: number) => items.length > 1 && setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string | number) => {
    const next = [...items];
    (next[i] as any)[field] = value;
    setItems(next);
  };

  const handleCreate = async () => {
    if (!form.patientId) { toast.error("Patient is required"); return; }
    if (!items[0]?.medicineName) { toast.error("At least one medicine item required"); return; }
    setSaving(true);
    const createdById = (session?.user as any)?.id || "";
    try {
      const res = await fetch("/api/prescriptions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items, createdById }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to create");
      toast.success("Prescription created");
      setShowForm(false);
      setItems([{ medicineName: "", dosage: "", frequency: "", duration: "", quantity: 0, instructions: "" }]);
      setForm({ patientId: "", doctorId: "" });
      load();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Process Prescriptions</h1>
          <p className="text-gray-500">Review and fulfill prescription orders</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => { setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" />New Prescription
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/prescriptions/upload"><FileText className="w-4 h-4 mr-2" />Upload</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Prescriptions</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" /></div>
          ) : prescriptions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No prescriptions to process</p>
              <p className="text-xs text-gray-400 mt-1">Create or upload a prescription to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prescriptions.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.prescriptionNumber}</TableCell>
                    <TableCell>{p.patient.name}<br /><span className="text-xs text-gray-400">{p.doctor?.name || ""}</span></TableCell>
                    <TableCell><div className="text-xs text-gray-500 max-w-[200px]">{p.items.map((it) => `${it.medicineName}${it.quantity ? ` x${it.quantity}` : ""}`).join(", ") || "—"}</div></TableCell>
                    <TableCell><Badge variant={p.status === "FULFILLED" ? "success" : p.status === "CANCELLED" ? "destructive" : "warning"}>{p.status}</Badge></TableCell>
                    <TableCell className="text-xs">{new Date(p.createdAt).toLocaleDateString("en-IN")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-green-500" disabled={updating === p.id || p.status === "FULFILLED"} onClick={() => updateStatus(p.id, "FULFILLED")}><CheckCircle2 className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500" disabled={updating === p.id || p.status === "CANCELLED"} onClick={() => updateStatus(p.id, "CANCELLED")}><XCircle className="w-4 h-4" /></Button>
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
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg space-y-4 max-h-screen overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">New Prescription</h3>
            <div className="space-y-3">
              <div><label className="text-sm font-medium">Patient *</label><select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}><option value="">Select patient...</option>{patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div><label className="text-sm font-medium">Doctor</label><select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}><option value="">Select doctor...</option>{doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
              <div className="border-t pt-2">
                <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium">Medicines</span><Button size="sm" variant="outline" onClick={addItem}><Plus className="w-3 h-3 mr-1" />Add</Button></div>
                {items.map((item, i) => (
                  <div key={i} className="border rounded p-2 mb-2 space-y-1">
                    <div className="flex items-center justify-between"><span className="text-xs font-medium">Item {i + 1}</span>{items.length > 1 && <Button variant="ghost" size="icon" className="w-6 h-6 text-red-500" onClick={() => removeItem(i)}><Trash2 className="w-3 h-3" /></Button>}</div>
                    <div className="grid grid-cols-2 gap-1">
                      <div className="col-span-2"><label className="text-xs">Medicine Name *</label><Input className="h-8 text-sm" value={item.medicineName} onChange={(e) => updateItem(i, "medicineName", e.target.value)} /></div>
                      <div><label className="text-xs">Dosage</label><Input className="h-8 text-sm" value={item.dosage} onChange={(e) => updateItem(i, "dosage", e.target.value)} placeholder="e.g. 1-0-1" /></div>
                      <div><label className="text-xs">Frequency</label><Input className="h-8 text-sm" value={item.frequency} onChange={(e) => updateItem(i, "frequency", e.target.value)} placeholder="e.g. After meals" /></div>
                      <div><label className="text-xs">Duration</label><Input className="h-8 text-sm" value={item.duration} onChange={(e) => updateItem(i, "duration", e.target.value)} placeholder="e.g. 7 days" /></div>
                      <div><label className="text-xs">Quantity</label><Input type="number" className="h-8 text-sm" value={item.quantity || ""} onChange={(e) => updateItem(i, "quantity", Number(e.target.value))} /></div>
                      <div className="col-span-2"><label className="text-xs">Instructions</label><Input className="h-8 text-sm" value={item.instructions} onChange={(e) => updateItem(i, "instructions", e.target.value)} /></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}Create</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
