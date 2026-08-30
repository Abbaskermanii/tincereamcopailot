"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  const [isServer, setIsServer] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const syncLocalToServer = useCallback(
    async (serverIds: string[]) => {
      const local = read<string>(WISHLIST_KEY);
      const toAdd = local.filter((id) => !serverIds.includes(id));
      if (toAdd.length === 0 || !token) return;
      const { apiFetch } = await import("@/lib/api-client");
      // Batch sync: حداکثر 5 در هر بار برای جلوگیری از فشار
      for (const pid of toAdd.slice(0, 5)) {
        try {
          await apiFetch(`/wishlist/${pid}`, {
            method: "POST",
            _noDedup: true,
            _noCache: true,
          } as RequestInit);
        } catch {
          /* ignore sync errors */
        }
      }
    },
    [token],
  );

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (token) {
        setIsServer(true);
        try {
          const { apiFetch } = await import("@/lib/api-client");
          const res = await apiFetch(`/wishlist`, {} as RequestInit);
          if (!cancelled && res.ok) {
            const products = (await res.json()) as Array<{ id: string }>;
            const serverIds = products.map((p) => p.id);
            setIds(serverIds);
            void syncLocalToServer(serverIds);
            return;
          }
        } catch {
          /* fallback to local */
        }
        if (!cancelled) setIds(read<string>(WISHLIST_KEY));
      } else {
        setIsServer(false);
        setIds(read<string>(WISHLIST_KEY));
      }
    }
    void init();
    const onStorage = () => {
      if (!token) setIds(read<string>(WISHLIST_KEY));
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("wishlist-changed", onStorage as EventListener);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("wishlist-changed", onStorage as EventListener);
    };
  }, [token, syncLocalToServer]);

  const pendingToggle = useRef<Set<string>>(new Set());
  const toggle = useCallback(
    async (id: string) => {
      if (pendingToggle.current.has(id)) return; // جلوگیری از اسپم کلیک
      const t = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      let wasIn = false;
      // Optimistic update
      setIds((prev) => {
        wasIn = prev.includes(id);
        const next = wasIn ? prev.filter((i) => i !== id) : [...prev, id];
        if (!t) {
          localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
          window.dispatchEvent(new Event("wishlist-changed"));
        }
        return next;
      });

      if (t) {
        pendingToggle.current.add(id);
        try {
          const { apiFetch } = await import("@/lib/api-client");
          const method = wasIn ? "DELETE" : "POST";
          const res = await apiFetch(`/wishlist/${id}`, {
            method,
            _noDedup: true,
            _noCache: true,
          } as RequestInit);
          if (!res.ok) {
            setIds((prev) => {
              const reverted = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
              return reverted;
            });
          } else {
            window.dispatchEvent(new Event("wishlist-changed"));
          }
        } catch {
          setIds((prev) => {
            const reverted = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
            return reverted;
          });
        } finally {
          pendingToggle.current.delete(id);
        }
      }
    },
    [],
  );

  return { ids, toggle, has: (id: string) => ids.includes(id), isServer };
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
