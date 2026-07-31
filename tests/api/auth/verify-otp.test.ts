import { POST } from "@/app/api/auth/verify-otp/route";
import { prismaMock } from "../../setup/mocks/prisma";
import { createRequest, expectJson, expectStatus } from "../../helpers";

jest.mock("@/lib/auth-utils", () => ({ verifyOTP: jest.fn().mockResolvedValue({ success: true }) }));
jest.mock("@/lib/otp-token", () => ({ createOTPToken: jest.fn().mockResolvedValue("test-token") }));

describe("POST /api/auth/verify-otp", () => {
  beforeEach(() => jest.clearAllMocks());

  it("verifies OTP and returns user", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "u1", name: "Test", email: "test@test.com", phone: "9876543210", role: "OWNER" } as never);
    const { json } = await expectJson(POST, createRequest("/api/auth/verify-otp", { method: "POST", body: { phone: "9876543210", otp: "123456" } }));
    expect(json.success).toBe(true);
    expect(json.user.id).toBe("u1");
  });

  it("rejects missing fields", async () => {
    const { res } = await expectStatus(POST, createRequest("/api/auth/verify-otp", { method: "POST", body: { phone: "9876543210" } }), 400);
  });

  it("returns 400 for unknown user", async () => {
    const { verifyOTP } = jest.requireMock("@/lib/auth-utils") as { verifyOTP: jest.Mock };
    verifyOTP.mockResolvedValue({ success: true });
    prismaMock.user.findUnique.mockResolvedValue(null);
    const { res } = await expectStatus(POST, createRequest("/api/auth/verify-otp", { method: "POST", body: { phone: "9999999999", otp: "123456" } }), 400);
  });
});
