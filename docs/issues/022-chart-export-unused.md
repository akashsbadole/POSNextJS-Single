# 022 — Recharts / xlsx / pdf export libs unused

**Priority:** ⚪ Low
**Area:** Integrations
**Evidence:**
- `recharts`, `xlsx`, `papaparse`, `jspdf`, `html2canvas`, `pdf-lib` are in `package.json`
  but not imported anywhere in source

## Description
Reporting/charting/export libraries are declared but never used. Charts are not
rendered and there is no CSV/PDF export wired to real data.

## Fix
- Use `recharts` for real report charts and `xlsx`/`jspdf` for exports where in scope.
- Otherwise trim unused deps to reduce install size and attack surface.
