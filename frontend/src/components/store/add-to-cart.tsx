"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { useToast } from "@/components/ui/toast-provider";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/local-store";

export function AddToCartPanel({
  product,
  compact,
}: {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    stock_qty: number;
    primary_image_url: string | null;
  };
  compact?: boolean;
}) {
  const [qty, setQty] = useState(1);
  const [burst, setBurst] = useState(false);
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const { toast } = useToast();
  const router = useRouter();
  const outOfStock = product.stock_qty <= 0;

  function handleAdd() {
    add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        imageUrl: product.primary_image_url,
        stockQty: product.stock_qty,
      },
      qty,
    );
    setBurst(true);
    setTimeout(() => setBurst(false), 600);
    toast("به سبد خرید اضافه شد");
  }

  if (compact) {
    return (
      <Button size="lg" disabled={outOfStock} onClick={handleAdd} className="w-full">
        <ShoppingBag size={19} />
        {outOfStock ? "ناموجود" : "افزودن به سبد"}
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <QuantityStepper value={qty} onChange={setQty} max={Math.max(product.stock_qty, 1)} />
        {!outOfStock && product.stock_qty <= 5 && (
          <span className="text-xs font-medium text-clay">
            فقط {new Intl.NumberFormat("fa-IR").format(product.stock_qty)} عدد در انبار
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
          transition={{ duration: 0.6, ease: "easeOut" }}
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
