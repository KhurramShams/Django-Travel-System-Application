# Karwan-e-Asotvi Travels — Enterprise Management System

Production-ready, cloud-native enterprise web application replacing legacy desktop software for **Karwan-e-Asotvi Travels**. The platform unifies Hajj & Umrah package management, flight and hotel reservations, Saudi visa clearance pipelines, pilgrim accounting ledgers, and multi-tier Role-Based Access Control (RBAC).

---

## 1. Architecture Overview

```text
                               ┌────────────────────────────────────────────────┐
                               │           Next.js 15 (App Router)              │
                               │  React 19 / TypeScript / Tailwind CSS / Shadcn │
                               └───────────┬──────────────────────┬─────────────┘
                                           │                      │
                   Supabase Auth Session   │                      │ Bearer JWT (Authorization)
                   (Cookies & @supabase/ssr)                      │
                                           ▼                      ▼
                            ┌──────────────────────┐      ┌─────────────────────────────┐
                            │    Supabase Auth     │      │   Django 5.1 REST API       │
                            │  Identity & JWT      │      │ Custom SupabaseAuthentication│
                            └──────────────────────┘      │ Global Error Handling & RBAC │
                                           │              └──────────────┬──────────────┘
                                           │                             │
                                           │   PostgreSQL Connection     │
                                           ▼   (Pooled SSL Session)      ▼
                            ┌───────────────────────────────────────────────────────────┐
                            │               Supabase Managed PostgreSQL                 │
                            │  Row-Level Security (RLS) & Relational Audit Schemas       │
                            └───────────────────────────────────────────────────────────┘
```

### Core Technologies
- **Backend:** Django 5.1, Django REST Framework (DRF), PyJWT, Psycopg 3, Gunicorn / Uvicorn.
- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, TanStack Query (React Query v5), React Hook Form, Zod.
- **Authentication & RBAC:** Supabase Auth with custom DRF JWT authentication verifying cryptographic signatures, mapped to Django `User` model with roles: `Admin`, `Agent`, and `Accountant`.
- **Database Engine:** PostgreSQL hosted on Supabase.
- **Containerization:** Production multi-stage Docker container with healthcheck.

---

## 2. Monorepo Directory Structure

```text
karwan-travels/
├── backend/
│   ├── manage.py
│   ├── Dockerfile
│   ├── .env.example
│   ├── requirements/
│   │   ├── base.txt                      # Django, DRF, PyJWT, psycopg, dj-database-url
│   │   ├── local.txt                     # Dev & testing tools (pytest, black, flake8)
│   │   └── production.txt                # Production WSGI/ASGI servers (gunicorn, whitenoise)
│   ├── config/
│   │   ├── __init__.py
│   │   ├── asgi.py                       # ASGI entrypoint
│   │   ├── wsgi.py                       # WSGI entrypoint
│   │   ├── urls.py                       # Root routing & /api/v1/health/
│   │   └── settings/
│   │       ├── __init__.py
│   │       ├── base.py                   # DRF, Supabase auth, DB & CORS configuration
│   │       ├── local.py                  # Local dev settings
│   │       └── production.py             # Security headers, SSL redirect, WhiteNoise
│   └── apps/
│       ├── common/
│       │   ├── __init__.py
│       │   ├── apps.py
│       │   ├── models.py                 # TimeStampedModel, UUIDModel, BaseModel
│       │   ├── pagination.py             # StandardResultsSetPagination (uniform envelope)
│       │   └── exceptions.py             # Global DRF error handling normalization
│       └── authentication/
│           ├── __init__.py
│           ├── apps.py
│           ├── admin.py                  # Django Admin model registration
│           ├── models.py                 # Custom User model & RoleChoices (Admin, Agent, Accountant)
│           ├── authentication.py         # Custom Supabase JWT Authentication class
│           ├── permissions.py            # RBAC permissions (IsAdmin, IsAgent, IsAccountant)
│           ├── serializers.py            # User, profile update, admin update & sync serializers
│           ├── urls.py                   # Routes for /me/, /sync/, /users/
│           └── views.py                  # CurrentUserView, UserListView, UserDetailView, SyncUserView
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts                # Emerald/Gold travel brand theme & HSL tokens
│   ├── postcss.config.mjs
│   ├── next.config.mjs
│   ├── .env.example
│   └── src/
│       ├── middleware.ts                 # Next.js root middleware
│       ├── types/
│       │   └── auth.ts                   # UserProfile, UserRole, AuthContextType, ApiResponse
│       ├── lib/
│       │   ├── utils.ts                  # cn (clsx + tailwind-merge)
│       │   ├── api/
│       │   │   └── client.ts             # Axios client injecting Supabase Bearer JWT token
│       │   └── supabase/
│       │       ├── client.ts             # Browser client (@supabase/ssr)
│       │       ├── server.ts             # Server client with next/headers cookies
│       │       └── middleware.ts         # Edge session refresher and route guard
│       ├── components/
│       │   ├── ui/                       # Reusable UI primitives (Button, Input, Card, Badge)
│       │   ├── layout/
│       │   │   ├── sidebar.tsx           # Collapsible RBAC-aware navigation sidebar
│       │   │   ├── header.tsx            # Header with search, status, profile & logout
│       │   │   └── nav-item.tsx          # Dynamic active navigation item with role filter
│       │   └── providers/
│       │       ├── query-provider.tsx    # TanStack Query client provider
│       │       └── auth-provider.tsx     # Context syncing Supabase auth with Django backend
│       └── app/
│           ├── globals.css               # Design system HSL variables & Tailwind layers
│           ├── layout.tsx                # Root layout with font and global providers
│           ├── (auth)/
│           │   ├── layout.tsx            # Centered layout with travel geometric backdrop
│           │   └── login/
│           │       └── page.tsx          # React Hook Form + Zod schema + Supabase login
│           └── (dashboard)/
│               ├── layout.tsx            # Persistent layout with Sidebar and Header
│               └── page.tsx              # Operations dashboard with live metrics & RBAC card
└── README.md
```

