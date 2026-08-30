import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PriceTag } from "@/components/ui/price-tag";
import { mediaUrl } from "@/lib/api";

export interface CardProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  stock_qty: number;
  primary_image_url: string | null;
}

export function ProductCard({ product }: { product: CardProduct }) {
  const discounted =
    product.compare_at_price && product.compare_at_price > product.price;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block focus-visible:outline-none"
      aria-label={product.name}
    >
      <article className="glaze-edge h-full rounded-wobble bg-surface p-3 shadow-shelf transition-shadow duration-300 hover:shadow-lifted">
        <div className="kiln-reveal relative aspect-square overflow-hidden rounded-2xl bg-slip dark:bg-surface">
          {product.primary_image_url ? (
            <Image
              src={mediaUrl(product.primary_image_url)}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : null}
          <div className="absolute right-2 top-2 flex flex-col gap-1">
            {discounted && <Badge tone="warm">تخفیف</Badge>}
            {product.stock_qty === 0 && <Badge tone="muted">ناموجود</Badge>}
            {product.stock_qty > 0 && product.stock_qty <= 3 && (
              <Badge tone="warm">فقط {product.stock_qty} عدد</Badge>
            )}
          </div>
        </div>
        <div className="space-y-1.5 px-1 pt-3 pb-1">
          <h3 className="line-clamp-1 font-semibold">{product.name}</h3>
          <PriceTag price={product.price} compareAtPrice={product.compare_at_price} />
        </div>
      </article>
    </Link>
  );
}