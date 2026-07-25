"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Check, Building2, Store, Pill, Stethoscope, Truck, Globe, Package } from "lucide-react";
import { BUSINESS_TYPES, type BusinessType, getFeaturesForBusinessType, FEATURE_LABELS } from "@/lib/features";

const ICONS: Record<string, any> = {
  RETAIL_PHARMACY: Pill, HOSPITAL_PHARMACY: Building2, CLINIC: Stethoscope,
  WHOLESALE: Package, DISTRIBUTOR: Truck, GENERAL_RETAIL: Store,
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [businessType, setBusinessType] = useState<BusinessType | "">("");
  const [form, setForm] = useState({ store_name: "My Pharmacy", gst_number: "", address: "", phone: "" });

  const features = businessType ? getFeaturesForBusinessType(businessType as BusinessType) : null;

  const complete = async () => {
    setLoading(true);
    if (businessType) {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessType, ...form }),
      });
    }
    setLoading(false);
    toast.success("Setup complete! Please sign in.");
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pharmacy-50 to-pharmacy-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-pharmacy-500 text-white mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold">Set Up Your Business</h1>
          <p className="text-gray-500 mt-2">
            Step {step} of 3 — {step === 1 ? "Choose your business type" : step === 2 ? "Basic information" : "Review features"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 ? "What type of business is this?" : step === 2 ? "Tell us about your business" : "Review your setup"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BUSINESS_TYPES.map((bt) => {
                  const Icon = ICONS[bt.value] || Globe;
                  const selected = businessType === bt.value;
                  return (
                    <button
                      key={bt.value}
                      className={`text-left p-4 rounded-lg border-2 transition-all ${selected ? "border-pharmacy-500 bg-pharmacy-50 dark:bg-pharmacy-900/20" : "border-gray-200 hover:border-gray-300"}`}
                      onClick={() => setBusinessType(bt.value)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selected ? "bg-pharmacy-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{bt.label}</span>
                            {selected && <Check className="w-4 h-4 text-pharmacy-500" />}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{bt.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Business Name</label>
                  <Input value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">GST Number (optional)</label>
                  <Input value={form.gst_number} onChange={(e) => setForm({ ...form, gst_number: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Address</label>
                  <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-5 h-5 text-pharmacy-500" />
                    <span className="font-medium">{BUSINESS_TYPES.find((b) => b.value === businessType)?.label}</span>
                  </div>
                  <p className="text-sm text-gray-500">{form.store_name} | {form.gst_number || "No GST"}</p>
                </div>
                <p className="text-sm font-medium">Features that will be enabled:</p>
                <div className="grid grid-cols-2 gap-2">
                  {features && Object.entries(features).filter(([, v]) => v).map(([key]) => (
                    <div key={key} className="flex items-center gap-2 p-2 rounded bg-green-50 dark:bg-green-900/20 text-sm">
                      <Check className="w-4 h-4 text-green-600" />
                      {FEATURE_LABELS[key as keyof typeof FEATURE_LABELS] || key}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-6">
              {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>}
              <div className="flex-1" />
              {step < 3 ? (
                <Button onClick={() => { if (step === 1 && !businessType) { toast.error("Please select a business type"); return; } setStep(step + 1); }}>
                  Continue
                </Button>
              ) : (
                <Button onClick={complete} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Complete Setup
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
