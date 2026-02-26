# CLAUDE.md — Instructions for Claude Code

## Read First
Read `README.md` and all files in `docs/` folder before starting any work:
- `docs/PROGRESS.md` — Current status, what's done, what's next
- `docs/BACKEND.md` — Backend architecture, every file explained, DB schema
- `docs/FRONTEND.md` — Frontend architecture, every page explained
- `docs/API.md` — All API endpoints with request/response examples

## Project Overview
SEO Audit SaaS Tool — users add websites, run multi-page SEO audits (5-500 pages), view detailed reports with scores and issues.

## Tech Stack
- **Backend:** NestJS 11 + Fastify + Prisma 6.6 + PostgreSQL 17 + Redis 8
- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **Runtime:** Node.js 24 on Ubuntu 24.04
- **Process Manager:** PM2

## Project Paths
```
/var/www/seo-audit-tool/
├── backend/          → NestJS API (port 4000)
├── frontend/         → Next.js app (port 3000)
└── docs/             → Project documentation
```

## Backend Patterns — Follow These Exactly

### Module Structure
Every new feature goes in `backend/src/modules/<feature>/`:
```
modules/<feature>/
├── <feature>.module.ts        → Module definition
├── <feature>.controller.ts    → Route handlers
├── <feature>.service.ts       → Business logic
└── dto/
    └── create-<feature>.dto.ts → Validation (class-validator)
```

### Key Rules
- Register new modules in `src/app.module.ts`
- Use `@UseGuards(JwtAuthGuard)` on all protected routes
- Extract userId from `req.user.userId` (set by JWT strategy)
- Always validate ownership (user can only access their own data)
- Use Prisma for all database queries (`this.prisma.<model>`)
- DTOs use `class-validator` decorators (`@IsString()`, `@IsEmail()`, etc.)
- Type `req` parameter as `any` in controller methods (Fastify compatibility)

### Authentication
- JWT tokens stored in httpOnly cookies (not headers)
- Access token: 15 min, Refresh token: 7 days
- Strategy reads from `request.cookies.access_token`

### Database
- Schema: `backend/prisma/schema.prisma`
- After schema changes: `npx prisma migrate dev --name description`
- Generate client: `npx prisma generate`

## Frontend Patterns — Follow These Exactly

### Page Structure
New pages go in `frontend/src/app/`:
- Auth pages: `src/app/<page>/page.tsx`
- Dashboard pages: `src/app/dashboard/<page>/page.tsx`

### Key Rules
- All pages use `'use client'` directive (client components)
- Styling: Tailwind CSS v4 utility classes only (no custom CSS files)
- API calls: Always include `credentials: 'include'` for cookies
- API URL: Use `process.env.NEXT_PUBLIC_API_URL` (http://localhost:4000)
- Use `useSearchParams()` inside `<Suspense>` wrapper (Next.js 16 requirement)
- Error handling: try/catch with error state displayed in red alert box

### API Call Pattern
```typescript
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/<endpoint>`, {
  method: 'GET',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
});
```

### Color Scheme
- Primary: `bg-blue-600 hover:bg-blue-700`
- Danger: `bg-red-600 hover:bg-red-700`
- Good scores (80+): `bg-green-100 text-green-800`
- Warning scores (60-79): `bg-yellow-100 text-yellow-800`
- Poor scores (<60): `bg-red-100 text-red-800`
- Cards: `bg-white rounded-lg shadow p-6`
- Page bg: `bg-gray-50 min-h-screen`
- Max width: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`

## Build & Deploy Commands
```bash
# Development
cd backend && npm run start:dev
cd frontend && npm run dev -- -H 0.0.0.0

# Production
cd backend && npm run build
cd frontend && npm run build
pm2 restart all

# Database
cd backend && npx prisma migrate dev --name <description>
cd backend && npx prisma studio
```

## After Completing Work
- Build both: `npm run build` in backend/ and frontend/
- Restart: `pm2 restart all`
- Verify: `pm2 status`
- Commit: `git add . && git commit -m "description" && git push`
- Remind user to update docs: `docs/PROGRESS.md` and any changed doc files
