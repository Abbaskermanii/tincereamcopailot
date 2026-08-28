import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "تن‌سِرام — سفال و سرامیک دست‌ساز",
    short_name: "تن‌سِرام",
    description: "فروشگاه اینترنتی سفال و سرامیک دست‌ساز ایرانی",
    start_url: "/",
    display: "standalone",
    background_color: "#EDEAE3",
    theme_color: "#31547A",
    lang: "fa-IR",
    dir: "rtl",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
