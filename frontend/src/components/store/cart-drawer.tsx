"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { CartIcon, XIcon, PlusIcon, MinusIcon, TrashIcon } from "./icons";

// ⚠️ اگر مسیر صفحه تسویه‌حساب یا فروشگاه شما متفاوت است فقط این دو را تغییر دهید
const CHECKOUT_URL = "/checkout";
const SHOP_URL = "/shop";

const fmt = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

export function CartButton({ className = "" }: { className?: string }) {
  const { count, openCart, hydrated } = useCart();
  return (
    <button
      onClick={openCart}
      aria-label="سبد خرید"
      className={`relative rounded-full p-2 text-stone-700 transition hover:bg-stone-100 ${className}`}
    >
      <CartIcon className="h-6 w-6" />
      {hydrated && count > 0 && (
        <span className="absolute -top-0.5 -left-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-600 px-1 text-[10px] font-black text-white">
          {fmt(count)}
        </span>
      )}
    </button>
  );
}

export function CartDrawer() {
  const { items, count, subtotal, isOpen, closeCart, removeItem, setQty } = useCart();

  // Defensive check for undefined items
  const cartItems = items || [];

  return (
    <>
      {/* پس‌زمینه تیره */}
      <div
        onClick={closeCart}
        aria-hidden={!isOpen}
        className={`fixed inset-0 z-[90] bg-stone-950/50 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* پنل سبد — از سمت چپ باز می‌شود */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="سبد خرید"
        aria-hidden={!isOpen}
        className="fixed inset-y-0 left-0 z-[100] flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-out will-change-transform"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(-105%)" }}
      >
        {/* هدر */}
        <header className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <CartIcon className="h-5 w-5 text-stone-700" />
            <h2 className="text-base font-black text-stone-900">سبد خرید</h2>
            {count > 0 && (
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-bold text-stone-600">
                {fmt(count)} کالا
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            aria-label="بستن سبد خرید"
            className="rounded-full p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </header>

        {/* آیتم‌ها */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cartItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-16 text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-stone-100">
                <CartIcon className="h-9 w-9 text-stone-400" />
              </span>
              <div>
                <p className="text-base font-bold text-stone-800">سبد خرید شما خالی است</p>
                <p className="mt-1 text-sm text-stone-500">هنوز چیزی اضافه نکرده‌اید.</p>
              </div>
              <Link
                href={SHOP_URL}
                onClick={closeCart}
                className="rounded-xl bg-stone-900 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-stone-700"
              >
                رفتن به فروشگاه
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {cartItems.map((item) => (
                <li
                  key={item.key}
                  className="flex gap-3 rounded-2xl border border-stone-100 bg-stone-50/60 p-3"
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/product/${item.slug}`}
                        onClick={closeCart}
                        className="line-clamp-2 text-sm font-bold text-stone-800 transition hover:text-amber-800"
                      >
                        {item.name}
                      </Link>
                      <button
                        onClick={() => removeItem(item.key)}
                        aria-label="حذف از سبد"
                        className="shrink-0 rounded-lg p-1.5 text-stone-400 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>

                    {item.variantName && (
                      <span className="mt-1 w-fit rounded-md bg-stone-100 px-2 py-0.5 text-[11px] text-stone-500">
                        {item.variantName}
                      </span>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="inline-flex items-center rounded-lg border border-stone-200 bg-white">
                        <button
                          onClick={() => setQty(item.key, item.qty - 1)}
                          aria-label="کاهش تعداد"
                          className="p-1.5 text-stone-600 transition hover:text-stone-900"
                        >
                          <MinusIcon className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-[1.75rem] text-center text-sm font-black text-stone-900">
                          {fmt(item.qty)}
                        </span>
                        <button
                          onClick={() => setQty(item.key, item.qty + 1)}
                          disabled={item.stockQty != null && item.qty >= item.stockQty}
                          aria-label="افزایش تعداد"
                          className="p-1.5 text-stone-600 transition hover:text-stone-900 disabled:opacity-30"
                        >
                          <PlusIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-black text-stone-900">
                          {fmt(item.price * item.qty)}
                        </span>
                        <span className="text-[10px] text-stone-400">تومان</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* فوتر: جمع فاکتور + دکمه خرید */}
        {cartItems.length > 0 && (
          <footer className="border-t border-stone-100 bg-white px-5 pb-5 pt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs text-stone-400">
              <span>هزینه ارسال</span>
              <span>در مرحله پرداخت محاسبه می‌شود</span>
            </div>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-bold text-stone-700">جمع فاکتور</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-stone-900">{fmt(subtotal)}</span>
                <span className="text-xs text-stone-500">تومان</span>
              </div>
            </div>
            <Link
              href={CHECKOUT_URL}
              onClick={closeCart}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-stone-900/10 transition hover:bg-stone-700 active:scale-[0.99]"
            >
              <CartIcon className="h-4.5 w-4.5 h-5 w-5" />
              ادامه و ثبت سفارش
            </Link>
            <button
              onClick={closeCart}
              className="mt-2 w-full rounded-xl py-2.5 text-sm font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
            >
              ادامه خرید
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}
