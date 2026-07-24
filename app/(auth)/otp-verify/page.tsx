"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Smartphone, Building2 } from "lucide-react";

export default function OTPVerifyPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!phone || phone.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    setLoading(true);
    // ponytail: wire to SMS API
    setTimeout(() => {
      setStep("otp");
      setLoading(false);
      toast.success("OTP sent to " + phone);
    }, 1000);
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }
    setLoading(true);
    // ponytail: wire to /api/auth/verify-otp
    setTimeout(() => {
      setLoading(false);
      toast.success("Verified successfully!");
      router.push("/login");
    }, 1000);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pharmacy-50 to-pharmacy-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-pharmacy-500 text-white mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">PharmacyPro</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Verify your identity</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>OTP Verification</CardTitle>
            <CardDescription>
              {step === "phone" ? "Enter your phone number to receive OTP" : "Enter the 6-digit code sent to your phone"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === "phone" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">Phone Number</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input id="phone" type="tel" className="pl-10" placeholder="9876543210" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </div>
                <Button className="w-full" disabled={loading} onClick={handleSendOTP}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Send OTP
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center gap-2">
                  {otp.map((digit, i) => (
                    <Input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="w-12 h-14 text-center text-lg font-bold"
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !digit && i > 0) {
                          const prev = document.getElementById(`otp-${i - 1}`);
                          prev?.focus();
                        }
                        if (e.key === "Enter" && i === 5) {
                          handleVerify();
                        }
                      }}
                    />
                  ))}
                </div>
                <Button className="w-full" disabled={loading} onClick={handleVerify}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Verify OTP
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => { setStep("phone"); setOtp(["", "", "", "", "", ""]); }}>
                  Change Phone Number
                </Button>
                <div className="text-center">
                  <button className="text-sm text-pharmacy-600 hover:underline" onClick={handleSendOTP}>
                    Resend OTP
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
