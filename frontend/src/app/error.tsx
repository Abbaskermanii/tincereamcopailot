"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="text-5xl" aria-hidden>🏺</span>
      <h2 className="text-xl font-black text-char dark:text-white/90">مشکلی پیش آمد</h2>
      <p className="text-sm text-char-soft dark:text-white/60">متأسفانه در نمایش این بخش خطایی رخ داد. میتوانید دوباره تلاش کنید.</p>
      <button
        onClick={() => reset()}
        className="min-h-[44px] rounded-xl bg-lajvard px-6 text-sm font-bold text-white transition hover:bg-lajvard-deep dark:bg-lajvard-soft dark:text-char"
      >
        تلاش مجدد
      </button>
    </div>
  );
}
