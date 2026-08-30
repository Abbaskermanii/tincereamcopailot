import path from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    // Pin build-trace file tracing to the frontend dir. Without this, Next may
    // infer the workspace root (repo root) and crash on Windows at
    // "Collecting page data"/"Finalizing page optimization" with
    // ENOENT .next\server\pages\_error.js.nft.json (monorepo + standalone).
    outputFileTracingRoot: path.resolve(fileURLToPath(new URL(".", import.meta.url))),
  },
  images: {
    formats: ["image/avif", "image/webp"],
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
  // Security headers
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
        },
        // HSTS only in production (enable when HTTPS is confirmed)
        // { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      ],
    },
    {
      // Allow Next.js Image Optimization and API routes
      source: "/_next/static/(.*)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
  ],
};

export default nextConfig;
