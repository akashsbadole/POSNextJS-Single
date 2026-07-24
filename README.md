# 🏥 PharmacyPro - Pharmacy Management System

A Pharmacy Management System built with **Next.js 15** (App Router), TypeScript, Prisma,
and Tailwind/shadcn-ui.

> ⚠️ **Status note (2026-07-19):** The core MVP is functional. Several features advertised
> in earlier docs were placeholders and are **not yet implemented** — see
> [Current Status](#-current-status) below. Detailed issue tracking lives in
> [`docs/issues/`](docs/issues/README.md).

## credential

Login: admin@pharmacypro.com / admin123

Additional seeded users (password `admin123`): `manager@pharmacypro.com`,
`pharmacist@pharmacypro.com`, `cashier@pharmacypro.com`.

## ✨ Features

### MVP (Phase 1) — ✅ Implemented

- ✅ **Inventory Management** - Medicine CRUD, categories, suppliers, stock tracking
- ⚠️ **Prescription Management** - Doctors/patients real; upload UI is a stub (no OCR yet); processing wired to API
- ✅ **Sales & Billing** - POS with GST calculation, invoicing, returns
- ✅ **Purchase Management** - Purchase orders, GRN, supplier payments
- ✅ **User & Role Management** - Users list real; role assignment now works (RBAC not yet enforced in API)
- ✅ **Reporting (partial)** - Dashboard real; detailed Sales/Financial/Custom reports are stubbed
- ✅ **Security** - JWT auth, audit logs (now readable), input validation

### Phase 2 (Core Enhancements) — ⚠️ Partial

- ✅ **Batch & Expiry Tracking** - Schema + stock-alert page exist
- ❌ **Barcode/QR System** - Declared, not wired
- ⚠️ **Multi-Location Inventory** - Schema (StockTransfer) exists; no transfer UI
- ❌ **Auto-Reordering** - Not implemented
- ❌ **OCR for Prescriptions** - Not wired (Tesseract declared only)
- ✅ **GST-Compliant Invoicing** - Auto-calculate GST (5%, 12%, 18%)
- ⚠️ **Multi-Payment** - Cash/credit work; UPI/card have no gateway
- ✅ **Loyalty Program** - Schema + tiers seeded

### Phase 3 (Competitive Features) — ❌ Not implemented (placeholder UI)

- ❌ **Online Pharmacy** - Pages are hardcoded; no backend
- ❌ **Delivery Management** - Hardcoded
- ❌ **PWA** - No manifest/service worker
- ❌ **Advanced Reports** - Custom report builder is a stub
- ❌ **Integrations** - SMS/WhatsApp/GST/Drug APIs not wired
- ❌ **Security 2FA** - Column exists; no enrollment/verify flow

### Phase 4 (Advanced) — ❌ Not implemented (placeholder UI)

- ❌ **Telemedicine Integration** - Hardcoded mockup, no model/backend
- ❌ **AI-Powered Features** - Declared, unused
- ⚠️ **Subscription Model** - Schema + seed exist; UI is fake SaaS pricing
- ❌ **Multi-Language** - No i18n layer
- ❌ **Delivery Agent App** - Not present

## 📊 Current Status

| Area | Status |
|------|--------|
| Dashboard, Inventory, POS/Sales, Purchases | ✅ Working |
| Password auth, User management, Roles, Settings, Audit logs | ✅ Working (see docs/issues) |
| Prescriptions (doctors/patients/processing) | ✅ Working |
| Reports (detailed), Online Store, Subscriptions, Telemedicine, Analytics | ❌ Placeholder / TODO |
| OCR, 2FA, Payments, AI, PWA, i18n, Barcode/QR | ❌ Declared but unwired |

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: SQLite + Prisma ORM (README previously said PostgreSQL — actual deployment uses SQLite via `prisma/pharmacy.db`)
- **Auth**: NextAuth.js (JWT + OAuth; OTP send/verify is stubbed)
- **State**: Zustand + TanStack Query
- **Charts**: Recharts (declared, not yet used in reports)
- **OCR**: Tesseract.js (declared, not wired)
- **Payments**: Razorpay + Stripe (declared, not wired)
- **Cache**: Redis (declared, not wired)
- **AI**: OpenAI API + Google Gemini (declared, not wired)

## 🚀 Quick Start

### Prerequisites

- Node.js 20+

> Note: The project runs on SQLite out of the box — no PostgreSQL/Redis required for local dev.

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd pharmacy-management-system

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your credentials

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

## 🔐 Default Credentials

- **Email**: admin@pharmacypro.com
- **Password**: admin123

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Support

For support, email support@pharmacypro.com or join our Slack channel.
