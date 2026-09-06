import Link from "next/link";
import { api } from "@/lib/api";

const FIXED_COLS = [
  {
    title: "فروشگاه",
    links: [
      { href: "/about", label: "داستان ما" },
      { href: "/contact", label: "تماس با ما" },
      { href: "/track", label: "پیگیری سفارش" },
      { href: "/blog", label: "مقالات" },
    ],
  },
  {
    title: "راهنما",
    links: [
      { href: "/returns-policy", label: "شرایط مرجوعی" },
      { href: "/privacy-policy", label: "حریم خصوصی" },
      { href: "/terms", label: "شرایط استفاده" },
      { href: "/faq", label: "سؤالات رایج" },
    ],
  },
];

export async function Footer() {
  const categoriesRes = await api.categories();
  const categories = (categoriesRes ?? []).slice(0, 6);

  return (
    <footer className="mt-24 border-t border-char/10 bg-surface dark:border-white/10 dark:bg-black/20">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-14 md:grid-cols-4 md:px-6">
        <div className="col-span-2 md:col-span-1">
          <p className="text-xl font-extrabold">آنیمور سرام</p>
          <p className="mt-3 max-w-xs text-sm leading-7 text-char-soft dark:text-ink-soft">
            تولیدکنندهٔ سفال و سرامیک دست‌ساز در کرج؛ هر قطعه روی چرخ شکل می‌گیرد،
            با دست لعاب می‌خورد و در کورهٔ کارگاه خودمان پخته می‌شود — بدون واسطه، مستقیم به خانهٔ شما.
          </p>
          {/* Social links — update hrefs with real accounts */}
          <div className="mt-4 flex gap-3">
            <a href="https://instagram.com/tinceram" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl bg-char/5 text-char-soft hover:bg-lajvard/10 hover:text-lajvard dark:bg-white/5 dark:text-ink-soft dark:hover:text-lajvard-soft" aria-label="اینستاگرام">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            <a href="https://t.me/tinceram" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl bg-char/5 text-char-soft hover:bg-lajvard/10 hover:text-lajvard dark:bg-white/5 dark:text-ink-soft dark:hover:text-lajvard-soft" aria-label="تلگرام">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            </a>
          </div>
        </div>

        {/* Dynamic categories column */}
        <nav aria-label="دسته‌بندی‌ها">
          <p className="mb-3 text-sm font-bold">دسته‌بندی‌ها</p>
          <ul className="space-y-2">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/shop?category=${c.slug}`} className="text-sm text-char-soft transition-colors hover:text-lajvard dark:text-ink-soft dark:hover:text-lajvard-soft">
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/shop" className="text-sm font-medium text-lajvard hover:text-lajvard-deep dark:text-lajvard-soft">
                مشاهدهٔ همه →
              </Link>
            </li>
          </ul>
        </nav>

        {FIXED_COLS.map((col) => (
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
        © ۱۴۰۵ کارگاه آنیمور سرام — همهٔ حقوق محفوظ است.
      </div>
    </footer>
  );
}
