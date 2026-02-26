# 🔍 SEO Audit Tool — Comprehensive SaaS Platform

> AI-Powered SEO Audit Platform with 9 Modules
> Built by iMark Infotech

---

## 📌 Project Info

| Item | Detail |
|------|--------|
| **Project Name** | Comprehensive SEO Audit Tool |
| **Type** | SaaS (Software as a Service) |
| **Domain (Dev)** | completeseoaudit.customer-devreview.com |
| **Domain (Prod)** | completeseoaudit.com |
| **GitHub Repo** | github.com/YOUR_USERNAME/seo-audit-tool |
| **Development Server** | Ubuntu 24.04 (Noble) |
| **Started** | February 24, 2026 |

---

## 🔄 How The Application Loads (Boot Flow)

When you run `npm run start:dev`, here's what happens step by step:

```
npm run start:dev
    │
    ▼
1. main.ts (Entry Point — like public/index.php in Laravel)
    │  Creates Fastify server
    │  Enables CORS (allows frontend to call API)
    │  Sets global prefix /api
    │  Enables ValidationPipe (auto-validates all requests)
    │  Starts listening on port 4000
    │
    ▼
2. AppModule (Root Module — like config/app.php providers)
    │  Loads all modules in this order:
    │
    ├── ConfigModule → Reads .env file, makes config available everywhere
    │                   Like: env() helper in Laravel
    │
    ├── PrismaModule (Global) → Connects to PostgreSQL database
    │   └── PrismaService → Creates connection pool via @prisma/adapter-pg
    │                        Like: DB::connection() in Laravel
    │
    ├── AuthModule → Handles registration, login, JWT tokens
    │   ├── AuthController → Defines routes (/api/auth/register, /login, /me)
    │   ├── AuthService → Business logic (hash password, create user, generate JWT)
    │   └── JwtStrategy → Validates Bearer tokens on protected routes
    │
    ├── (Future) UsersModule → User profiles, settings
    ├── (Future) SitesModule → Website management
    ├── (Future) AuditsModule → SEO audit orchestration
    └── (Future) All other modules...
    │
    ▼
3. Server Ready!
    "Server running on http://localhost:4000"
    "API base: http://localhost:4000/api"
```

---

## 📡 How A Request Works (Request Flow)

### Example: User Registration (POST /api/auth/register)

```
User/Postman sends POST request
    │
    │  POST http://localhost:4000/api/auth/register
    │  Body: {"email":"test@test.com","password":"Test@123456","firstName":"Rahul"}
    │
    ▼
1. Fastify Server (main.ts)
    │  Receives the HTTP request
    │  Checks CORS — is this origin allowed?
    │  Strips /api prefix → routes to /auth/register
    │
    ▼
2. ValidationPipe (main.ts — global)
    │  Finds RegisterDto class for this route
    │  Validates EVERY field against decorators:
    │    @IsEmail → is "test@test.com" valid? ✅
    │    @MinLength(8) → is password 8+ chars? ✅
    │    @Matches(regex) → has uppercase+lowercase+number+special? ✅
    │    @MinLength(2) → is firstName 2+ chars? ✅
    │
    │  If validation FAILS → returns 400 Bad Request with error messages
    │  If validation PASSES → continues ▼
    │
    ▼
3. AuthController.register() (auth.controller.ts)
    │  @Post('register') matches this route
    │  @Body() extracts JSON body as RegisterDto
    │  Calls: this.authService.register(dto)
    │
    ▼
4. AuthService.register() (auth.service.ts)
    │
    │  Step 1: Check if email exists
    │  └── prisma.user.findUnique({ where: { email } })
    │      └── Prisma sends SQL: SELECT * FROM users WHERE email = 'test@test.com'
    │      └── PostgreSQL returns: no rows (email is new)
    │
    │  Step 2: Hash password
    │  └── bcrypt.hash("Test@123456", 12) → "$2a$12$xK9m..."
    │
    │  Step 3: Create user in database
    │  └── prisma.user.create({ data: { email, password, firstName } })
    │      └── SQL: INSERT INTO users (id, email, password, first_name) VALUES (...)
    │      └── PostgreSQL creates row and returns user object
    │
    │  Step 4: Create FREE subscription
    │  └── prisma.subscription.create({ data: { userId, plan: 'FREE' } })
    │      └── SQL: INSERT INTO subscriptions (id, user_id, plan, status) VALUES (...)
    │
    │  Step 5: Generate JWT tokens
    │  └── jwtService.signAsync(payload, { secret, expiresIn: 900 })
    │      └── Creates accessToken (15 min) + refreshToken (7 days)
    │
    │  Step 6: Save refresh token to database
    │  └── prisma.refreshToken.create({ data: { userId, token, expiresAt } })
    │
    │  Step 7: Return response (user + tokens)
    │
    ▼
5. Response sent back to User/Postman
    │
    │  Status: 201 Created
    │  Body: {
    │    "user": { "id": "uuid...", "email": "test@test.com", "role": "USER" },
    │    "accessToken": "eyJhbGciOi...",
    │    "refreshToken": "eyJhbGciOi..."
    │  }
```

### Example: Protected Route (GET /api/auth/me)

