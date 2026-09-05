"use client";

import { ProductCard } from "./product-card";
import { ProductSlider } from "./product-slider";
import { SectionHeading } from "@/components/ui/section-heading";

type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  short_description: string | null;
  stock_qty: number;
  primary_image_url: string | null;
};

type ProductSectionProps = {
  title: string;
  subtitle?: string;
  products: ProductListItem[];
};

export function ProductSection({ title, subtitle, products }: ProductSectionProps) {
  if (products.length === 0) return null;
  return (
    <section className="py-14" aria-labelledby="prod-section">
      <SectionHeading title={title} subtitle={subtitle} />
      <ProductSlider>
        {products.map((p) => (
          <ProductCard
            key={p.id}
            id={p.id}
            name={p.name}
            slug={p.slug}
            price={p.price}
            compare_at_price={p.compare_at_price}
            image={p.primary_image_url}
            stock_qty={p.stock_qty}
            compact
          />
        ))}
      </ProductSlider>
    </section>
  );
}
