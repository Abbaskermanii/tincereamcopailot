import { api } from "@/lib/api";
import { HomeHero } from "@/components/home/home-hero";
import { FeaturedProducts } from "@/components/home/featured-products";
import { CategoryShowcase } from "@/components/home/category-showcase";
import { ArticlesSection } from "@/components/home/articles-section";
import { FaqSection } from "@/components/home/faq-section";
import { TestimonialsSection, type TestimonialItem } from "@/components/home/testimonials-section";
import { SeoTextSection } from "@/components/home/seo-text-section";
import { Reveal } from "@/components/motion/reveal";
import { CraftProcess } from "@/components/home/craft-process";
import { WhyTinceram } from "@/components/home/why-tinceram";

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
  // Data sources (direct APIs)
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
    <>
      {/* 1. Hero — full-bleed, outside the page container */}
      {slides.length > 0 && <HomeHero slides={slides} />}

      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        {/* 2. Categories — right after the hero for quick navigation */}
        {categories.length > 0 && (
          <Reveal>
            <CategoryShowcase title="دسته‌بندی‌ها" categories={categories} />
          </Reveal>
        )}

        {/* 3. Best Sellers */}
        {bestSellers.length > 0 && (
        <Reveal>
          <FeaturedProducts
          eyebrow="پرفروش‌ترین‌ها"
          title="محبوب‌ترین انتخاب‌ها"
          subtitle="قطعاتی که مشتریان بیش از همه دوست دارند"
          products={bestSellers}
          headingVariant="bold"
        />
        </Reveal>
      )}

      {/* 5. Craft Process */}
      <Reveal>
        <CraftProcess />
      </Reveal>

      {/* 6. New Arrivals */}
      {newArrivals.length > 0 && (
        <Reveal>
          <FeaturedProducts
          eyebrow="تازه از کوره"
          title="جدیدترین‌ها"
          subtitle="قطعات تازه آماده برای خانه شما"
          products={newArrivals}
        />
        </Reveal>
      )}

      {/* 7. Why Tinceram */}
      <Reveal>
        <WhyTinceram />
      </Reveal>

      {/* 8. Discounted */}
      {discounted.length > 0 && (
        <Reveal>
          <FeaturedProducts
          eyebrow="پیشنهاد ویژه"
          title="فرصت‌های محدود"
          subtitle="قیمت‌های استثنایی برای قطعات منتخب"
          products={discounted}
        />
        </Reveal>
      )}

      {/* 9. Articles */}
      {articles.length > 0 && (
        <Reveal>
          <ArticlesSection
          eyebrow="مجله آنیمور سرام"
          title="داستان‌ها و راهنماها"
          subtitle="چیزهایی که ارزش خواندن دارند"
          articles={articles}
        />
        </Reveal>
      )}

      {/* 10. Testimonials */}
      <Reveal>
        <TestimonialsSection items={(await api.latestReviews()) as TestimonialItem[]} />
      </Reveal>

      {/* 11. FAQ */}
      {faqItems.length > 0 && (
        <Reveal>
          <FaqSection
          title="سوالات رایج"
          subtitle="پاسخ پرسش‌های پرتکرار"
          faq_items={faqItems}
        />
        </Reveal>
      )}

        {/* 12. SEO text */}
        <SeoTextSection />
      </div>
    </>
  );
}
