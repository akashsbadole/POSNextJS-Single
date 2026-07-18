"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Undo2, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface SaleReturn {
  id: string; returnNumber: string; reason: string;
  refundAmount: number; refundMode: string; status: string;
  createdAt: string;
  sale: { invoiceNumber: string };
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState<SaleReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/sales/returns?page=${page}&limit=20`)
      .then((r) => r.json())
      .then((d) => { setReturns(d.returns); setTotalPages(d.pagination.totalPages); })
      .catch(() => toast.error("Failed to load returns"))
      .finally(() => setLoading(false));
  }, [page]);

  const statusVariant: Record<string, "warning" | "success" | "destructive"> = {
    PENDING: "warning", APPROVED: "success", REJECTED: "destructive",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales Returns</h1>
          <p className="text-gray-500">Manage returned items and refunds</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/sales/invoices"><ArrowLeft className="w-4 h-4 mr-1" />Invoices</Link>
          </Button>
          <Button size="sm"><Undo2 className="w-4 h-4 mr-2" />New Return</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Return Requests</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" /></div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Return #</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Refund</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returns.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.returnNumber}</TableCell>
                      <TableCell className="font-mono text-xs">{r.sale.invoiceNumber}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{r.reason}</TableCell>
                      <TableCell className="font-medium">₹{r.refundAmount.toFixed(2)}</TableCell>
                      <TableCell className="capitalize">{r.refundMode}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[r.status] || "secondary"}>{r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{new Date(r.createdAt).toLocaleDateString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                  {returns.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No returns found</TableCell></TableRow>
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
