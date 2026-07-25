"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, Building2, Globe, Bell, Shield, Languages } from "lucide-react";
import { toast } from "sonner";

type SettingsMap = Record<string, string>;

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [settings, setSettings] = useState<SettingsMap>({});

  const sections = [
    { id: "general", label: "General", icon: Building2 },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "localization", label: "Localization", icon: Globe },
    { id: "security", label: "Security", icon: Shield },
    { id: "languages", label: "Languages", icon: Languages },
  ];

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        const map: SettingsMap = {};
        (d.settings || []).forEach((s: { key: string; value: string }) => { map[s.key] = s.value; });
        setSettings(map);
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setInitialLoading(false));
  }, []);

  const set = (key: string, value: string) => setSettings((prev) => ({ ...prev, [key]: value }));

  const saveKey = async (key: string, value: string, category = "GENERAL") => {
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value, category }),
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const keys: [string, string, string][] = [
        ["store_name", settings.store_name ?? "PharmacyPro", "GENERAL"],
        ["gst_number", settings.gst_number ?? "", "TAX"],
        ["license_number", settings.license_number ?? "", "GENERAL"],
        ["phone", settings.phone ?? "", "GENERAL"],
        ["address", settings.address ?? "", "GENERAL"],
        ["currency", settings.currency ?? "INR", "GENERAL"],
        ["timezone", settings.timezone ?? "Asia/Kolkata", "GENERAL"],
        ["date_format", settings.date_format ?? "DD/MM/YYYY", "GENERAL"],
        ["password_policy", settings.password_policy ?? "Min 8 chars", "SECURITY"],
        ["session_timeout", settings.session_timeout ?? "30 minutes", "SECURITY"],
        ["max_login_attempts", settings.max_login_attempts ?? "5", "SECURITY"],
        ["twofa_enforcement", settings.twofa_enforcement ?? "Optional", "SECURITY"],
      ];
      await Promise.all(keys.map(([k, v, c]) => saveKey(k, v, c)));
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const rerunOnboarding = async () => {
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      router.replace("/onboarding");
    } catch {
      toast.error("Failed to reset onboarding");
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
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
                 <div><label htmlFor="store_name" className="text-sm font-medium">Pharmacy Name</label><Input id="store_name" value={settings.store_name ?? ""} onChange={(e) => set("store_name", e.target.value)} /></div>
                 <div><label htmlFor="gst_number" className="text-sm font-medium">GSTIN</label><Input id="gst_number" value={settings.gst_number ?? ""} onChange={(e) => set("gst_number", e.target.value)} /></div>
                 <div><label htmlFor="license_number" className="text-sm font-medium">License Number</label><Input id="license_number" value={settings.license_number ?? ""} onChange={(e) => set("license_number", e.target.value)} /></div>
                 <div><label htmlFor="phone" className="text-sm font-medium">Phone</label><Input id="phone" value={settings.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></div>
                 <div className="col-span-2"><label htmlFor="address" className="text-sm font-medium">Address</label><Input id="address" value={settings.address ?? ""} onChange={(e) => set("address", e.target.value)} /></div>
               </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Setup</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-3">Restart the onboarding wizard to update your pharmacy info.</p>
              <Button variant="outline" onClick={rerunOnboarding}>Re-run Onboarding</Button>
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
                 <div><label htmlFor="currency" className="text-sm font-medium">Currency</label><Input id="currency" value={settings.currency ?? ""} onChange={(e) => set("currency", e.target.value)} /></div>
                 <div><label htmlFor="timezone" className="text-sm font-medium">Timezone</label><Input id="timezone" value={settings.timezone ?? ""} onChange={(e) => set("timezone", e.target.value)} /></div>
                 <div><label htmlFor="date_format" className="text-sm font-medium">Date Format</label><Input id="date_format" value={settings.date_format ?? ""} onChange={(e) => set("date_format", e.target.value)} /></div>
                 <div><label htmlFor="number_format" className="text-sm font-medium">Number Format</label><Input id="number_format" value={settings.number_format ?? "1,23,456.78"} onChange={(e) => set("number_format", e.target.value)} /></div>
               </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Security Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <div><label htmlFor="password_policy" className="text-sm font-medium">Password Policy</label><Input id="password_policy" value={settings.password_policy ?? ""} onChange={(e) => set("password_policy", e.target.value)} /></div>
                 <div><label htmlFor="session_timeout" className="text-sm font-medium">Session Timeout</label><Input id="session_timeout" value={settings.session_timeout ?? ""} onChange={(e) => set("session_timeout", e.target.value)} /></div>
                 <div><label htmlFor="max_login_attempts" className="text-sm font-medium">Max Login Attempts</label><Input id="max_login_attempts" value={settings.max_login_attempts ?? ""} onChange={(e) => set("max_login_attempts", e.target.value)} /></div>
                 <div><label htmlFor="twofa_enforcement" className="text-sm font-medium">2FA Enforcement</label><Input id="twofa_enforcement" value={settings.twofa_enforcement ?? ""} onChange={(e) => set("twofa_enforcement", e.target.value)} /></div>
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
                  { lang: "Hindi", code: "hi", status: "Planned" },
                ].map((l) => (
                  <div key={l.code} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{l.lang}</span>
                      <span className="text-xs text-gray-400">({l.code})</span>
                    </div>
                    <Badge variant={l.status === "Active" ? "success" : "secondary"}>{l.status}</Badge>
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
