# 019 — PWA (manifest/SW/offline) absent

**Priority:** ⚪ Low
**Area:** Integrations
**Evidence:**
- No `manifest.json`, no service worker, no `next-pwa` config
- README claims "PWA — Offline mode, mobile POS, push notifications"

## Description
There is no progressive-web-app setup. The app is a standard Next.js web app with no
offline capability or installability.

## Fix**
- If PWA is in scope, add a manifest, service worker, and offline cache strategy.
- Otherwise remove the PWA claim from the README.
