"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import { useAuth } from "@/lib/auth-context";
import { Suspense } from "react";

type Mode = "login" | "register" | "otp" | "reset_request" | "reset_confirm";

function AuthInner() {
  const router = useRouter();
  const params = useSearchParams();
  const initialToken = params.get("token");
  const { refresh } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>(initialToken ? "reset_confirm" : "login");
  const [form, setForm] = useState({ email: "", password: "", full_name: "", phone: "", otp_code: "", new_password: "", reset_token: initialToken ?? "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (initialToken) setForm((p) => ({ ...p, reset_token: initialToken }));
  }, [initialToken]);

  async function handleAuth(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const { apiFetch } = await import("@/lib/api-client");
      let path = "";
      let body: unknown = {};
      if (mode === "register") {
        path = `/auth/register`;
        body = { email: form.email, password: form.password, full_name: form.full_name, phone: form.phone || undefined };
      } else if (mode === "login") {
        path = `/auth/login`;
        body = { email: form.email, password: form.password };
      }
      const res = await apiFetch(path, { method: "POST", body: JSON.stringify(body),         _noDedup: true, _noCache: true } as RequestInit);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = Array.isArray(data.detail) ? data.detail.map((d: { msg: string }) => d.msg).join("، ") : data.detail || "ورود انجام نشد.";
        throw new Error(typeof msg === "string" ? msg : "خطا");
      }
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      window.dispatchEvent(new Event("auth-changed"));
      await refresh();
      toast("با موفقیت وارد شدید.", "success");
      router.push("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ارتباط با سرور برقرار نشد.");
    } finally {
      setLoading(false);
    }
  }

  async function requestOtp(e: FormEvent) {
    e.preventDefault();
    if (!/^09\d{9}$/.test(form.phone) || loading) return;
    setLoading(true); setError("");
    try {
      const { apiFetch } = await import("@/lib/api-client");
      const res = await apiFetch(`/auth/otp/request`, { method: "POST", body: JSON.stringify({ phone: form.phone }),         _noDedup: true, _noCache: true } as RequestInit);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "ارسال کد ناموفق بود.");
      setOtpSent(true);
      toast(data.debug_code ? `کد (تست): ${data.debug_code}` : "کد ورود ارسال شد.", "success");
    } catch (err) { setError(err instanceof Error ? err.message : "خطا"); }
    finally { setLoading(false); }
  }

  async function verifyOtp(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true); setError("");
    try {
      const { apiFetch } = await import("@/lib/api-client");
      const res = await apiFetch(`/auth/otp/verify`, { method: "POST", body: JSON.stringify({ phone: form.phone, code: form.otp_code, full_name: form.full_name }),         _noDedup: true, _noCache: true } as RequestInit);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "کد نامعتبر است.");
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      window.dispatchEvent(new Event("auth-changed"));
      await refresh();
      toast("ورود با رمز یک‌بار مصرف انجام شد.", "success");
      router.push("/account");
    } catch (err) { setError(err instanceof Error ? err.message : "خطا"); }
    finally { setLoading(false); }
  }

  async function requestReset(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true); setError("");
    try {
      const { apiFetch } = await import("@/lib/api-client");
      const res = await apiFetch(`/auth/password-reset/request`, { method: "POST", body: JSON.stringify({ email: form.email }),         _noDedup: true, _noCache: true } as RequestInit);
      if (!res.ok) throw new Error("درخواست ناموفق بود.");
      toast("اگر ایمیل شما ثبت شده باشد، لینک بازنشانی ارسال شد.", "success");
    } catch (err) { setError(err instanceof Error ? err.message : "خطا"); }
    finally { setLoading(false); }
  }

  async function confirmReset(e: FormEvent) {
    e.preventDefault();
    if (form.new_password.length < 8 || loading) return;
    setLoading(true); setError("");
    try {
      const { apiFetch } = await import("@/lib/api-client");
      const res = await apiFetch(`/auth/password-reset/confirm`, { method: "POST", body: JSON.stringify({ token: form.reset_token, password: form.new_password }),         _noDedup: true, _noCache: true } as RequestInit);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "توکن نامعتبر است.");
      toast("رمز عبور با موفقیت تغییر کرد. اکنون وارد شوید.", "success");
      setMode("login");
    } catch (err) { setError(err instanceof Error ? err.message : "خطا"); }
    finally { setLoading(false); }
  }

  const tabs: { key: Mode; label: string }[] = [
    { key: "login", label: "ورود" },
    { key: "register", label: "ثبت‌نام" },
    { key: "otp", label: "ورود با رمز یک‌بار مصرف" },
  ];

  return (
    <div className="mx-auto max-w-md px-4 py-14 md:py-20">
      <div className="rounded-wobble bg-surface p-6 shadow-lifted md:p-8">
        <p className="text-sm text-ink-soft">حساب تن‌سِرام</p>
        <h1 className="mt-2 text-3xl font-extrabold">
          {mode === "login" ? "خوش آمدید" : mode === "register" ? "ساخت حساب" : mode === "otp" ? "ورود با موبایل" : mode === "reset_request" ? "فراموشی رمز عبور" : "تنظیم رمز جدید"}
        </h1>

        {/* Mode tabs — hide on reset flows */}
        {!["reset_request", "reset_confirm"].includes(mode) && (
          <div className="mt-6 flex gap-2 border-b border-char/10 pb-3 dark:border-white/10">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => { setMode(t.key); setError(""); setOtpSent(false); }}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${mode === t.key ? "bg-lajvard text-white" : "bg-char/8 hover:bg-char/12 dark:bg-white/10"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Login / Register */}
        {(mode === "login" || mode === "register") && (
          <form onSubmit={handleAuth} className="mt-6 space-y-4">
            <Field label="ایمیل">{mode === "register" && null}</Field>
            {mode === "register" && (
              <>
                <Input required placeholder="نام و نام خانوادگی" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                <Input placeholder="موبایل (اختیاری، 09…)" dir="ltr" pattern="09\d{9}" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </>
            )}
            <Input required type="email" dir="ltr" placeholder="ایمیل" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input required minLength={8} type="password" dir="ltr" placeholder="رمز عبور (حداقل ۸ کاراکتر)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            {error && <p role="alert" className="text-sm text-clay">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">{loading ? "در حال بررسی…" : mode === "register" ? "ثبت‌نام" : "ورود"}</Button>
            <button type="button" onClick={() => setMode("reset_request")} className="w-full text-center text-xs text-lajvard hover:underline dark:text-lajvard-soft">
              رمز عبور را فراموش کرده‌اید؟
            </button>
            <button type="button" onClick={() => setMode("otp")} className="w-full text-center text-xs text-char-soft hover:underline">
              ورود با رمز یک‌بار مصرف (OTP)
            </button>
          </form>
        )}

        {mode === "otp" && (
          <div className="mt-6 space-y-4">
            {!otpSent ? (
              <form onSubmit={requestOtp} className="space-y-4">
                <Field label="شماره موبایل" required>
                  <Input required dir="ltr" placeholder="09123456789" pattern="09\d{9}" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </Field>
                {error && <p role="alert" className="text-sm text-clay">{error}</p>}
                <Button type="submit" disabled={loading} className="w-full">{loading ? "در حال ارسال…" : "ارسال کد ورود"}</Button>
              </form>
            ) : (
              <form onSubmit={verifyOtp} className="space-y-4">
                <p className="text-sm">کد ۶ رقمی ارسال‌شده به {form.phone} را وارد کنید.</p>
                <Input placeholder="نام (اختیاری، برای اولین ورود)" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                <Input required dir="ltr" placeholder="کد ۶ رقمی" value={form.otp_code} onChange={(e) => setForm({ ...form, otp_code: e.target.value })} maxLength={6} />
                {error && <p role="alert" className="text-sm text-clay">{error}</p>}
                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} className="flex-1">{loading ? "…" : "تأیید و ورود"}</Button>
                  <Button type="button" variant="secondary" onClick={() => setOtpSent(false)}>بازگشت</Button>
                </div>
              </form>
            )}
          </div>
        )}

        {mode === "reset_request" && (
          <form onSubmit={requestReset} className="mt-6 space-y-4">
            <p className="text-sm leading-7 text-char-soft dark:text-ink-soft">ایمیل حساب خود را وارد کنید؛ لینک بازنشانی (اعتبار ۱ ساعت) به ایمیل شما ارسال می‌شود.</p>
            <Field label="ایمیل" required>
              <Input required type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            {error && <p role="alert" className="text-sm text-clay">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">{loading ? "…" : "ارسال لینک بازنشانی"}</Button>
            <button type="button" onClick={() => setMode("login")} className="w-full text-center text-xs text-lajvard hover:underline">بازگشت به ورود</button>
          </form>
        )}

        {mode === "reset_confirm" && (
          <form onSubmit={confirmReset} className="mt-6 space-y-4">
            <Field label="توکن بازنشانی" required>
              <Input required dir="ltr" value={form.reset_token} onChange={(e) => setForm({ ...form, reset_token: e.target.value })} placeholder="توکن از لینک ایمیل" />
            </Field>
            <Field label="رمز عبور جدید" required>
              <Input required type="password" dir="ltr" minLength={8} value={form.new_password} onChange={(e) => setForm({ ...form, new_password: e.target.value })} placeholder="حداقل ۸ کاراکتر" />
            </Field>
            {error && <p role="alert" className="text-sm text-clay">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">{loading ? "…" : "تنظیم رمز جدید"}</Button>
            <button type="button" onClick={() => setMode("login")} className="w-full text-center text-xs text-lajvard hover:underline">بازگشت به ورود</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-16"><p className="text-center text-ink-soft">در حال بارگذاری…</p></div>}>
      <AuthInner />
    </Suspense>
  );
}
