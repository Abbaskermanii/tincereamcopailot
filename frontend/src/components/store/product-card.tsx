"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Package } from "lucide-react";
import { mediaUrl } from "@/lib/api";
import { formatPrice } from "@/lib/format";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number | null;
  image?: string | null;
  category?: string;
  stock_qty?: number;
  /** @deprecated kept for backward compat, no longer used */
  compact?: boolean;
  isOnWishlist?: boolean;
  wishlistAction?: () => void;
}

export function ProductCard({
  name,
  slug,
  price,
  compare_at_price,
  image,
  category,
  stock_qty,
  isOnWishlist = false,
  wishlistAction,
}: ProductCardProps) {
  const productImage = image ? mediaUrl(image) : null;
  const hasDiscount =
    compare_at_price != null && compare_at_price > price;
  const discountPct = hasDiscount
    ? Math.round(((compare_at_price! - price) / compare_at_price!) * 100)
    : 0;
  const isOutOfStock = stock_qty != null && stock_qty <= 0;

  return (
    <Link
      href={`/product/${slug}`}
      className="group glaze-edge flex h-full w-full flex-col overflow-hidden rounded-wobble-card hover:-translate-y-0.5 bg-surface shadow-shelf transition-all duration-300 hover:border-lajvard/40 hover:shadow-lifted dark:bg-[#262320] dark:hover:border-lajvard-soft/40 border border-transparent"
    >
      {/* Image Container — fixed aspect ratio */}
      <div className="relative aspect-square shrink-0 overflow-hidden bg-surface dark:bg-[#1c1a18]">
        {productImage ? (
          <Image
            src={productImage}
            alt={name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-8 w-8 text-char/20 dark:text-white/10" strokeWidth={1.2} />
          </div>
        )}

        {/* Discount badge — reserved space via absolute positioning */}
        {hasDiscount && (
          <span className="absolute right-2 top-2 z-10 flex items-center gap-0.5 rounded-md bg-clay px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
            {discountPct}٪-
          </span>
        )}

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-char/50 backdrop-blur-sm">
            <span className="rounded-md bg-white/90 px-3 py-1 text-[11px] font-bold text-char shadow-lg dark:bg-char/90 dark:text-white">
              ناموجود
            </span>
          </div>
        )}

        {/* Wishlist Button */}
        {wishlistAction && (
          <button
            onClick={(e) => {
              e.preventDefault();
              wishlistAction();
            }}
            className="absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-md bg-white/80 shadow-md backdrop-blur-sm transition-all hover:scale-110 hover:bg-white active:scale-95 dark:bg-char/80 dark:hover:bg-char"
            aria-label="افزودن به لیست علاقه‌مندی"
          >
            <Heart
              className={`h-3.5 w-3.5 ${
                isOnWishlist
                  ? "fill-clay text-clay"
                  : "text-char-soft dark:text-white/60"
              }`}
              strokeWidth={2}
            />
          </button>
        )}
      </div>

      {/* Content — flex-col with fixed structure */}
      <div className="flex min-h-0 flex-1 flex-col p-2">
        {/* Category — fixed height row, hidden when empty to avoid shifting */}
        <div className="mb-1 h-4">
          {category && (
            <span className="inline-block w-fit rounded bg-lajvard/8 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-lajvard dark:bg-lajvard-soft/15 dark:text-lajvard-soft">
              {category}
            </span>
          )}
        </div>

        {/* Title — exactly 2 lines, no more */}
        <h3 className="mb-1 line-clamp-2 min-h-[2.5rem] text-[13px] font-bold leading-[1.3] text-char-800 transition-colors group-hover:text-lajvard dark:text-white/90 dark:group-hover:text-lajvard-soft">
          {name}
        </h3>

        {/* Price — pinned to bottom */}
        <div className="mt-auto">
          {hasDiscount && (
            <span className="text-[10px] text-char-soft line-through dark:text-white/40">
              {formatPrice(compare_at_price!)}
            </span>
          )}
          <span className="block text-sm font-extrabold text-lajvard dark:text-lajvard-soft">
            {formatPrice(price)}
          </span>
        </div>
      </div>
    </Link>
  );
}
