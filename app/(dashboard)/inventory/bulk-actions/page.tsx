"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, FileSpreadsheet, Barcode, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function BulkActionsPage() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);

  const handleImport = async () => {
    setImporting(true);
    setResult(null);
    // ponytail: CSV import via /api/medicines POST loop — replace with proper batch endpoint if volume grows
    setTimeout(() => {
      setImporting(false);
      setResult({ success: 0, errors: ["CSV import — implement file parsing + batch POST"] });
      toast.info("CSV import: wire up file picker + /api/medicines");
    }, 1000);
  };

  return (
    <div className="space-y-6">
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
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-pharmacy-400 transition-colors cursor-pointer">
              <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-medium">Drop CSV file here or click to browse</p>
              <p className="text-xs text-gray-500 mt-1">Supports .csv files up to 10MB</p>
            </div>
            <Button className="w-full" disabled={importing} onClick={handleImport}>
              {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Upload & Import
            </Button>
            <div className="text-xs text-gray-400 space-y-1">
              <p>Expected columns: name, genericName, category, mrp, sellingPrice, quantity, batchNumber, expiryDate</p>
              <a href="#" className="text-pharmacy-500 hover:underline">Download sample CSV →</a>
            </div>
            {result && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm">
                <p className="font-medium text-amber-800">Import Notes</p>
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
                <div key={item.label} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
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
