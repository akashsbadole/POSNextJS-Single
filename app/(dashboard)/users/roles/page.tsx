"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface AppUser {
  id: string; name: string | null; email: string | null;
  role: string; status: string; branch: { name: string } | null;
}

const ROLES = ["OWNER", "MANAGER", "PHARMACIST", "CASHIER"] as const;
const ROLE_META: Record<string, { description: string; variant: "destructive" | "warning" | "default" | "secondary" }> = {
  OWNER: { description: "Full system access", variant: "destructive" },
  MANAGER: { description: "Daily operations management", variant: "warning" },
  PHARMACIST: { description: "Clinical and dispensing", variant: "default" },
  CASHIER: { description: "Billing only", variant: "secondary" },
};

export default function RolesPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/users?limit=100")
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []))
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  const changeRole = async (userId: string, role: string) => {
    setUpdating(userId);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, role }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
        toast.success("Role updated");
      } else {
        toast.error("Failed to update role");
      }
    } catch {
      toast.error("Failed to update role");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Roles & Permissions</h1>
        <p className="text-gray-500">Assign access levels to system users</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ROLES.map((role) => {
          const meta = ROLE_META[role];
          const count = users.filter((u) => u.role === role).length;
          return (
            <Card key={role}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    <CardTitle className="text-base">{role}</CardTitle>
                  </div>
                  <Badge variant={meta.variant}>{count}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">{meta.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle>User Roles</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead className="text-right">Change Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name || "—"}</TableCell>
                  <TableCell className="text-xs">{u.email}</TableCell>
                  <TableCell className="text-xs">{u.branch?.name || "—"}</TableCell>
                  <TableCell><Badge variant={ROLE_META[u.role]?.variant || "secondary"}>{u.role}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {ROLES.map((role) => (
                        <button
                          key={role}
                          disabled={updating === u.id || u.role === role}
                          onClick={() => changeRole(u.id, role)}
                          title={role}
                          className={`px-2 py-1 text-xs rounded border ${u.role === role ? "bg-pharmacy-500 text-white" : "hover:bg-gray-100"} disabled:opacity-50`}
                        >
                          {u.role === role ? <Check className="w-3 h-3" /> : role[0]}
                        </button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
