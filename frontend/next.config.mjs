/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
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
};

export default nextConfig;
