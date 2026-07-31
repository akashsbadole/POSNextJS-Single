import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { generateSecret, verifyToken, otpauthUri } from "@/lib/totp";

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.twoFactorEnabled) {
      return NextResponse.json({ error: "2FA already enabled. Disable first to re-enroll." }, { status: 400 });
    }

    const secret = user.twoFactorSecret || generateSecret();

    if (!user.twoFactorSecret) {
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorSecret: secret },
      });
    }

    return NextResponse.json({
      secret,
      uri: otpauthUri(secret, user.email),
    });
  } catch (error) {
    console.error("2FA enroll error:", error);
    return NextResponse.json({ error: "Failed to setup 2FA" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("2FA disable error:", error);
    return NextResponse.json({ error: "Failed to disable 2FA" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || !user.twoFactorSecret) {
      return NextResponse.json({ error: "No 2FA secret found" }, { status: 400 });
    }

    if (!verifyToken(user.twoFactorSecret, token)) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("2FA verify error:", error);
    return NextResponse.json({ error: "Failed to enable 2FA" }, { status: 500 });
  }
}
