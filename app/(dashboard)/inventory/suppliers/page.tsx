"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchInput } from "@/components/ui/search-input";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Building2,
  Phone,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

interface Supplier {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/suppliers")
      .then((r) => r.json())
      .then(setSuppliers)
      .catch(() => toast.error("Failed to load suppliers"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = suppliers.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.contactPerson || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Suppliers</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your suppliers and distributors</p>
        </div>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <SearchInput
            searchValue={search}
            onSearch={(value) => setSearch(value)}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Suppliers</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{s.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{s.contactPerson || "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        {s.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{s.email}</span>}
                        {s.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.isActive ? "success" : "secondary"}>
                        {s.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="w-8 h-8" aria-label="Edit">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500" aria-label="Delete">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No suppliers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
