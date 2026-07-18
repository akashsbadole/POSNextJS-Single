"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, Eye, Package, Truck, CheckCircle2, XCircle } from "lucide-react";

const sampleOrders = [
  { id: "1", orderNumber: "ORD-001", customer: "Rahul Sharma", items: 3, total: 549.00, status: "DELIVERED", payment: "PAID", date: "2025-12-15" },
  { id: "2", orderNumber: "ORD-002", customer: "Priya Patel", items: 2, total: 360.00, status: "SHIPPED", payment: "PAID", date: "2025-12-14" },
  { id: "3", orderNumber: "ORD-003", customer: "Amit Kumar", items: 5, total: 1240.00, status: "PROCESSING", payment: "PENDING", date: "2025-12-13" },
  { id: "4", orderNumber: "ORD-004", customer: "Sneha Gupta", items: 1, total: 180.00, status: "CANCELLED", payment: "REFUNDED", date: "2025-12-12" },
];

export default function OnlineOrdersPage() {
  const statusVariant: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
    DELIVERED: "success", SHIPPED: "warning", PROCESSING: "secondary", CANCELLED: "destructive",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Online Orders</h1>
        <p className="text-gray-500">Manage customer orders from the online store</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: "156", icon: ShoppingCart },
          { label: "Pending", value: "12", icon: Package },
          { label: "Shipped", value: "8", icon: Truck },
          { label: "Delivered", value: "134", icon: CheckCircle2 },
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleOrders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.orderNumber}</TableCell>
                  <TableCell>{o.customer}</TableCell>
                  <TableCell>{o.items}</TableCell>
                  <TableCell>₹{o.total.toFixed(2)}</TableCell>
                  <TableCell><Badge variant={o.payment === "PAID" ? "success" : "warning"}>{o.payment}</Badge></TableCell>
                  <TableCell><Badge variant={statusVariant[o.status] || "secondary"}>{o.status}</Badge></TableCell>
                  <TableCell className="text-xs">{o.date}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="w-8 h-8"><Eye className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
