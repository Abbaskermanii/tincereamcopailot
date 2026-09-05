"use client";

import Link from "next/link";
import Image from "next/image";
import { X, Share2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { useWishlist } from "@/lib/local-store";
import { useEffect, useState } from "react";
import { mediaUrl, type ProductListItem } from "@/lib/api";
import { faPrice } from "@/lib/format";
import { useToast } from "@/components/ui/toast-provider";

export default function WishlistPage() {
  const { ids, toggle, isServer } = useWishlist();
  const [items, setItems] = useState<ProductListItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const { toast } = useToast();

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

  const shareWishlist = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `لیست علاقه‌مندی‌های من در تن‌سِرام — ${items.length} محصول`;
    if (navigator.share) {
      try {
        await navigator.share({ title: text, url });
      } catch {}
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast({ title: "لینک کپی شد", variant: "success" });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="flex items-center justify-between">
        <SectionHeading title="علاقه‌مندی‌ها" subtitle={subtitle} />
        {items.length > 0 && (
          <button
            type="button"
            onClick={shareWishlist}
            className="flex min-h-[40px] items-center gap-2 rounded-xl border border-char/20 px-4 text-sm hover:bg-char/5 dark:border-white/20"
          >
            <Share2 className="h-4 w-4" /> اشتراک‌گذاری
          </button>
        )}
      </div>
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
              <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
                <button
                  aria-label={`حذف ${p.name} از علاقه‌مندی‌ها`}
                  onClick={() => toggle(p.id)}
                  className="rounded-xl bg-black/40 p-1.5 text-white backdrop-blur hover:bg-black/60"
                >
                  <X size={15} />
                </button>
                <button
                  aria-label={`افزودن ${p.name} به سبد خرید`}
                  onClick={async () => {
                    try {
                      const { apiFetch } = await import("@/lib/api-client");
                      await apiFetch("/cart/items", { method: "POST", body: JSON.stringify({ product_id: p.id, quantity: 1 }) });
                      toast({ title: "به سبد اضافه شد", variant: "success" });
                    } catch {
                      toast({ title: "خطا در افزودن به سبد", variant: "error" });
                    }
                  }}
                  className="rounded-xl bg-firouzeh/90 p-1.5 text-white backdrop-blur hover:bg-firouzeh"
                >
                  <ShoppingCart size={15} />
                </button>
              </div>
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