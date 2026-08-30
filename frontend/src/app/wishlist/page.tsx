"use client";

import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { useWishlist } from "@/lib/local-store";
import { useEffect, useState } from "react";
import { mediaUrl, type ProductListItem } from "@/lib/api";
import { faPrice } from "@/lib/format";

export default function WishlistPage() {
  const { ids, toggle, isServer } = useWishlist();
  const [items, setItems] = useState<ProductListItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    async function loadByIds() {
      if (ids.length === 0) {
        setItems([]);
        setLoaded(true);
        return;
      }
      // Authenticated: fetch directly from server wishlist (authoritative, cross-device)
      if (isServer) {
        try {
          const { apiFetch } = await import("@/lib/api-client");
          const res = await apiFetch(`/wishlist`, { signal: controller.signal } as RequestInit);
          if (!cancelled && res.ok) {
            const products = (await res.json()) as Array<{
              id: string;
              name: string;
              slug: string;
              price: number;
              primary_image_url?: string | null;
              images?: Array<{ url: string; is_primary: boolean }>;
            }>;
            const mapped: ProductListItem[] = products.map((p) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              price: Number(p.price),
              compare_at_price: null,
              short_description: null,
              stock_qty: 1,
              primary_image_url:
                p.primary_image_url ?? (p.images?.find((i) => i.is_primary)?.url ?? p.images?.[0]?.url ?? null),
            }));
            setItems(mapped);
            setLoaded(true);
            return;
          }
        } catch (e) {
          if ((e as Error).name === "AbortError") return;
        }
      }
      // Guest or fallback: fetch catalog and filter by ids — با کش 60s و dedup
      try {
        const { apiFetch } = await import("@/lib/api-client");
        const res = await apiFetch(`/products?page_size=48`, { signal: controller.signal } as RequestInit);
        if (!cancelled && res.ok) {
          const data = await res.json();
          setItems(data.items.filter((i: ProductListItem) => ids.includes(i.id)));
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
      if (!cancelled) setLoaded(true);
    }
    void loadByIds();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [ids, isServer]);

  if (!loaded || (ids.length > 0 && items.length === 0)) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <SectionHeading title="علاقه‌مندی‌ها" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[0, 1].map((i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="aspect-square rounded-xl bg-char/8 dark:bg-white/10" />
              <div className="h-4 w-3/4 rounded bg-char/8 dark:bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const subtitle = isServer
    ? "لیست ذخیره‌شده در حساب شما — در همه دستگاه‌ها همگام"
    : "لیست محلی مرورگر شما — بدون نیاز به حساب کاربری";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <SectionHeading title="علاقه‌مندی‌ها" subtitle={subtitle} />
      {items.length === 0 ? (
        <EmptyState
          title="هنوز چیزی نشان نکرده‌اید"
          description="با زدن قلب روی هر محصول، آن را برای بعد نگه دارید."
          action={<Button onClick={() => (window.location.href = "/")}>رفتن به فروشگاه</Button>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.map((p) => (
            <div key={p.id} className="glaze-edge relative overflow-hidden rounded-wobble bg-surface p-3 shadow-shelf">
              <button
                aria-label={`حذف ${p.name} از علاقه‌مندی‌ها`}
                onClick={() => toggle(p.id)}
                className="absolute left-3 top-3 z-10 rounded-xl bg-black/40 p-1.5 text-white backdrop-blur hover:bg-black/60"
              >
                <X size={15} />
              </button>
              <Link href={`/product/${p.slug}`} className="block">
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-slip dark:bg-surface">
                  {p.primary_image_url && (
                    <Image src={mediaUrl(p.primary_image_url)} alt={p.name} fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover" />
                  )}
                </div>
                <p className="line-clamp-1 pt-3 font-semibold">{p.name}</p>
                <p className="text-sm text-char-soft dark:text-ink-soft">{faPrice(p.price)}</p>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}