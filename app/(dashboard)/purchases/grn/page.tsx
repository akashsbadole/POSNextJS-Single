"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";

// GRN data from the API doesn't have a dedicated endpoint, show from purchase orders with received status
interface GRN {
  id: string; poNumber: string; status: string; totalAmount: number;
  expectedDeliveryDate: string | null; createdAt: string;
  supplier: { name: string };
  items: { quantity: number; receivedQty: number; medicine: { name: string } }[];
}

export default function GRNPage() {
  const [grns, setGrns] = useState<GRN[]>([]);
  const [loading, setLoading] = useState(true);
  const [page] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/purchases?page=${page}&limit=20&status=RECEIVED`)
      .then((r) => r.json())
      .then((d) => { setGrns(d.orders || []); })
      .catch(() => toast.error("Failed to load GRNs"))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Goods Received Notes</h1>
          <p className="text-gray-500">Record received inventory from suppliers</p>
        </div>
        <Button size="sm"><Plus className="w-4 h-4 mr-2" />New GRN</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Receiving History</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO #</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grns.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-mono text-xs">{g.poNumber}</TableCell>
                    <TableCell>{g.supplier.name}</TableCell>
                    <TableCell>{g.items.length} items</TableCell>
                    <TableCell>₹{g.totalAmount.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-xs">{g.expectedDeliveryDate ? new Date(g.expectedDeliveryDate).toLocaleDateString("en-IN") : "—"}</TableCell>
                    <TableCell><Badge variant="success"><ClipboardCheck className="w-3 h-3 mr-1" />{g.status}</Badge></TableCell>
                    <TableCell className="text-xs">{new Date(g.createdAt).toLocaleDateString("en-IN")}</TableCell>
                  </TableRow>
                ))}
                {grns.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No received orders yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
