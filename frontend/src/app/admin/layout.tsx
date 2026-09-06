"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronDown, FolderTree, Image as ImageIcon,
  LayoutDashboard, LogOut, Menu, MessageSquare,
  Package, ReceiptText, RotateCcw, ScrollText, ShieldCheck,
  Star, Ticket, Truck, Users, X, HelpCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { AdminSearchModal } from "./admin-search-modal";
import { Search, ShoppingBag } from "lucide-react";

type NavLeaf = { label: string; href: string; icon: React.ComponentType<{ className?: string }> };
type NavGroup = { label: string; items: NavLeaf[] };

const NAV: NavGroup[] = [
  {
    label: "نمای کلی",
    items: [
      { label: "داشبورد", href: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "فروشگاه",
    items: [
      { label: "محصولات", href: "/admin/products", icon: Package },
      { label: "دسته‌بندی‌ها", href: "/admin/categories", icon: FolderTree },
    ],
  },
  {
    label: "محتوا",
    items: [
      { label: "مقالات", href: "/admin/articles", icon: ScrollText },
      { label: "دستهٔ مقالات", href: "/admin/article-categories", icon: FolderTree },
      { label: "سوالات رایج", href: "/admin/faq", icon: HelpCircle },
      { label: "بنرهای اسلایدری", href: "/admin/carousels", icon: ImageIcon },
    ],
  },
  {
    label: "فروش",
    items: [
      { label: "سفارش‌ها", href: "/admin/orders", icon: ReceiptText },
      { label: "مرجوعی‌ها", href: "/admin/returns", icon: RotateCcw },
      { label: "کدهای تخفیف", href: "/admin/coupons", icon: Ticket },
      { label: "روش‌های ارسال", href: "/admin/shipping", icon: Truck },
    ],
  },
  {
    label: "مشتریان",
    items: [
      { label: "کاربران", href: "/admin/users", icon: Users },
      { label: "نظرات", href: "/admin/reviews", icon: Star },
      { label: "پرسش‌ها", href: "/admin/questions", icon: MessageSquare },
      { label: "پیام‌ها", href: "/admin/messages", icon: MessageSquare },
    ],
  },
  {
    label: "سیستم",
    items: [
      { label: "نقش‌ها و دسترسی‌ها", href: "/admin/roles", icon: ShieldCheck },
    ],
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="ناوبری ادمین">
      {NAV.map((group, gi) => (
        <div key={group.label} className="mb-3">
          <button
            type="button"
            onClick={() => setOpen((p) => ({ ...p, [gi]: p[gi] === false ? true : false }))}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider text-ink-soft/70 transition-colors hover:text-ink-soft"
            aria-expanded={open[gi] !== false}
          >
            {group.label}
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", (open[gi] ?? true) && "rotate-180")} />
          </button>
          {(open[gi] ?? true) && (
            <ul className="mt-1 space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "group relative flex min-h-[42px] items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-200",
                        active
                          ? "bg-lajvard font-bold text-white shadow-shelf dark:bg-lajvard-soft dark:text-char"
                          : "text-char-soft hover:bg-char/5 hover:text-char dark:text-ink-soft dark:hover:bg-white/10 dark:hover:text-white",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className={cn(
                        "h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110",
                        active ? "text-white dark:text-char" : "text-char-soft dark:text-ink-soft",
                      )} />
                      <span className="truncate">{item.label}</span>
                      {active && (
                        <span aria-hidden="true" className="absolute inset-y-2 right-0 w-1 rounded-full bg-white/60 dark:bg-char/50" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ))}
    </nav>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading, logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) router.replace("/auth?next=/admin/dashboard");
  }, [loading, user, isAdmin, router]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slip dark:bg-black/40">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-char/20 border-t-lajvard dark:border-white/20 dark:border-t-lajvard-soft" />
          <p className="animate-pulse text-sm text-ink-soft">در حال بررسی دسترسی…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slip dark:bg-[#1c1a18]" dir="rtl">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-l border-char/10 bg-surface dark:border-white/10 dark:bg-surface lg:flex">
        <div className="border-b border-char/10 p-5 dark:border-white/10">
          <Link href="/" className="text-lg font-extrabold tracking-tight">آنیمور سرام</Link>
          <p className="mt-0.5 text-xs text-ink-soft">پنل مدیریت فروشگاه</p>
        </div>
        <SidebarContent />
        <div className="border-t border-char/10 p-4 dark:border-white/10">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lajvard/10 text-sm font-bold text-lajvard dark:bg-lajvard-soft/15 dark:text-lajvard-soft">
              {(user.full_name || user.email || "?")[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{user.full_name || user.email}</div>
              <div className="truncate text-xs text-ink-soft">مدیر</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="flex min-h-[40px] w-full items-center gap-2 rounded-xl px-3 text-sm text-clay transition-colors hover:bg-clay/10"
          >
            <LogOut className="h-4 w-4" /> خروج
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="بستن منو"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-72 flex-col bg-surface shadow-lifted dark:bg-surface">
            <div className="flex items-center justify-between border-b border-char/10 p-4 dark:border-white/10">
              <span className="font-extrabold">پنل مدیریت</span>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="بستن" className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-char/5 dark:hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex min-h-[56px] items-center gap-2 border-b border-char/10 bg-surface/90 px-4 py-2 backdrop-blur-lg dark:border-white/10 dark:bg-surface/90 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-char/5 dark:hover:bg-white/10"
            aria-label="باز کردن منو"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/admin/dashboard" className="min-w-0 flex-1 truncate font-extrabold">آنیمور سرام · ادمین</Link>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-char/5 dark:hover:bg-white/10"
            aria-label="جست‌وجو"
          >
            <Search className="h-5 w-5" />
          </button>
          <Link
            href="/cart"
            className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-char/5 dark:hover:bg-white/10"
            aria-label="سبد خرید فروشگاه"
          >
            <ShoppingBag className="h-5 w-5" />
          </Link>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 lg:py-8">{children}</main>
      </div>

      <AdminSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
