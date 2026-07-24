"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const steps = [
  { id: "pharmacy", label: "Pharmacy Info" },
  { id: "branch", label: "Branch Setup" },
  { id: "license", label: "Drug License" },
  { id: "features", label: "Features" },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    pharmacyName: "",
    address: "",
    gstin: "",
    businessType: "RETAIL_PHARMACY",
    branchName: "",
    branchCode: "",
    drugLicenseNumber: "",
    enableCustomFields: true,
    enableSchemes: false,
    enableWhatsApp: false,
  });

  useEffect(() => {
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((d) => {
        if (d.completed) {
          setCompleted(true);
          router.replace("/dashboard");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const next = () => {
    if (step === 0 && (!form.pharmacyName || !form.gstin)) {
      toast.error("Pharmacy name and GSTIN are required");
      return;
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    setSubmitting(true);
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      toast.success("Onboarding complete!");
      router.replace("/dashboard");
    } catch {
      toast.error("Failed to complete onboarding");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pharmacy-500" />
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader><CardTitle>Setup Complete</CardTitle></CardHeader>
          <CardContent><p>Redirecting...</p></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle>Welcome to PharmacyPro</CardTitle>
          <p className="text-sm text-gray-500">Let us set up your pharmacy in a few steps</p>
          <div className="flex items-center gap-2 mt-4">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <Badge variant={i <= step ? "success" : "secondary"}>{i + 1}</Badge>
                <span className="text-xs hidden sm:inline">{s.label}</span>
                {i < steps.length - 1 && <span className="text-gray-300">→</span>}
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Pharmacy Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pharmacy Name</label>
                  <Input value={form.pharmacyName} onChange={(e) => setForm({ ...form, pharmacyName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">GSTIN</label>
                  <Input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium">Address</label>
                  <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Business Type</label>
                  <Input value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-medium">First Branch</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Branch Name</label>
                  <Input value={form.branchName} onChange={(e) => setForm({ ...form, branchName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Branch Code</label>
                  <Input value={form.branchCode} onChange={(e) => setForm({ ...form, branchCode: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-medium">Drug License</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium">Drug License Number</label>
                <Input value={form.drugLicenseNumber} onChange={(e) => setForm({ ...form, drugLicenseNumber: e.target.value })} />
                <p className="text-xs text-gray-400">You can add more licenses later in Settings</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-medium">Features</h3>
              <div className="space-y-3">
                {([
                  ["enableCustomFields", "Custom Fields", form.enableCustomFields],
                  ["enableSchemes", "Scheme Management", form.enableSchemes],
                  ["enableWhatsApp", "WhatsApp Notifications", form.enableWhatsApp],
                ] as [string, string, boolean][]).map(([key, label, checked]) => (
                  <label key={key} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                    />
                    <div>
                      <span className="text-sm font-medium">{label}</span>
                      <p className="text-xs text-gray-400">Enable {label.toLowerCase()} for your pharmacy</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <div>
              {step > 0 && (
                <Button variant="outline" onClick={back}>Back</Button>
              )}
            </div>
            <div className="flex gap-2">
              {step < steps.length - 1 ? (
                <Button onClick={next}>Next</Button>
              ) : (
                <Button onClick={submit} disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Complete Setup
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
