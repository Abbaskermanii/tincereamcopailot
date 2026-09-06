"use client";

import Link from "next/link";
import { useState } from "react";
import { ReceiptText, Eye } from "lucide-react";
import { DataTable, EmptyState, ErrorBanner, PageHeader, Pagination, SelectInput, StatusBadge, Toolbar } from "@/components/admin/kit";
import { useAdminResource } from "@/lib/admin-hooks";
import { faNum, faPrice, toPersianDigits } from "@/lib/format";

interface OrderRow {
  id: string; order_number: string; customer_name: string;
  phone: string; total_amount: number; status: string;
  created_at: string; items_count: number;
}

export default function AdminOrdersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const qs = new URLSearchParams({ offset: String((page - 1) * 20), limit: "20" });
  if (search) qs.set("search", search);
  if (status) qs.set("status", status);

  const { data, loading, error, reload } = useAdminResource<{ total: number; items: OrderRow[] }>(`/admin/orders-v2?${qs}`, [search, status, page]);
  const pages = data ? Math.max(1, Math.ceil(data.total / 20)) : 1;

  return (
    <div>
      <PageHeader
        title="سفارش‌ها"
        description={`${data?.total ?? "…"} سفارش`}
      />

      {error && <ErrorBanner message={error} onRetry={reload} />}

      <Toolbar search={search} onSearch={(v) => { setSearch(v); setPage(1); }}>
        <SelectInput value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="max-w-[160px]" aria-label="فیلتر وضعیت">
          <option value="">همه وضعیت‌ها</option>
          <option value="pending">در انتظار پرداخت</option>
          <option value="paid">پرداخت‌شده</option>
          <option value="processing">در حال پردازش</option>
          <option value="shipped">ارسال‌شده</option>
          <option value="delivered">تحویل‌شده</option>
          <option value="cancelled">لغوشده</option>
        </SelectInput>
      </Toolbar>

      {(!data?.items?.length && !loading && !error) ? (
        <EmptyState icon={<ReceiptText className="h-12 w-12" />} title="هنوز سفارشی ثبت نشده" description="سفارش‌ها اینجا نمایش داده خواهند شد." />
      ) : (
        <DataTable
          loading={loading}
          rows={data?.items ?? []}
          empty="سفارشی یافت نشد."
          columns={[
            {
              key: "order_number", label: "شماره سفارش", render: (r) => (
                <Link href={`/admin/orders/${r.id}`} className="font-medium num-latin underline-offset-4 hover:underline">#{r.order_number}</Link>
              ),
            },
            { key: "customer_name", label: "مشتری", render: (r) => <span>{r.customer_name || "مهمان"}</span> },
            { key: "phone", label: "تلفن", render: (r) => <span className="num-latin text-ink-soft">{r.phone || "—"}</span> },
            { key: "items_count", label: "اقلام", render: (r) => <span className="num-latin">{faNum(r.items_count)}</span> },
            { key: "total_amount", label: "مبلغ کل", render: (r) => <span className="font-bold">{faPrice(r.total_amount)}</span> },
            { key: "status", label: "وضعیت", render: (r) => <StatusBadge status={r.status} /> },
            {
              key: "created_at", label: "تاریخ", render: (r) => (
                <span className="num-latin text-ink-soft">{toPersianDigits(new Date(r.created_at).toLocaleDateString("fa-IR"))}</span>
              ),
            },
          ]}
          actions={(r) => (
            <Link href={`/admin/orders/${r.id}`} className="glaze-edge inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-char/20 px-3 py-1.5 text-sm transition-all hover:shadow-shelf dark:border-white/20">
              <Eye className="h-3.5 w-3.5" /> جزئیات
            </Link>
          )}
        />
      )}

      <Pagination page={page} pages={pages} onPage={setPage} />
    </div>
  );
}
