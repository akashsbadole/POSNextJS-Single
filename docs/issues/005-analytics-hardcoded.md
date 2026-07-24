# 005 — Analytics page hardcoded, AI forecast missing — ✅ RESOLVED

**Resolved:** 2026-07-19
**Fix:** `app/(dashboard)/analytics/page.tsx` now fetches `/api/dashboard` + `/api/reports`
and renders real KPIs (revenue, orders, AOV, low stock, patients, medicines), a real
monthly revenue trend, and real top-products from `Sale`/`SaleItem`. The AI forecast
card stays as a clearly-labeled "planned" placeholder (OpenAI/Gemini not wired).


**Priority:** 🟠 High
**Area:** Phase 4
**Evidence:**
- `app/(dashboard)/analytics/page.tsx:12-19` — hardcoded `metrics` array
- `app/(dashboard)/analytics/page.tsx:55` — "AI-powered forecast — coming in Phase 4"
- `app/(dashboard)/analytics/page.tsx:88` — "integrates with sales data" (not wired)
- No `app/api/analytics` route exists

## Description
Analytics metrics are static. The AI forecasting the README advertises is absent
(`openai` / `@google/generative-ai` are not imported anywhere). The page admits this
in its own copy.

## Fix
- Add `app/api/analytics/route.ts` returning real KPIs from `Sale`/`SaleItem`/`Medicine`.
- Render real metrics + a basic Recharts trend (e.g. revenue over time).
- If AI forecasting is in scope, wire `@google/generative-ai` to summarize trends;
  otherwise label it clearly as future work instead of fake data.
