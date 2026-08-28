import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api, mediaUrl } from "@/lib/api";
import { ProductCard } from "@/components/store/product-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { NewsletterBand } from "@/components/store/newsletter-band";

export const revalidate = 120;

export default async function HomePage() {
  const latest = await api.products({ page_size: 8, sort: "newest" });
  const categories = await api.categories();
  const categoryTiles = await Promise.all(
    (categories ?? []).slice(0, 4).map(async (category) => {
      const products = await api.products({ category: category.slug, page_size: 1, sort: "newest" });
      return { ...category, image_url: category.image_url ?? products?.items[0]?.primary_image_url };
    }),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6">
      {/* ——— Hero ——— */}
      <section className="grid items-center gap-10 py-12 md:grid-cols-2 md:py-20">
        <div className="order-2 md:order-1">
          <p className="mb-4 inline-flex rounded-full bg-firouzeh/15 px-3 py-1 text-xs font-medium text-[#3f5f56] dark:text-firouzeh-soft">
            پخت تازه از کورهٔ شمارهٔ ۲
          </p>
          <h1 className="text-4xl font-extrabold leading-[1.2] md:text-6xl md:leading-[1.15]">
            سفال، با دستِ
            <span className="text-lajvard dark:text-lajvard-soft"> ایرانی</span> گرم می‌شود.
          </h1>
          <p className="mt-5 max-w-md text-base leading-8 text-char-soft dark:text-ink-soft">
            هر ماگ و هر کوزه، یکتاست؛ روی چرخ شکل گرفته، با دست لعاب خورده و در
            کورهٔ چوب‌سوزِ کارگاه ما جان گرفته است.
          </p>
          <Link
            href="/category/handmade-mugs"
            className="glaze-edge mt-8 inline-flex h-13 items-center gap-2 bg-lajvard px-8 font-medium text-slip transition-colors hover:bg-lajvard-deep dark:bg-lajvard-soft dark:text-char"
          >
            دیدن مجموعه‌ها
            <ArrowLeft size={18} />
          </Link>
        </div>
        <div className="kiln-reveal order-1 overflow-hidden rounded-wobble shadow-lifted md:order-2">
          {latest?.items[0]?.primary_image_url && <Image src={mediaUrl(latest.items[0].primary_image_url)} alt={latest.items[0].name} width={720} height={720} priority className="h-auto w-full object-cover" />}
        </div>
      </section>

      {/* ——— Category tiles ——— */}
      <section aria-labelledby="cats-h" className="py-10">
        <h2 id="cats-h" className="sr-only">دسته‌بندی‌ها</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {categoryTiles.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="group">
              <div className="glaze-edge overflow-hidden rounded-wobble bg-surface p-3 shadow-shelf transition-shadow hover:shadow-lifted dark:bg-black/25">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-slip dark:bg-black/30">
                  {c.image_url && <Image src={mediaUrl(c.image_url)} alt={`مجموعهٔ ${c.name}`} fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />}
                </div>
                <p className="pt-3 pb-1 text-center font-semibold">{c.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ——— Latest products ——— */}
      <section aria-labelledby="new-h" className="py-14">
        <SectionHeading
          title="تازه‌های کوره"
          subtitle="آخرین سفال‌هایی که از کوره بیرون آمدند"
        />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {(latest?.items ?? []).slice(0, 8).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* ——— Story band (asymmetric) ——— */}
      <section className="my-16 grid items-center gap-8 md:grid-cols-5">
        <div className="kiln-reveal relative overflow-hidden rounded-wobble shadow-shelf md:col-span-2 md:-rotate-1">
          {latest?.items[1]?.primary_image_url && <Image src={mediaUrl(latest.items[1].primary_image_url)} alt={latest.items[1].name} width={520} height={520} className="h-auto w-full object-cover" />}
        </div>
        <div className="md:col-span-3">
          <h2 className="text-2xl font-extrabold md:text-3xl">
            از خاک تا لعاب، همه‌چیز در یک حیاط
          </h2>
          <p className="mt-4 max-w-lg leading-8 text-char-soft dark:text-ink-soft">
            کارگاه ما از سه خریطه خاک رس سفید شروع شد. امروز همان خاک، بعد از
            چرخ، قلم‌گیری، لعاب‌دستی و سی‌وساعت پخت دو مرحله‌ای، به میز خانه‌های
            شما می‌رسد. اگر لبهٔ یک ماگ کمی کج است، آن کجی امضای دست ماست.
          </p>
        </div>
      </section>

      <NewsletterBand />
    </div>
  );
}
