"use client";

import { useState, useEffect } from "react";
import { GripVertical, Plus, Trash2, Save } from "lucide-react";
import { PageHeader, EmptyState, Field, TextInput, FormActions } from "@/components/admin/kit";
import { useToast } from "@/components/ui/toast-provider";

interface NavItem {
  label: string;
  url: string;
  sort_order: number;
  is_active: boolean;
  open_in_new_tab: boolean;
}

const LOCATIONS = [
  { key: "header", label: "منوی اصلی هدر" },
  { key: "footer_main", label: "منوی فوتر — فروشگاه" },
  { key: "footer_help", label: "منوی فوتر — راهنما" },
  { key: "social", label: "لینک‌های شبکه اجتماعی" },
];

export default function AdminNavigationPage() {
  const { toast } = useToast();
  const [activeLocation, setActiveLocation] = useState("header");
  const [items, setItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/admin/navigation/${activeLocation}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [activeLocation]);

  const addItem = () => {
    setItems([...items, { label: "", url: "", sort_order: items.length * 10, is_active: true, open_in_new_tab: false }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof NavItem, value: string | boolean | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/admin/navigation/${activeLocation}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ location: activeLocation, items }),
      });
      if (res.ok) {
        toast({ title: "ذخیره شد", variant: "success" });
      } else {
        toast({ title: "خطا در ذخیره", variant: "error" });
      }
    } catch {
      toast({ title: "خطا در اتصال", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="مدیریت منوها" description="کنترل کامل منوی هدر، فوتر و لینک‌های شبکه اجتماعی" />

      <div className="mb-6 flex flex-wrap gap-2">
        {LOCATIONS.map((loc) => (
          <button
            key={loc.key}
            type="button"
            onClick={() => setActiveLocation(loc.key)}
            className={`min-h-[36px] rounded-lg px-4 text-sm transition-colors ${
              activeLocation === loc.key
                ? "bg-lajvard text-white dark:bg-lajvard-soft dark:text-char"
                : "bg-char/5 text-ink-soft hover:bg-char/10 dark:bg-white/10"
            }`}
          >
            {loc.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-char-soft dark:text-ink-soft">در حال بارگذاری...</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<GripVertical className="h-12 w-12" />}
          title="آیتمی وجود ندارد"
          description="اولین آیتم منو را اضافه کنید."
          action={
            <button type="button" onClick={addItem} className="min-h-[44px] rounded-xl bg-lajvard px-4 text-sm text-white dark:bg-lajvard-soft dark:text-char">
              <Plus className="ml-1 inline h-4 w-4" /> افزودن آیتم
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex flex-wrap items-end gap-3 rounded-xl border border-char/10 bg-surface p-4 dark:border-white/10 dark:bg-black/20">
              <div className="flex items-center text-char-soft dark:text-ink-soft">
                <GripVertical className="h-5 w-5" />
                <span className="mr-2 text-xs text-char-soft">{index + 1}</span>
              </div>
              <Field label="عنوان" className="min-w-[150px] flex-1">
                <TextInput value={item.label} onChange={(e) => updateItem(index, "label", e.target.value)} placeholder="عنوان منو" />
              </Field>
              <Field label="آدرس" className="min-w-[200px] flex-[2]">
                <TextInput value={item.url} onChange={(e) => updateItem(index, "url", e.target.value)} placeholder="/shop یا https://..." />
              </Field>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={item.is_active} onChange={(e) => updateItem(index, "is_active", e.target.checked)} className="h-4 w-4 rounded" />
                  فعال
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={item.open_in_new_tab} onChange={(e) => updateItem(index, "open_in_new_tab", e.target.checked)} className="h-4 w-4 rounded" />
                  تب جدید
                </label>
              </div>
              <button type="button" onClick={() => removeItem(index)} className="min-h-[36px] rounded-lg px-2 text-clay hover:bg-clay/10">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <div className="flex items-center gap-3 pt-4">
            <button type="button" onClick={addItem} className="min-h-[40px] rounded-xl border border-char/20 px-4 text-sm hover:bg-char/5 dark:border-white/20">
              <Plus className="ml-1 inline h-4 w-4" /> افزودن آیتم
            </button>
            <button type="button" onClick={save} disabled={saving} className="min-h-[40px] rounded-xl bg-lajvard px-6 text-sm text-white hover:bg-lajvard-deep disabled:opacity-50 dark:bg-lajvard-soft dark:text-char">
              <Save className="ml-1 inline h-4 w-4" /> {saving ? "در حال ذخیره..." : "ذخیره"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
