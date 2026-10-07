# Khas Travels — Travel & Tour Management System (ERP)

[![Next.js](https://img.shields.io/badge/Next.js-15.1.7-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?style=flat-square&logo=react)](https://react.dev/)
[![Django](https://img.shields.io/badge/Django-5.1-092E20?style=flat-square&logo=django)](https://www.djangoproject.com/)
[![Django REST Framework](https://img.shields.io/badge/DRF-3.15.2-red?style=flat-square)](https://www.django-rest-framework.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

A modern, cloud-native Enterprise Resource Planning (ERP) platform purpose-built for **Khas Travels**. Designed as a complete web-based replacement for legacy desktop software, this platform unifies pilgrim and traveler lifecycle management, Umrah/Hajj group packages, airline ticket inventory and refund management, hotel reservation ledgers, and office accounting into a secure, auditable, and high-performance system.

> **Software Attribution:**  
> Developed & Maintained by **Innosoft Technologies**  
> Contact: **+92 334 3020868**  
> Head Office: Office No 5, Hyderabad Road, Mirpurkhas, Sindh, Pakistan

---

## Table of Contents
1. [System Architecture & Tech Stack](#1-system-architecture--tech-stack)
2. [Core Domain Modules & Business Logic](#2-core-domain-modules--business-logic)
3. [Centralized Branding & PDF Document Engine](#3-centralized-branding--pdf-document-engine)
4. [Monorepo Directory Layout](#4-monorepo-directory-layout)
5. [Getting Started & Local Setup](#5-getting-started--local-setup)
6. [Environment Variables Reference](#6-environment-variables-reference)
7. [Testing, Health Checks & Seeding](#7-testing-health-checks--seeding)
8. [Production Deployment & Verification Audit](#8-production-deployment--verification-audit)

---

## 1. System Architecture & Tech Stack

The platform is architected as a decoupled, multi-tier system with a typed Next.js App Router frontend communicating over REST with a robust Django 5 backend backed by a high-availability PostgreSQL cluster.

```text
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                      Next.js 15 App Router Frontend                         │
 │        React 19 • TypeScript • Tailwind CSS • Shadcn UI • TanStack Query   │
 └───────────────────────┬─────────────────────────────┬───────────────────────┘
                         │                             │
    Authentication POST  │                             │ Bearer JWT (Authorization Header)
    /api/v1/auth/login/  │                             │ Auto-attached via Axios Interceptor
                         ▼                             ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                       Django 5.1 REST Framework                             │
 │      Native JWT Authentication • Role-Based Access Control (RBAC)          │
 │      Standardized Pagination Envelope • Normalized Global Exceptions        │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
                                        │ Direct Engine Connection (psycopg 3)
                                        │ SSL Mode Required / Connection Health Checks
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         PostgreSQL 16 Database                              │
 │      ACID Transactions • Relational Foreign Keys • Audit Timestamps        │
 └─────────────────────────────────────────────────────────────────────────────┘
```

### Backend Specifications
* **Framework:** Python 3.12+ / Django 5.1 with Django REST Framework (DRF 3.15).
* **Database Engine:** PostgreSQL 16 accessed via `psycopg 3` (binary) and `dj-database-url` with connection pooling and health checks enabled.
* **Authentication:** Completely native Django authentication. Passwords hashed using PBKDF2 with SHA-256; sessions authenticated via standard RFC 7519 JSON Web Tokens (HS256) signed with `JWT_SECRET` / `SECRET_KEY`.
* **Security & Hardening:** Django deployment security checks, CORS origin validation (`django-cors-headers`), HTTP Strict Transport Security (HSTS), secure cookies, and WhiteNoise static asset serving.
* **Architecture:** Domain-driven modular applications with shared base abstractions (`UUIDModel`, `TimeStampedModel`, `BaseModel`).

### Frontend Specifications
* **Framework:** Next.js 15.1 (App Router) with React 19 and TypeScript 5.7.
* **Styling & Design System:** Tailwind CSS with custom Emerald/Teal brand tokens, Slate/Zinc neutral surfaces, dark mode support, and smooth micro-animations.
* **UI Components:** Shadcn UI patterns built on Radix primitives, Lucide React icons, and accessible modal dialogs.
* **Data Fetching & State:** TanStack React Query v5 for server-state caching, background revalidation, and optimistic updates; React Hook Form with Zod runtime schema validation.
* **HTTP Client:** Centralized Axios instance with automatic `Authorization: Bearer <token>` injection, 401 token expiration handlers, and standardized error parsing.

---

## 2. Core Domain Modules & Business Logic

### A. Traveler Management (`apps/travelers`)
* **Client Identification:** Full legal name indexing with strict Pakistani CNIC / juvenile B-Form validation using the standard 13-digit pattern (`XXXXX-XXXXXXX-X`).
* **Age Tiers:** Automatic categorization into `ADULT` (12+), `CHILD` (2-11), and `INFANT` (under 2 years) which automatically dictates package base pricing and visa quotas.
* **Family & Dependent Linkage:** Self-referential `guardian` foreign key allowing multi-passenger family units to be linked under a primary guardian without data duplication.
* **Active Status Integrity:** Model properties (`has_active_package`, `current_active_enrollment`) track active commitments in real-time.

### B. Travel Packages & Enrollment Engine (`apps/packages`)
* **Package Specifications:** Independent CRUD catalog managing pilgrimage itineraries (`MAKKAH`, `MADINAH`, `MAKKAH_MADINAH`), star ratings (`3_STAR`, `4_STAR`, `5_STAR`), flight schedules, shuttle transport flags, and age-tiered pricing matrices.
* **Single Active Package Rule:** Enforced at both the Django model clean layer and database level via `UniqueConstraint(fields=['traveler'], condition=Q(status='ACTIVE'))`, guaranteeing a passenger can never be double-booked into concurrent departures.
* **Contracted Pricing Invariant:**
  $$\text{Final Agreed Price} = (\text{Base Price} + \text{Extra Services}) - \text{Authorized Discount}$$
  Automatically recomputed and verified upon every model save.

### C. Traveler Accounting & Installment Ledgers (`apps/packages`)
* **Decoupled Financial Records:** Installment receipts (`TravelerPayment`) are logged independently against package enrollments with unique vouchers (`RCT-YYYY-XXXX`).
* **Live Balance Engine:**
  * **Total Paid:** Dynamic SQL aggregation of all confirmed monetary receipts.
  * **Remaining Balance:** $\text{Final Agreed Price} - \text{Total Paid}$.
  * **Clearance Status:** Dynamically computed as `PAID` (balance $\le 0$), `PARTIAL` ($\text{Paid} > 0$), or `UNPAID`.

### D. Airline Ticketing & Refund Processing (`apps/ticketing`)
* **Consolidator Inventory:** Wholesale ticket purchase logging with operating airlines (e.g., PIA, Saudia, Emirates), distributor agency names, alphanumeric PNR codes, seat counts, and issue dates.
* **Refund Engine:** Supports partial or full passenger seat cancellations with strict constraint checks:
  $$\text{Net Refund} = \text{Gross Fare Snapshot} - \text{Airline Penalty Fee}$$
* **Seat Inventory Safeguards:** Prevents processing refunds exceeding available active seats; automatically transitions parent ticket status between `ISSUED`, `PARTIALLY_REFUNDED`, and `REFUNDED`.

### E. Hotel Booking & Settlement Management (`apps/hotels`)
* **Property Reservations:** Hotel bookings in Makkah and Madinah with check-in/out scheduling, room configurations, and supplier total contract prices.
* **Add Remaining Workflow:** Incremental payment logging (`HotelPayment`) against hotel reservations, updating supplier clearance status (`UNPAID`, `PARTIAL`, `PAID`) with unique receipt references.

### F. Office Finance & Operational Expenses (`apps/finance`)
* **Bank Account Reconciliation:** Multi-bank ledger (`BankAccount`) with real-time balance tracking, account numbers/IBANs, and transaction histories.
* **Office Payments:** Credit (deposit), debit (withdrawal), and account transfer logging with person/beneficiary tracking and incremental adjustment history.
* **Daily Expense Logger:** Daily operational expenses (`RENT`, `UTILITIES`, `SALARIES`, `REFRESHMENTS`, `OFFICE_SUPPLIES`, `MARKETING`, `MAINTENANCE`) with printable, date-filtered audit exports.

### G. Executive Dashboard & Central Master Ledger (`apps/dashboard`)
* **KPI Metrics:** Real-time summary cards displaying Total Customers, Total Revenue Received, Outstanding Receivables, and Today's Operational Expenses.
* **Dynamic Health Indicator:** Real-time backend status badge showing connection latency and database connectivity.
* **Central Master Ledger (`/transactions`):** A unified chronological audit journal combining all financial activities—Traveler Payments, Hotel Settlements, Bank Transactions, and Office Expenses—into a filterable cashflow stream.

---

## 3. Centralized Branding & PDF Document Engine

All generated printable documents, invoices, vouchers, and statements consume a single source of truth for branding metadata configured via environment variables and resolved by [`frontend/src/lib/config/agency.ts`](file:///e:/KARWAN%20E%20ASOTVI%20TRAVELS/frontend/src/lib/config/agency.ts).

```typescript
export const AGENCY_CONFIG = {
  name: process.env.NEXT_PUBLIC_AGENCY_NAME || "Khas Travels",
  phone: process.env.NEXT_PUBLIC_AGENCY_PHONE || "0334-3020868",
  address: process.env.NEXT_PUBLIC_AGENCY_ADDRESS || "Office No 5, Hyderabad Road, Mirpurkhas, Sindh",
  footerText: process.env.NEXT_PUBLIC_PDF_FOOTER_TEXT || "Powered by Innosoft Technologies",
};
```

### Branded Printable Templates
Every printable view is styled with `@media print` rules, pure CSS page breaks (`break-inside-avoid`), offline base64 high-resolution logo encoding, and standardized reusable header/footer components:

| Route | Document Type | Key Data Displayed |
| :--- | :--- | :--- |
| `/finance/invoice/[enrollmentId]` | **Client Package Invoice** | Traveler CNIC, Package Itinerary, Pricing Breakdown, Payment Receipts, Remaining Balance |
| `/hotels/[id]/print` | **Hotel Reservation Voucher** | Hotel Name, City, Check-in/Out, Bedding Details, Supplier Payment Ledger |
| `/packages/[id]/print` | **Package Itinerary Sheet** | Star Rating, Hotel Allocations, Flight Routing, Shuttle Service, Passenger Quotas |
| `/finance/expenses/print` | **Operational Expense Statement** | Date-filtered expense records, Category breakdown, Spender names, Total Outflow |

* **Header Component:** [`frontend/src/components/pdf/pdf-header.tsx`](file:///e:/KARWAN%20E%20ASOTVI%20TRAVELS/frontend/src/components/pdf/pdf-header.tsx) renders the brand badge, agency name, contact details, address, and document reference.
* **Footer Component:** [`frontend/src/components/pdf/pdf-footer.tsx`](file:///e:/KARWAN%20E%20ASOTVI%20TRAVELS/frontend/src/components/pdf/pdf-footer.tsx) renders terms & conditions, client/agent signature lines, timestamp, and the attribution bar:  
  **`Powered by Innosoft Technologies`**

---

## 4. Monorepo Directory Layout

```text
khas-travels/
├── backend/
│   ├── apps/
│   │   ├── authentication/             # Custom User model, Native JWT auth, RBAC, User management API
│   │   ├── common/                     # BaseModel (UUID, timestamps), pagination, global exception handling
│   │   ├── dashboard/                  # KPI metrics, monthly cashflows, occupancy charts, /transactions ledger
│   │   ├── finance/                    # Bank accounts, Office payments, Adjustments, Daily operational expenses
│   │   ├── hotels/                     # Hotel bookings, Makkah/Madinah properties, Add Remaining settlement payments
│   │   ├── packages/                   # Travel packages catalog, enrollments, traveler payments, invoice API
│   │   ├── ticketing/                  # Agency wholesale tickets, PNR logs, full/partial refund processing
│   │   └── travelers/                  # Client profiles, CNIC/B-Form validation, age tiers, guardian linkage
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py                 # Core DRF, Native JWT, DB pooling, CORS, apps configuration
│   │   │   ├── local.py                # Local development settings (DEBUG=True)
│   │   │   └── production.py           # Hardened production settings (SSL, HSTS, WhiteNoise)
│   │   ├── asgi.py                     # ASGI entrypoint
│   │   ├── urls.py                     # Root routing, /api/v1/health/, admin & domain routers
│   │   └── wsgi.py                     # WSGI entrypoint
│   ├── requirements/
│   │   ├── base.txt                    # Django 5.1, DRF, PyJWT, psycopg 3, dj-database-url, python-dotenv
│   │   ├── local.txt                   # Local development tools
│   │   └── production.txt              # Production WSGI/ASGI servers (gunicorn, whitenoise)
│   ├── .env.example                    # Sample backend environment template
│   ├── Dockerfile                      # Production container specification
│   ├── manage.py                       # Django CLI runner
│   ├── seed_data.py                    # Seeding travelers, packages, enrollments, and payments
│   └── seed_hotels_tickets.py          # Seeding hotel bookings and airline tickets with refunds
├── frontend/
│   ├── public/                         # Static assets and favicons
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── layout.tsx          # Clean centered auth layout with high-contrast brand badge
│   │   │   │   └── login/
│   │   │   │       └── page.tsx        # React Hook Form + Zod login with spinner & lock states
│   │   │   ├── (dashboard)/
│   │   │   │   ├── admin/users/        # Admin user management & staff RBAC controls
│   │   │   │   ├── enrollments/new/    # Package booking & passenger enrollment wizard
│   │   │   │   ├── finance/            # Bank accounts, office payments, and operational expenses
│   │   │   │   ├── hotels/             # Hotel booking records, settlement modal & print voucher
│   │   │   │   ├── packages/           # Package catalog, star tiers & printable itinerary sheet
│   │   │   │   ├── tickets/            # Airline ticket booking, PNR registry & refund workflows
│   │   │   │   ├── transactions/       # Unified audit journal merging all inflows, outflows & balances
│   │   │   │   ├── travelers/          # Traveler registry, CNIC indexing, dependent family linkage
│   │   │   │   ├── layout.tsx          # Dashboard shell with responsive Sidebar and Header
│   │   │   │   └── page.tsx            # Live operations KPI dashboard with server health & charts
│   │   │   ├── error.tsx               # Route-level error boundaries
│   │   │   ├── global-error.tsx        # Root application error boundary
│   │   │   ├── layout.tsx              # Root HTML wrapper with fonts and global providers
│   │   │   └── not-found.tsx           # Custom 404 page with dashboard navigation
│   │   ├── assets/
│   │   │   ├── khastravels-logo.png    # High-resolution agency logo
│   │   │   └── logo-data.ts            # Base64 encoded logo for reliable, offline PDF printing
│   │   ├── components/
│   │   │   ├── dashboard/              # Metrics cards, cashflow charts, health status widget
│   │   │   ├── enrollments/            # Enrollment dialogs, traveler selectors
│   │   │   ├── finance/                # Bank account modals, payment forms, expense tables
│   │   │   ├── hotels/                 # Hotel booking forms, settlement modals
│   │   │   ├── layout/                 # Sidebar, Header, dynamic NavItem navigation
│   │   │   ├── packages/               # Package cards, pricing tiers, quota displays
│   │   │   ├── pdf/                    # Branded PDF Header and Footer components
│   │   │   ├── providers/              # AuthProvider (JWT sync) and QueryProvider
│   │   │   ├── ticketing/              # Ticket booking dialogs, refund calculation modals
│   │   │   ├── transactions/           # Filterable transaction table with cashflow indicators
│   │   │   ├── travelers/              # Traveler forms, CNIC mask validation, dependent lists
│   │   │   └── ui/                     # Shadcn / Radix primitives (Button, Input, Dialog, Table, etc.)
│   │   ├── lib/
│   │   │   ├── api/                    # Axios API service callers (client, auth, travel, finance, etc.)
│   │   │   ├── config/agency.ts        # Centralized branding, contact info & attribution config
│   │   │   └── utils.ts                # Currency formatters, date formatters, cn helper
│   │   ├── middleware.ts               # Next.js route protection & redirect logic
│   │   └── types/                      # TypeScript definitions (auth, travel, finance, dashboard, etc.)
│   ├── .env.example                    # Sample frontend environment template
│   ├── next.config.mjs                 # Next.js configuration (redirects, image optimization)
│   ├── package.json                    # Dependencies and build scripts
│   ├── tailwind.config.ts              # Custom design tokens, emerald palette, print media rules
│   └── tsconfig.json                   # TypeScript compiler configuration
├── .gitignore                          # Root ignore rules for .env, node_modules, venv, build artifacts
└── README.md                           # Master ERP system documentation
```

---

## 5. Getting Started & Local Setup

### System Prerequisites
* **Python:** 3.12 or newer (`python --version`)
* **Node.js:** 18.18+ or 20+ (`node --version`)
* **Package Manager:** npm or pnpm
* **PostgreSQL:** Direct access to a PostgreSQL 14+ instance

---

### Step 1: Backend Setup (Django)

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   ```powershell
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements/local.txt
   ```

4. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` and set your `DATABASE_URL`, `SECRET_KEY`, and `JWT_SECRET`.*

5. **Apply database migrations:**
   ```bash
   python manage.py migrate
   ```

6. **Create an administrator account:**
   ```bash
   python manage.py createsuperuser
   ```

7. **(Optional) Seed realistic test data:**
   ```bash
   python seed_data.py
   python seed_hotels_tickets.py
   ```

8. **Start the Django development server:**
   ```bash
   python manage.py runserver 127.0.0.1:8000
   ```
   *The API root will be accessible at `http://127.0.0.1:8000/` and Django Admin at `http://127.0.0.1:8000/admin/`.*

---

### Step 2: Frontend Setup (Next.js)

1. **Navigate to the frontend directory:**
   ```bash
   cd ../frontend
   ```

2. **Install Node packages:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   *Confirm `NEXT_PUBLIC_API_URL` points to `http://localhost:8000/api/v1`.*

4. **Launch development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   * Open your browser and navigate to **`http://localhost:3000`**.
   * Sign in using your registered administrator credentials.

---

## 6. Environment Variables Reference

### Backend Configuration (`backend/.env`)

| Variable | Type | Required | Default / Example | Purpose |
| :--- | :---: | :---: | :--- | :--- |
| `DJANGO_SETTINGS_MODULE` | String | Yes | `config.settings.local` | Determines settings file (`local` or `production`) |
| `SECRET_KEY` | String | Yes | `khas-secret-key-change-me` | Django cryptographic signing key |
| `DEBUG` | Boolean | Yes | `True` (dev) / `False` (prod) | Enables debug tracebacks in development |
| `ALLOWED_HOSTS` | String | Yes | `localhost,127.0.0.1` | Comma-separated list of valid host domains |
| `DATABASE_URL` | String | Yes | `postgresql://user:pass@host:5432/db?sslmode=require` | Connection URI for PostgreSQL database |
| `JWT_SECRET` | String | Yes | `khas-jwt-secret-signing-key` | Secret key used to sign and verify user JWTs |
| `CORS_ALLOWED_ORIGINS` | String | Yes | `http://localhost:3000,http://127.0.0.1:3000` | Authorized frontend origins permitted for CORS |
| `AGENCY_NAME` | String | No | `"Khas Travels"` | Agency business name |
| `AGENCY_PHONE` | String | No | `"0334-3020868"` | Primary agency contact phone |
| `AGENCY_ADDRESS` | String | No | `"Office No 5, Hyderabad Road, Mirpurkhas, Sindh"` | Official agency physical address |
| `PDF_FOOTER_TEXT` | String | No | `"Powered by Innosoft Technologies"` | Attribution displayed on report footers |

### Frontend Configuration (`frontend/.env.local`)

| Variable | Type | Required | Default / Example | Purpose |
| :--- | :---: | :---: | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | String | Yes | `http://localhost:8000/api/v1` | Base URL for Django REST API endpoints |
| `NEXT_PUBLIC_DJANGO_API_URL` | String | No | `http://localhost:8000/api/v1` | Direct API endpoint alias |
| `NEXT_PUBLIC_APP_NAME` | String | No | `"Khas Travels"` | Application brand title |
| `NEXT_PUBLIC_AGENCY_NAME` | String | Yes | `"Khas Travels"` | Header brand title in web views & PDF documents |
| `NEXT_PUBLIC_AGENCY_PHONE` | String | Yes | `"0334-3020868"` | Official contact number printed on invoices |
| `NEXT_PUBLIC_AGENCY_ADDRESS` | String | Yes | `"Office No 5, Hyderabad Road, Mirpurkhas, Sindh"` | Official address printed on documents |
| `NEXT_PUBLIC_PDF_FOOTER_TEXT` | String | Yes | `"Powered by Innosoft Technologies"` | Attribution printed in invoice & voucher footers |

---

## 7. Testing, Health Checks & Seeding

### Backend Health Check Endpoint
The backend includes a dedicated zero-dependency health check endpoint that tests live database connectivity:

```http
GET /api/v1/health/
```

**Response (HTTP 200 OK):**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-10-07T19:00:47.635279+00:00"
}
```

### Seeding Test Data
Two comprehensive seeding scripts populate realistic operational data:

1. **Travelers & Packages:**
   ```bash
   python seed_data.py
   ```
   *Populates 10 realistic Pakistani travelers (Adults, Children, Infants with CNICs), 5 packages (3-star, 4-star, 5-star), package enrollments, and payment installments.*

2. **Hotels & Airline Tickets:**
   ```bash
   python seed_hotels_tickets.py
   ```
   *Populates Makkah/Madinah hotel reservations with advance/remaining payment records, along with agency wholesale flight tickets, PNRs, and refund penalty logs.*

---

## 8. Production Deployment & Verification Audit

Before triggering deployment builds or pushing updates to production, execute the pre-flight verification suite:

### 1. Frontend Pre-Flight Audit
In `frontend/`:
```bash
# 1. Verify TypeScript types
npx tsc --noEmit

# 2. Run ESLint checks
npm run lint

# 3. Compile production build
npm run build
```
*Expected Output: Clean compilation with 0 errors across all 26 App Router segments.*

### 2. Backend Pre-Flight Audit
In `backend/`:
```bash
# 1. Run Django deployment configuration check
python manage.py check --deploy

# 2. Confirm all database migrations are applied
python manage.py showmigrations

# 3. Verify health endpoint
python manage.py shell -c "from django.test import Client; print(Client().get('/api/v1/health/').json())"
```

### 3. Production Serving (Gunicorn & WhiteNoise)
For containerized or VPS deployments, run Gunicorn using production settings:
```bash
export DJANGO_SETTINGS_MODULE=config.settings.production
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
```

### 4. Docker Production Build
To build and run the production backend container:
```bash
cd backend
docker build -t khas-travels-backend:latest .
docker run -d -p 8000:8000 --env-file .env khas-travels-backend:latest
```

---

## License & Support
Proprietary software developed exclusively for **Khas Travels**.  
For support, technical queries, or custom feature engineering, contact **Innosoft Technologies** at **+92 334 3020868**.
