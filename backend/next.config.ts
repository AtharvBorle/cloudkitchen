import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: process.cwd(),
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/api/explore", destination: "/api/public/explore" },
      { source: "/explore", destination: "/api/public/explore" },
      { source: "/api/promo-banners", destination: "/api/public/promo-banners" },
      { source: "/promo-banners", destination: "/api/public/promo-banners" },
      { source: "/api/categories", destination: "/api/public/categories" },
      { source: "/categories", destination: "/api/public/categories" },
      { source: "/api/meal-plans", destination: "/api/public/meal-plans" },
      { source: "/meal-plans", destination: "/api/public/meal-plans" },
      { source: "/api/search", destination: "/api/public/search" },
      { source: "/search", destination: "/api/public/search" },
    ];
  },
};

export default nextConfig;
