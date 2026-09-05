"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useCart } from "@/lib/cart";
import { mediaUrl } from "@/lib/api";
import { faPrice } from "@/lib/format";

interface WishlistItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
  category?: string;
}

interface WishlistEmptyStateProps {
  className?: string;
}

export function WishlistEmptyState({ className = "" }: WishlistEmptyStateProps) {
  return (
    <EmptyState
      title="لیست علاقه‌مندی شما خالی است"
      description="محصولات مورد علاقه خود را اینجا ذخیره کنید تا بعداً ببینید و خرید کنید."
      icon={<span className="text-4xl">🛒</span>}
      className={className}
      action={{
        label: "مشاهده فروشگاه",
        href: "/shop",
        variant: "secondary",
      }}
    />
  );
}

interface WishlistEmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: "primary" | "secondary";
  };
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-char/10 bg-char/5 p-8 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-char/10">
        {icon || (
          <div className="h-12 w-12 rounded-full bg-char/10 flex items-center justify-center">
            <span className="text-2xl">📦</span>
          </div>
        )}
      </div>

      <h3 className="mb-2 text-xl font-semibold text-char-800 dark:text-char-200">
        {title}
      </h3>

      {description && (
        <p className="mb-6 max-w-md text-center text-sm text-char-600 dark:text-char-400">
          {description}
        </p>
      )}

      {action && (
        <div className="flex gap-2">
          {action.onClick ? (
            <button
              onClick={action.onClick}
              className={cn(
                "inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                action.variant === "primary"
                  ? "bg-lajvard text-white hover:bg-lajvard/90 active:bg-lajvard/95"
                  : "bg-char/10 text-char-700 dark:bg-white/10 dark:text-char-300 hover:bg-char/20 dark:hover:bg-white/15"
              )}
            >
              {action.label}
            </button>
          ) : action.href ? (
            <Link
              href={action.href}
              className={cn(
                "inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                action.variant === "primary"
                  ? "bg-lajvard text-white hover:bg-lajvard/90 active:bg-lajvard/95"
                  : "bg-char/10 text-char-700 dark:bg-white/10 dark:text-char-300 hover:bg-char/20 dark:hover:bg-white/15"
              )}
            >
              {action.label}
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}