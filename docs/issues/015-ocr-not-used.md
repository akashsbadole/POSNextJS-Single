# 015 — OCR (Tesseract) not actually used

**Priority:** 🟡 Medium
**Area:** Core
**Evidence:**
- `app/(dashboard)/prescriptions/upload/page.tsx:42-72` — "OCR" is a fake `setTimeout`
  returning a hardcoded string
- `tesseract.js` is in `package.json` but not imported anywhere

## Description
The prescription upload page claims OCR but only returns a static placeholder text.
There is no call to `tesseract.js` and no field mapping from OCR output to
`PrescriptionItem`.

## Fix
- Import `tesseract.js`, run recognition on the uploaded image, and prefill the
  medicine/dosage fields. Or remove the OCR claim from the UI.
