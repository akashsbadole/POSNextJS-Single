import { POST } from "@/app/api/auth/reset-password/route";
import { createRequest, expectJson, expectStatus } from "../../helpers";

jest.mock("@/lib/auth-utils", () => ({ resetPassword: jest.fn().mockResolvedValue({ success: true }) }));

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => jest.clearAllMocks());

  it("resets password with valid token", async () => {
    const { json } = await expectJson(POST, createRequest("/api/auth/reset-password", { method: "POST", body: { token: "valid-token", password: "NewSecure123" } }));
    expect(json.success).toBe(true);
  });

  it("rejects short password", async () => {
    const { res } = await expectStatus(POST, createRequest("/api/auth/reset-password", { method: "POST", body: { token: "t", password: "ab" } }), 400);
  });

  it("rejects expired token", async () => {
    const { resetPassword } = jest.requireMock("@/lib/auth-utils") as { resetPassword: jest.Mock };
    resetPassword.mockResolvedValue({ success: false, error: "Invalid or expired token" });
    const { res } = await expectStatus(POST, createRequest("/api/auth/reset-password", { method: "POST", body: { token: "bad", password: "NewSecure123" } }), 400);
  });
});
