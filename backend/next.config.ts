import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  typescript: {
    ignoreBuildErrors: true,
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
