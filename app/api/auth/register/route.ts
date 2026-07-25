import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/auth-utils";

export async function POST(req: NextRequest) {
  try {
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
