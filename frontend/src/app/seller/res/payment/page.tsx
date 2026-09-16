"use client";

import React, { Suspense } from "react";
import ResponsiveSellerPayment from "@/components/seller/seller-payment/responsive/ResponsiveSellerPayment";

export default function ResponsiveSellerPaymentPage() {
  return (
    <Suspense fallback={<div style={{ padding: "30px", textAlign: "center" }}>Loading payment options...</div>}>
      <ResponsiveSellerPayment />
    </Suspense>
  );
}
