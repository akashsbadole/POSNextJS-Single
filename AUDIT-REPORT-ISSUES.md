# 🏥 PharmacyPro - Comprehensive Audit Report

**Date:** July 26, 2026
**Status:** Initial Audit
**Purpose:** Comprehensive overview of existing features, reported/unreported bugs, performance bottlenecks, and UX gaps to guide future development.

---

## 📋 1. Existing Product Features (Implemented)

### Core Modules
*   **Inventory Management:** Full CRUD for Medicines, Categories, Suppliers. Real-time stock tracking, batch expiry alerts, and FEFO picking support.
*   **Sales & POS:** Working cart system, complex GST calculation (CGST/SGST), invoicing, returns, barcode lookup, and multiple payment modes (Cash/Card/UPI).
*   **Purchase Management:** Complete flow from Purchase Orders to Goods Receipt Notes (GRN) and Supplier Payments. Inventory auto-updates upon receiving.
*   **Prescriptions Management:** Doctors and Patients CRUD, prescription processing workflow (Pending -> Fulfilled/Cancelled).
*   **User & Authentication:** Robust NextAuth integration (Credentials + Google OAuth), OTP login schema, role-based access control, and Audit Logs.
*   **Reports & Dashboard:** KPIs, monthly sales trends, top performing medicines, GST breakdowns, and real-time low-stock alerts.

---

## 🚨 2. Prioritized Issues & Bugs (By Severity)

### 🔴 Critical Priority (Core functionality broken or blocked)

| Issue | Category | Description | Recommended Next Step |
| :--- | :--- | :--- | :--- |
| **Fake Online Checkout** | Bug / Architecture | The Online Store cart uses `localStorage` only. There is no actual checkout API that creates `OnlineOrder` records in the database. | Implement the checkout API endpoint to persist cart items to `OnlineOrder` and `OnlineOrderItem` tables. |
| **Broken Subscriptions** | Bug / Logic | Subscription CRUD exists, but there is no recurring delivery engine or cron job to process active subscriptions. | Implement a background job (e.g., using node-cron or Vercel Cron) to poll active subscriptions and generate delivery records. |
| **Password Reset Missing** | Bug / Auth | A `TODO` in `auth-utils.ts` indicates the email sending logic via Resend/SMTP is missing for password resets. | Integrate Resend or Nodemailer in the password reset API to actually dispatch the reset tokens. |

### 🟠 Major Priority (Significant UX impact or partial feature)

| Issue | Category | Description | Recommended Next Step |
| :--- | :--- | :--- | :--- |
| **Prescription OCR Unwired** | Missing Feature | The upload UI accepts files and Tesseract is declared, but it only saves a blob URL without running the OCR extraction. | Wire Tesseract.js in the upload handler or backend API to extract text and save it to the `ocrText` field. |
| **Multi-Location Transfers** | Missing Feature | The `StockTransfer` schema exists for moving inventory between branches, but there is no API or UI. | Build a `StockTransfer` UI in the dashboard and a transactional API to move stock between branches safely. |
| **E-Invoicing Incomplete** | Integration Gap | The GSTN JSON payload is built, but the actual portal upload and response handling are pending. | Integrate with a GST Suvidha Provider (GSP) API to push the JSON and retrieve the IRN. |
| **Missing 2FA Flow** | Security / UX | The `twoFactorEnabled` column exists on the `User` model, but there is no enrollment or verification flow in the UI. | Build a 2FA setup page using an authenticator app (TOTP) and add a verification step to the login flow. |

### 🟡 Medium Priority (Performance Bottlenecks)

| Issue | Category | Description | Recommended Next Step |
| :--- | :--- | :--- | :--- |
| **Unoptimized Images** | Performance | Native `<img>` tags are used with `eslint-disable @next/next/no-img-element` across the dashboard (e.g., prescription uploads, barcodes). | Replace native `<img>` tags with Next.js `<Image>` components to ensure WebP conversion and proper sizing. |
| **Missing DB Indexes** | Performance | The Prisma schema lacks composite indexes for frequent queries (e.g., `OnlineOrder` lacks an index on `[customerId, status]`). | Analyze slow queries and add composite `@@index` directives to Prisma models to speed up dashboard filtering. |

### 🟢 Low Priority (Minor Gaps & Enhancements)

| Issue | Category | Description | Recommended Next Step |
| :--- | :--- | :--- | :--- |
| **Sales Forecast Placeholder** | UX Gap | The Analytics dashboard uses a static placeholder for the "Sales Forecast" card. | Connect the card to a basic linear regression endpoint or hide it until the AI module is ready. |
| **Telemedicine Hardcoded** | UX Gap | The Telemedicine route shows a hardcoded "Coming Soon" page which clutters navigation. | Hide the navigation link for Telemedicine using a feature flag until development starts. |
| **No PWA Support** | Enhancement | The app lacks a manifest and service worker, degrading mobile experience. | Add `next-pwa` or manually configure a manifest.json and caching service worker. |
| **Local Cart Data Loss** | UX Gap | Because the online store cart is purely `localStorage`, users lose their cart if they switch devices. | Sync the local cart with a database cart when the user logs in. |

---

## 🛠️ Implementation Strategy

As requested, this document serves as the roadmap for your implementation phase. I recommend tackling the **Critical Priority** items first, as they directly impact the ability to process online orders and reset passwords. 

1.  **Phase 1 (Critical):** Fix Online Checkout, Subscriptions Engine, and Auth Emails.
2.  **Phase 2 (Major):** Wire up the OCR functionality and complete the 2FA flow.
3.  **Phase 3 (Medium/Performance):** Refactor `<img>` tags to Next.js `<Image>` and optimize the Prisma schema.
4.  **Phase 4 (Low):** Address minor UX gaps like hiding placeholders and setting up PWA.
