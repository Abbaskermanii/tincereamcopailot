# PROJECT_AUDIT.md

## Executive Summary

The TinCeram project is a Persian (fa-IR) RTL e-commerce platform for handmade ceramics with a FastAPI + SQLModel backend and Next.js 14 App Router frontend. The project has been scaffolded through 8 phases with significant progress but **several phases are marked complete while actually incomplete or requiring significant improvement**.

**Current State**: ~70% feature complete for a production e-commerce platform
**Critical Gap**: Frontend runs in Docker (violates architecture rule), authentication system missing, admin dashboard incomplete (SQLAdmin only), no user accounts, no article/blog system, no customer dashboard.

---

## Architecture Overview

### Backend (FastAPI + SQLModel)
- **Location**: `/backend`
- **Stack**: FastAPI, SQLModel/SQLAlchemy 2.0, PostgreSQL 16, Redis 7, Alembic
- **API**: RESTful at `/api/v1` with OpenAPI docs
- **Auth**: SQLAdmin only (basic auth via env vars)
- **Payment**: ZarinPal integration (sandbox/production toggle)
- **Tests**: 70 tests, 91% coverage (pytest + httpx)

### Frontend (Next.js 14 App Router)
- **Location**: `/frontend`
- **Stack**: Next.js 14, TypeScript, Tailwind CSS, next-themes, Framer Motion, Radix UI primitives
- **Language**: Persian (fa-IR), RTL layout
- **State**: React Context + localStorage (cart, wishlist, recently viewed)
- **Font**: Vazirmatn (Google Fonts)

### Infrastructure (Docker Compose)
- **Services**: PostgreSQL (main + test), Redis, Backend, Frontend
- **Issue**: Frontend runs in Docker (violates rule: frontend must run outside Docker)

---

## Data Flow Status

| Flow | Status |
|------|--------|
| Admin → Database | ✅ SQLAdmin works |
| Database → Backend API | ✅ Full CRUD |
| Backend API → Frontend | ✅ Working (products, categories, orders, coupons, feeds) |
| Frontend → User | ✅ SSR/ISR pages work |
| **User Auth → Backend** | ❌ **Missing** |
| **User Dashboard → Backend** | ❌ **Missing** |
| **Article/Blog → Frontend** | ❌ **Missing** |

---

## Key Technical Debt

1. **Frontend in Docker** - Must be extracted to run natively
2. **No User Authentication** - No register, login, password reset, sessions
3. **No User Model** - Database has no User table
4. **Cart/Wishlist in localStorage only** - Not synced to backend
4. **SQLAdmin only** - No custom admin dashboard
5. **No Article/Blog System** - Models, API, and UI missing
6. **No Customer Dashboard** - Orders, addresses, wishlist, profile missing
7. **No Search Index** - Search uses ILIKE (slow at scale)
8. **No Image Upload** - Product images are static SVGs only
9. **No Rate Limiting** on sensitive endpoints
10. **No Email/Password Reset Flow** - ZarinPal callback works but no user notifications
11. **Shipping Hardcoded** - 55,000 IRT fixed
12. **No Order Timeline UI** - Backend has statuses but no frontend timeline
13. **SEO**: Missing article structured data, no FAQ schema
14. **Dark Mode**: Basic implementation, needs audit
15. **Accessibility**: Basic but needs thorough audit
16. **Load Testing**: Not performed
17. **Security Audit**: Not performed
18. **Frontend Tests**: None (only backend tests)

---

## Fake/Mock Data Sources

| Location | Type | Status |
|----------|------|--------|
| `/frontend/src/app/page.tsx:11-16` | Hardcoded CATEGORY_TILES | **Hardcoded** - should come from API |
| `/frontend/public/products/*.svg` | 72 static SVGs | **Placeholders only** - no upload/management |
| `localStorage` cart/wishlist/recent | Client-only | Not synced to backend |
| `checkout/page.tsx:15-16` | Hardcoded SHIPPING/GIFT_FEE | Should be from settings API |

---

## Security Issues

| Issue | Severity |
|-------|----------|
| No rate limiting on auth/order endpoints | High |
| Admin auth: basic username/password in env | Medium |
| No CSRF protection on forms | Medium |
| No password hashing (no users yet) | N/A |
| No CSP headers configured | Medium |
| ZarinPal merchant_id in env (ok) | Low |
| Admin session: cookie-based, no 2FA | Medium |
| No audit logging for admin actions | Medium |
| No brute force protection | High |

---

## Performance Observations

- Redis caching on product lists (60s TTL)
- GZip compression enabled
- ISR on product/category pages (60-120s)
- Next/Image with priority on hero, lazy otherwise
- SQLModel relationships may cause N+1 in some endpoints
- No database connection pooling tuning
- No CDN configuration
- Bundle size not analyzed

---

## Test Coverage

- **Backend**: 70 tests, 91% coverage ✅
- **Frontend**: 0 tests ❌
- **E2E**: None ❌
- **Load testing**: Not done ❌

---

## Phase-by-Phase Quick Assessment

| Phase | Claimed | Actual | Status |
|-------|---------|--------|--------|
| 0: Scaffold | ✅ | Docker config works, but frontend in Docker | Needs Improvement |
| 1: Data Layer | ✅ | Models + migrations + seed work | Complete |
| 2: API Endpoints | ✅ | Core endpoints work | Complete |
| 3: Backend Tests | ✅ | 70 tests, 91% coverage | Complete |
| 4: Design System | ✅ | Components exist, dark mode basic | Needs Improvement |
| 5: Storefront Pages | ✅ | Pages exist, SEO good | Needs Improvement |
| 6: Wow Features | ✅ | Features exist but client-only | Needs Improvement |
| 7: Performance | ✅ | Basic caching/compression | Needs Improvement |
| 8: Final QA | ✅ | Smoke tests pass | Incomplete |

---

## Critical Path to Production

1. **Extract frontend from Docker** (architecture rule)
2. **Add User authentication system** (model, API, frontend)
2. **Build custom admin dashboard** (replace SQLAdmin)
3. **Create Article/Blog system**
4. **Build Customer Dashboard** (orders, profile, addresses)
5. **Sync cart/wishlist to backend** (authenticated users)
6. **Add image upload/management**
7. **Complete admin dashboard** (analytics, customers, orders, content)
8. **SEO audit & structured data completion**
9. **Dark mode audit & polish**
10. **Frontend testing + E2E**
11. **Load testing & security audit**
11. **Dark mode audit & final UI/UX polish**