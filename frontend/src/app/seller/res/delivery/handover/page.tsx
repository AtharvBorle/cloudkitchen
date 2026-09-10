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
        const res = await fetchApi("/api/seller/delivery");
        if (res.ok) {
          const data = await res.json();
          const list = data.data?.deliveryPersons || data.deliveryPersons || data.data || [];
          if (Array.isArray(list) && list.length > 0) {
            const found = riderId
              ? list.find((r: any) => r.id === riderId)
              : list[0];
            if (found) setRider(found);
          }
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
      await fetchApi(`/api/seller/delivery/${rider.id}/collect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      router.push("/seller/delivery/riders");
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
              .toUpperCase()
              .slice(0, 2)
          : "RK"
      }
      totalCash={`₹${(rider?.outstandingBalance || 1700).toLocaleString("en-IN")}`}
      ordersCount={rider ? Math.max(1, Math.round((rider.outstandingBalance || 1700) / 850)) : 3}
      onConfirmReceipt={handleConfirmReceipt}
      onBack={() => router.push("/seller/delivery/riders")}
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


