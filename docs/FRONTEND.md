# 🎨 Frontend Architecture — docs/FRONTEND.md

Complete frontend documentation for the SEO Audit Tool. Every page and component explained with its purpose, state management, and API interactions.

---

## Table of Contents

- [Directory Structure](#directory-structure)
- [Configuration Files](#configuration-files)
- [Middleware (Route Protection)](#middleware-route-protection)
- [Auth Pages](#auth-pages)
- [Dashboard Page](#dashboard-page)
- [Sites Page](#sites-page)
- [Audit History Page](#audit-history-page)
- [Audit Report Page](#audit-report-page)
- [Authentication Flow](#authentication-flow)
- [API Communication Pattern](#api-communication-pattern)
- [Styling Approach](#styling-approach)
- [Next.js 16 Specifics](#nextjs-16-specifics)

---

## Directory Structure

```
frontend/src/
├── app/
│   ├── layout.tsx                    # Root layout (HTML shell, fonts, global styles)
│   ├── page.tsx                      # Landing page (placeholder — Figma design pending)
│   ├── login/
│   │   └── page.tsx                  # Login form with validation
│   ├── register/
│   │   └── page.tsx                  # Registration form with validation
│   └── dashboard/
│       ├── page.tsx                  # Main dashboard (stats cards + quick actions)
│       ├── sites/
│       │   └── page.tsx              # Sites management + run audit interface
│       └── audits/
│           ├── page.tsx              # Audit history list for a site
│           └── [id]/
│               └── page.tsx          # Full audit report (3-tab view)
├── middleware.ts                      # Auth/guest route protection
└── (styles handled by Tailwind CSS v4)
```

---

## Configuration Files

### `next.config.ts`

**Key settings:**
- No special rewrites or redirects currently
- Standard Next.js 16 App Router configuration

### `tsconfig.json`

**Key settings:**
- `strict: true` — Full TypeScript strict mode
- Path alias: `@/*` maps to `src/*`

### `tailwind.config.ts`

**Key settings:**
- Tailwind CSS v4 configuration
- Content paths: `./src/**/*.{ts,tsx}`
- Custom theme extensions as needed

### `package.json` Scripts

```json
{
  "dev": "next dev",           // Development mode (hot reload)
  "build": "next build",       // Production build
  "start": "next start"        // Start production server
}
```

---

## Middleware (Route Protection)

### `src/middleware.ts`

**What it does:** Protects routes based on authentication status. Runs on every request before the page loads.

**Logic:**
```
Guest routes (/login, /register):
  → If user HAS access_token cookie → redirect to /dashboard
  → If user has NO token → allow access

Auth routes (/dashboard/*):
  → If user HAS access_token cookie → allow access
  → If user has NO token → redirect to /login
```

**Implementation:** Checks for `access_token` cookie presence using `request.cookies.get('access_token')`. This is a lightweight check — the backend validates the actual token.

**Route matching:**
- Guest routes: `/login`, `/register`
- Auth routes: `/dashboard`, `/dashboard/sites`, `/dashboard/audits/*`

---

## Auth Pages

### `src/app/login/page.tsx` — Login Page

**What it does:** Presents login form, validates input, calls backend auth API, redirects to dashboard on success.

**State:**
- `email`, `password` — Form inputs
- `error` — Error message from API
- `loading` — Submit button loading state

**Flow:**
```
1. User enters email + password
2. Client-side validation (email format, password required)
3. POST /api/auth/login (credentials: 'include' for cookies)
4. Backend sets access_token + refresh_token cookies
5. On success → router.push('/dashboard')
6. On error → display error message
```

**UI elements:**
- Email input with label
- Password input with label
- "Sign In" button with loading spinner
- Error alert (red)
- "Don't have an account? Register" link

### `src/app/register/page.tsx` — Registration Page

**What it does:** Presents registration form, validates input, creates account, redirects to dashboard.

**State:**
- `name`, `email`, `password`, `confirmPassword` — Form inputs
- `error` — Error message
- `loading` — Submit button loading state

**Flow:**
```
1. User fills all fields
2. Client-side validation:
   - Name required
   - Email format
   - Password min 8 characters
   - Passwords match
3. POST /api/auth/register (credentials: 'include')
4. Backend creates user, sets auth cookies
5. On success → router.push('/dashboard')
6. On error → display error message
```

**UI elements:**
- Name, email, password, confirm password inputs
- "Create Account" button with loading spinner
- Error alert
- "Already have an account? Login" link

---

## Dashboard Page

### `src/app/dashboard/page.tsx` — Main Dashboard

**What it does:** Shows user's stats overview, quick actions, and navigation to other sections.

**Data fetched on mount:**
```
Promise.all([
  GET /api/auth/me          → user name + email
  GET /api/sites            → sites count
])
```

**Stats cards displayed:**
| Card | Data | Clickable |
|---|---|---|
| Websites Added | Count from sites API | Yes → /dashboard/sites |
| Total Audits | Count from audits (future) | Not yet |
| Average Score | Avg from audits (future) | Not yet |

**Quick Actions:**
- "Add Website" → Links to /dashboard/sites
- "Run Audit" → Links to /dashboard/sites
- "View Reports" → Links to /dashboard/audits

**UI layout:** Stats grid (3 cards) + Quick Actions grid + Welcome message with user name

---

## Sites Page

### `src/app/dashboard/sites/page.tsx` — Sites Management + Run Audit

**What it does:** This is the main hub. Users add websites, view their sites, delete sites, and trigger audits.

**This is the most complex frontend page** — it handles multiple workflows:

### Workflow 1: Add a Website

**State:** `showAddForm`, `newSiteName`, `newSiteUrl`, `addError`, `addLoading`

```
1. Click "Add Website" → form appears
2. Enter name + URL
3. Client validation (URL must start with http:// or https://)
4. POST /api/sites { name, url }
5. On success → form closes, sites list refreshes
6. On error → display error under form
```

### Workflow 2: View Sites Grid

**Data:** `GET /api/sites` fetched on mount, returns array of sites with audit counts.

**Each site card shows:**
- Site name + URL
- Number of audits run
- Date added
- "Run Audit" button
- "History" button (if audits > 0)
- "Delete" button (red, with confirmation)

### Workflow 3: Delete a Site

**State:** `deleteConfirm` (siteId being deleted)

```
1. Click delete icon → confirmation dialog appears
2. Confirm → DELETE /api/sites/:id
3. On success → remove from list
```

### Workflow 4: Run an Audit (Most Complex)

**State:** `auditPanel` (siteId), `selectedPages`, `auditLoading`, `auditStatus`

```
1. Click "Run Audit" on a site card
2. Page limit selector panel opens with options: [5] [10] [25] [50] [100]
3. User selects page count (default: 5)
4. Click "Start Audit"
5. POST /api/audits { siteId, maxPages: selectedPages }
6. Loading spinner appears with status messages:
   - "Starting audit..."
   - "Crawling pages..."
   - "Analyzing SEO..."
   - "Generating report..."
7. Response returns completed audit
8. Auto-redirect → router.push(`/dashboard/audits/${audit.id}`)
```

**Page limit buttons:** Styled as selectable chips. Currently all unlocked (future: locked by subscription plan with 🔒 icon).

### Navigation

- "← Back to Dashboard" link at top
- Each site card links to audit history: `/dashboard/audits?siteId=xxx`

---

## Audit History Page

### `src/app/dashboard/audits/page.tsx` — Audit History List

**What it does:** Shows all past audits for a specific site, ordered by most recent first.

**URL pattern:** `/dashboard/audits?siteId=<uuid>`

**Data fetched:** `GET /api/audits/site/:siteId` → returns array of audits

**Each audit card shows:**
| Field | Description |
|---|---|
| Overall Score | Large score number with color coding |
| Status | Badge: COMPLETED (green), FAILED (red), etc. |
| Date & Time | When the audit was run |
| Pages Crawled | `totalPages` count |
| Issues Found | `totalIssues` count |
| Duration | Time taken in seconds |
| Module Scores | Technical / Content / Speed mini scores |

**Each card is clickable** → navigates to `/dashboard/audits/:id` (full report)

**Next.js 16 note:** `useSearchParams()` requires wrapping the component in `<Suspense>` — this page uses a `SuspenseWrapper` component to handle this requirement.

### Navigation

- "← Back to Sites" link at top
- Each card links to full report

---

## Audit Report Page

### `src/app/dashboard/audits/[id]/page.tsx` — Full Audit Report

**What it does:** Displays the complete audit report with three tabs: Summary, Issues, and Pages.

**Data fetched:** `GET /api/audits/:id` → returns full audit with `crawledPages[]` and `issues[]`

### Score Section (Always Visible)

Four score cards at the top:

| Card | Weight | Color Logic |
|---|---|---|
| Overall Score | Weighted avg | Green ≥80, Yellow ≥60, Red <60 |
| Technical | 35% | Same color logic |
| Content | 35% | Same color logic |
| Speed | 30% | Same color logic |

### Stats Row (Always Visible)

| Stat | Source |
|---|---|
| Total Pages | `audit.totalPages` |
| Total Issues | `audit.totalIssues` |
| Critical Issues | Count where severity = CRITICAL |
| High Issues | Count where severity = HIGH |
| Medium/Low | Count where severity = MEDIUM or LOW |

### Tab 1: Summary

**Issues by Severity:**
- Visual bar chart showing count per severity level
- Color-coded: Critical (red), High (orange), Medium (yellow), Low (blue)

**Issues by Category:**
- Grid showing issue count per category (Technical, Content, Speed)

### Tab 2: Issues

**Full issue list, each showing:**
| Field | Display |
|---|---|
| Severity | Badge (CRITICAL red, HIGH orange, MEDIUM yellow, LOW blue) |
| Category | Badge (Technical blue, Content green, Speed purple) |
| Check Name | What was checked (e.g., "title_tag") |
| Message | What the issue is |
| Recommendation | How to fix it |
| URL | Which page has this issue |

**Sorted by:** Severity (Critical first → Low last)

### Tab 3: Pages

**All crawled pages in a table:**
| Column | Data |
|---|---|
| URL | Full page URL (linked) |
| Status | HTTP status code |
| Load Time | In milliseconds |
| Word Count | Total words on page |
| Images | Total images count |
| Missing Alt | Images without alt text |
| Links | Total links on page |

### Navigation

- "← Back to Audit History" link at top

---

## Authentication Flow

### How Cookies Work in This App

```
Frontend (3000)                    Backend (4000)
     │                                  │
     │  POST /api/auth/login            │
     │  { email, password }             │
     │  credentials: 'include'  ───────→│
     │                                  │  Validates credentials
     │                                  │  Generates JWT pair
     │   Set-Cookie: access_token=xxx   │
     │   Set-Cookie: refresh_token=xxx  │
     │←─────────────────────────────────│
     │                                  │
     │  GET /api/sites                  │
     │  Cookie: access_token=xxx ──────→│
     │                                  │  JwtAuthGuard extracts token
     │                                  │  Validates + attaches user
     │←── { sites: [...] } ────────────│
```

**Key points:**
- Frontend sends `credentials: 'include'` on every API call
- Backend sets cookies with `httpOnly: true` (JS can't read them)
- Middleware checks cookie existence for route protection
- Backend JwtStrategy reads from `request.cookies.access_token`

### Token Refresh Flow

```
1. Access token expires (15 min)
2. API call returns 401
3. Frontend calls POST /api/auth/refresh (refresh_token cookie sent automatically)
4. Backend validates refresh token, issues new access token
5. New access_token cookie set
6. Original request can be retried
```

---

## API Communication Pattern

All API calls follow this pattern:

```typescript
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/endpoint`, {
  method: 'GET',           // or POST, PATCH, DELETE
  credentials: 'include',  // ALWAYS — sends cookies
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),  // for POST/PATCH
});

if (!response.ok) {
  const error = await response.json();
  throw new Error(error.message);
}

const result = await response.json();
```

**Environment variable:** `NEXT_PUBLIC_API_URL` — set to `http://localhost:4000` (or server IP in production)

**Error handling:** Each page handles API errors with try/catch, displaying error messages in red alert boxes.

---

## Styling Approach

### Tailwind CSS v4

- **Utility-first** — No custom CSS files, all styling via className
- **Responsive** — Mobile-first with `sm:`, `md:`, `lg:` breakpoints
- **Dark mode** — Not yet implemented (future enhancement)

### Color Scheme

| Element | Color |
|---|---|
| Primary buttons | Blue (`bg-blue-600 hover:bg-blue-700`) |
| Delete/danger | Red (`bg-red-600 hover:bg-red-700`) |
| Success/good scores | Green (`bg-green-100 text-green-800`) |
| Warning/medium scores | Yellow (`bg-yellow-100 text-yellow-800`) |
| Error/poor scores | Red (`bg-red-100 text-red-800`) |
| Page background | Light gray (`bg-gray-50`) |
| Cards | White (`bg-white`) with shadow |

### Layout Pattern

All dashboard pages follow this layout:
```
┌─────────────────────────────┐
│  ← Back link                │
│  Page Title                 │
│  Description                │
├─────────────────────────────┤
│                             │
│  Main Content Area          │
│  (cards, forms, tables)     │
│                             │
└─────────────────────────────┘
```

Max width: `max-w-7xl mx-auto` with `px-4 sm:px-6 lg:px-8` padding.

---

## Next.js 16 Specifics

### App Router

All pages use the Next.js 16 App Router (`src/app/` directory). No `pages/` directory.

### Server vs Client Components

- All current pages use `'use client'` directive (client components)
- This is because they use React hooks (`useState`, `useEffect`, `useRouter`, `useSearchParams`)
- Future optimization: Move data fetching to server components where possible

### Suspense Requirement

Next.js 16 requires `useSearchParams()` to be wrapped in `<Suspense>`:

```tsx
// This pattern is used in audits/page.tsx
function AuditHistoryContent() {
  const searchParams = useSearchParams();
  const siteId = searchParams.get('siteId');
  // ... rest of component
}

export default function AuditHistoryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuditHistoryContent />
    </Suspense>
  );
}
```

### Dynamic Routes

- `audits/[id]/page.tsx` — Uses `useParams()` to get audit ID from URL
- Pattern: `/dashboard/audits/abc-123-uuid` → `params.id = 'abc-123-uuid'`

### Navigation

Uses Next.js `useRouter()` for programmatic navigation:
```typescript
const router = useRouter();
router.push('/dashboard/sites');     // Navigate
router.push(`/dashboard/audits/${id}`);  // Dynamic route
```

And `<a href="">` tags for simple links (not `<Link>` currently — can be optimized later for client-side navigation).

---

## Key Dependencies

```json
{
  "next": "^16.x",
  "react": "^19.x",
  "react-dom": "^19.x",
  "typescript": "^5.x",
  "tailwindcss": "^4.x",
  "@tailwindcss/postcss": "^4.x"
}
```

---

*See also: [BACKEND.md](BACKEND.md) for server architecture, [API.md](API.md) for endpoint details*
