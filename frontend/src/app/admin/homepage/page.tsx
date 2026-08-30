"use client";

import { useState } from "react";
import { ConfirmDialog, Field, Modal, PageHeader, SelectInput, TextInput, Toggle, FormActions } from "@/components/admin/kit";
import { useAdminMutation, useAdminResource, useDebounced } from "@/lib/admin-hooks";
import { cn } from "@/lib/utils";

interface Section {
  id: string;
  kind: string;
  title: string;
  subtitle: string | null;
  is_enabled: boolean;
  sort_order: number;
  limit_count: number;
  source: string | null;
  category_id: string | null;
  category_name: string | null;
  product_ids: string[];
  manual_product_count: number;
}

interface Category { id: string; name: string; }
interface ProductItem { id: string; name: string; }

const KIND_LABELS: Record<string, string> = {
  hero: "بنر اصلی (اسلایدر)",
  products: "اسلایدر محصولات",
  categories: "کارت دسته‌بندی‌ها",
  articles: "مقالات وبلاگ",
  faq: "سوالات رایج",
  brand_story: "داستان برند",
  testimonials: "نظرات مشتریان",
  featured_category_spotlight: "دسته‌های ویژه (بنر بزرگ)",
};

const SOURCE_LABELS: Record<string, string> = {
  best_sellers: "پرفروش‌ترین‌ها",
  popular: "محبوب‌ترین‌ها",
  new_arrivals: "جدیدترین‌ها",
  discounted: "تخفیف‌دارها",
  category: "محصولات یک دسته",
  manual: "انتخاب دستی محصولات",
};

