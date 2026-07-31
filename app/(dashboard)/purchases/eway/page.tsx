"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface PO {
  id: string; poNumber: string; status: string; totalAmount: number;
  transporterName: string | null; transporterVehicleNo: string | null;
  distanceKm: number | null; ewayBillNo: string | null; ewayBillExpiry: string | null;
  supplier: { name: string };
}

interface Draft { transporterName: string; transporterVehicleNo: string; distanceKm: string; ewayBillNo: string; ewayBillExpiry: string }

export default function EwayPage() {
  const [pos, setPos] = useState<PO[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/purchases?status=RECEIVED&limit=100");
      const d = await r.json();
      setPos((d.orders || []).filter((p: PO) => p.status === "RECEIVED"));
    } catch { toast.error("Failed to load purchase orders"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const draftFor = (p: PO): Draft => drafts[p.id] || {
    transporterName: p.transporterName || "",
    transporterVehicleNo: p.transporterVehicleNo || "",
    distanceKm: p.distanceKm != null ? String(p.distanceKm) : "",
    ewayBillNo: p.ewayBillNo || "",
    ewayBillExpiry: p.ewayBillExpiry ? p.ewayBillExpiry.slice(0, 10) : "",
  };

  const save = async (id: string) => {
    const d = draftFor(pos.find((p) => p.id === id)!);
    setSavingId(id);
    try {
      const res = await fetch(`/api/purchases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "eway", ...d }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("E-way details saved");
      setDrafts((prev) => { const n = { ...prev }; delete n[id]; return n; });
      const updated = await res.json();
      setPos((prev) => prev.map((p) => p.id === id ? { ...p, ...updated } : p));
    } catch { toast.error("Failed to save e-way details"); }
    finally { setSavingId(null); }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">E-Way Bills</h1>
        <p className="text-gray-500">Transporter and e-way bill details for received purchase orders</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO</TableHead><TableHead>Supplier</TableHead>
                  <TableHead>Transporter</TableHead><TableHead>Vehicle No</TableHead><TableHead>Distance (km)</TableHead>
                  <TableHead>E-Way Bill No</TableHead><TableHead>Valid Till</TableHead><TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pos.map((p) => {
                  const d = draftFor(p);
                  const hasEway = !!p.ewayBillNo;
                  const dirty = d.transporterName !== (p.transporterName || "") || d.transporterVehicleNo !== (p.transporterVehicleNo || "")
                    || d.distanceKm !== (p.distanceKm != null ? String(p.distanceKm) : "") || d.ewayBillNo !== (p.ewayBillNo || "")
                    || d.ewayBillExpiry !== (p.ewayBillExpiry ? p.ewayBillExpiry.slice(0, 10) : "");
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.poNumber}</TableCell>
                      <TableCell className="text-sm">{p.supplier.name}</TableCell>
                      <TableCell><Input className="w-36 h-8" value={d.transporterName} onChange={(e) => setDrafts({ ...drafts, [p.id]: { ...d, transporterName: e.target.value } })} /></TableCell>
                      <TableCell><Input className="w-28 h-8" placeholder="MH-01-AB-1234" value={d.transporterVehicleNo} onChange={(e) => setDrafts({ ...drafts, [p.id]: { ...d, transporterVehicleNo: e.target.value } })} /></TableCell>
                      <TableCell><Input className="w-20 h-8" type="number" min={0} value={d.distanceKm} onChange={(e) => setDrafts({ ...drafts, [p.id]: { ...d, distanceKm: e.target.value } })} /></TableCell>
                      <TableCell><Input className="w-32 h-8" value={d.ewayBillNo} onChange={(e) => setDrafts({ ...drafts, [p.id]: { ...d, ewayBillNo: e.target.value } })} /></TableCell>
                      <TableCell>
                        <Input className="w-32 h-8" type="date" value={d.ewayBillExpiry} onChange={(e) => setDrafts({ ...drafts, [p.id]: { ...d, ewayBillExpiry: e.target.value } })} />
                      </TableCell>
                      <TableCell className="space-y-1">
                        {hasEway && <Badge variant="success">Filed</Badge>}
                        <Button size="sm" variant="outline" disabled={!dirty || savingId === p.id} onClick={() => save(p.id)}>
                          {savingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {pos.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-500">No received orders awaiting e-way details</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
