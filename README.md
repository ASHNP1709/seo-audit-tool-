# 🔍 SEO Audit Tool — SaaS Platform

A comprehensive, multi-page SEO audit SaaS application that crawls websites and provides detailed analysis across 15+ SEO checks. Built with a modern full-stack architecture for scalability, speed, and extensibility.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Features Completed](#features-completed)
- [Environment Variables](#environment-variables)
- [Documentation Index](#documentation-index)
- [Deployment](#deployment)
- [Roadmap](#roadmap)

---

## Overview

This platform enables users to add their websites, run multi-page SEO audits (crawling 5–500 pages), and receive detailed reports with scores, categorized issues, and page-by-page breakdowns.

### Core Workflow

```
Register → Login → Dashboard → Add Website → Run Audit (select page count)
→ Crawler fetches pages → Analyzer runs 15 SEO checks per page
→ Report generated (scores + issues + page stats)
→ View audit history → Compare over time
```

### Key Capabilities

- **Multi-page crawling** — Concurrent crawler (3 pages at a time) respects server load
- **15 SEO checks per page** — Title, meta, headings, images, links, SSL, speed, robots.txt, sitemap, canonical, viewport, OG tags, indexability
- **Weighted scoring system** — Technical (35%), Content (35%), Speed (30%)
- **Site-wide issue detection** — Duplicate titles, duplicate meta descriptions across pages
- **Full audit history** — Every audit is saved with all crawled pages and issues
- **JWT authentication** — Secure access with httpOnly cookies and refresh tokens

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| NestJS | 11 | Server framework (modular architecture) |
| Fastify | — | HTTP adapter (2-3x faster than Express) |
| Prisma | 6.6 | ORM with type-safe database queries |
| PostgreSQL | 17 | Primary database |
| Redis | 8 | Caching, session management, rate limiting |
| Cheerio | — | HTML parsing for SEO analysis |
| Axios | — | HTTP client for crawling pages |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16 | React framework with App Router |
| TypeScript | — | Type safety across the stack |
| Tailwind CSS | 4 | Utility-first styling |

### Infrastructure
| Technology | Purpose |
|---|---|
| PM2 | Process manager (backend + frontend) |
| Node.js | 24 | JavaScript runtime |
| Ubuntu | 24.04 | Server OS |
| Git + GitHub | Version control |

### Why NestJS over Laravel?

NestJS was chosen for this API-heavy, concurrent workload platform:
- **Non-blocking I/O** — Handles concurrent crawl requests without blocking
- **Fastify adapter** — 2-3x faster HTTP handling vs Express
- **Same language** — TypeScript across backend + frontend = shared types
- **Modular architecture** — Similar to Laravel's service providers but with dependency injection
- **Better for crawling** — Native async/await for parallel page fetching

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 16)                 │
│                    Port 3000                             │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Auth    │  │Dashboard│  │  Sites   │  │ Audits   │  │
│  │  Pages   │  │  Page   │  │  Page    │  │ Reports  │  │
│  └─────────┘  └─────────┘  └──────────┘  └──────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP (REST API)
┌────────────────────────┴────────────────────────────────┐
│                   BACKEND (NestJS + Fastify)             │
│                   Port 4000                              │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Auth   │  │  Sites  │  │  Audits  │  │ Crawler  │  │
│  │ Module  │  │ Module  │  │  Module  │  │+ Analyzer│  │
│  └────┬────┘  └────┬────┘  └────┬─────┘  └────┬─────┘  │
│       │            │            │              │         │
│  ┌────┴────────────┴────────────┴──────────────┴─────┐  │
│  │              Prisma ORM (Type-safe queries)        │  │
│  └────────────────────────┬──────────────────────────┘  │
└───────────────────────────┼─────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              │     PostgreSQL 17          │
              │  ┌───────┐ ┌───────────┐  │
              │  │ users │ │   sites   │  │
              │  ├───────┤ ├───────────┤  │
              │  │audits │ │crawl_pages│  │
              │  ├───────┤ ├───────────┤  │
              │  │issues │ │  tokens   │  │
              │  └───────┘ └───────────┘  │
              └───────────────────────────┘
```

---

## Quick Start

### Prerequisites

- Node.js 24+
- PostgreSQL 17
- Redis 8
- PM2 (global: `npm install -g pm2`)

### Installation

```bash
# Clone repository
git clone <your-repo-url> /var/www/seo-audit-tool
cd /var/www/seo-audit-tool

# Backend setup
cd backend
cp .env.example .env          # Edit with your DB credentials
npm install
npx prisma generate
npx prisma migrate deploy
npm run build

# Frontend setup
cd ../frontend
cp .env.example .env          # Set NEXT_PUBLIC_API_URL
npm install
npm run build

# Start with PM2
cd /var/www/seo-audit-tool
pm2 start backend/dist/main.js --name seo-api
pm2 start npm --name seo-frontend -- start --prefix frontend
pm2 save
```

### Development Mode

```bash
# Terminal 1 — Backend (hot reload)
cd backend && npm run start:dev

# Terminal 2 — Frontend (hot reload)
cd frontend && npm run dev -- -H 0.0.0.0
```

### Verify Installation

```bash
pm2 status                          # Check processes
curl http://localhost:4000/api      # Test backend
curl http://localhost:3000           # Test frontend
```

---

## Project Structure

```
/var/www/seo-audit-tool/
├── backend/                          # NestJS API server
│   ├── src/
│   │   ├── main.ts                   # App bootstrap + CORS config
│   │   ├── app.module.ts             # Root module (imports all modules)
│   │   ├── prisma/                   # Database connection
│   │   └── modules/
│   │       ├── auth/                 # Authentication module
│   │       ├── sites/                # Sites CRUD module
│   │       └── audits/               # Audit engine + crawler + analyzer
│   └── prisma/
│       └── schema.prisma             # Database schema (all models)
│
├── frontend/                         # Next.js 16 application
│   └── src/app/
│       ├── login/page.tsx            # Login form
│       ├── register/page.tsx         # Registration form
│       └── dashboard/
│           ├── page.tsx              # Stats overview
│           ├── sites/page.tsx        # Sites management + run audit
│           └── audits/
│               ├── page.tsx          # Audit history list
│               └── [id]/page.tsx     # Full audit report (3 tabs)
│
├── README.md                         # ← You are here
└── docs/
    ├── BACKEND.md                    # Backend architecture & file details
    ├── FRONTEND.md                   # Frontend architecture & file details
    ├── API.md                        # Complete API endpoint reference
    └── PROGRESS.md                   # Development progress & roadmap
```

> 📖 See [docs/BACKEND.md](docs/BACKEND.md) and [docs/FRONTEND.md](docs/FRONTEND.md) for complete file-by-file breakdown.

---

## Features Completed

| Module | Status | Description |
|---|---|---|
| Authentication | ✅ Done | Register, login, JWT tokens, refresh, route guards |
| Sites CRUD | ✅ Done | Add, list, delete websites with ownership validation |
| Audit Engine | ✅ Done | Multi-page crawler + 15 SEO checks + scoring |
| Audit Reports | ✅ Done | Scores, issues, page stats, 3-tab detailed view |
| Dashboard | ✅ Done | Stats overview, quick actions, navigation |

---

## Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/seo_audit_tool"
JWT_SECRET="your-secure-jwt-secret"
JWT_REFRESH_SECRET="your-secure-refresh-secret"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"
REDIS_HOST="localhost"
REDIS_PORT=6379
PORT=4000
```

### Frontend (`frontend/.env`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## Documentation Index

| Document | What's Inside |
|---|---|
| [README.md](README.md) | Project overview, quick start, structure (this file) |
| [docs/BACKEND.md](docs/BACKEND.md) | Backend architecture, every file explained, DB schema, scoring algorithm |
| [docs/FRONTEND.md](docs/FRONTEND.md) | Frontend architecture, every page explained, auth flow, component details |
| [docs/API.md](docs/API.md) | Complete API reference — all endpoints, request/response examples |
| [docs/PROGRESS.md](docs/PROGRESS.md) | Day-by-day dev log, what's done, what's next, future plans |

---

## Deployment

### PM2 Production Commands

```bash
# Build both applications
cd /var/www/seo-audit-tool/backend && npm run build
cd /var/www/seo-audit-tool/frontend && npm run build

# Start/restart
pm2 restart all
pm2 status

# View logs
pm2 logs seo-api --lines 50
pm2 logs seo-frontend --lines 50
```

### Database Migrations

```bash
cd backend
npx prisma migrate dev --name description    # Development
npx prisma migrate deploy                    # Production
npx prisma studio                            # GUI browser
```

---

## Roadmap

### 🔜 Next Up
- [ ] Landing page (Figma design ready)
- [ ] Stripe payment integration (subscription plans)
- [ ] User profile & settings page
- [ ] Forgot password / password reset flow

### 🔮 Future Modules
- [ ] Advanced SEO audits (Schema, Off-page, UX, Competitive)
- [ ] PDF report generation
- [ ] Scheduled recurring audits
- [ ] Email notifications
- [ ] API keys for programmatic access
- [ ] White-label options
- [ ] Admin panel

### 💰 Planned Subscription Tiers
| Plan | Max Pages | Price |
|---|---|---|
| FREE | 5 | $0 |
| STARTER | 25 | $8.99/mo |
| PRO | 100 | $29.99/mo |
| AGENCY | 500 | Custom |

---

*Built with NestJS + Next.js · Last updated: February 2026*
