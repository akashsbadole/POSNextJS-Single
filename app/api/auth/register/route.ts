import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/auth-utils";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    if (!(await checkRateLimit("register", 5, 10 * 60 * 1000))) {
      return NextResponse.json({ error: "Too many registrations, try later" }, { status: 429 });
    }

    const body = await req.json();
    const result = await registerUser(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Registration failed" }, { status: 400 });
    }

    return NextResponse.json({ success: true, userId: result.userId }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
