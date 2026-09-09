"use client";

import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./auth-context";
import { apiFetch, apiJson, invalidateApiCache } from "./api-client";

// ─── Types ───

interface CartItem {
  key: string;
  productId: number | string;
  slug: string;
  name: string;
  price: number;
  imageUrl: string;
  variantId: string | number | null;
  variantName: string | null;
  variantSku?: string | null;
  variantImageUrl?: string | null;
  stockQty: number;
  qty: number;
  /** Server-side cart item id (UUID) - only when synced to API */
  serverId?: string;
  /** Timestamp when item was added - used for expiry */
  addedAt?: number;
}
interface CartState {
  items: CartItem[];
  isOpen: boolean;
  hydrated: boolean;
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: { productId: number | string; variantId: string | number | null } }
  | { type: "UPDATE_ITEM_QTY"; payload: { productId: number | string; variantId: string | number | null; qty: number } }
  | { type: "TOGGLE_OPEN" }
  | { type: "SET_OPEN" }
  | { type: "SET_CLOSE" }
  | { type: "CLEAR" }
  | { type: "SET_HYDRATED" }
  | { type: "REPLACE_ALL"; payload: CartItem[] };

// ─── Constants ───

const CART_STORAGE_KEY = "***";

const CART_EXPIRY_MS = 15 * 60 * 1000; // 15-minute cart expiry
function makeKey(productId: number | string, variantId: string | number | null): string {
  return `${productId}-${variantId ?? ""}`;
}

function parseKey(key: string): { productId: string; variantId: string | null } {
  const lastDash = key.lastIndexOf("-");
  if (lastDash === -1) return { productId: key, variantId: null };
  const productId = key.slice(0, lastDash);
  const variantId = key.slice(lastDash + 1) || null;
  return { productId, variantId };
}

function isValidProductId(id: unknown): boolean {
  if (id == null) return false;
  const s = String(id);
  return s !== "NaN" && s !== "undefined" && s !== "null" && s.length > 0;
}

// ─── Reducer ───

const initialState: CartState = { items: [], isOpen: false, hydrated: false };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const idx = state.items.findIndex(
        (i) => i.productId === action.payload.productId && i.variantId === action.payload.variantId
      );
      if (idx >= 0) {
        const existing = state.items[idx]!;
        const items = [...state.items];
        items[idx] = { ...existing, qty: Math.max(1, existing.qty + action.payload.qty) };
        return { ...state, items };
      }
      return { ...state, items: [...state.items, action.payload] };
    }
    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((i) => !(i.productId === action.payload.productId && i.variantId === action.payload.variantId)) };
    case "UPDATE_ITEM_QTY":
      return { ...state, items: state.items.map((i) => i.productId === action.payload.productId && i.variantId === action.payload.variantId ? { ...i, qty: Math.max(1, action.payload.qty) } : i) };
    case "REPLACE_ALL":
      return { ...state, items: action.payload };
    case "TOGGLE_OPEN": return { ...state, isOpen: !state.isOpen };
    case "SET_OPEN": return { ...state, isOpen: true };
    case "SET_CLOSE": return { ...state, isOpen: false };
    case "CLEAR": return { ...state, items: [] };
    case "SET_HYDRATED": return { ...state, hydrated: true };
    default: return state;
  }
}

// ─── API response → CartItem ───

interface ApiCartItem {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  product: { id: string; name: string; slug: string; price: number; stock_qty: number; primary_image_url: string | null; variant_name: string | null; variant_sku: string | null; variant_image_url: string | null; };
  created_at: string;
  updated_at: string;
}

function apiItemToLocal(a: ApiCartItem): CartItem {
  return {
    key: makeKey(a.product_id, a.variant_id),
    productId: a.product_id,
    slug: a.product.slug,
    name: a.product.variant_name ? `${a.product.name} - ${a.product.variant_name}` : a.product.name,
    price: a.product.price,
    imageUrl: a.product.primary_image_url ?? "",
    variantId: a.variant_id,
    variantName: a.product.variant_name,
    variantSku: a.product.variant_sku,
    variantImageUrl: a.product.variant_image_url,
    stockQty: a.product.stock_qty,
    qty: a.quantity,
    serverId: a.id,
  };
}

