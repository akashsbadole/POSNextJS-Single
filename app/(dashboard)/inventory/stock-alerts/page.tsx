"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Search,
  AlertTriangle,
  Loader2,
  Package,
} from "lucide-react";
import { toast } from "sonner";

interface InventoryItem {
  id: string;
  quantity: number;
  medicine: {
    id: string;
    name: string;
    genericName: string;
    sellingPrice: number;
  };
  batches: { batchNumber: string; expiryDate: string; quantity: number }[];
}

export default function StockAlertsPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/inventory?lowStock=true&limit=50")
      .then((r) => r.json())
      .then((data) => setItems(data.inventory || []))
      .catch(() => toast.error("Failed to load stock alerts"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter(
    (i) => i.medicine.name.toLowerCase().includes(search.toLowerCase()) ||
      i.medicine.genericName.toLowerCase().includes(search.toLowerCase())
  );

  const LOW_THRESHOLD = 10;
  const CRITICAL_THRESHOLD = 5;

  const getAlertLevel = (item: InventoryItem) => {
    if (item.quantity === 0) return "out";
    if (item.quantity <= CRITICAL_THRESHOLD) return "critical";
    if (item.quantity <= LOW_THRESHOLD) return "low";
    return "ok";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stock Alerts</h1>
          <p className="text-gray-500 dark:text-gray-400">Items below reorder level</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <Package className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search medicines..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Low Stock Items</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Batches</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => {
                  const level = getAlertLevel(item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {level === "critical" || level === "out" ? (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          )}
                          <div>
                            <p className="font-medium">{item.medicine.name}</p>
                            <p className="text-xs text-gray-500">{item.medicine.genericName}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-bold ${
                          level === "out" ? "text-red-600" :
                          level === "critical" ? "text-red-500" :
                          "text-amber-600"
                        }`}>
                          {item.quantity}
                        </span>
                      </TableCell>
                      <TableCell>₹{item.medicine.sellingPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-xs">{item.batches.length} batch(es)</TableCell>
                      <TableCell>
                        <Badge variant={
                          level === "ok" ? "success" :
                          level === "low" ? "warning" : "destructive"
                        }>
                          {level === "out" ? "Out of Stock" :
                           level === "critical" ? "Critical" :
                           level === "low" ? "Low Stock" : "In Stock"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      {search ? "No matching items found" : "All items are adequately stocked"}
                    </TableCell>
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
