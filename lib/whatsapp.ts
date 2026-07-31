import { createHmac, timingSafeEqual } from "crypto";

export type WhatsAppResult = { success: boolean; error?: string };

export function whatsappProvider(): string {
  return (process.env.WHATSAPP_PROVIDER || "360dialog").toLowerCase();
}

// ponytail: provider switch on env only — both speak the Meta template-message
// wire format. 360dialog mirrors the Cloud API endpoint, Twilio uses ContentSid.
export function whatsappConfigured(): boolean {
  const provider = whatsappProvider();
  if (provider === "twilio") {
    return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_MESSAGING_SID);
  }
  return !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

export async function sendTemplate(to: string, templateId: string, params: Record<string, unknown>): Promise<WhatsAppResult> {
  if (!whatsappConfigured()) {
    return { success: false, error: "WhatsApp not configured" };
  }
  const provider = whatsappProvider();

  try {
    if (provider === "twilio") {
      const form = new URLSearchParams({
        To: to,
        MessagingServiceSid: process.env.TWILIO_MESSAGING_SID!,
        ContentSid: templateId,
        ContentVariables: JSON.stringify(params),
      });
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      return { success: true };
    }

    const res = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateId,
          language: { code: "en" },
          components: [{
            type: "body",
            parameters: Object.entries(params).map(([k, v]) => ({ type: "text", parameter_name: k, text: String(v) })),
          }],
        },
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    return { success: true };
  } catch (err) {
    console.error("[whatsapp] sendTemplate error:", err);
    return { success: false, error: String(err) };
  }
}

// Meta signs webhook POSTs with X-Hub-Signature-256 = HMAC-SHA256(APP_SECRET, rawBody)
export function verifyHubSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !signature.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const given = signature.slice("sha256=".length);
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}
