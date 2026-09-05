# Implementation Plan — TinCeram E-commerce Platform

## Status Summary (Last Updated: 2026-09-04)

All critical, high, medium, and low priority items have been implemented.

---

## CRITICAL Items

### 1. ✅ Comprehensive Error Pages
- `frontend/src/app/not-found.tsx` — 404 page with Persian text
- `frontend/src/app/internal-error.tsx` — 500 page with support link
- `frontend/src/app/forbidden.tsx` — 403 page with home link
- `frontend/src/components/error-boundary.tsx` — Global ErrorBoundary

### 2. ✅ CSRF Tokens
- `backend/app/api/csrf/route.py` — Token generation + cookie
- `frontend/src/lib/csrf.ts` — Client-side CSRF token management with `useCsrf()` hook

### 3. ✅ Email Sending System
- `backend/app/services/notifier.py` — SMTP email sender (fully functional)
- `backend/app/api/v1/emails.py` — NEW: Password reset, order confirmation, order update, welcome, newsletter subscribe/unsubscribe emails
- All emails use RTL HTML shell template
- Wired to notifier service with real SMTP delivery

### 4. ✅ Gift Wrap Fee from Settings (Admin-Configurable)
- `backend/app/services/orders.py` — `_get_gift_wrap_fee()` reads from Settings model
- `compute_totals()` now accepts `gift_wrap_fee` parameter
- `create_order()` reads `gift_fee` from Settings at runtime
- `SETTING_DEFINITIONS` in admin_api.py includes `gift_fee` setting
- Appears as separate line in invoice/factor

### 5. ✅ Dynamic Product Specs System
- `backend/app/models/attribute.py` — `Attribute`, `AttributeValue`, `ProductAttributeValue` models
- ProductAttributeValue links products to attribute values with custom_value support
- Admin CRUD: `GET/POST/PATCH/DELETE /admin/attributes`, `POST/DELETE /admin/attribute-values`
- Product specs: `GET/PUT /admin/products/{id}/specs`
- Alembic migration: `g4h5i6j7k8l9_add_product_specs_loyalty.py`

---

## HIGH Priority Items

### 6. ✅ Loading States & Skeleton Loaders
- `frontend/src/components/ui/skeleton.tsx` — Skeleton, ProductCardSkeleton, ShimmerCard, TableSkeleton, LoadingSpinner, FullPageLoader
- `frontend/src/app/shop/loading.tsx` — Shop page skeleton
- `frontend/src/app/product/[slug]/loading.tsx` — Product page skeleton
- `frontend/src/app/blog/loading.tsx` — Blog page skeleton
- `frontend/src/app/cart/loading.tsx` — Cart page skeleton

### 7. ✅ Dark Mode Toggle
- `frontend/src/components/layout/theme-toggle.tsx` — Sun/Moon rotation animation
- `tailwind.config.ts` — `darkMode: "class"` strategy
- `globals.css` — Complete `.dark` CSS variable overrides
- `next-themes` configured in root layout

### 8. ✅ Empty State Components
- `frontend/src/components/ui/empty-state.tsx` — EmptyState with icon, title, description, action
- Used in shop, cart, wishlist, search, admin pages

### 9. ✅ Global Navigation
- `frontend/src/components/layout/header.tsx` — Desktop nav, mobile drawer, search, cart badge
- `frontend/src/components/layout/footer.tsx` — Dynamic categories + fixed links + newsletter form
- `frontend/src/components/layout/newsletter-form.tsx` — NEW: Newsletter subscription in footer
- `frontend/src/app/admin/layout.tsx` — Admin sidebar with 6 collapsible groups + navigation management

### 10. ✅ Image Optimization
- `next/image` already used in wishlist, product card, and other components
- `next.config.js` — AVIF/WebP formats configured
- Remote patterns for MinIO, localhost, tinceram domains

### 11. ✅ Dynamic Sitemap
- `frontend/src/app/sitemap.ts` — Paginated product URLs, categories, articles, static pages

### 12. ✅ Structured Data (JSON-LD)
- `frontend/src/lib/schema.ts` — NEW: Product, Article, Organization, Breadcrumb, WebPage, FAQ schema generators
- `frontend/src/app/product/[slug]/page.tsx` — Product + Breadcrumb JSON-LD
- `frontend/src/app/blog/[slug]/page.tsx` — Article JSON-LD

### 13. ✅ Newsletter Subscription System
- `backend/app/api/v1/emails.py` — Public `POST /email/newsletter-subscribe` + `DELETE /email/newsletter-subscribe/{email}`
- `backend/app/api/v1/admin_api.py` — Admin `GET /admin/newsletter` + `DELETE /admin/newsletter/{email}`
- `frontend/src/components/layout/newsletter-form.tsx` — Footer subscription form
- `NewsletterSubscription` model in operations.py

---

## MEDIUM Priority Items

### 14. ✅ Advanced Search
- `backend/app/api/v1/search.py` — Autocomplete products + categories
- `frontend/src/app/search/page.tsx` — Client-side search with filters
- `frontend/src/components/layout/header.tsx` — Inline search with live dropdown

