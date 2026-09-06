"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ShieldCheck, Truck, HandHeart } from "lucide-react";
import { BreadcrumbNav } from "@/components/ui/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { PriceTag } from "@/components/ui/price-tag";
import { ProductGallery } from "@/components/store/product-gallery";
import { AddToCartPanel } from "@/components/store/add-to-cart";
import { StickyBuyBar } from "@/components/store/sticky-buy-bar";
import { StockNotify } from "@/components/store/stock-notify";
import { faNum } from "@/lib/format";

interface ProductImage {
  id: string;
  url: string;
  alt_text: string;
  sort_order: number;
  is_primary: boolean;
}

interface Variant {
  id: string;
  name: string;
  sku: string;
  image_url?: string;
  price_delta: number;
  absolute_price: number | null;
  stock_qty: number;
  is_active: boolean;
}

interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  compare_at_price?: number | null;
  discount_percent?: number;
  stock_qty: number;
  images: ProductImage[];
  variants?: Variant[];
  material?: string | null;
  dimensions?: string | null;
  weight_grams?: number;
  short_description?: string;
  description?: string;
  sku?: string;
  primary_image_url?: string | null;
  category_slug?: string | null;
  category_name?: string | null;
}

function sanitizeDescription(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/ on[a-z]+="[^"]*"/gi, "")
    .replace(/ on[a-z]+='[^']*'/gi, "");
}

