import type { Metadata } from "next";
import { CmsPage } from "@/components/cms/cms-page";

export const metadata: Metadata = { title: "شرایط استفاده", description: "شرایط و قوانین استفاده از فروشگاه آنیمور سرام." };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <CmsPage
        slug="terms"
        fallbackTitle="شرایط استفاده"
        fallbackContent={
          <>
            <p>استفاده از فروشگاه آنیمور سرام به معنی پذیرش شرایط زیر است. اطلاعات سفارش را پیش از پرداخت بررسی کنید.</p>
            <h2>سفارش و پرداخت</h2>
            <p>قیمت‌ها به تومان هستند و ثبت سفارش پس از تأیید پرداخت نهایی می‌شود.</p>
            <h2>مالکیت محتوا</h2>
            <p>تصاویر، متن‌ها و نشان تجاری آنیمور سرام متعلق به این مجموعه است و استفاده‌ی تجاری بدون اجازه مجاز نیست.</p>
          </>
        }
      />
    </div>
  );
}
