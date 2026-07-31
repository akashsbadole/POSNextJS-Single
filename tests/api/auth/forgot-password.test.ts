import { POST } from "@/app/api/auth/forgot-password/route";
import { prismaMock } from "../../setup/mocks/prisma";
import { createRequest, expectJson, expectStatus } from "../../helpers";

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns generic message for any email", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "u1", email: "user@test.com" } as never);
    prismaMock.verificationToken.create.mockResolvedValue({} as never);
    const req = createRequest("/api/auth/forgot-password", { method: "POST", body: { email: "user@test.com" } });
    const { json } = await expectJson(POST, req);
    expect(json.success).toBe(true);
    expect(json.message).toContain("If the account exists");
  });

  it("returns same message for non-existing email", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const req = createRequest("/api/auth/forgot-password", { method: "POST", body: { email: "nonexistent@test.com" } });
    const { json } = await expectJson(POST, req);
    expect(json.success).toBe(true);
    expect(json.message).toContain("If the account exists");
  });
});
