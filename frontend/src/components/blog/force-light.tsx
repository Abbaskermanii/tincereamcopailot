"use client";

import { useEffect } from "react";

/** Forces light theme inside the blog section (magazine stays light, always). */
export function ForceLight() {
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    if (wasDark) root.classList.remove("dark");
    return () => {
      if (wasDark) root.classList.add("dark");
    };
  }, []);
  return null;
}
