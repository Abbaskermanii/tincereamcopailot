"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { AdminCard, Field, PageHeader, TextInput, TextArea } from "@/components/admin/kit";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { useToast } from "@/components/ui/toast-provider";
import { apiJson } from "@/lib/api-client";
import { useAdminResource } from "@/lib/admin-hooks";

interface SettingDef { key: string; group: string; label: string; type: string; default: string; }
interface SettingVal { key: string; value: string; }
interface SettingsDefs { groups: { key: string; label: string }[]; definitions: SettingDef[]; }

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const { data: defs, loading: defsLoading } = useAdminResource<SettingsDefs>("/admin/settings/definitions");
  const { data: values, loading: valsLoading, reload } = useAdminResource<SettingVal[]>("/admin/settings");
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [activeGroup, setActiveGroup] = useState("general");

  const vals = new Map((values ?? []).map((v) => [v.key, v.value]));
  const definitions = defs?.definitions ?? [];
  const groups = defs?.groups ?? [];
  const groupDefs = definitions.filter((d) => d.group === activeGroup);

  const getVal = (key: string) => form[key] ?? vals.get(key) ?? definitions.find((d) => d.key === key)?.default ?? "";

  const save = async () => {
    setSaving(true);
    try {
      const body: Record<string, string> = {};
      definitions.forEach((d) => { body[d.key] = getVal(d.key); });
      await apiJson("/admin/settings/bulk", { method: "PUT", body: JSON.stringify({ values: body }) });
      toast("تنظیمات ذخیره شد.", "success");
      void reload();
    } catch {
      toast("خطا در ذخیره‌سازی.", "error");
    } finally {
      setSaving(false);
    }
  };

  const loading = defsLoading || valsLoading;

  return (
    <div>
      <PageHeader
        title="تنظیمات فروشگاه"
        description="اطلاعات کلی، شبکه‌های اجتماعی، سئو و ..."
        action={
          <button type="button" onClick={save} disabled={saving} className="min-h-[44px] rounded-xl bg-lajvard px-4 text-sm text-white hover:bg-lajvard-deep disabled:opacity-50 dark:bg-lajvard-soft dark:text-char">
            <Save className="ml-1 inline h-4 w-4" /> {saving ? "در حال ذخیره…" : "ذخیره همه"}
          </button>
        }
      />

      {loading ? (
        <div className="py-20 text-center text-ink-soft">در حال بارگذاری…</div>
      ) : (
        <>
          {/* Tabs */}
          <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-char/5 p-1 dark:bg-white/10">
            {groups.map((g) => (
              <button key={g.key} type="button" onClick={() => setActiveGroup(g.key)} className={`min-h-[36px] whitespace-nowrap rounded-lg px-4 text-sm font-medium transition-colors ${activeGroup === g.key ? "bg-surface text-char shadow-sm dark:bg-surface dark:text-ink" : "text-ink-soft hover:text-char dark:hover:text-ink"}`}>
                {g.label}
              </button>
            ))}
          </div>

          <AdminCard>
            <div className="space-y-5">
              {groupDefs.map((d) => (
                <Field key={d.key} label={d.label}>
                  {d.type === "text" ? (
                    <TextArea value={getVal(d.key)} onChange={(e) => setForm({ ...form, [d.key]: e.target.value })} rows={3} />
                  ) : d.type === "image" ? (
                    <MediaUploader value={getVal(d.key) || null} onChange={(url) => setForm({ ...form, [d.key]: url ?? "" })} label={d.label} aspect="square" />
                  ) : (
                    <TextInput value={getVal(d.key)} onChange={(e) => setForm({ ...form, [d.key]: e.target.value })} type={d.type === "number" ? "number" : "text"} />
                  )}
                </Field>
              ))}
              {groupDefs.length === 0 && (
                <p className="py-10 text-center text-sm text-ink-soft">تنظیمی برای این گروه تعریف نشده است.</p>
              )}
            </div>
          </AdminCard>
        </>
      )}
    </div>
  );
}