export default function AdminHomepagePage() {
  const { data: sections, reload } = useAdminResource<Section[]>("/admin/homepage-sections");
  const { data: categories } = useAdminResource<Category[]>("/admin/categories");
  const { mutate, busy } = useAdminMutation();
  const [editing, setEditing] = useState<Section | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [form, setForm] = useState({
    kind: "products", title: "", subtitle: "", is_enabled: true, limit_count: 8,
    source: "best_sellers", category_id: "", product_ids: [] as string[],
  });
  const [manualSearch, setManualSearch] = useState("");
  const debouncedSearch = useDebounced(manualSearch);
  const searchQuery = debouncedSearch.trim()
    ? `/admin/products-v2?search=${encodeURIComponent(debouncedSearch)}&limit=8`
    : null;
  const { data: searchResults } = useAdminResource<{ items: ProductItem[] }>(editing || creating ? searchQuery : null, [debouncedSearch]);

  const openEdit = (s: Section) => {
    setEditing(s);
    setForm({
      kind: s.kind, title: s.title, subtitle: s.subtitle ?? "", is_enabled: s.is_enabled,
      limit_count: s.limit_count, source: s.source ?? "best_sellers",
      category_id: s.category_id ?? "", product_ids: s.product_ids,
    });
  };

  const openCreate = () => {
    setCreating(true);
    setForm({ kind: "products", title: "", subtitle: "", is_enabled: true, limit_count: 8, source: "best_sellers", category_id: "", product_ids: [] });
  };

  const submit = async () => {
    const body = {
      kind: form.kind, title: form.title, subtitle: form.subtitle || null,
      is_enabled: form.is_enabled, limit_count: Number(form.limit_count),
      source: form.kind === "products" ? form.source : null,
      category_id: form.source === "category" ? form.category_id : null,
      product_ids: form.source === "manual" ? form.product_ids : [],
    };
    const ok = editing
      ? await mutate(`/admin/homepage-sections/${editing.id}`, { method: "PATCH", body: JSON.stringify(body), successMessage: "بخش ذخیره شد." })
      : await mutate("/admin/homepage-sections", { method: "POST", body: JSON.stringify(body), successMessage: "بخش افزوده شد." });
    if (ok) {
      setEditing(null);
      setCreating(false);
      void reload();
    }
  };

  const toggle = async (s: Section) => {
    const ok = await mutate(`/admin/homepage-sections/${s.id}`, { method: "PATCH", body: JSON.stringify({ is_enabled: !s.is_enabled }) });
    if (ok !== null) void reload();
  };

  const remove = async (s: Section) => {
    const ok = await mutate(`/admin/homepage-sections/${s.id}`, { method: "DELETE", successMessage: "بخش حذف شد." });
    if (ok) void reload();
  };

  const move = async (index: number, dir: -1 | 1) => {
    if (!sections) return;
    const target = index + dir;
    if (target < 0 || target >= sections.length) return;
    const ids = sections.map((s) => s.id);
    const temp = ids[index];
    const other = ids[target];
    if (temp === undefined || other === undefined) return;
    ids[index] = other;
    ids[target] = temp;
    const ok = await mutate("/admin/homepage-sections/reorder", { method: "POST", body: JSON.stringify({ order: ids }) });
    if (ok) void reload();
  };

  const resetAll = async () => {
    const ok = await mutate("/admin/homepage-sections/reset", { method: "POST", successMessage: "چیدمان پیش‌فرض بازگردانده شد." });
    if (ok) { setConfirmReset(false); void reload(); }
  };

  return (
    <div>
      <PageHeader
        title="صفحهٔ اصلی"
        description="ترتیب و محتوای بخش‌های صفحهٔ اول فروشگاه را همین‌جا کنترل کنید."
        action={
          <div className="flex gap-2">
            <button type="button" onClick={() => setConfirmReset(true)} className="min-h-[44px] rounded-xl border border-char/20 px-4 text-sm dark:border-white/20">بازنشانی پیش‌فرض</button>
            <button type="button" onClick={openCreate} className="min-h-[44px] rounded-xl bg-lajvard px-4 text-sm text-white hover:bg-lajvard-deep dark:bg-lajvard-soft dark:text-char">+ بخش جدید</button>
          </div>
        }
      />

      {sections && sections.length === 0 && (
        <div className="rounded-2xl border border-dashed border-char/20 p-10 text-center dark:border-white/15">
          <p className="text-sm text-ink-soft">هنوز بخشی تعریف نشده است.</p>
          <button type="button" onClick={() => setConfirmReset(true)} className="mt-4 min-h-[44px] rounded-xl bg-lajvard px-4 text-sm text-white dark:bg-lajvard-soft dark:text-char">بارگذاری چیدمان پیش‌فرض</button>
        </div>
      )}

      <ul className="space-y-3">
        {(sections ?? []).map((s, i) => (
          <li key={s.id} className={cn("rounded-2xl bg-surface p-4 shadow-shelf transition-opacity dark:bg-black/25", !s.is_enabled && "opacity-60")}>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-col gap-1">
                <button type="button" onClick={() => void move(i, -1)} disabled={i === 0} aria-label="بالا" className="rounded-lg border border-char/15 px-2 py-0.5 text-xs disabled:opacity-30 dark:border-white/15">▲</button>
                <button type="button" onClick={() => void move(i, 1)} disabled={i === (sections?.length ?? 0) - 1} aria-label="پایین" className="rounded-lg border border-char/15 px-2 py-0.5 text-xs disabled:opacity-30 dark:border-white/15">▼</button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{s.title || KIND_LABELS[s.kind]}</p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {KIND_LABELS[s.kind] ?? s.kind}
                  {s.kind === "products" && s.source && <> · {SOURCE_LABELS[s.source]}{s.source === "category" && s.category_name ? ` (${s.category_name})` : ""}{s.source === "manual" ? ` (${s.manual_product_count} محصول)` : ""}</>}
                  {" · تا "}
                  {s.limit_count}
                  {' مورد'}
                </p>
              </div>
              <Toggle checked={s.is_enabled} onChange={() => void toggle(s)} label="" />
              <div className="flex gap-2">
                <button type="button" onClick={() => openEdit(s)} className="min-h-[40px] rounded-xl border border-char/20 px-4 text-sm dark:border-white/20">ویرایش</button>
                <button type="button" onClick={() => void remove(s)} className="min-h-[40px] rounded-xl px-3 text-sm text-clay hover:bg-clay/10">حذف</button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Modal open={editing !== null || creating} onClose={() => { setEditing(null); setCreating(false); }} title={editing ? "ویرایش بخش" : "بخش جدید"} wide>
        <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="نوع بخش" required>
              <SelectInput value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} disabled={Boolean(editing)}>
                {Object.entries(KIND_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </SelectInput>
            </Field>
            <Field label="عنوان" required>
              <TextInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="مثلاً: ماگ‌ها" />
            </Field>
          </div>

          {form.kind === "products" && (
            <>
              <Field label="منبع محصولات" required>
                <SelectInput value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                  {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </SelectInput>
              </Field>
              {form.source === "category" && (
                <Field label="دسته" required>
                  <SelectInput value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required>
                    <option value="">— انتخاب دسته —</option>
                    {(categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </SelectInput>
                </Field>
              )}
              {form.source === "manual" && (
                <div>
                  <p className="mb-1.5 text-sm font-medium">انتخاب محصولات ({form.product_ids.length} انتخاب‌شده)</p>
                  <TextInput placeholder="جستجوی محصول…" value={manualSearch} onChange={(e) => setManualSearch(e.target.value)} />
                  <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                    {(searchResults?.items ?? []).map((p) => {
                      const selected = form.product_ids.includes(p.id);
                      return (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => setForm({
                              ...form,
                              product_ids: selected ? form.product_ids.filter((id) => id !== p.id) : [...form.product_ids, p.id],
                            })}
                            className={cn(
                              "flex min-h-[40px] w-full items-center justify-between rounded-lg px-3 text-sm",
                              selected ? "bg-firouzeh/20 text-firouzeh" : "hover:bg-char/5 dark:hover:bg-white/10",
                            )}
                          >
                            <span>{p.name}</span>
                            {selected && <span>✓</span>}
                          </button>
                        </li>
                      );
                    })}
                    {debouncedSearch.trim() && !(searchResults?.items ?? []).length && (
                      <li className="p-3 text-sm text-ink-soft">محصولی یافت نشد.</li>
                    )}
                  </ul>
                </div>
              )}
            </>
          )}

          {form.kind === "hero" && (
            <p className="rounded-xl bg-lajvard/10 p-3 text-sm dark:bg-lajvard-soft/10">
              تصاویر این اسلایدر از بخش «بنرهای اسلایدری» مدیریت می‌شود.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="زیرعنوان (اختیاری)">
              <TextInput value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
            </Field>
            <Field label="حداکثر تعداد نمایش" hint={form.kind === "products" ? "تعداد محصولات در اسلایدر" : "تعداد آیتم‌ها"}>
              <TextInput type="number" min={1} max={24} value={form.limit_count} onChange={(e) => setForm({ ...form, limit_count: Number(e.target.value) })} />
            </Field>
          </div>

          <Toggle checked={form.is_enabled} onChange={(v) => setForm({ ...form, is_enabled: v })} label="نمایش این بخش در صفحهٔ اصلی" />

          <FormActions onCancel={() => { setEditing(null); setCreating(false); }} busy={busy} />
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmReset}
        message="چیدمان فعلی حذف و چیدمان پیش‌فرض جایگزین می‌شود. ادامه می‌دهید؟"
        onConfirm={() => void resetAll()}
        onCancel={() => setConfirmReset(false)}
        busy={busy}
      />
    </div>
  );
}