// ─── Context ───

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  addItem: (item: Omit<CartItem, "key"> & { key?: string; qty?: number }, qty?: number) => void;
  removeItem: (productIdOrKey: number | string, variantId?: string | number | null) => void;
  updateItemQty: (productIdOrKey: number | string, variantIdOrQty: string | number | null, qty?: number) => void;
  toggleOpen: () => void;
  clear: () => void;
  closeCart: () => void;
  openCart: () => void;
  setQty: (p: number | string, v: string | number | null, q?: number) => void;
  count: number;
  subtotal: number;
  items: CartItem[];
  isOpen: boolean;
  hydrated: boolean;
  add: (item: Omit<CartItem, "key"> & { key?: string }, qty?: number) => void;
  remove: (p: number | string, v?: string | number | null) => void;
  setQuantity: (p: number | string, q: number, v: string | number | null) => void;
  lines: CartItem[];
  variantSelections: Record<string, string | null>;
} | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

// ─── Provider ───

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated, loading: authLoading } = useAuth();
  const wasAuthedRef = useRef(false);
  const syncingRef = useRef(false);
  const hasHydratedRef = useRef(false);

  // Guest: hydrate from localStorage
  useEffect(() => {
    if (authLoading) return;
    if (hasHydratedRef.current) return; // only hydrate once
    if (isAuthenticated) return;
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const items = JSON.parse(raw) as CartItem[];
        if (Array.isArray(items)) {
          const now = Date.now(); const valid = items.filter((it) => isValidProductId(it.productId) && (!it.addedAt || now - it.addedAt < CART_EXPIRY_MS));
          dispatch({ type: "REPLACE_ALL", payload: valid });
        }
      }
    } catch { /* ignore */ }
    hasHydratedRef.current = true;
    dispatch({ type: "SET_HYDRATED" });
  }, [authLoading, isAuthenticated]);

  // Authenticated: load from API
  const loadServerCart = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    try {
      const items = await apiJson<ApiCartItem[]>("/cart", { _noCache: true } as RequestInit);
      dispatch({ type: "REPLACE_ALL", payload: items.map(apiItemToLocal) });
    } catch {
      try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        if (raw) {
          const items = JSON.parse(raw) as CartItem[];
          if (Array.isArray(items)) dispatch({ type: "REPLACE_ALL", payload: items.filter((it) => isValidProductId(it.productId)) });
        }
      } catch { /* ignore */ }
    } finally {
      syncingRef.current = false;
      hasHydratedRef.current = true;
      dispatch({ type: "SET_HYDRATED" });
    }
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    void loadServerCart();
  }, [authLoading, isAuthenticated, loadServerCart]);

  // Login transition: merge guest → server
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { wasAuthedRef.current = false; return; }
    if (wasAuthedRef.current) return;
    wasAuthedRef.current = true;
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return;
      const guestItems = JSON.parse(raw) as CartItem[];
      if (!Array.isArray(guestItems) || guestItems.length === 0) return;
      const valid = guestItems.filter((it) => isValidProductId(it.productId));
      if (valid.length === 0) return;
      apiJson<ApiCartItem[]>("/cart/merge", {
        method: "POST",
        body: JSON.stringify({ items: valid.map((it) => ({ product_id: String(it.productId), quantity: it.qty, variant_id: it.variantId != null ? String(it.variantId) : null })) }),
      }).then((merged) => {
        dispatch({ type: "REPLACE_ALL", payload: merged.map(apiItemToLocal) });
        localStorage.removeItem(CART_STORAGE_KEY);
        invalidateApiCache("/cart");
      }).catch(() => {});
    } catch { /* ignore */ }
  }, [authLoading, isAuthenticated]);

  // Persist guest cart to localStorage
  useEffect(() => {
    if (isAuthenticated) return;
    try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items)); } catch { /* ignore */ }
  }, [state.items, state.hydrated, isAuthenticated]);

  // Periodic expiry purge for guest cart (every 60s)
  useEffect(() => {
    if (isAuthenticated) return;
    const id = setInterval(() => {
      const now = Date.now();
      const expired = state.items.some((it) => it.addedAt && now - it.addedAt >= CART_EXPIRY_MS);
      if (expired) {
        const fresh = state.items.filter((it) => !it.addedAt || now - it.addedAt < CART_EXPIRY_MS);
        dispatch({ type: "REPLACE_ALL", payload: fresh });
      }
    }, 60_000);
    return () => clearInterval(id);
  }, [isAuthenticated, state.items]);

  // ── Actions ──

  const addItem = (raw: Omit<CartItem, "key"> & { key?: string; qty?: number }, extraQty?: number) => {
    if (!state.hydrated) return; // wait for hydration before adding
    const { qty: itemQty, ...rest } = raw;
    const key = raw.key ?? makeKey(raw.productId, raw.variantId);
    const resolvedQty = extraQty ?? itemQty ?? 1;
    const payload: CartItem = { ...rest, key, qty: resolvedQty, addedAt: Date.now() };
    dispatch({ type: "ADD_ITEM", payload });
    if (isAuthenticated) {
      apiFetch("/cart/items", {
        method: "POST",
        body: JSON.stringify({ product_id: String(raw.productId), quantity: resolvedQty, variant_id: raw.variantId != null ? String(raw.variantId) : null }),
      }).then(async (res) => {
        if (!res.ok) return;
        const apiItem: ApiCartItem = await res.json();
        dispatch({ type: "UPDATE_ITEM_QTY", payload: { productId: raw.productId, variantId: raw.variantId, qty: apiItem.quantity } });
        invalidateApiCache("/cart");
      }).catch(() => {});
    }
  };

  const removeItem = (productIdOrKey: number | string, variantId?: string | number | null) => {
    const resolved = typeof variantId === "undefined" ? parseKey(String(productIdOrKey)) : { productId: productIdOrKey, variantId: variantId ?? null };
    const target = state.items.find((it) => it.productId === resolved.productId && it.variantId === resolved.variantId);
    dispatch({ type: "REMOVE_ITEM", payload: { productId: resolved.productId, variantId: resolved.variantId } });
    if (isAuthenticated && target?.serverId) {
      apiFetch(`/cart/items/${target.serverId}`, { method: "DELETE" }).then(() => invalidateApiCache("/cart")).catch(() => {});
    }
  };

  const updateItemQty = (productIdOrKey: number | string, variantIdOrQty: string | number | null, qty?: number) => {
    let productId: number | string, resolvedVariantId: string | number | null, resolvedQty: number;
    if (typeof qty === "undefined") {
      const parsed = parseKey(String(productIdOrKey));
      productId = parsed.productId; resolvedVariantId = parsed.variantId; resolvedQty = Number(variantIdOrQty);
    } else {
      productId = productIdOrKey; resolvedVariantId = variantIdOrQty; resolvedQty = qty;
    }
    const target = state.items.find((it) => it.productId === productId && it.variantId === resolvedVariantId);
    dispatch({ type: "UPDATE_ITEM_QTY", payload: { productId, variantId: resolvedVariantId, qty: resolvedQty } });
    if (isAuthenticated && target?.serverId) {
      apiFetch(`/cart/items/${target.serverId}`, { method: "PATCH", body: JSON.stringify({ quantity: resolvedQty }) }).then(() => invalidateApiCache("/cart")).catch(() => {});
    }
  };

  const toggleOpen = () => dispatch({ type: "TOGGLE_OPEN" });
  const clear = useCallback(() => {
    dispatch({ type: "CLEAR" });
    if (isAuthenticated) apiFetch("/cart", { method: "DELETE" }).then(() => invalidateApiCache("/cart")).catch(() => {});
  }, [isAuthenticated]);
  const closeCart = () => dispatch({ type: "SET_CLOSE" });
  const openCart = () => dispatch({ type: "SET_OPEN" });
  const setQty = (p: number | string, v: string | number | null, q?: number) => updateItemQty(p, v, q);
  const count = state.items.reduce((a, i) => a + i.qty, 0);
  const subtotal = state.items.reduce((a, i) => a + i.price * i.qty, 0);
  const variantSelections: Record<string, string | null> = {};
  for (const item of state.items) {
    if (isValidProductId(item.productId) && item.variantId != null && String(item.variantId) !== "NaN") variantSelections[String(item.productId)] = String(item.variantId);
  }

  return (
    <CartContext.Provider value={{
      state, dispatch, addItem, removeItem, updateItemQty, toggleOpen, clear, closeCart, openCart, setQty,
      count, subtotal, items: state.items, isOpen: state.isOpen, hydrated: state.hydrated,
      add: addItem, remove: removeItem, setQuantity: (p, q, v) => updateItemQty(p, v, q),
      lines: state.items, variantSelections,
    }}>
      {children}
    </CartContext.Provider>
  );
}
