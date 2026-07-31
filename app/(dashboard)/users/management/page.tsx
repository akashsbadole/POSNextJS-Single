"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchInput } from "@/components/ui/search-input";
import { Input } from "@/components/ui/input";
import {
  Plus, Loader2, User, Shield, Edit, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface AppUser {
  id: string; name: string | null; email: string | null; phone: string | null;
  role: string; status: string; twoFactorEnabled: boolean;
  branch: { name: string } | null;
  createdAt: string; lastLoginAt: string | null;
}

interface Branch { id: string; name: string; }

const ROLES = ["OWNER", "MANAGER", "PHARMACIST", "CASHIER"];

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modal, setModal] = useState<{ id?: string; name: string; email: string; phone: string; password: string; role: string; status: string; branchId: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    return fetch(`/api/users?page=${page}&limit=20`)
      .then((r) => r.json())
      .then((d) => { setUsers(d.users); setTotalPages(d.pagination.totalPages); })
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [page]);

  useEffect(() => {
    fetch("/api/branches")
      .then((r) => r.json())
      .then(setBranches)
      .catch(() => {});
  }, []);

  const filtered = users.filter((u) =>
    (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!modal || !modal.name.trim()) { toast.error("Name is required"); return; }
    if (!modal.id && !modal.password.trim()) { toast.error("Password is required"); return; }
    setSaving(true);
    try {
      const body = {
        name: modal.name, phone: modal.phone, role: modal.role, branchId: modal.branchId || undefined,
        ...(modal.id
          ? { id: modal.id, status: modal.status }
          : { email: modal.email, password: modal.password }),
      };
      const res = await fetch("/api/users", {
        method: modal.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to save user"); }
      toast.success(modal.id ? "User updated" : "User created");
      setModal(null);
      load();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to save user"); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-500">Manage system users and their roles</p>
        </div>
        <Button size="sm" onClick={() => setModal({ name: "", email: "", phone: "", password: "", role: "CASHIER", status: "ACTIVE", branchId: "" })}>
          <Plus className="w-4 h-4 mr-2" />Add User
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <SearchInput
            searchValue={search}
            onSearch={(value) => setSearch(value)}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
          />
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
                        <Button variant="ghost" size="icon" className="w-8 h-8" aria-label="Edit" onClick={() => setModal({ id: u.id, name: u.name || "", email: u.email || "", phone: u.phone || "", password: "", role: u.role, status: u.status, branchId: "" })}>
                          <Edit className="w-4 h-4" />
                        </Button>
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

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">{modal.id ? "Edit User" : "Add User"}</h3>
            <div className="space-y-1">
              <label className="text-sm font-medium">Name</label>
              <Input value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} />
            </div>
            {!modal.id && (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" value={modal.email} onChange={(e) => setModal({ ...modal, email: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Password</label>
                  <Input type="password" value={modal.password} onChange={(e) => setModal({ ...modal, password: e.target.value })} placeholder="Min 6 characters" />
                </div>
              </>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium">Phone</label>
              <Input value={modal.phone} onChange={(e) => setModal({ ...modal, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="10 digits" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Role</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={modal.role}
                onChange={(e) => setModal({ ...modal, role: e.target.value })}
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {modal.id && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Status</label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={modal.status}
                  onChange={(e) => setModal({ ...modal, status: e.target.value })}
                >
                  {["ACTIVE", "SUSPENDED", "INACTIVE"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium">Branch</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={modal.branchId}
                onChange={(e) => setModal({ ...modal, branchId: e.target.value })}
              >
                <option value="">No branch</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
