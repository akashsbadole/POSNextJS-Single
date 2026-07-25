"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Loader2,
  ArrowRightLeft,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Transfer = {
  id: string;
  transferNumber: string;
  status: string;
  notes?: string;
  fromBranch: { name: string };
  toBranch: { name: string };
  items: { medicine: { name: string }; quantity: number; batchNumber?: string }[];
};

type Branch = { id: string; name: string };

export default function StockTransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const [fromBranch, setFromBranch] = useState("");
  const [toBranch, setToBranch] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<{ medicineId: string; quantity: number; batchNumber?: string }[]>([
    { medicineId: "", quantity: 1 },
  ]);
  const [medicines, setMedicines] = useState<{ id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/stock-transfers").then((r) => r.json()),
      fetch("/api/branches").then((r) => r.json()),
      fetch("/api/medicines?limit=100").then((r) => r.json()),
    ])
      .then(([t, b, m]) => {
        setTransfers(t.transfers || []);
        setBranches(b.branches || []);
        setMedicines(m.medicines || []);
      })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  const addItem = () => setItems([...items, { medicineId: "", quantity: 1 }]);

  const updateItem = (index: number, field: string, value: string | number) => {
    const next = [...items];
    (next[index] as Record<string, unknown>)[field] = value;
    setItems(next);
  };

  const handleCreate = async () => {
    if (!fromBranch || !toBranch) {
      toast.error("Select both branches");
      return;
    }
    const valid = items.filter((i) => i.medicineId && i.quantity > 0);
    if (valid.length === 0) {
      toast.error("Add at least one medicine");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/stock-transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromBranchId: fromBranch, toBranchId: toBranch, items: valid, notes }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      toast.success("Transfer created");
      setOpen(false);
      setFromBranch("");
      setToBranch("");
      setNotes("");
      setItems([{ medicineId: "", quantity: 1 }]);
      const data = await fetch("/api/stock-transfers").then((r) => r.json());
      setTransfers(data.transfers || []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const approveTransfer = async (id: string) => {
    try {
      const res = await fetch("/api/stock-transfers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "APPROVED" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      toast.success("Transfer approved");
      const data = await fetch("/api/stock-transfers").then((r) => r.json());
      setTransfers(data.transfers || []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "PENDING": return "warning";
      case "APPROVED": return "success";
      case "REJECTED": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stock Transfers</h1>
          <p className="text-gray-500">Move stock between branches</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" />New Transfer</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>New Stock Transfer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>From Branch</Label>
                  <Select value={fromBranch} onValueChange={setFromBranch}>
                    <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>To Branch</Label>
                  <Select value={toBranch} onValueChange={setToBranch}>
                    <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Items</Label>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="flex gap-2">
                      <Select value={item.medicineId} onValueChange={(v) => updateItem(i, "medicineId", v)}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Medicine" /></SelectTrigger>
                        <SelectContent>
                          {medicines.map((m) => (
                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 0)} className="w-24" />
                      <Input placeholder="Batch #" value={item.batchNumber || ""} onChange={(e) => updateItem(i, "batchNumber", e.target.value)} className="w-28" />
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="mt-2" onClick={addItem}>Add Item</Button>
              </div>

              <div>
                <Label>Notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
              </div>

              <Button className="w-full" onClick={handleCreate} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRightLeft className="w-4 h-4 mr-2" />}
                Create Transfer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transfer #</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.transferNumber}</TableCell>
                    <TableCell>{t.fromBranch.name}</TableCell>
                    <TableCell>{t.toBranch.name}</TableCell>
                    <TableCell>{t.items.length} item(s)</TableCell>
                    <TableCell><Badge variant={getStatusVariant(t.status)}>{t.status}</Badge></TableCell>
                    <TableCell>
                      {t.status === "PENDING" && (
                        <Button size="sm" variant="outline" onClick={() => approveTransfer(t.id)}>
                          <CheckCircle2 className="w-4 h-4 mr-1" />Approve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {transfers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">No transfers yet</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
