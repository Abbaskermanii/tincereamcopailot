"use client";

import React, { useState, useMemo, useEffect } from "react";
import DOMPurify from "dompurify";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { useToast } from "@/components/ui/toast-provider";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/local-store";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { PriceTag } from "@/components/ui/price-tag";
import { ProductGallery } from "@/components/store/product-gallery";
import { AddToCartPanel } from "@/components/store/add-to-cart";
import { StickyBuyBar } from "@/components/store/sticky-buy-bar";
import { StockNotify } from "@/components/store/stock-notify";
import { faNum } from "@/lib/format";
import { mediaUrl } from "@/lib/api";

function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  return DOMPurify.sanitize(html);
}

interface ProductImage {
  id: string;
  url: string;
  alt_text: string;
  sort_order: number;
  is_primary: boolean;
  attribute_value_id?: string | null;
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
  attribute_value_ids?: string[];
  attribute_values?: Array<{ id: string; attribute_id: string; value: string; slug: string; swatch_image_url?: string | null }>;
}

interface AttributeValue {
  id: string;
  attribute_id: string;
  value: string;
  slug: string;
  swatch_image_url?: string | null;
}

interface Attribute {
  id: string;
  name: string;
  slug: string;
  values: AttributeValue[];
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
  attributes?: Attribute[];
  material?: string | null;
  dimensions?: string | null;
  weight_grams?: number;
  short_description?: string;
  description?: string;
  sku?: string;
  primary_image_url?: string | null;
  category_slug?: string | null;
}

