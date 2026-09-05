import Link from "next/link";

export function WorkshopStory() {
  return (
    <section className="py-12 md:py-16 lg:py-20" aria-labelledby="workshop-story">
      <div className="grid items-center gap-8 md:gap-12 lg:grid-cols-2">
        {/* Text */}
        <div className="order-2 lg:order-1">
          <span className="mb-3 block text-[10px] font-bold uppercase tracking-[0.25em] text-kiln-clay dark:text-clay-soft md:text-xs">
            از کارگاه تا خانه شما
          </span>
          <h2
            id="workshop-story"
            className="text-2xl font-extrabold tracking-tight text-char dark:text-white md:text-3xl lg:text-4xl"
          >
            هر قطعه، قصه‌ای
            <br />
            از دست و خاک
          </h2>
          <div className="mt-4 space-y-3 text-sm leading-7 text-char-soft dark:text-white/55 md:text-base md:leading-8">
            <p>
              در کارگاه تن‌سِرام، هر ظرف با دست ساخته می‌شود. از انتخاب خاک تا لعاب‌کاری و پخت،
              هر مرحله با دقت و عشق انجام می‌شود.
            </p>
            <p>
              تفاوت سفال دست‌ساز در این است که هیچ دو قطعه‌ای دقیقاً یکسان نیستند.
              این ناهمسانی، زیبایی و اصالت هر قطعه را تضمین می‌کند.
            </p>
          </div>
          <div className="mt-6">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-full border border-char/10 px-5 py-2.5 text-sm font-bold text-char transition-all hover:border-char/25 hover:bg-char/5 dark:border-white/10 dark:text-white dark:hover:border-white/20 dark:hover:bg-white/5"
            >
              داستان ما
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Visual */}
        <div className="order-1 lg:order-2">
          <div className="relative">
            {/* Abstract clay shape */}
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-kiln-clay/8 to-lajvard/5 dark:from-clay-soft/8 dark:to-lajvard-soft/5" />

            {/* Main visual - texture/pattern */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slip to-char/5 aspect-[4/3] dark:from-[#2a2725] dark:to-[#1c1a18]">
              {/* Layered circles representing ceramic forms */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="h-48 w-48 rounded-full border border-kiln-clay/15 md:h-64 md:w-64 dark:border-clay-soft/15" />
                  <div className="absolute inset-6 rounded-full border border-lajvard/10 dark:border-lajvard-soft/10" />
                  <div className="absolute inset-12 rounded-full border border-kiln-clay/10 dark:border-clay-soft/10" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-16 w-16 rounded-full bg-kiln-clay/10 dark:bg-clay-soft/10" />
                  </div>
                </div>
              </div>

              {/* Subtle grid */}
              <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
                backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
                backgroundSize: "24px 24px"
              }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
