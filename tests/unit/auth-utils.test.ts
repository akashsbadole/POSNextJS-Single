import { prismaMock } from "../setup/mocks/prisma";

jest.mock("bcryptjs", () => ({
  hash: jest.fn(() => Promise.resolve("$2a$12$hashedpassword")),
  compare: jest.fn(() => Promise.resolve(true)),
}));

describe("registerUser", () => {
  beforeEach(() => { jest.resetModules(); });

  it("registers a new user successfully", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: "new-user", name: "Test", email: "test@test.com",
      phone: "9876543210", password: "hashed", role: "OWNER",
    } as never);
    prismaMock.auditLog.create.mockResolvedValue({} as never);

    const { registerUser } = await import("@/lib/auth-utils");
    const result = await registerUser({
      name: "Test User", email: "test@test.com",
      phone: "9876543210", password: "secure123", role: "OWNER",
    });
    expect(result.success).toBe(true);
    expect(result.userId).toBe("new-user");
  });

  it("rejects duplicate emails", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "existing" } as never);
    const { registerUser } = await import("@/lib/auth-utils");
    const result = await registerUser({
      name: "Test", email: "existing@test.com",
      phone: "9876543210", password: "secure123",
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("already registered");
  });

  it("validates input schema", async () => {
    const { registerUser } = await import("@/lib/auth-utils");
    const result = await registerUser({
      name: "A", email: "bad-email",
      phone: "123", password: "12",
    });
    expect(result.success).toBe(false);
  });
});

describe("verifyOTP", () => {
  it("verifies valid OTP", async () => {
    prismaMock.verificationToken.findFirst.mockResolvedValue({
      identifier: "9876543210", token: "123456", expires: new Date(Date.now() + 600000),
    } as never);
    prismaMock.verificationToken.delete.mockResolvedValue({} as never);

    const { verifyOTP } = await import("@/lib/auth-utils");
    const result = await verifyOTP("9876543210", "123456");
    expect(result.success).toBe(true);
  });

  it("rejects invalid OTP", async () => {
    prismaMock.verificationToken.findFirst.mockResolvedValue(null);
    const { verifyOTP } = await import("@/lib/auth-utils");
    const result = await verifyOTP("9876543210", "wrong");
    expect(result.success).toBe(false);
  });
});
