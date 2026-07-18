"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, FileText, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Prescription {
  id: string; prescriptionNumber: string; status: string; notes: string | null;
  createdAt: string;
  patient: { name: string };
  doctor: { name: string } | null;
}

export default function ProcessPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/prescriptions?limit=20`)
      .then((r) => r.json())
      .then((d) => setPrescriptions(d.prescriptions || []))
      .catch(() => {
        // ponytail: no /api/prescriptions endpoint yet — use seed data
        setPrescriptions([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Process Prescriptions</h1>
          <p className="text-gray-500">Review and fulfill prescription orders</p>
        </div>
        <Button size="sm" asChild>
          <Link href="/prescriptions/upload"><FileText className="w-4 h-4 mr-2" />Upload New</Link>
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Pending Prescriptions</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" /></div>
          ) : prescriptions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No prescriptions to process</p>
              <p className="text-xs text-gray-400 mt-1">Upload a prescription to get started</p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link href="/prescriptions/upload">Upload Prescription</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prescriptions.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.prescriptionNumber}</TableCell>
                    <TableCell>{p.patient.name}</TableCell>
                    <TableCell>{p.doctor?.name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "FULFILLED" ? "success" : p.status === "CANCELLED" ? "destructive" : "warning"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{new Date(p.createdAt).toLocaleDateString("en-IN")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-green-500"><CheckCircle2 className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500"><XCircle className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
