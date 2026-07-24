"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

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

interface DynamicFieldEditorProps {
  entityType: string;
  entityId: string;
  onChange?: (values: Record<string, string>) => void;
}

export default function DynamicFieldEditor({ entityType, entityId, onChange }: DynamicFieldEditorProps) {
  const [definitions, setDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/custom-field-definitions?entityType=${encodeURIComponent(entityType)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const activeDefs = data.filter((d: CustomFieldDefinition) => d.isActive);
        setDefinitions(activeDefs.sort((a: CustomFieldDefinition, b: CustomFieldDefinition) => a.sortOrder - b.sortOrder || a.fieldName.localeCompare(b.fieldName)));

        const valuesRes = await fetch(`/api/custom-field-values?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`);
        const valuesData = await valuesRes.json();
        if (valuesRes.ok) {
          const map: Record<string, string> = {};
          for (const v of valuesData) {
            map[v.fieldId] = v.value;
          }
          setValues(map);
        }
      } catch {
        setDefinitions([]);
      } finally {
        setLoading(false);
      }
    };

    if (entityType && entityId) {
      load();
    }
  }, [entityType, entityId]);

  const updateValue = async (fieldId: string, value: string) => {
    setSaving(fieldId);
    try {
      const body: Record<string, string> = {
        entityType,
        entityId,
        fieldId,
        value,
      };
      const res = await fetch("/api/custom-field-values", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setValues((prev) => {
        const next = { ...prev, [fieldId]: value };
        onChange?.(next);
        return next;
      });
    } catch {
      // keep optimistic update
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Loading fields...</p>;
  }

  if (definitions.length === 0) {
    return <p className="text-sm text-gray-500">No custom fields defined for {entityType}.</p>;
  }

  const renderField = (def: CustomFieldDefinition) => {
    const currentValue = values[def.id] || "";

    switch (def.fieldType) {
      case "TEXT":
        return (
          <Input
            value={currentValue}
            onChange={(e) => updateValue(def.id, e.target.value)}
            placeholder={def.fieldName}
          />
        );
      case "NUMBER": {
        return (
          <Input
            type="number"
            value={currentValue}
            onChange={(e) => updateValue(def.id, e.target.value)}
            placeholder={def.fieldName}
          />
        );
      }
      case "DATE":
        return (
          <Input
            type="date"
            value={currentValue}
            onChange={(e) => updateValue(def.id, e.target.value)}
          />
        );
      case "BOOLEAN":
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={currentValue === "true"}
              onCheckedChange={(checked) => updateValue(def.id, checked ? "true" : "false")}
            />
            <span className="text-xs text-gray-500">{currentValue === "true" ? "Yes" : "No"}</span>
          </div>
        );
      case "SELECT": {
        let options: string[] = [];
        try {
          options = def.options ? JSON.parse(def.options) : [];
        } catch {
          options = [];
        }
        return (
          <Select value={currentValue} onValueChange={(v) => updateValue(def.id, v)}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${def.fieldName}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }
      case "MULTISELECT": {
        let options: string[] = [];
        try {
          options = def.options ? JSON.parse(def.options) : [];
        } catch {
          options = [];
        }
        const selected: string[] = currentValue ? JSON.parse(currentValue) : [];
        return (
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => {
              const isSelected = selected.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    const next = isSelected ? selected.filter((s) => s !== opt) : [...selected, opt];
                    updateValue(def.id, JSON.stringify(next));
                  }}
                  className={`px-2 py-1 rounded-md border text-xs transition-colors ${
                    isSelected ? "bg-pharmacy-500 text-white border-pharmacy-500" : "bg-white dark:bg-gray-800 border-gray-200"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        );
      }
      default:
        return (
          <Input
            value={currentValue}
            onChange={(e) => updateValue(def.id, e.target.value)}
            placeholder={def.fieldName}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      {definitions.map((def) => (
        <div key={def.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          <div>
            <Label className="text-sm">
              {def.fieldName}
              {def.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <p className="text-xs text-gray-400 capitalize mt-0.5">
              {def.fieldType.toLowerCase()}
              {saving === def.id && <span className="ml-2 text-pharmacy-500">saving...</span>}
            </p>
          </div>
          <div className="md:col-span-2">
            {renderField(def)}
          </div>
        </div>
      ))}
    </div>
  );
}
