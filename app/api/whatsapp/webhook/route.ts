import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyHubSignature } from "@/lib/whatsapp";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const expected = process.env.WHATSAPP_VERIFY_TOKEN || process.env.WHATSAPP_API_KEY || "";

  if (mode === "subscribe" && token && expected && token === expected && challenge) {
    // Meta requires the raw challenge text, not JSON
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  // Meta Cloud API signs with X-Hub-Signature-256; 360dialog-style setups use a plain header secret
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  const hubSignature = req.headers.get("x-hub-signature-256");
  const headerSecret = process.env.WEBHOOK_SECRET;

  if (appSecret && hubSignature) {
    if (!verifyHubSignature(rawBody, hubSignature, appSecret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
  } else if (headerSecret) {
    if (req.headers.get("x-webhook-secret") !== headerSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  } else {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 });
  }

  try {
    const body = JSON.parse(rawBody);
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (value?.messages) {
      for (const message of value.messages) {
        const from = message.from;
        const text = message.text?.body?.toLowerCase() || "";

        if (text.includes("stop")) {
          const user = await prisma.user.findFirst({ where: { phone: from } });
          if (user) {
            await prisma.notification.create({
              data: {
                userId: user.id,
                type: "WHATSAPP",
                title: "Unsubscribe request",
                message: `User ${user.name || from} requested to stop notifications`,
                channels: JSON.stringify(["whatsapp"]),
              },
            });
          }
        }
      }
    }

    if (value?.statuses) {
      for (const status of value.statuses) {
        const user = await prisma.user.findFirst({ where: { phone: status.recipient_id } });
        if (user) {
          await prisma.notification.create({
            data: {
              userId: user.id,
              type: "WHATSAPP",
              title: `Message ${status.status}`,
              message: `ID ${status.id} for ${status.recipient_id}: ${status.status}`,
              channels: JSON.stringify(["whatsapp"]),
            },
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
