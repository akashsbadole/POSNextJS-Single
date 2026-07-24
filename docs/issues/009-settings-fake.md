# 009 — Admin Settings save is a fake timeout

**Priority:** 🟠 High → ✅ Fixed
**Area:** Core

## Status: FIXED

The described issue (fake `setTimeout` toast with no persistence) has been resolved:

- `app/(dashboard)/admin/settings/page.tsx` — now GETs settings from `/api/settings` on mount and PUTs each key on save. No `setTimeout` or fake path exists.
- `app/api/settings/route.ts` — fully implemented: `GET` returns all settings, `PUT` upserts by key.
- `prisma/schema.prisma` — `Setting` model with `key` (unique), `value`, `category`, `description`.

## Original issue (now resolved)
Clicking Save showed a success toast but persisted nothing. Localization tab showed languages as "Coming Soon".
