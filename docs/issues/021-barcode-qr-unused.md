# 021 — Barcode/QR libs declared but unused

**Priority:** ⚪ Low
**Area:** Integrations
**Evidence:**
- `react-barcode`, `qrcode`, `qrcode.react` are in `package.json` but not imported anywhere
- README claims "Barcode/QR System — Generate and scan barcodes"

## Description
No barcode/QR generation or scanning UI exists despite the dependencies and README claim.

## Fix
- If in scope, add barcode/QR generation to the medicine detail / inventory pages.
- Otherwise trim the deps and README claim.