export function ProductView({ product }: { product: Product }) {
  const hasAttributes = product.attributes && product.attributes.length > 0 && product.variants && product.variants.length > 0;

  // attribute selection state: attribute_id -> value_id
  const [selectedAttrValues, setSelectedAttrValues] = useState<Record<string, string>>(() => {
    if (!hasAttributes) return {};
    const init: Record<string, string> = {};
    for (const attr of product.attributes!) {
      if (attr.values[0]) init[attr.id] = attr.values[0].id;
    }
    return init;
  });

  // sync when product changes (e.g., slug change)
  useEffect(() => {
    if (hasAttributes) {
      const init: Record<string, string> = {};
      for (const attr of product.attributes!) {
        if (attr.values[0]) init[attr.id] = attr.values[0].id;
      }
      setSelectedAttrValues(init);
    }
  }, [product.id]); // eslint-disable-line

  const selectedVariant: Variant | null = useMemo(() => {
    if (!hasAttributes) return null;
    const selectedIds = new Set(Object.values(selectedAttrValues));
    if (selectedIds.size === 0) return null;
    // find variant whose attribute_value_ids set equals selectedIds
    // For multi-attribute, variant must have exactly those values (order not important)
    for (const v of product.variants!) {
      const vIds = new Set(v.attribute_value_ids ?? v.attribute_values?.map((av) => av.id) ?? []);
      if (vIds.size !== selectedIds.size) continue;
      let match = true;
      for (const id of selectedIds) if (!vIds.has(id)) { match = false; break; }
      if (match) return v;
    }
    // fallback: find variant that contains the single selected value (single-attribute products where variant may have single value)
    if (selectedIds.size === 1) {
      const single = Array.from(selectedIds)[0];
      for (const v of product.variants!) {
        const ids = v.attribute_value_ids ?? v.attribute_values?.map((av) => av.id) ?? [];
        if (ids.includes(single!)) return v;
      }
    }
    return null;
  }, [selectedAttrValues, product.variants, hasAttributes]);

  const effectivePrice = useMemo(() => {
    if (hasAttributes && selectedVariant) {
      if (selectedVariant.absolute_price !== null && selectedVariant.absolute_price !== undefined) return Number(selectedVariant.absolute_price);
      return product.price + Number(selectedVariant.price_delta ?? 0);
    }
    // fallback to old selectedVariant handling for flat variants (managed by AddToCartPanel) – we still compute for display here as base
    return product.price;
  }, [selectedVariant, product.price, hasAttributes]);

  // For flat variant mode, we still need to let AddToCartPanel manage selection; but if attributes exist, we handle price here
  // Gallery filtering
  const filteredImages = useMemo(() => {
    if (!hasAttributes || !selectedVariant) return product.images;
    const vIds = new Set(selectedVariant.attribute_value_ids ?? selectedVariant.attribute_values?.map((av) => av.id) ?? []);
    if (vIds.size === 0) return product.images;
    const tagged = product.images.filter((img) => img.attribute_value_id && vIds.has(img.attribute_value_id));
    const untagged = product.images.filter((img) => !img.attribute_value_id);
    // If there are tagged images for this selection, show tagged + untagged (fallback), else show all
    if (tagged.length > 0) return [...tagged, ...untagged].sort((a, b) => a.sort_order - b.sort_order);
    return product.images;
  }, [product.images, selectedVariant, hasAttributes]);

  // For price display when hasAttributes, we show selectedVariant's price; otherwise AddToCartPanel will handle
  const displayPrice = hasAttributes && selectedVariant ? effectivePrice : product.price;
  const displayStock = hasAttributes && selectedVariant ? selectedVariant.stock_qty : product.stock_qty;
  const displaySku = hasAttributes && selectedVariant ? selectedVariant.sku || product.sku : product.sku;

  // variant selection for gallery – derive variantImageUrl for gallery sticky variant highlight
  const variantImageUrl = hasAttributes ? selectedVariant?.image_url : undefined;
  const variantName = hasAttributes ? selectedVariant?.name : undefined;

  // For non-attribute mode, keep legacy variant selection sync via AddToCartPanel callback
  const [legacyVariant, setLegacyVariant] = useState<Variant | null>(null);

  const handleLegacyVariantSelect = React.useCallback((variant: { id: string; name: string; image_url?: string; price_delta: number; absolute_price: number | null; stock_qty: number }) => {
    if (!variant.id) { setLegacyVariant(null); return; }
    const found = product.variants?.find((v) => v.id === variant.id) ?? null;
    setLegacyVariant(found as Variant | null);
  }, [product.variants]);

  const legacyEffectivePrice = useMemo(() => {
    if (!legacyVariant) return product.price;
    if (legacyVariant.absolute_price !== null && legacyVariant.absolute_price !== undefined) return Number(legacyVariant.absolute_price);
    return product.price + Number(legacyVariant.price_delta ?? 0);
  }, [legacyVariant, product.price]);

  const finalPrice = hasAttributes ? displayPrice : legacyVariant ? legacyEffectivePrice : product.price;
  const finalStock = hasAttributes ? displayStock : legacyVariant ? legacyVariant.stock_qty : product.stock_qty;
  const finalSku = hasAttributes ? displaySku : legacyVariant ? legacyVariant.sku || product.sku : product.sku;


  return (
    <>
      <Breadcrumbs
        items={[
          { name: "خانه", href: "/" },
          { name: product.category_slug ? product.category_slug : "محصول", href: product.category_slug ? `/category/${product.category_slug}` : "/shop" },
          { name: product.name },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <ProductGallery images={filteredImages} productName={product.name} variantImageUrl={variantImageUrl ?? legacyVariant?.image_url} variantName={variantName ?? legacyVariant?.name} />
        </div>

        <div id="buy-box" className="space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold leading-snug md:text-3xl">
              {product.name}
              {hasAttributes && selectedVariant && <span className="mr-2 text-lg font-medium text-char-soft">— {selectedVariant.name}</span>}
              {!hasAttributes && legacyVariant && <span className="mr-2 text-lg font-medium text-char-soft">— {legacyVariant.name}</span>}
            </h1>
            <p className="num-latin mt-2 text-xs text-char-soft dark:text-ink-soft" dir="ltr">
              {finalSku}
            </p>
            {hasAttributes && selectedVariant && <p className="mt-1 text-xs text-firouzeh">گونه انتخاب شده: {selectedVariant.name}</p>}
            {!hasAttributes && legacyVariant && <p className="mt-1 text-xs text-firouzeh">گونه انتخاب شده: {legacyVariant.name}</p>}
          </div>

          {product.short_description && <p className="leading-8 text-char-soft dark:text-ink-soft">{product.short_description}</p>}

          {/* Attribute selectors */}
          {hasAttributes && product.attributes!.length > 0 && (
            <div className="space-y-4">
              {product.attributes!.map((attr) => (
                <div key={attr.id} className="space-y-2">
                  <p className="text-sm font-bold">{attr.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {attr.values.map((val) => {
                      const isSelected = selectedAttrValues[attr.id] === val.id;
                      const hasSwatch = Boolean(val.swatch_image_url);
                      return (
                        <button
                          key={val.id}
                          type="button"
                          onClick={() => setSelectedAttrValues((prev) => ({ ...prev, [attr.id]: val.id }))}
                          className={`min-h-[44px] rounded-xl border px-3 py-2 text-sm transition-all flex items-center gap-2 ${
                            isSelected
                              ? "border-lajvard bg-lajvard text-white shadow-shelf dark:border-lajvard-soft dark:bg-lajvard-soft dark:text-char"
                              : "border-char/15 bg-surface hover:border-char/30 dark:border-white/15 dark:bg-black/10"
                          }`}
                          aria-pressed={isSelected}
                        >
                          {hasSwatch ? (
                            <span className="h-6 w-6 overflow-hidden rounded-full border border-char/10 bg-white">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={mediaUrl(val.swatch_image_url)} alt={val.value} className="h-full w-full object-cover" />
                            </span>
                          ) : null}
                          {val.value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <PriceTag price={hasAttributes ? finalPrice : legacyVariant ? legacyEffectivePrice : product.price} compareAtPrice={product.compare_at_price} size="lg" />
            {product.discount_percent && product.discount_percent > 0 && <Badge tone="warm">٪{faNum(product.discount_percent)} تخفیف</Badge>}
            {finalStock > 0 ? (
              <Badge tone="success">موجود در انبار {finalStock <= 5 ? `— فقط ${faNum(finalStock)} عدد` : ""}</Badge>
            ) : (
              <Badge tone="muted">ناموجود</Badge>
            )}
            {hasAttributes && selectedVariant && <Badge tone="brand">{selectedVariant.name}</Badge>}
            {!hasAttributes && legacyVariant && <Badge tone="brand">{legacyVariant.name}</Badge>}
          </div>

          {finalStock <= 0 && <StockNotify productId={product.id} />}
          {hasAttributes ? (
            <AttributeCartSection
              product={product}
              selectedVariant={selectedVariant}
              finalPrice={finalPrice}
              finalStock={finalStock}
            />
          ) : (
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
              onVariantSelect={handleLegacyVariantSelect}
            />
          )}

          <dl className="space-y-3 rounded-wobble bg-surface p-5 text-sm shadow-shelf">
            {[
              ["جنس", product.material],
              ["ابعاد", product.dimensions],
              ["وزن", product.weight_grams ? `حدود ${faNum(product.weight_grams)} گرم` : null],
            ]
              .filter((row): row is [string, string] => Boolean(row[1]))
              .map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-char-soft dark:text-ink-soft">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
          </dl>

          <details className="group rounded-wobble bg-surface p-5" open>
            <summary className="cursor-pointer list-none font-bold">توضیحات کامل</summary>
            {product.description && product.description.includes("<") ? (
              <div className="prose prose-sm mt-3 max-w-none leading-8 text-char-soft dark:prose-invert dark:text-ink-soft [&_h2]:font-extrabold [&_h3]:font-bold [&_a]:text-lajvard" dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }} />
            ) : (
              <p className="mt-3 whitespace-pre-line text-sm leading-8 text-char-soft dark:text-ink-soft">{product.description}</p>
            )}
          </details>

          <details className="rounded-wobble bg-surface p-5">
            <summary className="cursor-pointer list-none font-bold">نگهداری و ارسال</summary>
            <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm leading-7 text-char-soft dark:text-ink-soft">
              <li>شست‌وشو با دست و اسفنج نرم؛ برای ماشین ظرفشویی مناسب نیست.</li>
              <li>زمان ارسال: ۲ تا ۴ روز کاری، بسته‌بندی چندلایه و ضدضرب.</li>
              <li>هزینهٔ ارسال بر اساس روش انتخابی در صفحهٔ تسویه حساب محاسبه می‌شود.</li>
            </ul>
          </details>
        </div>
      </div>

      <StickyBuyBar name={hasAttributes && selectedVariant ? `${product.name} — ${selectedVariant.name}` : legacyVariant ? `${product.name} — ${legacyVariant.name}` : product.name} price={finalPrice} />
    </>
  );
}

function AttributeCartSection({
  product,
  selectedVariant,
  finalPrice,
  finalStock,
}: {
  product: Product;
  selectedVariant: Variant | null;
  finalPrice: number;
  finalStock: number;
}) {
  const [qty, setQty] = useState(1);
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const { toast } = useToast();
  const outOfStock = finalStock <= 0;
  const primaryUrl = product.primary_image_url ?? product.images[0]?.url ?? "";
  function handleAdd() {
    add(
      {
        productId: product.id,
        slug: product.slug,
        name: selectedVariant ? `${product.name} — ${selectedVariant.name}` : product.name,
        price: finalPrice,
        imageUrl: selectedVariant?.image_url ?? primaryUrl,
        stockQty: finalStock,
        variantId: selectedVariant?.id ?? null,
        variantName: selectedVariant?.name ?? null,
        variantSku: selectedVariant?.sku ?? null,
        variantImageUrl: selectedVariant?.image_url ?? null,
      },
      qty,
    );
    toast("به سبد خرید اضافه شد");
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <QuantityStepper value={qty} onChange={setQty} max={Math.max(finalStock, 1)} />
        {!outOfStock && finalStock <= 5 && (
          <span className="text-xs font-medium text-clay">فقط {new Intl.NumberFormat("fa-IR").format(finalStock)} عدد در انبار</span>
        )}
      </div>
      <div className="flex gap-2">
        <Button size="lg" disabled={outOfStock} onClick={handleAdd} className="flex-1">
          <ShoppingBag size={19} />
          {outOfStock ? "ناموجود" : "افزودن به سبد خرید"}
        </Button>
        <Button
          size="lg"
          variant="secondary"
          aria-label="افزودن به علاقه‌مندی‌ها"
          aria-pressed={has(product.id)}
          onClick={() => {
            toggle(product.id);
            toast(has(product.id) ? "از علاقه‌مندی‌ها حذف شد" : "به علاقه‌مندی‌ها اضافه شد");
          }}
        >
          <Heart size={19} className={has(product.id) ? "fill-clay text-clay" : ""} />
        </Button>
      </div>
    </div>
  );
}
