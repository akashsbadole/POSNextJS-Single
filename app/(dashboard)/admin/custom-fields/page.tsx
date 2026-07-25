"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";

const ENTITY_TYPES = [
  "MEDICINE", "PATIENT", "SUPPLIER", "SALE", "PRESCRIPTION", "BRANCH", "PURCHASE_ORDER",
];

const FIELD_TYPES = ["TEXT", "NUMBER", "BOOLEAN", "DATE", "SELECT", "MULTISELECT"];

type Field = {
  id: string; entityType: string; fieldName: string; fieldType: string;
  options?: string | null; isRequired: boolean; placeholder?: string | null;
  sortOrder: number; isActive: boolean;
};

export default function CustomFieldsPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState("");

  const load = useCallback(async () => {
    const url = entityFilter ? `/api/custom-fields?entityType=${entityFilter}` : "/api/custom-fields";
    const res = await fetch(url);
    const data = await res.json();
    setFields(data.fields || []);
    setLoading(false);
  }, [entityFilter]);

  useEffect(() => { load(); }, [entityFilter, load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this custom field? This also deletes all saved values.")) return;
    const res = await fetch(`/api/custom-fields/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Field deleted"); load(); }
    else toast.error("Delete failed");
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Custom Fields</h1>
          <p className="text-gray-500">Define custom fields for any entity type</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Field Definitions</CardTitle>
          <AddFieldDialog onCreated={load} />
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
            >
              <option value="">All Entity Types</option>
              {ENTITY_TYPES.map((et) => <option key={et} value={et}>{et}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : fields.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No custom fields defined yet. Click + to add one.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Field Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell><Badge variant="outline">{f.entityType}</Badge></TableCell>
                    <TableCell className="font-medium">{f.fieldName}</TableCell>
                    <TableCell><Badge variant="secondary">{f.fieldType}</Badge></TableCell>
                    <TableCell>{f.isRequired ? "Yes" : "No"}</TableCell>
                    <TableCell><Badge variant={f.isActive ? "success" : "secondary"}>{f.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <EditFieldDialog field={f} onUpdated={load} />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(f.id)}>
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
}

function AddFieldDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ entityType: "MEDICINE", fieldName: "", fieldType: "TEXT", options: "", isRequired: false, placeholder: "" });

  const handleSubmit = async () => {
    if (!form.fieldName) { toast.error("Field name required"); return; }
    setLoading(true);
    const res = await fetch("/api/custom-fields", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        options: (form.fieldType === "SELECT" || form.fieldType === "MULTISELECT") ? form.options.split(",").map((s: string) => s.trim()).filter(Boolean) : undefined,
      }),
    });
    setLoading(false);
    if (res.ok) { toast.success("Field created"); onCreated(); setOpen(false); setForm({ entityType: "MEDICINE", fieldName: "", fieldType: "TEXT", options: "", isRequired: false, placeholder: "" }); }
    else { const err = await res.json(); toast.error(err.error || "Failed to create"); }
  };

  if (!open) return <Button size="sm" onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-1" />Add Field</Button>;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setOpen(false)}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold">Add Custom Field</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Entity Type</label>
            <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.entityType} onChange={(e) => setForm({ ...form, entityType: e.target.value })}>
              {ENTITY_TYPES.map((et) => <option key={et} value={et}>{et}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Field Name</label>
            <Input placeholder="e.g. storage_temperature" value={form.fieldName} onChange={(e) => setForm({ ...form, fieldName: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Field Type</label>
            <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.fieldType} onChange={(e) => setForm({ ...form, fieldType: e.target.value })}>
              {FIELD_TYPES.map((ft) => <option key={ft} value={ft}>{ft}</option>)}
            </select>
          </div>
          {(form.fieldType === "SELECT" || form.fieldType === "MULTISELECT") && (
            <div>
              <label className="text-sm font-medium">Options (comma-separated)</label>
              <Input placeholder="Option1, Option2, Option3" value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} />
            </div>
          )}
          <div>
            <label className="text-sm font-medium">Placeholder</label>
            <Input placeholder="Enter value..." value={form.placeholder} onChange={(e) => setForm({ ...form, placeholder: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="req" checked={form.isRequired} onChange={(e) => setForm({ ...form, isRequired: e.target.checked })} />
            <label htmlFor="req" className="text-sm">Required</label>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}Create</Button>
        </div>
      </div>
    </div>
  );
}

function EditFieldDialog({ field, onUpdated }: { field: Field; onUpdated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fieldName: field.fieldName,
    fieldType: field.fieldType,
    options: field.options ? JSON.parse(field.options).join(", ") : "",
    isRequired: field.isRequired,
    placeholder: field.placeholder || "",
    isActive: field.isActive,
  });

  const handleSubmit = async () => {
    setLoading(true);
    const res = await fetch(`/api/custom-fields/${field.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        options: (form.fieldType === "SELECT" || form.fieldType === "MULTISELECT") ? form.options.split(",").map((s: string) => s.trim()).filter(Boolean) : undefined,
      }),
    });
    setLoading(false);
    if (res.ok) { toast.success("Field updated"); onUpdated(); setOpen(false); }
    else toast.error("Update failed");
  };

  return <>
    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(true)}><Pencil className="w-4 h-4" /></Button>
    {open && (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setOpen(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-semibold">Edit Custom Field</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Field Name</label>
              <Input value={form.fieldName} onChange={(e) => setForm({ ...form, fieldName: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Field Type</label>
              <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.fieldType} onChange={(e) => setForm({ ...form, fieldType: e.target.value })}>
                {FIELD_TYPES.map((ft) => <option key={ft} value={ft}>{ft}</option>)}
              </select>
            </div>
            {(form.fieldType === "SELECT" || form.fieldType === "MULTISELECT") && (
              <div>
                <label className="text-sm font-medium">Options (comma-separated)</label>
                <Input value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} />
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Placeholder</label>
              <Input value={form.placeholder} onChange={(e) => setForm({ ...form, placeholder: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="req-edit" checked={form.isRequired} onChange={(e) => setForm({ ...form, isRequired: e.target.checked })} />
              <label htmlFor="req-edit" className="text-sm">Required</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="active" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              <label htmlFor="active" className="text-sm">Active</label>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}Save</Button>
          </div>
        </div>
      </div>
    )}
  </>;
}
