"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/email/newsletter-subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
        setMessage("عضویت شما تأیید شد.");
        setEmail("");
      } else {
        const data = await res.json().catch(() => null);
        setStatus("error");
        setMessage(data?.detail ?? "خطا در عضویت.");
      }
    } catch {
      setStatus("error");
      setMessage("خطا در اتصال.");
    }
  };

  return (
    <div>
      <p className="mb-2 text-sm font-bold">عضویت در خبرنامه</p>
      <p className="mb-3 text-xs text-char-soft dark:text-ink-soft">
        جدیدترین محصولات و تخفیف‌ها را دریافت کنید.
      </p>
      {status === "success" ? (
        <p className="text-sm text-firouzeh">{message}</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ایمیل خود را وارد کنید"
            required
            className="min-h-[40px] flex-1 rounded-xl border border-char/20 bg-white px-3 text-sm outline-none focus:border-lajvard dark:border-white/20 dark:bg-black/30"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="min-h-[40px] rounded-xl bg-lajvard px-4 text-sm text-white hover:bg-lajvard-deep disabled:opacity-50 dark:bg-lajvard-soft dark:text-char"
          >
            {status === "loading" ? "..." : "عضویت"}
          </button>
        </form>
      )}
      {status === "error" && <p className="mt-1 text-xs text-clay">{message}</p>}
    </div>
  );
}
