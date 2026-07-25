"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, Package, ShoppingCart, DollarSign,
  BarChart3, Activity, Calendar, Download, Sparkles, Loader2,
} from "lucide-react";

import type { Medicine } from "@/types";

type DashboardData = { totalRevenue?: number; totalSales?: number; lowStockCount?: number; totalPatients?: number; totalMedicines?: number };
type ReportData = { kpis?: Record<string, number>; trend?: { month: string; sales: number; orders: number }[]; topMedicines?: (Medicine & { units?: number; revenue?: number })[] };

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard").then((r) => r.json()),
      fetch("/api/reports").then((r) => r.json()),
    ])
      .then(([d, r]) => { setDashboard(d); setReport(r); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" />
      </div>
    );
  }

  const totalRevenue = dashboard?.totalRevenue || 0;
  const totalSales = dashboard?.totalSales || 0;
  const avgOrder = totalSales ? Math.round(totalRevenue / totalSales) : 0;
  const lowStock = dashboard?.lowStockCount || 0;
  const trend = report?.trend || [];

  const metrics = [
    { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, trend: "up", icon: DollarSign },
    { label: "Total Orders", value: String(totalSales), trend: "up", icon: ShoppingCart },
    { label: "Avg Order Value", value: `₹${avgOrder.toLocaleString("en-IN")}`, trend: "up", icon: BarChart3 },
    { label: "Low Stock Items", value: String(lowStock), trend: lowStock > 0 ? "down" : "up", icon: Package },
    { label: "Active Patients", value: String(dashboard?.totalPatients || 0), trend: "up", icon: Users },
    { label: "Active Medicines", value: String(dashboard?.totalMedicines || 0), trend: "up", icon: Activity },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-gray-500">Data-driven insights for your pharmacy</p>
        </div>
        <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Export Report</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{m.label}</p>
                <m.icon className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-2xl font-bold mt-1">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Revenue Trend (by month)</CardTitle></CardHeader>
          <CardContent>
            {trend.length === 0 ? (
              <div className="h-48 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-gray-500">No sales data yet</span>
              </div>
            ) : (
              <div className="h-48 flex items-end gap-3">
                {trend.map((t: { month: string; sales: number; orders: number }) => {
                  const max = Math.max(...trend.map((x) => x.sales));
                  return (
                    <div key={t.month} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-pharmacy-500 rounded-t"
                        style={{ height: `${max ? (t.sales / max) * 160 : 0}px` }}
                        title={`${t.orders} orders`}
                      />
                      <span className="text-xs text-gray-500">{t.month.slice(2)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Popular Products</CardTitle></CardHeader>
          <CardContent>
            {(report?.topMedicines || []).length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No product sales yet</p>
            ) : (
              <div className="space-y-3">
                {report!.topMedicines!.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <span className="text-sm font-medium">{p.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{p.units ?? 0} units</span>
                      <Badge variant="success" className="text-xs">₹{(p.revenue ?? 0).toLocaleString("en-IN")}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Sales Forecast</CardTitle></CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Sparkles className="w-5 h-5 text-pharmacy-500 mr-2" />
            <span className="text-gray-500">Sales forecast — coming in a future update</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
