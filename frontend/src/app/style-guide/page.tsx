import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PriceTag } from "@/components/ui/price-tag";
import { StepperDemo } from "./stepper-demo";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = {
  title: "راهنمای طراحی",
  description: "کتابخانهٔ اجزای رابط کاربری آنیمور سرام",
  robots: { index: false },
};

const PALETTE = [
  { name: "لاجورد", hex: "#31547A", usage: "رنگ اصلی برند، دکمه‌ها" },
  { name: "فیروزه", hex: "#7A9E93", usage: "لهجهٔ ثانویه" },
  { name: "خاکِ کوره", hex: "#B0764F", usage: "تأکید گرم، تخفیف" },
  { name: "شیرِ سفال", hex: "#EDEAE3", usage: "پس‌زمینه" },
  { name: "زغالی", hex: "#26221F", usage: "متن" },
  { name: "مس", hex: "#9C6B5E", usage: "هایلایت" },
];

export default function StyleGuidePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-16 px-4 py-14">
      <header>
        <h1 className="text-3xl font-extrabold md:text-4xl">راهنمای سبک آنیمور سرام</h1>
        <p className="mt-3 max-w-xl leading-8 text-char-soft dark:text-ink-soft">
          امضای بصری فروشگاه: «لبهٔ لعاب» — هر عنصر تعامدی لبهٔ نامنظم چرخ‌کاری
          دارد و در حالت هاور، جلوهٔ لعابِ خیس روی لبه می‌نشیند.
        </p>
      </header>

      <section aria-labelledby="pal-h">
        <SectionHeading title="پالت رنگ" subtitle="برگرفته از لعاب و خاک کوره" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {PALETTE.map((c) => (
            <div key={c.hex} className="glaze-edge rounded-wobble bg-surface p-3 shadow-shelf">
              <div className="h-20 rounded-2xl" style={{ backgroundColor: c.hex }} />
              <p className="pt-3 font-bold">{c.name}</p>
              <p className="num-latin text-xs text-char-soft" dir="ltr">{c.hex}</p>
              <p className="text-xs text-char-soft dark:text-ink-soft">{c.usage}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="btn-h">
        <SectionHeading title="دکمه‌ها" subtitle="primary / secondary / ghost / danger × سه اندازه" />
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">افزودن به سبد</Button>
          <Button>خرید سریع</Button>
          <Button size="lg">ثبت سفارش</Button>
          <Button variant="secondary">دیدن بیشتر</Button>
          <Button variant="ghost">انصراف</Button>
          <Button variant="danger" disabled>ناموجود</Button>
        </div>
      </section>

      <section aria-labelledby="inp-h">
        <SectionHeading title="ورودی‌ها" />
        <div className="grid max-w-lg gap-4">
          <Field label="نام و نام خانوادگی" required>
            <Input placeholder="مثلاً سارا محمدی" />
          </Field>
          <Field label="یادداشت هدیه">
            <Textarea placeholder="برای همکار خوبم…" />
          </Field>
        </div>
      </section>

      <section aria-labelledby="mis-h">
        <SectionHeading title="اجزای کوچک" />
        <div className="flex flex-wrap items-center gap-6">
          <Badge tone="brand">جدید</Badge>
          <Badge tone="warm">فقط ۳ عدد</Badge>
          <Badge tone="success">موجود</Badge>
          <PriceTag price={385000} compareAtPrice={460000} />
          <StepperDemo />
        </div>
      </section>

      <section aria-labelledby="skel-h">
        <SectionHeading title="اسکلت‌بارگذاری" subtitle="به‌جای اسپینر، در همهٔ صفحات" />
        <div className="grid max-w-md grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="space-y-2">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </section>
    </div>
  );
}