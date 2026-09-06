import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { EditorialHeading } from "@/components/ui/editorial-heading";
import { CategoryTiles } from "@/components/store/category-section";

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url?: string | null;
  product_count?: number | null;
}

interface CategoryShowcaseProps {
  title: string;
  subtitle?: string;
  categories: Category[];
}

export function CategoryShowcase({ title, categories }: CategoryShowcaseProps) {
  if (categories.length === 0) return null;

  return (
    <section className="py-10 md:py-14 lg:py-16" aria-labelledby="category-showcase">
      <EditorialHeading
        title={title}
        variant="minimal"
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

      <CategoryTiles categories={categories} limit={12} />
    </section>
  );
}
