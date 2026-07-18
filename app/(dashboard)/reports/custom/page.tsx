"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, BarChart3, Download, Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Filter = { field: string; operator: string; value: string };

export default function CustomReportsPage() {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [loading, setLoading] = useState(false);

  const addFilter = () => setFilters([...filters, { field: "date", operator: "between", value: "" }]);
  const removeFilter = (i: number) => setFilters(filters.filter((_, idx) => idx !== i));

  const generate = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); toast.success("Report generated — implement query builder"); }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Custom Reports</h1>
          <p className="text-gray-500">Build custom reports with filters</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Export</Button>
          <Button size="sm" onClick={generate} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BarChart3 className="w-4 h-4 mr-2" />}
            Generate
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Report Filters</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div>
              <label className="text-sm font-medium">Report Type</label>
              <select className="h-9 rounded-md border border-input bg-background px-3 text-sm w-48 mt-1">
                <option>Sales Report</option>
                <option>Inventory Report</option>
                <option>Patient Report</option>
                <option>Financial Report</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Date Range</label>
              <div className="flex gap-2 mt-1">
                <Input type="date" className="w-36" />
                <span className="self-center text-gray-400">to</span>
                <Input type="date" className="w-36" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Additional Filters</label>
              <Button variant="outline" size="sm" onClick={addFilter}>
                <Plus className="w-4 h-4 mr-1" />Add Filter
              </Button>
            </div>
            {filters.map((f, i) => (
              <div key={i} className="flex gap-2 items-center">
                <select className="h-9 rounded-md border border-input bg-background px-3 text-sm flex-1">
                  <option>Date</option><option>Amount</option><option>Category</option><option>Payment Mode</option>
                </select>
                <select className="h-9 rounded-md border border-input bg-background px-3 text-sm w-32">
                  <option>equals</option><option>contains</option><option>greater than</option><option>less than</option><option>between</option>
                </select>
                <Input placeholder="Value" className="flex-1" />
                <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500" onClick={() => removeFilter(i)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Apply filters and generate to see results</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
