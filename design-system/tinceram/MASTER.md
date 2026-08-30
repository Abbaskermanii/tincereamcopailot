# Design System Master — TinCeram (تن‌سرام)

> **LOGIC:** When building a specific page, first check `design-system/tinceram/pages/[page].md`.
> If that file exists, its rules **override** this Master. Otherwise, follow below.
> Auto-generated Liquid Glass baseline was evaluated and **rejected** — kiln palette (DESIGN.md) is retained.

**Project:** TinCeram — دست‌ساز Persian ceramics e-commerce
**Generated:** 2026-08-30
**Stack:** Next.js 14 + Tailwind, Vazirmatn, RTL (`dir="rtl"`)
**Pattern:** Editorial Exhibition Shelf (4-col grid, 2 on mobile) + Feature-Rich Showcase for marketing

---

## Global Rules — Kiln Palette (source: DESIGN.md:3)

| Name | Hex | CSS var | Role |
|---|---|---|---|
| `lajvard` | `#31547A` | `--lajvard` / `--brand` | Primary — لعاب لاجوردی cobalt glaze |
| `lajvard-deep` | `#26415F` | `--lajvard-deep` | Hover |
| `lajvard-soft` | `#8FB2D9` | `--brand` (dark) | Dark-mode brand |
| `firouzeh` | `#7A9E93` | `--firouzeh` / `--accent` | Secondary accent |
| `firouzeh-soft` | `#93B8AC` | `--accent` (dark) | Dark accent |
| `kiln-clay` | `#B0764F` | `--kiln-clay` / `--warm` | Tertiary warm, sparingly |
| `kiln-clay-soft` | `#CF9270` | `--warm` (dark) | Dark warm |
| `slip` | `#EDEAE3` | `--slip` / `--bg` | Page background — شیر سفال |
| `slip-raised` | `#F6F4EF` | `--surface` (light) | Cards/surfaces |
| `surface` (dark) | `#262320` | `--surface` (dark) | Cards in dark mode |
| `char` | `#26221F` | `--char` / `--ink` | Text ink |
| `char-soft` | `#57514B` | `--ink-soft` | Muted text |
| `copper` | `#9C6B5E` | `--copper` | Hover highlight |

Tailwind mapping added 2026-08-30: `tailwind.config.ts:8` now exposes `surface`, `bg`, `ink`, `brand`, `accent`, `warm` as `var(--*)` so `bg-surface` is token-aware (no `dark:bg-black/25` needed).

**Contrast notes:** Keep body ≥4.5:1. Success badge `product-card.tsx:39` uses `bg-firouzeh/20 text-[#3f5f56]` — verified 5.2:1 on light; in dark use `dark:text-firouzeh-soft` and check. Avoid `text-char-soft/60` for body.

### Typography

- **Display + body:** Vazirmatn (variable, OFL) — `layout.tsx:13` `subsets:["arabic"]`
  - Headings: 800, 1.15, 28–56px
  - Body/UI: 400 at 16px, 1.8 for RTL
  - Captions: 12–13px, 500
- **Prices:** `Intl.NumberFormat("fa-IR")` + «تومان», Persian digits; SKUs LTR isolated `dir="ltr"` + `font-feature:"tnum"` (`globals.css:136`)
- **Auto suggestion rejected:** Cormorant/Montserrat is Latin-focused; Vazirmatn is correct for Persian.

### Signature — «لبهٔ لعاب» Glaze Edge

Wobbly radius `255px 18px 225px 18px / 18px 225px 18px 255px` (`globals.css:71`), settling sheen on `:hover/:focus-visible/.is-active` (`globals.css:99`), 700ms. Images use `kiln-reveal` sweep 900ms once (`globals.css:122`), disabled under `prefers-reduced-motion` (`globals.css:54,130`). All other motion ≤200ms.

### Spacing & Shadows

Use 4/8dp rhythm: `--space-xs 4` / `sm 8` / `md 16` / `lg 24` / `xl 32` / `2xl 48` / `3xl 64`. Shadows: `shadow-shelf` and `shadow-lifted` from `tailwind.config.ts:23`.

---

## Component Specs (mirrors /src/components/ui)

- **Button** (`button.tsx:14`): `primary` bg-lajvard, `secondary` transparent border, `ghost`, `danger` clay. Sizes `sm h-9`, `md h-11`, `lg h-14` (fixed from invalid h-13). `glaze-edge`, `transition-colors 200ms`, `disabled:opacity-40`.
- **Input:** `h-11` (44px touch target) `rounded-xl border-char/15 bg-surface`.
- **Badge:** tones `brand`/`warm`/`muted`/`success`.
- **QuantityStepper** (`quantity-stepper.tsx:16`): `gap-2`, buttons `h-11 min-h-[44px] min-w-[44px]` (fixed from h-9), `aria-live="polite"`.
- **ProductCard:** `glaze-edge bg-surface` (token-aware), `bg-slip dark:bg-surface` placeholder.

---

## Style Guidelines

**Style:** Minimalism & Swiss (grid) + Editorial Luxury (kiln editorial) — not Vibrant Block. Clean, spacious, geometric, grid-based.

**Key Effects:** Generous whitespace, oversized display type overlapping imagery, strict 4-col product rhythm, subtle hover `transition-shadow` + `scale-[1.04]`.

**Pattern Sections (Home `page.tsx:86`):** Carousel → ProductSection ×4 → CategorySection → ArticleSection → FAQ → NewsletterBand. PDP (`product/[slug]/page.tsx:216`): `grid lg:grid-cols-[1.2fr_1fr]` with `lg:sticky lg:top-28` gallery + info column + Related/Reviews/Questions.

**Anti-patterns:** Vibrant green/orange palette, flat without depth, playful colors, text-heavy pages, emojis as icons, low contrast, layout-shifting hovers, missing focus states.

---

## Accessibility Fixes Applied 2026-08-30

1. `button.tsx:27` `h-13` → `h-14`
2. `globals.css:36` `scroll-padding-top:6rem / bottom:5rem` for sticky header + sticky buy bar (WCAG Focus Not Obscured)
3. Touch targets ≥44px: header icons/search `header.tsx:99,161,175,188,208`, gallery nav `product-gallery.tsx:84`, stepper `quantity-stepper.tsx:18`, cart delete `cart/page.tsx:59`
4. Dark surfaces normalized via `tailwind.config.ts:8` semantic tokens + removal of `dark:bg-black/25` overrides
5. `product-gallery.tsx:1` now uses `Radix Dialog` single lightbox with focus trap + close button (X) + `aria-label`, deduplicated duplicated dialogs
6. Variant image now only overrides active slide (`getSlideSrc`) — previously duplicated across all slides
7. Thumbs row `overflow-x-auto no-scrollbar` with `shrink-0` + focus ring
8. Icons `aria-hidden="true"` on decorative lucide icons, `aria-live` atomic on stepper, `aria-label` on gallery nav

---

## Pre-Delivery Checklist

- [ ] No emojis as icons (use lucide/Phosphor vector)
- [ ] All icons one family, `aria-hidden` where decorative
- [ ] Touch targets ≥44px, gap ≥8px
- [ ] Text contrast 4.5:1 light & dark (test both themes)
- [ ] Focus states visible, not clipped, not obscured by sticky UI
- [ ] `prefers-reduced-motion` respected (kiln sweep disabled)
- [ ] Responsive 375px, 768px, 1024px, 1440px, landscape
- [ ] `scroll-padding` prevents sticky cover
- [ ] Dark/light themes tested independently, tokens not hard-coded
