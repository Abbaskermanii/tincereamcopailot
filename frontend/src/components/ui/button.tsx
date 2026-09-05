"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-lajvard text-slip hover:bg-lajvard-deep dark:bg-lajvard-soft dark:text-char",
  secondary:
    "bg-transparent text-lajvard border border-lajvard/60 hover:bg-lajvard/10 dark:text-lajvard-soft dark:border-lajvard-soft/50",
  ghost:
    "bg-transparent text-char-soft hover:bg-char/5 dark:text-ink dark:hover:bg-white/10",
  danger: "bg-clay text-white hover:bg-copper",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-[15px]",
  lg: "h-14 px-8 text-base",
  icon: "h-9 w-9 p-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "glaze-edge inline-flex select-none items-center justify-center gap-2 font-medium",
        "transition-colors duration-200 disabled:pointer-events-none disabled:opacity-40",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
