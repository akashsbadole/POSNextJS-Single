import { NextRequest, NextResponse } from "next/server";
import { sendOTP } from "@/lib/auth-utils";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: "Valid 10-digit phone number required" }, { status: 400 });
    }

    const result = await sendOTP(phone);
    if (!result.success) {
      return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
