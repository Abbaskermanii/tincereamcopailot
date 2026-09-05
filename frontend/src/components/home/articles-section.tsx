import Link from "next/link";
import { EditorialHeading } from "@/components/ui/editorial-heading";
import { SmartCarousel } from "@/components/ui/smart-carousel";
import { ArticleCard, ArticleCardData } from "@/components/blog/article-card";
import { ChevronLeft } from "lucide-react";

interface ArticlesSectionProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  articles: ArticleCardData[];
}

export function ArticlesSection({ title, subtitle, eyebrow, articles }: ArticlesSectionProps) {
  if (articles.length === 0) return null;

  const display = articles.slice(0, 8);

  return (
    <section className="py-10 md:py-14 lg:py-16" aria-labelledby="articles-section">
      <EditorialHeading
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        variant="minimal"
        action={
          <Link
            href="/blog"
            className="group flex shrink-0 items-center gap-1 text-sm font-bold text-lajvard transition-colors hover:text-lajvard-deep dark:text-lajvard-soft dark:hover:text-white"
          >
            مشاهده همه مقالات
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          </Link>
        }
      />
      <SmartCarousel minCardWidth={280} gap={14}>
        {display.map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
      </SmartCarousel>
    </section>
  );
}