```
User sends GET request with JWT token
    │
    │  GET http://localhost:4000/api/auth/me
    │  Header: Authorization: Bearer eyJhbGciOi...
    │
    ▼
1. Fastify Server receives request
    │
    ▼
2. JwtAuthGuard activates (because @UseGuards(JwtAuthGuard) is on this route)
    │  Like: Route::middleware('auth:sanctum') in Laravel
    │
    ▼
3. JwtStrategy.validate() runs (jwt.strategy.ts)
    │  Step 1: Extract token from Authorization header
    │  Step 2: Verify token signature with JWT_SECRET
    │  Step 3: Check if token is expired
    │  Step 4: Decode payload → { sub: "user-id", email, role }
    │  Step 5: Look up user in database → prisma.user.findUnique()
    │  Step 6: Check user isActive
    │  Step 7: Return { id, email, role } → becomes req.user
    │
    │  If token invalid/expired → 401 Unauthorized
    │  If token valid → continues ▼
    │
    ▼
4. AuthController.getProfile() runs
    │  req.user.id is available (set by JwtStrategy)
    │  Calls: authService.getProfile(req.user.id)
    │
    ▼
5. AuthService.getProfile() runs
    │  Queries database for full user data + subscription
    │  Returns user profile (excluding password)
    │
    ▼
6. Response: 200 OK with user profile + subscription info
```

### Quick Reference: All Routes (So Far)

**Backend API Routes (Port 4000):**

| Method | Route | Auth? | What It Does |
|--------|-------|-------|-------------|
| POST | `/api/auth/register` | No | Create new account |
| POST | `/api/auth/login` | No | Login, get JWT tokens |
| GET | `/api/auth/me` | JWT Required | Get current user profile |
| GET | `/api/docs` | No | Swagger API docs (interactive testing) |

**Frontend Pages (Port 3000):**

| URL | Auth? | What It Shows |
|-----|-------|--------------|
| `/login` | Guest only | Login form (redirects to dashboard if logged in) |
| `/register` | Guest only | Registration form (redirects to dashboard if logged in) |
| `/dashboard` | Auth required | User dashboard with profile + stats (redirects to login if not logged in) |

### Laravel vs NestJS Request Flow Comparison

```
LARAVEL:                              NESTJS:
Request → routes/api.php         →    Request → Controller decorator (@Post, @Get)
       → middleware (auth:sanctum) →          → Guard (JwtAuthGuard)
       → FormRequest validation    →          → ValidationPipe + DTO
       → Controller method         →          → Controller method
       → Service / Repository      →          → Service (injected)
       → Eloquent Model            →          → Prisma Client
       → PostgreSQL                →          → PostgreSQL
       → return response()->json() →          → return object (auto-serialized)
```

---

## 📁 Files Created So Far (With Purpose)

### Backend Files (NestJS — Port 4000)

```
/var/www/seo-audit-tool/backend/
│
├── prisma/
│   ├── schema.prisma                ← All 20+ database tables (fully commented)
│   ├── prisma.config.ts             ← Prisma 7 DB connection config
│   └── migrations/                  ← Auto-generated SQL files
│
├── src/
│   ├── main.ts                      ← Server entry: Fastify + CORS + ValidationPipe + Swagger
│   ├── app.module.ts                ← Root module: imports Config + Prisma + Auth
│   │
│   ├── config/
│   │   └── app.config.ts            ← Reads .env: JWT secrets, Redis, port
│   │
│   ├── common/
│   │   ├── prisma/
│   │   │   ├── prisma.service.ts    ← DB connection (Prisma 7 + pg adapter)
│   │   │   └── prisma.module.ts     ← Makes DB available globally
│   │   └── guards/
│   │       └── jwt-auth.guard.ts    ← Protects routes (like auth:sanctum)
│   │
│   └── modules/
│       └── auth/
│           ├── dto/
│           │   ├── register.dto.ts  ← Registration validation rules + Swagger examples
│           │   ├── login.dto.ts     ← Login validation rules + Swagger examples
│           │   └── index.ts         ← Barrel export file
│           ├── auth.controller.ts   ← Routes: /register, /login, /me (with Swagger docs)
│           ├── auth.service.ts      ← Logic: hash, create, JWT, verify
│           ├── auth.module.ts       ← Wires controller + service + JWT
│           └── jwt.strategy.ts      ← Token validation strategy
│
├── .env                             ← Secrets (DB, JWT, Redis)
└── package.json                     ← Dependencies
```

### Frontend Files (Next.js — Port 3000)

```
/var/www/seo-audit-tool/frontend/
│
├── src/
│   ├── app/
│   │   ├── layout.tsx               ← Root layout (like layouts/app.blade.php)
│   │   ├── globals.css              ← Tailwind CSS imports
│   │   ├── page.tsx                 ← Homepage → redirects to /login
│   │   ├── login/
│   │   │   └── page.tsx             ← ✅ Login page (guest middleware + API call)
│   │   ├── register/
│   │   │   └── page.tsx             ← ✅ Register page (guest middleware + API call)
│   │   └── dashboard/
│   │       └── page.tsx             ← ✅ Dashboard (auth middleware + user profile)
│   │
│   └── lib/
│       └── api.ts                   ← Axios instance (auto-attaches JWT, handles 401)
│
├── .env.local                       ← API URL (NEXT_PUBLIC_API_URL)
├── next.config.ts                   ← Next.js config (allowedDevOrigins)
├── tsconfig.json                    ← TypeScript config (paths: @/ = src/)
├── tailwind.config.ts               ← Tailwind CSS config
└── package.json                     ← Dependencies
```

