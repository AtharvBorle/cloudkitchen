import type { Metadata } from "next";
import React, { Suspense } from "react";
import { ResSellerLogin } from "@/components/seller";

export const metadata: Metadata = {
  title: "Owner Login (Mobile) | Neo Cloud Bite",
  description: "Mobile login portal for Neo Cloud Kitchen sellers and owners.",
};

export default function ResponsiveSellerLoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "#FFFBF7" }} />}>
      <ResSellerLogin />
    </Suspense>
  );
}
