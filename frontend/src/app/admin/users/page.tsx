"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { DataTable, EmptyState, PageHeader, Pagination, Toolbar } from "@/components/admin/kit";
import { useAdminResource } from "@/lib/admin-hooks";
import { toPersianDigits } from "@/lib/format";

interface UserRow {
  id: string; email: string; full_name: string | null;
  phone: string | null; is_admin: boolean; is_active: boolean;
  role_id: string | null; role_name: string | null;
  last_login_at: string | null; created_at: string;
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const qs = new URLSearchParams({ offset: String((page - 1) * 20), limit: "20" });
  if (search) qs.set("search", search);

  const { data, loading } = useAdminResource<{ total: number; items: UserRow[] }>(`/admin/users?${qs}`, [search, page]);
  const pages = data ? Math.max(1, Math.ceil(data.total / 20)) : 1;

  return (
    <div>
      <PageHeader title="کاربران" description={`${data?.total ?? "…"} کاربر`} />

      <Toolbar search={search} onSearch={(v) => { setSearch(v); setPage(1); }} />

      {(!data?.items?.length && !loading) ? (
        <EmptyState icon={<Users className="h-12 w-12" />} title="هنوز کاربری ثبت‌نام نکرده" description="کاربران پس از ثبت‌نام اینجا نمایش داده می‌شوند." />
      ) : (
        <DataTable
          loading={loading}
          rows={data?.items ?? []}
          empty="کاربری یافت نشد."
          columns={[
            {
              key: "full_name", label: "نام", render: (r) => (
                <div>
                  <p className="font-medium">{r.full_name || "—"}</p>
                  <p className="text-xs text-ink-soft">{r.email}</p>
                </div>
              ),
            },
            { key: "phone", label: "تلفن", render: (r) => <span className="num-latin text-ink-soft">{r.phone ?? "—"}</span> },
            { key: "role_name", label: "نقش", render: (r) => r.role_name ? <span className="rounded-full bg-lajvard/10 px-2.5 py-0.5 text-xs font-medium text-lajvard dark:bg-lajvard-soft/15 dark:text-lajvard-soft">{r.role_name}</span> : <span className="text-ink-soft">{r.is_admin ? "مدیر" : "کاربر"}</span> },
            { key: "is_active", label: "وضعیت", render: (r) => <span className={r.is_active ? "text-firouzeh" : "text-clay"}>{r.is_active ? "فعال" : "غیرفعال"}</span> },
            { key: "last_login_at", label: "آخرین ورود", render: (r) => r.last_login_at ? <span className="num-latin text-ink-soft">{toPersianDigits(new Date(r.last_login_at).toLocaleDateString("fa-IR"))}</span> : <span className="text-ink-soft">هرگز</span> },
            { key: "created_at", label: "تاریخ عضویت", render: (r) => <span className="num-latin text-ink-soft">{toPersianDigits(new Date(r.created_at).toLocaleDateString("fa-IR"))}</span> },
          ]}
        />
      )}

      <Pagination page={page} pages={pages} onPage={setPage} />
    </div>
  );
}
