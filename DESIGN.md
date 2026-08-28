# Design Plan — TinCeram (تن‌سِرام)

## Palette — drawn from the kiln, not from a template

| Name | Hex | Source |
|---|---|---|
| `lajvard` | `#31547A` | لعاب لاجوردی — deep cobalt glaze of Persian tilework; primary brand color |
| `firouzeh` | `#7A9E93` | فیروزه‌ای مات — matte turquoise glaze; secondary accent |
| `kiln-clay` | `#B0764F` | خاکِ کوره — raw clay before firing; warm tertiary accent, used sparingly |
| `slip` | `#EDEAE3` | شیرِ سفال — wet slip coating; the page background |
| `char` | `#26221F` | زغالیِ احیا — reduction-fired charcoal; all text/ink |
| `copper` | `#9C6B5E` | رگهٔ مسی — copper luster in reactive glazes; hover/highlight tone |

This deliberately avoids the default cream-plus-terracotta pairing: the background is a
cool plaster-slip grey-beige, and the anchor color is **deep cobalt blue** rooted in
Persian lajvardina glaze tradition rather than orange.

## Typography

- **Display + body:** Vazirmatn (variable, OFL) — the most complete open Persian face.
  - Headings: weight 800, tight line-height (1.15), used at 28–56px.
  - Body/UI: weight 400 at 16px, 1.8 line-height for comfortable RTL reading.
  - Captions/meta: 12–13px, weight 500.
- **Numerals & prices:** prices are rendered with `Intl.NumberFormat("fa-IR")`
  (Persian digits + ٬ grouping) followed by «تومان». Latin digits never appear in
  customer-facing copy except SKUs/order codes, which are set with
  `font-feature-settings: "tnum"` and LTR isolation (`dir="ltr"` spans) so they
  don't break RTL flow.

## Layout concept

The store reads like an exhibition shelf, not a dashboard. Generous whitespace,
oversized display type overlapping imagery, and a strict 4-column product rhythm
(2 on mobile). The home page alternates full-bleed sections with contained shelves;
the PDP is a two-column split — sticky gallery (60%) beside a calm info column.

```
HOME                                    PRODUCT PAGE
┌──────────────────────────────┐        ┌───────────────┬──────────────┐
│ nav: لوگو / جست‌وجو / سبد     │        │               │ نام محصول     │
├──────────────────────────────┤        │  گالری sticky  │ کد SKU       │
│ ┌────┐  سفال، با دستِ         │        │  [img+thumbs] │ قیمت تومان   │
│ │img │  ایرانی گرم می‌شود     │        │               │ فقط ۳ مانده! │
│ └────┘  [دیدن مجموعه‌ها]      │        │               │ [-] n [+]    │
├───────┬────────┬───────┬─────┤        │               │ [افزودن سبد] │
│ ماگ   │زیرسیگاری│ادویه‌دان│کوزه │        ├───────────────┴──────────────┤
├───────┴────────┴───────┴─────┤        │ جزئیات ▾ نگهداری ▾ ارسال ▾    │
│ ◄ تازه‌های کوره — carousel ►  │        ├──────────────────────────────┤
├──────────────────────────────┤        │ ممکن است بپسندید (strip)      │
│ داستان کارگاه (asymmetric)    │        └──────────────────────────────┘
├──────────────────────────────┤
│ خبرنامه — ۱۵٪ اولین خرید      │
└──────────────────────────────┘
```

## Signature element — «لبهٔ لعاب» (the Glaze Edge)

Every interactive surface carries a hand-thrown rim: an irregular, wobbly
border-radius (`255px 18px 225px 18px / 18px 225px 18px 255px`) like the uneven lip
of a wheel-thrown vessel. On hover/focus, a soft glaze sheen sweeps across the edge
(a masked gradient translating slowly, like wet glaze settling before firing).
The one orchestrated motion moment: page-load images reveal through a warm
"kiln-door" light sweep (amber → neutral), once, ~700ms, disabled under
`prefers-reduced-motion`. Everything else moves ≤200ms or not at all.

## Component library contract

All pages compose from `/src/components/ui`: Button (primary/secondary/ghost ×
sm/md/lg), Input, Textarea, Badge, PriceTag, QuantityStepper, ProductCard,
Skeleton, Toast, SectionHeading, GlazeEdge wrapper, Breadcrumbs, EmptyState.
No page may hand-roll its own button/card styles.
