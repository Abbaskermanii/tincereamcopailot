import Link from "next/link";

const COLS = [
  {
    title: "خرید",
    links: [
      { href: "/category/handmade-mugs", label: "ماگ‌های دست‌ساز" },
      { href: "/category/ceramic-ashtrays", label: "زیرسیگاری" },
      { href: "/category/spice-jars", label: "ادویه‌دان" },
      { href: "/category/canisters", label: "کوزه و شیرینی‌دان" },
    ],
  },
  {
    title: "فروشگاه",
    links: [
      { href: "/about", label: "داستان ما" },
      { href: "/contact", label: "تماس با ما" },
      { href: "/track", label: "پیگیری سفارش" },
    ],
  },
  {
    title: "راهنما",
    links: [
      { href: "/returns-policy", label: "شرایط مرجوعی" },
      { href: "/privacy-policy", label: "حریم خصوصی" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-char/10 bg-surface dark:border-white/10 dark:bg-black/20">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-14 md:grid-cols-4 md:px-6">
        <div className="col-span-2 md:col-span-1">
          <p className="text-xl font-extrabold">تن‌سِرام</p>
          <p className="mt-3 max-w-xs text-sm leading-7 text-char-soft dark:text-ink-soft">
            کارگاه سفال و سرامیک دست‌ساز؛ هر تکه روی چرخ شکل می‌گیرد، با دست لعاب
            می‌خورد و در کوره‌ای که خودمان چیده‌ایم پخته می‌شود.
          </p>
        </div>
        {COLS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="mb-3 text-sm font-bold">{col.title}</p>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-char-soft transition-colors hover:text-lajvard dark:text-ink-soft dark:hover:text-lajvard-soft"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-char/10 py-5 text-center text-xs text-char-soft dark:border-white/10 dark:text-ink-soft">
        © ۱۴۰۵ کارگاه تن‌سِرام — همهٔ حقوق محفوظ است.
      </div>
    </footer>
  );
}
