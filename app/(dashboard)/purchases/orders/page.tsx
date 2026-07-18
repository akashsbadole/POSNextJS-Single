"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, ChevronLeft, ChevronRight, Truck } from "lucide-react";
import { toast } from "sonner";

interface PurchaseOrder {
  id: string; poNumber: string; status: string; subtotal: number; totalAmount: number;
  createdAt: string; expectedDeliveryDate: string | null;
  supplier: { name: string };
  branch: { name: string };
  createdBy: { name: string };
  items: { quantity: number; medicine: { name: string } }[];
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/purchases?page=${page}&limit=20`)
      .then((r) => r.json())
      .then((d) => { setOrders(d.orders); setTotalPages(d.pagination.totalPages); })
      .catch(() => toast.error("Failed to load purchase orders"))
      .finally(() => setLoading(false));
  }, [page]);

  const statusVariant: Record<string, "secondary" | "warning" | "success" | "destructive"> = {
    DRAFT: "secondary", PENDING: "warning", APPROVED: "success", RECEIVED: "success", CANCELLED: "destructive",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Purchase Orders</h1>
          <p className="text-gray-500">Manage supplier orders and procurement</p>
        </div>
        <Button size="sm"><Plus className="w-4 h-4 mr-2" />New Order</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Orders</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" /></div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.poNumber}</TableCell>
                      <TableCell><Truck className="w-3 h-3 inline mr-1" />{o.supplier.name}</TableCell>
                      <TableCell>{o.items.length} items</TableCell>
                      <TableCell className="font-medium">₹{o.totalAmount.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-xs">{o.branch.name}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[o.status] || "secondary"}>{o.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{o.createdBy.name}</TableCell>
                      <TableCell className="text-xs">{new Date(o.createdAt).toLocaleDateString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                  {orders.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-500">No orders found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
