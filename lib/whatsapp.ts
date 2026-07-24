export async function sendTemplate(to: string, templateId: string, params: Record<string, unknown>) {
  const payload = {
    to,
    templateId,
    params,
    sentAt: new Date().toISOString(),
  };

  console.log("[whatsapp] sendTemplate", payload);

  try {
    await fetch("/api/whatsapp/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // swallow webhook errors in stub mode
  }

  return payload;
}
