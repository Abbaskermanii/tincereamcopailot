# TinCeram Full Audit and Implementation Plan

## Audit snapshot — 2026-08-28

### Current stack

- Backend: FastAPI, SQLModel/SQLAlchemy, Alembic, PostgreSQL, Redis, SQLAdmin.
- Frontend: Next.js 14 App Router, React 18, Tailwind CSS, Recharts.
- Existing backend migration: one initial schema migration covering categories, products,
  product images, coupons, orders, and order items.
- Existing backend tests cover catalog reads, order creation/stock reservation, payments,
  feeds, concurrency, and model math.

### Startup findings

1. `backend/requirements.txt` did not install `bcrypt`, Passlib's bcrypt extra, or
   `python-jose[cryptography]`; any authentication import using those packages would fail.
2. There was no `app/core/security.py` and no user/auth model layer to own password hashing.
3. The new security module is intentionally independent of SQLModel models and exposes
   bcrypt hashing plus typed access/refresh JWT helpers.
4. Docker runs Alembic and seed scripts before Uvicorn, so migration validation must be done
   with the database service healthy and the settings loaded from the compose environment.

### Backend coverage

Implemented today:

- Public category tree/detail and product list/detail/image reads.
- Order creation with stock reservation, coupon application, and ZarinPal request.
- Order status lookup.
- ZarinPal callback verification with cancellation/restock behavior.
- Coupon validation, feeds, search, basic admin stats, and liveness health endpoint.
- SQLAdmin panel protected by development HTTP Basic credentials.

Missing or incomplete:

- All identity, user, address, role, token, reset, and ownership APIs.
- Admin CRUD for existing catalog, coupon, order, and carousel resources.
- Product image upload/deletion, related products, and stock alert workflows.
- Article CMS models, APIs, permissions, and public blog reads.
- Server wishlist, carousel, order management, settings, notifications, activity log,
  newsletter, and operational health checks.
- Idempotency and complete retry semantics for payment callbacks.

### Frontend coverage

Implemented today:

- `/`, `/about`, `/contact`, `/cart`, `/checkout`, `/wishlist`.
- `/category/[slug]`, `/product/[slug]`, `/order/confirmation`, `/track`.
- `/admin-analytics`, policy/offline/style-guide pages.

Missing or incomplete:

- `/shop`, `/blog`, `/blog/[slug]`, `/faq`, `/terms`, custom 404.
- Payment success/failure/tracking route structure requested by the product scope.
- Customer `/account` and its profile/address/order/wishlist sections.
- Protected `/admin/*` CRUD pages for all requested resources.
- Auth/session integration and server-backed wishlist/order/account data.

## Dependency-ordered execution plan

1. **Foundations:** install/runtime validation, environment hardening, shared auth/error
   dependencies, and migration/test infrastructure.
2. **Identity:** user and security schema, token lifecycle, password reset, authorization,
   and account/address APIs.
3. **Catalog admin:** category/product/image/related/stock management and cache consistency.
4. **CMS:** article categories/articles, author permissions, sanitization, publishing, and
   public blog pages.
5. **Commerce:** wishlist, coupon/carousel management, customer/admin orders, and robust
   payment idempotency.
6. **Operations:** analytics, settings, notifications, activity log, newsletter, and health.
7. **Frontend:** public gaps, payment result routes, account, and protected admin surfaces.
8. **Quality/release:** DESIGN.md compliance, accessibility/responsive review, full tests,
   clean Docker/Alembic run, and end-to-end checkout verification.

The actionable checklist is maintained in [TODO.md](./TODO.md).
