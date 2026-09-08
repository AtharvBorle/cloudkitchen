"use client";

import React from "react";
import ResponsiveSellerOrdersDetails from "@/components/seller/seller-orders/responsive/ResponsiveSellerOrdersDetails";

export default function ResponsiveSellerOrdersDetailsPage() {
  return (
    <ResponsiveSellerOrdersDetails
      orderId="#1234"
      customerName="Priya Mehta"
      customerRole="Customer"
      customerInitials="PM"
      customerPhone="+919876543210"
      deliveryAddress="Flat 402, Building 5A, Horizon Heights, Powai, Mumbai - 400076"
      items={[
        { id: "1", name: "Butter Chicken", qty: 2, price: "₹450" },
        { id: "2", name: "Naan", qty: 4, price: "₹120" },
        { id: "3", name: "Dal Makhani", qty: 1, price: "₹280" },
      ]}
      subtotal="₹850"
      deliveryFee="Free"
      total="₹850"
      paymentMethod="COD"
      initialStatus="Pending"
    />
  );
}
