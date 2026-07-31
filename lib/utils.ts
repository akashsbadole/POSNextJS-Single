import { prisma } from "@/lib/db";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export async function generateInvoiceNumber(prefix: string = "INV"): Promise<string> {
  const counter = await prisma.invoiceCounter.upsert({
    where: { prefix },
    update: { counter: { increment: 1 } },
    create: { prefix, counter: 1 },
  });
  const seq = String(counter.counter).padStart(5, "0");
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  return `${prefix}-${date}-${seq}`;
}
// ponytail: gapless per-prefix counter. Resets sequence on counter overflow (99999 → next prefix uses fresh row).

export function calculateGST(amount: number, rate: number): { cgst: number; sgst: number; total: number } {
  const total = (amount * rate) / 100;
  return {
    cgst: total / 2,
    sgst: total / 2,
    total,
  };
}

// amount already includes GST at rate — back out the tax portion (tax-inclusive pricing)
export function calculateGSTInclusive(amount: number, rate: number): { cgst: number; sgst: number; total: number } {
  const base = amount / (1 + rate / 100);
  const tax = amount - base;
  return {
    cgst: tax / 2,
    sgst: tax / 2,
    total: amount,
  };
}

export function getExpiryStatus(expiryDate: Date): { status: "safe" | "warning" | "critical" | "expired"; daysLeft: number } {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) return { status: "expired", daysLeft };
  if (daysLeft <= 7) return { status: "critical", daysLeft };
  if (daysLeft <= 30) return { status: "warning", daysLeft };
  return { status: "safe", daysLeft };
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
