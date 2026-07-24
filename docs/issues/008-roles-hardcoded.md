# 008 — Users/Roles hardcoded, no enforcement

**Priority:** 🟠 High
**Area:** Core
**Evidence:**
- `app/(dashboard)/users/roles/page.tsx:7-24` — hardcoded role list, no API/persistence
- `User.role` exists (`prisma/schema.prisma:58`) with values OWNER/MANAGER/PHARMACIST/CASHIER

## Description
The Roles page displays a static table and has no save/persist logic. Role-based
access control is not enforced in API routes or middleware beyond the auth session.

## Fix
- Make the roles page reflect real `User.role` assignments (edit user role via `/api/users`).
- Add RBAC guards in API routes / `middleware.ts` for privileged actions.
