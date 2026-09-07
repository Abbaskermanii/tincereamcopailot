"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";

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
  | { type: "SET_HYDRATED" };

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

const initialState: CartState = {
  items: [],
  isOpen: false,
  hydrated: false,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItemIndex = state.items.findIndex(
        (item) =>
          item.productId === action.payload.productId &&
          item.variantId === action.payload.variantId
      );

      if (existingItemIndex >= 0) {
        const existing = state.items[existingItemIndex]!;
        const newItems = [...state.items];
        newItems[existingItemIndex] = {
          ...existing,
          qty: existing.qty + action.payload.qty,
        };
        return { ...state, items: newItems };
      }

      return { ...state, items: [...state.items, action.payload] };
    }

    case "REMOVE_ITEM": {
      return {
        ...state,
        items: state.items.filter(
          (item) =>
            !(item.productId === action.payload.productId && item.variantId === action.payload.variantId)
        ),
      };
    }

    case "UPDATE_ITEM_QTY": {
      return {
        ...state,
        items: state.items.map((item) =>
          item.productId === action.payload.productId && item.variantId === action.payload.variantId
            ? { ...item, qty: Math.max(1, action.payload.qty) }
            : item
        ),
      };
    }

    case "TOGGLE_OPEN": {
      return { ...state, isOpen: !state.isOpen };
    }

    case "SET_OPEN": {
      return { ...state, isOpen: true };
    }

    case "SET_CLOSE": {
      return { ...state, isOpen: false };
    }

    case "CLEAR": {
      return { ...state, items: [] };
    }

    case "SET_HYDRATED": {
      return { ...state, hydrated: true };
    }

    default:
      return state;
  }
}

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
  setQty: (productIdOrKey: number | string, variantIdOrQty: string | number | null, qty?: number) => void;
  count: number;
  subtotal: number;
  items: CartItem[];
  isOpen: boolean;
  hydrated: boolean;
  add: (item: Omit<CartItem, "key"> & { key?: string }, qty?: number) => void;
  remove: (productIdOrKey: number | string, variantId?: string | number | null) => void;
      setQuantity: (productId: number | string, qty: number, variantId: string | number | null) => void;
  lines: CartItem[];
  variantSelections: Record<string, string | null>;
} | null>(null);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  useEffect(() => {
    dispatch({ type: "SET_HYDRATED" });
  }, []);

  const addItem = (raw: Omit<CartItem, "key"> & { key?: string; qty?: number }, extraQty?: number) => {
    const { qty: itemQty, ...rest } = raw;
    const key = raw.key ?? makeKey(raw.productId, raw.variantId);
    const resolvedQty = extraQty ?? itemQty ?? 1;
    const payload: CartItem = { ...rest, key, qty: resolvedQty };
    dispatch({ type: "ADD_ITEM", payload });
  };

  const removeItem = (productIdOrKey: number | string, variantId?: string | number | null) => {
    const resolved = typeof variantId === "undefined"
      ? parseKey(String(productIdOrKey))
      : { productId: productIdOrKey, variantId: variantId ?? null };
    dispatch({ type: "REMOVE_ITEM", payload: { productId: resolved.productId, variantId: resolved.variantId } });
  };

  const updateItemQty = (productIdOrKey: number | string, variantIdOrQty: string | number | null, qty?: number) => {
    let productId: number | string;
    let resolvedVariantId: string | number | null;
    let resolvedQty: number;

    if (typeof qty === "undefined") {
      const parsed = parseKey(String(productIdOrKey));
      productId = parsed.productId;
      resolvedVariantId = parsed.variantId;
      resolvedQty = Number(variantIdOrQty);
    } else {
      productId = productIdOrKey;
      resolvedVariantId = variantIdOrQty;
      resolvedQty = qty;
    }

    dispatch({ type: "UPDATE_ITEM_QTY", payload: { productId, variantId: resolvedVariantId, qty: resolvedQty } });
  };

  const toggleOpen = () => {
    dispatch({ type: "TOGGLE_OPEN" });
  };

  const clear = () => {
    dispatch({ type: "CLEAR" });
  };

  const closeCart = () => {
    dispatch({ type: "SET_CLOSE" });
  };

  const openCart = () => {
    dispatch({ type: "SET_OPEN" });
  };

  const setQty = (productIdOrKey: number | string, variantIdOrQty: string | number | null, qty?: number) => {
    updateItemQty(productIdOrKey, variantIdOrQty, qty);
  };

  const count = state.items.reduce((acc, item) => acc + item.qty, 0);
  const subtotal = state.items.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const variantSelections: Record<string, string | null> = {};
  for (const item of state.items) {
    variantSelections[String(item.productId)] = item.variantId != null ? String(item.variantId) : null;
  }

  return (
    <CartContext.Provider value={{
      state,
      dispatch,
      addItem,
      removeItem,
      updateItemQty,
      toggleOpen,
      clear,
      closeCart,
      openCart,
      setQty,
      count,
      subtotal,
      items: state.items,
      isOpen: state.isOpen,
      hydrated: state.hydrated,
      add: addItem,
      remove: removeItem,
      setQuantity: (productId: number | string, qty: number, variantId: string | number | null) => {
        updateItemQty(productId, variantId, qty);
      },
      lines: state.items,
      variantSelections,
    }}>
      {children}
    </CartContext.Provider>
  );
}