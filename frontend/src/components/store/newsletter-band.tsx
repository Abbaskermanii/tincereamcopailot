"use client";

import { useState, type FormEvent } from "react";
import { useToast } from "@/components/ui/toast-provider";
import { Button } from "@/components/ui/button";

export function NewsletterBand() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  async function subscribe(e: FormEvent) {
    e.preventDefault();
    if (!email.includes("@") || loading) return;
    setLoading(true);
    try {
      const { apiFetch } = await import("@/lib/api-client");
      // بک‌اند email را به‌صورت query می‌گیرد (?email=)
      const response = await apiFetch(`/newsletter?email=${encodeURIComponent(email)}`, {
        method: "POST",
        _noDedup: true,
        _noCache: true,
      } as RequestInit);
      if (!response.ok) throw new Error("newsletter request failed");
      setDone(true);
      toast("کد تخفیف ۱۵٪ اولین خرید برایتان ارسال می‌شود!");
    } catch {
      toast("ثبت ایمیل انجام نشد؛ دوباره تلاش کنید.", "error");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <section className="mx-auto my-20 max-w-7xl px-4 md:px-6" aria-label="خبرنامه">
        <div className="glaze-edge rounded-wobble bg-lajvard p-10 text-center text-slip shadow-lifted dark:bg-black/40">
          <p className="text-xl font-extrabold">عضویت شما ثبت شد</p>
          <p className="mt-3 text-sm opacity-90">کد WELCOME15 را در سبد خرید وارد کنید.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto my-20 max-w-7xl px-4 md:px-6" aria-labelledby="nl-h">
      <div
        id="nl-h"
        className="kiln-reveal rounded-wobble bg-gradient-to-l from-lajvard to-[#26415F] p-10 text-center text-white shadow-lifted"
      >
        <h2 className="text-2xl font-extrabold md:text-3xl">۱۵٪ تخفیف اولین سفارش</h2>
        <p className="mt-3 text-sm leading-8 opacity-90">
          عضو خبرنامهٔ کوره شوید؛ هر پخت تازه، اول به دست شما می‌رسد.
        </p>
        <form onSubmit={subscribe} className="mx-auto mt-6 flex max-w-md gap-2">
          <input
            type="email"
            required
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="نشانی ایمیل"
            className="num-latin h-12 flex-1 rounded-xl border-0 bg-white/95 px-4 text-char placeholder:text-char/50 focus:outline-none focus:ring-2 focus:ring-firouzeh"
          />
          <Button type="submit" size="lg" variant="secondary" className="!border-white/60 !text-white hover:!bg-white/10" disabled={loading}>
            {loading ? "..." : "عضویت"}
          </Button>
        </form>
      </div>
    </section>
  );
}