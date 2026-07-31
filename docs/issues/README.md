# Issue Index — PharmacyPro

Status legend: ✅ Fixed | 🔴 Not Started | 🟠 In Progress

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 001 | README misrepresents feature completeness | ✅ Fixed | Tracker updated |
| 002 | Online Store is fully hardcoded (no backend) | ✅ Fixed | Real API routes exist |
| 003 | Subscriptions page is fake SaaS pricing | ✅ Fixed | Real CRUD API |
| 004 | Telemedicine is hardcoded mockup | ✅ Fixed | Replaced with proper empty state |
| 005 | Analytics page hardcoded, AI forecast missing | ✅ Fixed | Real API data, forecast text removed |
| 006 | Prescriptions API + processing unimplemented | ✅ Fixed | Real CRUD + upload |
| 007 | Audit Logs page points at missing API | ✅ Fixed | Real audit log route |
| 008 | Users/Roles hardcoded, no enforcement | ✅ Fixed | RBAC middleware active |
| 009 | Admin Settings save is a fake timeout | ✅ Fixed | Real API upsert to DB |
| 010 | Seed data missing most entities | ✅ Fixed | 7 categories, 3 medicines, settings |
| 011 | Sales/Financial/Custom reports use fake data | ✅ Fixed | Real aggregation from DB |
| 012 | Inventory Bulk Actions is a stub | ✅ Fixed | Real CSV export for all entity types |
| 013 | OTP SMS delivery not wired | ✅ Fixed | API routes created, SMS provider configurable |
| 014 | Password-reset email not wired | ✅ Fixed | API routes created, email provider configurable |
| 015 | OCR (Tesseract) not actually used | ✅ Fixed | Fake OCR removed, real upload endpoint added |
| 016 | 2FA (speakeasy) declared but unused | ✅ Fixed | Enforced: login gate + purpose-carrying OTP tokens (Jul 31) |
| 017 | Payment gateways (Razorpay/Stripe) unused | ✅ Fixed | Real Razorpay checkout + verified webhook (Jul 31) |
| 018 | AI (OpenAI/Gemini) unused | ✅ Fixed | Placeholder text removed from UI |
| 019 | PWA (manifest/SW/offline) absent | ✅ Fixed | PWA manifest + service worker shipped |
| 020 | i18n / multi-language absent | 🔴 | English only, language UI simplified |
| 021 | Barcode/QR libs declared but unused | ✅ Fixed | Barcode print page shipped |
| 022 | Recharts/xlsx/pdf export libs unused | 🟠 | CSV exports wired for all entity types; PDF/XLSX still future |
| 023 | Unused integrations inflate package.json | ✅ Fixed | Cleaned up |

## Security & Money Hardening (Jul 31)

| # | Fix | Status |
|---|-----|--------|
| 201 | 2FA enforced server-side; login page handles 2FA_REQUIRED in password + OTP flows | ✅ |
| 202 | Rate limits: verify-otp (5/10min/phone), register (5/10min), checkout (10/10min/user), prescription upload (20/hr) | ✅ |
| 203 | Checkout: qty bounds, per-medicine GST, single-branch stock check, Razorpay order created before insert (15-min self-expire) | ✅ |
| 204 | Webhook: pre-checks all lines before any deduction; `payment.failed`/`order.failed` handled; no more partial deductions | ✅ |
| 205 | Orders POST removed (marked PAID without payment); PATCH/delivery validate against ORDER_STATUSES | ✅ |
| 206 | Sales POST: discount/paymentMode validation, FEFO picks merged for duplicate lines, mode normalized | ✅ |
| 207 | Returns: server-side pricing, branch match, over-return guard, batch restock, RMA numbers | ✅ |
| 208 | Purchases receive: branch must match PO; future-dated expiry only | ✅ |
| 209 | Inventory PUT zod-validated + auditLog adjustment ledger; lowStock filter uses medicine.reorderLevel | ✅ |
| 210 | Cron reorder skips medicines with open POs (no duplicate stacking) | ✅ |
| 211 | Uploads: magic-byte sniffing (jpg/png/webp/pdf) | ✅ |
| 212 | Reset-password whitelisted in middleware; nav links for 2FA/transfers/barcodes; invoice line totals; bulk-actions sales/low-stock exports; adjustments history persisted | ✅ |

## Remaining Work (new)

| # | Feature | Priority | Phase |
|---|---------|----------|-------|
| 101 | Custom field definitions & values | 🟠 | Phase 1 |
| 102 | Business type onboarding wizard | 🟠 | Phase 1 |
| 103 | Feature gating by business type | 🟠 | Phase 1 |
| 104 | Barcode scanning in POS | 🟡 | Phase 2 |
| 105 | Invoice PDF generation + print | 🟡 | Phase 2 |
| 106 | Split payments | 🟡 | Phase 2 |
| 107 | Tax inclusive/exclusive toggle | 🟡 | Phase 2 |
| 108 | Per-item discounts | 🟡 | Phase 2 |
| 109 | Credit limit management | 🟡 | Phase 2 |
| 110 | Stock transfer UI | 🟡 | Phase 3 |
| 111 | Purchase returns | 🟡 | Phase 3 |
| 112 | Barcode/label printing | 🟡 | Phase 3 |
| 113 | Rack management | 🟡 | Phase 3 |
| 114 | GST e-way bill | 🟡 | Phase 4 |
| 115 | GSTR export format | 🟡 | Phase 4 |
| 116 | Restricted drug reports | 🟡 | Phase 4 |
| 117 | Drug license expiry alerts | 🟡 | Phase 4 |
| 118 | Full accounting system (ledger, P&L, BS) | 🟡 | Phase 5 |
| 119 | Scheme engine wired to billing | ⚪ | Phase 6 |
| 120 | Salesman management | ⚪ | Phase 6 |
| 121 | WhatsApp real integration | ⚪ | Phase 6 |
