import Link from "next/link";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <WifiOff size={48} className="mx-auto mb-6 text-char-soft" />
      <h1 className="text-2xl font-extrabold">اتصال اینترنت قطع است</h1>
      <p className="mt-4 leading-8 text-char-soft dark:text-ink-soft">
        نگران نباشید؛ سبد خرید شما محفوظ است. وقتی اینترنت وصل شد دوباره تلاش کنید.
      </p>
      <Link
        href="/"
        className="glaze-edge mt-8 inline-flex h-11 items-center bg-lajvard px-6 font-medium text-white dark:bg-lajvard-soft dark:text-char"
      >
        تلاش مجدد
      </Link>
    </div>
  );
}
