import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, Cookie, X-Requested-With, Accept, Origin, Cache-Control, Pragma, X-CSRF-Token, X-Api-Version, Range, Baggage, Sentry-Trace, *" },
          { key: "Access-Control-Expose-Headers", value: "*" },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, Cookie, X-Requested-With, Accept, Origin, Cache-Control, Pragma, X-CSRF-Token, X-Api-Version, Range, Baggage, Sentry-Trace, *" },
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
