"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { mediaUrl } from "@/lib/api";
import { useCart } from "@/lib/cart-context";
import {
  CartIcon,
  MinusIcon,
  PlusIcon,
  TruckIcon,
  ShieldCheckIcon,
  PackageIcon,
} from "./icons";

export type ProductVariant = {
  id?: number | string;
  name?: string;
  title?: string;
  label?: string;
  color?: string;
  size?: string;
  value?: string;
  price?: number;
  stock_qty?: number;
  stock?: number;
  [key: string]: unknown;
};

export interface ProductViewProduct {
  id: number | string;
  slug: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  discount_percent: number | null;
  stock_qty: number;
  images: { url: string; alt?: string | null }[];
  variants: ProductVariant[];
  material: string;
  dimensions: string;
  weight_grams: number | null;
  short_description: string;
  description: string;
  sku: string;
  primary_image_url: string;
  category_slug: string | null;
  category_name: string | null;
}

const fmt = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

function variantLabel(v: ProductVariant, i: number) {
  return v.name ?? v.title ?? v.label ?? v.color ?? v.size ?? v.value ?? `گزینه ${fmt(i + 1)}`;
}

export function ProductView({ product }: { product: ProductViewProduct }) {
  const { addItem, openCart } = useCart();

  const gallery = product.images?.length
    ? product.images
    : product.primary_image_url
      ? [{ url: product.primary_image_url }]
      : [];

  const [imgIdx, setImgIdx] = useState(0);
  const [variantIdx, setVariantIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") setImgIdx((i) => (i + 1) % gallery.length);
      if (e.key === "ArrowLeft") setImgIdx((i) => (i - 1 + gallery.length) % gallery.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, gallery.length]);

  const hasVariants = !!product.variants?.length;
  const selected = hasVariants
    ? product.variants[Math.min(variantIdx, product.variants.length - 1)]
    : null;

  const price =
    selected && typeof selected.price === "number" ? selected.price : product.price ?? 0;
  const stock =
    selected && typeof selected.stock_qty === "number"
      ? selected.stock_qty
      : product.stock_qty ?? 0;

  const compareAt =
    product.compare_at_price && product.compare_at_price > price
      ? product.compare_at_price
      : null;

  const discountPercent =
    product.discount_percent ??
    (compareAt ? Math.round(((compareAt - price) / compareAt) * 100) : 0);

  const maxQty = Math.max(1, Math.min(stock || 1, 10));
  const mainImage = gallery[Math.min(imgIdx, gallery.length - 1)];

  function handleAdd() {
    if (stock <= 0) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price,
      imageUrl: mainImage ? mediaUrl(mainImage.url) : "",
      variantId: (selected?.id as string | number | undefined) ?? null,
      variantName: selected ? variantLabel(selected, variantIdx) : null,
      stockQty: stock,
      qty,
    });
    openCart();
  }

  const perks = [
    { icon: TruckIcon, title: "ارسال سریع", desc: "بسته‌بندی ایمن و چندلایه" },
    { icon: ShieldCheckIcon, title: "اصالت کالا", desc: "ساخته دست هنرمندان ایرانی" },
    { icon: PackageIcon, title: "ضمانت سلامت", desc: "جبران کامل در صورت آسیب" },
  ];

  return (
    <div>
      {/* مسیر صفحه */}
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-[13px] text-stone-400 dark:text-stone-500">
        <Link href="/" className="transition hover:text-stone-700 dark:hover:text-stone-200">خانه</Link>
        <span>/</span>
        <Link href="/shop" className="transition hover:text-stone-700 dark:hover:text-stone-200">فروشگاه</Link>
        {product.category_name && (
          <>
            <span>/</span>
            <Link
              href={`/shop?category=${product.category_slug ?? ""}`}
              className="transition hover:text-stone-700 dark:hover:text-stone-200"
            >
              {product.category_name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-stone-600 dark:text-stone-300">{product.name}</span>
      </nav>

      <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-12">
        {/* گالری — کوچک‌تر شده */}
        <div className="lg:col-span-5">
          <div className="mx-auto w-full max-w-[340px] sm:max-w-[400px] lg:max-w-[420px]">
            <div
              className="relative aspect-square cursor-zoom-in overflow-hidden rounded-[28px] border border-stone-100 dark:border-white/10 bg-stone-50 dark:bg-white/5 shadow-sm"
              onClick={() => gallery.length > 0 && setLightboxOpen(true)}
            >
              {mainImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaUrl(mainImage.url)}
                  alt={mainImage.alt ?? product.name}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-stone-300 dark:text-stone-600">
                  بدون تصویر
                </div>
              )}
              {discountPercent > 0 && (
                <span className="absolute right-4 top-4 rounded-full bg-red-500 px-3 py-1 text-xs font-black text-white shadow">
                  {fmt(discountPercent)}٪ تخفیف
                </span>
              )}
            </div>

            {gallery.length > 1 && (
              <div className="mt-3 flex justify-center gap-2.5">
                {gallery.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    aria-label={`تصویر ${fmt(i + 1)}`}
                    className={`h-16 w-16 overflow-hidden rounded-2xl border-2 transition ${
                      i === imgIdx
                        ? "border-amber-700"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mediaUrl(img.url)} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* اطلاعات و باکس خرید */}
        <div className="lg:col-span-7">
          {product.category_name && (
            <Link
              href={`/shop?category=${product.category_slug ?? ""}`}
              className="text-xs font-bold tracking-wide text-amber-800 dark:text-amber-300"
            >
              {product.category_name}
            </Link>
          )}

          <h1 className="mt-2 text-2xl font-black leading-relaxed text-stone-900 dark:text-white/90 md:text-3xl">
            {product.name}
          </h1>

          {product.short_description && (
            <p className="mt-3 line-clamp-2 text-sm leading-7 text-stone-500 dark:text-stone-400">
              {product.short_description}
            </p>
          )}

          {/* قیمت */}
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {compareAt && <del className="text-lg text-stone-400 dark:text-stone-500">{fmt(compareAt)}</del>}
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-stone-900 dark:text-white/90">{fmt(price)}</span>
              <span className="text-sm text-stone-500 dark:text-stone-400">تومان</span>
            </div>
            {discountPercent > 0 && (
              <span className="rounded-full bg-red-50 dark:bg-red-500/15 px-2.5 py-1 text-xs font-black text-red-500 dark:text-red-400">
                {fmt(discountPercent)}٪ تخفیف
              </span>
            )}
          </div>

          {/* موجودی */}
          <div className="mt-3">
            {stock > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-emerald-600">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                {stock <= 3 ? `تنها ${fmt(stock)} عدد باقی مانده` : "موجود در انبار"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-red-500 dark:text-red-400">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                فعلاً ناموجود
              </span>
            )}
          </div>

          {/* واریانت‌ها */}
          {hasVariants && (
            <div className="mt-6">
              <span className="mb-2.5 block text-sm font-bold text-stone-700 dark:text-stone-200">انتخاب گزینه:</span>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v, i) => (
                  <button
                    key={(v.id as string | number) ?? i}
                    onClick={() => {
                      setVariantIdx(i);
                      setQty(1);
                    }}
                    className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                      i === variantIdx
                        ? "border-stone-900 bg-stone-900 text-white"
                        : "border-stone-200 bg-white text-stone-600 hover:border-stone-400"
                    }`}
                  >
                    {variantLabel(v, i)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* تعداد + افزودن به سبد (بدون دکمه مشاهده سبد) */}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex items-center justify-between rounded-2xl border border-stone-200 dark:border-white/15 bg-white dark:bg-char sm:w-36">
              <button
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                disabled={qty >= maxQty || stock <= 0}
                aria-label="افزایش تعداد"
                className="p-3.5 text-stone-600 dark:text-stone-300 transition hover:text-stone-900 dark:hover:text-white disabled:opacity-30"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
              <span className="min-w-8 text-center text-base font-black text-stone-900 dark:text-white/90">
                {fmt(qty)}
              </span>
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                aria-label="کاهش تعداد"
                className="p-3.5 text-stone-600 dark:text-stone-300 transition hover:text-stone-900 dark:hover:text-white disabled:opacity-30"
              >
                <MinusIcon className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={handleAdd}
              disabled={stock <= 0}
              className="flex flex-1 items-center justify-center gap-2.5 rounded-2xl bg-stone-900 dark:bg-white/90 dark:text-char px-6 py-4 text-base font-bold text-white shadow-lg shadow-stone-900/10 dark:shadow-black/30 transition hover:bg-stone-700 dark:hover:bg-stone-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none"
            >
              <CartIcon className="h-5 w-5" />
              {stock > 0 ? "افزودن به سبد خرید" : "ناموجود"}
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-stone-400 dark:text-stone-500 sm:text-right">
            با افزودن به سبد، سبد خرید برای شما باز می‌شود.
          </p>

          {/* مزیت‌ها */}
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {perks.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="flex items-center gap-3 rounded-2xl border border-stone-100 dark:border-white/10 bg-stone-50/70 dark:bg-white/5 p-3.5"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-800 dark:bg-white/10 dark:text-amber-300 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-[13px] font-bold text-stone-800 dark:text-white/85">{p.title}</span>
                    <span className="block text-[11px] text-stone-500 dark:text-stone-400">{p.desc}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* لایت‌باکس گالری تصاویر (تک‌نُسخه برای موبایل + دسکتاپ) */}
      {lightboxOpen && gallery.length > 0 && (
        <div className="fixed inset-0 z-[200]" onClick={() => setLightboxOpen(false)}>
          {/* پس‌زمینه تیره */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

          {/* ── موبایل: bottom-sheet ── */}
          <div className="absolute inset-x-0 bottom-0 top-14 z-[205] flex flex-col rounded-t-3xl bg-neutral-950/95 backdrop-blur-md transition-transform duration-300 ease-out md:hidden">
            {/* هدر */}
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-xs font-medium text-white/50">
                {imgIdx + 1}&nbsp;/&nbsp;{gallery.length}
              </span>
              <button
                onClick={() => setLightboxOpen(false)}
                aria-label="بستن"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* تصویر اصلی */}
            <div className="flex flex-1 items-center justify-center px-5 pb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(gallery[imgIdx]?.url ?? "")}
                alt={gallery[imgIdx]?.alt ?? product.name}
                className="max-h-[58vh] max-w-full rounded-2xl object-contain"
              />
            </div>

            {/* ناوبری + تامبنیل */}
            {gallery.length > 1 && (
              <div className="flex items-center justify-center gap-4 px-4 pb-5 pt-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setImgIdx((i) => (i - 1 + gallery.length) % gallery.length); }}
                  aria-label="تصویر قبلی"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>

                <div className="flex gap-2 overflow-x-auto">
                  {gallery.map((img, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setImgIdx(i); }}
                      aria-label={`تصویر ${fmt(i + 1)}`}
                      className={`h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                        i === imgIdx ? "border-amber-500" : "border-transparent opacity-50 hover:opacity-100"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mediaUrl(img.url)} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); setImgIdx((i) => (i + 1) % gallery.length); }}
                  aria-label="تصویر بعدی"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* ── دسکتاپ: پنل وسط صفحه ── */}
          <div
            className="absolute inset-0 z-[205] hidden items-center justify-center md:flex"
            onClick={(e) => e.stopPropagation()}
          >
            {/* دکمه بستن */}
            <button
              onClick={() => setLightboxOpen(false)}
              aria-label="بستن"
              className="absolute right-5 top-5 z-[210] flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* دکمه قبلی */}
            {gallery.length > 1 && (
              <button
                onClick={() => setImgIdx((i) => (i - 1 + gallery.length) % gallery.length)}
                aria-label="تصویر قبلی"
                className="absolute right-4 top-1/2 z-[210] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}

            {/* دکمه بعدی */}
            {gallery.length > 1 && (
              <button
                onClick={() => setImgIdx((i) => (i + 1) % gallery.length)}
                aria-label="تصویر بعدی"
                className="absolute left-4 top-1/2 z-[210] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}

            {/* تصویر اصلی + تامبنیل */}
            <div className="flex max-w-xl flex-col items-center">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mediaUrl(gallery[imgIdx]?.url ?? "")}
                  alt={gallery[imgIdx]?.alt ?? product.name}
                  className="max-h-[72vh] max-w-[56vw] rounded-2xl object-contain shadow-2xl"
                />
                {gallery.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    {imgIdx + 1} / {gallery.length}
                  </div>
                )}
              </div>

              {gallery.length > 1 && (
                <div className="mt-4 flex gap-2 rounded-2xl bg-white/5 p-2">
                  {gallery.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      aria-label={`تصویر ${fmt(i + 1)}`}
                      className={`h-14 w-14 overflow-hidden rounded-xl border-2 transition ${
                        i === imgIdx ? "border-amber-500" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mediaUrl(img.url)} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
