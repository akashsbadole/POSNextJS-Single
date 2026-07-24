# 012 — Inventory Bulk Actions is a stub

**Priority:** 🟡 Medium
**Area:** Core
**Evidence:**
- `app/(dashboard)/inventory/bulk-actions/page.tsx:18-23` — `setTimeout` + comment
  `// ponytail: CSV import... implement file parsing`
- No import/export endpoint exists

## Description
The bulk actions screen has no real CSV import/export or batch edit. It only shows
a placeholder spinner.

## Fix
- Add CSV import/export against `/api/medicines` (use `papaparse` if kept, or native).
- Implement bulk price/stock updates.
