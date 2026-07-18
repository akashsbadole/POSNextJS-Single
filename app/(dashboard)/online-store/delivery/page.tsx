"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, MapPin, Clock, Truck, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function DeliveryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Delivery Tracking</h1>
        <p className="text-gray-500">Track and manage deliveries</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search by order or tracking number..." className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[
          { order: "ORD-001", status: "Out for Delivery", eta: "Today, 2:30 PM", items: 3, address: "123, Main Street, New Delhi" },
          { order: "ORD-002", status: "Processing", eta: "Tomorrow", items: 2, address: "456, Park Avenue, Mumbai" },
          { order: "ORD-003", status: "Delivered", eta: "Delivered yesterday", items: 5, address: "789, Lake Road, Bangalore" },
        ].map((d) => (
          <Card key={d.order}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-xs text-gray-500">{d.order}</p>
                  <h3 className="font-medium mt-1">{d.items} item(s)</h3>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{d.address}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />{d.eta}
                  </p>
                </div>
                <Badge variant={
                  d.status === "Delivered" ? "success" :
                  d.status === "Out for Delivery" ? "warning" : "secondary"
                }>
                  <Truck className="w-3 h-3 mr-1" />
                  {d.status}
                </Badge>
              </div>
              {d.status !== "Delivered" && (
                <div className="mt-4">
                  <div className="h-2 rounded-full bg-gray-200">
                    <div className={`h-2 rounded-full ${d.status === "Out for Delivery" ? "w-3/4 bg-pharmacy-500" : "w-1/3 bg-pharmacy-500"}`} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Ordered</span><span>Packed</span><span>Shipped</span><span>Delivered</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