---

## 🖥️ How The Frontend Works (Page Flow)

### Frontend Boot Flow (when you run npm run dev)

```
npm run dev -- -H 0.0.0.0
    │
    ▼
1. Next.js starts on port 3000
    │  Reads next.config.ts (allowed origins)
    │  Reads .env.local (NEXT_PUBLIC_API_URL = backend URL)
    │  Reads tsconfig.json (paths: @/ = src/)
    │
    ▼
2. layout.tsx loads (Root Layout)
    │  Like: resources/views/layouts/app.blade.php in Laravel
    │  Sets <html>, <body>, page title, global CSS
    │  {children} = whatever page user visits
    │
    ▼
3. Page loads based on URL:
    │
    ├── /           → page.tsx         → redirect('/login')
    ├── /login      → login/page.tsx   → Login form
    ├── /register   → register/page.tsx → Register form
    └── /dashboard  → dashboard/page.tsx → User dashboard
```

### Route Protection Flow (Middleware)

```
USER VISITS A PAGE
    │
    ├── /login or /register (Guest pages)
    │   │
    │   ▼
    │   useEffect runs on page load (like 'guest' middleware in Laravel)
    │   │
    │   ├── Has accessToken cookie?
    │   │   ├── YES → Call GET /api/auth/me to verify token
    │   │   │   ├── Token VALID → redirect to /dashboard (already logged in!)
    │   │   │   └── Token EXPIRED → clear cookies, show login/register page
    │   │   └── NO → Show login/register page
    │   │
    │   ▼
    │   User submits form
    │   │
    │   ▼
    │   Call POST /api/auth/login or /register
    │   │
    │   ├── SUCCESS → Save tokens in cookies → redirect to /dashboard
    │   └── ERROR → Show error message ("Invalid email or password")
    │
    │
    └── /dashboard (Protected page)
        │
        ▼
        useEffect runs on page load (like 'auth' middleware in Laravel)
        │
        ├── Has accessToken cookie?
        │   ├── YES → Call GET /api/auth/me
        │   │   ├── Token VALID → Show dashboard with user data
        │   │   └── Token EXPIRED → clear cookies → redirect to /login
        │   └── NO → redirect to /login
        │
        ▼
        User clicks Logout
        │
        ▼
        Clear cookies → redirect to /login
```

### Frontend ↔ Backend Communication

```
FRONTEND (Next.js :3000)              BACKEND (NestJS :4000)
========================              =======================

Register Page                         
  │ Submit form                       
  │ api.post('/auth/register', data)  
  │──────────────────────────────────→ POST /api/auth/register
  │                                     │ Validate (RegisterDto)
  │                                     │ Check email unique
  │                                     │ Hash password (bcrypt)
  │                                     │ Create user in PostgreSQL
  │                                     │ Create FREE subscription
  │                                     │ Generate JWT tokens
  │←──────────────────────────────────  │ Return { user, tokens }
  │ Save tokens in cookies             
  │ redirect to /dashboard             

Dashboard Page                        
  │ Page loads                        
  │ api.get('/auth/me')               
  │──────────────────────────────────→ GET /api/auth/me
  │  (Authorization: Bearer eyJ...)      │ JwtAuthGuard checks token
  │                                     │ JwtStrategy validates + decodes
  │                                     │ Query user from PostgreSQL
  │←──────────────────────────────────  │ Return user profile
  │ Show user data on page            
```

### Laravel vs Next.js Page Comparison

```
LARAVEL BLADE:                         NEXT.JS REACT:
===================================    ===================================
resources/views/auth/login.blade.php = src/app/login/page.tsx
resources/views/dashboard.blade.php  = src/app/dashboard/page.tsx
layouts/app.blade.php                = src/app/layout.tsx
public/css/app.css                   = src/app/globals.css
config/app.php                       = .env.local
routes/web.php                       = Folder-based routing (app/login/ = /login)
Route::middleware('guest')           = useEffect checks token on login/register
Route::middleware('auth')            = useEffect checks token on dashboard
Auth::login($user)                   = Cookies.set('accessToken', token)
Auth::logout()                       = Cookies.remove('accessToken')
Auth::check()                        = Cookies.get('accessToken') exists?
Auth::user()                         = api.get('/auth/me') response
$request->user()                     = user state from useState
@if($errors->any())                  = {error && <div>{error}</div>}
{{ $user->name }}                    = {user.firstName}
@csrf                                = Not needed (JWT, not sessions)
```

