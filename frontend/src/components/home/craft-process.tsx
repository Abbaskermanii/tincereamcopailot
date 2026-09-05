const steps = [
  {
    number: "۰۱",
    title: "انتخاب خاک",
    description: "مرغوب‌ترین خاک‌های رسی برای شروع فرایند سفالگری انتخاب می‌شوند.",
  },
  {
    number: "۰۲",
    title: "شکل‌دهی",
    description: "با دست و چرخ سفالگری، خاک به فرم نهایی ظرف درمی‌آید.",
  },
  {
    number: "۰۳",
    title: "لعاب‌کاری",
    description: "لعاب‌های طبیعی با رنگ‌ها و بافت‌های منحصربه‌فرد روی سطح نشسته می‌شوند.",
  },
  {
    number: "۰۴",
    title: "پخت در کوره",
    description: "حرارت بالای کوره، استحکام و زیبایی نهایی را به قطعه می‌بخشد.",
  },
  {
    number: "۰۵",
    title: "کنترل نهایی",
    description: "هر قطعه پیش از بسته‌بندی از نظر کیفیت و سلامت بررسی می‌شود.",
  },
];

export function CraftProcess() {
  return (
    <section className="py-12 md:py-16 lg:py-20" aria-labelledby="craft-process">
      <div className="mb-10 text-center md:mb-12">
        <span className="mb-2 inline-block text-[10px] font-bold uppercase tracking-[0.25em] text-kiln-clay dark:text-clay-soft md:text-xs">
          فرایند ساخت
        </span>
        <h2
          id="craft-process"
          className="text-2xl font-extrabold tracking-tight text-char dark:text-white md:text-3xl lg:text-4xl"
        >
          از خاک تا قطعه نهایی
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-char-soft dark:text-white/50 md:text-base">
          هر ظرف سفالی مسیری طولانی را طی می‌کند تا به دست شما برسد.
        </p>
      </div>

      <div className="relative mx-auto max-w-5xl">
        {/* Connecting line - desktop */}
        <div className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-char/10 to-transparent dark:via-white/10 lg:block" />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0">
          {steps.map((step, i) => (
            <div key={i} className="group relative flex flex-col items-center text-center lg:px-4">
              {/* Number circle */}
              <div className="relative z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-kiln-clay/20 bg-surface text-lg font-extrabold text-kiln-clay transition-colors group-hover:border-kiln-clay/40 group-hover:bg-kiln-clay/5 dark:border-clay-soft/20 dark:bg-[#262320] dark:text-clay-soft dark:group-hover:border-clay-soft/40 dark:group-hover:bg-clay-soft/5">
                {step.number}
              </div>

              <h3 className="text-sm font-bold text-char dark:text-white md:text-base">
                {step.title}
              </h3>
              <p className="mt-1 max-w-[200px] text-xs leading-5 text-char-soft dark:text-white/45">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
