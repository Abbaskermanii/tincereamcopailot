"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <html lang="fa" dir="rtl">
      <body style={{ fontFamily: "Tahoma, sans-serif", background: "#F6F4EF", color: "#26221F", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, margin: 0, textAlign: "center" }}>
        <h2 style={{ fontSize: 20, fontWeight: 800 }}>خطای غیرمنتظره</h2>
        <p style={{ fontSize: 14 }}>مشکلی در اجرای برنامه رخ داد. لطفاً دوباره تلاش کنید.</p>
        {error?.digest && <p style={{ fontSize: 12, opacity: 0.6 }}>کد خطا: {error.digest}</p>}
        <button onClick={() => reset()} style={{ padding: "12px 24px", borderRadius: 12, border: 0, background: "#31547A", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>تلاش مجدد</button>
      </body>
    </html>
  );
}
