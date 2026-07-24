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

interface DrugLicense {
  id: string;
  licenseType: string;
  licenseNumber: string;
  holderName: string;
  holderType: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  isActive: boolean;
}

const emptyForm: Omit<DrugLicense, "id" | "isActive"> = {
  licenseType: "DL_21B",
  licenseNumber: "",
  holderName: "",
  holderType: "BRANCH",
  issuingAuthority: "",
  issueDate: "",
  expiryDate: "",
};

export default function DrugLicensesPage() {
  const [licenses, setLicenses] = useState<DrugLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DrugLicense | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchLicenses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/drug-licenses");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLicenses(data);
    } catch {
      toast.error("Failed to load drug licenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (license: DrugLicense) => {
    setEditing(license);
    setForm({
      licenseType: license.licenseType,
      licenseNumber: license.licenseNumber,
      holderName: license.holderName,
      holderType: license.holderType,
      issuingAuthority: license.issuingAuthority || "",
      issueDate: license.issueDate || "",
      expiryDate: license.expiryDate,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.licenseNumber || !form.holderName || !form.expiryDate) {
      toast.error("License number, holder name, and expiry date are required");
      return;
    }
    setSaving(true);
    try {
      const url = "/api/drug-licenses";
      const method = editing ? "PUT" : "POST";
      const body = editing ? { ...form, id: editing.id } : form;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(editing ? "License updated" : "License created");
      setOpen(false);
      fetchLicenses();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deactivate this license?")) return;
    try {
      const res = await fetch(`/api/drug-licenses?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("License deactivated");
      fetchLicenses();
    } catch {
      toast.error("Failed to deactivate");
    }
  };

  const isExpiringSoon = (expiryDate: string) => {
    const diff = new Date(expiryDate).getTime() - Date.now();
    return diff <= 90 * 24 * 60 * 60 * 1000 && diff > 0;
  };

  const isExpired = (expiryDate: string) => new Date(expiryDate).getTime() < Date.now();

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Drug Licenses</h1>
          <p className="text-gray-500">Track licenses for branches and suppliers</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add License
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>All Licenses</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" /></div>
          ) : licenses.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">No drug licenses found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Holder</TableHead>
                  <TableHead>Issuing Authority</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.map((license) => (
                  <TableRow key={license.id}>
                    <TableCell><Badge variant="secondary">{license.licenseType}</Badge></TableCell>
                    <TableCell className="text-xs font-mono">{license.licenseNumber}</TableCell>
                    <TableCell className="text-xs">
                      <div>{license.holderName}</div>
                      <div className="text-gray-400">{license.holderType}</div>
                    </TableCell>
                    <TableCell className="text-xs">{license.issuingAuthority || "—"}</TableCell>
                    <TableCell className="text-xs">{license.issueDate ? new Date(license.issueDate).toLocaleDateString("en-IN") : "—"}</TableCell>
                    <TableCell className="text-xs">
                      <span className={isExpired(license.expiryDate) ? "text-red-600 font-medium" : isExpiringSoon(license.expiryDate) ? "text-amber-600 font-medium" : undefined}>
                        {new Date(license.expiryDate).toLocaleDateString("en-IN")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={license.isActive ? (isExpired(license.expiryDate) ? "destructive" : isExpiringSoon(license.expiryDate) ? "warning" : "success") : "secondary"}>
                        {license.isActive ? (isExpired(license.expiryDate) ? "Expired" : isExpiringSoon(license.expiryDate) ? "Expiring Soon" : "Active") : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(license)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(license.id)}>
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
            <DialogTitle>{editing ? "Edit Drug License" : "New Drug License"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update the drug license details" : "Add a new drug license"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="licenseType">License Type</Label>
                <Input id="licenseType" value={form.licenseType} onChange={(e) => setForm({ ...form, licenseType: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">License Number</Label>
                <Input id="licenseNumber" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="holderName">Holder Name</Label>
                <Input id="holderName" value={form.holderName} onChange={(e) => setForm({ ...form, holderName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="holderType">Holder Type</Label>
                <Input id="holderType" value={form.holderType} onChange={(e) => setForm({ ...form, holderType: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="issuingAuthority">Issuing Authority</Label>
              <Input id="issuingAuthority" value={form.issuingAuthority} onChange={(e) => setForm({ ...form, issuingAuthority: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issueDate">Issue Date</Label>
                <Input id="issueDate" type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input id="expiryDate" type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
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
