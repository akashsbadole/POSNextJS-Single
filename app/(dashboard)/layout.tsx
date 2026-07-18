"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { signOut } from "next-auth/react";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    badge: null as string | null,
  },
  {
    title: "Inventory",
    href: "/inventory/medicines",
    icon: Package,
    badge: "MVP" as const,
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
    badge: "MVP" as const,
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
    badge: "MVP" as const,
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
    badge: "MVP" as const,
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
    badge: "MVP" as const,
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
    badge: "Phase 3" as const,
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
    badge: "Phase 4" as const,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: Sparkles,
    badge: "Phase 4" as const,
  },
  {
    title: "Telemedicine",
    href: "/telemedicine",
    icon: HeartPulse,
    badge: "Phase 4" as const,
  },
  {
    title: "Users & Roles",
    href: "/users/management",
    icon: Users,
    badge: "MVP" as const,
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const currentPath = pathname || "";
    for (const item of navItems) {
      if (item.children) {
        const isActive = item.children.some((child) => currentPath.startsWith(child.href));
        if (isActive) {
          setExpandedMenus((prev) => ({ ...prev, [item.title]: true }));
        }
      }
    }
  }, [pathname]);

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

  const isActive = (href: string) => (pathname || "") === href || (pathname || "").startsWith(href + "/");

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
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive(child.href)
                              ? "bg-pharmacy-50 text-pharmacy-700 dark:bg-pharmacy-900/20 dark:text-pharmacy-400"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                          }`}
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

        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
