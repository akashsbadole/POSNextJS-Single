"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Trash2, Minus, Plus, ArrowLeft, CreditCard } from "lucide-react";
import Link from "next/link";

export default function CartPage() {
  const [items, setItems] = useState([
    { id: "1", name: "Paracetamol 500mg", price: 24.50, quantity: 2 },
    { id: "2", name: "Vitamin C 1000mg", price: 180.00, quantity: 1 },
  ]);

  const updateQty = (id: string, delta: number) => {
    setItems((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const q = Math.max(0, item.quantity + delta);
      return q === 0 ? { ...item, quantity: 1 } : { ...item, quantity: q };
    }));
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shopping Cart</h1>
          <p className="text-gray-500">{items.length} item(s) in your cart</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/online-store/products"><ArrowLeft className="w-4 h-4 mr-2" />Continue Shopping</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-pharmacy-50 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-pharmacy-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-pharmacy-600 font-semibold">₹{item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQty(item.id, -1)}>
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQty(item.id, 1)}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <p className="font-bold w-20 text-right">₹{(item.price * item.quantity).toFixed(2)}</p>
                <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500" onClick={() => removeItem(item.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
          {items.length === 0 && (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Your cart is empty</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/online-store/products">Browse Products</Link>
              </Button>
            </div>
          )}
        </div>

        <div>
          <Card>
            <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₹{total.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className="text-green-600">Free</span></div>
                <div className="flex justify-between"><span className="text-gray-500">GST (5%)</span><span>₹{(total * 0.05).toFixed(2)}</span></div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span><span>₹{(total * 1.05).toFixed(2)}</span>
                </div>
              </div>
              <Button className="w-full" disabled={items.length === 0}>
                <CreditCard className="w-4 h-4 mr-2" />Proceed to Checkout
              </Button>
              <div className="text-xs text-gray-400 text-center">
                Delivery within 2-4 business days
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
