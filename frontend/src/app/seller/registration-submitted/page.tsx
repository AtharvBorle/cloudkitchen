"use client";

import React from "react";
import {
  SellerLayout,
  RegistrationSubmitted,
} from "@/components/seller";

export default function RegistrationSubmittedPage() {
  return (
    <SellerLayout
      activeSidebarItem="registration"
      pageTitle="Neo Cloud Room Onboarding"
      userName="John Doe"
      userRole="Owner Account"
      userInitials="JD"
      hideMobileHeader={true}
    >
      {/* Registration Submitted Information Box (Navbar & Sidebar only) */}
      <RegistrationSubmitted trackingId="REG-2026-8942" />
    </SellerLayout>
  );
}
