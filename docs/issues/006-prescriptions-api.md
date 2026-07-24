# 006 — Prescriptions API + processing unimplemented

**Priority:** 🟠 High
**Area:** Core
**Evidence:**
- `app/(dashboard)/prescriptions/process/page.tsx:24-31` — fetches `/api/prescriptions` which does not exist → empty fallback
- No `app/api/prescriptions` directory
- Schema `Prescription` / `PrescriptionItem` exist (`prisma/schema.prisma:331-377`)

## Description
While the doctors and patients pages work, there is no API to list/create/update
prescriptions, and the prescription processing page silently falls back to an empty
array. Prescription records cannot be created or dispensed through the UI.

## Fix
- Add `app/api/prescriptions/route.ts` (list/create; update status, dispense items).
- Wire `prescriptions/process/page.tsx` to the real endpoint.
- Support linking to a `Sale` on dispense.
