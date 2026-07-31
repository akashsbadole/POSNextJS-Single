"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Download } from "lucide-react";
import { toast } from "sonner";

type Tab = "gstr1" | "gstr2a" | "licenses";

export default function GSTCompliancePage() {
  const [tab, setTab] = useState<Tab>("gstr1");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ report: tab });
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const r = await fetch(`/api/compliance?${params}`);
      if (!r.ok) throw new Error("Failed to load");
      setData(await r.json());
    } catch { toast.error("Failed to load compliance data"); }
    finally { setLoading(false); }
  }, [tab, startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  const download = () => {
    const params = new URLSearchParams({ report: tab, format: "csv" });
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    window.location.href = `/api/compliance?${params}`;
  };

  const summary = (data?.summary as { rate: number; taxable: number; cgst: number; sgst: number; total: number }[]) || [];
  const invoices = (data?.invoices as { invoiceNumber: string; date: string; taxableAmount: number; total: number; mode: string }[]) || [];
  const purchases = (data?.purchases as { poNumber: string; date: string; supplier: string; gstin: string; taxable: number }[]) || [];
  const licenses = (data?.licenses as { licenseNumber: string; licenseType: string; holderName: string; issuingAuthority: string | null; expiryDate: string; daysUntilExpiry: number; expiringSoon: boolean; expired: boolean }[]) || [];
  const branch = data?.branch as { gstin?: string | null; name?: string } | null;

  const tabs: { key: Tab; label: string }[] = [
    { key: "gstr1", label: "GSTR-1 (Sales)" },
    { key: "gstr2a", label: "GSTR-2A (Purchases)" },
    { key: "licenses", label: "Licenses" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">GST Compliance</h1>
          <p className="text-gray-500">{branch ? `${branch.name} · GSTIN ${branch.gstin || "—"}` : "Rate-wise registers from invoices"}</p>
        </div>
        <div className="flex gap-2 items-end">
          <div>
            <label className="text-sm font-medium block mb-1">From</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">To</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
          </div>
          <Button onClick={load}>Apply</Button>
          <Button variant="outline" onClick={download}><Download className="w-4 h-4 mr-1" />CSV</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Button key={t.key} variant={tab === t.key ? "default" : "outline"} size="sm" onClick={() => setTab(t.key)}>
            {t.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" /></div>
      ) : (
        <>
          {(tab === "gstr1" || tab === "gstr2a") && (
            <Card>
              <CardHeader><CardTitle>Rate-wise Summary</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rate</TableHead><TableHead>Taxable</TableHead>
                      <TableHead className="text-right">CGST</TableHead><TableHead className="text-right">SGST</TableHead><TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.map((r) => (
                      <TableRow key={r.rate}>
                        <TableCell className="font-medium">{r.rate}%</TableCell>
                        <TableCell>₹{r.taxable.toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-right">₹{r.cgst.toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-right">₹{r.sgst.toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-right">₹{r.total.toLocaleString("en-IN")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {tab === "gstr1" && (
            <Card>
              <CardHeader><CardTitle>Sales Register</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead><TableHead>Date</TableHead><TableHead>Mode</TableHead>
                      <TableHead className="text-right">Taxable</TableHead><TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((i) => (
                      <TableRow key={i.invoiceNumber}>
                        <TableCell className="font-mono text-xs">{i.invoiceNumber}</TableCell>
                        <TableCell className="text-xs">{new Date(i.date).toLocaleDateString("en-IN")}</TableCell>
                        <TableCell className="text-xs capitalize">{i.mode}</TableCell>
                        <TableCell className="text-right">₹{i.taxableAmount.toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-right">₹{i.total.toLocaleString("en-IN")}</TableCell>
                      </TableRow>
                    ))}
                    {invoices.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No invoices in range</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {tab === "gstr2a" && (
            <Card>
              <CardHeader><CardTitle>Purchase Register (ITC eligible)</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO</TableHead><TableHead>Date</TableHead><TableHead>Supplier</TableHead><TableHead>GSTIN</TableHead>
                      <TableHead className="text-right">Taxable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((p) => (
                      <TableRow key={p.poNumber}>
                        <TableCell className="font-mono text-xs">{p.poNumber}</TableCell>
                        <TableCell className="text-xs">{new Date(p.date).toLocaleDateString("en-IN")}</TableCell>
                        <TableCell className="text-sm">{p.supplier}</TableCell>
                        <TableCell className="font-mono text-xs">{p.gstin || "—"}</TableCell>
                        <TableCell className="text-right">₹{p.taxable.toLocaleString("en-IN")}</TableCell>
                      </TableRow>
                    ))}
                    {purchases.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No receipts in range</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {tab === "licenses" && (
            <Card>
              <CardHeader><CardTitle>Drug Licenses</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>License No</TableHead><TableHead>Type</TableHead><TableHead>Holder</TableHead><TableHead>Authority</TableHead>
                      <TableHead>Expiry</TableHead><TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {licenses.map((l) => (
                      <TableRow key={l.licenseNumber}>
                        <TableCell className="font-mono text-xs">{l.licenseNumber}</TableCell>
                        <TableCell className="text-xs">{l.licenseType}</TableCell>
                        <TableCell>{l.holderName}</TableCell>
                        <TableCell className="text-xs">{l.issuingAuthority || "—"}</TableCell>
                        <TableCell className="text-xs">{new Date(l.expiryDate).toLocaleDateString("en-IN")} ({l.daysUntilExpiry}d)</TableCell>
                        <TableCell>
                          {l.expired ? <Badge variant="destructive">Expired</Badge> : l.expiringSoon ? <Badge variant="warning">Expiring soon</Badge> : <Badge variant="success">Valid</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                    {licenses.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No licenses found</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
