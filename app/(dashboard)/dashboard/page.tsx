"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  Pill,
  ShoppingCart,
  Users,
  TrendingUp,
  AlertTriangle,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Receipt,
  Truck,
  BarChart3,
  Settings,
  LogOut,
  Moon,
  Sun,
  Bell,
  Search,
  Menu,
  X,
  ChevronRight,
  Activity,
  HeartPulse,
  Stethoscope,
  CreditCard,
  FileText,
  Globe,
  Sparkles,
  Shield,
  Languages,
  Loader2,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { signOut } from "next-auth/react";

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

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    title: "Inventory",
    href: "/inventory/medicines",
    icon: Package,
    badge: "MVP",
    children: [
      { title: "Medicines", href: "/inventory/medicines", icon: Pill },
      { title: "Categories", href: "/inventory/categories", icon: Package },
      { title: "Suppliers", href: "/inventory/suppliers", icon: Truck },
      { title: "Stock Alerts", href: "/inventory/stock-alerts", icon: AlertTriangle },
      { title: "Bulk Actions", href: "/inventory/bulk-actions", icon: FileText },
    ],
  },
  {
    title: "Prescriptions",
    href: "/prescriptions/upload",
    icon: FileText,
    badge: "MVP",
    children: [
      { title: "Upload", href: "/prescriptions/upload", icon: FileText },
      { title: "Process", href: "/prescriptions/process", icon: Activity },
      { title: "Patients", href: "/prescriptions/patients", icon: Users },
      { title: "Doctors", href: "/prescriptions/doctors", icon: Stethoscope },
    ],
  },
  {
    title: "Sales & POS",
    href: "/pos",
    icon: ShoppingCart,
    badge: "MVP",
    children: [
      { title: "Point of Sale", href: "/pos", icon: CreditCard },
      { title: "Invoices", href: "/sales/invoices", icon: Receipt },
      { title: "Returns", href: "/sales/returns", icon: ArrowDownRight },
    ],
  },
  {
    title: "Purchases",
    href: "/purchases/orders",
    icon: Truck,
    badge: "MVP",
    children: [
      { title: "Purchase Orders", href: "/purchases/orders", icon: FileText },
      { title: "GRN", href: "/purchases/grn", icon: Package },
      { title: "Payments", href: "/purchases/payments", icon: DollarSign },
    ],
  },
  {
    title: "Reports",
    href: "/reports/sales",
    icon: BarChart3,
    badge: "MVP",
    children: [
      { title: "Sales Reports", href: "/reports/sales", icon: TrendingUp },
      { title: "Inventory Reports", href: "/reports/inventory", icon: Package },
      { title: "Financial Reports", href: "/reports/financial", icon: DollarSign },
      { title: "Custom Reports", href: "/reports/custom", icon: BarChart3 },
    ],
  },
  {
    title: "Online Store",
    href: "/online-store/products",
    icon: Globe,
    badge: "Phase 3",
    children: [
      { title: "Products", href: "/online-store/products", icon: Package },
      { title: "Orders", href: "/online-store/orders", icon: ShoppingCart },
      { title: "Delivery", href: "/online-store/delivery", icon: Truck },
    ],
  },
  {
    title: "Subscriptions",
    href: "/subscriptions",
    icon: Calendar,
    badge: "Phase 4",
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: Sparkles,
    badge: "Phase 4",
  },
  {
    title: "Telemedicine",
    href: "/telemedicine",
    icon: HeartPulse,
    badge: "Phase 4",
  },
  {
    title: "Users & Roles",
    href: "/users/management",
    icon: Users,
    badge: "MVP",
    children: [
      { title: "User Management", href: "/users/management", icon: Users },
      { title: "Roles & Permissions", href: "/users/roles", icon: Shield },
    ],
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
    badge: null,
    children: [
      { title: "General", href: "/admin/settings", icon: Settings },
      { title: "Audit Logs", href: "/admin/audit-logs", icon: FileText },
      { title: "Languages", href: "/admin/settings?tab=languages", icon: Languages },
    ],
  },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pharmacy-500"></div>
      </div>
    );
  }

  const toggleMenu = (title: string) => {
    setExpandedMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const statCards = stats ? [
    { title: "Total Sales", value: `₹${(stats.totalRevenue || 0).toLocaleString("en-IN")}`, change: `${stats.totalSales} orders`, trend: "up" as const, icon: DollarSign },
    { title: "Today's Orders", value: String(stats.totalSales), change: "+0%", trend: "up" as const, icon: ShoppingCart },
    { title: "Low Stock Items", value: String(stats.lowStockCount), change: "needs attention", trend: "down" as const, icon: AlertTriangle },
    { title: "Active Patients", value: String(stats.totalPatients), change: `${stats.totalMedicines} medicines`, trend: "up" as const, icon: Calendar },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <aside
        className={`${sidebarOpen ? "w-64" : "w-16"} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col fixed h-full z-20`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-pharmacy-500 flex items-center justify-center">
                <Pill className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900 dark:text-white">PharmacyPro</span>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map((item) => (
            <div key={item.title}>
              {item.children ? (
                <div>
                  <button
                    onClick={() => toggleMenu(item.title)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      sidebarOpen
                        ? "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        : "justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-left">{item.title}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${expandedMenus[item.title] ? "rotate-90" : ""}`}
                        />
                      </>
                    )}
                  </button>
                  {sidebarOpen && expandedMenus[item.title] && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                          <child.icon className="w-4 h-4" />
                          {child.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sidebarOpen
                      ? "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      : "justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1">{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className={`flex items-center gap-3 ${sidebarOpen ? "" : "justify-center"}`}>
            <div className="w-8 h-8 rounded-full bg-pharmacy-100 dark:bg-pharmacy-900 flex items-center justify-center">
              <Users className="w-4 h-4 text-pharmacy-600 dark:text-pharmacy-400" />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {session?.user?.name || "Admin User"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {session?.user?.role || "Owner"}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className={`flex-1 ${sidebarOpen ? "ml-64" : "ml-16"} transition-all duration-300`}>
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search medicines, patients, invoices..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-pharmacy-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </header>

        <div className="p-6 space-y-6">
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
      </main>
    </div>
  );
}
