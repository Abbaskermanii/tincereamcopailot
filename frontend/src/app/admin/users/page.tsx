"use client";

import { useState } from "react";
import { User, Shield, Mail, Phone, MapPin, Activity, ExternalLink, ChevronDown, Plus, Settings } from "lucide-react";
import { ConfirmDialog, DataTable, EmptyState, Field, FormActions, Modal, PageHeader, Pagination, StatusBadge, Toolbar, Toggle } from "@/components/admin/kit";
import { useAdminMutation, useAdminResource } from "@/lib/admin-hooks";
import { mediaUrl } from "@/lib/api";
import { toPersianDigits, faNum } from "@/lib/format";

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  region: string | null;
  address: string | null;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  registered_at: string;
  orders_count: number;
  spent_total: number;
  avatar_url: string | null;
}

interface UserStats {
  total_users: number;
  active_users: number;
  pending_users: number;
  total_spent: number;
  total_orders: number;
}

type Role = "admin" | "editor" | "customer";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "active" | "pending">("all");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [showDetail, setShowDetail] = useState<User | null>(null);
  const [showSettings, setShowSettings] = useState<User | null>(null);

  const { data: users, loading, reload } = useAdminResource<User[]>("/admin/users");
  const { data: statsData } = useAdminResource<UserStats>("/admin/users/stats");
  const { mutate, busy } = useAdminMutation();

  if (statsData) setStats(statsData);

  const filtered = (users ?? []).filter((u) => {
    if (tab === "active" && !u.is_active) return false;
    if (tab === "pending" && u.is_active) return false;
    if (search && !u.full_name.includes(search) && !u.email.includes(search)) return false;
    return true;
  });

  const openCreate = () => {
    setCreating(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
  };

  const openDetail = (u: User) => {
    setShowDetail(u);
  };

  const openSettings = (u: User) => {
    setShowSettings(u);
  };

  const submit = async () => {
    if (editing) {
      await mutate(`/admin/users/${editing.id}`, { method: "PATCH", body: JSON.stringify({ is_active: editing.is_active }), successMessage: "وضعیت کاربر تغییر کرد." });
    }
    setEditing(null);
    setCreating(false);
    void reload();
  };

  const toggleStatus = async (u: User) => {
    await mutate(`/admin/users/${u.id}`, { method: "PATCH", body: JSON.stringify({ is_active: !u.is_active }) });
    void reload();
  };

  const softDelete = async () => {
    if (!deleting) return;
    await mutate(`/admin/users/${deleting.id}`, { method: "DELETE", successMessage: "کاربر حذف شد." });
    setDeleting(null);
    void reload();
  };

  const roleLabels: Record<string, string> = {
    admin: "مدیر سیستم",
    editor: "ویرایشگر",
    customer: "مشتری",
  };

  const roleColors: Record<string, string> = {
    admin: "bg-firouzeh/20 text-firouzeh",
    editor: "bg-lajvard/20 text-lajvard",
    customer: "bg-amber-500/20 text-amber-700",
  };

  return (
    <div>
      <PageHeader
        title="کاربران"
        description={`${filtered.length} کاربر`}
        action={
          <>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="min-h-[44px] rounded-xl bg-lajvard px-4 text-sm text-white hover:bg-lajvard-deep dark:bg-lajvard-soft dark:text-char"
            >
              <Plus className="ml-1 inline h-4 w-4" />
              افزودن کاربر
            </button>
          </>
        }
      />

      {stats && (
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="glaze-edge rounded-2xl bg-surface p-5 shadow-shelf dark:bg-black/25">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lajvard/10 text-lajvard dark:bg-lajvard-soft/15 dark:text-lajvard-soft">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-ink-soft dark:text-ink">کل کاربران</p>
                <p className="mt-0.5 text-xl font-extrabold">{faNum(stats.total_users)}</p>
              </div>
            </div>
          </div>
          <div className="glaze-edge rounded-2xl bg-surface p-5 shadow-shelf dark:bg-black/25">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-firouzeh/10 text-firouzeh dark:bg-firouzeh/15 dark:text-firouzeh">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-ink-soft dark:text-ink">کاربران فعال</p>
                <p className="mt-0.5 text-xl font-extrabold">{faNum(stats.active_users)}</p>
              </div>
            </div>
          </div>
          <div className="glaze-edge rounded-2xl bg-surface p-5 shadow-shelf dark:bg-black/25">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-ink-soft dark:text-ink">سفارشات</p>
                <p className="mt-0.5 text-xl font-extrabold">{faNum(stats.total_orders)}</p>
              </div>
            </div>
          </div>
          <div className="glaze-edge rounded-2xl bg-surface p-5 shadow-shelf dark:bg-black/25">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-firouzeh/10 text-firouzeh dark:bg-firouzeh/15 dark:text-firouzeh">
                <ExternalLink className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-ink-soft dark:text-ink">مجموع خرید</p>
                <p className="mt-0.5 text-xl font-extrabold">{faNum(stats.total_spent)} تومان</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        {(["all", "active", "pending"] as const).map((t) => {
          const labels = { all: "همه", active: "فعال", pending: "در انتظار" };
          const count = t === "all" ? (users?.length ?? 0) : (users ?? []).filter((u) => t === "active" ? u.is_active : !u.is_active).length;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`min-h-[36px] rounded-lg px-3 text-sm ${tab === t ? "bg-lajvard text-white dark:bg-lajvard-soft dark:text-char" : "bg-char/5 text-ink-soft hover:bg-char/10 dark:bg-white/10"}`}
            >
              {labels[t]} ({faNum(count)})
            </button>
          );
        })}
        <div className="mr-auto">
          <Toolbar search={search} onSearch={setSearch} />
        </div>
      </div>

      {filtered.length === 0 && !loading ? (
        <EmptyState
          icon={<User className="h-12 w-12" />}
          title="هیچ کاربری یافت نشد"
          description="کاربران می‌توانند از طریق فرم ثبت‌نام به این بخش اضافه شوند."
          action={
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="min-h-[44px] rounded-xl bg-lajvard px-4 text-sm text-white dark:bg-lajvard-soft dark:text-char"
            >
              + افزودن کاربر جدید
            </button>
          }
        />
      ) : (
        <DataTable
          loading={loading}
          rows={filtered}
          empty="کاربری یافت نشد."
          columns={[
            {
              key: "avatar",
              label: "تصویر",
              render: (r: User) => (
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {r.avatar_url ? (
                      <img src={mediaUrl(r.avatar_url)} alt={r.full_name} className="h-10 w-10 rounded-full object-cover ring-2 ring-slip" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slip ring-2 ring-slip">
                        <User className="h-5 w-5 text-ink" />
                      </div>
                    )}
                    {r.is_active ? (
                      <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-firouzeh ring-2 ring-slip">
                        <span className="block h-2 w-2 rounded-full bg-white" />
                      </span>
                    ) : (
                      <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 ring-2 ring-slip">
                        <span className="block h-2 w-2 rounded-full bg-white" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-ink dark:text-ink">{r.full_name}</p>
                    <p className="text-xs text-ink-soft">{r.email}</p>
                  </div>
                </div>
              ),
            },
            { key: "phone", label: "شماره تماس", render: (r) => r.phone ? <span className="text-ink-soft">{r.phone}</span> : <span className="text-ink-soft">—</span> },
            { key: "city", label: "شهر", render: (r) => r.city ? <span className="text-ink-soft">{r.city}</span> : <span className="text-ink-soft">—</span> },
            {
              key: "role",
              label: "نقش",
              render: (r: User) => (
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${roleColors[r.role] || "bg-char/10 text-char-soft"}`}>
                  {roleLabels[r.role] ?? r.role}
                </span>
              ),
            },
            { key: "orders_count", label: "سفارشات", render: (r) => <span className="text-ink-soft">{faNum(r.orders_count)}</span> },
            { key: "spent_total", label: "مجموع خرید", render: (r) => <span className="text-ink-soft">{faNum(r.spent_total)} تومان</span> },
            {
              key: "is_active",
              label: "وضعیت",
              render: (r: User) => (
                <StatusBadge status={r.is_active ? "active" : "pending"} />
              ),
            },
            {
              key: "last_login",
              label: "آخرین ورود",
              render: (r: User) => (
                <span className="text-ink-soft">
                  {r.last_login_at ? (
                    <span className="num-latin">{toPersianDigits(r.last_login_at.slice(0, 10))}</span>
                  ) : (
                    <span className="text-ink-soft">—</span>
                  )}
                </span>
              ),
            },
          ]}
          actions={(r) => (
            <>
              <button
                type="button"
                onClick={() => void toggleStatus(r)}
                className="min-h-[36px] rounded-lg border border-char/20 px-3 py-1.5 text-sm dark:border-white/20"
              >
                {r.is_active ? "غیرفعال" : "فعال"}
              </button>
              <button
                type="button"
                onClick={() => openDetail(r)}
                className="min-h-[36px] rounded-lg border border-char/20 px-3 py-1.5 text-sm dark:border-white/20"
              >
                جزئیات
              </button>
              <button
                type="button"
                onClick={() => openSettings(r)}
                className="min-h-[36px] rounded-lg border border-char/20 px-3 py-1.5 text-sm dark:border-white/20"
              >
                <Settings className="ml-1 inline h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setDeleting(r)}
                className="min-h-[36px] rounded-lg px-3 py-1.5 text-sm text-clay hover:bg-clay/10"
              >
                حذف
              </button>
            </>
          )}
        />
      )}

      <Pagination page={1} pages={1} onPage={() => {}} />

      <Modal
        open={showDetail !== null}
        onClose={() => setShowDetail(null)}
        title="جزئیات کاربر"
        wide
      >
        {showDetail && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="relative">
                {showDetail.avatar_url ? (
                  <img src={showDetail.avatar_url} alt={showDetail.full_name} className="h-24 w-24 rounded-full object-cover ring-2 ring-lajvard/20" />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slip ring-2 ring-lajvard/20">
                    <User className="h-12 w-12 text-ink" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold">{showDetail.full_name}</h3>
                <p className="text-ink-soft">{showDetail.email}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge status={showDetail.is_active ? "active" : "pending"} />
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${roleColors[showDetail.role] || "bg-char/10 text-char-soft"}`}>
                    {roleLabels[showDetail.role]}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="شماره تماس">
                <div className="flex items-center gap-2 rounded-xl border border-char/20 bg-slip px-3 py-2.5 text-ink">
                  <Phone className="h-4 w-4" />
                  {showDetail.phone || "—"}
                </div>
              </Field>
              <Field label="نقش">
                <div className="flex items-center gap-2 rounded-xl border border-char/20 bg-slip px-3 py-2.5 text-ink">
                  <Shield className="h-4 w-4" />
                  {roleLabels[showDetail.role] ?? showDetail.role}
                </div>
              </Field>
              <Field label="شهر">
                <div className="flex items-center gap-2 rounded-xl border border-char/20 bg-slip px-3 py-2.5 text-ink">
                  <MapPin className="h-4 w-4" />
                  {showDetail.city || "—"}
                </div>
              </Field>
              <Field label="زیرمجموعه/منطقه">
                <div className="flex items-center gap-2 rounded-xl border border-char/20 bg-slip px-3 py-2.5 text-ink">
                  <MapPin className="h-4 w-4" />
                  {showDetail.region || "—"}
                </div>
              </Field>
            </div>

            <Field label="آدرس">
              <div className="rounded-xl border border-char/20 bg-slip px-3 py-2.5 text-ink">
                {showDetail.address || "—"}
              </div>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="تاریخ ثبت‌نام">
                <div className="flex items-center gap-2 rounded-xl border border-char/20 bg-slip px-3 py-2.5 text-ink">
                  <Mail className="h-4 w-4" />
                  {toPersianDigits(showDetail.registered_at.slice(0, 10))}
                </div>
              </Field>
              <Field label="آخرین ورود">
                <div className="flex items-center gap-2 rounded-xl border border-char/20 bg-slip px-3 py-2.5 text-ink">
                  <Activity className="h-4 w-4" />
                  {showDetail.last_login_at ? toPersianDigits(showDetail.last_login_at.slice(0, 10)) : "—"}
                </div>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-char/20 bg-slip p-4 text-center">
                <p className="text-xs text-ink-soft">کل سفارشات</p>
                <p className="mt-1 text-2xl font-extrabold text-ink">{faNum(showDetail.orders_count)}</p>
              </div>
              <div className="rounded-xl border border-char/20 bg-slip p-4 text-center">
                <p className="text-xs text-ink-soft">مجموع خرید</p>
                <p className="mt-1 text-2xl font-extrabold text-firouzeh">{faNum(showDetail.spent_total)} تومان</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={showSettings !== null}
        onClose={() => setShowSettings(null)}
        title="تنظیمات کاربر"
        wide
      >
        {showSettings && (
          <div className="space-y-5">
            <p className="rounded-xl bg-lajvard/10 p-3 text-sm dark:bg-lajvard-soft/10">
              در این بخش می‌توانید سطح دسترسی کاربر و تنظیمات اکانت را تغییر دهید.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="نقش کاربر" required>
                <select
                  value={showSettings.role}
                  onChange={(e) => {
                    setShowSettings({ ...showSettings, role: e.target.value as Role });
                  }}
                  className="w-full min-h-[44px] rounded-xl border border-char/20 bg-surface px-3 py-2.5 text-sm outline-none dark:border-white/20 dark:bg-black/25"
                >
                  {Object.entries(roleLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </Field>
              <Field label="وضعیت فعال">
                <Toggle checked={showSettings.is_active} onChange={(v) => setShowSettings({ ...showSettings, is_active: v })} label="کاربر فعال باشد" />
              </Field>
            </div>

            <FormActions
              onCancel={() => setShowSettings(null)}
              busy={busy}
              onSave={() => void submit()}
            />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        message={`آیا مطمئن هستید که می‌خواهید کاربر «${deleting?.full_name}» را حذف کنید؟`}
        onConfirm={() => void softDelete()}
        onCancel={() => setDeleting(null)}
        busy={busy}
      />
    </div>
  );
}