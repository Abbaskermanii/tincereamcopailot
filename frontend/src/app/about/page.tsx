import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { api, mediaUrl } from "@/lib/api";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "داستان ما",
  description:
    "آنیمور سرام؛ کارگاه تولید سفال و سرامیک دست‌ساز در کرج. قصهٔ ما از خاک رس شروع می‌شود: چرخ، لعاب‌دستی سنتی و پخت دو مرحله‌ای تا ۱۲۲۰ درجه.",
};

const STATS = [
  { value: "۱۳۹۸", label: "سال راه‌اندازی کارگاه" },
  { value: "۱۲۲۰°", label: "دمای پخت لعاب (سانتی‌گراد)" },
  { value: "+۳۰", label: "ساعت کار برای هر محموله" },
  { value: "۰", label: "واسطه بین ما و شما" },
];

const TIMELINE = [
  {
    step: "۰۱",
    title: "خاک، از دلِ زمین",
    text: "همه‌چیز با انتخاب خاک رس شروع می‌شود؛ خاکی که بعد از ورز دادن و استراحت، آمادهٔ چرخ شدن است. کیفیت بدنه در همین قدم اول تعیین می‌شود.",
  },
  {
    step: "۰۲",
    title: "چرخ و دست",
    text: "روی چرخ، دست‌ها شکل نهایی را می‌سازند. بعضی قطعه‌ها با قالب گچی خودمان قالب‌گیری می‌شوند، اما امضای دست در همه‌شان هست.",
  },
  {
    step: "۰۳",
    title: "لعاب، فرمول خودمان",
    text: "لعاب‌ها را خودمان ترکیب می‌کنیم؛ به همین دلیل رنگ فیروزه‌ایِ دو ماگ «یکسان» هرگز دقیقاً یکسان نیست. نقش ترقه، رگهٔ مسی و سایه‌های لعاب، امضای کورهٔ ماست.",
  },
  {
    step: "۰۴",
    title: "پخت دو مرحله‌ای",
    text: "اول بیسکوییت در ۹۸۰ درجه، بعد لعاب‌خوری و پخت گلَز در ۱۲۲۰ درجه. بیش از سی ساعت برای هر محموله؛ نتیجه‌اش بدنه‌هایی کاملاً آب‌بند و ماندگار است.",
  },
  {
    step: "۰۵",
    title: "بسته‌بندی و راهیِ خانهٔ شما",
    text: "هر قطعه با بسته‌بندی چندلایهٔ ضدضرب راهی خانهٔ شما می‌شود. اگر سالم نرسید، بدون پرسش جایگزین می‌کنیم؛ چون اعتماد شما سرمایهٔ کارگاه است.",
  },
];

export const revalidate = 300;

