import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await prisma.notification.create({
      data: {
        userId: "system",
        type: "WHATSAPP",
        title: `WhatsApp: ${body.templateId}`,
        message: `To ${body.to}: ${JSON.stringify(body.params)}`,
        channels: JSON.stringify(["whatsapp"]),
      },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
