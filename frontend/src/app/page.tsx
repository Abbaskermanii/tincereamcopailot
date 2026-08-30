import Link from "next/link";

import { api, type ProductListItem, mediaUrl } from "@/lib/api";
import { ProductSection } from "@/components/store/product-section";
import { CategorySection } from "@/components/store/category-section";
import { ArticleSection } from "@/components/store/article-section";
import { FAQSection } from "@/components/store/faq-section";
import { HomeCarousel } from "@/components/store/home-carousel";

export const revalidate = 120;

interface CategoryItem {
  id?: string;
  name: string;
  slug: string;
  image_url?: string | null;
  description?: string | null;
}

interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | undefined;
  published_at: string | undefined;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
}

export default async function HomePage() {
  // ابتدا فقط homepage را بگیر — اگر موفق بود، 5 درخواست fallback اصلاً زده نمی‌شود (کاهش 83% فشار)
  const homepageRes = await api.homepage();
  const sections = homepageRes?.sections ?? null;

  if (sections && sections.length > 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {sections.map((sec) => {
          if (sec.kind === "hero" && sec.slides && sec.slides.length > 0) {
            return (
              <div key={sec.id} className="py-6">
                <HomeCarousel slides={sec.slides.map((s: { id: string; title: string | null; subtitle: string | null; image_url: string; link_url: string | null }, idx: number) => ({ ...s, sort_order: idx, is_active: true }))} />
              </div>
            );
          }
          if (sec.kind === "products" && sec.products) {
            return <ProductSection key={sec.id} title={sec.title} subtitle={sec.subtitle ?? undefined} products={sec.products as ProductListItem[]} />;
          }
          if (sec.kind === "categories" && sec.categories) {
            return <CategorySection key={sec.id} title={sec.title} subtitle={sec.subtitle ?? undefined} categories={sec.categories as CategoryItem[]} limit={8} />;
          }
          if (sec.kind === "articles" && sec.articles) {
            return <ArticleSection key={sec.id} title={sec.title} articles={sec.articles as ArticleItem[]} limit={4} />;
          }
          if (sec.kind === "faq" && sec.faq) {
            return <FAQSection key={sec.id} title={sec.title} subtitle={sec.subtitle ?? undefined} faq_items={sec.faq as FaqItem[]} limit={5} />;
          }
          if (sec.kind === "brand_story") {
            const story = (sec as unknown as { story?: { title: string; subtitle: string | null; body: string; image_url: string | null } }).story;
            return (
              <section key={sec.id} className="py-14" aria-labelledby={`brand-${sec.id}`}>
                <div className="grid gap-8 overflow-hidden rounded-wobble bg-surface shadow-shelf md:grid-cols-2">
                  <div className="p-8 md:p-10">
                    <h2 id={`brand-${sec.id}`} className="text-2xl font-extrabold">{story?.title ?? sec.title}</h2>
                    {story?.subtitle && <p className="mt-2 text-sm font-medium text-firouzeh">{story.subtitle}</p>}
                    <p className="mt-4 leading-7 text-char-soft dark:text-ink-soft">{story?.body ?? "سفال تن‌سِرام با خاک رس طبیعی و لعاب لاجوردی، هر قطعه دست‌ساز و منحصر به‌فرد."}</p>
                    <Link href="/about" className="mt-6 inline-flex min-h-[44px] items-center rounded-xl bg-lajvard px-5 text-sm font-bold text-white hover:bg-lajvard-deep dark:bg-lajvard-soft dark:text-char">داستان ما</Link>
                  </div>
                  <div className="relative min-h-[280px] bg-slip">
                    {/* Decorative kiln palette block */}
                    <div className="absolute inset-0 bg-gradient-to-br from-lajvard/15 via-firouzeh/10 to-kiln-clay/15" />
                    <div className="absolute inset-0 flex items-center justify-center p-8">
                      <div className="kiln-reveal rounded-wobble bg-white/80 p-6 text-center shadow-lifted backdrop-blur dark:bg-black/20">
                        <p className="text-4xl">🏺</p>
                        <p className="mt-3 text-sm font-bold">ساخته‌شده با دست</p>
                        <p className="text-xs text-ink-soft">از خاک تا لعاب</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          }
          if (sec.kind === "testimonials" && (sec as unknown as { testimonials?: Array<{ id: string; author_name: string; rating: number; title: string; body: string }> }).testimonials) {
            const testimonials = (sec as unknown as { testimonials: Array<{ id: string; author_name: string; rating: number; title: string; body: string }> }).testimonials;
            if (testimonials.length === 0) return null;
            return (
              <section key={sec.id} className="py-14" aria-labelledby={`testi-${sec.id}`}>
                <h2 id={`testi-${sec.id}`} className="text-2xl font-extrabold">{sec.title}</h2>
                {sec.subtitle && <p className="mt-2 text-sm text-ink-soft">{sec.subtitle}</p>}
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {testimonials.slice(0, 6).map((t) => (
                    <div key={t.id} className="rounded-2xl bg-surface p-5 shadow-shelf dark:bg-black/25">
                      <div className="flex items-center gap-1 text-kiln-clay">
                        {"★".repeat(Math.max(1, Math.min(5, t.rating)))}
                      </div>
                      <p className="mt-2 font-bold">{t.title || `نظر ${t.author_name}`}</p>
                      <p className="mt-1 line-clamp-3 text-sm leading-6 text-char-soft dark:text-ink-soft">{t.body}</p>
                      <p className="mt-3 text-xs font-medium text-ink-soft">— {t.author_name}</p>
                    </div>
                  ))}
                </div>
              </section>
            );
          }
          if (sec.kind === "featured_category_spotlight" && sec.categories) {
            return (
              <section key={sec.id} className="py-14" aria-labelledby={`spot-${sec.id}`}>
                <h2 id={`spot-${sec.id}`} className="text-2xl font-extrabold">{sec.title}</h2>
                {sec.subtitle && <p className="mt-2 text-sm text-ink-soft">{sec.subtitle}</p>}
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {(sec.categories as CategoryItem[]).slice(0, 6).map((c) => (
                    <Link key={c.slug} href={`/category/${c.slug}`} className="group relative overflow-hidden rounded-wobble bg-lajvard p-6 text-white shadow-lifted hover:shadow-lifted dark:bg-lajvard-soft dark:text-char">
                      <div className="relative z-10">
                        <p className="text-lg font-extrabold">{c.name}</p>
                        <p className="mt-1 text-sm opacity-85">{c.description ?? `${(c as unknown as { product_count?: number }).product_count ?? ""} محصول`}</p>
                        <span className="mt-3 inline-flex text-xs font-bold opacity-90 group-hover:underline">دیدن مجموعه →</span>
                      </div>
                      {c.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mediaUrl(c.image_url)} alt={c.name} className="absolute inset-0 h-full w-full object-cover opacity-20 group-hover:opacity-30 transition-opacity" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-l from-black/40 to-transparent" />
                    </Link>
                  ))}
                </div>
              </section>
            );
          }
          return null;
        })}
      </div>
    );
  }

  // Fallback: فقط وقتی homepage در دسترس نیست — 4 درخواست موازی با حجم کمتر (16 به‌جای 50)
  const [fallbackProducts, fallbackCategories, fallbackArticles, fallbackFaq, fallbackCarousels] = await Promise.all([
    api.products({ page_size: 24 }),
    api.categories(),
    api.articles(),
    api.faq(),
    api.carousels(),
  ]);

  // Fallback data preparation (used only when homepage API unavailable)
  const fallbackAllProducts: ProductListItem[] = fallbackProducts?.items ?? [];
  const fallbackAllCategories: CategoryItem[] = (fallbackCategories ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    image_url: c.image_url,
    description: c.description,
  }));
  const fallbackAllArticles: ArticleItem[] = (fallbackArticles ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    excerpt: a.excerpt,
    published_at: a.published_at,
  }));
  const fallbackAllFaq: FaqItem[] = (fallbackFaq ?? []).map((f) => ({
    id: f.id,
    question: f.question,
    answer: f.answer,
    category: f.category,
    sort_order: f.sort_order,
    is_active: f.is_active,
  }));
  const fallbackSlides = (fallbackCarousels ?? []).filter((c) => c.is_active !== false);

  // Fallback rendering (legacy) — فقط وقتی homepage خالی است
  const featuredProducts = fallbackAllProducts.filter(
    (p) => (p.compare_at_price && p.compare_at_price > p.price) || p.stock_qty > 0
  ).slice(0, 8);
  const newArrivals = fallbackAllProducts
    .slice()
    .sort((a, b) => (b.slug ?? "").localeCompare(a.slug ?? ""))
    .slice(0, 8);
  const bestSellers = fallbackAllProducts.filter((p) => p.stock_qty > 0).slice(0, 8);
  const discountedProducts = fallbackAllProducts.filter(
    (p) => p.compare_at_price && p.compare_at_price > p.price
  ).slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6">
      {fallbackSlides.length > 0 && (
        <div className="py-6">
          <HomeCarousel slides={fallbackSlides.map((c) => ({
            id: c.id,
            title: c.title,
            subtitle: c.subtitle ?? null,
            image_url: c.image_url,
            link_url: c.link_url,
            sort_order: c.sort_order,
            is_active: c.is_active,
          }))} />
        </div>
      )}

      <ProductSection
        title="پیشنهادات ویژه"
        subtitle="بهترین انتخاب‌ها با قیمت استثنایی"
        products={featuredProducts}
      />
      <ProductSection
        title="جدیدترین محصولات"
        subtitle="تازه‌های کارگاه تن‌سِرام"
        products={newArrivals}
      />
      <ProductSection
        title="محبوب‌ترین‌ها"
        subtitle="پرفروش‌های ما در میان مشتریان"
        products={bestSellers}
      />
      {discountedProducts.length > 0 && (
        <ProductSection
          title="تخفیف‌های ویژه"
          subtitle="فرصت‌های محدود با قیمت‌های باورنکردنی"
          products={discountedProducts}
        />
      )}

      <CategorySection
        title="دسته‌بندی‌های محبوب"
        subtitle="محصولات ما در دسته‌بندی‌های متنوع"
        categories={fallbackAllCategories}
        limit={6}
      />

      <ArticleSection
        title="مقالات و اخبار"
        articles={fallbackAllArticles}
        limit={4}
      />

      <FAQSection
        title="سوالات رایج"
        subtitle="پاسخ‌های سریع به سوال‌های شما"
        faq_items={fallbackAllFaq}
        limit={4}
      />
    </div>
  );
}