"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchInput } from "@/components/ui/search-input";
import {
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
  const [viewSale, setViewSale] = useState<Sale | null>(null);

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
    <>
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
          <SearchInput
            searchValue={search}
            onSearch={(value) => { setSearch(value); setPage(1); }}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by invoice no. or patient..."
          />
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
                          <Button variant="ghost" size="icon" className="w-8 h-8" aria-label="View" onClick={() => setViewSale(s)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-8 h-8" aria-label="Print" onClick={() => { const w = window.open("", "_blank"); if (!w) return; w.document.write(getInvoiceHTML(s)); w.document.close(); w.print(); }}>
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-8 h-8" aria-label="Download" onClick={() => { const w = window.open("", "_blank"); if (!w) return; w.document.write(getInvoiceHTML(s)); w.document.close(); setTimeout(() => w.print(), 500); }}>
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
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      {viewSale && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setViewSale(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl space-y-4 max-h-screen overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Invoice #{viewSale.invoiceNumber}</h3>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => { const w = window.open("", "_blank"); if (!w) return; w.document.write(getInvoiceHTML(viewSale)); w.document.close(); w.print(); }}>
                  <Printer className="w-4 h-4 mr-1" />Print
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setViewSale(null)}>X</Button>
              </div>
            </div>
            <div id="invoice-content" className="text-sm space-y-3">
              <div className="border-b pb-3 text-center">
                <h2 className="text-xl font-bold">PharmacyPro</h2>
                <p className="text-gray-500">GST Invoice</p>
                <p className="font-mono text-xs">{viewSale.invoiceNumber}</p>
              </div>
              <div className="flex justify-between text-xs">
                <div>
                  <p><span className="font-medium">Patient:</span> {viewSale.patient?.name || "Walk-in"}</p>
                  <p><span className="font-medium">Date:</span> {new Date(viewSale.createdAt).toLocaleDateString("en-IN")}</p>
                </div>
                <div className="text-right">
                  <p><span className="font-medium">Cashier:</span> {viewSale.cashier.name}</p>
                  <p><span className="font-medium">Payment:</span> {viewSale.paymentMode}</p>
                </div>
              </div>
              <table className="w-full text-xs border-collapse">
                <thead><tr className="border-b"><th className="text-left py-1">Item</th><th className="text-right py-1">Qty</th><th className="text-right py-1">Total</th></tr></thead>
                <tbody>
                  {viewSale.items.map((it, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-1">{it.medicine.name}</td>
                      <td className="text-right py-1">{it.quantity}</td>
                      <td className="text-right py-1">—</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-right text-lg font-bold pt-2">₹{viewSale.finalAmount.toLocaleString("en-IN")}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getInvoiceHTML(s: Sale): string {
  const items = s.items.map((it, i) => `<tr${i % 2 ? ' style="background:#f9fafb"' : ""}><td style="padding:6px">${it.medicine.name}</td><td style="padding:6px;text-align:right">${it.quantity}</td><td style="padding:6px;text-align:right">—</td></tr>`).join("");
  return `<html><head><title>Invoice</title><style>body{font-family:sans-serif;padding:40px;max-width:700px;margin:auto}table{width:100%;border-collapse:collapse}th,td{padding:8px;border-bottom:1px solid #ddd}th{text-align:left}.right{text-align:right}.center{text-align:center}.header{margin-bottom:20px}@media print{body{padding:20px}}</style></head><body>
    <div class="header center"><h1>PharmacyPro</h1><p style="color:#666">GST Invoice</p><p style="font-family:monospace;font-size:13px">${s.invoiceNumber}</p></div>
    <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:20px">
      <div><strong>Patient:</strong> ${s.patient?.name || "Walk-in"}<br/><strong>Date:</strong> ${new Date(s.createdAt).toLocaleDateString("en-IN")}</div>
      <div style="text-align:right"><strong>Cashier:</strong> ${s.cashier.name}<br/><strong>Payment:</strong> ${s.paymentMode}</div>
    </div>
    <table><thead><tr><th>Item</th><th class="right">Qty</th><th class="right">Total</th></tr></thead><tbody>${items}</tbody></table>
    <div style="text-align:right;font-size:20px;font-weight:bold;margin-top:16px">₹${s.finalAmount.toLocaleString("en-IN")}</div>
  </body></html>`;
}
