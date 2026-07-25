import { NextRequest, NextResponse } from "next/server";
import { resetPassword } from "@/lib/auth-utils";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password || password.length < 6) {
      return NextResponse.json({ error: "Valid token and password (min 6 chars) required" }, { status: 400 });
    }

    const result = await resetPassword(token, password);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Invalid or expired token" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
