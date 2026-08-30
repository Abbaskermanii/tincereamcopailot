"use client";

import { useEffect } from "react";

/**
 * Clears the persisted cart only AFTER payment has been verified and the user
 * has landed on the success page. The checkout page no longer clears the cart
 * before redirecting to the gateway (C5 fix), so this is the only place where
 * the cart is permanently cleared on success. On failure the cart is retained.
 */
export function ClearCartOnConfirm() {
  useEffect(() => {
    try {
      // Remove the main cart — the user now has a paid order.
      localStorage.removeItem("tinceram.cart.v1");
      // Clean up the pending snapshot as well.
      sessionStorage.removeItem("tinceram.pending-cart");
    } catch {
      /* ignore storage errors (e.g. SSR) */
    }
    // Also clear server-side cart for authenticated users (Phase 5)
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        void (async () => {
          const { API_URL } = await import("@/lib/api");
          await fetch(`${API_URL}/cart`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include",
          });
        })();
      }
    } catch {}
    // Notify other tabs / components that cart changed.
    try {
      window.dispatchEvent(new Event("storage"));
    } catch {}
  }, []);
  return null;
}
