"use client";

import React from "react";
import { EmptyState } from "@/components/ui/empty-state";

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
