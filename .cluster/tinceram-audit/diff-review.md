# گزارش بازبینی انتقادی diff — تینرام (نوبت ۲)

- **ریپو:** `C:\Users\KC\Desktop\tincereamcopailot` — بازبینی فقط‌خواندنی؛ تنها فایلِ نوشته‌شده همین گزارش است.
- **اسنپ‌شات پایدار در شروع:** خروجی `git diff --stat` و `git status --porcelain` در ابتدای کار گرفته و بایگانی شد.
  - ۲۰ فایل تغییر یافته (+15 / −190)، ۳ فایل untracked جدید: `frontend/.env.example`، `frontend/src/app/error.tsx`، `frontend/src/app/global-error.tsx`
- **مهم (تطبیق بیف با واقعیت):** آیتم‌های بیف (lightbox تکراری، dark: در product-view/tabs/reviews/questions، store-api.ts، invalidateApiCache/_noCache/apiJson، admin-hooks، RelatedProducts، revalidate 30/60/60) در diff جاری **نیستند** — همگی قبلاً commit شده‌اند و در HEAD صحت‌سنجی شد (پایین را ببینید). diff جاری = pass حذف کد مرده + error boundaries جدید + دو فیکس کوچک.

## نتایج بیلد

| بررسی | نتیجه |
|---|---|
| `node node_modules/typescript/bin/tsc --noEmit` | **exit 0** — بدون خطا (TS 5.9.3، ۸۶۵ فایل بررسی‌شده با `--listFilesOnly`، پس خطای شبح نبود) |
| `npx next lint` | **exit 0** — ۰ error، ۸ هشدار (همه pre-existing: ۵× no-img-element، ۳× exhaustive-deps روی خطوط دست‌نخورده مثل use-loading.tsx:27 و csrf.ts:137) |

## صحت‌سنجی آیتم‌های بیف (در HEAD)

- `frontend/src/lib/store-api.ts` موجود ✓
- `api-client.ts`: `invalidateApiCache` (:72)، `_noCache` (:107،:120،:149)، `apiJson` (:160) ✓
- `admin-hooks.ts`: لود با `{ _noCache: true }` (:29) و `invalidateApiCache()` بعد از mutate (:54) ✓
- revalidate: home `60` (app/page.tsx:13)، shop `60` (shop/page.tsx:13)، product `30` (product/[slug]/page.tsx:9) ✓
- RelatedProducts در `admin/products/[id]` وصل است (:356 + تعریف :556) ✓
- dark: در product-view (۲۶)، product-tabs (۱۳)، product-reviews (۲۳)، product-questions (۲۴) ✓؛ lightbox در product-view دقیقاً **یک** بلوک است (state :69، open :156، render :335-418) — حذف بلوک تکراری تأیید ✓

## یافته‌ها

### Blocker

**ندارد** — tsc و lint هر دو سبز.

### Major

**M1 — `frontend/src/app/admin/users/page.tsx:68-75` + مودال :403-441 — «ذخیره» در مودال تنظیمات کاربر عملاً no-op است.**
`submit()` فقط `editing` را می‌خواند که هیچ‌گاه set نمی‌شود (`openEdit` حذف شده و در HEAD هم هیچ caller نداشت). تغییرات role/فعال‌سازی در مودال `showSettings` هیچ‌وقت PATCH نمی‌شود، مودال هم بسته نمی‌شود، فقط reload رخ می‌دهد.
*قابل ذکر: باگ pre-existing است (در HEAD هم همین بود)؛ ولی این pass پاک‌سازی دقیقاً همین فایل را دست زد و مسیر زندهٔ خراب را بی‌دفاع گذاشت.*
**اصلاح:** submit را به showSettings وصل کنید:
```ts
const submit = async () => {
  if (showSettings) {
    await mutate(`/admin/users/${showSettings.id}`, {
      method: "PATCH",
      body: JSON.stringify({ role: showSettings.role, is_active: showSettings.is_active }),
      successMessage: "وضعیت کاربر تغییر کرد.",
    });
    setShowSettings(null);
  }
  void reload();
};
```
و سپس stateهای مردهٔ `editing`/`creating` را کامل حذف کنید.

**M2 — `frontend/src/app/admin/users/page.tsx:110` و `:197` (بستر :39) — دکمه‌های «افزودن کاربر» هیچ کاری نمی‌کنند.**
هر دو دکمه `onClick={() => setCreating(true)}` دارند ولی diff مقدار state را انداخته (`const [, setCreating]`) و در کل فایل هیچ خواننده‌ای برای `creating` وجود ندارد (مودال ایجاد کاربر اصلاً وجود ندارد؛ در HEAD هم نبود — دکمه از قبل no-op بود).
**اصلاح:** یا مودال ایجاد کاربر ساخته و به `creating` وصل شود، یا دکمه‌ها موقتاً حذف/غیرفعال شوند تا UX گمراه‌کننده نماند.

### Minor

**m1 — `frontend/src/app/admin/users/page.tsx:39-40` — خرابی تورفتگی معرفی‌شده توسط خود diff.** خط ۳۹ با ۴ فاصله و خط ۴۰ با صفر فاصله. اصلاح: تورفتگی استاندارد ۲ فاصله و ترتیب منطقی declarations.