---

## 3. Role-Based Access Control (RBAC) Matrix

| Feature / Domain | Admin | Agent | Accountant |
|---|:---:|:---:|:---:|
| **Pilgrim Bookings & Dossiers** | Full Access | Create & View Assigned | Read Only |
| **Hajj & Umrah Package Catalog** | Manage & Price | View & Book | Read Only |
| **Visa Clearance Pipelines** | Full Access | Submit & Track | View Status |
| **Invoices & Billing Generation** | Full Access | Restricted | Full Access |
| **Ledgers & Account Reconciliation**| Full Access | No Access | Full Access |
| **User & Staff Account Management** | Full Access | No Access | No Access |
| **System Security & Audit Logs** | Full Access | No Access | No Access |

---

## 4. Backend Setup & Configuration

### Prerequisites
- Python 3.12+ (Python 3.13 supported)
- PostgreSQL database (Supabase instance)

### Local Development Setup
1. Open the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Linux/macOS:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements/local.txt
   ```
4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Populate `SUPABASE_URL`, `SUPABASE_JWT_SECRET`, and `DATABASE_URL`.
5. Run migrations:
   ```bash
   python manage.py makemigrations authentication
   python manage.py migrate
   ```
6. Start development server:
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

---

## 5. Frontend Setup & Configuration

### Prerequisites
- Node.js 18.18+ or 20+ (Node v22 verified)
- npm or pnpm

### Local Development Setup
1. Open the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_API_URL`.
4. Run development server:
   ```bash
   npm run dev
   ```
5. Open browser at `http://localhost:3000`.

---

## 6. Docker Deployment

To build and run the production backend image:

```bash
cd backend
docker build -t karwan-travels-backend:latest .
docker run -d -p 8000:8000 --env-file .env karwan-travels-backend:latest
```

---

## 7. Standardized API Response Specifications

### Success Envelope (Paginated)
```json
{
  "success": true,
  "pagination": {
    "count": 148,
    "total_pages": 8,
    "current_page": 1,
    "page_size": 20,
    "next": "http://localhost:8000/api/v1/auth/users/?page=2",
    "previous": null
  },
  "results": [...]
}
```

### Error Envelope (Global Exception Handler)
```json
{
  "success": false,
  "error": {
    "status_code": 403,
    "code": "permission_denied",
    "message": "Administrator privileges are required to perform this action.",
    "details": {
      "detail": "Administrator privileges are required to perform this action."
    }
  }
}
```
