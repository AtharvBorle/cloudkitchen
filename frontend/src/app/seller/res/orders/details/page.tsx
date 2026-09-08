"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ResponsiveSellerOrdersDetails from "@/components/seller/seller-orders/responsive/ResponsiveSellerOrdersDetails";

function DetailsContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "#1234";

  return (
    <ResponsiveSellerOrdersDetails
      orderId={orderId}
      customerName="Priya Mehta"
      customerPhone="+919876543210"
      deliveryAddress="Flat 402, Building 5A, Horizon Heights, Powai, Mumbai - 400076"
      riderName="Rahul Kumar"
      riderInitials="RK"
      riderPhone="+919876500101"
      riderEta="Live ETA: ~12 min"
      items={[
        { id: "1", name: "Butter Chicken", qty: 2, price: "₹450" },
        { id: "2", name: "Naan", qty: 4, price: "₹120" },
        { id: "3", name: "Dal Makhani", qty: 1, price: "₹280" },
      ]}
      subtotal="₹850"
      deliveryFee="Free"
      total="₹850"
      paymentMethod="COD"
      initialStatus="Preparing"
    />
  );
}

export default function ResponsiveSellerOrdersDetailsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20, textAlign: "center" }}>Loading Order Details...</div>}>
      <DetailsContent />
    </Suspense>
  );
}
