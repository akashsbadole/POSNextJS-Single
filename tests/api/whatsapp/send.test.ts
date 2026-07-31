import { createHmac } from "crypto";
import { GET as GET_SEND, POST as POST_SEND } from "@/app/api/whatsapp/send/route";
import { verifyHubSignature } from "@/lib/whatsapp";
import { createRequest, expectJson, expectStatus } from "../../helpers";

describe("WhatsApp send API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rejects a template outside the whitelist", async () => {
    const req = createRequest("/api/whatsapp/send", { method: "POST", body: { to: "919876543210", templateId: "spam_everyone" } });
    const { res } = await expectStatus(POST_SEND, req, 400);
  });

  it("returns graceful not-configured when env is absent", async () => {
    const req = createRequest("/api/whatsapp/send", { method: "POST", body: { to: "919876543210", templateId: "promise_order_fulfilled", params: {} } });
    const { json } = await expectJson(POST_SEND, req);
    expect(json.success).toBe(false);
    expect(json.error).toContain("not configured");
  });

  it("reports configuration status", async () => {
    process.env.WHATSAPP_ACCESS_TOKEN = "tok";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "pnid";
    process.env.WHATSAPP_PROVIDER = "360dialog";
    const { json } = await expectJson(GET_SEND, createRequest("/api/whatsapp/send"));
    expect(json.configured).toBe(true);
    expect(json.templates).toContain("promise_order_fulfilled");
  });
});

describe("verifyHubSignature", () => {
  const secret = "app-secret";
  const body = JSON.stringify({ entry: [{ changes: [{ value: { messages: [] } }] }] });

  it("accepts a valid HMAC signature", () => {
    const sig = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyHubSignature(body, sig, secret)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const sig = "sha256=" + createHmac("sha256", secret).update(body + "x").digest("hex");
    expect(verifyHubSignature(body, sig, secret)).toBe(false);
  });

  it("rejects a malformed signature", () => {
    expect(verifyHubSignature(body, "not-hmac", secret)).toBe(false);
    expect(verifyHubSignature(body, null, secret)).toBe(false);
  });
});
