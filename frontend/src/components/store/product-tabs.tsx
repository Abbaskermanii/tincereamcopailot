"use client";

import React, { useCallback, useState } from "react";
import { ProductQuestions } from "./product-questions";
import type { ProductViewProduct } from "./product-view";
import { CheckIcon, ShieldCheckIcon, TruckIcon, PackageIcon } from "./icons";

/** Server-safe HTML sanitiser (same policy as blog body). */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/ on[a-z]+="[^"]*"/gi, "")
    .replace(/ on[a-z]+='[^']*'/gi, "")
    .replace(/<br\s*\/>/gi, "\n")
    .replace(/<p[^>]*>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "");
}

const fmt = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

type TabKey = "description" | "specs" | "care" | "shipping" | "questions";

// ✏️ متن‌های ثابت — در صورت نیاز همین‌جا ویرایش کن
const CARE_TIPS = [
  "برای حفظ لعاب دست‌ساز، بهتر است ظروف با دست و اسفنج نرم شسته شوند.",
  "از قرار دادن ظرف داغ زیر آب سرد یا تغییر ناگهانی دما خودداری کنید؛ باعث ترک خوردن سرامیک می‌شود.",
  "استفاده در ماشین ظرفشویی با برنامه ملایم بلامانع است، اما شستشوی دستی عمر محصول را بیشتر می‌کند.",
  "برای لکه‌های سرسخت از جوش شیرین و آب گرم استفاده کنید و از سیم ظرفشویی پرهیز کنید.",
  "بعد از شستشو ظرف را کاملاً خشک کنید و در جای خشک نگه دارید.",
];

const SHIPPING_CARDS = [
  {
    icon: PackageIcon,
    title: "بسته‌بندی ایمن",
    desc: "همه سفارش‌ها با فوم و کارتن چندلایه بسته‌بندی می‌شوند تا ظروف سالم به دستتان برسند.",
  },
  {
    icon: TruckIcon,
    title: "زمان ارسال",
    desc: "سفارش‌های تهران ۱ تا ۲ روز کاری با پیک و شهرستان‌ها ۲ تا ۵ روز کاری با پست پیشتاز یا تیپاکس ارسال می‌شوند.",
  },
  {
    icon: CheckIcon,
    title: "هزینه ارسال",
    desc: "هزینه ارسال بر اساس وزن و مقصد در مرحله پرداخت محاسبه می‌شود.",
  },
  {
    icon: ShieldCheckIcon,
    title: "ضمانت سلامت",
    desc: "در صورت آسیب‌دیدگی حین ارسال، کالا تعویض یا وجه آن کامل بازگردانده می‌شود.",
  },
];

export function ProductTabs({ product }: { product: ProductViewProduct }) {
  const [active, setActive] = useState<TabKey>("description");
  const [questionCount, setQuestionCount] = useState<number | null>(null);

  const handleQuestionCount = useCallback((n: number) => setQuestionCount(n), []);

  const tabs: { key: TabKey; label: string; badge?: number | null }[] = [
    { key: "description", label: "توضیحات" },
    { key: "specs", label: "مشخصات" },
    { key: "care", label: "نگهداری" },
    { key: "shipping", label: "ارسال و بسته‌بندی" },
    { key: "questions", label: "پرسش و پاسخ", badge: questionCount },
  ];

  const specRows: [string, string][] = (
    [
      ["دسته‌بندی", product.category_name ?? ""],
      ["جنس", product.material ?? ""],
      ["ابعاد", product.dimensions ?? ""],
      ["وزن", product.weight_grams ? `${fmt(product.weight_grams)} گرم` : ""],
      ["کد محصول", product.sku ?? ""],
    ] as [string, string][]
  ).filter(([, v]) => v && v.trim().length > 0);

  return (
    <section className="mt-12 md:mt-16" id="product-tabs">
      {/* نوار تب‌ها — در موبایل قابل اسکرول */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-200 ${
              active === t.key
                ? "bg-stone-900 text-white shadow-md shadow-stone-900/15"
                : "border border-stone-200 bg-white text-stone-500 hover:border-stone-400 hover:text-stone-800"
            }`}
          >
            {t.label}
            {typeof t.badge === "number" && t.badge > 0 && (
              <span
                className={`mr-2 inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                  active === t.key ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500"
                }`}
              >
                {fmt(t.badge)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* محتوای تب فعال */}
      <div className="rounded-3xl border border-stone-200/80 dark:border-white/15 bg-white dark:bg-char p-5 shadow-sm md:p-8">
        {active === "description" && (
          <div>
            {product.description ? (
              <div
                className="article-body text-[15px] text-stone-600 dark:text-stone-300"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }}
              />
            ) : product.short_description ? (
              <p className="text-[15px] leading-8 text-stone-600 dark:text-stone-300">{product.short_description}</p>
            ) : (
              <p className="text-sm text-stone-400 dark:text-stone-500">توضیحاتی برای این محصول ثبت نشده است.</p>
            )}
          </div>
        )}

        {active === "specs" && (
          <dl className="divide-y divide-stone-100 dark:divide-white/10">
            {specRows.map(([k, v]) => (
              <div key={k} className="flex items-start gap-4 py-3.5 text-sm first:pt-0 last:pb-0">
                <dt className="w-28 shrink-0 text-stone-400 dark:text-stone-500">{k}</dt>
                <dd className="font-semibold text-stone-800 dark:text-white/85">{v}</dd>
              </div>
            ))}
          </dl>
        )}

        {active === "care" && (
          <ul className="space-y-3.5">
            {CARE_TIPS.map((tip) => (
              <li key={tip} className="flex items-start gap-3 text-sm leading-7 text-stone-600 dark:text-stone-300">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        )}

        {active === "shipping" && (
          <div className="grid gap-4 sm:grid-cols-2">
            {SHIPPING_CARDS.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.title}
                  className="rounded-2xl border border-stone-100 dark:border-white/10 bg-stone-50/60 dark:bg-white/5 p-5"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-amber-800 dark:bg-white/10 dark:text-amber-300 shadow-sm">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h4 className="text-sm font-black text-stone-800 dark:text-white/85">{c.title}</h4>
                  </div>
                  <p className="mt-3 text-[13px] leading-7 text-stone-500 dark:text-stone-400">{c.desc}</p>
                </div>
              );
            })}
          </div>
        )}

        {active === "questions" && (
          <ProductQuestions productId={product.id} onCountChange={handleQuestionCount} />
        )}
      </div>
    </section>
  );
}
