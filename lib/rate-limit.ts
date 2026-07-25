import { prisma } from "@/lib/db";

const FIVE_MIN = 5 * 60 * 1000;
const TEN_MIN = 10 * 60 * 1000;

export async function checkRateLimit(key: string, maxRequests: number, windowMs: number): Promise<boolean> {
  const cutoff = new Date(Date.now() - windowMs);
  const count = await prisma.rateLimitEntry.count({
    where: { key, windowMs, createdAt: { gte: cutoff } },
  });
  if (count >= maxRequests) return false;
  await prisma.rateLimitEntry.create({ data: { key, windowMs } });
  return true;
}

export async function checkOTP(field: string, value: string) {
  return checkRateLimit(`otp:${field}:${value}`, 5, TEN_MIN);
}

export async function checkLogin(email: string) {
  return checkRateLimit(`login:${email}`, 10, FIVE_MIN);
}
