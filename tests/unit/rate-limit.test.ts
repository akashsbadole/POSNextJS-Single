import { checkRateLimit, checkOTP, checkLogin } from "@/lib/rate-limit";
import { prismaMock } from "../setup/mocks/prisma";

describe("checkRateLimit", () => {
  beforeEach(() => {
    prismaMock.rateLimitEntry.count.mockReset();
    prismaMock.rateLimitEntry.create.mockReset();
  });

  it("allows first request", async () => {
    prismaMock.rateLimitEntry.count.mockResolvedValue(0);
    prismaMock.rateLimitEntry.create.mockResolvedValue({} as never);
    const result = await checkRateLimit("test-key", 5, 60000);
    expect(result).toBe(true);
  });

  it("blocks when over limit", async () => {
    prismaMock.rateLimitEntry.count.mockResolvedValue(5);
    const result = await checkRateLimit("test-key", 5, 60000);
    expect(result).toBe(false);
    expect(prismaMock.rateLimitEntry.create).not.toBeCalled();
  });

  it("allows at exact limit boundary", async () => {
    prismaMock.rateLimitEntry.count.mockResolvedValue(4);
    prismaMock.rateLimitEntry.create.mockResolvedValue({} as never);
    const result = await checkRateLimit("test-key", 5, 60000);
    expect(result).toBe(true);
  });
});

describe("checkOTP", () => {
  it("uses correct key prefix and limits", async () => {
    prismaMock.rateLimitEntry.count.mockResolvedValue(0);
    prismaMock.rateLimitEntry.create.mockResolvedValue({} as never);
    await checkOTP("email", "test@test.com");
    expect(prismaMock.rateLimitEntry.count).toBeCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ key: "otp:email:test@test.com" }) }),
    );
  });
});

describe("checkLogin", () => {
  it("uses correct key prefix and limits", async () => {
    prismaMock.rateLimitEntry.count.mockResolvedValue(0);
    prismaMock.rateLimitEntry.create.mockResolvedValue({} as never);
    await checkLogin("test@test.com");
    expect(prismaMock.rateLimitEntry.count).toBeCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ key: "login:test@test.com" }) }),
    );
  });
});
