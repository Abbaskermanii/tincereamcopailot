import type { Metadata } from "next";
import Image from "next/image";
import { api, mediaUrl } from "@/lib/api";

export const metadata: Metadata = {
  title: "داستان ما",
  description:
    "کارگاه سفالگری تن‌سِرام؛ از خاک رس تا لعاب لاجوردی، قصهٔ ساخت دست‌سازهای ما.",
};

export default async function AboutPage() {
  const products = await api.products({ page_size: 2, sort: "newest" });
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 md:px-6">
      <h1 className="text-3xl font-extrabold md:text-5xl">
        یک کوره، دو دست، بی‌نهایت تکرارنشده
      </h1>

      <div className="kiln-reveal mt-8 overflow-hidden rounded-wobble shadow-lifted">
        <Image
          src={mediaUrl(products?.items[0]?.primary_image_url)}
          alt="شیرینی‌دان خاکی با درپوش چوبی در کارگاه تن‌سِرام"
          width={900}
          height={600}
          className="h-auto w-full object-cover"
        />
      </div>

      <div className="mt-10 space-y-6 text-base leading-9 text-char-soft dark:text-ink-soft [&_h2]:pt-4 [&_h2]:font-extrabold [&_h2]:text-char dark:[&_h2]:text-ink">
        <p>
          تن‌سِرام سال ۱۳۹۸ با یک چرخ پایی و کوره‌ای کوچک در حیاط خانه شروع شد.
          امروز همان جا هستیم؛ فقط تعداد خرطه‌های خاک بیشتر شده و کوره دوم هم
          روشن می‌شود.
        </p>
        <h2>چرا هر تکه فرق دارد؟</h2>
        <p>
          همهٔ محصولات روی چرخ یا با قالب گچی خودمان ساخته می‌شوند. لعاب‌ها را
          خودمان ترکیب می‌کنیم؛ به همین دلیل رنگ فیروزه‌ای دو ماگ «یکسان» هرگز
          دقیقاً یکسان نیست. نقش ترقه، رگهٔ مسی و سایه‌های لعاب، امضای کوره است.
        </p>
        <h2>پخت دو مرحله‌ای</h2>
        <p>
          ابتدا بیسکوییت در ۹۸۰ درجه، سپس لعاب‌خوری و پخت گلَز در ۱۲۲۰ درجه.
          مجموعاً بیش از سی ساعت برای هر محموله؛ به همین دلیل بدنه‌ها کاملاً
          آب‌بند و ماندگارند.
        </p>
        <h2>تعهد ما</h2>
        <p>
          اگر محصولی سالم به دستتان نرسید، بدون پرسش جایگزین می‌کنیم. بسته‌بندی
          چندلایهٔ ما تا حالا کمتر از دو درصد آسیب دیده — و آن دو درصد را جدی گرفته‌ایم.
        </p>
      </div>
    </div>
  );
}
