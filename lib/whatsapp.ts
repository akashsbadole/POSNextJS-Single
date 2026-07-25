const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || "";
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY || "";

export async function sendTemplate(to: string, templateId: string, params: Record<string, unknown>) {
  if (!WHATSAPP_API_URL || !WHATSAPP_API_KEY) {
    return { success: false, error: "WhatsApp not configured" };
  }

  try {
    const res = await fetch(WHATSAPP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${WHATSAPP_API_KEY}`,
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

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

    return { success: true };
  } catch (err) {
    console.error("[whatsapp] sendTemplate error:", err);
    return { success: false, error: String(err) };
  }
}
