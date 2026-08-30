"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Package, Plus } from "lucide-react";
import { ConfirmDialog, DataTable, EmptyState, ErrorBanner, PageHeader, Pagination, SelectInput, Toolbar, Field, Modal, TextInput, FormActions } from "@/components/admin/kit";
import { useAdminMutation, useAdminResource, useDebounced } from "@/lib/admin-hooks";
import { faNum, faPrice } from "@/lib/format";
import { mediaUrl } from "@/lib/api";

interface ProductRow {
  id: string; name: string; slug: string; sku: string;
  price: number; compare_at_price: number | null;
  stock_qty: number; is_active: boolean;
  category_name: string | null; brand_name: string | null;
  image_url: string | null;
}
interface Category { id: string; name: string; }
interface Brand { id: string; name: string; }

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [status, setStatus] = useState("");
  const [stock, setStock] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounced(search);

  useEffect(() => { setPage(1); }, [debouncedSearch, category, brand, status, stock]);

  const qs = new URLSearchParams();
  if (debouncedSearch) qs.set("search", debouncedSearch);
  if (category) qs.set("category_id", category);
  if (brand) qs.set("brand_id", brand);
  if (status) qs.set("status", status);
  if (stock) qs.set("stock", stock);
  qs.set("offset", String((page - 1) * 20));
  qs.set("limit", "20");

  const { data, loading, error, reload } = useAdminResource<{ total: number; items: ProductRow[] }>(`/admin/products-v2?${qs}`, [debouncedSearch, category, brand, status, stock, page]);
  const { data: categories } = useAdminResource<Category[]>("/admin/categories");
  const { data: brands } = useAdminResource<Brand[]>("/admin/brands");
  const { mutate, busy } = useAdminMutation();
  const [deleting, setDeleting] = useState<ProductRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", slug: "", sku: "", price: "", category_id: "", brand_id: "", stock_qty: "0" });

  const pages = data ? Math.max(1, Math.ceil(data.total / 20)) : 1;

  const softDelete = async () => {
    if (!deleting) return;
    const ok = await mutate(`/admin/products/${deleting.id}`, { method: "DELETE", successMessage: "محصول غیرفعال شد." });
    if (ok) { setDeleting(null); void reload(); }
  };

  return (
    <div>
      <PageHeader
        title="محصولات"
        description={`${data ? faNum(data.total) : "…"} محصول`}
        action={<button type="button" onClick={() => setCreating(true)} className="glaze-edge min-h-[44px] rounded-xl bg-lajvard px-5 text-sm text-white transition-all hover:bg-lajvard-deep hover:shadow-lifted dark:bg-lajvard-soft dark:text-char"><Plus className="ml-1 inline h-4 w-4" /> محصول جدید</button>}
      />

      {error && <ErrorBanner message={error} onRetry={reload} />}

      <Toolbar search={search} onSearch={setSearch}>
        <SelectInput value={category} onChange={(e) => setCategory(e.target.value)} className="max-w-[180px]" aria-label="فیلتر دسته">
          <option value="">همهٔ دسته‌ها</option>
          {(categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </SelectInput>
        <SelectInput value={brand} onChange={(e) => setBrand(e.target.value)} className="max-w-[160px]" aria-label="فیلتر برند">
          <option value="">همهٔ برندها</option>
          {(brands ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </SelectInput>
        <SelectInput value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[140px]" aria-label="فیلتر وضعیت">
          <option value="">همه وضعیت‌ها</option>
          <option value="active">فعال</option>
          <option value="inactive">غیرفعال</option>
        </SelectInput>
        <SelectInput value={stock} onChange={(e) => setStock(e.target.value)} className="max-w-[140px]" aria-label="فیلتر موجودی">
          <option value="">همهٔ موجودی‌ها</option>
          <option value="in">موجود</option>
          <option value="low">کم</option>
          <option value="out">ناموجود</option>
        </SelectInput>
      </Toolbar>

      {(!data?.items?.length && !loading && !error) ? (
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title="محصولی یافت نشد"
          description="اولین محصول خود را اضافه کنید."
          action={<button type="button" onClick={() => setCreating(true)} className="min-h-[44px] rounded-xl bg-lajvard px-4 text-sm text-white dark:bg-lajvard-soft dark:text-char">+ ایجاد محصول</button>}
        />
      ) : (
        <DataTable
          loading={loading}
          rows={data?.items ?? []}
          empty="محصولی یافت نشد."
          columns={[
            {
              key: "image", label: "تصویر", render: (r) => (
                <div className="kiln-reveal relative h-12 w-12 overflow-hidden rounded-xl bg-slip dark:bg-surface">
                  {r.image_url && <Image src={mediaUrl(r.image_url)} alt={r.name} fill sizes="48px" className="object-cover" />}
                </div>
              ),
            },
            { key: "name", label: "نام", render: (r) => <Link href={`/admin/products/${r.id}`} className="font-medium underline-offset-4 hover:underline">{r.name}</Link> },
            { key: "sku", label: "کد" },
            { key: "category", label: "دسته", render: (r) => r.category_name ?? "—" },
            { key: "brand", label: "برند", render: (r) => r.brand_name ?? "—" },
            { key: "price", label: "قیمت", render: (r) => <span className="font-bold">{faPrice(r.price)}</span> },
            {
              key: "stock", label: "موجودی", render: (r) => (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${r.stock_qty === 0 ? "bg-clay/15 text-clay" : r.stock_qty <= 5 ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "bg-firouzeh/20 text-firouzeh"}`}>
                  {faNum(r.stock_qty)}
                </span>
              ),
            },
            {
              key: "is_active", label: "وضعیت", render: (r) => (
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${r.is_active ? "bg-firouzeh/20 text-firouzeh" : "bg-char/10 text-char-soft dark:bg-white/10 dark:text-ink-soft"}`}>
                  {r.is_active ? "فعال" : "غیرفعال"}
                </span>
              ),
            },
          ]}
          actions={(r) => (
            <div className="flex gap-1">
              <Link href={`/admin/products/${r.id}`} className="min-h-[36px] rounded-lg border border-char/20 px-3 py-1.5 text-sm transition-colors hover:bg-char/5 dark:border-white/20 dark:hover:bg-white/5">ویرایش</Link>
              <button type="button" onClick={() => setDeleting(r)} className="min-h-[36px] rounded-lg px-3 py-1.5 text-sm text-clay transition-colors hover:bg-clay/10">حذف</button>
            </div>
          )}
        />
      )}

      <Pagination page={page} pages={pages} onPage={setPage} />

      {/* Quick-create modal */}
      <Modal open={creating} onClose={() => setCreating(false)} title="محصول جدید" wide>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="نام محصول" required>
            <TextInput value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value, slug: newForm.slug || slugify(e.target.value) })} required />
          </Field>
          <Field label="شناسهٔ صفحه (slug)" hint="به‌طور خودکار از نام ساخته می‌شود">
            <TextInput value={newForm.slug} onChange={(e) => setNewForm({ ...newForm, slug: e.target.value })} required />
          </Field>
          <Field label="دسته" required>
            <SelectInput value={newForm.category_id} onChange={(e) => setNewForm({ ...newForm, category_id: e.target.value })} required>
              <option value="">— انتخاب دسته —</option>
              {(categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </SelectInput>
          </Field>
          <Field label="برند">
            <SelectInput value={newForm.brand_id} onChange={(e) => setNewForm({ ...newForm, brand_id: e.target.value })}>
              <option value="">— بدون برند —</option>
              {(brands ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </SelectInput>
          </Field>
          <Field label="کد محصول (SKU)" required>
            <TextInput value={newForm.sku} onChange={(e) => setNewForm({ ...newForm, sku: e.target.value })} required className="num-latin" />
          </Field>
          <Field label="قیمت (تومان)" required>
            <TextInput type="number" min={0} value={newForm.price} onChange={(e) => setNewForm({ ...newForm, price: e.target.value })} required className="num-latin" />
          </Field>
          <Field label="موجودی">
            <TextInput type="number" min={0} value={newForm.stock_qty} onChange={(e) => setNewForm({ ...newForm, stock_qty: e.target.value })} className="num-latin" />
          </Field>
        </div>
        <p className="mt-4 rounded-xl bg-lajvard/10 p-3 text-xs dark:bg-lajvard-soft/10">پس از ایجاد، در ویرایشگر کامل می‌توانید تصاویر، وارینت‌ها و محصولات مرتبط را اضافه کنید.</p>
        <FormActions onCancel={() => setCreating(false)} busy={busy} saveLabel="ایجاد محصول" />
      </Modal>

      <ConfirmDialog open={deleting !== null} message={`محصول «${deleting?.name}» غیرفعال شود؟ (حذف نرم — سفارش‌های قبلی سالم می‌مانند)`} onConfirm={() => void softDelete()} onCancel={() => setDeleting(null)} busy={busy} />
    </div>
  );
}

function slugify(name: string): string {
  return name.trim().toLowerCase()
    .replace(/[\s\u200c]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-");
}
