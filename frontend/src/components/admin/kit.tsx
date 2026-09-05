"use client";

import React, { type ReactNode, useEffect, useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { faNum } from "@/lib/format";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/* ————————————————— Page header ————————————————— */

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold md:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-ink-soft">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ————————————————— Card (glaze-edge style) ————————————————— */

export function AdminCard({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("glaze-edge rounded-wobble bg-surface p-5 shadow-shelf dark:bg-black/25", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-bold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/* ————————————————— Modal (enhanced with animation) ————————————————— */

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    } else {
      setAnimate(false);
      const t = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!visible) return null;
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-end justify-center transition-opacity duration-200 sm:items-center",
        animate ? "opacity-100" : "opacity-0",
      )}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="بستن"
        className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200",
          animate ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className={cn(
          "relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-wobble bg-surface p-5 shadow-lifted dark:bg-surface",
          "sm:rounded-2xl",
          wide ? "sm:max-w-3xl" : "sm:max-w-lg",
          "transition-all duration-200",
          animate ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0",
          "max-sm:rounded-b-2xl",
        )}
      >
        {/* Glaze accent line at top */}
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-l from-lajvard via-clay to-firouzeh opacity-60" />

        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-char/15 text-sm transition-colors hover:bg-clay/10 hover:text-clay dark:border-white/15 dark:hover:bg-clay/10"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, message, onConfirm, onCancel, busy }: { open: boolean; message: string; onConfirm: () => void; onCancel: () => void; busy?: boolean }) {
  return (
    <Modal open={open} onClose={onCancel} title="تأیید عملیات">
      <p className="text-sm leading-relaxed text-ink-soft">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="min-h-[44px] rounded-xl border border-char/20 px-5 text-sm transition-colors hover:bg-char/5 dark:border-white/20 dark:hover:bg-white/5">انصراف</button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="min-h-[44px] rounded-xl bg-clay px-5 text-sm text-white transition-all hover:bg-copper hover:shadow-lifted disabled:opacity-50"
        >
          {busy ? "…" : "بله، انجام بده"}
        </button>
      </div>
    </Modal>
  );
}

/* ————————————————— Form fields ————————————————— */

const fieldCls =
  "w-full min-h-[44px] rounded-xl border border-char/20 bg-surface px-3 py-2.5 text-sm outline-none transition-all focus:border-lajvard focus:shadow-[0_0_0_3px_rgba(49,84,122,0.1)] dark:border-white/20 dark:bg-black/25 dark:focus:border-lajvard-soft";

export function Field({ label, children, hint, required }: { label: string; children: ReactNode; hint?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">
        {label} {required && <span className="text-clay">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldCls, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(fieldCls, "min-h-24", props.className)} />;
}

export function SelectInput({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(fieldCls, props.className)}>{children}</select>;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-[44px] items-center gap-3 text-sm"
    >
      <span className={cn("relative h-6 w-11 rounded-full transition-colors", checked ? "bg-firouzeh" : "bg-char/25 dark:bg-white/20")}>
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", checked ? "right-0.5" : "right-[22px]")} />
      </span>
      {label}
    </button>
  );
}

export function FormActions({ onCancel, busy, saveLabel = "ذخیره" }: { onCancel: () => void; busy?: boolean; saveLabel?: string }) {
  return (
    <div className="mt-6 flex justify-end gap-2 border-t border-char/10 pt-4 dark:border-white/10">
      <button type="button" onClick={onCancel} className="min-h-[44px] rounded-xl border border-char/20 px-5 text-sm transition-colors hover:bg-char/5 dark:border-white/20 dark:hover:bg-white/5">انصراف</button>
      <button type="submit" disabled={busy} className="min-h-[44px] rounded-xl bg-lajvard px-6 text-sm text-white transition-all hover:bg-lajvard-deep hover:shadow-lifted disabled:opacity-50 dark:bg-lajvard-soft dark:text-char">
        {busy ? "در حال ذخیره…" : saveLabel}
      </button>
    </div>
  );
}

