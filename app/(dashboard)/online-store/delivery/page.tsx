"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { MapPin, Clock, Truck, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Delivery { id: string; order: string; trackingNumber: string | null; status: string; address: string; eta: string; items: number; }

export default function DeliveryPage() {
  const [search, setSearch] = useState("");
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams({ search });
    fetch(`/api/online-store/delivery?${qs.toString()}`)
      .then((r) => r.json())
      .then((d) => setDeliveries(d.deliveries || []))
      .catch(() => toast.error("Failed to load deliveries"))
      .finally(() => setLoading(false));
  }, [search]);

  const markDelivered = async (id: string) => {
    try {
      const res = await fetch("/api/online-store/delivery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "DELIVERED" }),
      });
      if (res.ok) {
        toast.success("Marked delivered");
        setDeliveries((prev) => prev.map((d) => d.id === id ? { ...d, status: "DELIVERED" } : d));
      } else toast.error("Update failed");
    } catch { toast.error("Update failed"); }
  };

  const statusVariant: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
    DELIVERED: "success", OUT_FOR_DELIVERY: "warning", PROCESSING: "secondary",
    SHIPPED: "warning", CANCELLED: "destructive", PENDING: "secondary",
  };

  const progress = (status: string) =>
    status === "DELIVERED" ? "w-full" : status === "OUT_FOR_DELIVERY" || status === "SHIPPED" ? "w-3/4" : "w-1/3";

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Delivery Tracking</h1>
        <p className="text-gray-500">Track and manage deliveries</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <SearchInput
            searchValue={search}
            onSearch={(value) => setSearch(value)}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order or tracking number..."
          />
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" /></div>
      ) : deliveries.length === 0 ? (
        <Card><CardContent className="text-center py-12 text-gray-500">No deliveries found</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {deliveries.map((d) => (
            <Card key={d.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-xs text-gray-500">{d.order}{d.trackingNumber ? ` · ${d.trackingNumber}` : ""}</p>
                    <h3 className="font-medium mt-1">{d.items} item(s)</h3>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{d.address || "—"}</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" />{d.eta}</p>
                  </div>
                  <Badge variant={statusVariant[d.status] || "secondary"}>
                    <Truck className="w-3 h-3 mr-1" />{d.status}
                  </Badge>
                </div>
                {d.status !== "DELIVERED" && (
                  <>
                    <div className="mt-4">
                      <div className="h-2 rounded-full bg-gray-200">
                        <div className={`h-2 rounded-full bg-pharmacy-500 ${progress(d.status)}`} />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Ordered</span><span>Packed</span><span>Shipped</span><span>Delivered</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => markDelivered(d.id)}>
                      <CheckCircle2 className="w-4 h-4 mr-1" />Mark Delivered
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
