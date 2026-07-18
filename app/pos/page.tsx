"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
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
} from "lucide-react";

interface CartItem {
  id: string;
  name: string;
  generic: string;
  price: number;
  quantity: number;
  gstRate: number;
  batch: string;
}

const sampleMedicines = [
  { id: "1", name: "Paracetamol 500mg", generic: "Paracetamol", price: 25.50, gstRate: 5, batch: "B2024001" },
  { id: "2", name: "Amoxicillin 250mg", generic: "Amoxicillin", price: 120.00, gstRate: 12, batch: "B2024002" },
  { id: "3", name: "Vitamin D3 60K", generic: "Cholecalciferol", price: 85.00, gstRate: 5, batch: "B2024003" },
  { id: "4", name: "Cetirizine 10mg", generic: "Cetirizine", price: 15.00, gstRate: 5, batch: "B2024004" },
  { id: "5", name: "Metformin 500mg", generic: "Metformin", price: 45.00, gstRate: 12, batch: "B2024005" },
  { id: "6", name: "Amlodipine 5mg", generic: "Amlodipine", price: 55.00, gstRate: 12, batch: "B2024006" },
];

export default function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentMode, setPaymentMode] = useState<"cash" | "card" | "upi" | "credit">("cash");
  const [discountType, setDiscountType] = useState<"none" | "percentage" | "flat">("none");
  const [discountValue, setDiscountValue] = useState(0);

  const addToCart = (medicine: typeof sampleMedicines[0]) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === medicine.id);
      if (existing) {
        return prev.map((item) =>
          item.id === medicine.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...medicine, quantity: 1 }];
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

  const filteredMedicines = sampleMedicines.filter(
    (med) =>
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.generic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Left Panel - Medicine Search */}
      <div className="flex-1 flex flex-col border-r border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search medicines..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Barcode className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <User className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
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
                  <p className="text-xs text-gray-500">{med.generic}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-bold text-pharmacy-600">₹{med.price.toFixed(2)}</span>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Cart & Billing */}
      <div className="w-[420px] flex flex-col bg-white dark:bg-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <h2 className="font-semibold">Cart ({cart.length} items)</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCart([])}>
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
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.id, -1)}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.id, 1)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Billing Summary */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
          {/* Discount */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Discount</label>
            <div className="flex gap-2">
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
              >
                <option value="none">None</option>
                <option value="percentage">%</option>
                <option value="flat">₹</option>
              </select>
              {discountType !== "none" && (
                <Input
                  type="number"
                  placeholder="Value"
                  className="w-24"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                />
              )}
            </div>
          </div>

          {/* Payment Mode */}
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
                  onClick={() => setPaymentMode(mode.id as any)}
                >
                  <mode.icon className="w-4 h-4" />
                  <span className="text-xs">{mode.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Summary */}
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

          <Button className="w-full h-12 text-lg" disabled={cart.length === 0}>
            <Receipt className="w-5 h-5 mr-2" />
            Generate Invoice
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
