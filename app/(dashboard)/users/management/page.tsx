"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Search, Plus, Loader2, User, Shield, Edit, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface AppUser {
  id: string; name: string | null; email: string | null; phone: string | null;
  role: string; status: string; twoFactorEnabled: boolean;
  branch: { name: string } | null;
  createdAt: string; lastLoginAt: string | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users?page=${page}&limit=20`)
      .then((r) => r.json())
      .then((d) => { setUsers(d.users); setTotalPages(d.pagination.totalPages); })
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  }, [page]);

  const filtered = users.filter((u) =>
    (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-500">Manage system users and their roles</p>
        </div>
        <Button size="sm"><Plus className="w-4 h-4 mr-2" />Add User</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search users..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>System Users</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" /></div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email / Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>2FA</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-pharmacy-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-pharmacy-600" />
                          </div>
                          <span className="font-medium">{u.name || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{u.email}<br />{u.phone}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          <Shield className="w-3 h-3 mr-1" />{u.role.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{u.branch?.name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={u.status === "ACTIVE" ? "success" : "secondary"}>{u.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.twoFactorEnabled ? "success" : "secondary"}>{u.twoFactorEnabled ? "On" : "Off"}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString("en-IN") : "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="w-8 h-8"><Edit className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-500">No users found</TableCell></TableRow>
                  )}
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
