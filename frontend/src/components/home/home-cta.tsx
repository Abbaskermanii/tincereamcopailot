import Link from "next/link";

export function HomeCta() {
  return (
    <section className="py-12 md:py-16 lg:py-20" aria-labelledby="home-cta">
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-char dark:bg-[#1c1a18]">
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
          backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "32px 32px"
        }} />

        {/* Gradient accents */}
        <div className="absolute inset-0 bg-gradient-to-br from-kiln-clay/10 via-transparent to-lajvard/8 dark:from-clay-soft/8 dark:via-transparent dark:to-lajvard-soft/5" />

        <div className="relative grid items-center gap-8 px-6 py-12 md:grid-cols-2 md:px-12 md:py-16 lg:px-16 lg:py-20">
          {/* Text */}
          <div className="space-y-4 md:space-y-5">
            <span className="inline-block text-[10px] font-bold uppercase tracking-[0.25em] text-kiln-clay/70 dark:text-clay-soft/60 md:text-xs">
              تن‌سِرام
            </span>
            <h2
              id="home-cta"
              className="text-2xl font-extrabold leading-tight text-white md:text-3xl lg:text-4xl"
            >
              یک قطعه برای خانه‌ات،
              <br />
              با قصه‌ای از دست و خاک
            </h2>
            <p className="max-w-md text-sm leading-7 text-white/55 md:text-base md:leading-8">
              هر قطعه سفال و سرامیک تن‌سِرام، حاصل ساعت‌ها کار دقیق و عاشقانه در کارگاه ماست.
              چیزی انتخاب کن که هر روز دیدنش حس خوبی داشته باشد.
            </p>
            <div className="flex flex-col gap-3 pt-1 sm:flex-row">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-bold text-char transition-all duration-300 hover:bg-kiln-clay hover:text-white dark:bg-white/90 dark:text-char dark:hover:bg-kiln-clay"
              >
                مشاهده فروشگاه
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-7 py-3 text-sm font-bold text-white/70 transition-all duration-300 hover:border-white/30 hover:text-white"
              >
                درباره ما
              </Link>
            </div>
          </div>

          {/* Visual */}
          <div className="hidden md:flex">
            <div className="relative mx-auto">
              {/* Abstract ceramic composition */}
              <div className="relative h-64 w-64 lg:h-80 lg:w-80">
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border border-white/8" />
                {/* Middle ring */}
                <div className="absolute inset-8 rounded-full border border-kiln-clay/15 dark:border-clay-soft/15" />
                {/* Inner form */}
                <div className="absolute inset-16 rounded-full bg-white/5 dark:bg-white/3" />
                {/* Center dot */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-6 w-6 rounded-full bg-kiln-clay/20 dark:bg-clay-soft/20" />
                </div>

                {/* Floating elements */}
                <div className="absolute -right-4 top-8 h-3 w-3 rounded-full bg-kiln-clay/25 dark:bg-clay-soft/25" />
                <div className="absolute -left-2 bottom-12 h-2 w-2 rounded-full bg-lajvard/20 dark:bg-lajvard-soft/20" />
                <div className="absolute right-12 -top-2 h-1.5 w-1.5 rounded-full bg-white/15" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
