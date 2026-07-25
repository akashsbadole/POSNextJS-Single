# 🏥 PharmacyPro - Pharmacy Management System

A Pharmacy Management System built with **Next.js 15** (App Router), TypeScript, Prisma,
and Tailwind/shadcn-ui.

> ⚠️ **Status note (2026-07-26):** The core MVP is functional and connected to PostgreSQL.
> Several advanced features remain placeholders — see [Current Status](#-current-status) below.

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Owner | admin@pharmacypro.com | admin123 |
| Manager | manager@pharmacypro.com | admin123 |
| Pharmacist | pharmacist@pharmacypro.com | admin123 |
| Cashier | cashier@pharmacypro.com | admin123 |

## ✨ Features

### ✅ Fully Working

- ✅ **Inventory Management** — Medicine CRUD, categories, suppliers, stock tracking, batch expiry alerts, FEFO picking
- ✅ **Sales & POS** — Cart, GST calculation (CGST/SGST), invoicing, returns, barcode lookup, payment modes (cash/card/UPI/credit)
- ✅ **Purchase Management** — Purchase orders, GRN, supplier payments, auto inventory update on receive
- ✅ **Prescriptions** — Doctors/patients CRUD, prescription processing (FULFILLED/CANCELLED), OCR upload UI present
- ✅ **User & Auth** — NextAuth (credentials + Google), OTP login, role-based access, audit logs, SUSPENDED/INACTIVE blocking
- ✅ **Reports & Dashboard** — Real KPIs, monthly sales trends, top medicines, GST breakdown, low-stock alerts
- ✅ **Custom Fields** — Dynamic fields for any entity type with validation
- ✅ **Schemes & Drug Licenses** — Full CRUD with filtering
- ✅ **Onboarding** — First-run setup wizard
- ✅ **Online Store APIs** — Product/order/delivery APIs real; catalog page with search/filter, localStorage cart

### ⚠️ Partial / Schema Only

- ⚠️ **Subscriptions** — CRUD APIs + UI real; no recurring delivery engine
- ⚠️ **Online Store Checkout** — Cart is localStorage-only; no checkout API creating real transactions
- ⚠️ **E-Invoicing** — GSTN JSON payload built; portal upload pending
- ⚠️ **Multi-Location Inventory** — `StockTransfer` schema exists; no transfer API or UI
- ⚠️ **Analytics** — Dashboard + report data real; "Sales Forecast" card is placeholder
- ⚠️ **Prescription OCR** — Upload UI accepts files; Tesseract declared but not wired (saves blob URL)

### ❌ Not Implemented

- ❌ **PWA** — No manifest/service worker
- ❌ **WhatsApp/SMS Integrations** — Webhook logs to DB only; no actual sending
- ❌ **Barcode/QR Generation** — Fields exist on Medicine; POS barcode input looks up by value only
- ❌ **Auto-Reordering** — `reorderLevel`/`reorderQuantity` fields exist; no background job
- ❌ **2FA Enrollment** — Column exists; no enrollment/verify flow
- ❌ **Multi-Language (i18n)** — Not present
- ❌ **Telemedicine** — Hardcoded "Coming Soon" page; no backend
- ❌ **AI Features** — Declared, unused

## 📊 Current Status

| Area | Status |
|------|--------|
| Inventory, Sales/POS, Purchases, Prescriptions | ✅ Working |
| Auth, Users, Roles, Settings, Audit logs, Onboarding | ✅ Working |
| Reports, Dashboard, Custom Fields, Schemes, Drug Licenses | ✅ Working |
| Subscriptions, Online Store, Analytics, E-Invoicing | ⚠️ Partial |
| Multi-Location Inventory, Prescription OCR | ⚠️ Schema only |
| PWA, WhatsApp/SMS, Barcode/QR, Auto-Reorder, 2FA, i18n, Telemedicine, AI | ❌ Not implemented |

## 📸 Screenshots

| Login | Dashboard | Onboarding |
|-------|-----------|------------|
| ![Login](public/PharmacyPro-login.png) | ![Dashboard](public/PharmacyPro-dashboard.png) | ![Onboarding](public/PharmacyPro-onboarding.png) |

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js (JWT + OAuth)
- **State**: Zustand + TanStack Query

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 14+ running on `localhost:5432`

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd pharmacy-management-system

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Ensure DATABASE_URL points to your PostgreSQL instance

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database
npx prisma db seed

# Start development server
npm run dev
```

### Docker Setup

```bash
# Start all services
docker-compose up -d

# Run migrations
docker-compose exec app npx prisma migrate dev

# Seed database
docker-compose exec app npx prisma db seed
```

## 📁 Project Structure

```
pharmacy-management-system/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard
│   ├── inventory/         # Inventory management
│   ├── prescriptions/     # Prescription management
│   ├── pos/               # Point of Sale
│   ├── sales/             # Sales & billing
│   ├── purchases/         # Purchase orders
│   ├── reports/           # Analytics & reports
│   ├── online-store/      # E-commerce
│   ├── subscriptions/     # Subscription management
│   ├── analytics/          # AI-powered analytics
│   ├── telemedicine/      # Telemedicine integration
│   ├── users/             # User management
│   ├── admin/             # Admin settings
│   └── api/               # API routes
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utilities & configurations
│   ├── db.ts             # Prisma client
│   ├── auth.ts           # NextAuth config
│   └── utils.ts          # Helper functions
├── prisma/               # Database schema
├── types/                # TypeScript types
├── public/               # Static assets
└── docker/               # Docker configurations
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Support

For support, email support@pharmacypro.com or join our Slack channel.
