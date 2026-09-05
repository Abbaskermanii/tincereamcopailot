import { ProductCard } from "./product-card";

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

export function ShopProductGrid({ items }: { items: ProductListItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map((p) => (
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
    </div>
  );
}
