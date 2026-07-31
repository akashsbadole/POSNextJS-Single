import { NextRequest, NextResponse } from "next/server";
import { verifyOTP } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { createOTPToken } from "@/lib/otp-token";

export async function POST(req: NextRequest) {
  try {
    const { phone, otp } = await req.json();
    if (!phone || !otp) {
      return NextResponse.json({ error: "Phone and OTP required" }, { status: 400 });
    }

    const result = await verifyOTP(phone, otp);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Invalid or expired OTP" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    const otpToken = user.email ? await createOTPToken(user.id, user.email) : null;

    return NextResponse.json({
      success: true,
      otpToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch {
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 });
  }
}
