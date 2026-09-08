"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ResponsiveCashHandover from "@/components/seller/delivery/responsive/ResponsiveCashHandover";
import { fetchApi } from "@/lib/fetch-api";

function CashHandoverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const riderId = searchParams.get("riderId");

  const [rider, setRider] = useState<any>(null);

  useEffect(() => {
    async function loadRider() {
      try {
        const res = await fetchApi<{ deliveryPersons: any[] }>("/api/seller/delivery");
        if (res.data?.deliveryPersons && res.data.deliveryPersons.length > 0) {
          const found = riderId
            ? res.data.deliveryPersons.find((r) => r.id === riderId)
            : res.data.deliveryPersons[0];
          if (found) setRider(found);
        }
      } catch (err) {
        console.error("Failed to load delivery person details:", err);
      }
    }
    loadRider();
  }, [riderId]);

  const handleConfirmReceipt = async () => {
    if (!rider || !rider.id) return;
    try {
      const amount = rider.outstandingBalance || 1700;
      await fetch(`/api/seller/delivery/${rider.id}/collect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      router.push("/seller/res/delivery");
    } catch (err) {
      console.error("Failed to collect cash:", err);
    }
  };

  return (
    <ResponsiveCashHandover
      riderName={rider?.name || "Rahul Kumar"}
      riderInitials={
        rider?.name
          ? rider.name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
          : "RK"
      }
      totalCash={`₹${(rider?.outstandingBalance || 1700).toLocaleString()}`}
      ordersCount={rider ? Math.max(1, Math.round((rider.outstandingBalance || 1700) / 850)) : 3}
      onConfirmReceipt={handleConfirmReceipt}
    />
  );
}

export default function ResponsiveCashHandoverPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 24, textAlign: "center", color: "#64748B" }}>
          Loading Cash Handover...
        </div>
      }
    >
      <CashHandoverContent />
    </Suspense>
  );
}


