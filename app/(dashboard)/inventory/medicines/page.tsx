"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchInput } from "@/components/ui/search-input";
import {
  Plus,
  Filter,
  Download,
  Upload,
  Barcode,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Medicine {
  id: string;
  name: string;
  genericName: string;
  category: { name: string };
  inventories: { quantity: number; batches: { expiryDate: string }[] }[];
  mrp: number;
  sellingPrice: number;
  isActive: boolean;
  supplier: { name: string } | null;
}

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMedicines = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/medicines?${params}`);
      const data = await res.json();
      setMedicines(data.medicines);
      setTotalPages(data.pagination.totalPages);
    } catch {
      toast.error("Failed to load medicines");
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    fetchMedicines();
  }, [page, searchQuery, fetchMedicines]);

  function getStockStatus(inv: { quantity: number; batches: { expiryDate: string }[] }[]) {
    const totalStock = inv.reduce((s, i) => s + i.quantity, 0);
    if (totalStock === 0) return "out";
    if (totalStock <= 10) return "critical";
    if (totalStock <= 25) return "low";
    return "active";
  }

  function getNearestExpiry(inv: { batches: { expiryDate: string }[] }[]) {
    const dates = inv.flatMap((i) => i.batches.map((b) => b.expiryDate)).filter(Boolean);
    if (dates.length === 0) return "—";
    return dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0].split("T")[0];
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Medicines</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your medicine inventory</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Medicine
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <SearchInput
              searchValue={searchQuery}
              onSearch={(value) => { setSearchQuery(value); setPage(1); }}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Search by name or generic name..."
            />
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="sm">
              <Barcode className="w-4 h-4 mr-2" />
              Scan Barcode
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Medicine List</CardTitle>
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
                    <TableHead>Medicine</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Selling Price</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicines.map((med) => {
                    const status = getStockStatus(med.inventories);
                    const totalStock = med.inventories.reduce((s, i) => s + i.quantity, 0);
                    return (
                      <TableRow key={med.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{med.name}</p>
                            <p className="text-xs text-gray-500">{med.genericName}</p>
                          </div>
                        </TableCell>
                        <TableCell>{med.category?.name || "—"}</TableCell>
                        <TableCell>
                          <span className={`font-medium ${
                            status === "critical" || status === "out" ? "text-red-600" :
                            status === "low" ? "text-amber-600" : "text-green-600"
                          }`}>
                            {totalStock}
                          </span>
                        </TableCell>
                        <TableCell>₹{med.sellingPrice?.toFixed(2)}</TableCell>
                        <TableCell>{getNearestExpiry(med.inventories)}</TableCell>
                        <TableCell className="text-xs">{med.supplier?.name || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={
                            status === "active" ? "success" :
                            status === "low" ? "warning" :
                            status === "critical" ? "destructive" : "destructive"
                          }>
                            {status === "active" ? "In Stock" :
                             status === "low" ? "Low Stock" :
                             status === "out" ? "Out of Stock" : "Critical"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" className="w-8 h-8" aria-label="Edit">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500" aria-label="Delete">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
    </div>
  );
}