| Software | Version | Status | Check Command |
|----------|---------|--------|---------------|
| **Ubuntu** | 24.04 (Noble) | ✅ Running | `lsb_release -a` |
| **Node.js** | 24 LTS | ✅ Installed | `node -v` |
| **npm** | 11 | ✅ Installed | `npm -v` |
| **PostgreSQL** | 17.8 | ✅ Running | `sudo systemctl status postgresql` |
| **Redis** | 8.6.1 | ✅ Running | `redis-cli ping` → PONG |
| **NestJS CLI** | Latest | ✅ Installed | `nest --version` |
| **TypeScript** | Latest | ✅ Installed | `tsc --version` |
| **Git** | Latest | ✅ Installed | `git --version` |
| **pgAdmin** | Latest | ✅ Running | `http://server-ip/pgadmin4` |
| **Claude Code** | Latest | ✅ Installed | AI coding assistant |
| **Next.js** | 16.1.6 | ✅ Installed | Frontend framework (port 3000) |
| **PM2** | Latest | ✅ Running | `pm2 status` (keeps both servers alive) |
| **Nginx** | - | ⬜ Production only | Reverse proxy + SSL |

---

## 🏗️ HOW TO SET UP THIS PROJECT FROM SCRATCH

> If setting up on a new server, follow these steps in exact order.
> If project is already running, skip to "Daily Development Commands".

### Prerequisites
- Ubuntu 22.04 or 24.04 server
- SSH access (VS Code Remote SSH recommended)
- GitHub account

### Step 1: Install Basic Tools
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl wget build-essential lsb-release gnupg2
```

### Step 2: Install Node.js 24 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # Should show v24.x.x
npm -v    # Should show 11.x.x
```

### Step 3: Install PostgreSQL 17
```bash
# Add repository
echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Install
sudo apt update
sudo apt install -y postgresql-17 postgresql-contrib-17

# Verify (should show "active (running)")
sudo systemctl status postgresql
```

### Step 4: Create Database
```bash
sudo -u postgres psql -c "CREATE USER seo_admin WITH PASSWORD 'seo_audit_dev_2026';"
sudo -u postgres psql -c "CREATE DATABASE seo_audit_db OWNER seo_admin;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE seo_audit_db TO seo_admin;"
sudo -u postgres psql -c "ALTER USER seo_admin CREATEDB;"
sudo -u postgres psql -d seo_audit_db -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
sudo -u postgres psql -d seo_audit_db -c "CREATE EXTENSION IF NOT EXISTS \"pg_trgm\";"

# Test (password: seo_audit_dev_2026)
psql -h localhost -U seo_admin -d seo_audit_db -c "SELECT version();"
```

### Step 5: Install Redis 8
```bash
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list
sudo apt update
sudo apt install -y redis
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verify
redis-cli ping          # PONG
redis-server --version  # 8.x
```

### Step 6: Install pgAdmin (Database GUI — like phpMyAdmin)
```bash
curl -fsS https://www.pgadmin.org/static/packages_pgadmin_org.pub | sudo gpg --dearmor -o /usr/share/keyrings/packages-pgadmin-org.gpg
echo "deb [signed-by=/usr/share/keyrings/packages-pgadmin-org.gpg] https://ftp.postgresql.org/pub/pgadmin/pgadmin4/apt/$(lsb_release -cs) pgadmin4 main" | sudo tee /etc/apt/sources.list.d/pgadmin4.list
sudo apt update
sudo apt install -y pgadmin4-web
sudo /usr/pgadmin4/bin/setup-web.sh

# Access at: http://your-server-ip/pgadmin4
```

### Step 7: Install Global npm Tools
```bash
sudo npm install -g @nestjs/cli typescript ts-node
nest --version
tsc --version
```

### Step 8: Create Deploy User (don't run project as root)
```bash
adduser deploy
usermod -aG sudo deploy
mkdir -p /var/www/seo-audit-tool
chown -R deploy:deploy /var/www/seo-audit-tool

# Switch to deploy user
su - deploy
```

### Step 9: Create NestJS Project (as deploy user)
```bash
cd /var/www/seo-audit-tool
git init
nest new backend --package-manager npm --strict
```

### Step 10: Install All Backend Packages
```bash
cd /var/www/seo-audit-tool/backend

# Core NestJS
npm install @nestjs/config @nestjs/swagger @nestjs/jwt @nestjs/passport @nestjs/schedule @nestjs/throttler @nestjs/websockets @nestjs/platform-socket.io @nestjs/bullmq @nestjs/cache-manager @nestjs/platform-fastify

# Database + Cache
npm install @prisma/client ioredis cache-manager cache-manager-ioredis-yet bullmq

# Authentication
npm install passport passport-jwt passport-local bcryptjs class-validator class-transformer

# External APIs + Tools
npm install stripe axios cheerio puppeteer sharp pdfkit speakeasy qrcode

# Security + Server
npm install helmet @fastify/helmet @fastify/cors @fastify/compress socket.io

# Utilities
npm install dayjs lodash uuid nanoid sanitize-html

# Dev dependencies
npm install -D prisma @types/bcryptjs @types/passport-jwt @types/passport-local @types/lodash @types/uuid

# Initialize Prisma
npx prisma init --datasource-provider postgresql
```