export default async function AboutPage() {
  const products = await api.products({ page_size: 3, sort: "newest" });
  const gallery = (products?.items ?? []).slice(0, 3);

  return (
    <div>
      {/* ——— Hero: editorial opener ——— */}
      <section className="relative overflow-hidden border-b border-char/8 dark:border-white/5">
        <div aria-hidden="true" className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full border border-kiln-clay/15" />
        <div aria-hidden="true" className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full border border-lajvard/15" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 right-1/4 h-96 w-96 rounded-full bg-kiln-clay/5 blur-3xl dark:bg-clay-soft/5" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
          <Reveal>
            <span className="inline-block rounded-full border border-kiln-clay/30 px-4 py-1.5 text-[11px] font-bold tracking-[0.3em] text-kiln-clay">
              کارگاه آنیمور سرام — کرج
            </span>
          </Reveal>
          <Reveal delay={120}>
            <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.25] text-char md:text-6xl md:leading-[1.2] dark:text-white">
              از خاکِ کرج،
              <span className="block text-kiln-clay">تا سفرهٔ شما.</span>
            </h1>
          </Reveal>
          <Reveal delay={240}>
            <p className="mt-6 max-w-2xl text-base leading-9 text-char-soft md:text-lg md:leading-10 dark:text-white/55">
              آنیمور سرام یک فروشگاه نیست؛ یک کارگاه است. جایی که ما تولیدکننده‌ایم، نه
              واسطه. هر ظرفی که از ما می‌خرید، از چرخ سفالگری تا لعاب و پخت، همین‌جا و با
              دست ساخته شده است.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ——— Stats strip ——— */}
      <section className="border-b border-char/8 dark:border-white/5">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-0 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 90} className="bg-surface px-6 py-8 text-center dark:bg-[#262320]">
              <p className="text-3xl font-extrabold text-lajvard dark:text-lajvard-soft md:text-4xl">{s.value}</p>
              <p className="mt-2 text-xs text-char-soft dark:text-white/45">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ——— Story ——— */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <div className="grid items-start gap-10 lg:grid-cols-[1.2fr_1fr]">
          <Reveal>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-kiln-clay">
                قصهٔ ما
              </span>
              <h2 className="mt-4 text-3xl font-extrabold leading-snug text-char md:text-4xl dark:text-white">
                یک چرخ پایی، یک کورهٔ کوچک،
                <span className="text-kiln-clay"> بی‌نهایت تکرارنشده</span>
              </h2>
              <div className="mt-6 space-y-5 text-[15px] leading-9 text-char-soft dark:text-white/55">
                <p>
                  آنیمور سرام سال ۱۳۹۸ با یک چرخ پایی و کوره‌ای کوچک در حیاط خانه شروع شد.
                  امروز همان‌جاییم؛ فقط تعداد خرطه‌های خاک بیشتر شده و کورهٔ دوم هم روشن
                  می‌شود.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <blockquote className="relative rounded-wobble-card bg-lajvard p-8 text-white shadow-deep dark:bg-[#1e2a3a]">
              <p className="text-lg font-bold leading-9">
                «هیچ دو قطعه‌ای دقیقاً یکسان نیستند؛ و این ناهمسانی، امضای دست است.»
              </p>
              <footer className="mt-4 text-xs text-white/60">— استادکارهای کارگاه آنیمور سرام</footer>
            </blockquote>
          </Reveal>
        </div>
      </section>

      {/* ——— Timeline: از خاک تا خانه ——— */}
      <section className="border-y border-char/8 bg-surface/60 py-16 dark:border-white/5 dark:bg-black/20 md:py-20">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <Reveal>
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-kiln-clay">
              سفر یک قطعه
            </span>
            <h2 className="mt-3 text-3xl font-extrabold text-char md:text-4xl dark:text-white">
              از خاک تا خانه، قدم‌به‌قدم
            </h2>
          </Reveal>

          <ol className="relative mt-12 space-y-12">
            <span aria-hidden="true" className="absolute bottom-4 right-[27px] top-4 w-px bg-char/10 dark:bg-white/10" />
            {TIMELINE.map((t, i) => (
              <Reveal key={t.step} delay={i * 100}>
                <li className="relative flex gap-6">
                  <span className="z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-kiln-clay/30 bg-surface text-sm font-extrabold text-kiln-clay shadow-shelf dark:bg-[#262320] dark:text-clay-soft">
                    {t.step}
                  </span>
                  <div className="pt-2">
                    <h3 className="text-lg font-extrabold text-char dark:text-white">{t.title}</h3>
                    <p className="mt-2 text-sm leading-8 text-char-soft dark:text-white/50">{t.text}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ——— Gallery strip ——— */}
      {gallery.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
          <Reveal>
            <div className="mb-8 flex items-end justify-between gap-4">
              <h2 className="text-2xl font-extrabold text-char md:text-3xl dark:text-white">
                تازه‌های کوره
              </h2>
              <Link href="/shop" className="text-sm font-bold text-lajvard hover:underline dark:text-lajvard-soft">
                دیدن همه
              </Link>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {gallery.map((p, i) =>
              p.primary_image_url ? (
                <Reveal key={p.id} delay={i * 120}>
                  <Link href={`/product/${p.slug}`} className="group block overflow-hidden rounded-wobble-card border border-char/10 shadow-shelf dark:border-white/10">
                    <div className="relative aspect-square">
                      <Image
                        src={mediaUrl(p.primary_image_url)}
                        alt={p.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 p-3">
                      <span className="truncate text-xs font-bold text-char dark:text-white/85">{p.name}</span>
                      <span className="shrink-0 text-[11px] text-char-soft dark:text-white/40">تازه از کوره</span>
                    </div>
                  </Link>
                </Reveal>
              ) : null,
            )}
          </div>
        </section>
      )}

      {/* ——— Commitment CTA ——— */}
      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-wobble-card bg-lajvard px-6 py-12 text-center shadow-deep dark:bg-[#1e2a3a] md:px-12">
            <div aria-hidden="true" className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full border border-white/10" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -right-12 h-64 w-64 rounded-full border border-white/10" />
            <h2 className="relative text-2xl font-extrabold text-white md:text-3xl">
              قطعه‌ای که امروز می‌خرید، فردا میراث خانه‌تان است.
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-sm leading-8 text-white/60">
              اگر سالم به دستتان نرسید، بدون پرسش جایگزین می‌کنیم. بسته‌بندی چندلایهٔ ما تا
              امروز کمتر از دو درصد آسیب دیده — و آن دو درصد را جدی گرفته‌ایم.
            </p>
            <Link
              href="/shop"
              className="relative mt-8 inline-flex items-center rounded-full bg-white px-8 py-3.5 text-sm font-extrabold text-lajvard shadow-lg transition-all hover:bg-kiln-clay hover:text-white"
            >
              دیدن قطعه‌ها
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
