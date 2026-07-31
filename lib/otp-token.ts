import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const getSecret = () => new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "dev-secret-fallback");

export type OTPPurpose = "otp-login" | "2fa-login";

interface OTPPayload extends JWTPayload {
  userId: string;
  email: string;
  purpose: OTPPurpose;
}

export async function createOTPToken(userId: string, email: string, purpose: OTPPurpose = "otp-login") {
  return new SignJWT({ userId, email, purpose })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(getSecret());
}

export async function verifyOTPToken(token: string, purpose?: OTPPurpose) {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    const otpPayload = payload as OTPPayload;
    if (otpPayload.purpose !== (purpose ?? "otp-login")) return null;
    return otpPayload;
  } catch {
    return null;
  }
}