/* ————————————————— Table (glaze-edge) ————————————————— */

export function DataTable<T extends { id?: string }>({ columns, rows, actions, empty, loading }: {
  columns: { key: string; label: string; render?: (row: T) => ReactNode; className?: string }[];
  rows: T[];
  actions?: (row: T) => ReactNode;
  empty?: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="glaze-edge rounded-wobble bg-surface p-2 shadow-shelf dark:bg-black/25">
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-char/5 dark:bg-white/10" />)}
        </div>
      </div>
    );
  }
  if (!rows.length) {
    return (
      <div className="glaze-edge rounded-wobble border border-dashed border-char/20 bg-surface p-10 text-center text-sm text-ink-soft shadow-shelf dark:border-white/15 dark:bg-black/25">
        {empty ?? "موردی یافت نشد."}
      </div>
    );
  }
  return (
    <div className="glaze-edge overflow-hidden rounded-wobble bg-surface shadow-shelf dark:bg-black/25">
      <table className="w-full min-w-[640px] text-right text-sm">
        <thead>
          <tr className="border-b border-char/10 text-xs uppercase tracking-wider text-ink-soft dark:border-white/10">
            {columns.map((c) => <th key={c.key} className={cn("whitespace-nowrap p-4 font-medium", c.className)}>{c.label}</th>)}
            {actions && <th className="p-4 font-medium">عملیات</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id ?? i} className="border-b border-char/5 transition-colors last:border-0 hover:bg-char/[0.03] dark:border-white/5 dark:hover:bg-white/[0.03]">
              {columns.map((c) => <td key={c.key} className={cn("p-4", c.className)}>{c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "—")}</td>)}
              {actions && <td className="whitespace-nowrap p-4">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ————————————————— Toolbar (search + filters) ————————————————— */

export function Toolbar({ search, onSearch, children }: { search?: string; onSearch?: (v: string) => void; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      {onSearch && (
        <div className="relative max-w-xs flex-1">
          <input
            type="search"
            value={search ?? ""}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="جستجو…"
            className={cn(fieldCls, "pl-9")}
            aria-label="جستجو"
          />
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
      )}
      {children}
    </div>
  );
}

/* ————————————————— Stat cards (glaze-edge style) ————————————————— */

export function StatCard({ label, value, hint, tone, icon }: { label: string; value: string | number; hint?: string; tone?: "brand" | "warn" | "good"; icon?: ReactNode }) {
  const toneCls = tone === "warn" ? "text-clay" : tone === "good" ? "text-firouzeh" : "text-lajvard dark:text-lajvard-soft";
  return (
    <div className="glaze-edge rounded-wobble bg-surface p-5 shadow-shelf transition-all duration-300 hover:shadow-lifted dark:bg-black/25">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-ink-soft">{label}</p>
          <p className={cn("mt-2 text-2xl font-extrabold", toneCls)}>{typeof value === "number" ? faNum(value) : value}</p>
          {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
        </div>
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lajvard/10 text-lajvard dark:bg-lajvard-soft/15 dark:text-lajvard-soft">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

/* ————————————————— Status badges ————————————————— */

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending: { label: "در انتظار پرداخت", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  paid: { label: "پرداخت‌شده", cls: "bg-firouzeh/20 text-firouzeh" },
  processing: { label: "در حال پردازش", cls: "bg-lajvard/15 text-lajvard dark:text-lajvard-soft" },
  shipped: { label: "ارسال‌شده", cls: "bg-lajvard/15 text-lajvard dark:text-lajvard-soft" },
  delivered: { label: "تحویل‌شده", cls: "bg-firouzeh/20 text-firouzeh" },
  cancelled: { label: "لغوشده", cls: "bg-clay/15 text-clay" },
  requested: { label: "ثبت‌شده", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  approved: { label: "تأییدشده", cls: "bg-firouzeh/20 text-firouzeh" },
  rejected: { label: "ردشده", cls: "bg-clay/15 text-clay" },
  received: { label: "دریافت‌شده", cls: "bg-lajvard/15 text-lajvard dark:text-lajvard-soft" },
  refunded: { label: "بازگشت وجه", cls: "bg-firouzeh/20 text-firouzeh" },
};

export function StatusBadge({ status }: { status: string }) {
  const info = STATUS_LABELS[status] ?? { label: status, cls: "bg-char/10 text-char-soft dark:bg-white/10 dark:text-ink-soft" };
  return <span className={cn("inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium", info.cls)}>{info.label}</span>;
}

export function orderStatusLabel(status: string): string {
  return STATUS_LABELS[status]?.label ?? status;
}

/* ————————————————— Pagination ————————————————— */

export function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="صفحه‌بندی" className="mt-6 flex items-center justify-center gap-2">
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="glaze-edge min-h-[40px] rounded-xl border border-char/20 px-4 text-sm transition-all hover:shadow-shelf disabled:opacity-40 dark:border-white/20">قبلی</button>
      <span className="px-3 text-sm text-ink-soft">صفحه {faNum(page)} از {faNum(pages)}</span>
      <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} className="glaze-edge min-h-[40px] rounded-xl border border-char/20 px-4 text-sm transition-all hover:shadow-shelf disabled:opacity-40 dark:border-white/20">بعدی</button>
    </nav>
  );
}

/* ————————————————— Tabs ————————————————— */

export function Tabs({ tabs, active, onChange }: { tabs: { key: string; label: string; count?: number }[]; active: string; onChange: (key: string) => void }) {
  return (
    <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-char/5 p-1 dark:bg-white/10">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={cn(
            "flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-lg px-4 text-sm font-medium transition-all",
            active === t.key
              ? "bg-surface text-char shadow-shelf dark:bg-surface dark:text-ink"
              : "text-ink-soft hover:text-char dark:hover:text-ink",
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={cn("rounded-full px-1.5 text-[10px] font-bold", active === t.key ? "bg-lajvard/15 text-lajvard dark:bg-lajvard-soft/20 dark:text-lajvard-soft" : "bg-char/10 text-char-soft dark:bg-white/10 dark:text-ink-soft")}>
              {faNum(t.count)}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ————————————————— Date Input ————————————————— */

export function DateInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="date" {...props} className={cn(fieldCls, "num-latin", props.className)} />;
}

/* ————————————————— Empty State ————————————————— */

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="glaze-edge flex flex-col items-center justify-center rounded-wobble border border-dashed border-char/20 py-16 text-center dark:border-white/15">
      {icon && <div className="mb-4 text-char-soft/50 dark:text-ink-soft/50">{icon}</div>}
      <p className="font-bold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ————————————————— Sortable List (drag handles) ————————————————— */

export function SortButtons({ index, total, onMove }: { index: number; total: number; onMove: (dir: -1 | 1) => void }) {
  return (
    <div className="flex flex-col gap-0.5">
      <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label="بالا" className="rounded border border-char/15 px-1.5 py-0.5 text-[10px] transition-colors hover:bg-char/5 disabled:opacity-25 dark:border-white/15 dark:hover:bg-white/5">▲</button>
      <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} aria-label="پایین" className="rounded border border-char/15 px-1.5 py-0.5 text-[10px] transition-colors hover:bg-char/5 disabled:opacity-25 dark:border-white/15 dark:hover:bg-white/5">▼</button>
    </div>
  );
}

/* ————————————————— Inline Editable Tag ————————————————— */

export function TagBadge({ children, onRemove, color }: { children: ReactNode; onRemove?: () => void; color?: "brand" | "warn" | "good" }) {
  const cls = color === "warn" ? "bg-clay/15 text-clay" : color === "good" ? "bg-firouzeh/20 text-firouzeh" : "bg-lajvard/10 text-lajvard dark:bg-lajvard-soft/15 dark:text-lajvard-soft";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", cls)}>
      {children}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label="حذف" className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-char/10 dark:hover:bg-white/10">✕</button>
      )}
    </span>
  );
}

