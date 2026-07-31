import { GET, POST } from "@/app/api/whatsapp/webhook/route";
import { prismaMock } from "../../setup/mocks/prisma";
import { createRequest, expectJson, expectStatus } from "../../helpers";

describe("WhatsApp Webhook API", () => {
  beforeEach(() => { jest.clearAllMocks(); process.env.WHATSAPP_API_KEY = "test-key"; process.env.WEBHOOK_SECRET = "wh-secret"; });

  function whRequest(url: string, init?: { method?: string; body?: Record<string, unknown> }) {
    const req = createRequest(url, init);
    req.headers.set("x-webhook-secret", "wh-secret");
    return req;
  }

  it("verifies webhook with valid token", async () => {
    const req = createRequest("/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=test-key&hub.challenge=challenge123");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toBe("challenge123");
  });

  it("rejects verification with invalid token", async () => {
    const req = createRequest("/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=challenge123");
    const { res } = await expectStatus(GET as never, req as never, 403);
  });

  it("processes incoming messages", async () => {
    prismaMock.notification.create.mockResolvedValue({} as never);
    const { json } = await expectJson(POST, whRequest("/api/whatsapp/webhook", {
      method: "POST",
      body: { entry: [{ changes: [{ value: { messages: [{ from: "919876543210", text: { body: "Stop" } }] } }] }] },
    }));
    expect(json.received).toBe(true);
    expect(prismaMock.notification.create).toBeCalled();
  });

  it("processes status updates", async () => {
    prismaMock.notification.create.mockResolvedValue({} as never);
    const { json } = await expectJson(POST, whRequest("/api/whatsapp/webhook", {
      method: "POST",
      body: { entry: [{ changes: [{ value: { statuses: [{ id: "st1", recipientId: "919876543210", status: "sent" }] } }] }] },
    }));
    expect(json.received).toBe(true);
  });
});
