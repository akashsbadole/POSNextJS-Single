# 🏥 PharmacyPro - Complete Pharmacy Management System

A comprehensive, production-ready Pharmacy Management System built with **Next.js 15**, featuring all MVP, Phase 2, Phase 3, and Phase 4 features.

## ✨ Features

### MVP (Phase 1)
- ✅ **Inventory Management** - Medicine CRUD, categories, suppliers, stock tracking
- ✅ **Prescription Management** - Upload, manual entry, patient/doctor management
- ✅ **Sales & Billing** - POS with GST calculation, multi-payment modes, invoicing
- ✅ **Purchase Management** - Purchase orders, GRN, supplier payments
- ✅ **User & Role Management** - RBAC (Owner, Manager, Pharmacist, Cashier)
- ✅ **Reporting** - Sales, inventory, financial reports
- ✅ **Security** - JWT auth, audit logs, input validation

### Phase 2 (Core Enhancements)
- ✅ **Batch & Expiry Tracking** - Auto-alerts for near-expiry medicines
- ✅ **Barcode/QR System** - Generate and scan barcodes
- ✅ **Multi-Location Inventory** - Inter-branch stock transfers
- ✅ **Auto-Reordering** - AI-based reorder suggestions
- ✅ **OCR for Prescriptions** - Tesseract.js integration
- ✅ **GST-Compliant Invoicing** - Auto-calculate GST (5%, 12%, 18%)
- ✅ **Multi-Payment** - UPI, Card, Cash, Credit
- ✅ **Loyalty Program** - Points system with tiered rewards

### Phase 3 (Competitive Features)
- ✅ **Online Pharmacy** - E-commerce with product catalog, cart, checkout
- ✅ **Delivery Management** - Pincode check, delivery slots, live tracking
- ✅ **PWA** - Offline mode, mobile POS, push notifications
- ✅ **Advanced Reports** - Custom reports, dashboard widgets, AI insights
- ✅ **Integrations** - SMS/WhatsApp, GST API, Drug Database APIs
- ✅ **Security 2FA** - Two-factor authentication

### Phase 4 (Advanced)
- ✅ **Telemedicine Integration** - Practo/e-Sanjeevani
- ✅ **AI-Powered Features** - Demand forecasting, price optimization, fraud detection
- ✅ **Subscription Model** - Monthly medicine subscriptions
- ✅ **Multi-Language** - Hindi, Marathi, Gujarati, Tamil, Telugu, Bengali
- ✅ **Delivery Agent App** - Route optimization

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js (JWT + OAuth + OTP)
- **State**: Zustand + TanStack Query
- **Charts**: Recharts
- **OCR**: Tesseract.js
- **Payments**: Razorpay + Stripe
- **Cache**: Redis
- **AI**: OpenAI API + Google Gemini

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Redis 7+

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
