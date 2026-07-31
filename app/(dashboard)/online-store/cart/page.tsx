"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Trash2, Minus, Plus, ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { fetchServerCart, upsertCartItem, removeCartItem, clearServerCart, getLocalCart, setLocalCart, mergeCarts } from "@/lib/cart-sync";

declare global { interface Window { Razorpay?: new (opts: Record<string, unknown>) => { open: () => void }; } }

function loadRazorpay(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window.Razorpay !== "undefined") return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load payment gateway"));
    document.body.appendChild(script);
  });
}

interface CartItem { id: string; name: string; price: number; quantity: number; prescription: boolean; }

export default function CartPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  useEffect(() => {
    (async () => {
      let ids: { id: string; quantity: number }[] = getLocalCart().map((i) => ({ id: i.medicineId, quantity: i.quantity }));
      if (ids.length === 0 && session?.user?.id) {
        const serverItems = await fetchServerCart();
        ids = serverItems.map((i) => ({ id: i.medicineId, quantity: i.quantity }));
        if (ids.length > 0) setLocalCart(serverItems);
      }
      if (ids.length === 0) { setLoading(false); return; }
      const qs = new URLSearchParams({ search: "", category: "all" });
      try {
        const r = await fetch(`/api/online-store/products?${qs.toString()}&limit=100`);
        const d = await r.json();
        const map = new Map<string, { id: string; name: string; price: number; prescription: boolean }>((d.products || []).map((p: { id: string; name: string; price: number; prescription: boolean }) => [p.id, p]));
        const loaded: CartItem[] = [];
        for (const i of ids) {
          const p = map.get(i.id);
          if (p) loaded.push({ id: p.id, name: p.name, price: p.price, quantity: i.quantity, prescription: p.prescription });
        }
        setItems(loaded);
        if (session?.user?.id) for (const item of loaded) upsertCartItem(item.id, item.quantity);
      } catch { toast.error("Failed to load cart"); }
      finally { setLoading(false); }
    })();
  }, [session]);

  const persist = (next: CartItem[]) => {
    setItems(next);
    setLocalCart(next.map((i) => ({ medicineId: i.id, quantity: i.quantity })));
    if (session?.user?.id) for (const item of next) upsertCartItem(item.id, item.quantity);
  };

  const updateQty = (id: string, delta: number) =>
    persist(items.map((i) => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  const removeItem = (id: string) => {
    persist(items.filter((i) => i.id !== id));
    if (session?.user?.id) removeCartItem(id);
  };

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const gst = total * 0.05;
  const grandTotal = total + gst;

  const checkout = async () => {
    if (!session?.user?.id) { toast.error("Please sign in to checkout"); return; }
    const rx = items.find((i) => i.prescription);
    if (rx) { toast.error(`${rx.name} requires a prescription upload`); return; }
    setCheckingOut(true);
    try {
      const res = await fetch("/api/online-store/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ medicineId: i.id, quantity: i.quantity })),
          shippingAddress: address,
          shippingCity: city,
          shippingState: state,
          shippingPincode: pincode,
          paymentMode: "prepaid",
        }),
      });
      if (!res.ok) { toast.error("Checkout failed"); return; }
      const data = await res.json();

      if (!data.razorpayOrderId) {
        toast.error("Payment gateway not configured");
        return;
      }
      await loadRazorpay();
      const rp = new window.Razorpay!({
        key: data.razorpayKeyId,
        order_id: data.razorpayOrderId,
        handler: () => {
          toast.success("Payment successful! Order placed.");
          localStorage.removeItem("cart");
          setItems([]);
          clearServerCart();
        },
        modal: { ondismiss: () => setCheckingOut(false) },
      });
      rp.open();
    } catch {
      toast.error("Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
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
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" /></div>
          ) : (
            items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-pharmacy-50 flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-pharmacy-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    {item.prescription && <Badge variant="warning" className="mt-1">Rx Required</Badge>}
                    <p className="text-sm text-pharmacy-600 font-semibold">₹{item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                     <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQty(item.id, -1)} aria-label="Decrease quantity"><Minus className="w-3 h-3" /></Button>
                     <span className="w-8 text-center font-medium">{item.quantity}</span>
                     <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQty(item.id, 1)} aria-label="Increase quantity"><Plus className="w-3 h-3" /></Button>
                  </div>
                  <p className="font-bold w-20 text-right">₹{(item.price * item.quantity).toFixed(2)}</p>
                  <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500" onClick={() => removeItem(item.id)} aria-label="Delete"><Trash2 className="w-4 h-4" /></Button>
                </CardContent>
              </Card>
            ))
          )}
          {!loading && items.length === 0 && (
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
                <div className="flex justify-between"><span className="text-gray-500">GST (5%)</span><span>₹{gst.toFixed(2)}</span></div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span><span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Input placeholder="Shipping address" value={address} onChange={(e) => setAddress(e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
                  <Input placeholder="State" value={state} onChange={(e) => setState(e.target.value)} />
                </div>
                <Input placeholder="Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} />
              </div>
              <Button className="w-full" disabled={items.length === 0 || checkingOut} onClick={checkout}>
                {checkingOut ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                Proceed to Checkout
              </Button>
              <div className="text-xs text-gray-400 text-center">Delivery within 2-4 business days</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
