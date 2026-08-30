"use client";

import { useEffect } from "react";

/**
 * On payment failure we guarantee the cart is NOT lost (C5). If the main
 * cart was somehow cleared, restore it from the pending snapshot saved at
 * checkout time. Otherwise leave the existing cart untouched.
 */
export function RestoreCartOnFailure() {
  useEffect(() => {
    try {
      const cart = localStorage.getItem("tinceram.cart.v1");
      const pending = sessionStorage.getItem("tinceram.pending-cart");
      if ((!cart || cart === "[]") && pending) {
        localStorage.setItem("tinceram.cart.v1", pending);
        window.dispatchEvent(new Event("storage"));
      }
    } catch {}
  }, []);
  return null;
}
