const principles = [
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 3c-6.627 0-12 4.373-12 10 0 3.258 1.5 6.17 3.89 8.147L16 29l8.11-7.853A11.94 11.94 0 0028 13c0-5.627-5.373-10-12-10z" />
        <circle cx="16" cy="13" r="4" />
      </svg>
    ),
    title: "ساخته‌شده با دقت",
    description: "هر قطعه حاصل فرایند ساخت، لعاب‌کاری و پخت با نظارت دقیق است.",
  },
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="8" width="24" height="18" rx="3" />
        <path d="M4 14h24" />
        <path d="M12 8V5a2 2 0 012-2h4a2 2 0 012 2v3" />
        <path d="M16 18v4" />
        <path d="M12 22h8" />
      </svg>
    ),
    title: "بسته‌بندی ایمن",
    description: "هر قطعه با محافظت کافی برای سالم رسیدن به مقصد آماده می‌شود.",
  },
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 16l4 4 8-8" />
        <circle cx="16" cy="16" r="12" />
      </svg>
    ),
    title: "کنترل کیفیت",
    description: "پیش از بسته‌بندی، هر محصول از نظر سلامت ظاهری بررسی می‌شود.",
  },
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 28c6.627 0 12-4.373 12-10S22.627 8 16 8 4 12.373 4 18" />
        <path d="M4 18c0 5.523 4.477 10 10 10" />
        <path d="M22 20l4 4 6-6" />
      </svg>
    ),
    title: "همراهی پس از خرید",
    description: "برای سوالات مربوط به سفارش و محصول، در کنار شما هستیم.",
  },
];

export function TrustSection() {
  return (
    <section className="py-10 md:py-14 lg:py-16" aria-labelledby="trust-section">
      <div className="mb-8 text-center md:mb-10">
        <span className="mb-2 inline-block text-[10px] font-bold uppercase tracking-[0.25em] text-kiln-clay dark:text-clay-soft md:text-xs">
          اصول ما
        </span>
        <h2
          id="trust-section"
          className="text-2xl font-extrabold tracking-tight text-char dark:text-white md:text-3xl"
        >
          با این باورها می‌سازیم
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-char/5 bg-char/5 dark:border-white/5 dark:bg-white/5 sm:grid-cols-2 lg:grid-cols-4">
        {principles.map((p, i) => (
          <div
            key={i}
            className="group bg-surface px-6 py-8 text-center transition-colors hover:bg-char/[0.02] dark:bg-[#262320] dark:hover:bg-white/[0.02] md:px-8 md:py-10"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-kiln-clay/8 text-kiln-clay transition-colors group-hover:bg-kiln-clay/15 dark:bg-clay-soft/10 dark:text-clay-soft dark:group-hover:bg-clay-soft/20">
              {p.icon}
            </div>
            <h3 className="text-sm font-bold text-char dark:text-white md:text-base">
              {p.title}
            </h3>
            <p className="mt-1.5 text-xs leading-5 text-char-soft dark:text-white/45 md:text-sm md:leading-6">
              {p.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
