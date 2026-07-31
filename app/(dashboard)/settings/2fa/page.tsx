"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Shield, Loader2, CheckCircle2, XCircle, Smartphone } from "lucide-react";
import { toast } from "sonner";

export default function TwoFactorPage() {
  const [step, setStep] = useState<"initial" | "secret" | "done">("initial");
  const [secret, setSecret] = useState("");
  const [uri, setUri] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const setup = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/enroll", { method: "POST" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      const data = await res.json();
      setSecret(data.secret);
      setUri(data.uri);
      setStep("secret");
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  };

  const verify = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/enroll", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast.success("2FA enabled successfully");
      setStep("done");
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  };

  const disable = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/2fa/enroll", { method: "DELETE" });
      toast.success("2FA disabled");
      setStep("initial");
      setSecret("");
      setUri("");
      setToken("");
    } catch { toast.error("Failed to disable 2FA"); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-4 sm:p-6 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-pharmacy-500" />
        <div>
          <h1 className="text-2xl font-bold">Two-Factor Authentication</h1>
          <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
        </div>
      </div>

      {step === "initial" && (
        <Card>
          <CardHeader><CardTitle className="text-base">Enable 2FA</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Use an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator
              to scan a QR code and generate one-time codes.
            </p>
            <Button onClick={setup} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
              Setup 2FA
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "secret" && (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">Scan QR Code</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <Image
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}`}
                  alt="2FA QR Code"
                  width={192}
                  height={192}
                  className="w-48 h-48"
                />
              </div>
              <p className="text-xs text-gray-400 text-center">
                Or manually enter this secret key in your authenticator app:
              </p>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-center font-mono text-sm break-all">
                {secret}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Verify Code</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">Enter the 6-digit code from your authenticator app</p>
              <div className="flex gap-2">
                <Input
                  placeholder="000000"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-2xl font-mono tracking-widest"
                  maxLength={6}
                />
                <Button onClick={verify} disabled={token.length !== 6 || loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {step === "done" && (
        <Card>
          <CardHeader><CardTitle className="text-base text-green-600 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> 2FA Enabled</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Two-factor authentication is now active. You&apos;ll need a verification code from your authenticator app
              each time you sign in.
            </p>
            <Button variant="outline" onClick={disable} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
              Disable 2FA
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
