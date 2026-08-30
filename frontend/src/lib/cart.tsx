"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  stockQty: number;
  variantId?: string | null;
  variantName?: string | null;
  variantSku?: string | null;
  variantImageUrl?: string | null;
  cartItemId?: string | null;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (line: Omit<CartLine, "quantity">, qty?: number) => void;
  setQuantity: (productId: string, qty: number, variantId?: string | null) => void;
  remove: (productId: string, variantId?: string | null) => void;
  clear: () => void;
  lastAddedAt: number | null;
  variantSelections: Record<string, string>;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "tinceram.cart.v1";

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchServerCart(): Promise<CartLine[] | null> {
  const headers = getAuthHeaders();
  if (!headers.Authorization) return null;
  try {
    const { apiFetch } = await import("@/lib/api-client");
    const res = await apiFetch(`/cart`, { headers } as RequestInit);
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{
      id: string;
      product_id: string;
      variant_id: string | null;
      quantity: number;
      product: {
        id: string;
        name: string;
        slug: string;
        price: number;
        stock_qty: number;
        primary_image_url: string | null;
        variant_name: string | null;
        variant_sku: string | null;
        variant_image_url: string | null;
      };
    }>;
    return data.map((it) => ({
      productId: it.product_id,
      slug: it.product.slug,
      name: it.product.variant_name ? `${it.product.name} — ${it.product.variant_name}` : it.product.name,
      price: Number(it.product.price),
      imageUrl: it.product.primary_image_url,
      quantity: it.quantity,
      stockQty: Number(it.product.stock_qty),
      variantId: it.variant_id,
      variantName: it.product.variant_name,
      variantSku: it.product.variant_sku ?? null,
      variantImageUrl: it.product.variant_image_url ?? null,
      cartItemId: it.id,
    }));
  } catch {
    return null;
  }
}

async function serverAdd(line: Omit<CartLine, "quantity">, qty: number) {
  const headers = getAuthHeaders();
  if (!headers.Authorization) return;
  try {
    const { apiFetch } = await import("@/lib/api-client");
    await apiFetch(`/cart/items`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: line.productId, quantity: qty, variant_id: line.variantId ?? null }),
            _noDedup: true,
      _noCache: true,
    } as RequestInit);
  } catch {
    /* ignore */
  }
}

// از cartItemId مستقیم استفاده می‌کنیم تا fetch اضافی نزنیم
async function serverUpdateById(cartItemId: string, quantity: number) {
  const headers = getAuthHeaders();
  if (!headers.Authorization) return;
  try {
    const { apiFetch } = await import("@/lib/api-client");
    await apiFetch(`/cart/items/${cartItemId}`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
            _noDedup: true,
      _noCache: true,
    } as RequestInit);
  } catch {
    /* ignore */
  }
}