export function ProductView({ product }: { product: Product }) {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description');

  const handleVariantSelect = React.useCallback(
    (variant: { id: string; name: string; sku?: string; image_url?: string; price_delta: number; absolute_price: number | null; stock_qty: number }) => {
      if (!variant.id) {
        setSelectedVariant(null);
        return;
      }
      setSelectedVariant({
        id: variant.id,
        name: variant.name,
        sku: (variant as unknown as { sku?: string }).sku ?? "",
        image_url: variant.image_url,
        price_delta: variant.price_delta,
        absolute_price: variant.absolute_price,
        stock_qty: variant.stock_qty,
        is_active: true,
      } as Variant);
    },
    [],
  );

  const effectivePrice = useMemo(() => {
    if (!selectedVariant) return product.price;
    if (selectedVariant.absolute_price !== null && selectedVariant.absolute_price !== undefined) return Number(selectedVariant.absolute_price);
    return product.price + Number(selectedVariant.price_delta ?? 0);
  }, [selectedVariant, product.price]);

  const effectiveStock = selectedVariant ? selectedVariant.stock_qty : product.stock_qty;
  const effectiveSku = selectedVariant?.sku || product.sku || "";

  return (
    <>
      <BreadcrumbNav
        items={[
          { label: "خانه", href: "/" },
          {
            label: product.category_name || "فروشگاه",
            href: product.category_slug ? `/shop?category=${product.category_slug}` : "/shop",
          },
          { label: product.name },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <ProductGallery images={product.images} productName={product.name} variantImageUrl={selectedVariant?.image_url} variantName={selectedVariant?.name} />
        </div>

        <div id="buy-box" className="scroll-mt-24 space-y-6">
          <div>
            {product.category_name && (
              <Link
                href={product.category_slug ? `/shop?category=${product.category_slug}` : "/shop"}
                className="mb-2 inline-block rounded-full bg-lajvard/8 px-3 py-1 text-[11px] font-bold text-lajvard transition-colors hover:bg-lajvard/15 dark:bg-lajvard-soft/15 dark:text-lajvard-soft"
              >
                {product.category_name}
              </Link>
            )}
            <h1 className="text-2xl font-extrabold leading-snug md:text-3xl">
              {product.name}
              {selectedVariant && <span className="mr-2 text-lg font-medium text-char-soft">— {selectedVariant.name}</span>}
            </h1>
            <p className="num-latin mt-2 text-xs text-char-soft dark:text-ink-soft" dir="ltr">
              {effectiveSku}
            </p>
            {selectedVariant && <p className="mt-1 text-xs text-firouzeh">گونه انتخاب شده: {selectedVariant.name}</p>}
          </div>

          {product.short_description && <p className="leading-8 text-char-soft dark:text-ink-soft">{product.short_description}</p>}

          <div className="flex flex-wrap items-center gap-3">
            <PriceTag price={effectivePrice} compareAtPrice={product.compare_at_price} size="lg" />
            {product.discount_percent && product.discount_percent > 0 && <Badge tone="warm">٪{faNum(product.discount_percent)} تخفیف</Badge>}
            {effectiveStock > 0 ? (
              <Badge tone="success">موجود در انبار {effectiveStock <= 5 ? `— فقط ${faNum(effectiveStock)} عدد` : ""}</Badge>
            ) : (
              <Badge tone="muted">ناموجود</Badge>
            )}
            {selectedVariant && <Badge tone="brand">{selectedVariant.name}</Badge>}
          </div>

          {effectiveStock <= 0 && <StockNotify productId={product.id} />}
          <AddToCartPanel
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              price: product.price,
              stock_qty: product.stock_qty,
              primary_image_url: product.primary_image_url ?? product.images[0]?.url ?? "",
              variants: product.variants,
            }}
            onVariantSelect={handleVariantSelect}
          />

          {/* Trust chips */}
          <div className="grid grid-cols-3 gap-2 rounded-wobble-card border border-char/10 bg-surface p-3 dark:border-white/10 dark:bg-[#262320]">
            {[
              { icon: HandHeart, label: "دست‌ساز و تک‌نسخه" },
              { icon: ShieldCheck, label: "بسته‌بندی ایمن" },
              { icon: Truck, label: "ارسال سراسر ایران" },
            ].map((t) => (
              <div key={t.label} className="flex flex-col items-center gap-1.5 text-center">
                <t.icon className="h-5 w-5 text-kiln-clay dark:text-clay-soft" strokeWidth={1.6} />
                <span className="text-[10px] font-bold text-char-soft dark:text-white/55">{t.label}</span>
              </div>
            ))}
          </div>

          {/* Tab navigation */}
          <div className="flex border-b border-char/10 pb-2 dark:border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('description')}
              className={`px-4 py-2 font-bold ${activeTab === 'description' ? 'border-b-2 border-lajvard text-lajvard' : 'text-char-soft hover:text-lajvard dark:text-ink-soft dark:hover:text-white/75'}`}
            >
              توضیحات
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('specifications')}
              className={`px-4 py-2 font-bold ${activeTab === 'specifications' ? 'border-b-2 border-lajvard text-lajvard' : 'text-char-soft hover:text-lajvard dark:text-ink-soft dark:hover:text-white/75'}`}
            >
              مشخصات
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-2 font-bold ${activeTab === 'reviews' ? 'border-b-2 border-lajvard text-lajvard' : 'text-char-soft hover:text-lajvard dark:text-ink-soft dark:hover:text-white/75'}`}
            >
              نظرات و پرسش‌ها
            </button>
          </div>

          {/* Tab content */}
          <div className="space-y-6">
            {activeTab === 'description' && (
              <div className="rounded-wobble-card bg-surface p-5 shadow-shelf dark:bg-black/25">
                <div
                  className="article-body text-sm"
                  dangerouslySetInnerHTML={{ __html: sanitizeDescription(product.description ?? "") }}
                />
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="space-y-3 rounded-wobble-card bg-surface p-5 shadow-shelf dark:bg-black/25">
                {[
                  ["جنس", product.material],
                  ["ابعاد", product.dimensions],
                  ["وزن", product.weight_grams ? `حدود ${faNum(product.weight_grams)} گرم` : null],
                  ["دسته‌بندی", product.category_name],
                ]
                  .filter((row): row is [string, string] => Boolean(row[1]))
                  .map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <dt className="text-char-soft dark:text-ink-soft">{k}</dt>
                      <dd className="font-medium">{v}</dd>
                    </div>
                  ))}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="rounded-wobble-card bg-surface p-5 shadow-shelf dark:bg-black/25">
                  <h3 className="text-xl font-extrabold">نظرات مشتریان</h3>
                  <p className="mt-3 text-sm text-char-soft dark:text-ink-soft">
                    نظرات این محصول به صورت آنلاین منتشر می‌شود. شما می‌توانید برای اولین بار درباره این محصول نظر بدهید.
                  </p>
                </div>
                <div className="rounded-wobble-card bg-surface p-5 shadow-shelf dark:bg-black/25">
                  <h3 className="text-xl font-extrabold">پرسش و پاسخ</h3>
                  <p className="mt-3 text-sm text-char-soft dark:text-ink-soft">
                    پرسش مربوط به این محصول می‌تواند در این بخش ثبت شود.
                  </p>
                </div>
              </div>
            )}
          </div>

          <details className="rounded-wobble-card bg-surface p-5 shadow-shelf dark:bg-black/25">
            <summary className="cursor-pointer list-none font-bold">نگهداری و ارسال</summary>
            <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm leading-7 text-char-soft dark:text-ink-soft">
              <li>شست‌وشو با دست و اسفنج نرم؛ برای ماشین ظرفشویی مناسب نیست.</li>
              <li>زمان ارسال: ۲ تا ۴ روز کاری، بسته‌بندی چندلایه و ضدضرب.</li>
              <li>هزینهٔ ارسال بر اساس روش انتخابی در صفحهٔ تسویه حساب محاسبه می‌شود.</li>
            </ul>
          </details>
        </div>
      </div>

      <StickyBuyBar name={selectedVariant ? `${product.name} — ${selectedVariant.name}` : product.name} price={effectivePrice} />
    </>
  );
}