### Step 11: Configure Environment
```bash
nano /var/www/seo-audit-tool/backend/.env
```
```
DATABASE_URL="postgresql://seo_admin:seo_audit_dev_2026@localhost:5432/seo_audit_db"
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://completeseoaudit.customer-devreview.com
JWT_SECRET=my_super_secret_jwt_key_for_seo_audit_tool_2026_change_in_production
JWT_REFRESH_SECRET=my_refresh_secret_key_for_seo_audit_tool_2026_change_in_production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Step 12: Start the Server
```bash
cd /var/www/seo-audit-tool/backend
npm run start:dev
```
Test: `curl http://localhost:4000` → Should return "Hello World!"

### Step 13: Push to GitHub
```bash
cd /var/www/seo-audit-tool
git add .
git commit -m "Initial setup: NestJS server running on port 4000"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/seo-audit-tool.git
git push -u origin main
```

---

## 🗄️ All Credentials (Dev Environment)

### Database
| Item | Value |
|------|-------|
| **Database Name** | seo_audit_db |
| **Database User** | seo_admin |
| **Database Password** | seo_audit_dev_2026 |
| **Host** | localhost |
| **Port** | 5432 |

### pgAdmin
| Item | Value |
|------|-------|
| **URL** | http://your-server-ip/pgadmin4 |
| **Login Email** | admin@completeseoaudit.com |
| **Login Password** | Admin@123456 |

### Redis
| Item | Value |
|------|-------|
| **Host** | localhost |
| **Port** | 6379 |
| **Password** | (none for dev) |

### Deploy User
| Item | Value |
|------|-------|
| **Username** | deploy |
| **Password** | Deploy@2026 |

---

## 🚀 Daily Workflow (Morning → Evening)

### 🌅 Morning — Start Your Day

```bash
# 1. Connect to server via VS Code Remote SSH

# 2. Stop PM2 (free ports 4000 and 3000 for dev mode)
pm2 stop all

# 3. Pull latest code (if working with team)
cd /var/www/seo-audit-tool
git pull origin main

# 4. Start backend dev server (Terminal 1)
cd /var/www/seo-audit-tool/backend
npm run start:dev

# 5. Start frontend dev server (Terminal 2)
cd /var/www/seo-audit-tool/frontend
npm run dev -- -H 0.0.0.0

# 6. Verify both work:
# Backend:  http://completeseoaudit.customer-devreview.com:4000/api/docs
# Frontend: http://completeseoaudit.customer-devreview.com:3000/login
```

### 💻 During The Day — Code + Test

```bash
# Both dev servers running — just edit files in VS Code!
# Backend: saves auto-restart NestJS (port 4000)
# Frontend: saves auto-refresh Next.js (port 3000)
# Test APIs in Swagger, test pages in browser

# If you change database schema (prisma/schema.prisma):
cd /var/www/seo-audit-tool/backend
npx prisma migrate dev --name what_you_changed
npx prisma generate

# Commit after every feature or fix:
cd /var/www/seo-audit-tool
git add .
git commit -m "feat: added users module with profile update"
git push origin main
```

### 🌆 Evening — End of Day (EOD)

```bash
# 1. Stop both dev servers (Ctrl+C in both terminals)

# 2. Final commit + push
cd /var/www/seo-audit-tool
git add .
git commit -m "eod: what you completed today"
git push origin main

# 3. Build both and start PM2 (client can test overnight)
cd /var/www/seo-audit-tool/backend
npm run build

cd /var/www/seo-audit-tool/frontend
npm run build

# 4. Restart both PM2 processes
pm2 restart all

# 5. Verify both running
pm2 status              # Should show seo-api + seo-frontend = online

# 6. Close VS Code — both servers keep running!
```

### Important Rules

```
1. NEVER run dev mode AND PM2 at same time -> port conflict
   Morning: pm2 stop all -> then start dev servers
   Evening: stop dev servers -> build both -> pm2 restart all
2. ALWAYS npm run build in BOTH backend AND frontend BEFORE pm2 restart
3. ALWAYS commit and push before leaving
4. If server reboots -> PM2 auto-starts both (pm2 startup + pm2 save configured)
5. Frontend needs backend running -> always start backend FIRST
```

---

## 📧 EOD Client Update Template

Send daily to your client after work:

```
Subject: SEO Audit Tool — Daily Update (Date)

Hi [Client],

Today's Progress:
✅ [What you completed today]
✅ [What you completed today]
✅ [What you completed today]

Tomorrow's Plan:
🔜 [What you'll work on next]
🔜 [What you'll work on next]

Overall Progress: ██████░░░░░░░░░░ 15%

Live API Docs (test it): 
http://completeseoaudit.customer-devreview.com:4000/api/docs

Regards,
Ashish
```

---

## 🔧 PM2 Commands (Keep Server Running 24/7)

### PM2 Status (Both servers)
```bash
pm2 status
# Should show:
# | id | name          | status | port |
# |----|---------------|--------|------|
# | 0  | seo-api       | online | 4000 | ← Backend (NestJS)
# | 1  | seo-frontend  | online | 3000 | ← Frontend (Next.js)
```

