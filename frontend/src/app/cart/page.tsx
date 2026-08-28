"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { EmptyState } from "@/components/ui/empty-state";
import { useCart } from "@/lib/cart";
import { faNum, faPrice } from "@/lib/format";
import { mediaUrl } from "@/lib/api";

export default function CartPage() {
  const { lines, subtotal, setQuantity, remove } = useCart();
  const router = useRouter();

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <EmptyState
          title="سبد خرید شما خالی است"
          description="سراغ قفسه‌های ما بروید؛ هر تکه تازه از کوره بیرون آمده."
          action={<Button onClick={() => router.push("/")}>دیدن مجموعه‌ها</Button>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <h1 className="mb-8 text-3xl font-extrabold">سبد خرید</h1>

      <div className="space-y-4">
        {lines.map((l) => (
          <article
            key={l.productId}
            className="flex items-center gap-4 rounded-wobble bg-surface p-4 shadow-shelf dark:bg-black/25"
          >
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slip dark:bg-black/30">
              {l.imageUrl && (
                <Image src={mediaUrl(l.imageUrl)} alt={l.name} fill sizes="96px" className="object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Link href={`/product/${l.slug}`} className="line-clamp-1 font-semibold hover:text-lajvard">
                {l.name}
              </Link>
              <p className="mt-1 text-sm text-char-soft dark:text-ink-soft">{faPrice(l.price)}</p>
              <div className="mt-3">
                <QuantityStepper
                  value={l.quantity}
                  onChange={(q) => setQuantity(l.productId, q)}
                  max={Math.max(l.stockQty, 1)}
                />
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-3">
              <button
                aria-label={`حذف ${l.name}`}
                onClick={() => remove(l.productId)}
                className="rounded-xl p-2 text-char-soft hover:bg-clay/10 hover:text-clay"
              >
                <Trash2 size={18} />
              </button>
              <p className="font-bold text-lajvard dark:text-lajvard-soft">
                {faNum(l.price * l.quantity)}
              </p>
            </div>
          </article>
        ))}
      </div>

      <footer className="mt-10 flex flex-col gap-6 rounded-wobble bg-surface p-6 shadow-shelf sm:flex-row sm:items-center sm:justify-between dark:bg-black/25">
        <div>
          <p className="text-sm text-char-soft dark:text-ink-soft">جمع کل (بدون ارسال)</p>
          <p className="mt-1 text-2xl font-extrabold text-lajvard dark:text-lajvard-soft">
            {faPrice(subtotal)}
          </p>
          <p className="mt-1 text-xs text-char-soft dark:text-ink-soft">
            هزینهٔ ارسال در مرحلهٔ بعد محاسبه می‌شود.
          </p>
        </div>
        <Button size="lg" onClick={() => router.push("/checkout")} className="w-full sm:w-auto">
          ادامهٔ خرید و پرداخت
        </Button>
      </footer>
    </div>
  );
}
