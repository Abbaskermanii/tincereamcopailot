"use client";

import {
  Bell,
  ChevronDown,
  Heart,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  Menu,
  Package,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { mediaUrl } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth-context";
import { faPrice } from "@/lib/format";

import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";

interface SearchHit {
  products: {
    slug: string;
    name: string;
    price: number;
    image_url: string | null;
  }[];
  categories: {
    slug: string;
    name: string;
  }[];
}

const NAV = [
  { href: "/", label: "خانه" },
  { href: "/shop", label: "فروشگاه" },
  { href: "/about", label: "داستان ما" },
  { href: "/blog", label: "مقالات" },
  { href: "/contact", label: "تماس با ما" },
];

const ACCOUNT_ROUTES = [
  {
    href: "/account",
    label: "پروفایل",
    icon: UserRound,
  },
  {
    href: "/account/orders",
    label: "سفارش‌ها",
    icon: Package,
  },
  {
    href: "/account/addresses",
    label: "نشانی‌ها",
    icon: MapPin,
  },
  {
    href: "/account/wishlist",
    label: "علاقه‌مندی‌ها",
    icon: Heart,
  },
  {
    href: "/account/notifications",
    label: "اعلان‌ها",
    icon: Bell,
  },
];

interface AccountMenuProps {
  user: ReturnType<typeof useAuth>["user"];
  isAdmin: boolean;
  loading: boolean;
  onLogout: () => Promise<void>;
}

function getInitials(fullName?: string) {
  if (!fullName?.trim()) return "";

  return fullName
    .trim()
    .split(/\s+/)
    .map((name) => name.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function AccountMenu({ user, isAdmin, loading, onLogout }: AccountMenuProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  /*
   * Close menu when clicking outside.
   */
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  /*
   * Close dropdown whenever authentication changes.
   */
  useEffect(() => {
    if (!user || loading) {
      setOpen(false);
    }
  }, [user, loading]);

  /*
   * Close dropdown on route changes / component lifecycle.
   */
  useEffect(() => {
    const handleRouteStart = () => {
      setOpen(false);
    };

    window.addEventListener("beforeunload", handleRouteStart);

    return () => {
      window.removeEventListener("beforeunload", handleRouteStart);
    };
  }, []);

  const handleToggle = () => {
    if (loading || !user || loggingOut) return;

    setOpen((current) => !current);
  };

  const handleNavigate = (href: string) => {
    /*
     * Close BEFORE navigation.
     */
    setOpen(false);

    router.push(href);
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    setOpen(false);
    setLoggingOut(true);

    try {
      await onLogout();

      // Hard refresh + redirect to homepage
      window.location.replace("/");
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="flex h-9 min-w-9 items-center justify-center" aria-hidden="true">
        {loading && <Loader2 className="h-4 w-4 animate-spin text-char-soft" />}
      </div>
    );
  }

  const initials = getInitials(user.full_name);

  return (
    <div ref={menuRef} className="relative">
      {/* Account trigger */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={loggingOut}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="account-menu"
        className="
          group
          flex h-9 items-center gap-2
          rounded-lg
          border border-char/10
          bg-char/5
          px-2
          transition-all duration-150
          hover:border-char/20
          hover:bg-char/10
          focus:outline-none
          focus:ring-2
          focus:ring-lajvard/20
          disabled:pointer-events-none
          disabled:opacity-60
          dark:border-white/10
          dark:bg-white/5
          dark:hover:border-white/15
          dark:hover:bg-white/10
        "
      >
        {/* Non-circular avatar */}
        <div
          className="
            relative
            h-6 w-6
            shrink-0
            overflow-hidden
            rounded-md
            bg-lajvard
            text-[10px]
            font-bold
            text-white
          "
        >
          {user.profile_image ? (
            <Image
              src={mediaUrl(user.profile_image)}
              alt=""
              fill
              sizes="24px"
              className="object-cover"
            />
          ) : initials ? (
            <span className="flex h-full w-full items-center justify-center">{initials}</span>
          ) : (
            <UserRound className="absolute inset-0 m-auto h-4 w-4" />
          )}
        </div>

        {/* Username */}
        <span className="hidden max-w-[110px] truncate text-xs font-medium sm:block">
          {user.full_name || "کاربر"}
        </span>

        <ChevronDown
          className={`
            h-3.5 w-3.5 shrink-0
            text-char-soft
            transition-transform duration-150
            ${open ? "rotate-180" : ""}
          `}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          id="account-menu"
          role="menu"
          aria-label="منوی حساب کاربری"
          className="
            absolute
            right-0
            top-[calc(100%+8px)]
            z-[60]
            w-[220px]
            overflow-hidden
            rounded-xl
            border
            border-char/10
            bg-surface
            p-1.5
            shadow-xl
            ring-1
            ring-black/5
            dark:border-white/10
            dark:bg-[#211f1d]
            dark:ring-white/5
          "
        >
          {/* Account navigation */}
          <nav className="space-y-0.5">
            {ACCOUNT_ROUTES.map((route) => {
              const Icon = route.icon;

              return (
                <button
                  key={route.href}
                  type="button"
                  role="menuitem"
                  onClick={() => handleNavigate(route.href)}
                  className="
                    flex
                    h-9
                    w-full
                    items-center
                    gap-2.5
                    rounded-lg
                    px-2.5
                    text-right
                    text-[13px]
                    text-char
                    transition-colors
                    hover:bg-char/5
                    hover:text-lajvard
                    dark:text-white/85
                    dark:hover:bg-white/5
                    dark:hover:text-lajvard
                  "
                >
                  <Icon
                    className="
                      h-[17px]
                      w-[17px]
                      shrink-0
                      text-char-soft
                      transition-colors
                    "
                    strokeWidth={1.8}
                  />

                  <span>{route.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Admin */}
          {isAdmin && (
            <>
              <div className="my-1.5 h-px bg-char/10 dark:bg-white/10" />

              <button
                type="button"
                role="menuitem"
                onClick={() => handleNavigate("/admin/dashboard")}
                className="
                  flex
                  h-9
                  w-full
                  items-center
                  gap-2.5
                  rounded-lg
                  px-2.5
                  text-right
                  text-[13px]
                  text-char
                  transition-colors
                  hover:bg-lajvard/10
                  hover:text-lajvard
                  dark:text-white/85
                  dark:hover:bg-lajvard/10
                  dark:hover:text-lajvard
                "
              >
                <LayoutDashboard className="h-[17px] w-[17px] shrink-0" strokeWidth={1.8} />

                <span>مدیریت فروشگاه</span>
              </button>
            </>
          )}

          {/* Logout */}
          <div className="my-1.5 h-px bg-char/10 dark:bg-white/10" />

          <button
            type="button"
            role="menuitem"
            disabled={loggingOut}
            onClick={handleLogout}
            className="
              flex
              h-9
              w-full
              items-center
              gap-2.5
              rounded-lg
              px-2.5
              text-right
              text-[13px]
              text-red-500
              transition-colors
              hover:bg-red-500/10
              disabled:pointer-events-none
              disabled:opacity-50
            "
          >
            {loggingOut ? (
              <Loader2 className="h-[17px] w-[17px] animate-spin" />
            ) : (
              <LogOut className="h-[17px] w-[17px]" strokeWidth={1.8} />
            )}

            <span>{loggingOut ? "در حال خروج..." : "خروج از حساب"}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const router = useRouter();

  const { count } = useCart();

  const { user, isAdmin, logout, isAuthenticated, loading } = useAuth();

  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /*
   * Search
   */
  useEffect(() => {
    if (!q.trim()) {
      setHits(null);
      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      try {
        const { apiFetch } = await import("@/lib/api-client");

        const res = await apiFetch(`/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        } as RequestInit);

        if (res.ok) {
          setHits(await res.json());
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          // Ignore search errors.
        }
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [q]);

  /*
   * Close mobile menu when authentication changes.
   */
  useEffect(() => {
    if (!loading) {
      setMobileMenuOpen(false);
    }
  }, [isAuthenticated, loading]);

  const closeAllMenus = () => {
    setSearchOpen(false);
    setMobileMenuOpen(false);
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!q.trim()) return;

    router.push(`/search?q=${encodeURIComponent(q)}`);

    setSearchOpen(false);
    setQ("");
    setHits(null);
  };

  const handleMobileNavigation = (href: string) => {
    setMobileMenuOpen(false);
    router.push(href);
  };

  const handleMobileLogout = async () => {
    if (loading) return;

    setMobileMenuOpen(false);

    try {
      await logout();

      // Hard refresh + redirect to homepage
      window.location.replace("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      <header
        className="
          sticky
          top-0
          z-40
          w-full
          border-b
          border-char/10
          bg-slip/95
          backdrop-blur-xl
          dark:border-white/10
          dark:bg-[#1c1a18]/95
        "
      >
        <nav
          className="
            mx-auto
            flex
            h-[62px]
            items-center
            gap-4
            px-4
            py-8
            sm:px-6
            lg:px-10
            xl:px-14
          "
        >
          {/* Mobile menu */}
          <button
            type="button"
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-lg
              text-char-soft
              transition-colors
              hover:bg-char/5
              hover:text-char
              dark:hover:bg-white/5
              dark:hover:text-white
              lg:hidden
            "
            onClick={() => setMobileMenuOpen(true)}
            aria-label="باز کردن منو"
          >
            <Menu className="h-5 w-5" strokeWidth={1.8} />
          </button>

          {/* Logo */}
          <Link
            href="/"
            className="
              shrink-0
              text-lg
              font-bold
              tracking-tight
              lg:text-xl
            "
            onClick={closeAllMenus}
          >
            تن‌سِرام
          </Link>

          {/* Desktop navigation */}
          <nav
            className="
              hidden
              flex-1
              items-center
              justify-center
              gap-0.5
              lg:flex
            "
            aria-label="ناوبری اصلی"
          >
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="
                  rounded-lg
                  px-3
                  py-2
                  text-[13px]
                  font-medium
                  transition-colors
                  hover:bg-char/5
                  hover:text-lajvard
                  dark:hover:bg-white/5
                  dark:hover:text-lajvard
                "
                onClick={closeAllMenus}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden shrink-0 items-center gap-1.5 lg:flex">
            {/* Search */}
            <div className="relative ml-1">
              <div className="relative w-64 xl:w-72">
                <Search
                  className="
                    pointer-events-none
                    absolute
                    left-3
                    top-1/2
                    h-4
                    w-4
                    -translate-y-1/2
                    text-char-soft
                  "
                  strokeWidth={1.8}
                />

                <input
                  type="search"
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleSearchSubmit(event);
                    }

                    if (event.key === "Escape") {
                      setSearchOpen(false);
                    }
                  }}
                  placeholder="جست‌وجو..."
                  className="
                    h-9
                    w-full
                    rounded-lg
                    border
                    border-char/10
                    bg-char/5
                    pl-9
                    pr-3
                    text-[13px]
                    outline-none
                    transition-all
                    placeholder:text-char-soft/50
                    focus:border-lajvard/40
                    focus:ring-2
                    focus:ring-lajvard/10
                    dark:border-white/10
                    dark:bg-white/5
                    dark:placeholder:text-char-soft/30
                  "
                  aria-label="جست‌وجو"
                />
              </div>

              {searchOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setSearchOpen(false)}
                    aria-label="بستن نتایج جست‌وجو"
                  />

                  <div
                    className="
                      absolute
                      left-0
                      right-0
                      top-[calc(100%+8px)]
                      z-50
                      max-h-[500px]
                      overflow-y-auto
                      rounded-xl
                      border
                      border-char/10
                      bg-surface
                      p-1
                      shadow-xl
                      dark:border-white/10
                      dark:bg-[#211f1d]
                    "
                  >
                    {hits?.products?.length ? (
                      <div>
                        <p className="px-2 pb-1 pt-2 text-[11px] font-medium text-char-soft">
                          محصولات
                        </p>

                        {hits.products.map((product) => (
                          <Link
                            key={product.slug}
                            href={`/product/${product.slug}`}
                            className="
                              flex
                              items-center
                              gap-2.5
                              rounded-lg
                              p-2
                              transition-colors
                              hover:bg-char/5
                              dark:hover:bg-white/5
                            "
                            onClick={() => {
                              setSearchOpen(false);
                              setQ("");
                              setHits(null);
                            }}
                          >
                            {product.image_url && (
                              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md">
                                <Image
                                  src={mediaUrl(product.image_url)}
                                  alt={product.name}
                                  fill
                                  sizes="36px"
                                  className="object-cover"
                                />
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium">{product.name}</p>
                            </div>

                            <span className="shrink-0 text-[11px] text-char-soft">
                              {faPrice(product.price)}
                            </span>
                          </Link>
                        ))}
                      </div>
                    ) : null}

                    {hits?.categories?.length ? (
                      <div>
                        <p className="px-2 pb-1 pt-2 text-[11px] font-medium text-char-soft">
                          دسته‌ها
                        </p>

                        {hits.categories.map((category) => (
                          <Link
                            key={category.slug}
                            href={`/category/${category.slug}`}
                            className="
                              block
                              rounded-lg
                              px-2.5
                              py-2
                              text-xs
                              transition-colors
                              hover:bg-char/5
                              hover:text-lajvard
                              dark:hover:bg-white/5
                            "
                            onClick={() => {
                              setSearchOpen(false);
                              setQ("");
                              setHits(null);
                            }}
                          >
                            {category.name}
                          </Link>
                        ))}
                      </div>
                    ) : null}

                    {hits === null && q.trim() && (
                      <div className="p-6 text-center text-xs text-char-soft">
                        در حال جست‌وجو...
                      </div>
                    )}

                    {hits && !hits.products?.length && !hits.categories?.length && (
                      <div className="p-6 text-center text-xs text-char-soft">
                        نتیجه‌ای پیدا نشد.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Account */}
            {loading ? (
              <div className="flex h-9 w-9 items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-char-soft" />
              </div>
            ) : isAuthenticated && user ? (
              <AccountMenu user={user} isAdmin={isAdmin} loading={loading} onLogout={logout} />
            ) : (
              <Button
                variant="outline"
                onClick={() => router.push("/auth")}
                className="
                  h-9
                  rounded-lg
                  border-char/10
                  bg-transparent
                  px-3.5
                  text-xs
                  font-medium
                  transition-colors
                  hover:bg-char/5
                  dark:border-white/10
                  dark:hover:bg-white/5
                "
              >
                ورود / ثبت‌نام
              </Button>
            )}

            {/* Cart ONLY — Wishlist removed from header */}
            <Link
              href="/cart"
              aria-label="سبد خرید"
              className="
                relative
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-lg
                text-char-soft
                transition-colors
                hover:bg-char/5
                hover:text-char
                dark:hover:bg-white/5
                dark:hover:text-white
              "
              onClick={() => setSearchOpen(false)}
            >
              <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.8} />

              {count > 0 && (
                <span
                  className="
                    absolute
                    -right-0.5
                    -top-0.5
                    flex
                    h-4
                    min-w-4
                    items-center
                    justify-center
                    rounded-full
                    bg-lajvard
                    px-1
                    text-[9px]
                    font-bold
                    text-white
                    ring-2
                    ring-slip
                  "
                >
                  {count}
                </span>
              )}
            </Link>

            {/* Theme */}
            <ThemeToggle />

            {/* Admin removed from main header.
                It now exists only inside account menu. */}
          </div>

          {/* Theme toggle — always visible */}
          <div className="shrink-0 lg:hidden">
            <ThemeToggle />
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      <div
        className={`
          fixed
          inset-0
          z-50
          transition-opacity
          ${mobileMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}
        `}
      >
        {/* Overlay */}
        <button
          type="button"
          className={`
            fixed
            inset-0
            bg-black/50
            backdrop-blur-sm
            transition-opacity
            ${mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"}
          `}
          onClick={() => setMobileMenuOpen(false)}
          aria-label="بستن منو"
        />

        {/* Drawer */}
        <aside
          className={`
            fixed
            inset-y-0
            right-0
            z-50
            w-[300px]
            max-w-[88vw]
            transform
            bg-slip
            shadow-2xl
            transition-transform
            duration-200
            ease-out
            dark:bg-[#1c1a18]
            ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}
          `}
          role="dialog"
          aria-modal="true"
          aria-label="منوی موبایل"
        >
          {/* Drawer header */}
          <div
            className="
              flex
              h-14
              items-center
              justify-between
              border-b
              border-char/10
              px-4
              dark:border-white/10
            "
          >
            <span className="text-sm font-semibold">منو</span>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-lg
                text-char-soft
                hover:bg-char/5
                dark:hover:bg-white/5
              "
              aria-label="بستن منو"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex h-[calc(100%-56px)] flex-col">
            <nav className="flex-1 overflow-y-auto p-3">
              <div className="space-y-0.5">
                {NAV.map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => handleMobileNavigation(item.href)}
                    className="
                      flex
                      h-10
                      w-full
                      items-center
                      rounded-lg
                      px-3
                      text-right
                      text-sm
                      font-medium
                      transition-colors
                      hover:bg-char/5
                      hover:text-lajvard
                      dark:hover:bg-white/5
                    "
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="my-4 h-px bg-char/10 dark:bg-white/10" />

              {/* Mobile theme toggle */}
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm font-medium">حالت نمایش</span>
                <ThemeToggle />
              </div>

              <div className="my-4 h-px bg-char/10 dark:bg-white/10" />

              {/* Mobile account */}
              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-char-soft" />
                </div>
              ) : isAuthenticated && user ? (
                <div className="space-y-0.5">
                  <p className="px-3 pb-2 text-[11px] font-medium text-char-soft">حساب کاربری</p>

                  {ACCOUNT_ROUTES.map((route) => {
                    const Icon = route.icon;

                    return (
                      <button
                        key={route.href}
                        type="button"
                        onClick={() => handleMobileNavigation(route.href)}
                        className="
                          flex
                          h-10
                          w-full
                          items-center
                          gap-2.5
                          rounded-lg
                          px-3
                          text-right
                          text-sm
                          transition-colors
                          hover:bg-char/5
                          hover:text-lajvard
                          dark:hover:bg-white/5
                        "
                      >
                        <Icon className="h-[17px] w-[17px] text-char-soft" strokeWidth={1.8} />

                        {route.label}
                      </button>
                    );
                  })}

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleMobileNavigation("/admin/dashboard")}
                      className="
                        flex
                        h-10
                        w-full
                        items-center
                        gap-2.5
                        rounded-lg
                        px-3
                        text-right
                        text-sm
                        font-medium
                        text-lajvard
                        transition-colors
                        hover:bg-lajvard/10
                      "
                    >
                      <LayoutDashboard className="h-[17px] w-[17px]" strokeWidth={1.8} />
                      مدیریت فروشگاه
                    </button>
                  )}
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push("/auth");
                  }}
                  className="
                    h-10
                    w-full
                    rounded-lg
                    text-sm
                    font-medium
                  "
                >
                  ورود / ثبت‌نام
                </Button>
              )}
            </nav>

            {/* Mobile logout */}
            {isAuthenticated && user && (
              <div
                className="
                  border-t
                  border-char/10
                  p-3
                  dark:border-white/10
                "
              >
                <button
                  type="button"
                  onClick={handleMobileLogout}
                  className="
                    flex
                    h-10
                    w-full
                    items-center
                    gap-2.5
                    rounded-lg
                    px-3
                    text-sm
                    text-red-500
                    transition-colors
                    hover:bg-red-500/10
                  "
                >
                  <LogOut className="h-[17px] w-[17px]" strokeWidth={1.8} />
                  خروج از حساب
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
