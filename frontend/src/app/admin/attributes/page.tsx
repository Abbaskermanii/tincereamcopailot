"use client";

import { useState } from "react";
import Image from "next/image";
import { Field, FormActions, Modal, PageHeader, TextInput } from "@/components/admin/kit";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { useAdminMutation, useAdminResource } from "@/lib/admin-hooks";
import { mediaUrl } from "@/lib/api";


interface AttributeValue {
  id: string;
  value: string;
  slug: string;
  swatch_image_url: string | null;
  sort_order: number;
}
interface Attribute {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  values: AttributeValue[];
}

export default function AdminAttributesPage() {
  const { data: attrs, reload } = useAdminResource<Attribute[]>("/admin/attributes");
  const { mutate, busy } = useAdminMutation();
  const [editingAttr, setEditingAttr] = useState<Attribute | null>(null);
  const [creating, setCreating] = useState(false);
  const [formAttr, setFormAttr] = useState({ name: "", slug: "", sort_order: 0 });
  const [valueModal, setValueModal] = useState<{ attr: Attribute; editing?: AttributeValue } | null>(null);
  const [formValue, setFormValue] = useState({ value: "", slug: "", swatch_image_url: null as string | null, sort_order: 0 });

  const openCreateAttr = () => {
    setFormAttr({ name: "", slug: "", sort_order: 0 });
    setCreating(true);
  };
  const openEditAttr = (a: Attribute) => {
    setFormAttr({ name: a.name, slug: a.slug, sort_order: a.sort_order });
    setEditingAttr(a);
  };
  const submitAttr = async () => {
    const body: Record<string, unknown> = { name: formAttr.name, slug: formAttr.slug || undefined, sort_order: Number(formAttr.sort_order) };
    const ok = editingAttr
      ? await mutate(`/admin/attributes/${editingAttr.id}`, { method: "PATCH", body: JSON.stringify(body), successMessage: "ویژگی ذخیره شد." })
      : await mutate("/admin/attributes", { method: "POST", body: JSON.stringify(body), successMessage: "ویژگی ایجاد شد." });
    if (ok) {
      setCreating(false);
      setEditingAttr(null);
      void reload();
    }
  };
  const deleteAttr = async (a: Attribute) => {
    if (!confirm(`ویژگی «${a.name}» حذف شود؟`)) return;
    const ok = await mutate(`/admin/attributes/${a.id}`, { method: "DELETE", successMessage: "حذف شد." });
    if (ok) void reload();
  };

  const openValueCreate = (attr: Attribute) => {
    setFormValue({ value: "", slug: "", swatch_image_url: null, sort_order: 0 });
    setValueModal({ attr });
  };
  const openValueEdit = (attr: Attribute, v: AttributeValue) => {
    setFormValue({ value: v.value, slug: v.slug, swatch_image_url: v.swatch_image_url, sort_order: v.sort_order });
    setValueModal({ attr, editing: v });
  };
  const submitValue = async () => {
    if (!valueModal) return;
    const body = {
      value: formValue.value,
      slug: formValue.slug || undefined,
      swatch_image_url: formValue.swatch_image_url,
      sort_order: Number(formValue.sort_order),
    };
    const ok = valueModal.editing
      ? await mutate(`/admin/attribute-values/${valueModal.editing.id}`, { method: "PATCH", body: JSON.stringify(body), successMessage: "مقدار ذخیره شد." })
      : await mutate(`/admin/attributes/${valueModal.attr.id}/values`, { method: "POST", body: JSON.stringify(body), successMessage: "مقدار افزوده شد." });
    if (ok) {
      setValueModal(null);
      void reload();
    }
  };
  const deleteValue = async (v: AttributeValue) => {
    if (!confirm(`مقدار «${v.value}» حذف شود؟`)) return;
    const ok = await mutate(`/admin/attribute-values/${v.id}`, { method: "DELETE", successMessage: "حذف شد." });
    if (ok) void reload();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="ویژگی‌های محصول (Attribute)"
        description="ویژگی‌های سراسری مثل رنگ، طرح، سایز — یک‌بار تعریف، در همه محصولات قابل استفاده."
        action={<button type="button" onClick={openCreateAttr} className="min-h-[44px] rounded-xl bg-lajvard px-4 text-sm text-white hover:bg-lajvard-deep dark:bg-lajvard-soft dark:text-char">+ ویژگی جدید</button>}
      />

      <div className="space-y-4">
        {(attrs ?? []).map((attr) => (
          <div key={attr.id} className="rounded-2xl bg-surface p-5 shadow-shelf dark:bg-black/25">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold">{attr.name} <span className="text-xs text-ink-soft">/{attr.slug}</span></p>
                <p className="mt-1 text-xs text-ink-soft">{attr.values.length} مقدار</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => openEditAttr(attr)} className="min-h-[40px] rounded-xl border border-char/20 px-4 text-sm dark:border-white/20">ویرایش</button>
                <button type="button" onClick={() => void deleteAttr(attr)} className="min-h-[40px] rounded-xl px-3 text-sm text-clay hover:bg-clay/10">حذف</button>
                <button type="button" onClick={() => openValueCreate(attr)} className="min-h-[40px] rounded-xl bg-lajvard/10 px-4 text-sm text-lajvard dark:bg-lajvard-soft/10 dark:text-lajvard-soft">+ مقدار</button>
              </div>
            </div>
            {attr.values.length > 0 && (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {attr.values.map((v) => (
                  <li key={v.id} className="flex items-center gap-3 rounded-xl border border-char/10 p-3 dark:border-white/10">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slip">
                      {v.swatch_image_url ? <Image src={mediaUrl(v.swatch_image_url)} alt={v.value} width={40} height={40} className="object-cover" /> : <span className="text-xs">{v.value[0]}</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{v.value}</p>
                      <p className="truncate text-xs text-ink-soft">/{v.slug}</p>
                    </div>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => openValueEdit(attr, v)} className="rounded-lg px-2 py-1 text-xs hover:bg-char/5 dark:hover:bg-white/10">ویرایش</button>
                      <button type="button" onClick={() => void deleteValue(v)} className="rounded-lg px-2 py-1 text-xs text-clay hover:bg-clay/10">حذف</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
        {(attrs?.length ?? 0) === 0 && <p className="rounded-2xl bg-surface p-10 text-center text-sm text-ink-soft dark:bg-black/25">هنوز ویژگی‌ای تعریف نشده است.</p>}
      </div>

      <Modal open={creating || editingAttr !== null} onClose={() => { setCreating(false); setEditingAttr(null); }} title={editingAttr ? "ویرایش ویژگی" : "ویژگی جدید"}>
        <form onSubmit={(e) => { e.preventDefault(); void submitAttr(); }} className="space-y-4">
          <Field label="نام ویژگی" required hint="مثلاً: رنگ، طرح، سایز">
            <TextInput value={formAttr.name} onChange={(e) => setFormAttr({ ...formAttr, name: e.target.value })} required />
          </Field>
          <Field label="شناسه (slug)" hint="خالی بگذارید تا خودکار ساخته شود">
            <TextInput value={formAttr.slug} onChange={(e) => setFormAttr({ ...formAttr, slug: e.target.value })} placeholder="rang" dir="ltr" />
          </Field>
          <FormActions onCancel={() => { setCreating(false); setEditingAttr(null); }} busy={busy} />
        </form>
      </Modal>

      <Modal open={valueModal !== null} onClose={() => setValueModal(null)} title={valueModal?.editing ? "ویرایش مقدار" : `مقدار جدید برای «${valueModal?.attr.name}»`}>
        <form onSubmit={(e) => { e.preventDefault(); void submitValue(); }} className="space-y-4">
          <Field label="مقدار" required hint="مثلاً: قرمز، خرسی">
            <TextInput value={formValue.value} onChange={(e) => setFormValue({ ...formValue, value: e.target.value })} required />
          </Field>
          <Field label="شناسه (slug)">
            <TextInput value={formValue.slug} onChange={(e) => setFormValue({ ...formValue, slug: e.target.value })} dir="ltr" />
          </Field>
          <MediaUploader value={formValue.swatch_image_url} onChange={(url) => setFormValue({ ...formValue, swatch_image_url: url })} label="تصویر نمونه (swatch) — اختیاری" />
          <FormActions onCancel={() => setValueModal(null)} busy={busy} />
        </form>
      </Modal>
    </div>
  );
}
