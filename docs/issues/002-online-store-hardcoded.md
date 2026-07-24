# 002 — Online Store is fully hardcoded (no backend) — ✅ RESOLVED

**Resolved:** 2026-07-19
**Fix:** Added `app/api/online-store/products`, `/orders`, `/delivery` routes. Rebuilt
all four pages to use real data:
- `products` — catalog from active medicines with stock + real search/category filter
- `cart` — reads localStorage cart, checkout POSTs to `/api/online-store/orders`
- `orders` — lists real `OnlineOrder` rows with computed stat cards
- `delivery` — lists real deliveries, searchable, with "Mark Delivered" status update
Added `medicine` relations to `OnlineOrderItem`/`SubscriptionItem` (new migration)
so items resolve medicine names. Seed already includes demo online orders.


**Priority:** 🟠 High
**Area:** Phase 3
**Evidence:**
- `app/(dashboard)/online-store/products/page.tsx:20-27` — `const products = [...]`
- `app/(dashboard)/online-store/orders/page.tsx:10-15` — `sampleOrders`
- `app/(dashboard)/online-store/delivery/page.tsx:27-31` — hardcoded array
- `app/(dashboard)/online-store/cart/page.tsx:12-15` — `useState` items, checkout disabled
- No `app/api/online-store/` directory exists

## Description
The entire Online Store module renders static arrays. Schema models
`OnlineOrder` / `OnlineOrderItem` exist (`prisma/schema.prisma:619-671`) but no
API routes read or write them. Cart checkout has no backend.

## Fix
- Add `app/api/online-store/products`, `/cart`, `/orders`, `/delivery` routes backed by Prisma.
- Wire each page to fetch/submit real data.
- Implement checkout → create `OnlineOrder` + `OnlineOrderItem`.
