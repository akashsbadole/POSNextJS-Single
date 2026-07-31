"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface InventoryRow {
  id: string; quantity: number; rack: string | null; shelf: string | null;
  medicine: { name: string; genericName: string; scheduleType: string | null };
  branch: { name: string };
}

export default function StockPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<Record<string, { rack: string; shelf: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "25" });
      if (search.trim()) params.set("q", search.trim());
      const r = await fetch(`/api/inventory?${params}`);
      const d = await r.json();
      setItems(d.inventory || []);
      setTotalPages(d.pagination?.totalPages || 1);
    } catch { toast.error("Failed to load stock"); }
    finally { setLoading(false); }
  }, [page, search]);

  // ponytail: debounce search by hand — refetch only when the input settles
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(); }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const save = async (id: string) => {
    const d = drafts[id];
    if (!d) return;
    setSavingId(id);
    try {
      const res = await fetch("/api/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, rack: d.rack.trim() || null, shelf: d.shelf.trim() || null }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Location saved");
      setDrafts((prev) => { const next = { ...prev }; delete next[id]; return next; });
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, rack: d.rack.trim() || null, shelf: d.shelf.trim() || null } : i));
    } catch { toast.error("Failed to save location"); }
    finally { setSavingId(null); }
  };

  const branchFilter = session?.user?.branchId && session?.user?.role !== "OWNER";

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Stock & Racks</h1>
        <p className="text-gray-500">Per-branch stock levels and rack/shelf locations</p>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-2">
          <Input placeholder="Search medicine..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          {branchFilter && <span className="text-xs text-gray-500 ml-auto">Showing your branch only</span>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" /></div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Rack</TableHead>
                    <TableHead>Shelf</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((i) => {
                    const d = drafts[i.id] || { rack: i.rack || "", shelf: i.shelf || "" };
                    const dirty = d.rack !== (i.rack || "") || d.shelf !== (i.shelf || "");
                    return (
                      <TableRow key={i.id}>
                        <TableCell>
                          <p className="font-medium text-sm">{i.medicine.name}</p>
                          <p className="text-xs text-gray-500">{i.medicine.genericName}{i.medicine.scheduleType ? ` · Schedule ${i.medicine.scheduleType}` : ""}</p>
                        </TableCell>
                        <TableCell className="text-xs">{i.branch.name}</TableCell>
                        <TableCell className="text-right font-medium">{i.quantity}</TableCell>
                        <TableCell>
                          <Input className="w-20 h-8" placeholder="A1" value={d.rack} onChange={(e) => setDrafts({ ...drafts, [i.id]: { ...d, rack: e.target.value } })} />
                        </TableCell>
                        <TableCell>
                          <Input className="w-20 h-8" placeholder="1" value={d.shelf} onChange={(e) => setDrafts({ ...drafts, [i.id]: { ...d, shelf: e.target.value } })} />
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" disabled={!dirty || savingId === i.id} onClick={() => save(i.id)}>
                            {savingId === i.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {items.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No stock found</TableCell></TableRow>}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
