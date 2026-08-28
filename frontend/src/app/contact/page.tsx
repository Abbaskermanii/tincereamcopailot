"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // MVP: no backend mailbox yet; acknowledge locally.
    setSent(true);
    toast("پیام شما ذخیره شد؛ به‌زودی پاسخ می‌دهیم.");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 md:px-6">
      <h1 className="text-3xl font-extrabold md:text-4xl">تماس با ما</h1>
      <p className="mt-4 leading-8 text-char-soft dark:text-ink-soft">
        سفارش سفارشی، عمده‌فروشی یا فقط سلام؟ خوشحال می‌شویم بشنویم.
      </p>

      <dl className="mt-8 grid gap-4 rounded-wobble bg-surface p-6 text-sm shadow-shelf sm:grid-cols-2 dark:bg-black/25">
        <div>
          <dt className="font-bold">ساعات کارگاه</dt>
          <dd className="mt-1 text-char-soft dark:text-ink-soft">شنبه تا چهارشنبه، ۹ تا ۱۷</dd>
        </div>
        <div>
          <dt className="font-bold">نشانی</dt>
          <dd className="mt-1 leading-7 text-char-soft dark:text-ink-soft">
            اصفهان، خیابان مشتاق دوم، کارگاه تن‌سِرام
          </dd>
        </div>
        <div>
          <dt className="font-bold">تلفن</dt>
          <dd className="num-latin mt-1" dir="ltr">031-3663-0000</dd>
        </div>
        <div>
          <dt className="font-bold">ایمیل</dt>
          <dd className="num-latin mt-1" dir="ltr">hello@tinceram.ir</dd>
        </div>
      </dl>

      {sent ? (
        <p role="status" className="mt-8 rounded-wobble bg-firouzeh/15 p-5 font-medium">
          پیام شما رسید؛ معمولاً ظرف یک روز کاری پاسخ می‌دهیم.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4">
          <Field label="نام" required>
            <Input name="name" required />
          </Field>
          <Field label="ایمیل" required>
            <Input name="email" type="email" required dir="ltr" />
          </Field>
          <Field label="پیام" required>
            <Textarea name="message" required minLength={10} />
          </Field>
          <Button type="submit">ارسال پیام</Button>
        </form>
      )}
    </div>
  );
}
