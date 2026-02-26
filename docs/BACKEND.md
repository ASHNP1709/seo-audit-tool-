# 🔧 Backend Architecture — docs/BACKEND.md

Complete backend documentation for the SEO Audit Tool. Every file explained with its purpose, key logic, and how it connects to the rest of the system.

---

## Table of Contents

- [Directory Structure](#directory-structure)
- [Entry Point & Configuration](#entry-point--configuration)
- [Database Layer (Prisma)](#database-layer-prisma)
- [Auth Module](#auth-module)
- [Sites Module](#sites-module)
- [Audits Module](#audits-module)
- [Crawler Engine](#crawler-engine)
- [SEO Analyzer](#seo-analyzer)
- [Scoring Algorithm](#scoring-algorithm)
- [Database Schema](#database-schema)

---

## Directory Structure

```
backend/src/
├── main.ts                               # Bootstrap + CORS + Fastify setup
├── app.module.ts                         # Root module — imports all feature modules
├── prisma/
│   ├── prisma.module.ts                  # Global Prisma module
│   └── prisma.service.ts                 # Prisma client + lifecycle hooks
└── modules/
    ├── auth/
    │   ├── auth.module.ts                # Auth module definition
    │   ├── auth.controller.ts            # Auth endpoints (register, login, refresh, me, logout)
    │   ├── auth.service.ts               # Business logic (hash, verify, tokens)
    │   ├── dto/
    │   │   ├── register.dto.ts           # Registration validation
    │   │   └── login.dto.ts              # Login validation
    │   ├── guards/
    │   │   └── jwt-auth.guard.ts         # JWT route protection
    │   └── strategies/
    │       └── jwt.strategy.ts           # JWT extraction from cookies
    ├── sites/
    │   ├── sites.module.ts               # Sites module definition
    │   ├── sites.controller.ts           # Sites CRUD endpoints
    │   ├── sites.service.ts              # Business logic + ownership validation
    │   └── dto/
    │       ├── create-site.dto.ts        # Create site validation
    │       └── update-site.dto.ts        # Partial update validation
    └── audits/
        ├── audits.module.ts              # Audits module definition
        ├── audits.controller.ts          # Audit endpoints (create, list, get)
        ├── audits.service.ts             # Orchestrator (create → crawl → analyze → save)
        ├── dto/
        │   └── create-audit.dto.ts       # Audit creation validation
        └── analyzers/
            ├── basic-seo.analyzer.ts     # 15 SEO checks per page
            └── site-crawler.ts           # Multi-page concurrent crawler
```

---

## Entry Point & Configuration

### `src/main.ts` — Application Bootstrap

**What it does:** Creates the NestJS application with Fastify adapter, configures CORS, enables validation pipes, sets up Swagger docs, and starts listening on port 4000.

**Key configuration:**
- **Fastify adapter** — Used instead of Express for 2-3x better performance
- **CORS** — Allows frontend origin (localhost:3000) with credentials, all methods including DELETE/PATCH
- **Global ValidationPipe** — Auto-validates DTOs with `class-validator`, strips unknown properties
- **Cookie parsing** — `@fastify/cookie` registered for JWT httpOnly cookies
- **Swagger** — Available at `/api/docs` for API exploration

**CORS configuration:**
```typescript
app.enableCors({
  origin: ['http://localhost:3000', 'http://YOUR_SERVER_IP:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
});
```

### `src/app.module.ts` — Root Module

**What it does:** Imports and registers all feature modules. This is the central wiring point.

**Imports:**
- `ConfigModule.forRoot({ isGlobal: true })` — Environment variables available everywhere
- `PrismaModule` — Database access (global)
- `AuthModule` — Authentication
- `SitesModule` — Website management
- `AuditsModule` — Audit engine

---

## Database Layer (Prisma)

### `src/prisma/prisma.module.ts`

**What it does:** Declares PrismaService as a global provider so any module can inject it without importing PrismaModule.

### `src/prisma/prisma.service.ts`

**What it does:** Extends Prisma Client with NestJS lifecycle hooks. Connects to PostgreSQL on module init, disconnects on app shutdown.

**Connection:** Uses `DATABASE_URL` from `.env` — format: `postgresql://user:password@localhost:5432/seo_audit_tool`

---

## Auth Module

### `src/modules/auth/auth.module.ts`

**What it does:** Registers auth controller, service, JWT strategy. Imports JwtModule with secret and expiration from env.

### `src/modules/auth/auth.controller.ts`

**Endpoints:**

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create new user account |
| POST | `/api/auth/login` | No | Login, returns tokens in cookies |
| POST | `/api/auth/refresh` | No | Refresh access token using refresh token |
| GET | `/api/auth/me` | Yes | Get current user profile |
| POST | `/api/auth/logout` | Yes | Clear auth cookies |

**Cookie handling:** Sets `access_token` and `refresh_token` as httpOnly cookies (not accessible via JavaScript = XSS protection).

### `src/modules/auth/auth.service.ts`

**What it does:** Core authentication logic.

**Key methods:**
- `register(dto)` — Validates unique email, hashes password (bcrypt, 10 rounds), creates user, returns tokens
- `login(dto)` — Verifies email exists, compares password hash, generates JWT pair
- `refresh(refreshToken)` — Verifies refresh token, generates new access token
- `generateTokens(userId, email)` — Creates access token (15min) + refresh token (7 days)

**Security:**
- Passwords hashed with bcrypt (10 salt rounds)
- Access token expires in 15 minutes
- Refresh token expires in 7 days
- Tokens stored in httpOnly cookies (not localStorage)

### `src/modules/auth/dto/register.dto.ts`

**Validates:** `name` (required, string), `email` (required, valid email format), `password` (required, min 8 characters)

### `src/modules/auth/dto/login.dto.ts`

**Validates:** `email` (required, valid email), `password` (required)

### `src/modules/auth/guards/jwt-auth.guard.ts`

**What it does:** Extends `AuthGuard('jwt')`. Applied to any route that needs authentication. Returns 401 if no valid token.

### `src/modules/auth/strategies/jwt.strategy.ts`

**What it does:** Extracts JWT from `access_token` cookie (not Authorization header). Validates token signature and expiration. Attaches `{ userId, email }` to `request.user`.

**Token extraction:** Custom extractor reads from `request.cookies.access_token` — works with Fastify's cookie parser.

---

## Sites Module

### `src/modules/sites/sites.module.ts`

**What it does:** Registers sites controller and service. Imports PrismaModule for database access.

### `src/modules/sites/sites.controller.ts`

**All routes are JWT-protected** (uses `@UseGuards(JwtAuthGuard)`)

| Method | Route | Description |
|---|---|---|
| POST | `/api/sites` | Add a new website |
| GET | `/api/sites` | List all user's sites (with audit count) |
| GET | `/api/sites/:id` | Get single site details |
| PATCH | `/api/sites/:id` | Update site name/URL |
| DELETE | `/api/sites/:id` | Delete site and all associated data |

**Ownership enforcement:** Every request extracts `userId` from JWT token. Service layer validates that the requested site belongs to the authenticated user.

### `src/modules/sites/sites.service.ts`

**Key methods:**
- `create(userId, dto)` — Creates site linked to user, normalizes URL
- `findAll(userId)` — Returns all user's sites with `_count: { audits: true }` (audit count per site)
- `findOne(id, userId)` — Finds site with ownership check, throws 404 if not found or not owned
- `update(id, userId, dto)` — Partial update with ownership check
- `remove(id, userId)` — Deletes site (cascades to audits, crawled pages, issues)

**URL normalization:** Strips trailing slashes, ensures consistent format for crawling.

### `src/modules/sites/dto/create-site.dto.ts`

**Validates:** `name` (required, string), `url` (required, valid URL format — must start with http:// or https://)

### `src/modules/sites/dto/update-site.dto.ts`

**Validates:** Same as create but all fields optional (PartialType pattern).

---

## Audits Module

### `src/modules/audits/audits.module.ts`

**What it does:** Registers audits controller and service. Imports PrismaModule, SitesModule (to verify site ownership before auditing).

### `src/modules/audits/audits.controller.ts`

**All routes are JWT-protected**

| Method | Route | Description |
|---|---|---|
| POST | `/api/audits` | Start a new audit for a site |
| GET | `/api/audits/site/:siteId` | Get all audits for a specific site |
| GET | `/api/audits/:id` | Get single audit with all details |

### `src/modules/audits/audits.service.ts`

**This is the orchestrator** — the most complex service in the system. It coordinates the entire audit flow:

```
1. Validate site ownership
2. Create audit record (status: QUEUED)
3. Update status → CRAWLING
4. Call SiteCrawler to crawl pages (up to maxPages)
5. Update status → ANALYZING
6. For each crawled page → run BasicSeoAnalyzer (15 checks)
7. Detect site-wide issues (duplicate titles, meta descriptions)
8. Calculate scores (Technical 35% + Content 35% + Speed 30%)
9. Save all crawled pages to DB
10. Save all issues to DB
11. Update audit with scores → COMPLETED
```

**Key methods:**
- `create(userId, dto)` — Full audit orchestration (steps 1-11 above)
- `findAllBySite(siteId, userId)` — Returns all audits for a site, ordered by date desc
- `findOne(id, userId)` — Returns full audit with crawled pages and issues

**Status flow:** `QUEUED` → `CRAWLING` → `ANALYZING` → `COMPLETED` (or `FAILED` on error)

### `src/modules/audits/dto/create-audit.dto.ts`

**Validates:** `siteId` (required, string/UUID), `maxPages` (optional, number, min 1, max 500, default 5)

---

## Crawler Engine

### `src/modules/audits/analyzers/site-crawler.ts`

**What it does:** Multi-page concurrent web crawler that discovers and fetches pages across a website.

**Class: `SiteCrawler`**

**Key features:**
- **Concurrent crawling** — Fetches 3 pages simultaneously (polite to target servers)
- **Link discovery** — Extracts all `<a href>` links from each page, filters to same domain
- **URL normalization** — Removes hash fragments, trailing slashes, normalizes protocol
- **Deduplication** — Uses `Set<string>` to track visited URLs
- **File filtering** — Skips non-HTML resources (.pdf, .jpg, .png, .gif, .css, .js, .zip, etc.)
- **Error handling** — Logs failed pages, continues crawling remaining URLs

**Constructor:** `new SiteCrawler(baseUrl: string, maxPages: number)`

**Main method:** `crawl(): Promise<CrawledPage[]>`

**Algorithm:**
```
1. Initialize queue with base URL
2. While queue has URLs AND crawled < maxPages:
   a. Take up to 3 URLs from queue
   b. Fetch all 3 concurrently (Promise.allSettled)
   c. For each successful fetch:
      - Parse HTML with Cheerio
      - Extract all <a> links
      - Filter: same domain, not visited, not a file
      - Add new links to queue
      - Store page data (HTML, status, load time, URL)
   d. Mark URLs as visited
3. Return all crawled pages
```

**CrawledPage interface:**
```typescript
{
  url: string;           // Full URL of the page
  html: string;          // Raw HTML content
  statusCode: number;    // HTTP status code
  loadTime: number;      // Response time in milliseconds
  contentLength: number; // HTML size in bytes
}
```

**Concurrency control:** Uses `Promise.allSettled()` with batches of 3 — this means if one page fails, the others still complete. The crawler doesn't hammer servers with 50 concurrent requests.

---

## SEO Analyzer

### `src/modules/audits/analyzers/basic-seo.analyzer.ts`

**What it does:** Runs 15 SEO checks on a single page's HTML. Returns a list of issues with severity levels and recommendations.

**Class: `BasicSeoAnalyzer`**

**Method:** `analyze(html: string, url: string, loadTime: number, contentLength: number): AnalysisResult`

### All 15 SEO Checks

| # | Check | Category | What it Checks |
|---|---|---|---|
| 1 | Title Tag | Content | Exists, length 50-60 chars optimal |
| 2 | Meta Description | Content | Exists, length 150-160 chars optimal |
| 3 | H1 Tag | Content | Exists, only one per page |
| 4 | Heading Hierarchy | Content | Proper H1→H2→H3 structure (no skipping levels) |
| 5 | Image Alt Text | Content | All `<img>` tags have alt attributes |
| 6 | Internal Links | Content | Count of same-domain links (minimum 3 recommended) |
| 7 | External Links | Content | Count of external links (informational) |
| 8 | SSL/HTTPS | Technical | URL uses https:// protocol |
| 9 | Page Speed | Speed | Load time < 3s (good), < 5s (warning), > 5s (critical) |
| 10 | Robots.txt | Technical | /robots.txt exists and is accessible |
| 11 | Sitemap.xml | Technical | /sitemap.xml exists and is accessible |
| 12 | Canonical Tag | Technical | `<link rel="canonical">` present (prevents duplicate content) |
| 13 | Viewport Meta | Technical | `<meta name="viewport">` present (mobile-friendly) |
| 14 | Open Graph Tags | Technical | `<meta property="og:title">` etc. present (social sharing) |
| 15 | Indexability | Technical | No `<meta name="robots" content="noindex">` present |

### Severity Levels

| Severity | Deduction | Example |
|---|---|---|
| CRITICAL | -15 points | Missing title tag, no SSL |
| HIGH | -8 points | Title too long/short, missing H1 |
| MEDIUM | -4 points | Missing meta description, no canonical |
| LOW | -2 points | Missing OG tags, few internal links |

### Issue Output Format

```typescript
{
  check: string;        // "title_tag", "meta_description", etc.
  severity: string;     // "CRITICAL", "HIGH", "MEDIUM", "LOW"
  category: string;     // "Technical", "Content", "Speed"
  message: string;      // Human-readable issue description
  recommendation: string; // How to fix it
  details: any;         // Additional data (e.g., current title length)
}
```

### Site-Wide Checks (run after all pages analyzed)

These are detected in `audits.service.ts` after individual page analysis:

| Check | What it Detects |
|---|---|
| Duplicate Titles | Multiple pages with the same `<title>` tag |
| Duplicate Meta Descriptions | Multiple pages with the same meta description |

---

## Scoring Algorithm

### Category Weights

| Category | Weight | Checks Included |
|---|---|---|
| Technical | 35% | SSL, robots.txt, sitemap, canonical, viewport, OG tags, indexability |
| Content | 35% | Title, meta description, H1, heading hierarchy, images alt, links |
| Speed | 30% | Page load time, page size |

### Score Calculation

```
Each category starts at 100 points.

For each issue in that category:
  - CRITICAL → subtract 15
  - HIGH     → subtract 8
  - MEDIUM   → subtract 4
  - LOW      → subtract 2

Category score = max(0, 100 - total_deductions)

For multi-page audits:
  Category score = average of all page scores in that category

Overall score = (Technical × 0.35) + (Content × 0.35) + (Speed × 0.30)
```

### Score Interpretation (Frontend Color Coding)

| Score Range | Color | Meaning |
|---|---|---|
| 80-100 | 🟢 Green | Good — well optimized |
| 60-79 | 🟡 Yellow | Needs improvement |
| 0-59 | 🔴 Red | Poor — significant issues |

---

## Database Schema

### Models Overview

```
User (1) ──→ (N) Site (1) ──→ (N) Audit (1) ──→ (N) CrawledPage
                                         │
                                         └──→ (N) AuditIssue
```

### User Model
```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  name          String
  password      String                    // bcrypt hashed
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  sites         Site[]
}
```

### Site Model
```prisma
model Site {
  id        String   @id @default(uuid())
  name      String
  url       String
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  audits    Audit[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Audit Model
```prisma
model Audit {
  id              String        @id @default(uuid())
  siteId          String
  site            Site          @relation(fields: [siteId], references: [id], onDelete: Cascade)
  status          AuditStatus   @default(QUEUED)
  overallScore    Float?
  technicalScore  Float?
  contentScore    Float?
  speedScore      Float?
  totalPages      Int           @default(0)
  totalIssues     Int           @default(0)
  maxPages        Int           @default(5)
  duration        Int?                    // milliseconds
  crawledPages    CrawledPage[]
  issues          AuditIssue[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}
```

### CrawledPage Model
```prisma
model CrawledPage {
  id            String   @id @default(uuid())
  auditId       String
  audit         Audit    @relation(fields: [auditId], references: [id], onDelete: Cascade)
  url           String
  statusCode    Int
  loadTime      Int                      // milliseconds
  contentLength Int
  title         String?
  wordCount     Int      @default(0)
  imagesCount   Int      @default(0)
  missingAlt    Int      @default(0)
  linksCount    Int      @default(0)
  createdAt     DateTime @default(now())
}
```

### AuditIssue Model
```prisma
model AuditIssue {
  id             String   @id @default(uuid())
  auditId        String
  audit          Audit    @relation(fields: [auditId], references: [id], onDelete: Cascade)
  pageUrl        String
  checkName      String               // "title_tag", "meta_description", etc.
  severity       String               // "CRITICAL", "HIGH", "MEDIUM", "LOW"
  category       String               // "Technical", "Content", "Speed"
  message        String
  recommendation String
  details        Json?                // Additional context
  createdAt      DateTime @default(now())
}
```

### AuditStatus Enum
```prisma
enum AuditStatus {
  QUEUED
  CRAWLING
  ANALYZING
  COMPLETED
  FAILED
}
```

### Cascade Deletes

- Deleting a **Site** → deletes all its **Audits** → which deletes all **CrawledPages** + **AuditIssues**
- Deleting a **User** requires manual cleanup (or add cascade in schema)

---

## Key Dependencies

```json
{
  "@nestjs/core": "^11.x",
  "@nestjs/platform-fastify": "^11.x",
  "@nestjs/jwt": "^11.x",
  "@nestjs/passport": "^11.x",
  "@nestjs/swagger": "^11.x",
  "@prisma/client": "^6.6.x",
  "passport-jwt": "^4.x",
  "bcrypt": "^5.x",
  "class-validator": "^0.14.x",
  "class-transformer": "^0.5.x",
  "cheerio": "^1.x",
  "axios": "^1.x",
  "@fastify/cookie": "^11.x",
  "@fastify/cors": "latest"
}
```

---

*See also: [API.md](API.md) for endpoint details, [FRONTEND.md](FRONTEND.md) for UI documentation*
