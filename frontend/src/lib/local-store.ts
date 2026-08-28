"use client";

import { useCallback, useEffect, useState } from "react";

const WISHLIST_KEY = "tinceram.wishlist.v1";
const RECENT_KEY = "tinceram.recent.v1";

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

export function useWishlist() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => setIds(read<string>(WISHLIST_KEY)), []);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("wishlist-changed"));
      return next;
    });
  }, []);

  return { ids, toggle, has: (id: string) => ids.includes(id) };
}

export interface RecentItem {
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
}

export function pushRecentlyViewed(item: RecentItem) {
  try {
    const list = read<RecentItem>(RECENT_KEY).filter((r) => r.slug !== item.slug);
    list.unshift(item);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 8)));
  } catch {
    /* storage unavailable */
  }
}

export function useRecentlyViewed(excludeSlug?: string): RecentItem[] {
  const [items, setItems] = useState<RecentItem[]>([]);
  useEffect(() => {
    setItems(read<RecentItem>(RECENT_KEY).filter((r) => r.slug !== excludeSlug));
  }, [excludeSlug]);
  return items;
}
