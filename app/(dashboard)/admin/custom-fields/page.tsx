"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const fieldTypes = ["TEXT", "NUMBER", "BOOLEAN", "DATE", "SELECT", "MULTISELECT"] as const;

interface CustomFieldDefinition {
  id: string;
  entityType: string;
  fieldName: string;
  fieldType: string;
  options?: string | null;
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
}

const formSchema = z.object({
  entityType: z.string().min(1),
  fieldName: z.string().min(1).max(50),
  fieldType: z.enum(fieldTypes),
  options: z.string().optional(),
  isRequired: z.boolean().default(false),
  sortOrder: z.number().default(0),
});

type FormValues = z.infer<typeof formSchema>;

const emptyForm: FormValues = {
  entityType: "",
  fieldName: "",
  fieldType: "TEXT",
  options: "",
  isRequired: false,
  sortOrder: 0,
};

export default function CustomFieldsPage() {
  const [definitions, setDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CustomFieldDefinition | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterEntity, setFilterEntity] = useState("");

  const fetchDefinitions = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filterEntity ? `?entityType=${encodeURIComponent(filterEntity)}` : "";
      const res = await fetch(`/api/custom-field-definitions${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDefinitions(data);
    } catch {
      toast.error("Failed to load custom fields");
    } finally {
      setLoading(false);
    }
  }, [filterEntity]);

  useEffect(() => {
    fetchDefinitions();
  }, [filterEntity, fetchDefinitions]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (def: CustomFieldDefinition) => {
    setEditing(def);
    setForm({
      entityType: def.entityType,
      fieldName: def.fieldName,
      fieldType: def.fieldType as FormValues["fieldType"],
      options: def.options || "",
      isRequired: def.isRequired,
      sortOrder: def.sortOrder,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      toast.error("Please check your inputs");
      return;
    }
    setSaving(true);
    try {
      const url = editing ? "/api/custom-field-definitions" : "/api/custom-field-definitions";
      const method = editing ? "PUT" : "POST";
      const body = editing ? { ...parsed.data, id: editing.id } : parsed.data;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details?.map((e: z.ZodError) => e.message).join(", "));
      toast.success(editing ? "Field updated" : "Field created");
      setOpen(false);
      fetchDefinitions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deactivate this custom field?")) return;
    try {
      const res = await fetch(`/api/custom-field-definitions?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Field deactivated");
      fetchDefinitions();
    } catch {
      toast.error("Failed to deactivate field");
    }
  };

  const uniqueEntityTypes = Array.from(new Set(definitions.map((d) => d.entityType))).sort();

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Custom Fields</h1>
          <p className="text-gray-500">Define extra fields for medicines, patients, sales, and more</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Field
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Definitions</CardTitle>
          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All entities</option>
            {uniqueEntityTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" />
            </div>
          ) : definitions.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">No custom fields defined yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entity</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {definitions.map((def) => (
                  <TableRow key={def.id}>
                    <TableCell className="text-xs font-medium">{def.entityType}</TableCell>
                    <TableCell className="text-xs">{def.fieldName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{def.fieldType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={def.isRequired ? "warning" : "secondary"}>
                        {def.isRequired ? "Required" : "Optional"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{def.sortOrder}</TableCell>
                    <TableCell>
                      <Badge variant={def.isActive ? "success" : "secondary"}>
                        {def.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(def)}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDelete(def.id)}
                        >
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
            <DialogTitle>{editing ? "Edit Custom Field" : "New Custom Field"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update the field definition below" : "Add a new custom field to any entity type"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="entityType">Entity Type</Label>
                <Input
                  id="entityType"
                  value={form.entityType}
                  onChange={(e) => setForm((f) => ({ ...f, entityType: e.target.value }))}
                  placeholder="e.g. MEDICINE, PATIENT"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fieldName">Field Name</Label>
                <Input
                  id="fieldName"
                  value={form.fieldName}
                  onChange={(e) => setForm((f) => ({ ...f, fieldName: e.target.value }))}
                  placeholder="e.g. manufacturer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fieldType">Field Type</Label>
                <Select
                  value={form.fieldType}
                  onValueChange={(value) => setForm((f) => ({ ...f, fieldType: value as FormValues["fieldType"] }))}
                >
                  <SelectTrigger id="fieldType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value || "0") }))}
                />
              </div>
            </div>

            {(form.fieldType === "SELECT" || form.fieldType === "MULTISELECT") && (
              <div className="space-y-2">
                <Label htmlFor="options">Options (JSON array)</Label>
                <Input
                  id="options"
                  value={form.options}
                  onChange={(e) => setForm((f) => ({ ...f, options: e.target.value }))}
                  placeholder='["Option A", "Option B"]'
                />
                <p className="text-xs text-gray-400">Enter a JSON array like [&quot;Option A&quot;, &quot;Option B&quot;]</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                id="isRequired"
                type="checkbox"
                checked={form.isRequired}
                onChange={(e) => setForm((f) => ({ ...f, isRequired: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isRequired">Required field</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
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
