import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api, SITE_URL } from "@/lib/api";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { PriceTag } from "@/components/ui/price-tag";
import { ProductGallery } from "@/components/store/product-gallery";
import { AddToCartPanel } from "@/components/store/add-to-cart";
import { StickyBuyBar } from "@/components/store/sticky-buy-bar";
import { RecentlyViewed } from "@/components/store/recently-viewed";
import { TrackRecentlyViewed } from "@/components/store/track-recently-viewed";
import { RelatedProducts } from "@/components/store/related-products";
import { faNum } from "@/lib/format";

export const revalidate = 90;

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await api.product(params.slug);
  if (!p) return { title: "محصول یافت نشد" };

  const title = p.meta_title ?? `${p.name} — ${faNum(p.price)} تومان`;
  const description =
    p.meta_description ??
    p.short_description ??
    p.description.slice(0, 155);
  const ogImage = p.primary_image_url
    ? `${SITE_URL}${p.primary_image_url}`
    : undefined;

  return {
    title,
    description,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: {
      title,
      description,
      images: ogImage ? [{ url: ogImage, alt: p.name }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const p = await api.product(params.slug);
  if (!p) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.short_description ?? p.description.slice(0, 300),
    image: p.primary_image_url ? [`${SITE_URL}${p.primary_image_url}`] : [],
    sku: p.sku,
    brand: { "@type": "Brand", name: "TinCeram" },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${p.slug}`,
      priceCurrency: "IRR",
      price: String(Math.round(p.price * 10)),
      availability:
        p.stock_qty > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خانه", item: SITE_URL },
      ...(p.category_slug && p.category_name
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: p.category_name,
              item: `${SITE_URL}/category/${p.category_slug}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: p.category_slug ? 3 : 2,
        name: p.name,
        item: `${SITE_URL}/product/${p.slug}`,
      },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24 md:px-6 md:pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <TrackRecentlyViewed
        slug={p.slug}
        name={p.name}
        price={p.price}
        imageUrl={p.primary_image_url}
      />

      <Breadcrumbs
        items={[
          { name: "خانه", href: "/" },
          ...(p.category_name && p.category_slug
            ? [{ name: p.category_name, href: `/category/${p.category_slug}` }]
            : []),
          { name: p.name },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        {/* gallery — sticky on desktop */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <ProductGallery images={p.images} productName={p.name} />
        </div>

        {/* info column */}
        <div id="buy-box" className="space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold leading-snug md:text-3xl">{p.name}</h1>
            <p className="num-latin mt-2 text-xs text-char-soft dark:text-ink-soft" dir="ltr">
              {p.sku}
            </p>
          </div>

          {p.short_description && (
            <p className="leading-8 text-char-soft dark:text-ink-soft">{p.short_description}</p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <PriceTag price={p.price} compareAtPrice={p.compare_at_price} size="lg" />
            {p.discount_percent > 0 && <Badge tone="warm">٪{faNum(p.discount_percent)} تخفیف</Badge>}
            {p.stock_qty > 0 ? (
              <Badge tone="success">موجود در انبار</Badge>
            ) : (
              <Badge tone="muted">ناموجود</Badge>
            )}
          </div>

          <AddToCartPanel
            product={{
              id: p.id,
              slug: p.slug,
              name: p.name,
              price: p.price,
              stock_qty: p.stock_qty,
              primary_image_url: p.primary_image_url,
            }}
          />

          <dl className="space-y-3 rounded-wobble bg-surface p-5 text-sm shadow-shelf dark:bg-black/25">
            {[
              ["جنس", p.material],
              ["ابعاد", p.dimensions],
              ["وزن", p.weight_grams ? `حدود ${faNum(p.weight_grams)} گرم` : null],
            ]
              .filter((row): row is [string, string] => Boolean(row[1]))
              .map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-char-soft dark:text-ink-soft">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
          </dl>

          <details className="group rounded-wobble bg-surface p-5 dark:bg-black/25" open>
            <summary className="cursor-pointer list-none font-bold">
              توضیحات کامل
            </summary>
            <p className="mt-3 whitespace-pre-line text-sm leading-8 text-char-soft dark:text-ink-soft">
              {p.description}
            </p>
          </details>

          <details className="rounded-wobble bg-surface p-5 dark:bg-black/25">
            <summary className="cursor-pointer list-none font-bold">نگهداری و ارسال</summary>
            <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm leading-7 text-char-soft dark:text-ink-soft">
              <li>شست‌وشو با دست و اسفنج نرم؛ برای ماشین ظرفشویی مناسب نیست.</li>
              <li>پخت ارسال: ۲ تا ۴ روز کاری، بسته‌بندی چندلایهٔ ضدضربه.</li>
              <li>هزینهٔ ارسال ثابت ۵۵٬۰۰۰ تومان به سراسر ایران.</li>
            </ul>
          </details>
        </div>
      </div>

      <RelatedProducts categorySlug={p.category_slug} excludeSlug={p.slug} />
      <RecentlyViewed excludeSlug={p.slug} />
      <StickyBuyBar name={p.name} price={p.price} />
    </div>
  );
}
