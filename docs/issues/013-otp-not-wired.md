# 013 — OTP SMS delivery not wired (DB verify exists)

**Priority:** 🟡 Medium
**Area:** Auth
**Evidence:**
- `lib/auth-utils.ts:61` `sendOTP` stores token in DB but SMS send is `// TODO: Integrate with Twilio/Msg91`
- `app/(auth)/login/page.tsx:55-72` — `// TODO: Call API to send OTP`; fake `setTimeout`
- `app/(auth)/otp-verify/page.tsx:24,39` — `// ponytail: wire to SMS API` / `/api/auth/verify-otp`; fake `setTimeout`

## Description
OTP generation/verification logic against `VerificationToken` exists, but delivery
(SMS/email) and the verify UI are stubbed. The flow cannot actually complete.

## Fix
- Wire `sendOTP` to a real SMS provider (or remove OTP from the UI until available).
- Implement `/api/auth/verify-otp` and connect the verify page.
