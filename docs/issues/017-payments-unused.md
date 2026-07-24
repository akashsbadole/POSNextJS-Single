# 017 — Payment gateways (Razorpay/Stripe) unused

**Priority:** 🟡 Medium
**Area:** Integrations
**Evidence:**
- `razorpay` and `stripe` are in `package.json` but not imported anywhere
- POS supports cash/card/upi/credit modes; only cash/credit reach the real sale route

## Description
No payment gateway integration exists. The "Multi-Payment (UPI, Card, Cash, Credit)"
and online-store checkout have no real gateway calls.

## Fix
- If payment processing is in scope, integrate Razorpay/Stripe for card/UPI.
- Otherwise trim the deps and soften the README claim.
