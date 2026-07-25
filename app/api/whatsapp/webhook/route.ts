import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendTemplate } from "@/lib/whatsapp";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_API_KEY) {
    return NextResponse.json(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (value?.messages) {
      for (const message of value.messages) {
        const from = message.from;
        const text = message.text?.body?.toLowerCase() || "";

        if (text.includes("stop")) {
          await prisma.notification.create({
            data: {
              userId: from,
              type: "WHATSAPP",
              title: "Unsubscribe request",
              message: `User ${from} requested to stop notifications`,
              channels: JSON.stringify(["whatsapp"]),
            },
          });
        }
      }
    }

    if (value?.statuses) {
      for (const status of value.statuses) {
        await prisma.notification.create({
          data: {
            userId: "system",
            type: "WHATSAPP",
            title: `Message ${status.status}`,
            message: `ID ${status.id} for ${status.recipient_id}: ${status.status}`,
            channels: JSON.stringify(["whatsapp"]),
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
