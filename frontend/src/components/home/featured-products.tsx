"use client";

import Link from "next/link";
import { ProductCard } from "@/components/store/product-card";
import { EditorialHeading } from "@/components/ui/editorial-heading";
import { SmartCarousel } from "@/components/ui/smart-carousel";
import { ChevronLeft } from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number | null;
  short_description?: string | null;
  stock_qty: number;
  primary_image_url?: string | null;
  discount_percent?: number;
}

interface FeaturedProductsProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  products: Product[];
  viewAllHref?: string;
  headingVariant?: "default" | "centered" | "minimal" | "bold";
}

export function FeaturedProducts({
  title,
  subtitle,
  eyebrow,
  products,
  viewAllHref = "/shop",
  headingVariant = "default",
}: FeaturedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-10 md:py-14 lg:py-16" aria-labelledby="featured-products">
      <EditorialHeading
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        variant={headingVariant}
        action={
          <Link
            href={viewAllHref}
            className="group flex shrink-0 items-center gap-1 text-sm font-bold text-lajvard transition-colors hover:text-lajvard-deep dark:text-lajvard-soft dark:hover:text-white"
          >
            مشاهده همه
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          </Link>
        }
      />
      <SmartCarousel minCardWidth={260} maxCardWidth={280} gap={16} minCardHeight={330}>
        {products.slice(0, 12).map((p) => (
          <ProductCard
            key={p.id}
            id={p.id}
            name={p.name}
            slug={p.slug}
            price={p.price}
            compare_at_price={p.compare_at_price}
            image={p.primary_image_url}
            stock_qty={p.stock_qty}
          />
        ))}
      </SmartCarousel>
    </section>
  );
}
