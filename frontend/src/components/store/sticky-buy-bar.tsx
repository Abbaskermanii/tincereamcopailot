"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import { faPrice } from "@/lib/format";

/** Sticky add-to-cart bar for mobile on the PDP. */
export function StickyBuyBar({
  name,
  price,
}: {
  name: string;
  price: number;
}) {
  const count = useCart().count;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-char/10 bg-slip/95 px-4 py-3 shadow-lifted backdrop-blur md:hidden dark:border-white/10 dark:bg-[#1c1a18]/95">
      <div className="min-w-0">
        <p className="truncate text-xs text-char-soft dark:text-ink-soft">{name}</p>
        <p className="text-sm font-bold text-lajvard dark:text-lajvard-soft">{faPrice(price)}</p>
      </div>
      <Link
        href="#buy-box"
        className="glaze-edge inline-flex h-11 items-center gap-2 bg-lajvard px-5 font-medium text-white dark:bg-lajvard-soft dark:text-char"
      >
        <ShoppingBag size={18} />
        خرید
        {count > 0 && (
          <span className="num-latin rounded-full bg-white/25 px-1.5 text-xs">{count}</span>
        )}
      </Link>
    </div>
  );
}
