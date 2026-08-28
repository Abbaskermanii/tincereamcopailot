"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { API_URL, mediaUrl } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/local-store";
import { faPrice } from "@/lib/format";
import { ThemeToggle } from "./theme-toggle";

interface SearchHit {
  products: { slug: string; name: string; price: number; image_url: string | null }[];
  categories: { slug: string; name: string }[];
}

// NAV loaded from API; kept minimal brand pages here
const NAV = [
  { href: "/", label: "خانه" },
  { href: "/shop", label: "فروشگاه" },
  { href: "/about", label: "داستان ما" },
  { href: "/blog", label: "مقالات" },
  { href: "/contact", label: "تماس با ما" },
];

export function Header() {
  const router = useRouter();
  const { count, lastAddedAt } = useCart();
  const { ids } = useWishlist();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit | null>(null);
  const [open, setOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [user, setUser] = useState<{ full_name?: string; email?: string } | null>(null);
  const [bump, setBump] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  /* debounced instant search */
  useEffect(() => {
    if (!q.trim()) {
      setHits(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(q)}`);
        if (res.ok) setHits(await res.json());
      } catch {
        /* offline */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  /* close on outside click */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  /* add-to-cart micro-bounce */
  useEffect(() => {
    if (!lastAddedAt) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 450);
    return () => clearTimeout(t);
  }, [lastAddedAt]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      });
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-char/10 bg-slip/85 backdrop-blur-md dark:border-white/10 dark:bg-[#1c1a18]/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:gap-4 sm:px-4 md:h-20 md:px-6">
        <Link href="/" className="shrink-0 text-xl font-extrabold tracking-tight">
          تن‌سِرام
          <span className="mr-1 hidden align-middle text-xs font-medium text-clay sm:inline">.سرامیک دست‌ساز</span>
        </Link>

        <nav aria-label="ناوبری اصلی" className="hidden items-center gap-5 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="glaze-edge is-active rounded-xl px-2 py-1 text-sm font-medium text-char-soft transition-colors hover:text-lajvard dark:text-ink-soft dark:hover:text-lajvard-soft"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div ref={boxRef} className="relative mr-auto min-w-0 flex-1 max-w-xs">
          <Search size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-char-soft" />
          <input
            type="search"
            role="combobox"
            aria-expanded={open && !!hits}
            aria-controls="search-hits"
            aria-label="جست‌وجوی محصولات"
            placeholder="جست‌وجو…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && hits?.products[0]) {
                setOpen(false);
                router.push(`/product/${hits.products[0].slug}`);
              }
              if (e.key === "Escape") setOpen(false);
            }}
            className="h-10 w-full rounded-xl border border-char/15 bg-surface pr-9 pl-3 text-sm placeholder:text-char-soft/60 focus:border-lajvard focus:outline-none focus:ring-2 focus:ring-lajvard/25 dark:border-white/15 dark:bg-black/25"
          />
          {open && hits && (hits.products.length > 0 || hits.categories.length > 0) && (
            <div id="search-hits" className="absolute inset-x-0 top-12 overflow-hidden rounded-wobble border border-char/10 bg-surface shadow-lifted dark:border-white/15 dark:bg-[#262320]">
              {hits.products.map((p) => (
                <Link
                  key={p.slug}
                  href={`/product/${p.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-lajvard/8"
                >
                  {p.image_url ? (
                    <Image src={mediaUrl(p.image_url)} alt="" width={36} height={36} className="rounded-lg object-cover" />
                  ) : null}
                  <span className="flex-1 truncate text-sm">{p.name}</span>
                  <span className="text-xs text-char-soft">{faPrice(p.price)}</span>
                </Link>
              ))}
              {hits.categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/category/${c.slug}`}
                  onClick={() => setOpen(false)}
                  className="block border-t border-char/8 px-3 py-2 text-xs text-char-soft hover:bg-lajvard/8 dark:border-white/10"
                >
                  دستهٔ «{c.name}»
                </Link>
              ))}
            </div>
          )}
          {open && hits && hits.products.length === 0 && hits.categories.length === 0 && (
            <div className="absolute inset-x-0 top-12 rounded-wobble border border-char/10 bg-surface px-4 py-3 text-center text-xs text-char-soft shadow-lifted dark:border-white/15 dark:bg-[#262320] dark:text-ink-soft">
              نتیجه‌ای پیدا نشد؛ عبارت دیگری را امتحان کنید.
            </div>
          )}
        </div>

        <ThemeToggle />

        <Link
          href={user ? "/account" : "/auth"}
          aria-label={user ? "حساب کاربری" : "ورود یا ثبت‌نام"}
          className="inline-flex h-10 max-w-32 items-center gap-2 rounded-xl px-2 text-char-soft hover:bg-char/5 dark:text-ink-soft dark:hover:bg-white/10"
        >
          <UserRound size={19} />
          <span className="hidden truncate text-xs font-medium sm:inline">
            {user ? user.full_name || user.email : "ورود / ثبت‌نام"}
          </span>
        </Link>

        <Link
          href="/wishlist"
          aria-label="علاقه‌مندی‌ها"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-char-soft hover:bg-char/5 dark:text-ink-soft dark:hover:bg-white/10"
        >
          <Heart size={19} />
          {ids.length > 0 && (
            <span className="absolute -left-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-clay px-1 text-[11px] font-bold text-white num-latin">
              {ids.length}
            </span>
          )}
        </Link>

        <Link
          href="/cart"
          aria-label="سبد خرید"
          className={
            "relative inline-flex h-10 items-center gap-2 rounded-xl px-3 text-char-soft transition-all hover:bg-char/5 dark:text-ink-soft dark:hover:bg-white/10 " +
            (bump ? "scale-110 bg-firouzeh/20" : "")
          }
        >
          <ShoppingBag size={19} />
          {count > 0 && (
            <span
              className={
                "num-latin absolute -left-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-lajvard px-1 text-[11px] font-bold text-white transition-transform " +
                (bump ? "scale-125" : "")
              }
            >
              {count}
            </span>
          )}
        </Link>

        <button
          type="button"
          aria-label={mobileNavOpen ? "بستن منو" : "باز کردن منو"}
          aria-expanded={mobileNavOpen}
          onClick={() => setMobileNavOpen((value) => !value)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-char-soft hover:bg-char/5 lg:hidden dark:text-ink-soft dark:hover:bg-white/10"
        >
          {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {mobileNavOpen && (
        <nav aria-label="ناوبری موبایل" className="border-t border-char/10 bg-surface px-3 py-3 lg:hidden dark:border-white/10 dark:bg-[#262320]">
          <div className="mx-auto grid max-w-7xl gap-1 sm:grid-cols-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className="glaze-edge rounded-xl px-4 py-3 text-sm font-medium text-char-soft hover:bg-lajvard/8 hover:text-lajvard dark:text-ink-soft dark:hover:text-lajvard-soft"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
