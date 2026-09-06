import Link from "next/link";
import { ChevronLeft, Flame, HandHeart, ShieldCheck, Truck } from "lucide-react";

const REASONS = [
  {
    icon: HandHeart,
    title: "تولیدکننده، نه واسطه",
    description: "همه‌چیز در کارگاه خودمان در کرج ساخته می‌شود.",
  },
  {
    icon: Flame,
    title: "لعاب‌دستی سنتی",
    description: "فرمول هر لعاب، دست‌کار استادکارهای خودمان است.",
  },
  {
    icon: ShieldCheck,
    title: "بسته‌بندی ایمن",
    description: "ضمانت سالم‌رسیدن هر قطعه شکستنی.",
  },
  {
    icon: Truck,
    title: "ارسال سراسر ایران",
    description: "به هر شهری که باشید، قطعه دستتان می‌رسد.",
  },
];

/**
 * Compact dark band replacing the old workshop story section: the four
 * practical reasons to buy from Tinceram, with a single CTA to the story page.
 */
export function WhyTinceram() {
  return (
    <section className="py-10 md:py-14" aria-labelledby="why-tinceram">
      <div className="relative overflow-hidden rounded-wobble-card bg-lajvard px-6 py-10 md:px-12 md:py-12 dark:bg-[#1e2a3a]">
        {/* Decorative glaze rings */}
        <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full border border-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-10 h-72 w-72 rounded-full border border-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -right-4 h-56 w-56 rounded-full border border-white/5" />

        <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/50 md:text-xs">
              چرا آنیمور سرام؟
            </span>
            <h2
              id="why-tinceram"
              className="mt-2 text-2xl font-extrabold text-white md:text-3xl"
            >
              خرید مطمئن، مستقیم از دست هنرمند
            </h2>
          </div>
          <Link
            href="/about"
            className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-lajvard shadow-lg transition-all duration-300 hover:bg-kiln-clay hover:text-white dark:hover:bg-clay-soft dark:hover:text-char"
          >
            داستان ما
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          </Link>
        </div>

        <div className="relative mt-8 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map((r) => (
            <div key={r.title} className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                <r.icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-sm font-bold text-white">{r.title}</p>
                <p className="mt-1 text-xs leading-5 text-white/60">{r.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
