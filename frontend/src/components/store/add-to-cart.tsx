"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { useToast } from "@/components/ui/toast-provider";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/local-store";

export function AddToCartPanel({
  product,
  compact,
  onVariantSelect,
}: {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    stock_qty: number;
    primary_image_url: string | null;
    variants?: Array<{
      id: string;
      name: string;
      sku: string;
      price_delta: number;
      absolute_price: number | null;
      stock_qty: number;
      is_active: boolean;
      image_url?: string;
    }>;
  };
  compact?: boolean;
  onVariantSelect?: (variant: {
    id: string;
    name: string;
    image_url?: string;
    price_delta: number;
    absolute_price: number | null;
    stock_qty: number;
  }) => void;
}) {
  const prefersReduced = useReducedMotion();
  const [qty, setQty] = useState(1);
  const [burst, setBurst] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(() =>
    product.variants && product.variants.length > 0 && product.variants[0] ? product.variants[0].id : null,
  );
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const { toast } = useToast();
  const router = useRouter();

  const selectedVariant = product.variants?.find((v) => v.id === selectedVariantId) ?? null;
  const effectivePrice = selectedVariant
    ? selectedVariant.absolute_price !== null
      ? Number(selectedVariant.absolute_price)
      : product.price + Number(selectedVariant.price_delta)
    : product.price;
  const effectiveStock = selectedVariant ? selectedVariant.stock_qty : product.stock_qty;
  const outOfStock = effectiveStock <= 0;

  // Keep selected variant in sync if product variants load async
  useEffect(() => {
    if (!selectedVariantId && product.variants && product.variants.length > 0) {
      setSelectedVariantId(product.variants[0]!.id);
    }
  }, [product.variants, selectedVariantId]);

  // Notify parent about selected variant change — side effect in effect, not render
  useEffect(() => {
    if (!onVariantSelect) return;
    onVariantSelect({
      id: selectedVariantId ?? "",
      name: selectedVariant?.name ?? "",
      image_url: selectedVariant?.image_url,
      price_delta: selectedVariant?.price_delta ?? 0,
      absolute_price: selectedVariant?.absolute_price ?? null,
      stock_qty: selectedVariant?.stock_qty ?? product.stock_qty,
    });
  }, [selectedVariantId, selectedVariant, product.stock_qty, onVariantSelect]);

  function handleAdd() {
    const price = effectivePrice;
    const stockQty = effectiveStock;
    const variantName = selectedVariant?.name ?? null;
    add(
      {
        productId: product.id,
        slug: product.slug,
        name: selectedVariant ? `${product.name} — ${selectedVariant.name}` : product.name,
        price,
        imageUrl: selectedVariant?.image_url ?? product.primary_image_url,
        stockQty,
        variantId: selectedVariantId,
        variantName,
        variantSku: selectedVariant?.sku ?? null,
        variantImageUrl: selectedVariant?.image_url ?? null,
      },
      qty,
    );
    setBurst(true);
    setTimeout(() => setBurst(false), 600);
    toast("به سبد خرید اضافه شد");
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {product.variants && product.variants.length > 0 && (
          <select
            value={selectedVariantId ?? ""}
            onChange={(e) => setSelectedVariantId(e.target.value)}
            className="h-10 w-full rounded-xl border border-char/15 bg-surface px-3 text-sm dark:border-white/15"
            aria-label="انتخاب گونه"
          >
            {product.variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} {v.stock_qty <= 0 ? "(ناموجود)" : ""} {v.absolute_price !== null ? `— ${v.absolute_price}` : v.price_delta !== 0 ? `(${v.price_delta > 0 ? "+" : ""}${v.price_delta})` : ""}
              </option>
            ))}
          </select>
        )}
        <Button size="lg" disabled={outOfStock} onClick={handleAdd} className="w-full">
          <ShoppingBag size={19} />
          {outOfStock ? "ناموجود" : "افزودن به سبد"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {product.variants && product.variants.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">گونه</label>
          <div className="grid gap-2 sm:grid-cols-2">
            {product.variants.map((v) => {
              const isSelected = v.id === selectedVariantId;
              const varPrice = v.absolute_price !== null ? Number(v.absolute_price) : product.price + Number(v.price_delta);
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVariantId(v.id)}
                  disabled={v.stock_qty <= 0}
                  className={`rounded-xl border p-3 text-right text-sm transition ${isSelected ? "border-lajvard bg-lajvard/10 dark:border-lajvard-soft dark:bg-lajvard-soft/10" : "border-char/15 bg-surface hover:border-char/30 dark:border-white/15"} ${v.stock_qty <= 0 ? "opacity-50" : ""}`}
                >
                  <div className="font-medium">{v.name}</div>
                  <div className="num-latin mt-1 text-xs text-char-soft dark:text-ink-soft">
                    {varPrice.toLocaleString("fa-IR")} تومان {v.stock_qty > 0 ? `— ${v.stock_qty} موجود` : "— ناموجود"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className="flex items-center gap-3">
        <QuantityStepper value={qty} onChange={setQty} max={Math.max(effectiveStock, 1)} />
        {!outOfStock && effectiveStock <= 5 && (
          <span className="text-xs font-medium text-clay">
            فقط {new Intl.NumberFormat("fa-IR").format(effectiveStock)} عدد در انبار
          </span>
        )}
      </div>

      <div className="relative inline-flex w-full gap-2 sm:w-auto">
        <Button size="lg" disabled={outOfStock} onClick={handleAdd} className="flex-1 sm:flex-none sm:min-w-56">
          <ShoppingBag size={19} />
          {outOfStock ? "ناموجود" : "افزودن به سبد خرید"}
        </Button>
        <motion.span
          aria-hidden
          initial={{ scale: 0, opacity: 0.9 }}
          animate={burst ? { scale: 2.2, opacity: 0 } : { scale: 0 }}
          transition={{ duration: prefersReduced ? 0 : 0.6, ease: "easeOut" }}
          className="pointer-events-none absolute inset-0 rounded-wobble border-2 border-firouzeh"
        />
        <Button
          size="lg"
          variant="secondary"
          aria-label="افزودن به علاقه‌مندی‌ها"
          aria-pressed={has(product.id)}
          onClick={() => {
            toggle(product.id);
            toast(has(product.id) ? "از علاقه‌مندی‌ها حذف شد" : "به علاقه‌مندی‌ها اضافه شد");
          }}
        >
          <Heart size={19} className={has(product.id) ? "fill-clay text-clay" : ""} />
        </Button>
      </div>

      <Button variant="ghost" className="w-full" onClick={() => router.push("/cart")}>
        مشاهدهٔ سبد خرید
      </Button>
    </div>
  );
}