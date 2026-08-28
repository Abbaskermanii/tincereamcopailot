import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/cart",
          "/checkout",
          "/admin",
          "/api/",
          "/order/",
          "/track",
          "/wishlist",
          "/style-guide",
          "/admin-analytics",
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
