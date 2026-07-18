"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Search,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  Printer,
  Download,
} from "lucide-react";
import { toast } from "sonner";

interface Sale {
  id: string;
  invoiceNumber: string;
  finalAmount: number;
  paymentMode: string;
  paymentStatus: string;
  createdAt: string;
  patient: { name: string } | null;
  cashier: { name: string };
  items: { quantity: number; medicine: { name: string } }[];
}

export default function InvoicesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    fetch(`/api/sales?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setSales(data.sales);
        setTotalPages(data.pagination.totalPages);
      })
      .catch(() => toast.error("Failed to load invoices"))
      .finally(() => setLoading(false));
  }, [page, search]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "PAID": return "success" as const;
      case "PENDING": return "warning" as const;
      case "REFUNDED": return "destructive" as const;
      default: return "secondary" as const;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoices</h1>
          <p className="text-gray-500 dark:text-gray-400">View and manage sales invoices</p>
        </div>
        <Button size="sm" asChild>
          <a href="/pos">
            <Receipt className="w-4 h-4 mr-2" />
            New Sale
          </a>
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by invoice no. or patient..."
              className="pl-10"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sales Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cashier</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs font-medium">{s.invoiceNumber}</TableCell>
                      <TableCell>{s.patient?.name || "Walk-in"}</TableCell>
                      <TableCell>{s.items.reduce((sum, i) => sum + i.quantity, 0)} items</TableCell>
                      <TableCell className="font-medium">₹{s.finalAmount.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="capitalize">{s.paymentMode}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(s.paymentStatus)}>
                          {s.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{s.cashier.name}</TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {new Date(s.createdAt).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="w-8 h-8">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-8 h-8">
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-8 h-8">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sales.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        No invoices found
                      </TableCell>
                    </TableRow>
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
