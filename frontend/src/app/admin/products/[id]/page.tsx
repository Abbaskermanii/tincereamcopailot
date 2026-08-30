"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AdminCard, ConfirmDialog, Field, FormActions, Modal, PageHeader, SelectInput, TextArea, TextInput, Toggle,
} from "@/components/admin/kit";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { useAdminMutation, useAdminResource, useDebounced } from "@/lib/admin-hooks";
import { useToast } from "@/components/ui/toast-provider";
import { mediaUrl } from "@/lib/api";
import { faNum, faPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ImageRow { id: string; url: string; alt_text: string; is_primary: boolean; }
interface VariantRow {
  id: string; name: string; sku: string; image_url: string | null;
  price_delta: number; absolute_price: number | null; stock_qty: number; is_active: boolean;
}
interface ProductFull {
  id: string; name: string; slug: string; sku: string;
  category_id: string; brand_id: string | null;
  description: string; short_description: string | null;
  price: number; compare_at_price: number | null;
  stock_qty: number; is_active: boolean;
  meta_title: string | null; meta_description: string | null;
  material: string | null; dimensions: string | null; weight_grams: number;
}
interface Category { id: string; name: string; }
interface Brand { id: string; name: string; }
interface RelatedRow { id: string; name: string; }
interface ProductSearchItem { id: string; name: string; }

const TABS = [
  { key: "general", label: "عمومی" },
  { key: "pricing", label: "قیمت" },
  { key: "inventory", label: "انبار" },
  { key: "media", label: "تصاویر" },
  { key: "variants", label: "وارینت‌ها" },
  { key: "related", label: "محصولات مرتبط" },
  { key: "seo", label: "سئو" },
] as const;

export default function AdminProductEditorPage() {
  const params = useParams<{ id: string }>();
  const productId = params.id;
  const isNew = productId === "new";
  const { data: product, reload } = useAdminResource<ProductFull | null>(isNew ? null : `/public-products/${productId}`);
  const { data: categories } = useAdminResource<Category[]>("/admin/categories");
  const { data: brands } = useAdminResource<Brand[]>("/admin/brands");
  const { mutate, busy } = useAdminMutation();

  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("general");
  const [form, setForm] = useState({
    name: "", slug: "", sku: "", category_id: "", brand_id: "",
    description: "", short_description: "",
    price: "", compare_at_price: "", stock_qty: "0", is_active: true,
    meta_title: "", meta_description: "", material: "", dimensions: "", weight_grams: "0",
  });

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name, slug: product.slug, sku: product.sku,
        category_id: product.category_id, brand_id: product.brand_id ?? "",
        description: product.description ?? "", short_description: product.short_description ?? "",
        price: String(product.price ?? ""), compare_at_price: product.compare_at_price ? String(product.compare_at_price) : "",
        stock_qty: String(product.stock_qty ?? 0), is_active: product.is_active,
        meta_title: product.meta_title ?? "", meta_description: product.meta_description ?? "",
        material: product.material ?? "", dimensions: product.dimensions ?? "", weight_grams: String(product.weight_grams ?? 0),
      });
    }
  }, [product]);

  // For new products: fetch detail right after creation to get the id
  const [createdId, setCreatedId] = useState<string | null>(null);
  const effectiveProductId = isNew ? createdId : productId;

  const saveGeneral = async () => {
    if (isNew && !createdId) {
      const created = await mutate<{ id: string }>("/admin/products", {
        method: "POST",
        body: JSON.stringify({
          name: form.name, slug: form.slug, sku: form.sku, price: Number(form.price) || 0,
          category_id: form.category_id, brand_id: form.brand_id || null,
          description: form.description, short_description: form.short_description || null,
          stock_qty: Number(form.stock_qty) || 0, is_active: form.is_active,
          compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
        }),
        successMessage: "محصول ایجاد شد.",
      });
      if (created) setCreatedId(created.id);
      return;
    }
    const ok = await mutate(`/admin/products/${effectiveProductId}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: form.name, slug: form.slug, sku: form.sku,
        category_id: form.category_id, brand_id: form.brand_id || null,
        description: form.description, short_description: form.short_description || null,
        stock_qty: Number(form.stock_qty) || 0, is_active: form.is_active,
        compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
        material: form.material || null, dimensions: form.dimensions || null,
        weight_grams: Number(form.weight_grams) || 0,
        meta_title: form.meta_title || null, meta_description: form.meta_description || null,
      }),
      successMessage: "ذخیره شد.",
    });
    if (ok) void reload();
  };

  return (
    <div>
      <PageHeader
        title={isNew ? "محصول جدید" : product?.name ?? "…"}
        description={isNew ? "ابتدا اطلاعات عمومی را ذخیره کنید تا تب‌های دیگر فعال شوند." : product?.sku}
        action={<Link href="/admin/products" className="min-h-[44px] rounded-xl border border-char/20 px-4 py-2 text-sm dark:border-white/20">بازگشت به فهرست</Link>}
      />

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-char/5 p-1 dark:bg-white/10">
        {TABS.map((t) => {
          const disabled = isNew && !createdId && t.key !== "general";
          return (
            <button
              key={t.key}
              type="button"
              disabled={disabled}
              onClick={() => setTab(t.key)}
              className={cn(
                "min-h-[40px] whitespace-nowrap rounded-lg px-4 text-sm transition-colors disabled:opacity-40",
                tab === t.key ? "bg-lajvard text-white dark:bg-lajvard-soft dark:text-char" : "text-ink-soft",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "general" && (
        <form onSubmit={(e) => { e.preventDefault(); void saveGeneral(); }}>
        <AdminCard title="اطلاعات عمومی">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="نام محصول" required>
              <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Field>
            <Field label="شناسهٔ صفحه (slug)" required>
              <TextInput value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
            </Field>
            <Field label="دسته" required>
              <SelectInput value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required>
                <option value="">— انتخاب دسته —</option>
                {(categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </SelectInput>
            </Field>
            <Field label="برند">
              <SelectInput value={form.brand_id} onChange={(e) => setForm({ ...form, brand_id: e.target.value })}>
                <option value="">— بدون برند —</option>
                {(brands ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </SelectInput>
            </Field>
            <div className="sm:col-span-2">
              <Field label="توضیح کوتاه" hint="زیر نام محصول در صفحهٔ فروشگاه نمایش داده می‌شود">
                <TextInput value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="توضیحات کامل">
                <RichTextEditor value={form.description} onChange={(html) => setForm({ ...form, description: html })} placeholder="توضیحات کامل محصول…" />
              </Field>
            </div>
            <Toggle checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} label="محصول فعال باشد (در فروشگاه دیده شود)" />
          </div>
          <FormActions onCancel={() => history.back()} busy={busy} />
        </AdminCard>
        </form>
      )}

      {tab === "pricing" && (
        <form onSubmit={(e) => { e.preventDefault(); void saveGeneral(); }}>
        <AdminCard title="قیمت‌گذاری">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="قیمت فروش (تومان)" required>
              <TextInput type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </Field>
            <Field label="قیمت قبل از تخفیف (اختیاری)" hint="اگر بیشتر از قیمت فروش باشد، برچسب تخفیف نمایش داده می‌شود">
              <TextInput type="number" min={0} value={form.compare_at_price} onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })} />
            </Field>
          </div>
          <EffectivePricePreview price={form.price} compare={form.compare_at_price} />
          <FormActions onCancel={() => history.back()} busy={busy} />
        </AdminCard>
        </form>
      )}

      {tab === "inventory" && (
        <form onSubmit={(e) => { e.preventDefault(); void saveGeneral(); }}>
        <AdminCard title="انبار">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="کد محصول (SKU)" required>
              <TextInput value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </Field>
            <Field label="موجودی کل" hint="اگر وارینت دارید، موجودی هر وارینت جداگانه مدیریت می‌شود">
              <TextInput type="number" min={0} value={form.stock_qty} onChange={(e) => setForm({ ...form, stock_qty: e.target.value })} />
            </Field>
            <Field label="وزن (گرم)">
              <TextInput type="number" min={0} value={form.weight_grams} onChange={(e) => setForm({ ...form, weight_grams: e.target.value })} />
            </Field>
            <Field label="جنس / متریال">
              <TextInput value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} placeholder="مثلاً: سرامیک لعاب‌دار" />
            </Field>
            <Field label="ابعاد">
              <TextInput value={form.dimensions} onChange={(e) => setForm({ ...form, dimensions: e.target.value })} placeholder="مثلاً: ۹×۹×۱۱ سانتی‌متر" />
            </Field>
          </div>
          <FormActions onCancel={() => history.back()} busy={busy} />
        </AdminCard>
        </form>
      )}

      {tab === "media" && effectiveProductId && <ProductMedia productId={effectiveProductId} />}
      {tab === "variants" && effectiveProductId && <ProductVariants productId={effectiveProductId} />}
      {tab === "related" && effectiveProductId && <RelatedProducts productId={effectiveProductId} />}

      {tab === "seo" && (
        <form onSubmit={(e) => { e.preventDefault(); void saveGeneral(); }}>
        <AdminCard title="سئو">
          <div className="space-y-4">
            <Field label="عنوان متا" hint="خالی بگذارید تا نام محصول استفاده شود">
              <TextInput value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} />
            </Field>
            <Field label="توضیح متا" hint="خلاصهٔ یک‌خطی برای نتایج جستجو">
              <TextArea value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} />
            </Field>
          </div>
          <FormActions onCancel={() => history.back()} busy={busy} />
        </AdminCard>
        </form>
      )}
    </div>
  );
}

function EffectivePricePreview({ price, compare }: { price: string; compare: string }) {
  const p = Number(price);
  const c = Number(compare);
  if (!p) return null;
  return (
    <div className="mt-4 rounded-xl bg-lajvard/10 p-4 text-sm dark:bg-lajvard-soft/10">
      قیمت نمایشی: <b>{faPrice(p)}</b>
      {c > p && <> · <span className="text-clay">با {faPrice(c)} برچسب تخفیف {faNum(Math.round((1 - p / c) * 100))}٪</span></>}
    </div>
  );
}

/* ————— Media tab ————— */

function ProductMedia({ productId }: { productId: string }) {
  const { data: images, reload } = useAdminResource<ImageRow[]>(`/admin/products/${productId}/images`);
  const { mutate, busy } = useAdminMutation();
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const addImage = async () => {
    if (!uploadUrl) { toast("ابتدا تصویر را انتخاب کنید.", "error"); return; }
    const ok = await mutate(`/admin/products/${productId}/images`, {
      method: "POST",
      body: JSON.stringify({ url: uploadUrl, is_primary: !(images ?? []).length }),
      successMessage: "تصویر افزوده شد.",
    });
    if (ok) { setUploadUrl(null); void reload(); }
  };

  const setPrimary = async (imageId: string) => {
    const ok = await mutate(`/admin/products/${productId}/images/${imageId}/primary`, { method: "PATCH" });
    if (ok !== null) void reload();
  };

  const removeImage = async (imageId: string) => {
    const ok = await mutate(`/admin/products/${productId}/images/${imageId}`, { method: "DELETE", successMessage: "تصویر حذف شد." });
    if (ok) void reload();
  };

  return (
    <div className="space-y-6">
      <AdminCard title="افزودن تصویر">
        <div className="flex flex-wrap items-end gap-4">
          <MediaUploader value={uploadUrl} onChange={setUploadUrl} label="تصویر جدید" />
          <button type="button" onClick={() => void addImage()} disabled={busy || !uploadUrl} className="min-h-[44px] rounded-xl bg-lajvard px-4 text-sm text-white disabled:opacity-50 dark:bg-lajvard-soft dark:text-char">افزودن به گالری</button>
        </div>
      </AdminCard>

      <AdminCard title={`گالری (${faNum((images ?? []).length)})`}>
        {(images ?? []).length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-soft">تصویری ثبت نشده است. اولین تصویر، تصویر شاخص می‌شود.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {(images ?? []).map((img) => (
              <li key={img.id} className="overflow-hidden rounded-2xl bg-slip dark:bg-surface">
                <div className="relative aspect-square">
                  <Image src={mediaUrl(img.url)} alt={img.alt_text || "تصویر محصول"} fill sizes="200px" className="object-cover" />
                  {img.is_primary && <span className="absolute right-2 top-2 rounded-full bg-firouzeh px-2 py-0.5 text-xs text-white">شاخص</span>}
                </div>
                <div className="flex gap-1 p-2">
                  {!img.is_primary && (
                    <button type="button" onClick={() => void setPrimary(img.id)} disabled={busy} className="min-h-[36px] flex-1 rounded-lg border border-char/20 text-xs dark:border-white/20">شاخص کن</button>
                  )}
                  <button type="button" onClick={() => void removeImage(img.id)} disabled={busy} className="min-h-[36px] flex-1 rounded-lg text-xs text-clay hover:bg-clay/10">حذف</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}

/* ————— Variants tab ————— */

function ProductVariants({ productId }: { productId: string }) {
  const { data: variants, reload } = useAdminResource<VariantRow[]>(`/admin/products/${productId}/variants`);
  const { mutate, busy } = useAdminMutation();
  const [editing, setEditing] = useState<VariantRow | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<VariantRow | null>(null);
  const emptyForm = { name: "", sku: "", price_delta: "0", absolute_price: "", stock_qty: "0", is_active: true, image_url: null as string | null };
  const [form, setForm] = useState(emptyForm);

  const openEdit = (v: VariantRow) => {
    setEditing(v);
    setForm({
      name: v.name, sku: v.sku, price_delta: String(v.price_delta),
      absolute_price: v.absolute_price !== null ? String(v.absolute_price) : "",
      stock_qty: String(v.stock_qty), is_active: v.is_active, image_url: v.image_url,
    });
  };

  const submit = async () => {
    const body = {
      name: form.name, sku: form.sku, price_delta: Number(form.price_delta) || 0,
      absolute_price: form.absolute_price ? Number(form.absolute_price) : null,
      stock_qty: Number(form.stock_qty) || 0, is_active: form.is_active, image_url: form.image_url,
    };
    const ok = editing
      ? await mutate(`/admin/variants/${editing.id}`, { method: "PATCH", body: JSON.stringify(body), successMessage: "وارینت ذخیره شد." })
      : await mutate(`/admin/products/${productId}/variants`, { method: "POST", body: JSON.stringify(body), successMessage: "وارینت افزوده شد." });
    if (ok) { setEditing(null); setAdding(false); setForm(emptyForm); void reload(); }
  };

  const remove = async () => {
    if (!deleting) return;
    const ok = await mutate(`/admin/variants/${deleting.id}`, { method: "DELETE", successMessage: "وارینت حذف شد." });
    if (ok) { setDeleting(null); void reload(); }
  };

  return (
    <AdminCard
      title="وارینت‌ها (رنگ، سایز و …)"
      action={<button type="button" onClick={() => { setAdding(true); setForm(emptyForm); }} className="min-h-[40px] rounded-xl bg-lajvard px-4 text-sm text-white dark:bg-lajvard-soft dark:text-char">+ وارینت</button>}
    >
      {(variants ?? []).length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-soft">وارینتی ثبت نشده است. مشتری بدون انتخاب وارینت، خودِ محصول را می‌خرد.</p>
      ) : (
        <ul className="space-y-3">
          {(variants ?? []).map((v) => (
            <li key={v.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-char/10 p-3 dark:border-white/10">
              <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-slip dark:bg-surface">
                {v.image_url ? <Image src={mediaUrl(v.image_url)} alt={v.name} fill sizes="56px" className="object-cover" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{v.name}</p>
                <p className="text-xs text-ink-soft">
                  کد: {v.sku} · موجودی: {faNum(v.stock_qty)} ·{" "}
                  {v.absolute_price ? `قیمت ثابت: ${faPrice(v.absolute_price)}` : `افزوده بر پایه: ${faPrice(v.price_delta)}`}
                  {!v.is_active && " · غیرفعال"}
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => openEdit(v)} className="min-h-[40px] rounded-xl border border-char/20 px-4 text-sm dark:border-white/20">ویرایش</button>
                <button type="button" onClick={() => setDeleting(v)} className="min-h-[40px] rounded-xl px-3 text-sm text-clay hover:bg-clay/10">حذف</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={editing !== null || adding} onClose={() => { setEditing(null); setAdding(false); }} title={editing ? "ویرایش وارینت" : "وارینت جدید"}>
        <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-4">
          <Field label="نام وارینت" required hint="مثلاً: فیروزه‌ای یا سایز بزرگ">
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="کد (SKU)" required hint="برای هر وارینت یکتا باشد">
            <TextInput value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="افزوده بر قیمت پایه (تومان)">
              <TextInput type="number" value={form.price_delta} onChange={(e) => setForm({ ...form, price_delta: e.target.value })} />
            </Field>
            <Field label="یا قیمت ثابت (تومان)" hint="اگر پر شود، قیمت ثابت معتبر است">
              <TextInput type="number" value={form.absolute_price} onChange={(e) => setForm({ ...form, absolute_price: e.target.value })} />
            </Field>
          </div>
          <Field label="موجودی" required>
            <TextInput type="number" min={0} value={form.stock_qty} onChange={(e) => setForm({ ...form, stock_qty: e.target.value })} required />
          </Field>
          <MediaUploader value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} label="تصویر وارینت" />
          <Toggle checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} label="فعال" />
          <FormActions onCancel={() => { setEditing(null); setAdding(false); }} busy={busy} />
        </form>
      </Modal>

      <ConfirmDialog open={deleting !== null} message={`وارینت «${deleting?.name}» حذف شود؟`} onConfirm={() => void remove()} onCancel={() => setDeleting(null)} busy={busy} />
    </AdminCard>
  );
}

/* ————— Related products tab ————— */

function RelatedProducts({ productId }: { productId: string }) {
  const { data: related, reload } = useAdminResource<RelatedRow[]>(`/admin/products/${productId}/related-list`);
  const { mutate, busy } = useAdminMutation();
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search);
  const searchPath = debounced.trim()
    ? `/admin/products-v2?search=${encodeURIComponent(debounced)}&limit=8`
    : null;
  const { data: results } = useAdminResource<{ items: ProductSearchItem[] }>(searchPath, [debounced]);

  const add = async (relatedId: string) => {
    const ok = await mutate(`/admin/products/${productId}/related/${relatedId}`, { method: "POST", successMessage: "محصول مرتبط افزوده شد." });
    if (ok) void reload();
  };
  const remove = async (relatedId: string) => {
    const ok = await mutate(`/admin/products/${productId}/related/${relatedId}`, { method: "DELETE", successMessage: "حذف شد." });
    if (ok) void reload();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <AdminCard title="افزودن محصول مرتبط">
        <TextInput placeholder="جستجوی محصول…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <ul className="mt-3 max-h-80 space-y-1 overflow-y-auto">
          {(results?.items ?? [])
            .filter((p) => p.id !== productId)
            .map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => void add(p.id)} disabled={busy} className="flex min-h-[44px] w-full items-center justify-between rounded-xl px-3 text-sm hover:bg-char/5 dark:hover:bg-white/10">
                  <span>{p.name}</span>
                  <span className="text-firouzeh">+</span>
                </button>
              </li>
            ))}
          {debounced.trim() && !(results?.items ?? []).length && <li className="p-3 text-sm text-ink-soft">محصولی یافت نشد.</li>}
        </ul>
      </AdminCard>

      <AdminCard title="محصولات مرتبط فعلی">
        {(related ?? []).length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-soft">محصول مرتبطی انتخاب نشده است.</p>
        ) : (
          <ul className="space-y-2">
            {(related ?? []).map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-xl border border-char/10 p-3 text-sm dark:border-white/10">
                <span>{r.name}</span>
                <button type="button" onClick={() => void remove(r.id)} disabled={busy} className="min-h-[36px] rounded-lg px-3 text-clay hover:bg-clay/10">حذف</button>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
