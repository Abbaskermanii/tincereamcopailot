"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, X, Package, ReceiptText, Users, Loader2 } from "lucide-react";
import { apiJson } from "@/lib/api-client";
import { faPrice } from "@/lib/format";

interface ProductHit { id: string; name: string; sku: string; price: number; image_url: string | null }
interface OrderHit { id: string; order_number: string; customer_name: string; total_amount: number; status: string }
interface UserHit { id: string; email: string; full_name: string | null }

interface Results {
  products: ProductHit[];
  orders: OrderHit[];
  users: UserHit[];
}

const EMPTY: Results = { products: [], orders: [], users: [] };

/** Global admin search: one query → products, orders and users, in a modal. */
export function AdminSearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Results>(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) { setQ(""); setResults(EMPTY); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const query = q.trim();
    if (query.length < 2) { setResults(EMPTY); return; }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [p, o, u] = await Promise.all([
          apiJson<{ items: ProductHit[] }>(`/admin/products-v2?search=${encodeURIComponent(query)}&limit=5`, { signal: controller.signal } as RequestInit),
          apiJson<{ items: OrderHit[] }>(`/admin/orders-v2?search=${encodeURIComponent(query)}&limit=5`, { signal: controller.signal } as RequestInit),
          apiJson<{ items: UserHit[] }>(`/admin/users?search=${encodeURIComponent(query)}&limit=5`, { signal: controller.signal } as RequestInit),
        ]);
        setResults({ products: p?.items ?? [], orders: o?.items ?? [], users: u?.items ?? [] });
      } catch {
        /* aborted or failed — keep previous results */
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [q, open]);

  if (!open) return null;

  const total = results.products.length + results.orders.length + results.users.length;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="جست‌وجوی پنل مدیریت">
      <button type="button" aria-label="بستن جست‌وجو" className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-char/10 bg-surface shadow-deep dark:border-white/10 dark:bg-[#262320]">
        {/* Input row */}
        <div className="flex items-center gap-3 border-b border-char/10 px-4 py-3 dark:border-white/10">
          <Search className="h-5 w-5 shrink-0 text-char-soft" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جست‌وجوی محصول، سفارش یا کاربر…"
            className="min-h-[36px] w-full bg-transparent text-sm outline-none placeholder:text-char-soft/50 dark:placeholder:text-white/30"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-char-soft" />}
          <button type="button" onClick={onClose} aria-label="بستن" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-char/5 dark:hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[55vh] overflow-y-auto p-2">
          {q.trim().length >= 2 && !loading && total === 0 && (
            <p className="p-8 text-center text-sm text-char-soft dark:text-white/40">نتیجه‌ای پیدا نشد.</p>
          )}
          {q.trim().length < 2 && (
            <p className="p-8 text-center text-sm text-char-soft dark:text-white/40">حداقل ۲ حرف بنویسید…</p>
          )}

          {results.products.length > 0 && (
            <div className="mb-2">
              <p className="px-3 pb-1 pt-2 text-[11px] font-bold text-char-soft dark:text-white/40">محصولات</p>
              {results.products.map((p) => (
                <Link key={p.id} href={`/admin/products/${p.id}`} onClick={onClose}
                  className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-char/5 dark:hover:bg-white/5">
                  <Package className="h-4 w-4 shrink-0 text-lajvard dark:text-lajvard-soft" />
                  <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                  <span className="shrink-0 text-[11px] text-char-soft dark:text-white/40">{p.sku}</span>
                </Link>
              ))}
            </div>
          )}

          {results.orders.length > 0 && (
            <div className="mb-2">
              <p className="px-3 pb-1 pt-2 text-[11px] font-bold text-char-soft dark:text-white/40">سفارش‌ها</p>
              {results.orders.map((o) => (
                <Link key={o.id} href={`/admin/orders/${o.id}`} onClick={onClose}
                  className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-char/5 dark:hover:bg-white/5">
                  <ReceiptText className="h-4 w-4 shrink-0 text-kiln-clay" />
                  <span className="min-w-0 flex-1 truncate text-sm">{o.order_number} — {o.customer_name}</span>
                  <span className="shrink-0 text-[11px] text-char-soft dark:text-white/40">{faPrice(o.total_amount)}</span>
                </Link>
              ))}
            </div>
          )}

          {results.users.length > 0 && (
            <div>
              <p className="px-3 pb-1 pt-2 text-[11px] font-bold text-char-soft dark:text-white/40">کاربران</p>
              {results.users.map((u) => (
                <Link key={u.id} href={`/admin/users`} onClick={onClose}
                  className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-char/5 dark:hover:bg-white/5">
                  <Users className="h-4 w-4 shrink-0 text-firouzeh" />
                  <span className="min-w-0 flex-1 truncate text-sm">{u.full_name || u.email}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
