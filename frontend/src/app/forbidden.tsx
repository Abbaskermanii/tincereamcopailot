import Link from "next/link";

export default function Forbidden() {
  return (
    <div className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="num-latin text-7xl font-extrabold text-lajvard">۴۰۳</p>
      <h1 className="mt-5 text-2xl font-bold">عدم دسترسی</h1>
      <p className="mt-3 text-ink-soft">
        متأسفانه شما دسترسی به این صفحه را ندارید.
      </p>
      <div className="flex gap-4 mt-6">
        <Link
          href="/"
          className="glaze-edge inline-flex min-h-11 items-center rounded-xl bg-lajvard px-6 text-white"
        >
          بازگشت به خانه
        </Link>
        <Link
          href="/contact"
          className="glaze-edge inline-flex min-h-11 items-center rounded-xl bg-surface border border-char-soft px-6 text-ink"
        >
          تماس با پشتیبانی
        </Link>
      </div>
    </div>
  );
}