**m2 — `frontend/src/app/admin/dashboard/page.tsx:12` — ایمپورت خالی `import {  } from "@/lib/api";`** ته‌ماندهٔ برش `mediaUrl` است (دو فاصله داخل آکولاد هم نشانهٔ برش شتاب‌زده). در runtime بی‌خطر است (api.ts isomorphic است و از قبل در باندل کلاینت هست) ولی کد مرده است — کل خط حذف شود.

**m3 — `frontend/src/components/home/home-hero.tsx:65` — `const [isPaused] = useState(false);` ثابت همیشه-false است** و در :86 و :95 خوانده می‌شود. در HEAD هم `setIsPaused` هرگز صدا زده نمی‌شد، پس رفتار autoplay تغییر نکرده؛ ولی یا state را کامل حذف کنید، یا `onMouseEnter/onMouseLeave` را وصل کنید تا pause-on-hover واقعاً کار کند.

**m4 — `frontend/src/hooks/use-loading.tsx:47-48` — type `LoadingWithData` هنوز `loadingText?/errorText?` را می‌پذیرد** ولی کامپوننت دیگر destruct نمی‌کند (props بی‌اثر). حذف از type یا وصل‌کردن دوباره.

**m5 — `frontend/src/components/store/shop-filters.tsx:22,151,240,311` + `shop/page.tsx:52` — نیمه‌کاره بودن حذف `totalProducts`/`ShopFilters`.** `totalProducts` در `ShopFiltersProps` الزامی است و صفحه پاس می‌دهد ولی هیچ‌کدام از `ShopSidebar`/`ShopMobileFilters` آن را destruct نمی‌کنند؛ export `ShopFilters` (:311) بعد از حذف ایمپورت در shop/page.tsx دیگر هیچ consumer ندارد (export مرده). یکی: نمایش داده شود یا از interface/امضا/callers حذف شود.

**m6 — `frontend/src/app/global-error.tsx:2` — خطا log نمی‌شود.** برخلاف error.tsx که `console.error` دارد، prop `error` فقط type شده و استفاده نمی‌شود؛ در production ردِ خطا کاملاً گم می‌شود. افزودن `useEffect(() => { console.error(error); }, [error]);` و نمایش `error.digest` پیشنهاد می‌شود.

**m7 — `frontend/src/app/admin/users/page.tsx:51` — `if (statsData) setStats(statsData);` setState در بدنهٔ render** (anti-pattern؛ pre-existing و خارج از خطوط این diff). جایگزینی با `useEffect` توصیه می‌شود.

## موارد تاییدشدهٔ سالم (نگاه دشمنانه، بدون یافته)

- **بریدگی بلوک‌ها:** همهٔ حذف‌ها component/interface-level و تمیز هستند؛ هیچ ارجاع جامانده‌ای نیست (tsc روی ۸۶۵ فایل سبز). schema.ts: حذف `Image/Link/Star/WebPageSchema/OrganizationSchema` بدون رفرنس باقی‌مانده (`ProductImage` هنوز در :16 استفاده می‌شود)؛ account-panel: `cropperOpen` در HEAD هم بی‌referrer بود؛ async-component/csrf/use-skeleton/order-steps/empty-state/wishlist-empty-state/empty-cart-state/blog/shop همه تمیز.
- **`api-client.ts:19` — فیکس regex `([^;])` → `([^;]+)`:** درست و مؤثر (قبلاً refresh-token کوکی تک‌کاراکتر کپچر می‌شد و refresh عملاً شکست می‌خورد).
- **`api.ts:127` — `/reviews/latest?limit=${limit}`:** باگ واقعی را می‌بندد (قبلاً پارامتر نادیده گرفته می‌شد)؛ backend (`backend/app/api/v1/community.py:43`) با `Query(6, le=12)` آن را می‌پذیرد. تنها caller فعلی home با پیش‌فرض ۶ است. **نکتهٔ دفاعی:** برای limit>12 بک‌اند 422 می‌دهد و `get()` بی‌سروصدا null برمی‌گرداند — پیشنهاد: `Math.min(limit, 12)` clamp شود.
- **`middleware.ts`:** امضای بدون پارامتر معتبر است؛ بدنه فقط response را می‌سازد و به `request` ارجاع ندارد.
- **`error.tsx`:** ساختار صحیح (use client، props typed، log، reset).
- **`.env.example`:** فقط placeholder لوکال، بدون secret.
- **revalidate کاهش‌یافته (30/60/60):** مسدودکننده ندارد؛ تنها اثر، فشار fetch بیشتر به backend (مخصوصاً product با 30s) است که برای دادهٔ حساس به موجودی قابل قبول و هم‌راستا با `getWithFreshness(30)` است.
- هشدار git برای LF→CRLF روی api-client.ts صرفاً رفتار autocrlf است.

## جمع‌بندی

**بدون یافتهٔ مسدودکننده (Blocker).** بیلد سبز است (tsc: ۰ خطا / lint: exit 0). دو Major هر دو **pre-existing** و مختص فایل users هستند که در همین pass دست زده شده — توصیه می‌شود پیش از commit اصلاح شوند؛ ۷ Minor نیز فهرست شده‌اند.
