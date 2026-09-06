import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { EditorialHeading } from "@/components/ui/editorial-heading";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
  sort_order?: number;
  is_active?: boolean;
}

interface FaqSectionProps {
  title: string;
  subtitle?: string;
  faq_items: FaqItem[];
  limit?: number;
}

export function FaqSection({ title, subtitle, faq_items, limit = 6 }: FaqSectionProps) {
  const items = faq_items
    .filter((i) => i.is_active !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .slice(0, limit);

  if (items.length === 0) return null;

  return (
    <section className="py-10 md:py-14 lg:py-16" aria-labelledby="faq-section">
      <EditorialHeading
        eyebrow="پرسش‌ها"
        title={title}
        subtitle={subtitle}
        variant="centered"
        action={
          <Link
            href="/faq"
            className="group inline-flex shrink-0 items-center gap-1 text-sm font-bold text-lajvard transition-colors hover:text-lajvard-deep dark:text-lajvard-soft dark:hover:text-white"
          >
            مشاهده سوالات بیشتر
            <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
        }
      />
      <div className="mx-auto max-w-4xl">
        <Accordion type="single" collapsible className="space-y-3">
          {items.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="rounded-wobble-card border border-char/5 bg-surface px-6 transition-colors hover:border-char/10 dark:border-white/5 dark:bg-[#262320] dark:hover:border-white/10"
            >
              <AccordionTrigger className="py-5 text-right text-sm font-bold hover:no-underline hover:text-kiln-clay dark:hover:text-clay-soft md:text-lg md:leading-8">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-sm leading-8 text-char-soft dark:text-white/55 md:text-base">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
