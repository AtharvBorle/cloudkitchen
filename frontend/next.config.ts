import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.*",
    "192.168.*.*",
    "10.*",
    "172.16.*",
    "*.loca.lt",
  ],
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: process.cwd(),
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:5000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl.replace(/\/$/, "")}/api/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/business-information",
        destination: "/seller/business-information",
        permanent: true,
      },
      {
        source: "/business-informaiton",
        destination: "/seller/business-information",
        permanent: true,
      },
      {
        source: "/account-information",
        destination: "/seller/account-information",
        permanent: true,
      },
      {
        source: "/legal-documents",
        destination: "/seller/legal-documents",
        permanent: true,
      },
      {
        source: "/media-gallery",
        destination: "/seller/media-gallery",
        permanent: true,
      },
      {
        source: "/confirm-registration",
        destination: "/seller/confirm-registration",
        permanent: true,
      },
      {
        source: "/confirm-information",
        destination: "/seller/confirm-registration",
        permanent: true,
      },
      {
        source: "/faq",
        destination: "/support",
        permanent: true,
      },
      {
        source: "/tc",
        destination: "/terms",
        permanent: true,
      },
      {
        source: "/terms-and-conditions",
        destination: "/terms",
        permanent: true,
      },
      {
        source: "/dashboard/seller",
        destination: "/seller/dashboard",
        permanent: true,
      },
      {
        source: "/dashboard/seller/orders",
        destination: "/seller/orders",
        permanent: true,
      },
      {
        source: "/dashboard/seller/menu",
        destination: "/seller/menu",
        permanent: true,
      },
      {
        source: "/dashboard/seller/edit-menu",
        destination: "/seller/edit-menu",
        permanent: true,
      },
      {
        source: "/dashboard/seller/inventory",
        destination: "/seller/menu",
        permanent: true,
      },
      {
        source: "/dashboard/seller/rooms",
        destination: "/seller/rooms",
        permanent: true,
      },
      {
        source: "/dashboard/seller/bookings",
        destination: "/seller/booking",
        permanent: true,
      },
      {
        source: "/dashboard/seller/delivery",
        destination: "/seller/delivery",
        permanent: true,
      },
      {
        source: "/dashboard/seller/profile",
        destination: "/seller/profile",
        permanent: true,
      },
      {
        source: "/dashboard/seller/offers/:path*",
        destination: "/seller/offers/:path*",
        permanent: true,
      },
      {
        source: "/dashboard/seller/offers",
        destination: "/seller/offers",
        permanent: true,
      },
      {
        source: "/dashboard/seller/reviews",
        destination: "/seller/reviews",
        permanent: true,
      },
      {
        source: "/dashboard/seller/support",
        destination: "/seller/support",
        permanent: true,
      },
      {
        source: "/dashboard/seller/revision",
        destination: "/seller/revision",
        permanent: true,
      },
      {
        source: "/dashboard/seller/payment",
        destination: "/seller/payment",
        permanent: true,
      },
      {
        source: "/dashboard/seller/create-subscription-plan",
        destination: "/seller/create-subscription-plan",
        permanent: true,
      },
      {
        source: "/dashboard/seller/subscription",
        destination: "/seller/subscription",
        permanent: true,
      },
      {
        source: "/dashboard/seller/subscription/:path*",
        destination: "/seller/subscription/:path*",
        permanent: true,
      },
      {
        source: "/seller/subscription/edit-plan",
        destination: "/seller/subscription/edit",
        permanent: true,
      },
      {
        source: "/seller/create-subscription",
        destination: "/seller/subscription/add",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
