"use server";

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { generateInvoiceNumber } from "@/lib/utils";

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
        newData: { name: user.name, email: user.email, role: user.role },
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
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store OTP in Redis or database
  await prisma.verificationToken.create({
    data: {
      identifier: phone,
      token: otp,
      expires: expiresAt,
    },
  });

  // TODO: Integrate with Twilio/Msg91 for SMS
  // For development, log OTP
  console.log(`OTP for ${phone}: ${otp}`);

  return { success: true };
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
    return { success: false, error: "User not found" };
  }

  const token = generateInvoiceNumber("RST");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires: expiresAt,
    },
  });

  // TODO: Send reset email via Resend/SMTP
  console.log(`Password reset token for ${email}: ${token}`);

  return { success: true };
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
