# 001 — README misrepresents feature completeness

**Priority:** 🔴 Critical
**Area:** Documentation
**Evidence:** `README.md:11-47`

## Description
The README marks every MVP, Phase 2, Phase 3, and Phase 4 feature as ✅ done.
In reality roughly half the app is hardcoded mockups or stubs. The README also
states the database is **PostgreSQL** while the project actually uses **SQLite**
(`prisma/schema.prisma:5-8`, `prisma/pharmacy.db`).

## Affected claims (false ✅)
- Online Store (e-commerce) — no backend, hardcoded pages
- Subscriptions — fake SaaS pricing page, not the medicine-subscription feature
- Telemedicine — hardcoded stats, no model/backend
- Analytics / AI — hardcoded metrics, literal "coming in Phase 4" text
- OCR for Prescriptions — fake string, Tesseract not imported
- PWA, Multi-Language, 2FA, AI features — not implemented
- GST invoicing / multi-payment — partial: only cash/credit reach real routes

## Real working features (accurate ✅)
Dashboard, Inventory (medicines/categories/suppliers/stock-alerts),
Prescriptions (doctors/patients only), POS, Sales (invoices/returns),
Purchases (orders/GRN/payments), password auth + register.

## Fix
Rewrite the feature list to mark real vs placeholder, correct the database
claim to SQLite, and add a "Current Status" section.
