# TinCeram Implementation TODO

This backlog is dependency ordered. Complete each phase and its verification before
starting the next phase.

## Phase 0 — Startup and foundations

- [x] Add `passlib[bcrypt]`, `bcrypt`, and `python-jose[cryptography]` to
  `backend/requirements.txt`.
- [x] Move password hashing/JWT primitives into `backend/app/core/security.py`.
- [ ] Verify `docker compose build backend` and `alembic upgrade head` against a clean
  PostgreSQL database.
- [ ] Replace development secrets/default admin credentials with required production
  environment validation.
- [ ] Add consistent API error, pagination, CORS, logging, and database transaction
  conventions.

## Phase 1 — Identity and access

- [ ] Add User, Address, refresh-token/revocation, password-reset-token, and role models
  plus Alembic migrations.
- [ ] Implement register, login, refresh, logout/revocation, password reset request/confirm,
  `/auth/me`, and `/users/me`.
- [ ] Implement authenticated address CRUD and admin user CRUD with role enforcement.
- [ ] Add authorization dependencies and tests for authentication, ownership, and admin
  boundaries.

## Phase 2 — Catalog management

- [ ] Add authenticated/admin CRUD for categories, including hierarchy validation and
  deletion safeguards.
- [ ] Add authenticated/admin product CRUD with validation, slug/SKU uniqueness, stock
  alerts, and cache invalidation.
- [ ] Add image upload, primary-image selection, ordering, and deletion with safe file/object
  storage cleanup.
- [ ] Add related-product management and admin APIs; retain the existing public catalog
  read APIs.

## Phase 3 — CMS and content

- [ ] Add ArticleCategory and Article models/migrations, drafts/publishing metadata, and
  author ownership.
- [ ] Implement public blog/category reads and author/admin article/category CRUD.
- [ ] Add markdown/rich-text sanitization, SEO fields, pagination, and publication tests.

## Phase 4 — Commerce workflows

- [ ] Implement authenticated/server-synced wishlist CRUD and guest-to-user merge behavior.
- [ ] Implement admin coupon CRUD, validation rules, usage accounting, and concurrency-safe
  redemption.
- [ ] Implement carousel CRUD with scheduling, ordering, image lifecycle, and public reads.
- [ ] Add authenticated customer order history/detail and admin order list/detail/status
  transitions with audit records.
- [ ] Make ZarinPal callbacks idempotent for success, cancellation, retries, and duplicate
  authorities; add callback signature/input hardening and integration tests.

## Phase 5 — Operations and communications

- [ ] Add analytics aggregation endpoints for revenue, orders, products, stock, and date
  ranges; expose chart-ready responses.
- [ ] Add settings CRUD with typed values, validation, and admin authorization.
- [ ] Add notifications CRUD/read-state APIs and delivery integration boundaries.
- [ ] Add append-only activity logs for admin/security/commerce mutations and an admin query
  endpoint.
- [ ] Add newsletter subscription/unsubscribe, duplicate handling, and consent metadata.
- [ ] Keep `/api/v1/health` dependency-aware (database/cache status) while preserving a
  fast liveness response.

## Phase 6 — Frontend routes and integration

- [ ] Add `/shop`, `/blog`, `/blog/[slug]`, `/faq`, `/terms`, and a custom `not-found.tsx`.
- [ ] Add `/order/success`, `/order/failure`, and `/order/tracking/[order_number]`.
- [ ] Add `/account` profile, addresses, orders, and wishlist views.
- [ ] Add `/admin/*` product, category, coupon, carousel, order, article, user, settings,
  and analytics views with protected sessions.
- [ ] Wire auth refresh, server wishlist, order history, payment result handling, and all
  admin CRUD forms to the API.
- [ ] Replace or redirect legacy `/track` and `/order/confirmation` flows where appropriate.

## Phase 7 — Quality and release

- [ ] Apply `DESIGN.md` consistently: Vazirmatn, design tokens, RTL/dark-mode contrast,
  icon-only controls without emoji, and 44px minimum touch targets.
- [ ] Add loading, empty, error, and inaccessible-state UX for every public/customer/admin
  surface.
- [ ] Run backend tests, type checks, lint/build, migration checks, and frontend lint/build
  against clean services.
- [ ] Perform an end-to-end checkout/payment, auth, CRUD, upload, and responsive browser
  audit.