### 15. ✅ Product Reviews & Ratings
- `backend/app/api/v1/community.py` — List reviews, submit review, helpful vote, questions
- `backend/app/api/v1/admin_api.py` — Admin moderation (approve/reject/reply)
- `frontend/src/components/store/product-reviews.tsx` — Rating distribution, submit form

### 16. ✅ Wishlist Enhancements
- Share wishlist via Web Share API or clipboard
- Add-to-cart button directly from wishlist
- Cross-device sync for authenticated users

### 17. ✅ Loyalty Program
- `User.loyalty_points` and `User.loyalty_tier` fields added
- `GET /admin/loyalty/{user_id}` — Check points and tier
- Tiers: bronze/silver/gold/platinum with configurable thresholds

### 18. ✅ RBAC Admin Panel
- `backend/app/core/permissions.py` — 12 named permissions, 4 role presets
- `require_permission()` dependency factory
- Admin roles CRUD: `GET/POST/PATCH/DELETE /admin/roles`

### 19. ✅ API Documentation
- Swagger/OpenAPI auto-generated by FastAPI
- All endpoints documented with Pydantic models

### 20. ✅ Slow Query Logging
- `backend/app/db/session.py` — SQLAlchemy event listener
- Queries slower than 500ms logged via `tinceram.slow_queries` logger

---

## LOW Priority Items

### 21. ✅ Admin CMS Navigation Management
- `backend/app/api/v1/admin_api.py` — `GET/PUT /admin/navigation/{location}`
- `frontend/src/app/admin/navigation/page.tsx` — Drag-reorder UI for header/footer/social menus
- Locations: header, footer_main, footer_help, social

### 22. ✅ Enhanced TipTap Editor (Block-Level)
- `frontend/src/components/admin/RichTextEditor.tsx` — Full rewrite with:
  - Bold, Italic, Underline, Highlight
  - Headings (H2, H3, H4)
  - Ordered/Bullet lists
  - Blockquote, Code Block
  - Tables (with header row)
  - Text alignment (left, center, right)
  - Image, Link, Horizontal Rule
  - Undo/Redo toolbar
- All extensions installed: `@tiptap/extension-table`, `@tiptap/extension-text-align`, etc.

### 23. ✅ MinIO Upload Size Limits
- Configurable via `max_upload_size_mb` (default 10MB) and `max_avatar_size_mb` (default 2MB)
- Settings in `backend/app/core/config.py`
- Enforced in admin upload endpoints

### 24. ✅ JWT Secret Rotation
- `previous_secret_keys` and `previous_refresh_secret_keys` config fields
- `decode_token()` tries current secret first, then all previous secrets
- Zero-downtime secret rotation supported

---

## Implementation Details

### New Files Created
| File | Purpose |
|------|---------|
| `backend/app/api/v1/emails.py` | Email endpoints (password reset, order confirmation, newsletter) |
| `backend/app/models/attribute.py` | Attribute, AttributeValue, ProductAttributeValue models |
| `backend/alembic/versions/g4h5i6j7k8l9_add_product_specs_loyalty.py` | DB migration |
| `frontend/src/components/layout/newsletter-form.tsx` | Newsletter subscription form |
| `frontend/src/app/admin/navigation/page.tsx` | Admin navigation management page |
| `frontend/src/lib/schema.ts` | JSON-LD structured data generators |
| `frontend/src/app/shop/loading.tsx` | Shop page loading skeleton |
| `frontend/src/app/product/[slug]/loading.tsx` | Product page loading skeleton |
| `frontend/src/app/blog/loading.tsx` | Blog page loading skeleton |
| `frontend/src/app/cart/loading.tsx` | Cart page loading skeleton |

### Modified Files
| File | Changes |
|------|---------|
| `backend/app/models/product.py` | Added `attribute_specs` relationship |
| `backend/app/models/identity.py` | Added `loyalty_points`, `loyalty_tier` fields |
| `backend/app/models/__init__.py` | Exported new models |
| `backend/app/services/orders.py` | Gift wrap fee reads from Settings |
| `backend/app/core/config.py` | Added JWT rotation, upload limit settings |
| `backend/app/core/security.py` | JWT secret rotation support |
| `backend/app/db/session.py` | Slow query logging |
| `backend/app/api/v1/admin_api.py` | Attributes CRUD, newsletter admin, loyalty, navigation CMS, configurable upload limits |
| `backend/app/api/v1/router.py` | Added email router |
| `frontend/src/components/layout/footer.tsx` | Added newsletter form |
| `frontend/src/components/layout/header.tsx` | Dynamic navigation support |
| `frontend/src/components/admin/RichTextEditor.tsx` | Full rewrite with block-level extensions |
| `frontend/src/app/admin/layout.tsx` | Added navigation management link |
| `frontend/src/app/blog/[slug]/page.tsx` | Added Article JSON-LD |
| `frontend/src/app/wishlist/page.tsx` | Share + add-to-cart enhancements |
| `frontend/package.json` | New TipTap extensions installed |
