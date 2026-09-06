"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useCart } from "@/lib/cart";
import { mediaUrl } from "@/lib/api";
import { faPrice } from "@/lib/format";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

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
