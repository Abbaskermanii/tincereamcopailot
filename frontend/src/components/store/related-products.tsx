import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";
import { SectionHeading } from "@/components/ui/section-heading";

/** "You might also like" — same-category products (server component). */
export async function RelatedProducts({
  categorySlug,
  excludeSlug,
}: {
  categorySlug: string | null;
  excludeSlug: string;
}) {
  if (!categorySlug) return null;
  const data = await api.products({ category: categorySlug, page_size: 8 });
  const items = (data?.items ?? []).filter((p) => p.slug !== excludeSlug).slice(0, 4);
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="rel-h" className="mt-16">
      <SectionHeading title="ممکن است بپسندید" subtitle="از همین مجموعهٔ دست‌ساز" />
      <div id="rel-h" className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {items.map((p) => (
          <Link
            key={p.id}
            href={`/product/${p.slug}`}
            className="glaze-edge group overflow-hidden rounded-wobble bg-surface p-3 shadow-shelf transition-shadow hover:shadow-lifted dark:bg-black/25"
          >
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-slip dark:bg-black/30">
              {p.primary_image_url && (
                <Image
                  src={p.primary_image_url}
                  alt={p.name}
                  fill
                  sizes="(max-width:768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
            </div>
            <p className="line-clamp-1 pt-3 text-sm font-semibold">{p.name}</p>
            <p className="text-xs text-char-soft dark:text-ink-soft">
              {new Intl.NumberFormat("fa-IR").format(p.price)} تومان
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
