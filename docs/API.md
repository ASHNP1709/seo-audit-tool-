# 📡 API Reference — docs/API.md

Complete API endpoint reference for the SEO Audit Tool. All endpoints, request/response formats, and authentication requirements.

**Base URL:** `http://localhost:4000/api`
**Swagger Docs:** `http://localhost:4000/api/docs`

---

## Table of Contents

- [Authentication](#authentication)
- [Auth Endpoints](#auth-endpoints)
- [Sites Endpoints](#sites-endpoints)
- [Audits Endpoints](#audits-endpoints)
- [Error Responses](#error-responses)

---

## Authentication

All protected endpoints require a valid JWT token sent via httpOnly cookie.

**How it works:**
1. Call `/api/auth/login` or `/api/auth/register`
2. Backend sets `access_token` cookie automatically
3. Include `credentials: 'include'` in all subsequent requests
4. Cookie is sent automatically by the browser

**Token lifecycle:**
- Access token: 15 minutes
- Refresh token: 7 days

**Unauthorized response (401):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## Auth Endpoints

### POST `/api/auth/register`

Create a new user account.

**Auth required:** No

**Request body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Validation rules:**
- `name` — Required, string
- `email` — Required, valid email format, must be unique
- `password` — Required, minimum 8 characters

**Success response (201):**
```json
{
  "message": "Registration successful",
  "user": {
    "id": "uuid-here",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```
*Also sets `access_token` and `refresh_token` cookies*

**Error response (409 — email exists):**
```json
{
  "statusCode": 409,
  "message": "Email already registered"
}
```

---

### POST `/api/auth/login`

Authenticate an existing user.

**Auth required:** No

**Request body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Success response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid-here",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```
*Also sets `access_token` and `refresh_token` cookies*

**Error response (401):**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

---

### POST `/api/auth/refresh`

Refresh an expired access token using the refresh token.

**Auth required:** No (uses refresh_token cookie)

**Request body:** None (refresh token is in cookie)

**Success response (200):**
```json
{
  "message": "Token refreshed"
}
```
*Sets new `access_token` cookie*

**Error response (401):**
```json
{
  "statusCode": 401,
  "message": "Invalid refresh token"
}
```

---

### GET `/api/auth/me`

Get the current authenticated user's profile.

**Auth required:** Yes

**Success response (200):**
```json
{
  "id": "uuid-here",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2026-02-24T10:00:00.000Z"
}
```

---

### POST `/api/auth/logout`

Clear authentication cookies.

**Auth required:** Yes

**Success response (200):**
```json
{
  "message": "Logged out successfully"
}
```
*Clears `access_token` and `refresh_token` cookies*

---

## Sites Endpoints

All sites endpoints require authentication. Users can only access their own sites.

### POST `/api/sites`

Add a new website to monitor.

**Auth required:** Yes

**Request body:**
```json
{
  "name": "My Business Website",
  "url": "https://example.com"
}
```

**Validation rules:**
- `name` — Required, string
- `url` — Required, valid URL (must start with http:// or https://)

**Success response (201):**
```json
{
  "id": "site-uuid",
  "name": "My Business Website",
  "url": "https://example.com",
  "userId": "user-uuid",
  "createdAt": "2026-02-26T10:00:00.000Z",
  "updatedAt": "2026-02-26T10:00:00.000Z"
}
```

---

### GET `/api/sites`

List all websites belonging to the authenticated user.

**Auth required:** Yes

**Success response (200):**
```json
[
  {
    "id": "site-uuid-1",
    "name": "My Business Website",
    "url": "https://example.com",
    "userId": "user-uuid",
    "createdAt": "2026-02-26T10:00:00.000Z",
    "updatedAt": "2026-02-26T10:00:00.000Z",
    "_count": {
      "audits": 3
    }
  },
  {
    "id": "site-uuid-2",
    "name": "Blog",
    "url": "https://blog.example.com",
    "userId": "user-uuid",
    "createdAt": "2026-02-26T11:00:00.000Z",
    "updatedAt": "2026-02-26T11:00:00.000Z",
    "_count": {
      "audits": 0
    }
  }
]
```

---

### GET `/api/sites/:id`

Get a single site's details.

**Auth required:** Yes

**Success response (200):**
```json
{
  "id": "site-uuid",
  "name": "My Business Website",
  "url": "https://example.com",
  "userId": "user-uuid",
  "createdAt": "2026-02-26T10:00:00.000Z",
  "updatedAt": "2026-02-26T10:00:00.000Z"
}
```

**Error response (404 — not found or not owned):**
```json
{
  "statusCode": 404,
  "message": "Site not found"
}
```

---

### PATCH `/api/sites/:id`

Update a website's name or URL.

**Auth required:** Yes

**Request body (all fields optional):**
```json
{
  "name": "Updated Name",
  "url": "https://new-url.com"
}
```

**Success response (200):**
```json
{
  "id": "site-uuid",
  "name": "Updated Name",
  "url": "https://new-url.com",
  "userId": "user-uuid",
  "createdAt": "2026-02-26T10:00:00.000Z",
  "updatedAt": "2026-02-26T12:00:00.000Z"
}
```

---

### DELETE `/api/sites/:id`

Delete a website and all its associated audits, crawled pages, and issues.

**Auth required:** Yes

**Success response (200):**
```json
{
  "message": "Site deleted successfully"
}
```

**Cascade effect:** Deleting a site removes ALL associated audits, crawled pages, and audit issues.

---

## Audits Endpoints

All audits endpoints require authentication.

### POST `/api/audits`

Start a new SEO audit for a website.

**Auth required:** Yes

**Request body:**
```json
{
  "siteId": "site-uuid",
  "maxPages": 10
}
```

**Validation rules:**
- `siteId` — Required, must be a valid site ID owned by the user
- `maxPages` — Optional, number between 1-500, default: 5

**Success response (201):**
```json
{
  "id": "audit-uuid",
  "siteId": "site-uuid",
  "status": "COMPLETED",
  "overallScore": 93.5,
  "technicalScore": 95.0,
  "contentScore": 90.2,
  "speedScore": 96.0,
  "totalPages": 10,
  "totalIssues": 7,
  "maxPages": 10,
  "duration": 8500,
  "createdAt": "2026-02-26T10:00:00.000Z",
  "updatedAt": "2026-02-26T10:00:08.500Z"
}
```

**Note:** This endpoint is synchronous — it waits until the audit completes before responding. Duration depends on `maxPages` and target site speed (typically 2-30 seconds).

**Error response (404 — site not found):**
```json
{
  "statusCode": 404,
  "message": "Site not found"
}
```

---

### GET `/api/audits/site/:siteId`

Get all audits for a specific site.

**Auth required:** Yes

**Success response (200):**
```json
[
  {
    "id": "audit-uuid-1",
    "siteId": "site-uuid",
    "status": "COMPLETED",
    "overallScore": 93.5,
    "technicalScore": 95.0,
    "contentScore": 90.2,
    "speedScore": 96.0,
    "totalPages": 10,
    "totalIssues": 7,
    "maxPages": 10,
    "duration": 8500,
    "createdAt": "2026-02-26T10:00:00.000Z"
  },
  {
    "id": "audit-uuid-2",
    "siteId": "site-uuid",
    "status": "COMPLETED",
    "overallScore": 87.2,
    "technicalScore": 88.0,
    "contentScore": 85.5,
    "speedScore": 89.0,
    "totalPages": 5,
    "totalIssues": 12,
    "maxPages": 5,
    "duration": 3200,
    "createdAt": "2026-02-25T15:00:00.000Z"
  }
]
```

**Sorted by:** `createdAt` descending (newest first)

---

### GET `/api/audits/:id`

Get a single audit with full details including all crawled pages and issues.

**Auth required:** Yes

**Success response (200):**
```json
{
  "id": "audit-uuid",
  "siteId": "site-uuid",
  "status": "COMPLETED",
  "overallScore": 93.5,
  "technicalScore": 95.0,
  "contentScore": 90.2,
  "speedScore": 96.0,
  "totalPages": 5,
  "totalIssues": 5,
  "maxPages": 5,
  "duration": 3200,
  "createdAt": "2026-02-26T10:00:00.000Z",
  "updatedAt": "2026-02-26T10:00:03.200Z",
  "crawledPages": [
    {
      "id": "page-uuid-1",
      "url": "https://example.com/",
      "statusCode": 200,
      "loadTime": 478,
      "contentLength": 45230,
      "title": "Example - Home",
      "wordCount": 4168,
      "imagesCount": 12,
      "missingAlt": 0,
      "linksCount": 45
    },
    {
      "id": "page-uuid-2",
      "url": "https://example.com/about",
      "statusCode": 200,
      "loadTime": 781,
      "contentLength": 38100,
      "title": "About Us - Example",
      "wordCount": 3200,
      "imagesCount": 8,
      "missingAlt": 2,
      "linksCount": 32
    }
  ],
  "issues": [
    {
      "id": "issue-uuid-1",
      "pageUrl": "https://example.com/about",
      "checkName": "title_tag",
      "severity": "HIGH",
      "category": "Content",
      "message": "Title tag is too long (78 characters). Recommended: 50-60 characters.",
      "recommendation": "Shorten the title tag to 50-60 characters for optimal display in search results.",
      "details": {
        "currentLength": 78,
        "title": "About Us - Example Company - Full Service Digital Marketing Agency"
      }
    },
    {
      "id": "issue-uuid-2",
      "pageUrl": "https://example.com/about",
      "checkName": "image_alt",
      "severity": "MEDIUM",
      "category": "Content",
      "message": "2 images are missing alt text.",
      "recommendation": "Add descriptive alt text to all images for better accessibility and SEO.",
      "details": {
        "totalImages": 8,
        "missingAlt": 2
      }
    }
  ]
}
```

---

## Error Responses

### Standard Error Format

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

### Common Status Codes

| Code | Meaning | When |
|---|---|---|
| 400 | Bad Request | Validation failed (missing/invalid fields) |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Valid token but no permission (not owner) |
| 404 | Not Found | Resource doesn't exist or not owned by user |
| 409 | Conflict | Duplicate (e.g., email already registered) |
| 500 | Internal Error | Server-side error (check logs) |

### Validation Error Example (400)

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request"
}
```

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}' \
  -c cookies.txt
```

### Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt
```

### Add Site
```bash
curl -X POST http://localhost:4000/api/sites \
  -H "Content-Type: application/json" \
  -d '{"name":"My Site","url":"https://example.com"}' \
  -b cookies.txt
```

### List Sites
```bash
curl http://localhost:4000/api/sites -b cookies.txt
```

### Run Audit
```bash
curl -X POST http://localhost:4000/api/audits \
  -H "Content-Type: application/json" \
  -d '{"siteId":"SITE_UUID_HERE","maxPages":5}' \
  -b cookies.txt
```

### Get Audit Report
```bash
curl http://localhost:4000/api/audits/AUDIT_UUID_HERE -b cookies.txt
```

---

*See also: [BACKEND.md](BACKEND.md) for server architecture, [FRONTEND.md](FRONTEND.md) for UI details*
