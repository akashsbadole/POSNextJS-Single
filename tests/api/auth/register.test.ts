import { POST } from "@/app/api/auth/register/route";
import { prismaMock } from "../../setup/mocks/prisma";
import { createRequest, expectJson } from "../../helpers";

jest.mock("bcryptjs", () => ({ hash: jest.fn(() => "hashed"), compare: jest.fn(() => true) }));

describe("POST /api/auth/register", () => {
  beforeEach(() => jest.clearAllMocks());

  it("registers a new user", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: "u1", name: "Test", email: "test@test.com" } as never);
    prismaMock.auditLog.create.mockResolvedValue({} as never);

    const req = createRequest("/api/auth/register", {
      method: "POST",
      body: { name: "Test User", email: "test@test.com", phone: "9876543210", password: "secure123" },
    });
    const { json } = await expectJson(POST, req);
    expect(json.success).toBe(true);
  });

  it("rejects duplicate email", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "existing" } as never);
    const req = createRequest("/api/auth/register", {
      method: "POST",
      body: { name: "Test", email: "dup@test.com", phone: "9876543210", password: "secure123" },
    });
    const { json, res } = await expectJson(POST, req);
    expect(res.status).toBe(400);
    expect(json.error).toContain("already registered");
  });
});
