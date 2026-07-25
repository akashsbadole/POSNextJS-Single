import { POST as registerUser } from "@/app/api/auth/register/route";
import { POST as forgotPassword } from "@/app/api/auth/forgot-password/route";
import { prismaMock } from "../setup/mocks/prisma";
import { createRequest, expectJson } from "../helpers";

jest.mock("bcryptjs", () => ({ hash: jest.fn(() => "hashed"), compare: jest.fn(() => true) }));
jest.mock("@/lib/utils", () => ({ generateInvoiceNumber: jest.fn(() => "RST-260701-00001") }));

describe("Auth Flow", () => {
  beforeEach(() => jest.clearAllMocks());

  it("full registration flow", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: "u1", name: "Test User", email: "test@test.com", role: "OWNER" } as never);
    prismaMock.auditLog.create.mockResolvedValue({} as never);

    const req = createRequest("/api/auth/register", {
      method: "POST",
      body: { name: "Test User", email: "test@test.com", phone: "9876543210", password: "SecurePass123", role: "OWNER" },
    });
    const { json } = await expectJson(registerUser, req);
    expect(json.success).toBe(true);
  });

  it("password reset flow", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "u1", email: "test@test.com" } as never);
    prismaMock.verificationToken.create.mockResolvedValue({} as never);
    prismaMock.invoiceCounter.upsert.mockResolvedValue({ prefix: "RST", counter: 1 } as never);

    const req = createRequest("/api/auth/forgot-password", { method: "POST", body: { email: "test@test.com" } });
    const { json } = await expectJson(forgotPassword, req);
    expect(json.success).toBe(true);
  });
});
