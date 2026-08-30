"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { DataTable, PageHeader, Pagination } from "@/components/admin/kit";
import { useAdminResource } from "@/lib/admin-hooks";
import { faNum } from "@/lib/format";
import { useState } from "react";

interface StockItem {
  id: string; name: string; slug: string; sku: string;
  stock_qty: number; is_active: boolean;
  category_name: string | null; brand_name: string | null;
}

export default function AdminStockAlertsPage() {
  const [stock, setStock] = useState("low");
  const [page, setPage] = useState(1);

  const qs = new URLSearchParams({ offset: String((page - 1) * 50), limit: "50" });
  if (stock) qs.set("stock", stock);

  const { data, loading } = useAdminResource<{ total: number; items: StockItem[] }>(`/admin/products-v2?${qs}`, [stock, page]);
  const pages = data ? Math.max(1, Math.ceil(data.total / 50)) : 1;

  const lowCount = (data?.items ?? []).filter((i) => i.stock_qty > 0 && i.stock_qty <= 5).length;
  const outCount = (data?.items ?? []).filter((i) => i.stock_qty === 0).length;

  return (
    <div>
      <PageHeader
        title="هشدار موجودی"
        description="محصولات با موجودی کم یا ناموجود"
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <button type="button" onClick={() => { setStock("low"); setPage(1); }} className={`rounded-2xl p-4 text-right shadow-shelf transition-colors ${stock === "low" ? "bg-amber-500/15 ring-2 ring-amber-500/30" : "bg-surface"}`}>
          <p className="text-xs text-ink-soft">موجودی کم</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-600 dark:text-amber-400">{faNum(lowCount)}</p>
        </button>
        <button type="button" onClick={() => { setStock("out"); setPage(1); }} className={`rounded-2xl p-4 text-right shadow-shelf transition-colors ${stock === "out" ? "bg-clay/15 ring-2 ring-clay/30" : "bg-surface"}`}>
          <p className="text-xs text-ink-soft">ناموجود</p>
          <p className="mt-1 text-2xl font-extrabold text-clay">{faNum(outCount)}</p>
        </button>
        <button type="button" onClick={() => { setStock("in"); setPage(1); }} className={`rounded-2xl p-4 text-right shadow-shelf transition-colors ${stock === "in" ? "bg-firouzeh/15 ring-2 ring-firouzeh/30" : "bg-surface"}`}>
          <p className="text-xs text-ink-soft">موجود</p>
          <p className="mt-1 text-2xl font-extrabold text-firouzeh">{faNum((data?.total ?? 0) - lowCount - outCount)}</p>
        </button>
      </div>

      <DataTable
        loading={loading}
        rows={data?.items ?? []}
        empty="محصولی یافت نشد."
        columns={[
          {
            key: "name", label: "محصول", render: (r) => (
              <Link href={`/admin/products/${r.id}`} className="font-medium underline-offset-4 hover:underline">{r.name}</Link>
            ),
          },
          { key: "sku", label: "کد", render: (r) => <span className="text-ink-soft">{r.sku}</span> },
          { key: "category_name", label: "دسته", render: (r) => r.category_name ?? "—" },
          { key: "brand_name", label: "برند", render: (r) => r.brand_name ?? "—" },
          {
            key: "stock_qty", label: "موجودی", render: (r) => (
              <span className={`inline-flex items-center gap-1 font-bold ${r.stock_qty === 0 ? "text-clay" : "text-amber-600 dark:text-amber-400"}`}>
                {r.stock_qty === 0 && <AlertTriangle className="h-3.5 w-3.5" />}
                {faNum(r.stock_qty)} عدد
              </span>
            ),
          },
        ]}
      />

      <Pagination page={page} pages={pages} onPage={setPage} />
    </div>
  );
}
