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
    const { businessType, store_name, gst_number, phone, address } = await req.json();

    const settings = [
      { key: "business_type", value: businessType, category: "GENERAL" },
      { key: "store_name", value: store_name, category: "GENERAL" },
      { key: "gst_number", value: gst_number || "", category: "TAX" },
      { key: "phone", value: phone || "", category: "GENERAL" },
      { key: "address", value: address || "", category: "GENERAL" },
      { key: "onboarding_complete", value: "true", category: "GENERAL" },
    ];

    for (const s of settings) {
      await prisma.setting.upsert({
        where: { key: s.key },
        update: { value: s.value, category: s.category },
        create: { key: s.key, value: s.value, category: s.category },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return NextResponse.json({ error: "Failed to complete onboarding" }, { status: 500 });
  }
}
