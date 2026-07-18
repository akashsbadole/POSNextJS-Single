"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, TrendingDown, Users, Package, ShoppingCart, DollarSign,
  BarChart3, Activity, Calendar, Download, Sparkles,
} from "lucide-react";

export default function AnalyticsPage() {
  const metrics = [
    { label: "Revenue Trend", value: "+18.5%", trend: "up", icon: DollarSign },
    { label: "Customer Retention", value: "76.2%", trend: "up", icon: Users },
    { label: "Avg Order Value", value: "₹342", trend: "up", icon: ShoppingCart },
    { label: "Stock Turnover", value: "4.2x", trend: "up", icon: Package },
    { label: "Prescription Fill Rate", value: "94.8%", trend: "up", icon: Activity },
    { label: "Online Store Conversion", value: "3.2%", trend: "down", icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
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
              <div className={`flex items-center gap-1 mt-2 text-sm ${m.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                {m.trend === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {m.trend === "up" ? "+" : ""}{m.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Sales Forecast</CardTitle></CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Sparkles className="w-8 h-8 text-pharmacy-500 mr-2" />
              <span className="text-gray-500">AI-powered forecast — coming in Phase 4</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Popular Products</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Paracetamol 500mg", sales: 1245, trend: "+12%" },
                { name: "Vitamin C 1000mg", sales: 892, trend: "+8%" },
                { name: "Amoxicillin 500mg", sales: 654, trend: "-2%" },
                { name: "Cetirizine 10mg", sales: 543, trend: "+15%" },
                { name: "Omeprazole 20mg", sales: 432, trend: "+5%" },
              ].map((p) => (
                <div key={p.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <span className="text-sm font-medium">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{p.sales} units</span>
                    <Badge variant="success" className="text-xs">{p.trend}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Peak Hours Analysis</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-400 mr-2" />
            <span className="text-gray-500">Activity heatmap — integrates with sales data</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
