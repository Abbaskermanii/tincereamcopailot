"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";

export function StockNotify({ productId, compact }: { productId: string; compact?: boolean }) {
  const [contact, setContact] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!contact.trim() || loading) return;
    setLoading(true);
    try {
      const { apiFetch } = await import("@/lib/api-client");
      const res = await apiFetch(`/stock-notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, contact: contact.trim() }),
        _noDedup: true,
        _noCache: true,
      } as RequestInit);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || data.message || "خطا");
      setDone(true);
      toast(data.message ?? "شما در لیست اطلاع‌رسانی قرار گرفتید.", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "خطا", "error");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-firouzeh/15 p-4 text-sm font-medium">
        ✓ اطلاع‌رسانی فعال شد؛ به محض موجود شدن خبرتان می‌کنیم.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={compact ? "flex gap-2" : "rounded-wobble bg-surface p-4 shadow-shelf"}>
      {!compact && (
        <div className="mb-3 flex items-center gap-2 font-bold">
          <Bell size={16} className="text-lajvard" /> موجود شد خبرم کن
        </div>
      )}
      <Input
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        placeholder="ایمیل یا موبایل (09…)"
        dir="ltr"
        required
        className="flex-1"
        aria-label="ایمیل یا موبایل برای اطلاع‌رسانی موجودی"
      />
      <Button type="submit" disabled={loading} variant={compact ? "primary" : "secondary"} className={compact ? "" : "mt-3 w-full"}>
        {loading ? "…" : "ثبت"}
      </Button>
    </form>
  );
}