"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, Package, Truck, CheckCircle2, Loader2 } from "lucide-react";

interface Order {
  id: string; orderNumber: string; status: string; paymentStatus: string;
  totalAmount: number; createdAt: string;
  customer: { name: string | null; email: string | null };
  items: { quantity: number; medicine: { name: string } | null }[];
}

const statusVariant: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  DELIVERED: "success", OUT_FOR_DELIVERY: "warning", PROCESSING: "secondary",
  SHIPPED: "warning", CANCELLED: "destructive", PENDING: "secondary",
};

export default function OnlineOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/online-store/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total = orders.length;
  const pending = orders.filter((o) => o.status === "PROCESSING" || o.status === "PENDING").length;
  const shipped = orders.filter((o) => o.status === "SHIPPED" || o.status === "OUT_FOR_DELIVERY").length;
  const delivered = orders.filter((o) => o.status === "DELIVERED").length;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Online Orders</h1>
        <p className="text-gray-500">Manage customer orders from the online store</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: total, icon: ShoppingCart },
          { label: "Pending", value: pending, icon: Package },
          { label: "Shipped", value: shipped, icon: Truck },
          { label: "Delivered", value: delivered, icon: CheckCircle2 },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{s.label}</p>
                <s.icon className="w-5 h-5 text-pharmacy-500" />
              </div>
              <p className="text-2xl font-bold mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" /></div>
          ) : orders.length === 0 ? (
            <p className="text-center py-12 text-gray-500">No orders yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">{o.orderNumber}</TableCell>
                    <TableCell>{o.customer.name || o.customer.email}</TableCell>
                    <TableCell>{o.items.reduce((s, i) => s + i.quantity, 0)}</TableCell>
                    <TableCell>₹{o.totalAmount.toLocaleString("en-IN")}</TableCell>
                    <TableCell><Badge variant={o.paymentStatus === "PAID" ? "success" : "warning"}>{o.paymentStatus}</Badge></TableCell>
                    <TableCell><Badge variant={statusVariant[o.status] || "secondary"}>{o.status}</Badge></TableCell>
                    <TableCell className="text-xs">{new Date(o.createdAt).toLocaleDateString("en-IN")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
