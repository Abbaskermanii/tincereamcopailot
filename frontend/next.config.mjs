/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    // Proxy API + media through the frontend origin so relative media URLs
    // (stored as /api/v1/media/...) resolve everywhere, including rich-text HTML.
    const apiBase =
      process.env.INTERNAL_API_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      "http://localhost:8000/api/v1";
    const origin = apiBase.replace(/\/api\/v1\/?$/, "");
    return [{ source: "/api/v1/:path*", destination: `${origin}/api/v1/:path*` }];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Seed/media images include SVGs — allow optimizer with hardening per Next docs
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // H11/Performance: no wildcard hostname — explicitly allow only trusted hosts
    remotePatterns: [
      { protocol: "https", hostname: "**.tinceram.ir" },
      { protocol: "https", hostname: "**.tinceram.com" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
      { protocol: "http", hostname: "backend" },
      { protocol: "http", hostname: "minio" },
    ],
  },
};

export default nextConfig;