| Command | What It Does |
|---------|-------------|
| `pm2 status` | Check if both servers are running |
| `pm2 logs seo-api` | See backend logs |
| `pm2 logs seo-frontend` | See frontend logs |
| `pm2 restart seo-api` | Restart backend (after npm run build) |
| `pm2 restart seo-frontend` | Restart frontend (after npm run build) |
| `pm2 stop all` | Stop both servers (before dev mode) |
| `pm2 restart all` | Restart both servers |
| `pm2 startup` | Auto-start PM2 on server reboot |
| `pm2 save` | Save current PM2 process list |

### First Time PM2 Setup (Already Done)
```bash
# Backend
cd /var/www/seo-audit-tool/backend
npm run build
pm2 start dist/src/main.js --name "seo-api"

# Frontend
cd /var/www/seo-audit-tool/frontend
npm run build
pm2 start npm --name "seo-frontend" -- start -- -H 0.0.0.0

# Save both
pm2 startup
pm2 save
```

---

## 📡 URLs (Share With Client)

| What | URL |
|------|-----|
| **Register Page** | http://completeseoaudit.customer-devreview.com:3000/register |
| **Login Page** | http://completeseoaudit.customer-devreview.com:3000/login |
| **Dashboard** | http://completeseoaudit.customer-devreview.com:3000/dashboard |
| **Swagger API Docs** | http://completeseoaudit.customer-devreview.com:4000/api/docs |
| **API Base** | http://completeseoaudit.customer-devreview.com:4000/api |
| **pgAdmin (DB)** | http://completeseoaudit.customer-devreview.com/pgadmin4 |
| **GitHub Code** | https://github.com/YOUR_USERNAME/seo-audit-tool |

---

## 🗄️ Quick Reference Commands

### Database Commands
```bash
psql -h localhost -U seo_admin -d seo_audit_db      # Connect to DB
sudo -u postgres psql -c "\l"                         # List databases
sudo -u postgres psql -d seo_audit_db -c "\dt"       # List tables
cd /var/www/seo-audit-tool/backend && npx prisma studio  # Visual browser (port 5555)
```

### Redis Commands
```bash
redis-cli ping              # Test → PONG
redis-cli MONITOR           # Watch commands live
redis-cli INFO memory       # Check memory
redis-cli FLUSHALL          # Clear cache (careful!)
```

### Git Commands
```bash
cd /var/www/seo-audit-tool
git add .
git commit -m "feat: description of what you built"
git push origin main
git log --oneline -10       # See last 10 commits
```

### Schema Change Commands
```bash
cd /var/www/seo-audit-tool/backend
npx prisma migrate dev --name description_of_change
npx prisma generate
npx prisma studio           # Browse database visually
```

---

## 📁 Project Structure

> See detailed "Files Created So Far" section above for file-by-file breakdown.

---

## 📦 9 Audit Modules

| # | Module | What It Does | APIs Used |
|---|--------|-------------|-----------|
| 1 | **Technical SEO** | Crawlability, indexing, redirects, SSL, mobile | Self-built crawler |
| 2 | **Page Speed** | Core Web Vitals, load time, image optimization | Google PageSpeed API (FREE) |
| 3 | **Content Quality** | Duplicate content, headings, readability, links | Self-built + Claude AI |
| 4 | **AI Analysis** | "Why not ranking", content scoring, topic gaps | Anthropic Claude API |
| 5 | **Schema** | Structured data validation, rich results | Self-built validator |
| 6 | **Off-Page** | Backlinks, toxic links, anchor text, authority | DataForSEO API |
| 7 | **UX Audit** | Pop-ups, CLS, CTAs, accessibility, mobile UX | Puppeteer (self-built) |
| 8 | **Reporting** | PDF reports, CSV, shareable links, before/after | PDFKit (self-built) |
| 9 | **Competitive** | SERP tracking, keyword gaps, market benchmarks | DataForSEO API |

---

## 💳 Subscription Plans

| Feature | Free | Starter $29/mo | Pro $79/mo | Agency $199/mo |
|---------|------|----------------|------------|----------------|
| Monthly Audits | 5 | 50 | 200 | Unlimited |
| Pages per Audit | 25 | 100 | 500 | 2,000 |
| AI Analysis | No | Basic (3) | Full | Full + Priority |
| Competitors | 0 | 3 | 5 | 10 |
| Team Members | 1 | 3 | 10 | Unlimited |
| White-label | No | No | Yes | Yes + Custom |
| API Access | No | No | 100/day | Unlimited |

---

## 🔑 API Keys (Add to .env when ready)

| Service | Cost | Get From |
|---------|------|----------|
| Google PageSpeed | FREE | console.cloud.google.com |
| Anthropic Claude | $50-150/mo | console.anthropic.com |
| DataForSEO | $50-200/mo | dataforseo.com |
| Stripe | 2.9% + $0.30/txn | stripe.com |

---

## 📅 Development Progress

### ✅ COMPLETED — Infrastructure (Day 1)
- [x] Ubuntu 24.04 server setup
- [x] Node.js 24 LTS + npm 11
- [x] Claude Code installed
- [x] Git installed and configured
- [x] PostgreSQL 17.8 installed and running
- [x] Database + user + extensions created (uuid-ossp, pg_trgm)
- [x] Redis 8.6.1 installed and running
- [x] pgAdmin installed and configured (connected to database)
- [x] NestJS CLI + TypeScript installed globally
- [x] Deploy user created
- [x] Firewall port 4000 opened

