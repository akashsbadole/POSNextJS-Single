"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type FieldDef = {
  id: string; fieldName: string; fieldType: string;
  options?: string | null; isRequired: boolean; isActive: boolean; placeholder?: string | null;
};

export default function DynamicFieldEditor({
  entityType, entityId, onSave,
}: {
  entityType: string; entityId: string; onSave?: () => void;
}) {
  const [defs, setDefs] = useState<FieldDef[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/custom-fields?entityType=${entityType}`).then((r) => r.json()),
      fetch(`/api/custom-field-values?entityType=${entityType}&entityId=${entityId}`).then((r) => r.json()),
    ]).then(([defData, valData]) => {
      setDefs(defData.fields || []);
      setValues(valData.mapped || {});
    }).catch(() => {}).finally(() => setLoading(false));
  }, [entityType, entityId]);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/custom-field-values", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityType, entityId, values }),
    });
    setSaving(false);
    if (res.ok) { toast.success("Custom fields saved"); onSave?.(); }
    else toast.error("Failed to save custom fields");
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  if (defs.length === 0) return null;

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Custom Fields</h4>
      <div className="grid grid-cols-2 gap-4">
        {defs.filter((d) => d.isActive !== false).map((def) => (
          <div key={def.id}>
            <label className="text-sm font-medium block mb-1">
              {def.fieldName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              {def.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            {def.fieldType === "BOOLEAN" ? (
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={values[def.fieldName] || "false"}
                onChange={(e) => setValues({ ...values, [def.fieldName]: e.target.value })}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            ) : def.fieldType === "SELECT" ? (
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={values[def.fieldName] || ""}
                onChange={(e) => setValues({ ...values, [def.fieldName]: e.target.value })}
              >
                <option value="">{def.placeholder || "Select..."}</option>
                {(JSON.parse(def.options || "[]") as string[]).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : def.fieldType === "MULTISELECT" ? (
              <div className="space-y-1 max-h-24 overflow-y-auto border rounded-md p-2">
                {(JSON.parse(def.options || "[]") as string[]).map((opt) => {
                  const selected = (values[def.fieldName] || "").split(",").includes(opt);
                  return (
                    <label key={opt} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => {
                          const current = (values[def.fieldName] || "").split(",").filter(Boolean);
                          const next = selected ? current.filter((c) => c !== opt) : [...current, opt];
                          setValues({ ...values, [def.fieldName]: next.join(",") });
                        }}
                      />
                      {opt}
                    </label>
                  );
                })}
              </div>
            ) : def.fieldType === "DATE" ? (
              <Input
                type="date"
                value={values[def.fieldName] || ""}
                onChange={(e) => setValues({ ...values, [def.fieldName]: e.target.value })}
              />
            ) : (
              <Input
                type={def.fieldType === "NUMBER" ? "number" : "text"}
                placeholder={def.placeholder || ""}
                value={values[def.fieldName] || ""}
                onChange={(e) => setValues({ ...values, [def.fieldName]: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>
      <Button size="sm" variant="outline" onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
        Save Custom Fields
      </Button>
    </div>
  );
}
