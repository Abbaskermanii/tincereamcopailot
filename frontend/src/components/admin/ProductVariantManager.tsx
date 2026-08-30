"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { apiJson, authHeaders } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast-provider";
import { cn } from "@/lib/utils";

interface Variant {
  id: string;
  name: string;
  sku: string;
  image_url?: string | null;
  price_delta: number;
  absolute_price?: number | null;
  stock_qty: number;
  is_active: boolean;
}

interface ProductVariantManagerProps {
  productId: string;
  onVariantSelect?: (variant: Variant) => void;
  onVariantAdd?: (variant: Variant) => void;
  onVariantDelete?: (variantId: string) => void;
}

export function ProductVariantManager({
  productId,
  onVariantSelect,
  onVariantAdd,
  onVariantDelete,
}: ProductVariantManagerProps) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [newVariant, setNewVariant] = useState({
    name: "",
    sku: "",
    price_delta: 0,
    stock_qty: 0,
    is_active: true,
  });
  const { toast } = useToast();

  const fetchVariants = useCallback(async () => {
    try {
      const data = await apiJson<Variant[]>(`admin/products/${productId}/variants`, {
        headers: authHeaders(true),
      });
      setVariants(data || []);
    } catch {
      toast("واریانت‌ها دریافت نشد.", "error");
    }
  }, [productId, toast]);

  useEffect(() => {
    void fetchVariants();
  }, [fetchVariants]);

  const handleAdd = async () => {
    if (!newVariant.name.trim() || !newVariant.sku.trim()) {
      toast("نام و SKU واجب هستند.", "error");
      return;
    }
    try {
      const data = await apiJson<Variant>(
        `admin/products/${productId}/variants`,
        {
          method: "POST",
          headers: authHeaders(true),
          body: JSON.stringify({
            name: newVariant.name,
            sku: newVariant.sku,
            price_delta: newVariant.price_delta,
            stock_qty: newVariant.stock_qty,
            is_active: newVariant.is_active,
          }),
        }
      );
      setVariants((prev) => [...prev, data]);
      setNewVariant({
        name: "",
        sku: "",
        price_delta: 0,
        stock_qty: 0,
        is_active: true,
      });
      toast("وارینت افزوده شد.", "success");
      onVariantAdd?.(data);
    } catch (e) {
      const msg = e && typeof e === "object" && "detail" in e ? String((e as { detail: string }).detail) : "خطا در افزودن وارینت";
      toast(msg, "error");
    }
  };

  const handleDelete = async (variantId: string) => {
    if (!window.confirm("این وارینت حذف شود؟")) return;
    try {
      await apiJson(`admin/variants/${variantId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      setVariants((prev) => prev.filter((v) => v.id !== variantId));
      toast("وارینت حذف شد.", "success");
      onVariantDelete?.(variantId);
    } catch {
      toast("خطا در حذف وارینت", "error");
    }
  };

  const handleSelect = (variant: Variant) => {
    setVariants((prev) =>
      prev.map((v) => ({
        ...v,
        is_active: v.id === variant.id,
      }))
    );
    onVariantSelect?.(variant);
  };

  return (
    <div className="space-y-4">
      <div className="glaze-edge rounded-wobble bg-surface p-6 shadow-shelf dark:bg-black/25">
        <h2 className="text-xl font-bold mb-4">واریانت‌ها</h2>
        {variants.length === 0 ? (
          <p className="text-char-soft dark:text-ink-soft">وارینتی اضافه نشده است. ابتدا وارینت جدید افزوده کنید.</p>
        ) : (
          <div className="overflow-x-auto rounded-wobble">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-char/10 dark:border-white/10">
                  <th className="whitespace-nowrap p-4 text-xs font-medium text-ink-soft">نام</th>
                  <th className="whitespace-nowrap p-4 text-xs font-medium text-ink-soft">SKU</th>
                  <th className="whitespace-nowrap p-4 text-xs font-medium text-ink-soft">تصویر</th>
                  <th className="whitespace-nowrap p-4 text-xs font-medium text-ink-soft">قیمت Delta</th>
                  <th className="whitespace-nowrap p-4 text-xs font-medium text-ink-soft">موجودی</th>
                  <th className="whitespace-nowrap p-4 text-xs font-medium text-ink-soft">فعال</th>
                  <th className="whitespace-nowrap p-4 text-xs font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant) => (
                  <tr key={variant.id} className="border-b border-char/5 last:border-0 hover:bg-char/[0.03] dark:border-white/5 dark:hover:bg-white/[0.03]">
                    <td className="max-w-xs truncate p-4 font-medium">{variant.name}</td>
                    <td className="p-4 num-latin text-ink-soft">{variant.sku}</td>
                    <td className="p-4">
                      {variant.image_url ? (
                        <Image src={variant.image_url} alt={variant.name} width={40} height={40} unoptimized className="h-10 w-10 rounded-xl object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-xl border border-dashed border-char/20 bg-slip dark:border-white/15 dark:bg-black/30 flex items-center justify-center">
                          <p className="text-[10px] text-ink-soft">بدون تصویر</p>
                        </div>
                      )}
                    </td>
                    <td className="p-4 num-latin">{variant.price_delta > 0 ? `+${variant.price_delta}` : "ثابت"}</td>
                    <td className="p-4 num-latin">{variant.stock_qty}</td>
                    <td className="p-4">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", variant.is_active ? "bg-firouzeh/20 text-firouzeh" : "bg-char/10 text-char-soft dark:bg-white/10 dark:text-ink-soft")}>
                        {variant.is_active ? "بله" : "خیر"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <button type="button" onClick={() => handleSelect(variant)} className="glaze-edge min-h-[36px] rounded-lg border border-char/20 px-3 py-1.5 text-sm transition-all hover:shadow-shelf dark:border-white/20">
                          انتخاب
                        </button>
                        {onVariantDelete && (
                          <button type="button" onClick={() => void handleDelete(variant.id)} className="min-h-[36px] rounded-lg px-3 py-1.5 text-sm text-clay transition-colors hover:bg-clay/10">
                            حذف
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 p-4 glaze-edge rounded-wobble bg-clay/5 border border-clay/15 dark:bg-clay/5">
          <h3 className="text-sm font-medium mb-3">افزودن وارینت جدید</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="نام وارینت"
              value={newVariant.name}
              onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
              className="w-full min-h-[44px] rounded-xl border border-char/20 bg-surface px-3 py-2.5 text-sm outline-none focus:border-lajvard dark:border-white/20 dark:bg-black/25"
              required
            />
            <input
              placeholder="SKU"
              type="text"
              value={newVariant.sku}
              onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
              className="w-full min-h-[44px] rounded-xl border border-char/20 bg-surface px-3 py-2.5 text-sm outline-none focus:border-lajvard dark:border-white/20 dark:bg-black/25"
              required
            />
            <input
              placeholder="قیمت_delta"
              type="number"
              value={newVariant.price_delta}
              onChange={(e) => setNewVariant({ ...newVariant, price_delta: Number(e.target.value) })}
              className="w-full min-h-[44px] rounded-xl border border-char/20 bg-surface px-3 py-2.5 text-sm outline-none focus:border-lajvard dark:border-white/20 dark:bg-black/25"
            />
            <input
              placeholder="موجودی"
              type="number"
              value={newVariant.stock_qty}
              onChange={(e) => setNewVariant({ ...newVariant, stock_qty: Number(e.target.value) })}
              className="w-full min-h-[44px] rounded-xl border border-char/20 bg-surface px-3 py-2.5 text-sm outline-none focus:border-lajvard dark:border-white/20 dark:bg-black/25"
            />
          </div>
          <button
            type="button"
            onClick={() => void handleAdd()}
            className="glaze-edge w-full mt-4 min-h-[44px] rounded-xl bg-lajvard px-4 py-2 text-sm text-white transition-all hover:bg-lajvard-deep hover:shadow-lifted disabled:opacity-50 dark:bg-lajvard-soft dark:text-char"
          >
            {newVariant.name ? "ویرایش وارینت" : "افزودن وارینت"}
          </button>
        </div>
      </div>
    </div>
  );
}
