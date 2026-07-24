"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/search-input";
import {
  ShoppingCart, Star, Truck, Shield, Pill, Heart, Eye, Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Product {
  id: string; name: string; genericName: string; category: string;
  price: number; mrp: number; discount: number; prescription: boolean; stock: number;
}

export default function OnlineStorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(["all"]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams({ search: searchQuery, category: selectedCategory });
    fetch(`/api/online-store/products?${qs.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        const ps: Product[] = d.products || [];
        setProducts(ps);
        const cats = new Set<string>(["all"]);
        ps.forEach((p) => cats.add(p.category));
        setCategories(Array.from(cats));
      })
      .catch(() => toast.error("Failed to load products"))
      .finally(() => setLoading(false));
  }, [searchQuery, selectedCategory]);

  const addToCart = (id: string) => {
    const existing = JSON.parse(localStorage.getItem("cart") || "[]") as { id: string; quantity: number }[];
    const found = existing.find((i) => i.id === id);
    const next = found
      ? existing.map((i) => (i.id === id ? { ...i, quantity: i.quantity + 1 } : i))
      : [...existing, { id, quantity: 1 }];
    localStorage.setItem("cart", JSON.stringify(next));
    setCart(next.map((i) => i.id));
    toast.success("Added to cart");
  };

  const filtered = products.filter((p) =>
    selectedCategory === "all" || p.category === selectedCategory
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-pharmacy-500 flex items-center justify-center">
                <Pill className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">PharmacyPro Store</span>
            </div>
             <div className="flex-1 max-w-xl">
               <SearchInput
                 searchValue={searchQuery}
                 onSearch={(value) => setSearchQuery(value)}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Search medicines..."
               />
             </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild className="relative" aria-label="Shopping cart">
                <Link href="/online-store/cart">
                  <ShoppingCart className="w-5 h-5" />
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-pharmacy-500 text-white text-xs rounded-full flex items-center justify-center">
                      {cart.length}
                    </span>
                  )}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
          {categories.map((cat) => (
            <Button key={cat} variant={selectedCategory === cat ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(cat)}>
              {cat === "all" ? "All" : cat}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg">
            <Shield className="w-8 h-8 text-pharmacy-500" />
            <div><p className="font-medium text-sm">100% Genuine</p><p className="text-xs text-gray-500">All medicines verified</p></div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg">
            <Truck className="w-8 h-8 text-pharmacy-500" />
            <div><p className="font-medium text-sm">Free Delivery</p><p className="text-xs text-gray-500">On orders above ₹500</p></div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg">
            <Pill className="w-8 h-8 text-pharmacy-500" />
            <div><p className="font-medium text-sm">Licensed Pharmacy</p><p className="text-xs text-gray-500">Registered under Drugs Act</p></div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-12 text-gray-500">No products found</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((product) => (
              <Card key={product.id} className="overflow-hidden group">
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative">
                  <div className="absolute inset-0 flex items-center justify-center"><Pill className="w-16 h-16 text-gray-300" /></div>
                  {product.prescription && <Badge className="absolute top-3 left-3 bg-amber-500">Rx Required</Badge>}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Button variant="secondary" size="icon" className="w-8 h-8" aria-label="Add to wishlist"><Heart className="w-4 h-4" /></Button>
                     <Button variant="secondary" size="icon" className="w-8 h-8" aria-label="View"><Eye className="w-4 h-4" /></Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="mb-2">
                    <p className="text-xs text-gray-500">{product.category}</p>
                    <h3 className="font-medium text-sm mt-1">{product.name}</h3>
                    <p className="text-xs text-gray-500">{product.genericName}</p>
                  </div>
                  <div className="flex items-center gap-1 mb-3">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-medium">{product.discount}% OFF</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-pharmacy-600">₹{product.price.toFixed(2)}</span>
                      <span className="text-sm text-gray-400 line-through ml-2">₹{product.mrp.toFixed(2)}</span>
                      <Badge variant={product.stock > 0 ? "success" : "destructive"} className="ml-2 text-xs">
                        {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                      </Badge>
                    </div>
                  </div>
                  <Button className="w-full mt-3" disabled={product.stock <= 0} onClick={() => addToCart(product.id)}>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {product.stock > 0 ? "Add to Cart" : "Unavailable"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
