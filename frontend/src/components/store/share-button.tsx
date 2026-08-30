"use client";

import { useState } from "react";
import { Share2, Check, Link as LinkIcon } from "lucide-react";
import { SITE_URL } from "@/lib/api";
import { useToast } from "@/components/ui/toast-provider";

export function ShareButton({ title, slug, variant = "icon" }: { title: string; slug: string; variant?: "icon" | "full" }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const url = `${typeof window !== "undefined" ? window.location.origin : SITE_URL}/blog/${slug}`;

  async function share() {
    const shareData = { title, url };
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("لینک کپی شد", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("کپی انجام نشد", "error");
    }
  }

  if (variant === "full") {
    return (
      <button type="button" onClick={() => void share()} className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-lajvard px-4 text-sm text-white hover:bg-lajvard-deep dark:bg-lajvard-soft dark:text-char">
        {copied ? <Check className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
        {copied ? "کپی شد" : "کپی لینک"}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => void share()}
      aria-label="اشتراک‌گذاری"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-char/15 bg-surface hover:bg-char/5 dark:border-white/15 dark:bg-black/20"
    >
      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
    </button>
  );
}
