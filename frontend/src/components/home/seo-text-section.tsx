"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";

/**
 * SEO text block at the bottom of the homepage: keyword-rich store
 * description, collapsed by default with a "مشاهدهٔ کامل" expander.
 */
export function SeoTextSection() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="py-10 md:py-14" aria-labelledby="seo-about">
      <Reveal>
        <div className="rounded-wobble-card border border-char/10 bg-surface p-6 shadow-shelf dark:border-white/10 dark:bg-[#262320] md:p-10">
          <h2 id="seo-about" className="text-xl font-extrabold text-char dark:text-white md:text-2xl">
            دربارهٔ آنیمور سرام
          </h2>

          <div
            className={`relative mt-4 space-y-3 text-sm leading-8 text-char-soft dark:text-white/55 md:text-[15px] md:leading-9 ${
              expanded ? "" : "max-h-40 overflow-hidden"
            }`}
          >
            <p>
              <strong className="text-char dark:text-white">آنیمور سرام</strong> یک تولیدکنندهٔ
              مستقل سفال و سرامیک دست‌ساز در <strong className="text-char dark:text-white">کرج</strong> است؛
              جایی که خاک، آب و آتش زیر دست استادکارهای ما به ظرف‌هایی تبدیل می‌شوند که سال‌ها همراه
              خانهٔ شما هستند. ما فروشگاه نیستیم، کارگاه هستیم؛ یعنی هر ماگ، ادویه‌دان، شیرینی‌دان و
              کوزه‌ای که می‌بینید، از چرخ سفالگری تا لعاب‌کاری و پخت، تمام‌مراحلش را خودمان با دست
              ساخته‌ایم.
            </p>
            <p>
              مجموعهٔ محصولات ما شامل <strong className="text-char dark:text-white">ماگ‌های دست‌ساز</strong>،
              ادویه‌دان و نمک‌دان، شیرینی‌دان و کوزه، سروخ‌دار و زیرسیگاری‌های سرامیکی با لعاب‌های
              دست‌ساز است. چون تولیدکننده هستیم، هر قطعه را بدون واسطه و با قیمت کارگاه به شما
              می‌رسانیم و امکان <strong className="text-char dark:text-white">سفارش سفارشی</strong> با
              طرح، سایز و رنگ دلخواه شما هم وجود دارد.
            </p>
            <p>
              اگر دنبال سفال و سرامیک دست‌ساز با کیفیت کارگاهی در کرج یا ارسال به سراسر ایران
              هستید، آنیمور سرام انتخاب مطمئنی است: بسته‌بندی چندلایهٔ ضدضرب، پشتیبانی واقعی و
              قطعاتی که هیچ‌کدام نسخهٔ تکراری دیگری نیستند.
            </p>
            {!expanded && <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface dark:from-[#262320]" />}
          </div>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-char/15 px-4 py-2 text-xs font-bold text-lajvard transition-colors hover:border-lajvard/40 hover:bg-lajvard/5 dark:border-white/15 dark:text-lajvard-soft dark:hover:border-lajvard-soft/40"
          >
            {expanded ? "بستن" : "مشاهدهٔ کامل"}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </Reveal>
    </section>
  );
}
