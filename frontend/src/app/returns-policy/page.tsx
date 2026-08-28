import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "شرایط مرجوعی",
  description: "شرایط بازگشت کالای شکسته یا ناراضی از خرید در فروشگاه تن‌سِرام.",
};

const RULES: [string, string][] = [
  ["۷ روز مهلت", "از لحظهٔ تحویل، ۷ روز فرصت دارید مرجوعی را اعلام کنید."],
  ["شکستگی در حمل", "عکس از بسته‌بندی و محصول کافی است؛ بدون پرسش، تکهٔ نو می‌فرستیم."],
  ["پلمپ سلامت", "اگر نوار پلمپ باز نشده باشد، حتی «دلم نخواست» هم دلیل معتبری است."],
  ["هزینهٔ برگشت", "برای کالای معیوب با ما؛ برای سایر موارد هزینهٔ برگشت با خریدار است."],
];

export default function ReturnsPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 md:px-6">
      <h1 className="text-3xl font-extrabold md:text-4xl">شرایط مرجوعی و تعویض</h1>
      <p className="mt-4 leading-8 text-char-soft dark:text-ink-soft">
        سرامیک شکننده است و اعتماد سخت؛ این دو را جدی می‌گیریم.
      </p>
      <dl className="mt-10 space-y-6">
        {RULES.map(([title, body]) => (
          <div key={title} className="rounded-wobble bg-surface p-6 shadow-shelf dark:bg-black/25">
            <dt className="font-extrabold">{title}</dt>
            <dd className="mt-2 leading-8 text-char-soft dark:text-ink-soft">{body}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
