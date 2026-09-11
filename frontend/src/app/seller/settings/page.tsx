import React, { Suspense } from "react";
import type { Metadata } from "next";
import { SettingsCanvasDas, SellerResponsiveWrapper } from "@/components/seller";
import ResponsiveSellerSettingsPage from "@/app/seller/res/settings/page";

export const metadata: Metadata = {
  title: "Settings | Neo Cloud Kitchen",
  description: "Manage your account preferences, notifications, and application settings.",
};

export default function SellerSettingsPage() {
  return (
    <Suspense fallback={<div style={{ padding: "32px", color: "#64748B" }}>Loading settings...</div>}>
      <SellerResponsiveWrapper
        desktop={<SettingsCanvasDas />}
        mobile={<ResponsiveSellerSettingsPage />}
      />
    </Suspense>
  );
}

