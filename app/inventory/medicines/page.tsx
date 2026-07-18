"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  Barcode,
  Edit,
  Trash2,
  AlertTriangle,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const medicines = [
  { id: "1", name: "Paracetamol 500mg", generic: "Paracetamol", category: "Painkillers", stock: 150, mrp: 25.50, expiry: "2026-12-31", batch: "B2024001", supplier: "MediCorp", status: "active" },
  { id: "2", name: "Amoxicillin 250mg", generic: "Amoxicillin", category: "Antibiotics", stock: 45, mrp: 120.00, expiry: "2026-08-15", batch: "B2024002", supplier: "PharmaPlus", status: "low" },
  { id: "3", name: "Vitamin D3 60K", generic: "Cholecalciferol", category: "Vitamins", stock: 200, mrp: 85.00, expiry: "2027-03-20", batch: "B2024003", supplier: "HealthCare Ltd", status: "active" },
  { id: "4", name: "Cetirizine 10mg", generic: "Cetirizine", category: "Antihistamines", stock: 8, mrp: 15.00, expiry: "2026-09-10", batch: "B2024004", supplier: "MediCorp", status: "critical" },
  { id: "5", name: "Metformin 500mg", generic: "Metformin", category: "Diabetes", stock: 120, mrp: 45.00, expiry: "2027-01-15", batch: "B2024005", supplier: "DiabCare", status: "active" },
  { id: "6", name: "Amlodipine 5mg", generic: "Amlodipine", category: "Cardiac", stock: 60, mrp: 55.00, expiry: "2026-11-30", batch: "B2024006", supplier: "HeartMed", status: "active" },
];

export default function MedicinesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredMedicines = medicines.filter((med) => {
    const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.generic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || med.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Medicines</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your medicine inventory</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Medicine
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, generic name, or batch..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="sm">
              <Barcode className="w-4 h-4 mr-2" />
              Scan Barcode
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Medicines</p>
              <p className="text-xl font-bold">1,247</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">In Stock</p>
              <p className="text-xl font-bold">1,180</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Low Stock</p>
              <p className="text-xl font-bold">45</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Expired</p>
              <p className="text-xl font-bold">12</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Medicines Table */}
      <Card>
        <CardHeader>
          <CardTitle>Medicine List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>MRP</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMedicines.map((med) => (
                <TableRow key={med.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{med.name}</p>
                      <p className="text-xs text-gray-500">{med.generic}</p>
                    </div>
                  </TableCell>
                  <TableCell>{med.category}</TableCell>
                  <TableCell>
                    <span className={`font-medium ${
                      med.status === "critical" ? "text-red-600" :
                      med.status === "low" ? "text-amber-600" : "text-green-600"
                    }`}>
                      {med.stock}
                    </span>
                  </TableCell>
                  <TableCell>₹{med.mrp.toFixed(2)}</TableCell>
                  <TableCell>{med.expiry}</TableCell>
                  <TableCell className="font-mono text-xs">{med.batch}</TableCell>
                  <TableCell>
                    <Badge variant={
                      med.status === "active" ? "success" :
                      med.status === "low" ? "warning" : "destructive"
                    }>
                      {med.status === "active" ? "In Stock" :
                       med.status === "low" ? "Low Stock" : "Critical"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="w-8 h-8">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-gray-500">Showing 1-6 of 1,247 medicines</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">1</Button>
              <Button variant="outline" size="sm">2</Button>
              <Button variant="outline" size="sm">3</Button>
              <Button variant="outline" size="sm">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
