# 016 — 2FA (speakeasy) declared but unused

**Priority:** 🟡 Medium
**Area:** Auth
**Evidence:**
- `User.twoFactorEnabled` / `User.twoFactorSecret` columns exist (`prisma/schema.prisma:61-62`)
- `speakeasy` is in `package.json` but not imported anywhere
- No enrollment or verify flow in the UI

## Description
The schema supports 2FA but there is no enrollment, QR setup, or verification step.
The README's "Security 2FA — Two-factor authentication" claim is unmet.

## Fix
- Add 2FA enrollment (generate secret, show QR) and verification step using `speakeasy`.
- Gate sensitive actions when `twoFactorEnabled` is true.
- If out of scope, drop `speakeasy` from deps and the README claim.
