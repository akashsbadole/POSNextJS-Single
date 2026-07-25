import { NextRequest, NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/auth-utils";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const result = await requestPasswordReset(email);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to send reset email" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to send reset email" }, { status: 500 });
  }
}
