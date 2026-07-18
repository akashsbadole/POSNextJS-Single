"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ShoppingCart,
  Filter,
  Star,
  Truck,
  Shield,
  Pill,
  Heart,
  Eye,
} from "lucide-react";

const products = [
  { id: "1", name: "Paracetamol 500mg", generic: "Paracetamol", price: 25.50, mrp: 30.00, rating: 4.5, reviews: 128, image: "", category: "Painkillers", prescription: false },
  { id: "2", name: "Amoxicillin 250mg", generic: "Amoxicillin", price: 120.00, mrp: 150.00, rating: 4.8, reviews: 89, image: "", category: "Antibiotics", prescription: true },
  { id: "3", name: "Vitamin D3 60K", generic: "Cholecalciferol", price: 85.00, mrp: 100.00, rating: 4.6, reviews: 256, image: "", category: "Vitamins", prescription: false },
  { id: "4", name: "Cetirizine 10mg", generic: "Cetirizine", price: 15.00, mrp: 20.00, rating: 4.3, reviews: 342, image: "", category: "Antihistamines", prescription: false },
  { id: "5", name: "Metformin 500mg", generic: "Metformin", price: 45.00, mrp: 55.00, rating: 4.7, reviews: 167, image: "", category: "Diabetes", prescription: true },
  { id: "6", name: "Amlodipine 5mg", generic: "Amlodipine", price: 55.00, mrp: 65.00, rating: 4.4, reviews: 98, image: "", category: "Cardiac", prescription: true },
];

const categories = ["All", "Painkillers", "Antibiotics", "Vitamins", "Antihistamines", "Diabetes", "Cardiac"];

export default function OnlineStorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState<string[]>([]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.generic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (id: string) => {
    setCart((prev) => [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search medicines..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Heart className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-pharmacy-500 text-white text-xs rounded-full flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg">
            <Shield className="w-8 h-8 text-pharmacy-500" />
            <div>
              <p className="font-medium text-sm">100% Genuine</p>
              <p className="text-xs text-gray-500">All medicines verified</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg">
            <Truck className="w-8 h-8 text-pharmacy-500" />
            <div>
              <p className="font-medium text-sm">Free Delivery</p>
              <p className="text-xs text-gray-500">On orders above ₹500</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg">
            <Pill className="w-8 h-8 text-pharmacy-500" />
            <div>
              <p className="font-medium text-sm">Licensed Pharmacy</p>
              <p className="text-xs text-gray-500">Registered under Drugs Act</p>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden group">
              <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Pill className="w-16 h-16 text-gray-300" />
                </div>
                {product.prescription && (
                  <Badge className="absolute top-3 left-3 bg-amber-500">Rx Required</Badge>
                )}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="secondary" size="icon" className="w-8 h-8">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button variant="secondary" size="icon" className="w-8 h-8">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs text-gray-500">{product.category}</p>
                    <h3 className="font-medium text-sm mt-1">{product.name}</h3>
                    <p className="text-xs text-gray-500">{product.generic}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mb-3">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-medium">{product.rating}</span>
                  <span className="text-xs text-gray-500">({product.reviews})</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-pharmacy-600">₹{product.price.toFixed(2)}</span>
                    <span className="text-sm text-gray-400 line-through ml-2">₹{product.mrp.toFixed(2)}</span>
                    <Badge variant="success" className="ml-2 text-xs">
                      {Math.round((1 - product.price / product.mrp) * 100)}% OFF
                    </Badge>
                  </div>
                </div>
                <Button className="w-full mt-3" onClick={() => addToCart(product.id)}>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