async function serverRemoveById(cartItemId: string) {
  const headers = getAuthHeaders();
  if (!headers.Authorization) return;
  try {
    const { apiFetch } = await import("@/lib/api-client");
    await apiFetch(`/cart/items/${cartItemId}`, {
      method: "DELETE",
      headers,
            _noDedup: true,
      _noCache: true,
    } as RequestInit);
  } catch {
    /* ignore */
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [lastAddedAt, setLastAddedAt] = useState<number | null>(null);

  // Hydrate: try server cart first for authenticated users, fallback to local
  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      if (token) {
        const serverLines = await fetchServerCart();
        if (!cancelled && serverLines !== null) {
          setLines(serverLines);
          setHydrated(true);
          // keep local as cache for offline
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(serverLines));
          } catch {}
          return;
        }
      }
      // Guest or server fetch failed → local
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!cancelled && raw) setLines(JSON.parse(raw));
      } catch {
        /* ignore corrupt storage */
      }
      if (!cancelled) setHydrated(true);
    }
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  // Merge guest cart into server on login — با throttle و dedup، فقط یک بار
  useEffect(() => {
    if (!hydrated) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token || lines.length === 0) return;
    const hasMerged = typeof window !== "undefined" ? sessionStorage.getItem("tinceram.cart.merged") : null;
    if (hasMerged) return;
    let cancelled = false;
    async function maybeMerge() {
      const serverLines = await fetchServerCart();
      if (cancelled || serverLines === null) return;
      const serverKeys = new Set(serverLines.map((l) => `${l.productId}::${l.variantId ?? ""}`));
      const missing = lines.filter((l) => !serverKeys.has(`${l.productId}::${l.variantId ?? ""}`));
      const toMerge = missing.length > 0 ? missing : lines;
      if (toMerge.length === 0) return;
      try {
        const { apiFetch } = await import("@/lib/api-client");
        const res = await apiFetch(`/cart/merge`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: toMerge.map((l) => ({ product_id: l.productId, quantity: l.quantity, variant_id: l.variantId ?? null })),
          }),
            _noDedup: true,
          _noCache: true,
        } as RequestInit);
        if (res.ok) {
          sessionStorage.setItem("tinceram.cart.merged", "1");
          const merged = await fetchServerCart();
          if (merged && !cancelled) setLines(merged);
        }
      } catch {
        /* ignore merge errors */
      }
    }
    const t = setTimeout(() => void maybeMerge(), 800);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, lines]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  // debounce map برای جلوگیری از اسپم stepper
  const pendingQty = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const add = useCallback((line: Omit<CartLine, "quantity">, qty = 1) => {
    const clampedQty = Math.max(1, Math.min(qty, line.stockQty || 99));
    setLines((prev) => {
      const keyMatch = (l: CartLine) => l.productId === line.productId && (l.variantId ?? null) === (line.variantId ?? null);
      const existing = prev.find(keyMatch);
      if (existing) {
        return prev.map((l) => (keyMatch(l) ? { ...l, quantity: Math.min(l.quantity + qty, l.stockQty || 99) } : l));
      }
      return [...prev, { ...line, quantity: clampedQty }];
    });
    setLastAddedAt(Date.now());
    void serverAdd(line, qty);
  }, []);

  const setQuantity = useCallback((productId: string, qty: number, variantId: string | null = null) => {
    const key = `${productId}::${variantId ?? ""}`;
    // optimistic update فوری
    setLines((prev) => {
      const target = prev.find((l) => l.productId === productId && (l.variantId ?? null) === (variantId ?? null));
      const clamped = Math.max(0, Math.min(qty, target?.stockQty ?? 99));
      return prev
        .map((l) => (l.productId === productId && (l.variantId ?? null) === (variantId ?? null) ? { ...l, quantity: clamped } : l))
        .filter((l) => l.quantity > 0);
    });

    // debounce 350ms برای جلوگیری از فشار به بک‌اند هنگام اسپم +/- 
    const existing = pendingQty.current.get(key);
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => {
      pendingQty.current.delete(key);
      // پیدا کردن cartItemId از آخرین state (باید از lines بخوانیم — اما optimistic داریم، پس از prev)
      // برای سادگی، fetch را با تاخیر انجام می‌دهیم و اگر کاربر دوباره تغییر داد، کنسل شده
      void (async () => {
        // نیاز به cartItemId — آن را از fetchServerCart نمی‌گیریم، از lines فعلی می‌خوانیم
        // چون lines در closure قدیمی است، از یک snapshot می‌گیریم
        // بهترین راه: دوباره lines را بخوانیم via setLines callback — اما برای سادگی، اگر qty==0 حذف وگرنه update با id
        // ما cartItemId را از خط فعلی می‌گیریم اگر موجود بود
        // fallback: اگر id نداشتیم، کاری نکن (add قبلاً انجام شده)
        // برای حذف
        if (qty <= 0) {
          // پیدا کردن id از آخرین lines (نیاز به دسترسی — از localStorage نخوانیم)
          // ساده: دوباره fetch نکن، فقط اگر خط حذف شده، سرور را هم حذف کن via productId lookup
          // برای دقت، از pendingQty key استفاده نمی‌کنیم و به جایش id را از lines می‌گیریم
          // چون id در دسترس نیست اینجا، یک fetch کوچک برای resolve لازم است اما با throttle
          // بهینه: اگر کاربر حذف کرد، بلافاصله حذف سرور
          const headers = getAuthHeaders();
          if (!headers.Authorization) return;
          // تلاش با cartItemId اگر در state بود — از آنجایی که we don't have it here, fetch once
          const cart = await fetchServerCart();
          const match = cart?.find((l) => l.productId === productId && (l.variantId ?? null) === (variantId ?? null));
          if (match?.cartItemId) await serverRemoveById(match.cartItemId);
          return;
        }
        const cart = await fetchServerCart();
        const match = cart?.find((l) => l.productId === productId && (l.variantId ?? null) === (variantId ?? null));
        if (match?.cartItemId) await serverUpdateById(match.cartItemId, qty);
      })();
    }, 350);
    pendingQty.current.set(key, t);
  }, []);

  const remove = useCallback((productId: string, variantId: string | null = null) => {
    let removedId: string | null = null;
    setLines((prev) => {
      const target = prev.find((l) => l.productId === productId && (l.variantId ?? null) === (variantId ?? null));
      removedId = target?.cartItemId ?? null;
      return prev.filter((l) => !(l.productId === productId && (l.variantId ?? null) === (variantId ?? null)));
    });
    // اگر id داشتیم، مستقیم حذف، وگرنه fallback
    if (removedId) void serverRemoveById(removedId);
    else {
      void (async () => {
        const cart = await fetchServerCart();
        const match = cart?.find((l) => l.productId === productId && (l.variantId ?? null) === (variantId ?? null));
        if (match?.cartItemId) await serverRemoveById(match.cartItemId);
      })();
    }
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    // کنسل همه pending qty
    for (const t of pendingQty.current.values()) clearTimeout(t);
    pendingQty.current.clear();
    const headers = getAuthHeaders();
    if (headers.Authorization) {
      void (async () => {
        try {
          const { apiFetch } = await import("@/lib/api-client");
          await apiFetch(`/cart`, { method: "DELETE", headers } as RequestInit);
        } catch {}
      })();
    }
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((acc, l) => acc + l.quantity, 0);
    const subtotal = lines.reduce((acc, l) => acc + l.price * l.quantity, 0);
    const variantSelections: Record<string, string> = {};
    for (const l of lines) if (l.variantId) variantSelections[l.productId] = l.variantId;
    return { lines, count, subtotal, add, setQuantity, remove, clear, lastAddedAt, variantSelections };
  }, [lines, add, setQuantity, remove, clear, lastAddedAt]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
