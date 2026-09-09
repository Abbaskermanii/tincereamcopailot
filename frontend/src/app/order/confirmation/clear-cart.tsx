"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart-context";

/**
 * Clears the cart (both local and server-side) only AFTER payment has been
 * verified and the user has landed on the confirmation page.
 * The checkout page no longer clears the cart before redirecting to the
 * gateway (C5 fix), so this is the only place where the cart is permanently
 * cleared on success. On failure the cart is retained.
 */
export function ClearCartOnConfirm() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
    // Clean up the pending snapshot as well.
    try {
      sessionStorage.removeItem("tinceram.pending-cart");
    } catch { /* ignore */ }
    // Notify other tabs / components that cart changed.
    try {
      window.dispatchEvent(new Event("storage"));
    } catch { /* ignore */ }
  }, []); // only once on mount
  return null;
}
