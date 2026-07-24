import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "onboarding_completed" },
    });
    return NextResponse.json({ completed: setting?.value === "true" });
  } catch (error) {
    console.error("Error fetching onboarding status:", error);
    return NextResponse.json({ completed: false }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await req.json();
    await prisma.setting.upsert({
      where: { key: "onboarding_completed" },
      update: { value: "true" },
      create: { key: "onboarding_completed", value: "true", category: "GENERAL", description: "Onboarding wizard completed" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return NextResponse.json({ error: "Failed to complete onboarding" }, { status: 500 });
  }
}
