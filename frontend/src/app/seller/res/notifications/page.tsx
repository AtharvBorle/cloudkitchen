"use client";

import React, { Suspense } from "react";
import ResponsiveSellerNotifications from "@/components/seller/seller-notifications/responsive/ResponsiveSellerNotifications";

export default function ResponsiveSellerNotificationsPage() {
  return (
    <Suspense fallback={<div>Loading notifications...</div>}>
      <ResponsiveSellerNotifications />
    </Suspense>
  );
}
