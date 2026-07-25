"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ClipboardCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface PO {
  id: string; poNumber: string; status: string; totalAmount: number;
  createdAt: string;
  supplier: { name: string };
  branch: { name: string; id: string };
  items: { id: string; quantity: number; receivedQty: number; unitPrice: number; medicine: { id: string; name: string } }[];
}

export default function GRNPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<PO[]>([]);
  const [history, setHistory] = useState<PO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReceive, setShowReceive] = useState<PO | null>(null);
  const [receiving, setReceiving] = useState(false);
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>({});

  const load = async () => {
    setLoading(true);
    try {
      const [pendingRes, receivedRes] = await Promise.all([
        fetch("/api/purchases?status=PENDING&limit=50"),
        fetch("/api/purchases?status=RECEIVED&limit=20"),
      ]);
      const pending = await pendingRes.json();
      const received = await receivedRes.json();
      setOrders(pending.orders?.filter((o: PO) => o.status === "PENDING") || []);
      setHistory(received.orders || []);
    } catch { toast.error("Failed to load orders"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openReceive = (po: PO) => {
    setShowReceive(po);
    const qtyMap: Record<string, number> = {};
    po.items.forEach((it) => { qtyMap[it.medicine.id] = it.quantity; });
    setReceivedQtys(qtyMap);
  };

  const handleReceive = async () => {
    if (!showReceive) return;
    setReceiving(true);
    const items = Object.entries(receivedQtys)
      .filter(([, qty]) => qty > 0)
      .map(([medicineId, quantity]) => ({ medicineId, quantity }));
    const branchId = (session?.user as { branchId?: string })?.branchId || showReceive.branch.id;
    try {
      const res = await fetch("/api/purchases/receive", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: showReceive.id, items, branchId }),
      });
      if (!res.ok) throw new Error("Failed to receive goods");
      toast.success("Goods received successfully");
      setShowReceive(null); load();
    } catch { toast.error("Failed to receive goods"); }
    finally { setReceiving(false); }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Goods Received Notes</h1>
          <p className="text-gray-500">Receive inventory from suppliers</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Pending Orders</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
          ) : orders.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No pending orders to receive</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO #</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">{o.poNumber}</TableCell>
                    <TableCell><Truck className="w-3 h-3 inline mr-1" />{o.supplier.name}</TableCell>
                    <TableCell>{o.items.length} items</TableCell>
                    <TableCell>₹{o.totalAmount.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-xs">{new Date(o.createdAt).toLocaleDateString("en-IN")}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="default" size="sm" onClick={() => openReceive(o)}>
                        <ClipboardCheck className="w-4 h-4 mr-1" />Receive
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Receiving History</CardTitle></CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No received orders yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO #</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-mono text-xs">{g.poNumber}</TableCell>
                    <TableCell>{g.supplier.name}</TableCell>
                    <TableCell>{g.items.length} items</TableCell>
                    <TableCell><Badge variant="success"><ClipboardCheck className="w-3 h-3 mr-1" />{g.status}</Badge></TableCell>
                    <TableCell className="text-xs">{new Date(g.createdAt).toLocaleDateString("en-IN")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {showReceive && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setShowReceive(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Receive Goods — {showReceive.poNumber}</h3>
            <p className="text-sm text-gray-500">Supplier: {showReceive.supplier.name}</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {showReceive.items.map((it) => (
                <div key={it.id} className="flex items-center justify-between border rounded p-2">
                  <div className="text-sm flex-1">
                    <p className="font-medium">{it.medicine.name}</p>
                    <p className="text-xs text-gray-500">Ordered: {it.quantity}</p>
                  </div>
                  <div className="w-24">
                    <label className="text-xs text-gray-500">Receive</label>
                    <Input type="number" min={0} max={it.quantity} value={receivedQtys[it.medicine.id] || 0} onChange={(e) => setReceivedQtys({ ...receivedQtys, [it.medicine.id]: Number(e.target.value) })} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowReceive(null)}>Cancel</Button>
              <Button onClick={handleReceive} disabled={receiving}>
                {receiving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Confirm Receive
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
