"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3, TrendingUp, Package, DollarSign, Download, Calendar,
  Filter, PieChart, Activity, Loader2,
} from "lucide-react";
import { toast } from "sonner";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("sales");
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<{ kpis?: Record<string, number>; trend?: { month: string; sales: number; orders: number }[]; topMedicines?: { name: string; units?: number; revenue?: number }[] } | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchReport = (sd: string, ed: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (sd && ed) { params.set("startDate", sd); params.set("endDate", ed); }
    fetch(`/api/reports?${params}`)
      .then((r) => r.json())
      .then((d) => setReport(d))
      .catch(() => toast.error("Failed to load report"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReport(startDate, endDate); }, [startDate, endDate]);

  const tabs = [
    { id: "sales", label: "Sales Reports", icon: TrendingUp },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "financial", label: "Financial", icon: DollarSign },
    { id: "custom", label: "Custom Reports", icon: BarChart3 },
  ];

  const kpis = report?.kpis;
  const trend = report?.trend || [];
  const topMedicines = report?.topMedicines || [];
  const maxSales = trend.length ? Math.max(...trend.map((t) => t.sales)) : 1;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400">Comprehensive business insights</p>
        </div>
        <div className="flex gap-2">
          <input type="date" className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input type="date" className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2" />Filters</Button>
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Export</Button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={0}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(e) => {
              const idx = tabs.findIndex((t) => t.id === tab.id);
              if (e.key === "ArrowRight") { e.preventDefault(); const next = tabs[(idx + 1) % tabs.length]; setActiveTab(next.id); }
              if (e.key === "ArrowLeft") { e.preventDefault(); const prev = tabs[(idx - 1 + tabs.length) % tabs.length]; setActiveTab(prev.id); }
              if (e.key === "Home") { e.preventDefault(); setActiveTab(tabs[0].id); }
              if (e.key === "End") { e.preventDefault(); setActiveTab(tabs[tabs.length - 1].id); }
            }}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-pharmacy-500 text-pharmacy-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" /></div>
      ) : activeTab === "sales" ? (
        <div id="panel-sales" role="tabpanel">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold">₹{(kpis?.totalRevenue || 0).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Orders</p>
                    <p className="text-2xl font-bold">{(kpis?.totalOrders || 0).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Avg Order Value</p>
                    <p className="text-2xl font-bold">₹{(kpis?.avgOrderValue || 0).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <PieChart className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total GST</p>
                    <p className="text-2xl font-bold">₹{(kpis?.totalGST || 0).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Sales Trend (by month)</CardTitle></CardHeader>
            <CardContent>
              {trend.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No sales data yet</p>
              ) : (
                <div className="h-64 flex items-end gap-4">
                  {trend.map((t) => (
                    <div key={t.month} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex gap-1 items-end" style={{ height: "200px" }}>
                        <div
                          className="flex-1 bg-pharmacy-500 rounded-t"
                          style={{ height: `${maxSales ? (t.sales / maxSales) * 100 : 0}%` }}
                          title={`${t.orders} orders`}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{t.month}</span>
                      <span className="text-xs font-medium">₹{(t.sales / 1000).toFixed(0)}k</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Top Selling Medicines</CardTitle></CardHeader>
            <CardContent>
              {topMedicines.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No medicine sales yet</p>
              ) : (
                <div className="space-y-4">
                  {topMedicines.map((med, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="w-6 h-6 rounded-full bg-pharmacy-100 dark:bg-pharmacy-900/20 flex items-center justify-center text-sm font-bold text-pharmacy-600">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{med.name}</p>
                        <p className="text-xs text-gray-500">{med.units ?? 0} units sold</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">₹{(med.revenue ?? 0).toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>GST Summary</CardTitle>
              <Badge variant="outline">GSTR-1 Ready</Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-sm text-gray-500">CGST Collected</p>
                  <p className="text-xl font-bold">₹{(kpis?.totalCGST || 0).toLocaleString("en-IN")}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-sm text-gray-500">SGST Collected</p>
                  <p className="text-xl font-bold">₹{(kpis?.totalSGST || 0).toLocaleString("en-IN")}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-sm text-gray-500">Total GST</p>
                  <p className="text-xl font-bold">₹{(kpis?.totalGST || 0).toLocaleString("en-IN")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Use the <strong>{tabs.find((t) => t.id === activeTab)?.label}</strong> page from the sidebar for detailed {activeTab} reporting.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
