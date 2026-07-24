# 020 — i18n / multi-language absent

**Priority:** ⚪ Low
**Area:** Integrations
**Evidence:**
- No `i18n` config, no `next-intl` or similar
- `app/(dashboard)/admin/settings/page.tsx:116-121` — Hindi/Tamil/Telugu/Bengali marked "Coming Soon"

## Description
The README claims multi-language support (Hindi, Marathi, Gujarati, Tamil, Telugu,
Bengali). There is no internationalization layer; the settings UI hardcodes
"Coming Soon" for additional languages.

## Fix
- If i18n is in scope, add `next-intl` (or equivalent) with message catalogs.
- Otherwise remove the multi-language claim from the README.
