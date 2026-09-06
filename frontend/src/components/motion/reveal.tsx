"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: React.ReactNode;
  /** Extra transition delay in ms — for staggering siblings */
  delay?: number;
  /** Slide direction */
  from?: "bottom" | "right" | "left" | "none";
  className?: string;
  as?: "div" | "section" | "li";
}

const FROM: Record<NonNullable<RevealProps["from"]>, string> = {
  bottom: "translate-y-8",
  right: "translate-x-8",
  left: "-translate-x-8",
  none: "",
};

/** Fade-and-rise on scroll via IntersectionObserver. Respects reduced motion. */
export function Reveal({ children, delay = 0, from = "bottom", className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
        visible ? "opacity-100 translate-x-0 translate-y-0" : cn("opacity-0", FROM[from]),
        className,
      )}
    >
      {children}
    </div>
  );
}
