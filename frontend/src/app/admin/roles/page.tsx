"use client";

import { useState } from "react";
import { ShieldCheck, Plus, Users } from "lucide-react";
import { ConfirmDialog, EmptyState, ErrorBanner, Field, FormActions, Modal, PageHeader, TagBadge, TextInput, Toolbar } from "@/components/admin/kit";
import { useAdminMutation, useAdminResource } from "@/lib/admin-hooks";

interface Role {
  id: string; name: string; permissions: string[];
}

interface PermCatalog {
  /** permission key → Persian label (from backend catalog) */
  permissions: Record<string, string>;
  presets: Array<{ name: string; label?: string; permissions: string[] }> | Record<string, string[]>;
}

/** Fallback labels for legacy permission keys that no longer exist in the catalog */
const LEGACY_LABELS: Record<string, string> = {
  dashboard: "داشبورد", products: "محصولات", categories: "دسته‌بندی‌ها",
  orders: "سفارش‌ها", returns: "مرجوعی‌ها", coupons: "تخفیف‌ها",
  shipping: "ارسال", users: "کاربران", reviews: "نظرات و پرسش‌ها",
  messages: "پیام‌ها", content: "محتوا", settings: "تنظیمات (حذف‌شده)",
};

export default function AdminRolesPage() {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState<Role | null>(null);
  const [form, setForm] = useState({ name: "", permissions: [] as string[] });

  const { data: roles, loading, error, reload } = useAdminResource<Role[]>("/admin/roles");
  const { data: catalog } = useAdminResource<PermCatalog>("/admin/permissions");
  const { mutate, busy } = useAdminMutation();

  /** key → Persian label, merged from backend catalog + legacy fallbacks */
  const permLabels: Record<string, string> = { ...LEGACY_LABELS, ...(catalog?.permissions ?? {}) };
  const permEntries = Object.entries(catalog?.permissions ?? {});

  const filtered = (roles ?? []).filter((r) => !search || r.name.includes(search));

  const openCreate = () => { setForm({ name: "", permissions: [] }); setCreating(true); };
  const openEdit = (r: Role) => { setForm({ name: r.name, permissions: [...r.permissions] }); setEditing(r); };

  const togglePerm = (perm: string) => {
    setForm((prev) => {
      const has = prev.permissions.includes(perm);
      return { ...prev, permissions: has ? prev.permissions.filter((p) => p !== perm) : [...prev.permissions, perm] };
    });
  };

  const applyPreset = (perms: string[]) => {
    setForm((prev) => ({ ...prev, permissions: [...new Set([...prev.permissions, ...perms])] }));
  };

  const submit = async () => {
    const ok = editing
      ? await mutate(`/admin/roles/${editing.id}`, { method: "PATCH", body: JSON.stringify(form), successMessage: "نقش ذخیره شد." })
      : await mutate("/admin/roles", { method: "POST", body: JSON.stringify(form), successMessage: "نقش ایجاد شد." });
    if (ok) { setCreating(false); setEditing(null); void reload(); }
  };

  const remove = async () => {
    if (!deleting) return;
    const ok = await mutate(`/admin/roles/${deleting.id}`, { method: "DELETE", successMessage: "نقش حذف شد." });
    if (ok) { setDeleting(null); void reload(); }
  };

  /** Normalize presets: backend sends ROLE_PRESETS (array of {name,label,permissions}) */
  const presets: Array<{ name: string; label: string; perms: string[] }> = Array.isArray(catalog?.presets)
    ? (catalog?.presets as Array<{ name: string; label?: string; permissions: string[] }>).map((p) => ({ name: p.name, label: p.label ?? p.name, perms: p.permissions }))
    : Object.entries(catalog?.presets ?? {}).map(([name, perms]) => ({ name, label: name, perms: perms as string[] }));

  return (
    <div>
      <PageHeader
        title="نقش‌ها و دسترسی‌ها"
        description="مدیریت سطوح دسترسی مدیران"
        action={<button type="button" onClick={openCreate} className="glaze-edge flex min-h-[44px] items-center rounded-wobble-card bg-lajvard px-5 text-sm text-white shadow-shelf transition-all hover:bg-lajvard-deep hover:shadow-lifted dark:bg-lajvard-soft dark:text-char"><Plus className="ml-1 inline h-4 w-4" /> نقش جدید</button>}
      />

      {error && <ErrorBanner message={error} onRetry={reload} />}

      <Toolbar search={search} onSearch={setSearch} />

      {filtered.length === 0 && !loading ? (
        <EmptyState icon={<ShieldCheck className="h-12 w-12" />} title="هنوز نقشی ندارید" description="نقش‌ها به شما امکان کنترل دقیق دسترسی مدیران را می‌دهند." action={<button type="button" onClick={openCreate} className="min-h-[44px] rounded-xl bg-lajvard px-4 text-sm text-white dark:bg-lajvard-soft dark:text-char">+ ایجاد نقش</button>} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((r) => (
            <div key={r.id} className="glaze-edge flex flex-col justify-between gap-4 rounded-wobble-card bg-surface p-5 shadow-shelf transition-all duration-300 hover:shadow-lifted dark:bg-black/25">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-lajvard dark:text-lajvard-soft" />
                  <p className="font-bold">{r.name}</p>
                  <span className="mr-auto flex items-center gap-1 text-[11px] text-ink-soft">
                    <Users className="h-3 w-3" /> {r.permissions.length} دسترسی
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {r.permissions.includes("*") ? (
                    <TagBadge>دسترسی کامل</TagBadge>
                  ) : (
                    r.permissions.map((p) => <TagBadge key={p}>{permLabels[p] ?? p}</TagBadge>)
                  )}
                  {r.permissions.length === 0 && <span className="text-sm text-ink-soft">بدون دسترسی</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => openEdit(r)} className="min-h-[36px] flex-1 rounded-lg border border-char/20 px-3 py-1.5 text-sm transition-colors hover:bg-char/5 dark:border-white/20 dark:hover:bg-white/5">ویرایش</button>
                <button type="button" onClick={() => setDeleting(r)} className="min-h-[36px] rounded-lg px-3 py-1.5 text-sm text-clay transition-colors hover:bg-clay/10">حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={creating || editing !== null} onClose={() => { setCreating(false); setEditing(null); }} title={editing ? "ویرایش نقش" : "نقش جدید"} wide>
        <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-4">
          <Field label="نام نقش" required>
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>

          {/* Presets */}
          {presets.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">قالب‌های آماده</p>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <button key={p.name} type="button" onClick={() => applyPreset(p.perms)} className="min-h-[36px] rounded-lg border border-char/20 px-3 text-sm transition-all hover:border-lajvard/40 hover:bg-lajvard/5 dark:border-white/20">
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Permissions */}
          <div>
            <p className="mb-2 text-sm font-medium">دسترسی‌ها ({form.permissions.length} انتخاب‌شده)</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {permEntries.map(([key, label]) => {
                const active = form.permissions.includes(key) || form.permissions.includes("*");
                return (
                  <label key={key} className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border px-3 text-sm transition-all ${active ? "border-firouzeh/40 bg-firouzeh/10 font-medium text-firouzeh" : "border-char/15 hover:bg-char/5 dark:border-white/15 dark:hover:bg-white/5"}`}>
                    <input type="checkbox" checked={active} onChange={() => togglePerm(key)} className="h-4 w-4 rounded accent-firouzeh" />
                    {label}
                  </label>
                );
              })}
            </div>
          </div>

          <FormActions onCancel={() => { setCreating(false); setEditing(null); }} busy={busy} />
        </form>
      </Modal>

      <ConfirmDialog open={deleting !== null} message={`نقش «${deleting?.name}» حذف شود؟`} onConfirm={() => void remove()} onCancel={() => setDeleting(null)} busy={busy} />
    </div>
  );
}
