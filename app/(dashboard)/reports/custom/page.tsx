"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BarChart3, Download, Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function CustomReportsPage() {
  const [reportType, setReportType] = useState("sales");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ kpis?: Record<string, number>; trend?: { month: string; sales: number; orders: number }[]; data?: unknown } | null>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (startDate) qs.set("startDate", new Date(startDate).toISOString());
      if (endDate) qs.set("endDate", new Date(endDate + "T23:59:59").toISOString());
      const res = await fetch(`/api/reports?${qs.toString()}`);
      const d = await res.json();
      if (res.ok) {
        setResult(d);
        toast.success("Report generated");
      } else {
        toast.error("Failed to generate report");
      }
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Custom Reports</h1>
          <p className="text-gray-500">Build reports filtered by date range</p>
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
          <div className="flex gap-4 items-end flex-wrap">
            <div>
              <label className="text-sm font-medium">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm w-48 mt-1"
              >
                <option value="sales">Sales Report</option>
                <option value="financial">Financial Report</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Date Range</label>
              <div className="flex gap-2 mt-1">
                <Input type="date" className="w-36" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <span className="self-center text-gray-400">to</span>
                <Input type="date" className="w-36" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
        <CardContent>
          {!result ? (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Apply filters and generate to see results</p>
            </div>
          ) : (
    <div className="p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-sm text-gray-500">Revenue</p>
                  <p className="text-xl font-bold">₹{(result.kpis?.totalRevenue || 0).toLocaleString("en-IN")}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-sm text-gray-500">Orders</p>
                  <p className="text-xl font-bold">{result.kpis?.totalOrders || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-sm text-gray-500">GST</p>
                  <p className="text-xl font-bold">₹{(result.kpis?.totalGST || 0).toLocaleString("en-IN")}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-sm text-gray-500">Avg Order</p>
                  <p className="text-xl font-bold">₹{(result.kpis?.avgOrderValue || 0).toLocaleString("en-IN")}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-pharmacy-500" />
                  <span className="font-medium">Monthly trend</span>
                </div>
                {result.trend?.length === 0 ? (
                  <p className="text-sm text-gray-500">No data in range</p>
                ) : (
                  <div className="flex gap-3 flex-wrap">
                    {result.trend!.map((t) => (
                      <Badge key={t.month} variant="outline">
                        {t.month}: ₹{t.sales.toLocaleString("en-IN")} ({t.orders})
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
