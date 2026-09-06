import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/components/ui/toast-provider";
import { SettingsProvider } from "@/lib/settings-context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StoreChrome } from "@/components/layout/store-chrome";
import { ServiceWorkerRegistrar } from "@/components/layout/service-worker-registrar";
import { ErrorBoundary } from "@/components/error-boundary";

const vazir = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazir",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "آنیمور سرام | سفال و سرامیک دست‌ساز ایرانی",
    template: "%s | آنیمور سرام",
  },
  description:
    "آنیمور سرام؛ تولیدکنندهٔ سفال و سرامیک دست‌ساز در کرج. ماگ، ادویه‌دان، شیرینی‌دان و کوزه‌های لعاب‌دست‌شده، مستقیم از کارگاه ما تا خانهٔ شما.",
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: "آنیمور سرام",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className={`${vazir.variable} font-vazir antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <SettingsProvider>
            <AuthProvider>
              <CartProvider>
                <ErrorBoundary>
                  <ToastProvider>
                    <a
                      href="#main"
                      className="sr-only focus:not-sr-only focus:absolute focus:right-4 focus:top-4 focus:z-[80] focus:rounded-xl focus:bg-lajvard focus:px-4 focus:py-2 focus:text-white"
                    >
                      پرش به محتوای اصلی
                    </a>
                    <StoreChrome header={<Header />} footer={<Footer />}>
                    {children}
                  </StoreChrome>
                    <ServiceWorkerRegistrar />
                  </ToastProvider>
                </ErrorBoundary>
              </CartProvider>
            </AuthProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}