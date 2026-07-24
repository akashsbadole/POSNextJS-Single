"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Receipt,
  Calendar,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalMedicines: number;
  totalPatients: number;
  totalSales: number;
  totalRevenue: number;
  lowStockCount: number;
  recentSales: {
    id: string;
    invoiceNumber: string;
    finalAmount: number;
    createdAt: string;
    paymentMode: string;
    patient: { name: string } | null;
    cashier: { name: string };
  }[];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats
    ? [
        { title: "Total Sales", value: `₹${(stats.totalRevenue || 0).toLocaleString("en-IN")}`, change: `${stats.totalSales} orders`, trend: "up" as const, icon: DollarSign },
        { title: "Today's Orders", value: String(stats.totalSales), change: "+0%", trend: "up" as const, icon: ShoppingCart },
        { title: "Low Stock Items", value: String(stats.lowStockCount), change: "needs attention", trend: "down" as const, icon: AlertTriangle },
        { title: "Active Patients", value: String(stats.totalPatients), change: `${stats.totalMedicines} medicines`, trend: "up" as const, icon: Calendar },
      ]
    : [];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {session?.user?.name || "Admin"}!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Here&apos;s what&apos;s happening in your pharmacy today.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat) => (
              <Card key={stat.title}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-pharmacy-50 dark:bg-pharmacy-900/20 flex items-center justify-center">
                      <stat.icon className="w-6 h-6 text-pharmacy-600 dark:text-pharmacy-400" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-4">
                    {stat.trend === "up" ? (
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                      {stat.change}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Sales</CardTitle>
                  <CardDescription>Latest transactions</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/sales/invoices">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.recentSales?.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No recent sales</p>
                  ) : (
                    stats?.recentSales?.map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-pharmacy-100 dark:bg-pharmacy-900/20 flex items-center justify-center">
                            <Receipt className="w-5 h-5 text-pharmacy-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{sale.patient?.name || "Walk-in"}</p>
                            <p className="text-xs text-gray-500">{sale.invoiceNumber} • {new Date(sale.createdAt).toLocaleString("en-IN")}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">₹{sale.finalAmount.toLocaleString("en-IN")}</p>
                          <Badge variant={sale.paymentMode === "credit" ? "warning" : "success"} className="text-xs">
                            {sale.paymentMode}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Quick Summary</CardTitle>
                  <CardDescription>At a glance</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-pharmacy-600" />
                      <span className="text-sm font-medium">Active Medicines</span>
                    </div>
                    <span className="font-bold">{stats?.totalMedicines || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-pharmacy-600" />
                      <span className="text-sm font-medium">Registered Patients</span>
                    </div>
                    <span className="font-bold">{stats?.totalPatients || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-medium">Low Stock Items</span>
                    </div>
                    <span className="font-bold text-red-600">{stats?.lowStockCount || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
