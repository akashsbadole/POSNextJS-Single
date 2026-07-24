"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { SearchInput } from "@/components/ui/search-input";
import {
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
  Receipt,
  Barcode,
  User,
  Pill,
  Printer,
  X,
  Loader2,
} from "lucide-react";

interface CartItem {
  id: string;
  medicineId: string;
  name: string;
  genericName: string;
  price: number;
  quantity: number;
  gstRate: number;
  batch: string;
}

interface Medicine {
  id: string;
  name: string;
  genericName: string;
  sellingPrice: number;
  gstRate: number;
  inventories: { batches: { batchNumber: string }[] }[];
}

export default function POSPage() {
  const { data: session } = useSession();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentMode, setPaymentMode] = useState<"cash" | "card" | "upi" | "credit">("cash");
  const [discountType, setDiscountType] = useState<"none" | "percentage" | "flat">("none");
  const [discountValue, setDiscountValue] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/medicines?limit=50")
      .then((r) => r.json())
      .then((data) => setMedicines(data.medicines))
      .catch(() => toast.error("Failed to load medicines"))
      .finally(() => setLoading(false));
  }, []);

  const addToCart = (med: Medicine) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === med.id);
      if (existing) {
        return prev.map((item) =>
          item.id === med.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      const batch = med.inventories?.[0]?.batches?.[0]?.batchNumber || "N/A";
      return [...prev, { id: med.id, medicineId: med.id, name: med.name, genericName: med.genericName, price: med.sellingPrice, quantity: 1, gstRate: med.gstRate, batch }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let discountAmount = 0;
  if (discountType === "percentage") {
    discountAmount = (subtotal * discountValue) / 100;
  } else if (discountType === "flat") {
    discountAmount = discountValue;
  }

  const taxableAmount = subtotal - discountAmount;
  const totalGST = cart.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    return sum + (itemTotal * item.gstRate) / 100;
  }, 0);

  const totalAmount = taxableAmount + totalGST;
  const roundOff = Math.round(totalAmount) - totalAmount;
  const finalAmount = Math.round(totalAmount);

  const filteredMedicines = medicines.filter(
    (med) =>
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.genericName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGenerateInvoice = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            medicineId: item.medicineId,
            quantity: item.quantity,
          })),
          paymentMode,
          discountType: discountType === "none" ? undefined : discountType,
          discountValue: discountType === "none" ? undefined : discountValue,
          branchId: session?.user?.branchId || "",
          cashierId: session?.user?.id || "",
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create sale");
      }
      toast.success("Invoice generated successfully!");
      setCart([]);
      setDiscountType("none");
      setDiscountValue(0);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Sale failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      <div className="flex-1 flex flex-col border-r border-gray-200 dark:border-gray-700">
         <div className="p-4 border-b border-gray-200 dark:border-gray-700">
           <div className="flex items-center gap-4">
             <div className="flex-1">
               <SearchInput
                 searchValue={searchQuery}
                 onSearch={(value) => setSearchQuery(value)}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Search medicines..."
               />
             </div>
             <Button variant="outline" size="icon" aria-label="Scan barcode">
               <Barcode className="w-4 h-4" />
             </Button>
             <Button variant="outline" size="icon" aria-label="User">
               <User className="w-4 h-4" />
             </Button>
           </div>
         </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" />
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMedicines.map((med) => (
                <Card
                  key={med.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => addToCart(med)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-lg bg-pharmacy-100 dark:bg-pharmacy-900/20 flex items-center justify-center flex-shrink-0">
                        <Pill className="w-5 h-5 text-pharmacy-600" />
                      </div>
                      <Badge variant="secondary" className="text-xs">GST {med.gstRate}%</Badge>
                    </div>
                    <h3 className="font-medium text-sm mt-3 truncate">{med.name}</h3>
                    <p className="text-xs text-gray-500">{med.genericName}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-bold text-pharmacy-600">₹{med.sellingPrice.toFixed(2)}</span>
                       <Button size="sm" variant="ghost" className="h-8 w-8 p-0" aria-label="Add">
                         <Plus className="w-4 h-4" />
                       </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-[420px] flex flex-col bg-white dark:bg-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
               <ShoppingCart className="w-5 h-5" />
               <h2 className="font-semibold">Cart ({cart.length} items)</h2>
             </div>
             <Button variant="ghost" size="sm" onClick={() => setCart([])} aria-label="Clear cart">
               <X className="w-4 h-4" />
             </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Your cart is empty</p>
              <p className="text-sm">Click on medicines to add them</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">Batch: {item.batch}</p>
                  <p className="text-xs text-gray-500">₹{item.price.toFixed(2)} × {item.quantity}</p>
                </div>
                 <div className="flex items-center gap-2">
                   <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, -1)} aria-label="Decrease quantity">
                     <Minus className="w-3 h-3" />
                   </Button>
                   <span className="w-8 text-center font-medium">{item.quantity}</span>
                   <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, 1)} aria-label="Increase quantity">
                     <Plus className="w-3 h-3" />
                   </Button>
                   <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => removeFromCart(item.id)} aria-label="Delete">
                     <Trash2 className="w-3 h-3" />
                   </Button>
                 </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="discount-type" className="text-sm font-medium">Discount</label>
            <div className="flex gap-2">
              <select
                id="discount-type"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as "none" | "percentage" | "flat")}
              >
                <option value="none">None</option>
                <option value="percentage">%</option>
                <option value="flat">₹</option>
              </select>
              {discountType !== "none" && (
                <Input
                  id="discount-value"
                  type="number"
                  placeholder="Value"
                  className="w-24"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Mode</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: "cash", label: "Cash", icon: Banknote },
                { id: "card", label: "Card", icon: CreditCard },
                { id: "upi", label: "UPI", icon: Smartphone },
                { id: "credit", label: "Credit", icon: Receipt },
              ].map((mode) => (
                <Button
                  key={mode.id}
                  variant={paymentMode === mode.id ? "default" : "outline"}
                  size="sm"
                  className="flex-col h-16 gap-1"
                  onClick={() => setPaymentMode(mode.id as "cash" | "card" | "upi" | "credit")}
                >
                  <mode.icon className="w-4 h-4" />
                  <span className="text-xs">{mode.label}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Taxable Amount</span>
              <span>₹{taxableAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">GST</span>
              <span>₹{totalGST.toFixed(2)}</span>
            </div>
            {roundOff !== 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Round Off</span>
                <span>₹{roundOff.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span>₹{finalAmount.toFixed(2)}</span>
            </div>
          </div>

          <Button className="w-full h-12 text-lg" disabled={cart.length === 0 || submitting} onClick={handleGenerateInvoice}>
            {submitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Receipt className="w-5 h-5 mr-2" />}
            {submitting ? "Processing..." : "Generate Invoice"}
          </Button>
          <Button variant="outline" className="w-full" disabled={cart.length === 0}>
            <Printer className="w-4 h-4 mr-2" />
            Print Bill
          </Button>
        </div>
      </div>
    </div>
  );
}
