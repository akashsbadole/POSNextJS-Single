import { NextRequest, NextResponse } from "next/server";
import { sendTemplate, whatsappConfigured } from "@/lib/whatsapp";
import { requireAuth, unauthorized } from "@/lib/api-auth";

// ponytail: whitelist templates server-side — clients only name the message
export const TEMPLATE_WHITELIST = ["promise_order_fulfilled"];

export async function GET() {
  const session = await requireAuth();
  if (!session) return unauthorized();
  return NextResponse.json({ configured: whatsappConfigured(), provider: process.env.WHATSAPP_PROVIDER || "360dialog", templates: TEMPLATE_WHITELIST });
}

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const { to, templateId, params } = body;
    if (typeof to !== "string" || !to.trim()) {
      return NextResponse.json({ error: "Recipient phone required" }, { status: 400 });
    }
    if (!TEMPLATE_WHITELIST.includes(templateId)) {
      return NextResponse.json({ error: "Unknown template" }, { status: 400 });
    }
    const result = await sendTemplate(to.trim(), templateId, params || {});
    return NextResponse.json(result, { status: result.success ? 200 : 502 });
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
