"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, Building2, Globe, Bell, Shield, Languages } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);

  const sections = [
    { id: "general", label: "General", icon: Building2 },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "localization", label: "Localization", icon: Globe },
    { id: "security", label: "Security", icon: Shield },
    { id: "languages", label: "Languages", icon: Languages },
  ];

  const handleSave = () => {
    setLoading(true);
    // ponytail: persist to /api/settings when endpoint is built
    setTimeout(() => { setLoading(false); toast.success("Settings saved"); }, 800);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-gray-500">Configure your pharmacy system</p>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          {sections.map((s) => (
            <TabsTrigger key={s.id} value={s.id}>
              <s.icon className="w-4 h-4 mr-2" />{s.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Pharmacy Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium">Pharmacy Name</label><Input defaultValue="PharmacyPro" /></div>
                <div><label className="text-sm font-medium">GSTIN</label><Input defaultValue="22AAAAA0000A1Z5" /></div>
                <div><label className="text-sm font-medium">License Number</label><Input defaultValue="DL-2024-001234" /></div>
                <div><label className="text-sm font-medium">Phone</label><Input defaultValue="+91 9876543210" /></div>
                <div className="col-span-2"><label className="text-sm font-medium">Address</label><Input defaultValue="123, Pharma Street, New Delhi" /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Configure email and SMS alerts for low stock, expiries, and sales.</p>
              <div className="mt-4 space-y-3">
                {["Low Stock Alerts", "Expiry Reminders", "Daily Sales Report", "New Order Notifications"].map((n) => (
                  <div key={n} className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="text-sm font-medium">{n}</span>
                    <Badge variant="success">Enabled</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="localization" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Localization</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium">Currency</label><Input defaultValue="INR (₹)" /></div>
                <div><label className="text-sm font-medium">Timezone</label><Input defaultValue="Asia/Kolkata" /></div>
                <div><label className="text-sm font-medium">Date Format</label><Input defaultValue="DD/MM/YYYY" /></div>
                <div><label className="text-sm font-medium">Number Format</label><Input defaultValue="1,23,456.78" /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Security Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium">Password Policy</label><Input defaultValue="Min 8 chars, 1 uppercase, 1 number" /></div>
                <div><label className="text-sm font-medium">Session Timeout</label><Input defaultValue="30 minutes" /></div>
                <div><label className="text-sm font-medium">Max Login Attempts</label><Input defaultValue="5" /></div>
                <div><label className="text-sm font-medium">2FA Enforcement</label><Input defaultValue="Optional" /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="languages" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Language Support</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { lang: "English", code: "en", status: "Active" },
                  { lang: "Hindi", code: "hi", status: "Beta" },
                  { lang: "Tamil", code: "ta", status: "Coming Soon" },
                  { lang: "Telugu", code: "te", status: "Coming Soon" },
                  { lang: "Bengali", code: "bn", status: "Coming Soon" },
                ].map((l) => (
                  <div key={l.code} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{l.lang}</span>
                      <span className="text-xs text-gray-400">({l.code})</span>
                    </div>
                    <Badge variant={l.status === "Active" ? "success" : l.status === "Beta" ? "warning" : "secondary"}>{l.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
