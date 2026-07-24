"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchInput } from "@/components/ui/search-input";
import {
  Plus,
  Edit,
  Loader2,
  User,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

interface Patient {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  _count: { prescriptions: number; sales: number };
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    fetch(`/api/patients?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setPatients(data.patients);
        setTotalPages(data.pagination.totalPages);
      })
      .catch(() => toast.error("Failed to load patients"))
      .finally(() => setLoading(false));
  }, [page, search]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Patients</h1>
          <p className="text-gray-500 dark:text-gray-400">Registered patients directory</p>
        </div>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Patient
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <SearchInput
            searchValue={search}
            onSearch={(value) => { setSearch(value); setPage(1); }}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, phone, or email..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Patient Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Prescriptions</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-pharmacy-100 dark:bg-pharmacy-900/20 flex items-center justify-center">
                            <User className="w-4 h-4 text-pharmacy-600" />
                          </div>
                          <span className="font-medium">{p.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs">
                          {p.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{p.phone}</span>}
                          {p.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{p.email}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{p.gender || "—"}</TableCell>
                      <TableCell>{p._count.prescriptions}</TableCell>
                      <TableCell>{p._count.sales}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="w-8 h-8" aria-label="Edit">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {patients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No patients found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
