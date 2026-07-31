import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/totp";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const { email, token } = await req.json();
    if (!email || !token) {
      return NextResponse.json({ error: "Email and token required" }, { status: 400 });
    }

    if (!(await checkRateLimit(`2fa:${email}`, 5, 60000))) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.twoFactorSecret || !user.twoFactorEnabled) {
      return NextResponse.json({ error: "2FA not configured" }, { status: 400 });
    }

    if (!verifyToken(user.twoFactorSecret, token)) {
      return NextResponse.json({ error: "Invalid 2FA code" }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("2FA verify error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
