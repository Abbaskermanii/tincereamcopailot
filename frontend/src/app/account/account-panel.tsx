"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { mediaUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import { apiFetch, authHeaders, getErrorMessage } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { UploadComponent as Upload } from "@/components/ui/upload";
import { useToast } from "@/components/ui/toast-provider";
import { faPrice } from "@/lib/format";

type Address = {
  id: string;
  title: string;
  recipient_name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  is_default: boolean;
};

type Notification = {
  id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
};

export function AccountPanel({ section = "profile" }: { section?: string }) {
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const { toast } = useToast();

  const reload = async () => {
    setLoading(true);
    setError(false);
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) {
      setError(true);
      setLoading(false);
      return;
    }
    const map: Record<string, string> = {
      orders: "/orders/me",
      addresses: "/users/me/addresses",
      wishlist: "/wishlist",
      notifications: "/notifications",
    };
    const url = map[section] ?? "/auth/me";
    try {
      const res = await apiFetch(url, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json);
      // Set avatar if available
      if (json.avatar_url) {
        setAvatarUrl(json.avatar_url);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  const nav = [
    ["profile", "پروفایل"],
    ["addresses", "نشانی‌ها"],
    ["orders", "سفارش‌ها"],
    ["wishlist", "علاقه‌مندی‌ها"],
    ["notifications", "اعلان‌ها"],
  ] as const;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6" dir="rtl">
      <div className="flex flex-wrap gap-2 border-b border-char/10 pb-4 dark:border-white/10">
        {nav.map(([key, label]) => (
          <Link
            key={key}
            href={`/account/${key}`}
            className={`rounded-full px-4 py-2 text-sm ${section === key ? "bg-lajvard text-white" : "bg-char/8 hover:bg-char/12 dark:bg-white/10"}`}
          >
            {label}
          </Link>
        ))}
      </div>
      <h1 className="mt-9 text-3xl font-extrabold">
        {section === "profile" ? "پروفایل من" : section === "addresses" ? "نشانی‌های من" : section === "orders" ? "سفارش‌های من" : section === "notifications" ? "اعلان‌ها" : "علاقه‌مندی‌ها"}
      </h1>
      {error ? (
        <p className="mt-6 rounded-2xl bg-kiln-clay/15 p-5">
          برای مشاهده‌ی این بخش وارد حساب شوید. <Link href="/auth" className="underline">ورود / ثبت‌نام</Link>
        </p>
      ) : loading ? (
        <p className="mt-6 text-ink-soft">در حال بارگذاری…</p>
      ) : section === "profile" ? (
        <ProfileView data={data as { email: string; full_name: string; phone: string | null; avatar_url: string | null }} avatarUrl={avatarUrl} toast={toast} />
      ) : section === "addresses" ? (
        <AddressesView data={data as Address[]} reload={reload} toast={toast} />
      ) : section === "orders" ? (
        <OrdersView data={data as Array<{ id: string; order_number: string; status: string; total_amount: number; created_at: string }>} />
      ) : section === "notifications" ? (
        <NotificationsView data={data as Notification[]} reload={reload} toast={toast} />
      ) : (
        <WishlistView data={data as Array<{ id: string; name: string; slug: string; price: number; primary_image_url: string | null; images?: Array<{ url: string; is_primary: boolean }> }>} />
      )}
    </div>
  );
}

function ProfileView({ data, toast, avatarUrl }: { data: { email: string; full_name: string; phone: string | null; avatar_url: string | null }; avatarUrl: string | null; toast: ReturnType<typeof useToast>["toast"] }) {
  const [fullName, setFullName] = useState(data.full_name || "");
  const [phone, setPhone] = useState(data.phone || "");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const body: Record<string, string> = {};
    if (fullName !== data.full_name) body.full_name = fullName;
    if (phone !== (data.phone || "")) body.phone = phone;
    if (newPw) {
      body.password = newPw;
      body.current_password = currentPw;
    }
    if (avatarFile) {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", avatarFile);
      try {
        const res = await apiFetch("/avatar/upload", { method: "POST", headers: authHeaders(true), body: formData });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j.detail || j.message || " آپلود تصویر شکست خورد");
        setAvatarUrl(j.url);
        toast("آواتار آپلود شد.", "success");
      } catch (err) {
        toast(getErrorMessage(err), "error");
      } finally {
        setUploading(false);
      }
    }
    if (Object.keys(body).length === 0 && !avatarFile) {
      toast("تغییری برای ذخیره وجود ندارد.", "error");
      setSaving(false);
      return;
    }
    try {
      const res = await apiFetch("/users/me", { method: "PATCH", headers: authHeaders(true), body: JSON.stringify(body) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.detail || j.message || "ذخیره ناموفق");
      toast("پروفایل به‌روز شد.", "success");
      setCurrentPw("");
      setNewPw("");
    } catch (err) {
      toast(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-2xl bg-surface p-6 shadow-shelf dark:bg-black/25">
        <p className="text-sm text-char-soft">ایمیل</p>
        <p className="font-medium" dir="ltr">{data.email}</p>
        <p className="mt-4 text-sm text-char-soft">نام</p>
        <p className="font-medium">{data.full_name || "—"}</p>
        {data.phone && <><p className="mt-4 text-sm text-char-soft">موبایل</p><p dir="ltr" className="font-medium">{data.phone}</p></>}
        {/* Avatar display with fallback to initials */}
        <div className="mt-4 flex items-center gap-3">
          <div className={cn("h-16 w-16 rounded-full flex items-center justify-center flex-shrink-0", avatarUrl ? "" : "bg-lajvard text-white text-xl")}>
            {avatarUrl ? (
              <Image src={avatarUrl} alt="avatar" fill className="object-cover" />
            ) : (
              <span className="">{fullName ? fullName[0] + fullName.slice(-1)[0] : "?"}</span>
            )}
          </div>
          <div>
            <p className="font-medium">{fullName || "—"}</p>
            <p className="text-xs text-char-soft">برای تغییر آواتار روی 이미เจک کلیک کنید</p>
          </div>
        </div>
      </div>
      <form onSubmit={save} className="grid gap-4 rounded-2xl bg-surface p-6 shadow-shelf dark:bg-black/25">
        <Field label="نام کامل"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
        <Field label="موبایل"><Input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" pattern="09\d{9}" placeholder="09123456789" /></Field>
        <Upload
          accept="image/*"
          onFileChange={(file) => setAvatarFile(file)}
          disabled={uploading}
          className="mt-4"
          placeholder="آپلود عکس آواتار (حداقل ۲ مگابایت)"
        />
        <div className="border-t border-char/10 pt-4 dark:border-white/10">
          <p className="mb-3 font-bold">تغییر رمز عبور</p>
          <Field label="رمز فعلی"><Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} dir="ltr" /></Field>
          <Field label="رمز جدید (حداقل 8 کاراکتر)"><Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} dir="ltr" /></Field>
          <p className="mt-2 text-xs text-char-soft">برای تغییر رمز، هر دو فیلد را پر کنید.</p>
        </div>
        <Button type="submit" disabled={saving || uploading}>{saving || uploading ? "در حال ذخیره…" : "ذخیره تغییرات"}</Button>
      </form>
    </div>
  );
}

