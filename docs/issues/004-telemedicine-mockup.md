# 004 — Telemedicine is hardcoded mockup

**Priority:** 🟠 High
**Area:** Phase 4
**Evidence:**
- `app/(dashboard)/telemedicine/page.tsx:12-16` — `const appointments = [...]`
- `app/(dashboard)/telemedicine/page.tsx:27-30` — hardcoded stats ("8", "12", "1,247", "4.8")

## Description
The Telemedicine page displays fabricated appointment and statistic data. There is
no `Telemedicine` model in the schema and no backend. The README claims
"Telemedicine Integration — Practo/e-Sanjeevani" is done; it is not.

## Fix
- Either implement a real consultation module (model + API + UI) or, per scope
  decision, mark it as not-implemented in the README and leave the page as a clear
  "planned" placeholder rather than fake data.
