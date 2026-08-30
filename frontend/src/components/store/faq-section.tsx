import { SectionHeading } from "@/components/ui/section-heading";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

type FAQSectionProps = {
  title: string;
  subtitle?: string;
  faq_items: { id: string; question: string; answer: string; category: string; sort_order: number; is_active: boolean }[];
  limit?: number;
};

export function FAQSection({ title, subtitle, faq_items, limit = 6 }: FAQSectionProps) {
  const items = faq_items.filter((i) => i.is_active).slice(0, limit);

  if (items.length === 0) return null;

  return (
    <section className="py-14" aria-labelledby="faq-section">
      <SectionHeading title={title} subtitle={subtitle} />
      <div className="space-y-3">
        <Accordion type="multiple">
          {items.map((item) => (
            <AccordionItem key={item.id} value={item.id} className="glaze-edge rounded-wobble bg-surface">
              <AccordionTrigger className="px-5 text-right text-base font-bold hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 leading-8 text-char-soft dark:text-ink-soft">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