### ✅ COMPLETED — Project Setup (Day 1)
- [x] NestJS project created (nest new backend)
- [x] All backend packages installed (50+ packages)
- [x] Prisma ORM initialized
- [x] Environment configured (.env with DB, JWT, Redis)
- [x] Code pushed to GitHub

### ✅ COMPLETED — Server & Database (Day 1)
- [x] Switched Express → Fastify (3x faster performance)
- [x] main.ts fully configured (Fastify, CORS, /api prefix, port 4000)
- [x] Prisma 7 configured (prisma.config.ts + @prisma/adapter-pg)
- [x] Database schema created (20+ tables for all 9 modules)
- [x] First migration run (all tables created in PostgreSQL)
- [x] Prisma Client generated
- [x] PrismaService created (global database service with pg adapter)
- [x] PrismaModule created (global — available in all modules)
- [x] ConfigModule setup (app.config.ts — JWT, Redis, env vars)
- [x] AppModule updated (imports Config + Prisma)
- [x] Server running: 0 errors, database connected ✅
- [x] API accessible at http://your-domain:4000/api

### ✅ COMPLETED — Auth Module (Day 1)
- [x] Auth DTOs created (RegisterDto + LoginDto with validation + Swagger examples)
- [x] Auth Service (register, login, JWT generation, bcrypt hashing)
- [x] Auth Controller (POST /register, POST /login, GET /me with Swagger docs)
- [x] JWT Strategy (token extraction + validation + user lookup)
- [x] JWT Auth Guard (protects routes — like auth:sanctum)
- [x] Auth Module (wired: controller + service + JWT + Passport)
- [x] ValidationPipe enabled globally (auto-validates all requests)
- [x] Registration tested ✅ (201 Created, user in database, JWT returned)
- [x] Login tested ✅
- [x] Protected route /me tested ✅

### ✅ COMPLETED — Swagger + PM2 (Day 2)
- [x] Swagger API docs setup (visual API testing page)
- [x] Swagger shows request schemas with example values
- [x] Swagger Bearer auth works (Authorize button for JWT)
- [x] All 3 endpoints documented with response examples
- [x] PM2 installed for backend (keeps API running 24/7)
- [x] PM2 startup configured (survives server reboot)

### ✅ COMPLETED — Frontend Setup + Auth Pages (Day 2)
- [x] Next.js 16 project created (App Router, TypeScript, Tailwind)
- [x] Axios HTTP client configured (auto-attaches JWT tokens)
- [x] API interceptors (auto-redirect to login on 401)
- [x] Environment configured (.env.local with backend URL)
- [x] Register page (form + validation + API call + save JWT + redirect)
- [x] Login page (form + API call + save JWT + redirect)
- [x] Dashboard page (protected — fetch profile, show user data + stats)
- [x] Guest middleware on login/register (redirect if already logged in)
- [x] Auth middleware on dashboard (redirect if not logged in)
- [x] Logout functionality (clear cookies + redirect)
- [x] PM2 for frontend (keeps UI running 24/7)
- [x] Both servers running: backend :4000 + frontend :3000
- [x] Full auth flow working: Register → Login → Dashboard → Logout

### 🔜 NEXT STEP — Improve UI + Build Users/Sites
- [ ] Improve login/register/dashboard UI design (professional SaaS look)
- [ ] Users module backend (profile update, change password, avatar)
- [ ] Users profile page frontend
- [ ] Sites module backend (add website, list sites, competitors)
- [ ] Sites page frontend (add site, view sites)
- [ ] Start audit flow (enter URL → run audit)

### ⬜ UPCOMING — Backend Modules
- [ ] Users (profile, settings, change password)
- [ ] Sites (add site, competitors, schedules)
- [ ] Audits (orchestration, BullMQ queue, WebSocket progress)
- [ ] Crawler (Cheerio + Puppeteer concurrent crawling)
- [ ] Module 1: Technical SEO (robots.txt, sitemaps, redirects, SSL)
- [ ] Module 2: Page Speed (Google PageSpeed API, Core Web Vitals)
- [ ] Module 3: Content Quality (duplicates, headings, readability)
- [ ] Module 4: AI Analysis (Claude API — "why not ranking")
- [ ] Module 5: Schema Checker (JSON-LD, rich results)
- [ ] Module 6: Off-Page (DataForSEO — backlinks, authority)
- [ ] Module 7: UX Audit (Puppeteer — pop-ups, CLS, accessibility)
- [ ] Module 8: Reporting (PDF, CSV, shareable links)
- [ ] Module 9: Competitive (DataForSEO — SERP, keyword gaps)
- [ ] Stripe billing (subscriptions, checkout, webhooks)
- [ ] Rate limiting by plan tier
- [ ] Admin panel API
- [ ] Seed data (admin + test users)

