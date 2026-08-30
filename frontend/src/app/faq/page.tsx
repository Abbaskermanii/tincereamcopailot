import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const revalidate = 120;

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
}

async function getFaq(): Promise<FaqItem[]> {
  try {
    const res = await fetch(`${process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/faq`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as FaqItem[];
    return data.filter((i) => i.is_active).sort((a, b) => a.sort_order - b.sort_order);
  } catch {
    return [];
  }
}

const FALLBACK: [string, string][] = [
  ["چقدر زمان می‌برد سفارش برسد؟", "سفارش‌ها پس از آماده‌سازی با بسته‌بندی ایمن، معمولاً ۲ تا ۵ روز کاری زمان می‌برند."],
  ["آیا هر قطعه دقیقاً شبیه تصویر است؟", "خیر؛ هر قطعه دست‌ساز است و تفاوت‌های ظریف، امضای دست سازنده‌ی آن است."],
  ["شرایط مرجوعی چیست؟", "در صورت آسیب‌دیدگی در حمل، حداکثر ۲۴ ساعت پس از تحویل با پشتیبانی تماس بگیرید."],
];

export default async function FaqPage() {
  const items = await getFaq();
  const hasBackend = items.length > 0;

  // Group by category if backend provides it
  const grouped = hasBackend
    ? items.reduce<Record<string, FaqItem[]>>((acc, cur) => {
        const cat = cur.category || "عمومی";
        acc[cat] = acc[cat] ?? [];
        acc[cat].push(cur);
        return acc;
      }, {})
    : null;

  const jsonLd = hasBackend
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      }
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <p className="text-sm text-ink-soft">پشتیبانی / پرسش‌ها</p>
      <h1 className="mt-2 text-4xl font-extrabold">پرسش‌های متداول</h1>
      <p className="mt-3 text-sm leading-7 text-char-soft dark:text-ink-soft">
        پاسخ پرسش‌های پرتکرار را اینجا پیدا کنید؛ اگر پاسختان نبود از طریق صفحهٔ تماس با ما بپرسید.
      </p>

      {hasBackend ? (
        <div className="mt-10 space-y-8">
          {Object.entries(grouped!).map(([category, faqs]) => (
            <section key={category} aria-labelledby={`cat-${category}`}>
              {Object.keys(grouped!).length > 1 && (
                <h2 id={`cat-${category}`} className="mb-3 text-sm font-bold text-char-soft dark:text-ink-soft">
                  {category}
                </h2>
              )}
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((f) => (
                  <AccordionItem key={f.id} value={f.id} className="glaze-edge rounded-wobble bg-surface">
                    <AccordionTrigger className="px-5 text-right text-base font-bold hover:no-underline">
                      {f.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-5 leading-8 text-char-soft dark:text-ink-soft">
                      {f.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-10 space-y-3">
          {FALLBACK.map(([q, a]) => (
            <details key={q} className="glaze-edge rounded-wobble bg-surface p-5 shadow-shelf dark:bg-black/25">
              <summary className="cursor-pointer text-base font-bold">{q}</summary>
              <p className="mt-4 leading-8 text-char-soft dark:text-ink-soft">{a}</p>
            </details>
          ))}
          <p className="pt-4 text-center text-xs text-char-soft dark:text-ink-soft">
            اطلاعات این صفحه توسط مدیریت قابل ویرایش است (بخش FAQ در پنل ادمین).
          </p>
        </div>
      )}
    </div>
  );
}
