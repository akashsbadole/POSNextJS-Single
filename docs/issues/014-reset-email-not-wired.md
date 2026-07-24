# 014 — Password-reset email not wired

**Priority:** 🟡 Medium
**Area:** Auth
**Evidence:**
- `lib/auth-utils.ts:81` `verifyOTP` / reset path — `// TODO: Send reset email via Resend`
- `app/(auth)/forgot-password/page.tsx` — no real email send

## Description
The forgot-password flow has no email delivery for the reset link/token.

## Fix
- Integrate `resend` (or SMTP) to send the reset email, or mark the flow as
  not-yet-available in the UI.
