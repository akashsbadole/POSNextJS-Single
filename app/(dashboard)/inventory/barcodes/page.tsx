"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Printer } from "lucide-react";

type Medicine = {
  id: string;
  name: string;
  genericName: string;
  barcode: string | null;
  qrCode: string | null;
  sellingPrice: number;
  category: { name: string };
};

export default function BarcodesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/inventory/barcodes?limit=100`)
      .then((r) => r.json())
      .then((d) => { setMedicines(d.medicines || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handlePrint = () => window.print();

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Barcode & QR Labels</h1>
          <p className="text-gray-500">Print barcode/QR labels for medicines</p>
        </div>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />Print Labels
        </Button>
      </div>

      <div className="max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search medicines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-12">Loading...</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {medicines
            .filter((m) => {
              if (!search) return true;
              const q = search.toLowerCase();
              return m.name.toLowerCase().includes(q) || m.genericName.toLowerCase().includes(q);
            })
            .map((m) => (
              <Card key={m.id} className="p-4 flex flex-col items-center gap-2">
                <p className="text-sm font-medium text-center leading-tight">{m.name}</p>
                <p className="text-xs text-gray-500">{m.category.name}</p>
                {m.barcode && (
                  <div className="mt-2 text-center">
                    <div className="text-2xl font-mono tracking-widest bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {m.barcode}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Barcode</p>
                  </div>
                )}
                {m.qrCode && (
                  <div className="mt-2 text-center">
                    <Image
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(m.qrCode)}`}
                      alt="QR"
                      width={80}
                      height={80}
                      className="w-20 h-20"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">QR Code</p>
                  </div>
                )}
                <p className="text-xs font-semibold">₹{m.sellingPrice.toFixed(2)}</p>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
