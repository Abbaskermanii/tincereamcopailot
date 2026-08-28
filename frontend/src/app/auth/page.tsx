"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_URL } from "@/lib/api";

export default function AuthPage() {
  const router = useRouter();
  const [register, setRegister] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/${register ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(register ? form : { email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "ورود انجام نشد.");
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      router.push("/account");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ارتباط با سرور برقرار نشد.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 md:py-24">
      <div className="rounded-wobble bg-surface p-6 shadow-lifted md:p-8">
        <p className="text-sm text-ink-soft">حساب تن‌سِرام</p>
        <h1 className="mt-2 text-3xl font-extrabold">{register ? "ساخت حساب" : "خوش آمدید"}</h1>
        <form onSubmit={submit} className="mt-8 space-y-4">
          {register && <Input required placeholder="نام و نام خانوادگی" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />}
          <Input required type="email" dir="ltr" placeholder="ایمیل" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input required minLength={8} type="password" dir="ltr" placeholder="رمز عبور (حداقل ۸ کاراکتر)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {error && <p role="alert" className="text-sm text-clay">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">{loading ? "در حال بررسی…" : register ? "ثبت‌نام" : "ورود"}</Button>
        </form>
        <button type="button" onClick={() => { setRegister(!register); setError(""); }} className="mt-5 w-full text-center text-sm text-lajvard hover:underline dark:text-lajvard-soft">
          {register ? "قبلاً حساب دارید؟ ورود" : "حساب ندارید؟ ثبت‌نام کنید"}
        </button>
      </div>
    </div>
  );
}
