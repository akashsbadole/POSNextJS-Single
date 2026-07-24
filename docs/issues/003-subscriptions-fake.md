# 003 — Subscriptions page is fake SaaS pricing — ✅ RESOLVED

**Resolved:** 2026-07-19
**Fix:** Added `app/api/subscriptions/route.ts` (GET/POST/PATCH/DELETE). Rebuilt
`subscriptions/page.tsx` to create, pause/resume, cancel, and view real
`Subscription` records with items + scheduled deliveries. Removed the fake SaaS
pricing UI. Seed already includes demo subscriptions + deliveries.


**Priority:** 🟠 High
**Area:** Phase 4
**Evidence:**
- `app/(dashboard)/subscriptions/page.tsx:8-24` — hardcoded plan matrix
- `app/(dashboard)/subscriptions/page.tsx:67-76` — hardcoded "Current Plan"
- No `app/api/subscriptions` route exists

## Description
The page shows SaaS subscription *pricing tiers* (Starter/Professional/Enterprise)
rather than the actual recurring-medicine-delivery feature the schema supports
(`Subscription`, `SubscriptionItem`, `SubscriptionDelivery` at
`prisma/schema.prisma:673-721`). There is no API and no data binding.

## Fix
- Add `app/api/subscriptions/route.ts` (CRUD on Subscription + items + deliveries).
- Rebuild the page to manage real subscriptions: create/edit/pause, view scheduled
  deliveries, and trigger `SubscriptionDelivery` records.
- Remove the fake SaaS pricing UI (or move it to a separate billing screen if needed).
