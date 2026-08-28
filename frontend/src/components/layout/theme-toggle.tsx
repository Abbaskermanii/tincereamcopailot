"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <span className="inline-flex h-10 w-10" aria-hidden />;
  }

  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "حالت روشن" : "حالت تاریک"}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-char-soft transition-colors hover:bg-char/5 dark:text-ink-soft dark:hover:bg-white/10"
    >
      {isDark ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}
