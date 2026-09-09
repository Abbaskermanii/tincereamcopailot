"use client";

import React from "react";
import { ShoppingCart } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export function EmptyCartState() {
  return (
    <EmptyState
      title="سبد خرید شما خالی است"
      description="محصولات مورد علاقه خود را انتخاب کرده و به سبد خرید اضافه کنید."
      icon={<ShoppingCart size={40} className="text-lajvard" />}
      className="max-w-2xl"
      action={{
        label: "شروع خرید",
        href: "/shop",
        variant: "primary",
      }}
    />
  );
}