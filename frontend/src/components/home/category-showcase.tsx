import Link from "next/link";
import Image from "next/image";
import { mediaUrl } from "@/lib/api";
import { EditorialHeading } from "@/components/ui/editorial-heading";
import { ChevronLeft } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url?: string | null;
  product_count?: number;
}

interface CategoryShowcaseProps {
  title: string;
  subtitle?: string;
  categories: Category[];
}

export function CategoryShowcase({ title, subtitle, categories }: CategoryShowcaseProps) {
  if (categories.length === 0) return null;

  const [first, ...rest] = categories;

  return (
    <section className="py-10 md:py-14 lg:py-16" aria-labelledby="category-showcase">
      <EditorialHeading
        eyebrow="مجموعه‌ها"
        title={title}
        subtitle={subtitle}
        variant="bold"
        action={
          <Link
            href="/shop"
            className="group flex shrink-0 items-center gap-1 text-sm font-bold text-lajvard transition-colors hover:text-lajvard-deep dark:text-lajvard-soft dark:hover:text-white"
          >
            مشاهده همه
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {/* First category - larger */}
        {first && (
          <Link
            href={`/category/${first.slug}`}
            className="group kiln-reveal relative col-span-2 row-span-2 overflow-hidden rounded-2xl bg-slip dark:bg-surface md:rounded-3xl"
          >
            <div className="relative aspect-[4/3] md:aspect-square">
              {first.image_url ? (
                <Image
                  src={mediaUrl(first.image_url)}
                  alt={`مجموعهٔ ${first.name}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-kiln-clay/5 to-lajvard/5 dark:from-clay-soft/5 dark:to-lajvard-soft/5">
                  <svg className="h-16 w-16 text-char/10 dark:text-white/5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-3-3-1.4 1.4L7 14h2v2H7zm5-10l2.29 2.29L15.71 5z" />
                  </svg>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-4 md:p-6">
                <p className="text-lg font-extrabold text-white md:text-xl">{first.name}</p>
                {first.product_count != null && first.product_count > 0 && (
                  <p className="mt-1 text-xs text-white/60">{first.product_count} محصول</p>
                )}
              </div>
            </div>
          </Link>
        )}

        {/* Rest of categories */}
        {rest.slice(0, 3).map((c) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className="group kiln-reveal relative overflow-hidden rounded-2xl bg-slip dark:bg-surface"
          >
            <div className="relative aspect-[3/4]">
              {c.image_url ? (
                <Image
                  src={mediaUrl(c.image_url)}
                  alt={`مجموعهٔ ${c.name}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-kiln-clay/5 to-lajvard/5 dark:from-clay-soft/5 dark:to-lajvard-soft/5">
                  <svg className="h-12 w-12 text-char/10 dark:text-white/5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-3-3-1.4 1.4L7 14h2v2H7zm5-10l2.29 2.29L15.71 5z" />
                  </svg>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-3 md:p-4">
                <p className="text-sm font-bold text-white md:text-base">{c.name}</p>
                {c.product_count != null && c.product_count > 0 && (
                  <p className="mt-0.5 text-[10px] text-white/55">{c.product_count} محصول</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
