import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET() {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const settings = await prisma.setting.findMany();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const { key, value, category, description } = body;
    if (!key) return NextResponse.json({ error: "Setting key required" }, { status: 400 });

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value, ...(category ? { category } : {}), ...(description !== undefined ? { description } : {}) },
      create: { key, value, category: category || "GENERAL", description },
    });

    return NextResponse.json(setting);
  } catch (error) {
    console.error("Error updating setting:", error);
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
  }
}
