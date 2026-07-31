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
  discount: number;
  batch: string;
}

interface Medicine {
  id: string;
  name: string;
  genericName: string;
  barcode?: string | null;
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
  const [barcodeInput, setBarcodeInput] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState("");
  const [paymentMode, setPaymentMode] = useState<"cash" | "card" | "upi" | "credit">("cash");
  const [discountType, setDiscountType] = useState<"none" | "percentage" | "flat">("none");
  const [discountValue, setDiscountValue] = useState(0);
  const [taxInclusive, setTaxInclusive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState<{ id: string; name: string; phone: string | null }[]>([]);

  useEffect(() => {
    fetch("/api/medicines?limit=1000")
      .then((r) => r.json())
      .then((data) => setMedicines(data.medicines))
      .catch(() => toast.error("Failed to load medicines"))
      .finally(() => setLoading(false));
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setTaxInclusive(d?.settings?.find?.((s: { key: string; value: string }) => s.key === "taxInclusive")?.value === "true"))
      .catch(() => {});
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
      return [...prev, { id: med.id, medicineId: med.id, name: med.name, genericName: med.genericName, price: med.sellingPrice, quantity: 1, gstRate: med.gstRate, discount: 0, batch }];
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
  const totalItemDiscount = cart.reduce((sum, item) => sum + item.discount, 0);

  let discountAmount = 0;
  if (discountType === "percentage") {
    discountAmount = (subtotal * discountValue) / 100;
  } else if (discountType === "flat") {
    discountAmount = discountValue;
  }

  // ponytail: mirrors server math — per-line discount, then GST either added or backed out
  const totalGST = cart.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    const discounted = itemTotal - item.discount;
    if (taxInclusive) {
      const base = discounted / (1 + item.gstRate / 100);
      return sum + (discounted - base);
    }
    return sum + (discounted * item.gstRate) / 100;
  }, 0);

  const totalAmount = taxInclusive
    ? subtotal - discountAmount - totalItemDiscount
    : subtotal - discountAmount - totalItemDiscount + totalGST;
  const taxableAmount = totalAmount - totalGST;
  const roundOff = Math.round(totalAmount) - totalAmount;
  const finalAmount = Math.round(totalAmount);

  const filteredMedicines = medicines.filter(
    (med) =>
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.genericName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const printBill = (invoiceNumber?: string) => {
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) { toast.error("Pop-up blocked — allow pop-ups to print"); return; }
    const rows = cart
      .map((item) => `<tr><td>${item.name}</td><td>${item.quantity}</td><td>₹${(item.price * item.quantity - item.discount).toFixed(2)}</td></tr>`)
      .join("");
    win.document.write(`<!doctype html><html><head><title>Bill</title><style>
      body{font:13px/1.5 monospace;padding:24px;color:#111}
      h2{margin:0 0 4px}.muted{color:#666;font-size:11px}
      table{width:100%;border-collapse:collapse;margin:16px 0}
      th,td{padding:4px 0;text-align:left}td:last-child,th:last-child{text-align:right}
      tr{border-bottom:1px dashed #ccc}.total{font-weight:bold;font-size:15px}
      </style></head><body>
      <h2>PharmacyPro</h2>
      <div class="muted">${invoiceNumber ? `Invoice: ${invoiceNumber}<br>` : ""}${new Date().toLocaleString()}</div>
      <table><thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="muted" style="display:flex;justify-content:space-between"><span>Payment: ${paymentMode.toUpperCase()}</span><span>GST ${taxInclusive ? "incl." : "excl."}</span></div>
      <div class="total" style="display:flex;justify-content:space-between;margin-top:8px"><span>Total</span><span>₹${finalAmount.toFixed(2)}</span></div>
      <script>window.onload=()=>{window.print();}</script>
      </body></html>`);
    win.document.close();
  };

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
            discountAmount: item.discount || undefined,
          })),
          paymentMode,
          discountType: discountType === "none" ? undefined : discountType,
          discountValue: discountType === "none" ? undefined : discountValue,
          branchId: session?.user?.branchId || "",
          patientId: patientId || undefined,
          cashierId: session?.user?.id || "",
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create sale");
      }
      const sale = await res.json();
      toast.success("Invoice generated successfully!");
      printBill(sale.invoiceNumber);
      setCart([]);
      setDiscountType("none");
      setDiscountValue(0);
      setPatientId(null);
      setPatientName("");
      setPatientSearch("");
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
              <div className="relative">
                <Button variant={barcodeInput ? "default" : "outline"} size="icon" aria-label="Scan barcode" onClick={() => { setBarcodeInput(!barcodeInput); setBarcodeValue(""); }}>
                  <Barcode className="w-4 h-4" />
                </Button>
                {barcodeInput && (
                  <div className="absolute top-full right-0 mt-2 z-10">
                    <Input
                      autoFocus
                      placeholder="Scan barcode..."
                      value={barcodeValue}
                      onChange={(e) => setBarcodeValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && barcodeValue) {
                          const found = medicines.find((m) => m.barcode === barcodeValue);
                          if (found) { addToCart(found); setBarcodeValue(""); toast.success(`${found.name} added`); }
                          else toast.error("Medicine not found for this barcode");
                        }
                      }}
                      className="w-48"
                    />
                  </div>
                )}
              </div>
             <Button variant="outline" size="icon" aria-label="User" onClick={() => session?.user?.name && toast.success(`Logged in as ${session.user.name}`)}>
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
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-gray-400">Disc</span>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      className="w-16 h-6 text-xs rounded border border-input bg-background px-1"
                      value={item.discount || ""}
                      onChange={(e) =>
                        setCart((prev) =>
                          prev.map((it) =>
                            it.id === item.id ? { ...it, discount: Math.min(Math.max(0, Number(e.target.value) || 0), it.price * it.quantity) } : it
                          )
                        )
                      }
                    />
                  </div>
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
            {paymentMode === "credit" && (
              <div className="relative space-y-1">
                {patientName ? (
                  <div className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-700/50 rounded-md px-3 py-2">
                    <span>{patientName}</span>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => { setPatientId(null); setPatientName(""); setPatientSearch(""); }}>Change</Button>
                  </div>
                ) : (
                  <>
                    <Input
                      placeholder="Search patient for credit..."
                      value={patientSearch}
                      onChange={(e) => {
                        setPatientSearch(e.target.value);
                        if (e.target.value.trim().length >= 2) {
                          fetch(`/api/patients?search=${encodeURIComponent(e.target.value)}&limit=8`)
                            .then((r) => r.json())
                            .then((d) => setPatientResults(d.patients || []))
                            .catch(() => {});
                        } else {
                          setPatientResults([]);
                        }
                      }}
                    />
                    {patientResults.length > 0 && (
                      <div className="absolute z-20 w-full bg-white dark:bg-gray-800 border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {patientResults.map((p) => (
                          <button
                            key={p.id}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                            onClick={() => { setPatientId(p.id); setPatientName(p.name); setPatientResults([]); setPatientSearch(""); }}
                          >
                            {p.name} <span className="text-xs text-gray-400">{p.phone || ""}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Bill Discount</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            {totalItemDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Item Discounts</span>
                <span>-₹{totalItemDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Taxable Amount</span>
              <span>₹{taxableAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">GST {taxInclusive ? "(incl.)" : ""}</span>
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
          <Button variant="outline" className="w-full" disabled={cart.length === 0} onClick={() => printBill()}>
            <Printer className="w-4 h-4 mr-2" />
            Print Bill
          </Button>
        </div>
      </div>
    </div>
  );
}
