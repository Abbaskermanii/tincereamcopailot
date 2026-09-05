import { api } from "@/lib/api";
import { HomeHero } from "@/components/home/home-hero";
import { FeaturedProducts } from "@/components/home/featured-products";
import { CategoryShowcase } from "@/components/home/category-showcase";
import { ArticlesSection } from "@/components/home/articles-section";
import { FaqSection } from "@/components/home/faq-section";
import { TrustSection } from "@/components/home/trust-section";
import { HomeCta } from "@/components/home/home-cta";
import { CraftProcess } from "@/components/home/craft-process";
import { WorkshopStory } from "@/components/home/workshop-story";

export const revalidate = 120;

interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number | null;
  short_description?: string | null;
  stock_qty: number;
  primary_image_url?: string | null;
  discount_percent?: number;
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  image_url?: string | null;
  product_count?: number;
}

interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  published_at?: string | null;
  cover_url?: string | null;
  category_name?: string | null;
  author_name?: string | null;
  author_avatar_url?: string | null;
  reading_time_minutes?: number;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
  sort_order?: number;
  is_active?: boolean;
}

export default async function HomePage() {
  const homepageRes = await api.homepage();
  const sections = homepageRes?.sections ?? null;

  if (sections && sections.length > 0) {
    const heroSection = sections.find((s) => s.kind === "hero");
    const articleSection = sections.find((s) => s.kind === "articles");
    const faqSection = sections.find((s) => s.kind === "faq");
    const productSections = sections.filter((s) => s.kind === "products");
    const categorySection = sections.find((s) => s.kind === "categories");

    return (
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        {/* 1. Hero */}
        {heroSection && heroSection.slides && heroSection.slides.length > 0 && (
          <HomeHero slides={heroSection.slides} />
        )}

        {/* 2. Trust / Craft Principles */}
        <TrustSection />

        {/* 3. Featured Products - Best Sellers */}
        {productSections[0] && productSections[0].products && (
          <FeaturedProducts
            eyebrow="پرفروش‌ترین‌ها"
            title={productSections[0].title || "محبوب‌ترین انتخاب‌ها"}
            subtitle="قطعاتی که مشتریان بیش از همه دوست دارند"
            products={productSections[0].products as ProductListItem[]}
            headingVariant="bold"
          />
        )}

        {/* 4. Categories */}
        {categorySection && categorySection.categories && (
          <CategoryShowcase
            title={categorySection.title || "مجموعه‌ها"}
            subtitle="سبک و سلیقه خود را پیدا کنید"
            categories={categorySection.categories as CategoryItem[]}
          />
        )}

        {/* 5. Craft Process */}
        <CraftProcess />

        {/* 6. New Arrivals */}
        {productSections[1] && productSections[1].products && (
          <FeaturedProducts
            eyebrow="تازه از کوره"
            title={productSections[1].title || "جدیدترین‌ها"}
            subtitle="قطعات تازه آماده برای خانه شما"
            products={productSections[1].products as ProductListItem[]}
          />
        )}

        {/* 7. Workshop Story */}
        <WorkshopStory />

        {/* 8. Discounted Products */}
        {productSections[2] && productSections[2].products && productSections[2].products.length > 0 && (
          <FeaturedProducts
            eyebrow="پیشنهاد ویژه"
            title={productSections[2].title || "فرصت‌های محدود"}
            subtitle="قیمت‌های استثنایی برای قطعات منتخب"
            products={productSections[2].products as ProductListItem[]}
          />
        )}

        {/* 9. Articles */}
        {articleSection && articleSection.articles && (
          <ArticlesSection
            eyebrow="مجله تن‌سِرام"
            title={articleSection.title || "داستان‌ها و راهنماها"}
            subtitle="چیزهایی که ارزش خواندن دارند"
            articles={articleSection.articles as ArticleItem[]}
          />
        )}

        {/* 10. FAQ */}
        {faqSection && faqSection.faq && (
          <FaqSection
            title={faqSection.title || "سوالات رایج"}
            subtitle="پاسخ پرسش‌های پرتکرار"
            faq_items={faqSection.faq as FaqItem[]}
          />
        )}

        {/* 11. CTA */}
        <HomeCta />
      </div>
    );
  }

  // Fallback: fetch individual APIs when homepage API is unavailable
  const [fallbackProducts, fallbackCategories, fallbackArticles, fallbackFaq, fallbackCarousels] = await Promise.all([
    api.products({ page_size: 24 }),
    api.categories(),
    api.articles(),
    api.faq(),
    api.carousels(),
  ]);

  const allProducts: ProductListItem[] = fallbackProducts?.items ?? [];
  const categories: CategoryItem[] = (fallbackCategories ?? []).map((c) => ({
    id: c.id ?? "",
    name: c.name,
    slug: c.slug,
    image_url: c.image_url,
    product_count: undefined,
  }));
  const articles: ArticleItem[] = (fallbackArticles ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    excerpt: a.excerpt,
    published_at: a.published_at,
    cover_url: a.cover_url ?? null,
    category_name: a.category_name ?? null,
    author_name: a.author_name ?? null,
    author_avatar_url: a.author_avatar_url ?? null,
    reading_time_minutes: a.reading_time_minutes,
  }));
  const faqItems: FaqItem[] = (fallbackFaq ?? []).map((f) => ({
    id: f.id,
    question: f.question,
    answer: f.answer,
    category: f.category,
    sort_order: f.sort_order,
    is_active: f.is_active,
  }));
  const slides = (fallbackCarousels ?? [])
    .filter((c) => c.is_active !== false)
    .map((c) => ({
      id: c.id,
      title: c.title,
      subtitle: c.subtitle ?? null,
      image_url: c.image_url,
      link_url: c.link_url,
    }));

  const bestSellers = allProducts.filter((p) => p.stock_qty > 0).slice(0, 12);
  const newArrivals = allProducts.slice(0, 12);
  const discounted = allProducts
    .filter((p) => p.compare_at_price && p.compare_at_price > p.price)
    .slice(0, 12);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
      {/* 1. Hero */}
      {slides.length > 0 && <HomeHero slides={slides} />}

      {/* 2. Trust */}
      <TrustSection />

      {/* 3. Best Sellers */}
      {bestSellers.length > 0 && (
        <FeaturedProducts
          eyebrow="پرفروش‌ترین‌ها"
          title="محبوب‌ترین انتخاب‌ها"
          subtitle="قطعاتی که مشتریان بیش از همه دوست دارند"
          products={bestSellers}
          headingVariant="bold"
        />
      )}

      {/* 4. Categories */}
      {categories.length > 0 && (
        <CategoryShowcase
          title="مجموعه‌ها"
          subtitle="سبک و سلیقه خود را پیدا کنید"
          categories={categories}
        />
      )}

      {/* 5. Craft Process */}
      <CraftProcess />

      {/* 6. New Arrivals */}
      {newArrivals.length > 0 && (
        <FeaturedProducts
          eyebrow="تازه از کوره"
          title="جدیدترین‌ها"
          subtitle="قطعات تازه آماده برای خانه شما"
          products={newArrivals}
        />
      )}

      {/* 7. Workshop Story */}
      <WorkshopStory />

      {/* 8. Discounted */}
      {discounted.length > 0 && (
        <FeaturedProducts
          eyebrow="پیشنهاد ویژه"
          title="فرصت‌های محدود"
          subtitle="قیمت‌های استثنایی برای قطعات منتخب"
          products={discounted}
        />
      )}

      {/* 9. Articles */}
      {articles.length > 0 && (
        <ArticlesSection
          eyebrow="مجله تن‌سِرام"
          title="داستان‌ها و راهنماها"
          subtitle="چیزهایی که ارزش خواندن دارند"
          articles={articles}
        />
      )}

      {/* 10. FAQ */}
      {faqItems.length > 0 && (
        <FaqSection
          title="سوالات رایج"
          subtitle="پاسخ پرسش‌های پرتکرار"
          faq_items={faqItems}
        />
      )}

      {/* 11. CTA */}
      <HomeCta />
    </div>
  );
}
