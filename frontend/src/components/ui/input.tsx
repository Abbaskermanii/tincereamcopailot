"use client";

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const base =
  "w-full rounded-xl border bg-surface px-4 py-2.5 text-[15px] placeholder:text-char-soft/60 " +
  "border-char/15 focus:border-lajvard focus:outline-none focus:ring-2 focus:ring-lajvard/25 " +
  "transition-shadow dark:border-white/20 dark:bg-black/30";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(base, className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(base, "min-h-24 resize-y", className)} {...props} />
));
Textarea.displayName = "Textarea";

export function Field({
  label,
  error,
  children,
  required,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-char dark:text-ink">
        {label}
        {required && <span className="text-clay"> *</span>}
      </span>
      {children}
      {error && <span className="block text-xs text-clay">{error}</span>}
    </label>
  );
}