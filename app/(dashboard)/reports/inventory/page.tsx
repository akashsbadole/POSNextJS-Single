"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, AlertTriangle, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { Medicine } from "@/types";

export default function InventoryReportsPage() {
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  useEffect(() => {
    fetch("/api/medicines?limit=50")
      .then((r) => r.json())
      .then((d) => setMedicines(d.medicines || []))
      .catch(() => toast.error("Failed to load inventory data"))
      .finally(() => setLoading(false));
  }, []);

  const totalStock = medicines.reduce((s, m) =>
    s + (m.inventories || []).reduce((si, i) => si + (i.quantity || 0), 0), 0);
  const totalValue = medicines.reduce((s, m) =>
    s + (m.inventories || []).reduce((si, i) => si + (i.quantity || 0) * (m.purchasePrice || 0), 0), 0);
  const lowStock = medicines.filter((m) =>
    (m.inventories || []).reduce((s, i) => s + (i.quantity || 0), 0) <= 10);
  const expiringSoon = medicines.filter((m) =>
    (m.inventories || []).some((i) =>
      (i.batches || []).some((b) => {
        if (!b.expiryDate) return false;
        const days = (new Date(b.expiryDate).getTime() - Date.now()) / 86400000;
        return days >= 0 && days <= 30;
      })
    )
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory Reports</h1>
          <p className="text-gray-500">Stock valuation, movement, and analysis</p>
        </div>
        <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Export</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-500">Total Items</p>
                <p className="text-2xl font-bold mt-1">{medicines.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-500">Total Stock (units)</p>
                <p className="text-2xl font-bold mt-1">{totalStock}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-500">Inventory Value</p>
                <p className="text-2xl font-bold mt-1">₹{totalValue.toLocaleString("en-IN")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className={`p-6 ${lowStock.length > 0 ? "bg-red-50 dark:bg-red-900/10" : ""}`}>
                <p className="text-sm text-gray-500">Low Stock Items</p>
                <p className="text-2xl font-bold mt-1 text-red-600">{lowStock.length}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Low Stock Alert</CardTitle></CardHeader>
              <CardContent>
                {lowStock.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">All items adequately stocked</p>
                ) : (
                  <div className="space-y-2">
                    {lowStock.slice(0, 5).map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-2 rounded bg-red-50">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span className="text-sm">{m.name}</span>
                        </div>
                        <Badge variant="destructive">
                          {m.inventories!.reduce((s, i) => s + i.quantity, 0)} units
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Expiring Soon (30 days)</CardTitle></CardHeader>
              <CardContent>
                {expiringSoon.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No items expiring soon</p>
                ) : (
                  <div className="space-y-2">
                    {expiringSoon.slice(0, 5).map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-2 rounded bg-amber-50">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-amber-500" />
                          <span className="text-sm">{m.name}</span>
                        </div>
                        <Badge variant="warning">Expiring</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
