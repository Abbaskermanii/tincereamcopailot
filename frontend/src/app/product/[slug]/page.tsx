import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api, mediaUrl, SITE_URL } from "@/lib/api";
import { ProductView } from "@/components/store/product-view";
import { RelatedProducts } from "@/components/store/related-products";
import { ProductReviews } from "@/components/store/product-reviews";
import { ProductQuestions } from "@/components/store/product-questions";
import { RecentlyViewed } from "@/components/store/recently-viewed";
import { TrackRecentlyViewed } from "@/components/store/track-recently-viewed";

export const revalidate = 60;

interface Props {
  params: { slug: string };
}

async function getProduct(slug: string) {
  // revalidate 60s for product detail - stock sensitive but not real-time
  // Use shorter cache for product vs 120 for catalog
  const product = await api.product(slug);
  return product;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: "محصول یافت نشد" };
  const title = product.name;
  const description = product.short_description || product.description?.slice(0, 160) || `${product.name} - دست‌ساز تن‌سرام`;
  return {
    title: `${title} | تن‌سرام`,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: `${title} | تن‌سرام`,
      description,
      images: product.images?.[0]?.url ? [{ url: mediaUrl(product.images[0].url), width: 1200, height: 630, alt: product.name }] : undefined,
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  // Map to view model - keep same as before but server-side
  const viewProduct = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    compare_at_price: product.compare_at_price,
    discount_percent: product.discount_percent,
    stock_qty: product.stock_qty,
    images: product.images ?? [],
    variants: product.variants ?? [],
    material: product.material ?? "",
    dimensions: product.dimensions ?? "",
    weight_grams: product.weight_grams,
    short_description: product.short_description ?? "",
    description: product.description ?? "",
    sku: product.sku ?? "",
    primary_image_url: product.primary_image_url ?? product.images?.[0]?.url ?? "",
    category_slug: product.category_slug,
  };

  // JSON-LD for SEO - server rendered (no useEffect)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.short_description ?? product.description?.slice(0, 300) ?? "",
    image: (product.images ?? []).map((img: { url: string }) => mediaUrl(img.url)).filter(Boolean),
    sku: product.sku ?? "",
    brand: { "@type": "Brand", name: "TinCeram" },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${product.slug}`,
      priceCurrency: "IRR",
      price: String(Math.round(product.price ?? 0)),
      availability: product.stock_qty > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خانه", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: product.name, item: `${SITE_URL}/product/${product.slug}` },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24 md:px-6 md:pb-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <TrackRecentlyViewed slug={product.slug} name={product.name} price={product.price} imageUrl={mediaUrl(product.images?.[0]?.url) ?? ""} />

      <ProductView product={viewProduct} />

      {/* Related, Reviews, Questions are streamed - they fetch in parallel where possible */}
      <RelatedProducts categorySlug={product.category_slug ?? null} excludeSlug={product.slug} />
      <ProductReviews productId={product.id} />
      <ProductQuestions productId={product.id} />
      <RecentlyViewed excludeSlug={product.slug} />
    </div>
  );
}
