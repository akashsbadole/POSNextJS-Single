"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, FileText, ChevronLeft, ChevronRight, Activity } from "lucide-react";
import { toast } from "sonner";

interface AuditLog {
  id: string; action: string; entityType: string; entityId: string | null;
  createdAt: string; ipAddress: string | null;
  user: { name: string | null; email: string | null };
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users/audit-logs?page=${page}&limit=30`)
      .then((r) => r.json())
      .then((d) => { setLogs(d.logs || []); setTotalPages(d.pagination?.totalPages || 1); })
      .catch(() => {
        // fallback: no dedicated audit API yet
        setLogs([]);
      })
      .finally(() => setLoading(false));
  }, [page]);

  const actionVariant: Record<string, "success" | "destructive" | "warning" | "secondary"> = {
    CREATE: "success", UPDATE: "warning", DELETE: "destructive", LOGIN: "secondary",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-gray-500">Track all system activities and changes</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Activity Log</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" /></div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Audit log API not available yet</p>
              <p className="text-xs text-gray-400 mt-1">Activities are recorded in the database — wire up /api/audit-logs</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs">{log.user.name || log.user.email}</TableCell>
                      <TableCell>
                        <Badge variant={actionVariant[log.action] || "secondary"}>{log.action}</Badge>
                      </TableCell>
                      <TableCell className="text-xs capitalize">{log.entityType}</TableCell>
                      <TableCell className="text-xs font-mono">{log.entityId?.slice(0, 12) || "—"}...</TableCell>
                      <TableCell className="text-xs">{log.ipAddress || "—"}</TableCell>
                      <TableCell className="text-xs">{new Date(log.createdAt).toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
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
