jest.mock("jose", () => {
  const realToken = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ1c2VyLTEiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJwdXJwb3NlIjoib3RwLWxvZ2luIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjk5OTk5OTk5OTl9.signature";
  return {
    SignJWT: jest.fn().mockImplementation(() => ({
      setProtectedHeader: jest.fn().mockReturnThis(),
      setIssuedAt: jest.fn().mockReturnThis(),
      setExpirationTime: jest.fn().mockReturnThis(),
      sign: jest.fn().mockResolvedValue(realToken),
    })),
    jwtVerify: jest.fn().mockImplementation((token: string) => {
      if (token === "garbage") return Promise.reject(new Error("bad token"));
      return Promise.resolve({
        payload: {
          userId: "user-1",
          email: "test@test.com",
          purpose: "otp-login",
        },
      });
    }),
  };
});

import { createOTPToken, verifyOTPToken } from "@/lib/otp-token";

describe("OTP Token", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("creates a token", async () => {
    const token = await createOTPToken("user-1", "test@test.com");
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
  });

  it("verifies a valid token", async () => {
    const payload = await verifyOTPToken("valid-token");
    expect(payload?.userId).toBe("user-1");
    expect(payload?.email).toBe("test@test.com");
    expect(payload?.purpose).toBe("otp-login");
  });

  it("rejects garbage tokens", async () => {
    const payload = await verifyOTPToken("garbage");
    expect(payload).toBeNull();
  });
});
