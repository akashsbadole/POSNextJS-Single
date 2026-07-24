# 011 — Sales / Financial / Custom reports use fake data — ✅ RESOLVED

**Resolved:** 2026-07-19
**Fix:** Added `app/api/reports/route.ts` aggregating real KPIs, monthly trend, top
medicines, and GST totals from `Sale`/`SaleItem`. Wired:
- `reports/sales/page.tsx` — real KPIs, trend, top medicines, GST summary
- `reports/financial/page.tsx` — real GST table (was hardcoded ₹0.00)
- `reports/custom/page.tsx` — functional date-range query against `/api/reports`
Inventory report (`reports/inventory`) was already real.


**Priority:** 🟠 High
**Area:** Reports
**Evidence:**
- `app/(dashboard)/reports/sales/page.tsx:21-36` — hardcoded `salesData` / `topMedicines`
- `app/(dashboard)/reports/financial/page.tsx:86-88` — GST table rows hardcoded `₹0.00`
- `app/(dashboard)/reports/custom/page.tsx:20-23` — "Generate" is a `setTimeout` → toast "implement query builder"
- `app/(dashboard)/reports/inventory/page.tsx:16` — partially real (fetches `/api/medicines`)

## Description
Reports present fabricated KPIs. The financial report leaves GST computation as
zeroed placeholders. The custom report builder does nothing.

## Fix
- Compute Sales/Financial metrics from real `Sale`/`SaleItem` data via `/api/dashboard`
  or a new `/api/reports` route (real CGST/SGST/IGST totals).
- Implement custom report with a real query builder hitting the reports API.
- Inventory report already uses live data; keep and harden it.
