# 023 — Unused integrations inflate package.json

**Priority:** 🟡 Medium
**Area:** Maintenance
**Evidence:**
- Grep across `.ts/.tsx` for `speakeasy|tesseract|generative-ai|openai|razorpay|
  stripe|twilio|resend|bullmq|recharts|papaparse|qrcode|jspdf|pdf-lib|html2canvas|
  xlsx|i18n|manifest` returns only placeholder/TODO references — no real imports.

## Description
`package.json` carries a large set of declared-but-unused dependencies (see issues
016–022). This increases install time, bundle size, and the dependency/security
surface, while the README implies these features work.

## Fix
- Decide per integration: implement it, or remove it from `package.json` (and
  `package-lock.json`) and correct the README.
- Per scope decision, trim the unused heavy integrations (payments, AI, PWA, i18n,
  barcode/QR, chart/export) unless they are actively built in a later phase.
