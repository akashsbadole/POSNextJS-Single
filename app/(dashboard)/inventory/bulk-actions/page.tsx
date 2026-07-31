"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, FileSpreadsheet, Barcode, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  // ponytail: simple CSV parse, no RFC 4180 (no multiline quoted fields)
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((l) => l.split(",").map((c) => c.trim().replace(/^"|"$/g, "")));
  return { headers, rows };
}

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BulkActionsPage() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const { headers, rows } = parseCSV(text);
      if (headers.length === 0) {
        toast.error("CSV must have a header row and at least one data row");
        setImporting(false);
        return;
      }

      const res = await fetch("/api/categories");
      const cats = await res.json();
      // ponytail: categories may be array or { categories } shape
      const categoryList = Array.isArray(cats) ? cats : cats.categories ?? [];
      const catMap = Object.fromEntries(categoryList.map((c: { name: string; id: string }) => [c.name.toLowerCase(), c.id]));

      const successRows: string[][] = [];
      const errors: string[] = [];

      // ponytail: POST loop instead of batch endpoint — replace when volume justifies it
      await Promise.allSettled(
        rows.map(async (row, i) => {
          const record = Object.fromEntries(headers.map((h, j) => [h, row[j] ?? ""]));
          // ponytail: hardcoded gst 5%, purchasePrice = 80% of mrp, qty/batch/expiry skipped (inventory layer)
          const catName = (record.category ?? "").toLowerCase();
          const categoryId = catMap[catName];
          if (!categoryId) {
            errors.push(`Row ${i + 2}: unknown category "${record.category}"`);
            return;
          }

          const body = {
            name: record.name,
            genericName: record.genericName || record.name,
            categoryId,
            mrp: parseFloat(record.mrp),
            purchasePrice: parseFloat(record.purchasePrice || String(Math.round(parseFloat(record.mrp) * 0.8 * 100) / 100)),
            sellingPrice: parseFloat(record.sellingPrice || record.mrp),
            hsnCode: record.hsnCode,
            reorderLevel: parseInt(record.reorderLevel) || 10,
            reorderQuantity: parseInt(record.reorderQuantity) || 50,
          };

          const apiRes = await fetch("/api/medicines", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          if (!apiRes.ok) {
            const err = await apiRes.json();
            errors.push(`Row ${i + 2}: ${err.error ?? apiRes.statusText}`);
            return;
          }

          successRows.push(row);
        })
      );

      const imported = successRows.length;
      if (imported > 0) {
        toast.success(`Imported ${imported} medicine${imported > 1 ? "s" : ""}`);
      }
      setResult({ success: imported, errors: errors.length === 0 ? [] : errors });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Import failed";
      toast.error(msg);
      setResult({ success: 0, errors: [msg] });
    }

    setImporting(false);
  }, []);

  const handleExport = useCallback(async (label: string) => {
    try {
      const res = await fetch("/api/medicines?limit=10000");
      const data = await res.json();
      const list = data.medicines ?? [];
      const filename = `${label.toLowerCase().replace(/\s+/g, "-")}.csv`;

      if (label === "Medicine Inventory") {
        downloadCSV(filename,
          ["name", "genericName", "brand", "mrp", "sellingPrice", "category", "stock", "reorderLevel"],
          list.map((m: Record<string, unknown>) => [
            m.name, m.genericName, m.brandName || "",
            String(m.mrp), String(m.sellingPrice),
            (m.category as Record<string, unknown>)?.name ?? "", String((m.inventories as Record<string, unknown>[])?.[0]?.quantity ?? 0),
            String(m.reorderLevel || 10),
          ])
        );
      } else if (label === "Category") {
        const catRes = await fetch("/api/categories");
        const catData = await catRes.json();
        const cats = catData.categories ?? catData ?? [];
        downloadCSV(filename, ["name", "description", "parent"],
          cats.map((c: Record<string, unknown>) => [c.name, c.description || "", (c.parent as Record<string, unknown>)?.name || ""])
        );
      } else if (label === "Supplier") {
        const supRes = await fetch("/api/suppliers");
        const supData = await supRes.json();
        const sups = supData.suppliers ?? supData ?? [];
        downloadCSV(filename, ["name", "contact", "phone", "email", "gstin"],
          sups.map((s: Record<string, unknown>) => [s.name, s.contactPerson || "", s.phone || "", s.email || "", s.gstin || ""])
        );
      } else if (label === "Sales Report") {
        const sRes = await fetch("/api/sales?limit=10000");
        const sData = await sRes.json();
        const sales = sData.sales ?? [];
        downloadCSV(filename, ["invoiceNumber", "date", "patient", "items", "paymentMode", "paymentStatus", "finalAmount"],
          sales.map((s: Record<string, unknown>) => [
            s.invoiceNumber, String(s.createdAt ?? ""),
            (s.patient as Record<string, unknown>)?.name ?? "",
            String((s.items as unknown[])?.length ?? 0),
            s.paymentMode, s.paymentStatus, String(s.finalAmount),
          ])
        );
      } else if (label === "Low Stock Report") {
        downloadCSV(filename, ["name", "stock", "reorderLevel"],
          list.filter((m: Record<string, unknown>) => ((m.inventories as Record<string, unknown>[])?.[0]?.quantity ?? 0) <= (m.reorderLevel ?? 10))
            .map((m: Record<string, unknown>) => [m.name, String((m.inventories as Record<string, unknown>[])?.[0]?.quantity ?? 0), String(m.reorderLevel ?? 10)])
        );
      } else if (label === "Patient") {
        const patRes = await fetch("/api/patients");
        const patData = await patRes.json();
        const pats = patData.patients ?? patData ?? [];
        downloadCSV(filename, ["name", "phone", "email", "gender", "age"],
          pats.map((p: Record<string, unknown>) => [p.name, p.phone || "", p.email || "", p.gender || "", String(p.age || "")])
        );
      } else {
        downloadCSV(filename, ["name", "genericName", "mrp", "sellingPrice"],
          list.map((m: Record<string, unknown>) => [m.name, m.genericName, String(m.mrp), String(m.sellingPrice)])
        );
      }
      toast.success(`Exported ${label}`);
    } catch {
      toast.error("Export failed");
    }
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bulk Actions</h1>
        <p className="text-gray-500">Import/export inventory data in bulk</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-pharmacy-500" />
              <CardTitle>Import Inventory</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">Upload a CSV file with medicine data to bulk-add or update inventory.</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center hover:border-pharmacy-400 transition-colors cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-medium">Drop CSV file here or click to browse</p>
              <p className="text-xs text-gray-500 mt-1">Supports .csv files up to 10MB</p>
            </div>
            <Button className="w-full" disabled={importing} onClick={() => fileRef.current?.click()}>
              {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {importing ? "Importing..." : "Upload & Import"}
            </Button>
            <div className="text-xs text-gray-400 space-y-1">
              <p>Expected columns: name, genericName, category, mrp, sellingPrice, quantity, batchNumber, expiryDate</p>
              <button
                className="text-pharmacy-500 hover:underline"
                onClick={() => downloadCSV("sample-import.csv",
                  ["name", "genericName", "category", "mrp", "sellingPrice", "quantity", "batchNumber", "expiryDate"],
                  [["Paracetamol 500mg", "Paracetamol", "Pain Management", "50.00", "45.00", "100", "BATCH001", "2026-12-31"]]
                )}
              >
                Download sample CSV →
              </button>
            </div>
            {importing && (
              <p className="text-sm text-gray-500">Processing rows, please wait...</p>
            )}
            {result && (
              <div className={`p-3 rounded-lg border text-sm ${result.errors.length > 0 ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"}`}>
                <p className={`font-medium ${result.errors.length > 0 ? "text-amber-800" : "text-green-800"}`}>
                  Import complete: {result.success} imported{result.errors.length > 0 ? `, ${result.errors.length} errors` : ""}
                </p>
                {result.errors.map((e, i) => <p key={i} className="text-amber-600 text-xs mt-1">{e}</p>)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-pharmacy-500" />
              <CardTitle>Export Data</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">Export your inventory, sales, or patient data to CSV.</p>
            <div className="space-y-3">
              {[
                { label: "Medicine Inventory", desc: "All medicines with stock levels" },
                { label: "Sales Report", desc: "Sales transactions with amounts" },
                { label: "Patient Records", desc: "Registered patient information" },
                { label: "Low Stock Report", desc: "Items below reorder level" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleExport(item.label)}
                >
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <Download className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Barcode className="w-5 h-5 text-pharmacy-500" />
              <CardTitle>Barcode Generation</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">Generate barcodes for medicine labels in bulk.</p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-20 flex-col gap-1">
                <FileSpreadsheet className="w-5 h-5" />
                <span className="text-xs">All Medicines</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-1">
                <Barcode className="w-5 h-5" />
                <span className="text-xs">Custom Range</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-pharmacy-500" />
              <CardTitle>Recent Bulk Operations</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 text-center py-8">No recent bulk operations</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
