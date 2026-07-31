"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
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
  ClipboardList,
  ArrowLeftRight,
  ArrowUpLeft,
  ScanLine,
  ShieldCheck,
  BookOpen,
  Wallet,
  UserCheck,
  LayoutGrid,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { signOut } from "next-auth/react";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Inventory",
    href: "/inventory/medicines",
    icon: Package,
    children: [
      { title: "Medicines", href: "/inventory/medicines", icon: Pill },
      { title: "Categories", href: "/inventory/categories", icon: Package },
      { title: "Suppliers", href: "/inventory/suppliers", icon: Truck },
      {
        title: "Stock Adjustments",
        href: "/inventory/adjustments",
        icon: ClipboardList,
      },
      {
        title: "Stock Alerts",
        href: "/inventory/stock-alerts",
        icon: AlertTriangle,
      },
      {
        title: "Stock & Racks",
        href: "/inventory/stock",
        icon: LayoutGrid,
      },
      {
        title: "Bulk Actions",
        href: "/inventory/bulk-actions",
        icon: FileText,
      },
      {
        title: "Transfers",
        href: "/inventory/transfers",
        icon: ArrowLeftRight,
      },
      {
        title: "Barcodes",
        href: "/inventory/barcodes",
        icon: ScanLine,
      },
    ],
  },
  {
    title: "Prescriptions",
    href: "/prescriptions/upload",
    icon: FileText,
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

    children: [
      { title: "Point of Sale", href: "/pos", icon: CreditCard },
      { title: "Invoices", href: "/sales/invoices", icon: Receipt },
      { title: "Returns", href: "/sales/returns", icon: ArrowDownRight },
      { title: "Promise Orders", href: "/sales/promise-orders", icon: Bell },
      { title: "Salesmen", href: "/salesmen", icon: UserCheck },
    ],
  },
  {
    title: "Purchases",
    href: "/purchases/orders",
    icon: Truck,

    children: [
      { title: "Purchase Orders", href: "/purchases/orders", icon: FileText },
      { title: "GRN", href: "/purchases/grn", icon: Package },
      { title: "Payments", href: "/purchases/payments", icon: DollarSign },
      { title: "Returns", href: "/purchases/returns", icon: ArrowUpLeft },
      { title: "E-Way Bills", href: "/purchases/eway", icon: Truck },
    ],
  },
  {
    title: "Reports",
    href: "/reports/sales",
    icon: BarChart3,

    children: [
      { title: "Sales Reports", href: "/reports/sales", icon: TrendingUp },
      { title: "Inventory Reports", href: "/reports/inventory", icon: Package },
      {
        title: "Financial Reports",
        href: "/reports/financial",
        icon: DollarSign,
      },
      { title: "Custom Reports", href: "/reports/custom", icon: BarChart3 },
      { title: "GST Compliance", href: "/reports/gst", icon: Receipt },
    ],
  },
  {
    title: "Accounting",
    href: "/accounting",
    icon: BookOpen,
    children: [
      { title: "Ledger & Reports", href: "/accounting", icon: BookOpen },
      { title: "Expenses", href: "/accounting/expenses", icon: Wallet },
    ],
  },
  {
    title: "Online Store",
    href: "/online-store/products",
    icon: Globe,
    children: [
      { title: "Products", href: "/online-store/products", icon: Package },
      { title: "Cart", href: "/online-store/cart", icon: ShoppingCart },
      { title: "Orders", href: "/online-store/orders", icon: ShoppingCart },
      { title: "Delivery", href: "/online-store/delivery", icon: Truck },
    ],
  },
  {
    title: "Subscriptions",
    href: "/subscriptions",
    icon: Calendar,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: Sparkles,
  },
  {
    title: "Telemedicine",
    href: "/telemedicine",
    icon: HeartPulse,
  },
  {
    title: "Users & Roles",
    href: "/users/management",
    icon: Users,

    children: [
      { title: "User Management", href: "/users/management", icon: Users },
      { title: "Roles & Permissions", href: "/users/roles", icon: Shield },
    ],
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
    children: [
      { title: "General", href: "/admin/settings", icon: Settings },
      { title: "Audit Logs", href: "/admin/audit-logs", icon: FileText },
      { title: "Custom Fields", href: "/admin/custom-fields", icon: FileText },
      { title: "Drug Licenses", href: "/admin/drug-licenses", icon: Shield },
      { title: "Schemes", href: "/admin/schemes", icon: Sparkles },
      { title: "Two-Factor Auth", href: "/settings/2fa", icon: ShieldCheck },
      {
        title: "Languages",
        href: "/admin/settings?tab=languages",
        icon: Languages,
      },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(
    {},
  );
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; createdAt: string; isRead: boolean }[]>([]);
  const [unread, setUnread] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  const loadNotifications = useCallback(() => {
    fetch("/api/notifications?limit=10")
      .then((r) => r.json())
      .then((d) => {
        setNotifications(d.notifications || []);
        setUnread(d.unread || 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadNotifications();
  }, [status, loadNotifications]);

  const openNotifications = () => {
    setNotifOpen((v) => {
      const next = !v;
      if (next && unread > 0) {
        fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) })
          .then(() => setUnread(0))
          .catch(() => {});
      }
      return next;
    });
  };

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/features")
      .then((r) => r.json())
      .then((data) => setFeatures(data))
      .catch(() => {});
  }, [status]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((d) => {
        if (!d.completed && !pathname?.startsWith("/onboarding")) {
          router.replace("/onboarding");
        }
      })
      .catch(() => {});
  }, [status, pathname, router]);

  useEffect(() => {
    const currentPath = pathname || "";
    for (const item of navItems) {
      if (item.children) {
        const isActive = item.children.some((child) =>
          currentPath.startsWith(child.href),
        );
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

  const isActive = (href: string) =>
    (pathname || "") === href || (pathname || "").startsWith(href + "/");

  const visibleNavItems = navItems.filter((item) => {
    if (!features || Object.keys(features).length === 0) return true;
    switch (item.title) {
      case "Online Store":
        return features.online_store ?? true;
      case "Subscriptions":
        return features.subscriptions ?? false;
      case "Analytics":
        return features.analytics ?? false;
      case "Telemedicine":
        return features.telemedicine ?? false;
      default:
        return true;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ${
          sidebarOpen
            ? "translate-x-0 w-64"
            : "-translate-x-full md:translate-x-0 md:w-16"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-pharmacy-500 flex items-center justify-center">
                <Pill className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900 dark:text-white">
                PharmacyPro
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {visibleNavItems.map((item) => (
            <div key={item.title}>
              {item.children ? (
                <div>
                  <button
                    onClick={() => toggleMenu(item.title)}
                    aria-expanded={expandedMenus[item.title]}
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
                          onClick={() => setSidebarOpen(false)}
                          aria-current={
                            isActive(child.href) ? "page" : undefined
                          }
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
                  onClick={() => setSidebarOpen(false)}
                  aria-current={isActive(item.href) ? "page" : undefined}
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
                    </>
                  )}
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div
            className={`flex items-center gap-3 ${sidebarOpen ? "" : "justify-center"}`}
          >
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

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main
        id="main-content"
        className={`flex-1 transition-all duration-300 ${sidebarOpen ? "md:ml-64" : "md:ml-16"}`}
      >
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="relative max-w-md w-full hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search medicines, patients, invoices..."
                aria-label="Global search"
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-pharmacy-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                aria-label="Notifications"
                onClick={openNotifications}
              >
                <Bell className="w-5 h-5" />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </Button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border z-50 overflow-hidden">
                  <div className="px-4 py-2 border-b text-sm font-semibold">Notifications</div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 && (
                      <p className="px-4 py-8 text-center text-sm text-gray-500">No notifications</p>
                    )}
                    {notifications.map((n) => (
                      <div key={n.id} className="px-4 py-3 border-b last:border-0">
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: "/login" })}
              aria-label="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </header>

        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
