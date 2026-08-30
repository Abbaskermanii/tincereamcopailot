import { ProductCard } from "./product-card";
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
    <section className="py-14" aria-labelledby={`prod-section-new`}>
      <SectionHeading title={title} subtitle={subtitle} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}