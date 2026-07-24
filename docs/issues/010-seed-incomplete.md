# 010 — Seed data missing most entities

**Priority:** 🟠 High
**Area:** Data
**Evidence:**
- `prisma/seed.ts` seeds only: Branch (2), admin User, Category (7), Supplier (3),
  Medicine (3), Inventory (4), Patient (2), Doctor (2), LoyaltyTier (3), Setting (5)

## Description
No sales, purchases, prescriptions, online orders, subscriptions, audit logs,
stock transfers, expenses, notifications, loyalty points, or non-admin users are
seeded. Because of this, every genuinely-working page (dashboard, sales, purchases,
reports) renders empty until data is entered by hand, making the app look broken
on a fresh seed.

## Fix
- Extend `prisma/seed.ts` to create demo: non-admin users across roles, sales +
  sale items + payments, purchase orders + GRN, prescriptions + items, online
  orders, subscriptions + deliveries, a few audit logs and notifications.
- Keep counts modest so `prisma db seed` stays fast.
