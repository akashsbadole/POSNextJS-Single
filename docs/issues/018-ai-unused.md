# 018 — AI (OpenAI/Gemini) unused

**Priority:** ⚪ Low
**Area:** Integrations
**Evidence:**
- `openai` and `@google/generative-ai` are in `package.json` but not imported anywhere
- `app/(dashboard)/analytics/page.tsx:55` — "AI-powered forecast — coming in Phase 4"

## Description
No AI features are wired. The analytics page's forecast card is explicitly a future
placeholder.

## Fix
- If AI insights are in scope, wire `@google/generative-ai` to summarize trends from
  real report data. Otherwise drop the deps and README claim.
