"use client";

import { ShoppingBag } from "lucide-react";
import { EmptyState, ErrorBanner, PageHeader } from "@/components/admin/kit";
import { useAdminResource } from "@/lib/admin-hooks";
import { toPersianDigits } from "@/lib/format";

interface ActivityEntry {
  id: string; action: string; entity_type: string; entity_id: string | null;
  actor_name: string; metadata: Record<string, unknown>;
  created_at: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  create: { label: "ایجاد", color: "text-firouzeh" },
  update: { label: "ویرایش", color: "text-lajvard dark:text-lajvard-soft" },
  delete: { label: "حذف", color: "text-clay" },
  moderate: { label: "مدیریت", color: "text-lajvard dark:text-lajvard-soft" },
  fulfil: { label: "پردازش", color: "text-firouzeh" },
  answer: { label: "پاسخ", color: "text-firouzeh" },
  upload: { label: "بارگذاری", color: "text-lajvard dark:text-lajvard-soft" },
  broadcast: { label: "ارسال گروهی", color: "text-amber-600 dark:text-amber-400" },
  reorder: { label: "ترتیب", color: "text-lajvard dark:text-lajvard-soft" },
  reset: { label: "بازنشانی", color: "text-amber-600 dark:text-amber-400" },
};

const ENTITY_LABELS: Record<string, string> = {
  product: "محصول", category: "دسته‌بندی", brand: "برند", variant: "وارینت",
  order: "سفارش", coupon: "کد تخفیف", campaign: "کمپین",
  article: "مقاله", page: "صفحه", homepage_section: "بخش صفحه اصلی",
  review: "نظر", question: "پرسش", role: "نقش",
  settings: "تنظیمات", media: "رسانه", notification: "اعلان",
  shipping_method: "روش ارسال", return_request: "مرجوعی",
};

export default function AdminActivityPage() {
  const { data: activities, loading, error, reload } = useAdminResource<ActivityEntry[]>("/admin/activity");

  return (
    <div>
      <PageHeader title="لاگ فعالیت‌ها" description="تاریخچهٔ عملیات مدیران" />

      {error && <ErrorBanner message={error} onRetry={reload} />}

      {(activities?.length ?? 0) === 0 && !loading ? (
        <EmptyState icon={<ShoppingBag className="h-12 w-12" />} title="فعالیتی ثبت نشده" />
      ) : (
        <div className="space-y-2">
          {(activities ?? []).map((a) => {
            const action = ACTION_LABELS[a.action] ?? { label: a.action, color: "text-ink-soft" };
            const entity = ENTITY_LABELS[a.entity_type] ?? a.entity_type;
            return (
              <div key={a.id} className="glaze-edge flex items-center gap-4 rounded-wobble bg-surface px-5 py-3 shadow-shelf transition-all duration-300 hover:shadow-lifted dark:bg-black/25">
                <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-lajvard dark:bg-lajvard-soft" />
                <div className="min-w-0 flex-1 text-sm">
                  <span className="font-medium">{a.actor_name}</span>
                  <span className={`mx-1.5 font-medium ${action.color}`}>{action.label}</span>
                  <span className="text-ink-soft">{entity}</span>
                  {a.entity_id && <span className="mr-1 text-xs text-ink-soft/50">({a.entity_id.slice(0, 8)})</span>}
                </div>
                <span className="shrink-0 num-latin text-xs text-ink-soft">{toPersianDigits(new Date(a.created_at).toLocaleString("fa-IR"))}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
