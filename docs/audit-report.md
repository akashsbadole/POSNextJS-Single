# Pharmacy Management System — Audit Report

**Date:** 2026-07-18  
**Database:** SQLite (`pharmacy.db`)  
**Node:** v26.3.0 | **Next.js:** 15.5.20 | **Prisma:** 6.19.3 | **next-auth:** v4

---

## TypeScript Status

`tsc --noEmit` passes with **zero errors** after fixes.

---

## 🔴 Critical Bugs

### 1. Sales API — Inventory decrement without stock check
**File:** `app/api/sales/route.ts:47-50`  
**Issue:** `prisma.inventory.updateMany` decrements `quantity` without verifying sufficient stock first. If quantity is 0 or below the ordered amount, inventory goes negative.  
**Fix needed:** Add a stock validation query before decrementing.

### 2. Sales API — Payment always marked "PAID"
**File:** `app/api/sales/route.ts:87`  
**Issue:** `paymentStatus: "PAID"` is hardcoded regardless of payment mode. Credit/invoice sales should use `"PENDING"`.  
**Fix needed:** Set `paymentStatus` based on `paymentMode` (credit → PENDING, others → PAID).

### 3. Medicines API — No inventory record created on POST
**File:** `app/api/medicines/route.ts:89-91`  
**Issue:** Creating a medicine only inserts into the `Medicine` table. No `Inventory` record is created, so the medicine has no stock tracking.  
**Fix needed:** After creating the medicine, also create an `Inventory` record for the given (or default) branch.

### 4. Medicines API — No PUT/PATCH/DELETE endpoints
**File:** `app/api/medicines/route.ts`  
**Issue:** Only GET (list) and POST (create) are implemented. No way to update or delete medicines through the API.

### 5. Middleware — `/dashboard` bypasses role check
**File:** `middleware.ts:23`  
**Issue:** `if (!isAllowed && path !== "/dashboard")` excludes `/dashboard` from role authorization. Any authenticated user can access the dashboard regardless of their assigned role.

### 6. Middleware — Redirect loop risk for unauthenticated users
**File:** `middleware.ts:32-35`  
**Issue:** When `authorized` returns false, `withAuth` redirects to the sign-in page. If the sign-in page itself triggers a redirect, an infinite loop occurs.  
**Status:** Partially mitigated — `/login`, `/register`, `/forgot-password`, `/otp-verify` are allowed without auth.

---

## 🟡 Missing CRUD Operations

### API Routes Summary

| Entity | File | GET | POST | PUT/PATCH | DELETE |
|--------|------|:---:|:----:|:---------:|:------:|
| Auth | `app/api/auth/[...nextauth]/route.ts` | ✅ | ✅ | ❌ | ❌ |
| Medicines | `app/api/medicines/route.ts` | ✅ | ✅ | ❌ | ❌ |
| Sales | `app/api/sales/route.ts` | ✅ | ✅ | ❌ | ❌ |
| Categories | — | ❌ | ❌ | ❌ | ❌ |
| Suppliers | — | ❌ | ❌ | ❌ | ❌ |
| Inventory / Stock | — | ❌ | ❌ | ❌ | ❌ |
| Patients | — | ❌ | ❌ | ❌ | ❌ |
| Doctors | — | ❌ | ❌ | ❌ | ❌ |
| Prescriptions | — | ❌ | ❌ | ❌ | ❌ |
| Purchase Orders | — | ❌ | ❌ | ❌ | ❌ |
| GRN | — | ❌ | ❌ | ❌ | ❌ |
| Returns | — | ❌ | ❌ | ❌ | ❌ |
| Users | — | ❌ | ❌ | ❌ | ❌ |
| Settings | — | ❌ | ❌ | ❌ | ❌ |
| Notifications | — | ❌ | ❌ | ❌ | ❌ |
| Expenses | — | ❌ | ❌ | ❌ | ❌ |
| Online Orders | — | ❌ | ❌ | ❌ | ❌ |
| Subscriptions | — | ❌ | ❌ | ❌ | ❌ |

---

## 🟡 All "Working" Frontend Pages Use Hardcoded Mock Data

Every functional page renders static sample data instead of fetching from the API or database.

| Page | File | Data Source |
|------|------|-------------|
| Dashboard | `app/(dashboard)/dashboard/page.tsx:50-70` | Hardcoded `stats[]`, `recentSales[]`, `lowStockItems[]` |
| Medicines List | `app/inventory/medicines/page.tsx:24-31` | Hardcoded `medicines[]` (6 items) |
| POS | `app/pos/page.tsx:35-42` | Hardcoded `sampleMedicines[]` (6 items) |
| Online Store | `app/online-store/products/page.tsx:20-27` | Hardcoded `products[]` (6 items) |
| Reports | `app/reports/sales/page.tsx:21-36` | Hardcoded `salesData[]`, `topMedicines[]` |
| Prescription Upload | `app/prescriptions/upload/page.tsx:49-71` | Simulated OCR via `setTimeout` |

