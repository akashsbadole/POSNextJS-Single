# 007 — Audit Logs page points at missing API

**Priority:** 🟠 High
**Area:** Core
**Evidence:**
- `app/(dashboard)/admin/audit-logs/page.tsx:25` — fetches `/api/users/audit-logs` (or `/api/audit-logs`)
- No such route exists → empty fallback
- Audit writes DO happen: `lib/auth.ts` (login), `app/api/sales/route.ts:119` (sale)

## Description
The audit-log read endpoint is missing, so the audit-log UI always shows nothing
even though `AuditLog` rows are written to the DB on login and sale events.

## Fix
- Add `app/api/audit-logs/route.ts` returning `AuditLog` rows (filtered by entity/user/date).
- Point the page at the correct endpoint.