/* ————————————————— Fullscreen Loading Overlay ————————————————— */

export function LoadingOverlay({ text = "در حال بارگذاری…" }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slip/80 backdrop-blur-sm dark:bg-black/60">
      <div className="glaze-edge flex flex-col items-center gap-3 rounded-wobble bg-surface p-8 shadow-lifted dark:bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-char/20 border-t-lajvard dark:border-white/20 dark:border-t-lajvard-soft" />
        <p className="text-sm text-ink-soft">{text}</p>
      </div>
    </div>
  );
}

/* ————————————————— Error Banner ————————————————— */

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="glaze-edge rounded-wobble border border-clay/30 bg-clay/5 p-4 shadow-shelf dark:bg-clay/10">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-clay/15 text-clay">
          <span className="text-sm">⚠</span>
        </div>
        <p className="flex-1 text-sm text-clay">{message}</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className="shrink-0 rounded-lg border border-clay/30 px-3 py-1.5 text-xs text-clay transition-colors hover:bg-clay/10">
            تلاش مجدد
          </button>
        )}
      </div>
    </div>
  );
}

/* ————————————————— Success Banner ————————————————— */

export function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="glaze-edge rounded-wobble border border-firouzeh/30 bg-firouzeh/5 p-4 shadow-shelf dark:bg-firouzeh/10">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-firouzeh/15 text-firouzeh">
          <span className="text-sm">✓</span>
        </div>
        <p className="flex-1 text-sm text-firouzeh">{message}</p>
      </div>
    </div>
  );
}

