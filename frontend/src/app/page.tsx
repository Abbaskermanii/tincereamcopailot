import { api, type ProductListItem } from "@/lib/api";
import { ProductSection } from "@/components/store/product-section";
import { CategorySection } from "@/components/store/category-section";
import { ArticleSection } from "@/components/store/article-section";
import { FAQSection } from "@/components/store/faq-section";
import { NewsletterBand } from "@/components/store/newsletter-band";
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
          if (sec.kind === "newsletter") {
            return <NewsletterBand key={sec.id} />;
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

      <NewsletterBand />
    </div>
  );
}