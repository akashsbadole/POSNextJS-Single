"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface PurchaseOrder {
  id: string; poNumber: string; status: string; totalAmount: number; subtotal: number;
  createdAt: string;
  supplier: { name: string };
}

export default function PaymentsPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/purchases?page=${page}&limit=20`)
      .then((r) => r.json())
      .then((d) => { setOrders(d.orders); setTotalPages(d.pagination.totalPages); })
      .catch(() => toast.error("Failed to load payments"))
      .finally(() => setLoading(false));
  }, [page]);

  const totalPayable = orders.reduce((s, o) => s + o.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Supplier Payments</h1>
        <p className="text-gray-500">Track payments to suppliers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Total Payable</p>
            <p className="text-2xl font-bold">₹{totalPayable.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Pending Orders</p>
            <p className="text-2xl font-bold">{orders.filter((o) => o.status !== "RECEIVED").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold">{orders.filter((o) => o.status === "RECEIVED").length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
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
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.poNumber}</TableCell>
                      <TableCell>{o.supplier.name}</TableCell>
                      <TableCell className="font-medium">₹{o.totalAmount.toLocaleString("en-IN")}</TableCell>
                      <TableCell>
                        <Badge variant={o.status === "RECEIVED" ? "success" : o.status === "APPROVED" ? "warning" : "secondary"}>
                          {o.status === "RECEIVED" ? "Paid" : o.status === "APPROVED" ? "Pending" : o.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{new Date(o.createdAt).toLocaleDateString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                  {orders.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No payments found</TableCell></TableRow>
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
