import Link from "next/link";
import type { Metadata } from "next";
import { ClearCartOnConfirm } from "./clear-cart";

export const metadata: Metadata = {
  title: "ثبت سفارش موفق",
  robots: { index: false },
};

/**
 * The payment gateway redirects to the frontend callback adapter, which asks
 * the backend to verify the payment before forwarding the user here.
 */
export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const orderNumber =
    typeof searchParams.order === "string" ? searchParams.order : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      {orderNumber ? <ClearCartOnConfirm /> : null}
      <div className="glaze-edge mx-auto mb-8 inline-block rounded-wobble bg-surface px-10 py-12 shadow-lifted dark:bg-black/25">
        <p className="text-5xl" aria-hidden>🏺</p>
        <h1 className="mt-6 text-2xl font-extrabold">سفارش شما ثبت شد</h1>
        {orderNumber ? (
          <>
            <p className="num-latin mt-3 text-lg font-bold text-lajvard dark:text-lajvard-soft" dir="ltr">
              {orderNumber}
            </p>
            <p className="mt-4 leading-8 text-char-soft dark:text-ink-soft">
              وضعیت پرداخت را می‌توانید همین حالا یا بعداً با شمارهٔ سفارش پیگیری کنید.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link
                href={`/track?order=${orderNumber}`}
                className="glaze-edge inline-flex h-11 items-center bg-lajvard px-6 font-medium text-white dark:bg-lajvard-soft dark:text-char"
              >
                پیگیری سفارش
              </Link>
              <Link
                href="/"
                className="inline-flex h-11 items-center rounded-wobble border border-lajvard/50 px-6 font-medium text-lajvard dark:border-lajvard-soft/40 dark:text-lajvard-soft"
              >
                بازگشت به فروشگاه
              </Link>
            </div>
          </>
        ) : (
          <p className="mt-4 text-char-soft dark:text-ink-soft">
            شمارهٔ سفارش یافت نشد؛ از صفحهٔ پیگیری، شمارهٔ خود را وارد کنید.
          </p>
        )}
      </div>
    </div>
  );
}
