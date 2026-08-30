import type { Metadata } from "next";
import { CmsPage } from "@/components/cms/cms-page";

export const metadata: Metadata = { title: "شرایط مرجوعی", description: "شرایط بازگشت کالای شکسته یا ناراضی از خرید در فروشگاه تن‌سِرام." };

const RULES: [string, string][] = [
  ["۷ روز مهلت", "از لحظهٔ تحویل، ۷ روز فرصت دارید مرجوعی را اعلام کنید."],
  ["شکستگی در حمل", "عکس از بسته‌بندی و محصول کافی است؛ بدون پرسش، تکهٔ نو می‌فرستیم."],
  ["پلمپ سلامت", "اگر نوار پلمپ باز نشده باشد، حتی «دلم نخواست» هم دلیل معتبری است."],
  ["هزینهٔ برگشت", "برای کالای معیوب با ما؛ برای سایر موارد هزینهٔ برگشت با خریدار است."],
];

export default function ReturnsPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 md:px-6">
      <CmsPage
        slug="returns-policy"
        fallbackTitle="شرایط مرجوعی و تعویض"
        fallbackContent={
          <>
            <p className="leading-8 text-char-soft dark:text-ink-soft">سرامیک شکننده است و اعتماد سخت؛ این دو را جدی می‌گیریم.</p>
            <div className="mt-6 space-y-4">
              {RULES.map(([title, body]) => (
                <div key={title} className="rounded-wobble bg-surface p-4">
                  <p className="font-bold">{title}</p>
                  <p className="mt-1 text-sm leading-7 text-char-soft dark:text-ink-soft">{body}</p>
                </div>
              ))}
            </div>
          </>
        }
      />
    </div>
  );
}