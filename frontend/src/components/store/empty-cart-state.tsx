"use client";

import React from "react";
import Link from "next/link";
import { Package, ShoppingCart, Truck, ShieldCheck, Star } from "lucide-react";

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