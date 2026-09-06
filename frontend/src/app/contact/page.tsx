import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone, Send } from "lucide-react";

import { ContactForm } from "@/components/contact/contact-form";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

export const metadata: Metadata = {
  title: "تماس با ما | آنیمور سرام",
  description:
    "ارتباط با کارگاه سفال و سرامیک آنیمور سرام؛ سفارش سفارشی، عمده‌فروشی یا سوالات خود را با ما در میان بگذارید.",
  alternates: { canonical: "/contact" },
};

const CONTACT_INFO = [
  {
    icon: MapPin,
    title: "نشانی کارگاه",
    lines: ["اصفهان، خیابان مشتاق دوم، کارگاه آنیمور سرام"],
    href: null,
  },
  {
    icon: Phone,
    title: "تلفن",
    lines: ["031-3663-0000"],
    href: "tel:03136630000",
    ltr: true,
  },
  {
    icon: Mail,
    title: "ایمیل",
    lines: ["hello@tinceram.ir"],
    href: "mailto:hello@tinceram.ir",
    ltr: true,
  },
  {
    icon: Clock,
    title: "ساعات کارگاه",
    lines: ["شنبه تا چهارشنبه، ۹ تا ۱۷"],
    href: null,
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      {/* Header */}
      <header className="relative mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-kiln-clay/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-kiln-clay dark:bg-clay-soft/15 dark:text-clay-soft md:text-xs">
          <Send className="h-3.5 w-3.5" />
          در تماس باشیم
        </span>
        <h1 className="mt-4 text-4xl font-extrabold md:text-5xl">سلام بگو به کارگاه</h1>
        <p className="mt-4 leading-8 text-char-soft dark:text-ink-soft">
          سفارش سفارشی، عمده‌فروشی یا فقط سلام؟ خوشحال می‌شویم بشنویم.
        </p>
      </header>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        {/* Info column — right in RTL */}
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {CONTACT_INFO.map((info) => {
              const content = (
                <>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lajvard/8 text-lajvard transition-colors group-hover:bg-lajvard group-hover:text-white dark:bg-lajvard-soft/15 dark:text-lajvard-soft dark:group-hover:bg-lajvard-soft dark:group-hover:text-char">
                    <info.icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-char dark:text-white">{info.title}</p>
                    {info.lines.map((line) => (
                      <p
                        key={line}
                        className={`mt-1 text-xs leading-6 text-char-soft dark:text-white/50 ${info.ltr ? "num-latin" : ""}`}
                        dir={info.ltr ? "ltr" : undefined}
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </>
              );

              return info.href ? (
                <a
                  key={info.title}
                  href={info.href}
                  className="group flex items-start gap-3 rounded-wobble-card border border-char/10 bg-surface p-4 transition-all hover:border-lajvard/30 hover:shadow-shelf dark:border-white/10 dark:bg-[#262320] dark:hover:border-lajvard-soft/30"
                >
                  {content}
                </a>
              ) : (
                <div
                  key={info.title}
                  className="group flex items-start gap-3 rounded-wobble-card border border-char/10 bg-surface p-4 dark:border-white/10 dark:bg-[#262320]"
                >
                  {content}
                </div>
              );
            })}
          </div>

          {/* Social + note card */}
          <div className="rounded-wobble-card bg-gradient-to-br from-kiln-clay/10 to-lajvard/10 p-6 dark:from-clay-soft/10 dark:to-lajvard-soft/10">
            <p className="text-sm font-extrabold text-char dark:text-white">دنبال‌مان کنید</p>
            <p className="mt-2 text-xs leading-6 text-char-soft dark:text-white/50">
              پشت‌صحنهٔ کارگاه، لحظهٔ ریشه‌دادن قطعه‌ها و محصول‌های تازه از کوره.
            </p>
            <div className="mt-4 flex gap-3">
              <a
                href="https://instagram.com/tinceram"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="اینستاگرام آنیمور سرام"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-char-soft shadow-shelf transition-all hover:bg-lajvard hover:text-white dark:bg-[#262320] dark:text-white/60 dark:hover:bg-lajvard-soft dark:hover:text-char"
              >
                <InstagramIcon className="h-5 w-5" />
              </a>
              <a
                href="https://t.me/tinceram"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="تلگرام آنیمور سرام"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-char-soft shadow-shelf transition-all hover:bg-lajvard hover:text-white dark:bg-[#262320] dark:text-white/60 dark:hover:bg-lajvard-soft dark:hover:text-char"
              >
                <Send className="h-5 w-5" strokeWidth={1.8} />
              </a>
            </div>
          </div>
        </div>

        {/* Form column — left in RTL */}
        <ContactForm />
      </div>
    </div>
  );
}