### ⬜ UPCOMING — Frontend Pages (Next.js)
- [x] Next.js setup (App Router, Tailwind, TypeScript) ✅
- [x] Auth pages (login, register) ✅
- [x] Dashboard (user profile, stats cards) ✅
- [ ] Improve UI design (professional SaaS look)
- [ ] User profile/settings page
- [ ] Add Site page (enter URL for audit)
- [ ] Audit results page (tabbed, issues, AI insights)
- [ ] Reports center (PDF download, shareable links)
- [ ] Billing page (plans, upgrade, invoices)
- [ ] Settings (profile, 2FA, API keys)
- [ ] Team management
- [ ] Admin panel UI

### ⬜ UPCOMING — Production Deployment
- [x] PM2 process manager ✅ (backend seo-api + frontend seo-frontend)
- [ ] Nginx reverse proxy + SSL (Let's Encrypt)
- [ ] Domain DNS configuration
- [ ] CloudFlare CDN
- [ ] Sentry error tracking
- [ ] Uptime monitoring

---

## ❓ Troubleshooting

| Problem | Fix |
|---------|-----|
| PostgreSQL won't start | `sudo systemctl restart postgresql` |
| Redis won't start | `sudo systemctl restart redis-server` |
| NestJS won't start | `npm install` then `npx prisma generate` then `npm run start:dev` |
| Port 4000 in use | `sudo lsof -i :4000` then `sudo kill -9 <PID>` |
| Reset database | `npx prisma migrate reset --force && npx prisma db seed` |
| Prisma "url not supported" error | Prisma 7: URL goes in `prisma.config.ts`, NOT in `schema.prisma` |
| Prisma "PrismaClient" not found | Run `npx prisma generate` to regenerate client |
| Curly quotes error in terminal | Don't paste from Word/Docs — use nano editor directly |
| PM2 shows "errored" | `pm2 logs seo-api` to see error, fix code, `npm run build`, `pm2 restart seo-api` |
| PM2 + dev server conflict | Stop one before starting other: `pm2 stop seo-api` then `npm run start:dev` |
| Swagger not loading | Check server is running: `pm2 status` or `npm run start:dev` |
| @fastify/static missing | Run `npm install @fastify/static` (needed for Swagger) |
| Frontend 404 on all pages | Delete root `app/` folder if both `app/` and `src/app/` exist |
| Frontend styles not loading | Check `globals.css` has `@import "tailwindcss";` |
| Frontend can't reach backend | Check `.env.local` has correct `NEXT_PUBLIC_API_URL` |
| Unicode chars in files | Use `cat > file << 'ENDOFFILE'` instead of `nano` paste |
| PM2 frontend not starting | `pm2 delete seo-frontend` then `pm2 start npm --name "seo-frontend" -- start -- -H 0.0.0.0` |

---

## 📞 Laravel → NestJS Reference

| Laravel | → | NestJS |
|---------|---|--------|
| Routes (web.php) | → | Controllers @Get, @Post |
| Controllers | → | Controllers (same!) |
| Services | → | Services (providers) |
| Middleware | → | Guards + Interceptors |
| Form Requests | → | DTOs + class-validator |
| Eloquent ORM | → | Prisma ORM |
| php artisan make: | → | nest generate |
| Blade templates | → | React (Next.js) |
| Sanctum | → | Passport.js + JWT |
| Horizon | → | BullMQ + Bull Board |
| Cache | → | Redis + CacheModule |
| Cashier | → | Stripe SDK |

---

## 🗒️ Key Technical Decisions Made

| Decision | What We Chose | Why |
|----------|--------------|-----|
| **HTTP Server** | Fastify (not Express) | 3x faster for API-heavy workloads |
| **ORM** | Prisma 7 (not TypeORM) | Better types, cleaner queries, auto migrations |
| **PostgreSQL** | v17 (not v18) | Battle-tested, all libraries compatible, v18 too new |
| **Node.js** | v24 LTS (not v20) | v20 expires April 2026, v24 supported until 2028 |
| **Redis** | v8 (latest) | Better performance, new features |
| **Docker** | Skipped for now | Direct install for learning, Docker later for production |
| **Prisma 7 adapter** | @prisma/adapter-pg | Prisma 7 requires adapter pattern, pg driver for PostgreSQL |
| **Process Manager** | PM2 | Industry standard, keeps server running 24/7, auto-restart on crash |
| **API Docs** | Swagger (NestJS built-in) | Interactive testing page, client can test without Postman |
| **Frontend** | Next.js 16 (App Router) | Latest React framework, file-based routing, SSR support |
| **CSS** | Tailwind CSS | Utility-first, fast styling, no custom CSS files needed |
| **HTTP Client** | Axios (with interceptors) | Auto-attaches JWT, auto-redirect on 401, better than fetch |
| **Token Storage** | Browser cookies (js-cookie) | Persists across page refreshes, auto-sent with requests |
| **Routing** | Next.js App Router | Folder-based routing like Laravel: /login folder = /login page |

---

*Last updated: February 25, 2026*
*Day 1: Infrastructure + Database (20+ tables) + Auth Module (register/login/JWT)*
*Day 2: Swagger + PM2 + Frontend (Next.js) + Login/Register/Dashboard pages*
*Full auth flow working end-to-end: Register → Login → Dashboard → Logout*
*Next step: Improve UI design → Users Module → Sites Module*
