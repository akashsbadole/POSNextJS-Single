import { NextRequest, NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/auth-utils";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    if (!(await checkRateLimit(`forgot:${email}`, 3, 60000))) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    await requestPasswordReset(email);

    return NextResponse.json({ success: true, message: "If the account exists, a reset link has been sent" });
  } catch {
    return NextResponse.json({ error: "Failed to send reset email" }, { status: 500 });
  }
}
