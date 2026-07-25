import { POST } from "@/app/api/auth/send-otp/route";
import { createRequest, expectJson, expectStatus } from "../../helpers";

jest.mock("@/lib/auth-utils", () => ({ sendOTP: jest.fn().mockResolvedValue({ success: true }) }));
jest.mock("@/lib/rate-limit", () => ({ checkOTP: jest.fn().mockResolvedValue(true) }));

describe("POST /api/auth/send-otp", () => {
  afterEach(() => jest.clearAllMocks());

  it("sends OTP for valid phone", async () => {
    const { json } = await expectJson(POST, createRequest("/api/auth/send-otp", { method: "POST", body: { phone: "9876543210" } }));
    expect(json.success).toBe(true);
  });

  it("rejects invalid phone", async () => {
    const { res } = await expectStatus(POST, createRequest("/api/auth/send-otp", { method: "POST", body: { phone: "123" } }), 400);
    const json = await res.json();
    expect(json.error).toContain("10-digit");
  });

  it("returns 429 on rate limit", async () => {
    const { checkOTP } = jest.requireMock("@/lib/rate-limit") as { checkOTP: jest.Mock };
    checkOTP.mockResolvedValue(false);
    const { res } = await expectStatus(POST, createRequest("/api/auth/send-otp", { method: "POST", body: { phone: "9876543210" } }), 429);
  });
});
