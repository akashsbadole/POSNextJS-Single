"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Package,
  DollarSign,
  Download,
  Calendar,
  Filter,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const salesData = [
  { month: "Jan", sales: 45000, profit: 12000 },
  { month: "Feb", sales: 52000, profit: 15000 },
  { month: "Mar", sales: 48000, profit: 13000 },
  { month: "Apr", sales: 61000, profit: 18000 },
  { month: "May", sales: 55000, profit: 16000 },
  { month: "Jun", sales: 67000, profit: 21000 },
];

const topMedicines = [
  { name: "Paracetamol 500mg", sales: 1250, revenue: 31875, growth: 12.5 },
  { name: "Amoxicillin 250mg", sales: 890, revenue: 106800, growth: 8.3 },
  { name: "Vitamin D3 60K", sales: 756, revenue: 64260, growth: 15.2 },
  { name: "Cetirizine 10mg", sales: 643, revenue: 9645, growth: -3.1 },
  { name: "Metformin 500mg", sales: 521, revenue: 23445, growth: 5.7 },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("sales");

  const tabs = [
    { id: "sales", label: "Sales Reports", icon: TrendingUp },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "financial", label: "Financial", icon: DollarSign },
    { id: "custom", label: "Custom Reports", icon: BarChart3 },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400">Comprehensive business insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Date Range
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold">₹3,28,000</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600 font-medium">+18.2%</span>
              <span className="text-xs text-gray-500">vs last month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold">1,245</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600 font-medium">+12.5%</span>
              <span className="text-xs text-gray-500">vs last month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Order Value</p>
                <p className="text-2xl font-bold">₹263</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <PieChart className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600 font-medium">+5.3%</span>
              <span className="text-xs text-gray-500">vs last month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Profit Margin</p>
                <p className="text-2xl font-bold">28.5%</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <ArrowDownRight className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600 font-medium">-1.2%</span>
              <span className="text-xs text-gray-500">vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Trend (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end gap-4">
            {salesData.map((data, i) => {
              const maxSales = Math.max(...salesData.map((d) => d.sales));
              const height = (data.sales / maxSales) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex gap-1 items-end" style={{ height: "200px" }}>
                    <div
                      className="flex-1 bg-pharmacy-500 rounded-t"
                      style={{ height: `${height}%` }}
                    ></div>
                    <div
                      className="flex-1 bg-pharmacy-300 rounded-t"
                      style={{ height: `${(data.profit / maxSales) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">{data.month}</span>
                  <span className="text-xs font-medium">₹{(data.sales / 1000).toFixed(0)}k</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-pharmacy-500 rounded"></div>
              <span className="text-sm text-gray-500">Sales</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-pharmacy-300 rounded"></div>
              <span className="text-sm text-gray-500">Profit</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Medicines */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Medicines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topMedicines.map((med, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="w-6 h-6 rounded-full bg-pharmacy-100 dark:bg-pharmacy-900/20 flex items-center justify-center text-sm font-bold text-pharmacy-600">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{med.name}</p>
                  <p className="text-xs text-gray-500">{med.sales} units sold</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">₹{med.revenue.toLocaleString()}</p>
                  <div className="flex items-center gap-1 justify-end">
                    {med.growth >= 0 ? (
                      <ArrowUpRight className="w-3 h-3 text-green-500" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-red-500" />
                    )}
                    <span className={`text-xs ${med.growth >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {med.growth}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* GST Report */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>GST Summary</CardTitle>
          <Badge variant="outline">GSTR-1 Ready</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <p className="text-sm text-gray-500">CGST Collected</p>
              <p className="text-xl font-bold">₹14,250</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <p className="text-sm text-gray-500">SGST Collected</p>
              <p className="text-xl font-bold">₹14,250</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <p className="text-sm text-gray-500">Total GST</p>
              <p className="text-xl font-bold">₹28,500</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