/* ————————————————— Skeleton Loader ————————————————— */

export function SkeletonCard() {
  return (
    <div className="glaze-edge rounded-wobble bg-surface p-5 shadow-shelf dark:bg-black/25">
      <div className="space-y-3">
        <div className="h-4 w-1/3 animate-pulse rounded-lg bg-char/5 dark:bg-white/10" />
        <div className="h-8 w-1/2 animate-pulse rounded-lg bg-char/5 dark:bg-white/10" />
        <div className="h-3 w-2/3 animate-pulse rounded-lg bg-char/5 dark:bg-white/10" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glaze-edge rounded-wobble bg-surface p-2 shadow-shelf dark:bg-black/25">
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3">
            <div className="h-10 w-10 animate-pulse rounded-xl bg-char/5 dark:bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 animate-pulse rounded bg-char/5 dark:bg-white/10" />
              <div className="h-2.5 w-1/2 animate-pulse rounded bg-char/5 dark:bg-white/10" />
            </div>
            <div className="h-6 w-16 animate-pulse rounded-full bg-char/5 dark:bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ————————————————— Carousel (for admin homepage preview) ————————————————— */

interface CarouselItem {
  children: ReactNode;
}

export function Carousel({ children }: { children: ReactNode }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, direction: "rtl" });
  const [selected, setSelected] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => emblaApi.off("select", onSelect);
  }, [emblaApi]);

  return (
    <div className="relative overflow-hidden rounded-wobble">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {React.Children.map(children, (child, i) => (
            <div key={i} className="min-w-0 flex-[0_0_100%]">
              {child}
            </div>
          ))}
        </div>
      </div>

      {(React.Children.count(children) > 1) && (
        <>
          <button
            aria-label="اسلاید قبلی"
            onClick={scrollPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur hover:bg-black/60"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            aria-label="اسلاید بعدی"
            onClick={scrollNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur hover:bg-black/60"
          >
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
            {Array.from({ length: React.Children.count(children) }).map((_, i) => (
              <button
                key={i}
                aria-label={`رفتن به اسلاید ${i + 1}`}
                onClick={() => emblaApi?.scrollTo(i)}
                className={`h-1.5 rounded-full transition-all ${i === selected ? "w-6 bg-white" : "w-1.5 bg-white/60 hover:bg-white/90"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function CarouselPrevious() { return null; }
export function CarouselNext() { return null; }

export function CarouselItem({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("basis-1/4 md:basis-1/5 lg:basis-1/6", className)} {...props}>
      {children}
    </div>
  );
}
