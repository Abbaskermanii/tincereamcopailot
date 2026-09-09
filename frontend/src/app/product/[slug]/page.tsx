import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api, mediaUrl, SITE_URL } from "@/lib/api";
import { ProductView, type ProductViewProduct } from "@/components/store/product-view";
import { ProductTabs } from "@/components/store/product-tabs";
import { ProductReviews } from "@/components/store/product-reviews";
import { RelatedProducts } from "@/components/store/related-products";

export const revalidate = 30;

interface Props {
  params: { slug: string };
}

async function getProduct(slug: string) {
  // revalidate 60s for product detail - stock sensitive but not real-time
  const product = await api.product(slug);
  return product;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: "محصول یافت نشد" };
  const title = product.name;
  const description =
    product.short_description || product.description?.slice(0, 160) || `${product.name} - دست‌ساز تن‌سرام`;
  const ogImage = product.primary_image_url ?? product.images?.[0]?.url ?? null;
  return {
    title: `${title} | تن‌سرام`,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: `${title} | تن‌سرام`,
      description,
      images: ogImage ? [{ url: mediaUrl(ogImage) }] : undefined,
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const viewProduct: ProductViewProduct = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price ?? 0,
    compare_at_price: product.compare_at_price ?? null,
    discount_percent: product.discount_percent ?? null,
    stock_qty: product.stock_qty ?? 0,
    images: product.images ?? [],
    variants: (product.variants ?? []) as unknown as ProductViewProduct["variants"],
    material: product.material ?? "",
    dimensions: product.dimensions ?? "",
    weight_grams: product.weight_grams ?? null,
    short_description: product.short_description ?? "",
    description: product.description ?? "",
    sku: product.sku ?? "",
    primary_image_url: product.primary_image_url ?? product.images?.[0]?.url ?? "",
    category_slug: product.category_slug ?? null,
    category_name: product.category_name ?? null,
  };

  // JSON-LD for SEO - server rendered
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.short_description ?? product.description?.slice(0, 300) ?? "",
    image: product.images?.length
      ? product.images.map((i) => mediaUrl(i.url)).filter(Boolean)
      : product.primary_image_url
        ? [mediaUrl(product.primary_image_url)]
        : [],
    sku: product.sku ?? "",
    category: product.category_name ?? undefined,
    brand: { "@type": "Brand", name: "Animour Ceram" },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${product.slug}`,
      priceCurrency: "IRR",
      price: String(Math.round(product.price ?? 0)),
      availability:
        product.stock_qty > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خانه", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: product.category_name ?? "فروشگاه",
        item: product.category_slug
          ? `${SITE_URL}/shop?category=${product.category_slug}`
          : `${SITE_URL}/shop`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `${SITE_URL}/product/${product.slug}`,
      },
    ],
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* ۱) گالری + باکس خرید */}
      <ProductView product={viewProduct} />

      {/* ۲) تب‌های توضیحات / مشخصات / نگهداری / ارسال / پرسش‌ها */}
      <ProductTabs product={viewProduct} />

      {/* ۳) نظرات مشتریان — بخش جداگانه */}
      <section className="mt-12 md:mt-16">
        <ProductReviews productId={viewProduct.id} />
      </section>

      {/* ۴) محصولات مرتبط از همان کالکشن */}
      <RelatedProducts categorySlug={product.category_slug ?? null} excludeSlug={product.slug} />
    </div>
  );
}
