"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Eye, Edit, Ban, Settings } from "lucide-react";

const roles = [
  {
    name: "OWNER", description: "Full system access", color: "destructive",
    permissions: ["All modules", "User management", "Settings", "Reports", "Analytics"],
  },
  {
    name: "MANAGER", description: "Daily operations management", color: "warning",
    permissions: ["Inventory", "Sales & POS", "Purchases", "Prescriptions", "Reports"],
  },
  {
    name: "PHARMACIST", description: "Clinical and dispensing", color: "default",
    permissions: ["Inventory view", "Prescriptions", "POS", "Patient lookup"],
  },
  {
    name: "CASHIER", description: "Billing only", color: "secondary",
    permissions: ["POS billing", "Invoice view", "Dashboard"],
  },
];

const permissionIcons: Record<string, any> = {
  "All modules": Shield, "User management": Users, "Settings": Settings,
  "Inventory": Eye, "Sales & POS": Edit, "Purchases": Ban,
};

export default function RolesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Roles & Permissions</h1>
        <p className="text-gray-500">Define access levels for system users</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((role) => (
          <Card key={role.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <CardTitle>{role.name}</CardTitle>
                </div>
                <Badge variant={role.color as any}>{role.description}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {role.permissions.map((perm) => {
                  const Icon = permissionIcons[perm] || Shield;
                  return (
                    <li key={perm} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Icon className="w-4 h-4 text-pharmacy-500" />
                      {perm}
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
