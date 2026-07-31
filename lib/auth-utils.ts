"use server";

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
// ponytail: generateInvoiceNumber import removed — reset tokens now use crypto.randomBytes

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().regex(/^\d{10}$/),
  password: z.string().min(6),
  role: z.enum(["OWNER", "MANAGER", "PHARMACIST", "CASHIER"]).default("CASHIER"),
  branchId: z.string().optional(),
});

export async function registerUser(data: z.infer<typeof registerSchema>) {
  try {
    const validated = registerSchema.parse(data);

    const existing = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existing) {
      return { success: false, error: "Email already registered" };
    }

    const hashedPassword = await bcrypt.hash(validated.password, 12);

    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        phone: validated.phone,
        password: hashedPassword,
        role: validated.role,
        branchId: validated.branchId,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE",
        entityType: "user",
        entityId: user.id,
        newData: JSON.stringify({ name: user.name, email: user.email, role: user.role }),
      },
    });

    return { success: true, userId: user.id };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: "Failed to register user" };
  }
}

// OTP Functions
export async function sendOTP(phone: string) {
  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.verificationToken.create({
    data: {
      identifier: phone,
      token: otp,
      expires: expiresAt,
    },
  });

  await sendSMS(phone, `Your PharmacyPro OTP is ${otp}. Valid for 10 minutes.`);

  return { success: true };
}

async function sendSMS(phone: string, message: string) {
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
  const msg91Key = process.env.MSG91_AUTH_KEY;

  try {
    if (twilioSid && twilioToken && twilioPhone) {
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ To: `+91${phone}`, From: twilioPhone, Body: message }),
      });
      return;
    }
    if (msg91Key) {
      await fetch("https://api.msg91.com/api/v5/flow/", {
        method: "POST",
        headers: { "authkey": msg91Key, "Content-Type": "application/json" },
        body: JSON.stringify({ sender: "PHARM", mobiles: phone, message }),
      });
      return;
    }
  } catch {
    // fall through to console.log
  }
  // ponytail: SMS providers not configured. Wire Twilio or MSG91 env vars to remove this.
  console.log(`[SMS to ${phone}] ${message}`);
}

export async function verifyOTP(phone: string, otp: string) {
  const token = await prisma.verificationToken.findFirst({
    where: {
      identifier: phone,
      token: otp,
      expires: { gt: new Date() },
    },
  });

  if (!token) {
    return { success: false, error: "Invalid or expired OTP" };
  }

  // Delete used token
  await prisma.verificationToken.delete({
    where: { token: otp },
  });

  return { success: true };
}

// Password reset
export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { success: true };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires: expiresAt,
    },
  });

  await sendResetEmail(email, token);

  return { success: true };
}

async function sendResetEmail(email: string, token: string) {
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "noreply@pharmacypro.app";
  try {
    if (resendKey) {
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: email,
          subject: "Reset your PharmacyPro password",
          html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`,
        }),
      });
      return;
    }
  } catch {
    // fall through
  }
  console.log(`Password reset token for ${email}: ${token}`);
}

export async function resetPassword(token: string, newPassword: string) {
  const verification = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verification || verification.expires < new Date()) {
    return { success: false, error: "Invalid or expired token" };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { email: verification.identifier },
    data: { password: hashedPassword },
  });

  await prisma.verificationToken.delete({
    where: { token },
  });

  return { success: true };
}