function AddressesView({ data, reload, toast }: { data: Address[]; reload: () => void; toast: ReturnType<typeof useToast>["toast"] }) {
  const [editing, setEditing] = useState<Address | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Address>>({ title: "", recipient_name: "", phone: "", address: "", city: "", province: "", postal_code: "", is_default: false });
  const [saving, setSaving] = useState(false);

  const startCreate = () => { setEditing(null); setForm({ title: "", recipient_name: "", phone: "", address: "", city: "", province: "", postal_code: "", is_default: false }); setShowForm(true); };
  const startEdit = (a: Address) => { setEditing(a); setForm({ ...a }); setShowForm(true); };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.recipient_name || !form.phone || !form.address || !form.city || !form.province || !form.postal_code) {
      toast("تمام فیلدهای ستاره‌دار را پر کنید.", "error"); return;
    }
    setSaving(true);
    try {
      const isEdit = Boolean(editing?.id);
      const url = isEdit ? `/users/me/addresses/${editing!.id}` : "/users/me/addresses";
      const method = isEdit ? "PATCH" : "POST";
      const res = await apiFetch(url, { method, headers: authHeaders(true), body: JSON.stringify(form) });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.detail || "ذخیره ناموفق");
      }
      toast(isEdit ? "نشانی به‌روز شد." : "نشانی افزوده شد.", "success");
      setShowForm(false); setEditing(null);
      void reload();
    } catch (err) { toast(getErrorMessage(err), "error"); }
    finally { setSaving(false); }
  }

  // delete helper uses correct endpoint DELETE /auth/addresses/{id}
  async function doDelete(id: string) {
    if (!confirm("این نشانی حذف شود؟")) return;
    try {
      const res = await apiFetch(`/auth/addresses/${id}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.detail || "حذف ناموفق");
      }
      toast("نشانی حذف شد.", "success");
      void reload();
    } catch (err) { toast(getErrorMessage(err), "error"); }
  }

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-char-soft dark:text-ink-soft">{data.length} نشانی ثبت شده</p>
        <Button onClick={startCreate}>افزودن نشانی</Button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="mt-6 grid gap-4 rounded-2xl bg-surface p-6 shadow-shelf dark:bg-black/25">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="عنوان (مثلاً خانه)" ><Input value={String(form.title ?? "")} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="خانه" /></Field>
            <Field label="نام گیرنده *" required><Input required value={String(form.recipient_name ?? "")} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} /></Field>
            <Field label="موبایل گیرنده *" required><Input required dir="ltr" pattern="09\d{9}" value={String(form.phone ?? "")} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="09123456789" /></Field>
            <Field label="کد پستی *" required><Input required dir="ltr" pattern="\d{10}" value={String(form.postal_code ?? "")} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} placeholder="10 رقم" /></Field>
            <Field label="استان *" required><Input required value={String(form.province ?? "")} onChange={(e) => setForm({ ...form, province: e.target.value })} /></Field>
            <Field label="شهر *" required><Input required value={String(form.city ?? "")} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
          </div>
          <Field label="نشانی کامل *" required><Textarea required value={String(form.address ?? "")} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="خیابان، پلاک، واحد…" /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.is_default)} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} /> پیش‌فرض</label>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? "…" : editing ? "به‌روزرسانی" : "ثبت نشانی"}</Button>
            <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditing(null); }}>انصراف</Button>
          </div>
        </form>
      )}

      {data.length === 0 && !showForm ? (
        <p className="mt-6 rounded-2xl bg-surface p-6 text-center text-ink-soft dark:bg-black/25">هنوز نشانی ثبت نکرده‌اید. با «افزودن نشانی» شروع کنید.</p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {data.map((a) => (
            <div key={a.id} className="rounded-2xl bg-surface p-5 shadow-shelf dark:bg-black/25">
              <div className="flex items-start justify-between">
                <p className="font-bold">{a.title || a.recipient_name} {a.is_default && <span className="mr-2 rounded-full bg-firouzeh/15 px-2 py-0.5 text-xs">پیش‌فرض</span>}</p>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(a)} className="text-xs underline">ویرایش</button>
                  <button onClick={() => void doDelete(a.id)} className="text-xs text-clay underline">حذف</button>
                </div>
              </div>
              <p className="mt-2 text-sm leading-7 text-char-soft dark:text-ink-soft">{a.address} — {a.city}، {a.province} — {a.postal_code}</p>
              <p className="mt-1 text-xs" dir="ltr">{a.phone} — {a.recipient_name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OrdersView({ data }: { data: Array<{ id: string; order_number: string; status: string; total_amount: number; created_at: string }> }) {
  if (!Array.isArray(data) || data.length === 0) return <p className="mt-6 rounded-2xl bg-surface p-6 text-ink-soft dark:bg-black/25">هنوز سفارشی ثبت نکرده‌اید.</p>;
  const statusLabel: Record<string, string> = { pending: "در انتظار پرداخت", paid: "پرداخت شده", processing: "در حال آماده‌سازی", shipped: "ارسال شده", delivered: "تحویل شده", cancelled: "لغو شده" };
  return (
    <div className="mt-6 space-y-3">
      {data.map((o) => (
        <Link key={o.id} href={`/order/tracking/${o.order_number}`} className="flex items-center justify-between rounded-2xl bg-surface p-4 shadow-shelf hover:bg-char/5 dark:bg-black/25">
          <div>
            <p className="font-mono text-sm" dir="ltr">{o.order_number}</p>
            <p className="text-xs text-char-soft">{new Date(o.created_at).toLocaleDateString("fa-IR")} — {new Date(o.created_at).toLocaleTimeString("fa-IR")}</p>
          </div>
          <div className="text-left">
            <p className="text-sm font-bold">{faPrice(Number(o.total_amount))}</p>
            <span className={`rounded-full px-2 py-0.5 text-xs ${o.status === "cancelled" ? "bg-clay/15 text-clay" : o.status === "delivered" ? "bg-firouzeh/15 text-firouzeh" : "bg-char/10 dark:bg-white/10"}`}>{statusLabel[o.status] ?? o.status}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function NotificationsView({ data, reload, toast }: { data: Notification[]; reload: () => void; toast: ReturnType<typeof useToast>["toast"] }) {
  async function markRead(id: string) {
    try {
      const res = await apiFetch(`/notifications/${id}/read`, { method: "POST", headers: authHeaders() });
      if (!res.ok) throw new Error();
      toast("خوانده شد.", "success");
      void reload();
    } catch { toast("خطا در به‌روزرسانی", "error"); }
  }
  if (!Array.isArray(data) || data.length === 0) return <p className="mt-6 rounded-2xl bg-surface p-6 text-center text-ink-soft dark:bg-black/25">اعلانی ندارید.</p>;
  const unread = data.filter((n) => !n.is_read).length;
  return (
    <div className="mt-6 space-y-3">
      {unread > 0 && <p className="text-sm font-medium text-lajvard dark:text-lajvard-soft">{unread} اعلان خوانده‌نشده دارید.</p>}
      {data.map((n) => (
        <div key={n.id} className={`rounded-2xl p-4 shadow-shelf ${n.is_read ? "bg-surface" : "bg-lajvard/10 dark:bg-lajvard-soft/10 border border-lajvard/20"}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-bold text-sm">{n.title}</p>
              {n.body && <p className="mt-1 text-sm leading-7 text-char-soft dark:text-ink-soft">{n.body}</p>}
              <p className="mt-2 text-xs text-char-soft dark:text-ink-soft">{new Date(n.created_at).toLocaleDateString("fa-IR")}</p>
            </div>
            {!n.is_read && <Button size="sm" variant="secondary" onClick={() => void markRead(n.id)}>خواندم</Button>}
          </div>
        </div>
      ))}
    </div>
  );
}

function WishlistView({ data }: { data: Array<{ id: string; name: string; slug: string; price: number; primary_image_url: string | null; images?: Array<{ url: string; is_primary: boolean }> }> }) {
  if (!Array.isArray(data) || data.length === 0) return <p className="mt-6 rounded-2xl bg-surface p-6 text-ink-soft dark:bg-black/25">علاقه‌مندی خالی است.</p>;
  return (
    <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
      {data.map((p) => {
        const img = p.primary_image_url ?? p.images?.find((i) => i.is_primary)?.url ?? null;
        return (
          <Link key={p.id} href={`/product/${p.slug}`} className="overflow-hidden rounded-2xl bg-surface shadow-shelf dark:bg-black/25">
            <div className="relative aspect-square bg-slip dark:bg-surface">{img && <Image src={mediaUrl(img)} alt={p.name} fill className="object-cover" />}</div>
            <div className="p-3"><p className="line-clamp-1 text-sm font-medium">{p.name}</p><p className="text-xs text-char-soft">{faPrice(Number(p.price))}</p></div>
          </Link>
        );
      })}
    </div>
  );
}
