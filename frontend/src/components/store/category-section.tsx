import Link from "next/link";
import Image from "next/image";
import { mediaUrl } from "@/lib/api";

type Category = {
  id?: string;
  name: string;
  slug: string;
  image_url?: string | null;
  description?: string | null;
};

type CategorySectionProps = {
  title: string;
  subtitle?: string;
  categories: Category[];
  limit?: number;
};

export function CategorySection({ title, subtitle, categories, limit = 8 }: CategorySectionProps) {
  const items = categories.slice(0, limit);

  if (items.length === 0) return null;

  return (
    <section className="py-14" aria-labelledby="category-section">
      <h2 className="sr-only">{title}</h2>
      {subtitle && (
        <div className="mb-8">
          <h3 className="text-2xl font-extrabold md:text-3xl">{title}</h3>
          <p className="mt-2 text-sm text-char-soft dark:text-ink-soft">{subtitle}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {items.map((c) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className="group flex flex-col h-64"
          >
            <div className="kiln-reveal relative flex-1 aspect-[4/5] overflow-hidden rounded-2xl bg-slip dark:bg-surface">
              {c.image_url ? (
                <Image
                  src={mediaUrl(c.image_url)}
                  alt={`مجموعهٔ ${c.name}`}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-char-soft/50 dark:text-ink-soft/50">
                  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-3-3l-1.4 1.4L7 14h2v2H7zm5-10l2.29 2.29L15.71 5z" />
                  </svg>
                </div>
              )}
            </div>
            <p className="pt-3 pb-1 text-center font-semibold text-sm transition-colors group-hover:text-lajvard dark:group-hover:text-lajvard-soft">{c.name}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
