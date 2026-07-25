import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const getSecret = () => new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "dev-secret-fallback");

interface OTPPayload extends JWTPayload {
  userId: string;
  email: string;
  purpose: "otp-login";
}

export async function createOTPToken(userId: string, email: string) {
  return new SignJWT({ userId, email, purpose: "otp-login" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(getSecret());
}

export async function verifyOTPToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    if ((payload as OTPPayload).purpose !== "otp-login") return null;
    return payload as OTPPayload;
  } catch {
    return null;
  }
}