---

## 🟡 25 of 35 Pages Are "Coming Soon" Placeholders

Pages that render only a `<Construction />` icon:

| Route | File |
|-------|------|
| `/register` | `app/(auth)/register/page.tsx` |
| `/forgot-password` | `app/(auth)/forgot-password/page.tsx` |
| `/otp-verify` | `app/(auth)/otp-verify/page.tsx` |
| `/inventory/categories` | `app/inventory/categories/page.tsx` |
| `/inventory/suppliers` | `app/inventory/suppliers/page.tsx` |
| `/inventory/stock-alerts` | `app/inventory/stock-alerts/page.tsx` |
| `/inventory/bulk-actions` | `app/inventory/bulk-actions/page.tsx` |
| `/sales/invoices` | `app/sales/invoices/page.tsx` |
| `/sales/returns` | `app/sales/returns/page.tsx` |
| `/purchases/orders` | `app/purchases/orders/page.tsx` |
| `/purchases/grn` | `app/purchases/grn/page.tsx` |
| `/purchases/payments` | `app/purchases/payments/page.tsx` |
| `/prescriptions/process` | `app/prescriptions/process/page.tsx` |
| `/prescriptions/patients` | `app/prescriptions/patients/page.tsx` |
| `/prescriptions/doctors` | `app/prescriptions/doctors/page.tsx` |
| `/subscriptions` | `app/subscriptions/page.tsx` |
| `/telemedicine` | `app/telemedicine/page.tsx` |
| `/analytics` | `app/analytics/page.tsx` |
| `/users/management` | `app/users/management/page.tsx` |
| `/users/roles` | `app/users/roles/page.tsx` |
| `/admin/settings` | `app/admin/settings/page.tsx` |
| `/admin/audit-logs` | `app/admin/audit-logs/page.tsx` |
| `/online-store/cart` | `app/online-store/cart/page.tsx` |
| `/online-store/delivery` | `app/online-store/delivery/page.tsx` |
| `/online-store/orders` | `app/online-store/orders/page.tsx` |

---

## 🟡 Login OTP Flow Is Simulated

**File:** `app/(auth)/login/page.tsx:55-60`, `app/(auth)/login/page.tsx:63-72`  
**Issue:** Both `handleSendOTP` and `handleOTPLogin` use `setTimeout` with mock success instead of calling `sendOTP()` / `verifyOTP()` from `lib/auth-utils.ts`.

---

## 🔵 Other Observations

### Missing Database Transaction Handling
- **File:** `app/api/sales/route.ts:68-116`  
  Sale creation, inventory decrement, and audit log creation are not wrapped in a Prisma transaction. If the audit log insert fails after the sale is created and inventory is decremented, data becomes inconsistent.

### No Input Ownership Validation
- Sales POST does not verify that `branchId`, `cashierId`, or `patientId` reference real records.

### No `hooks/` Directory
- All state logic is inline in page components. Custom hooks could reduce duplication (e.g., `useCart`, `useMedicines`).

### Package Size
- Dashboard page imports 44 icons from `lucide-react`. Acceptable with tree-shaking but worth noting.
- 32 npm audit vulnerabilities (3 low, 24 moderate, 4 high, 1 critical).

---

## Previously Fixed Issues

| # | Issue | Fix |
|---|-------|-----|
| 1 | OpenSSL `ERR_OSSL_EVP_UNSUPPORTED` on Node.js 26 | Added `--openssl-legacy-provider` to NODE_OPTIONS |
| 2 | `next` binary not found in `.bin` | Added `npx` prefix in dev script |
| 3 | `withAuth` not exported from `next-auth/middleware` | Downgraded from `next-auth@5` beta to `next-auth@4` |
| 4 | Conflicting `pages/index.tsx` and `app/(dashboard)/page.tsx` | Removed `pages/index.tsx` |
| 5 | Prisma client not initialized | Created `.env` + ran `prisma generate` |
| 6 | `NEXTAUTH_SECRET` missing | Added to `.env` |
| 7 | Prisma schema missing `OnlineOrder.customer` relation | Added `onlineOrders` field to `User` model |
| 8 | Database switched from PostgreSQL to SQLite | Rewrote schema: enums→String, Decimal→Float, Json→String, arrays→String |
| 9 | Redirect loop (middleware blocked `/login`) | Added auth pages to `authorized` callback; passed `pages` config to `withAuth` |
| 10 | `toNumber()` on `number` type (Decimal→Float) | Removed `.toNumber()` calls |
| 11 | Object assigned to `string` field (Json→String) | Wrapped with `JSON.stringify()` |
| 12 | Dashboard served at `/` instead of `/dashboard` | Moved `page.tsx` to `app/(dashboard)/dashboard/` |
| 13 | Missing next-auth type augmentation | Created `types/next-auth.d.ts` |
| 14 | `authOptions` export from route handler conflicted with Next.js types | Removed re-export (middleware imports directly) |
