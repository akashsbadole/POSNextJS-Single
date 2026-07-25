"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Loader2 } from "lucide-react";

export default function FinancialReportsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ kpis?: Record<string, number>; trend?: { month: string; sales: number; orders: number }[] } | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchReport = (sd: string, ed: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (sd && ed) { params.set("startDate", sd); params.set("endDate", ed); }
    fetch(`/api/reports?${params}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReport(startDate, endDate); }, [startDate, endDate]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financial Reports</h1>
          <p className="text-gray-500">Revenue, tax, and profit summaries</p>
        </div>
        <div className="flex gap-2 items-center">
          <input type="date" className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input type="date" className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Export</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Total Revenue</p><p className="text-2xl font-bold mt-1">₹{(data?.kpis?.totalRevenue || 0).toLocaleString("en-IN")}</p></CardContent></Card>
            <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Total Sales</p><p className="text-2xl font-bold mt-1">{data?.kpis?.totalOrders || 0}</p></CardContent></Card>
            <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Total GST</p><p className="text-2xl font-bold mt-1">₹{(data?.kpis?.totalGST || 0).toLocaleString("en-IN")}</p></CardContent></Card>
            <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Avg Order Value</p><p className="text-2xl font-bold mt-1">₹{(data?.kpis?.avgOrderValue || 0).toLocaleString("en-IN")}</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>GST Summary</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Taxable Sales</TableHead>
                    <TableHead>CGST</TableHead>
                    <TableHead>SGST</TableHead>
                    <TableHead>Total Tax</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>{startDate && endDate ? `${startDate} to ${endDate}` : "All Time"}</TableCell>
                    <TableCell>₹{(data?.kpis?.totalTaxable || 0).toLocaleString("en-IN")}</TableCell>
                    <TableCell>₹{(data?.kpis?.totalCGST || 0).toLocaleString("en-IN")}</TableCell>
                    <TableCell>₹{(data?.kpis?.totalSGST || 0).toLocaleString("en-IN")}</TableCell>
                    <TableCell>₹{(data?.kpis?.totalGST || 0).toLocaleString("en-IN")}</TableCell>
                  </TableRow>
                  {(data?.trend || []).map((t) => (
                    <TableRow key={t.month}>
                      <TableCell>{t.month}</TableCell>
                      <TableCell colSpan={4} className="text-xs text-gray-500">{t.orders} orders · ₹{t.sales.toLocaleString("en-IN")} revenue</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
