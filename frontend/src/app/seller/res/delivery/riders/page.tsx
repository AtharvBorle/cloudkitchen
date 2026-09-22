"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ResponsiveManageRiders from "@/components/seller/delivery/responsive/ResponsiveManageRiders";
import { fetchApi } from "@/lib/fetch-api";

export default function ResponsiveManageRidersPage() {
  const router = useRouter();
  const [riders, setRiders] = useState<any[]>([]);
  const [totalCod, setTotalCod] = useState(0);

  useEffect(() => {
    async function loadRiders() {
      try {
        const res = await fetchApi("/api/seller/delivery");
        if (res.ok) {
          const data = await res.json();
          const list = data.data?.deliveryPersons || data.deliveryPersons || data.data || [];
          if (Array.isArray(list) && list.length > 0) {
            const mapped = list.map((dp: any) => ({
              id: dp.id,
              name: dp.name,
              initials: dp.name
                ? dp.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "",
              phone: dp.phone || "",
              status: dp.isActive ? ("Online" as const) : ("Offline" as const),
            }));
            setRiders(mapped);

            const total = list.reduce(
              (sum: number, dp: any) => sum + (dp.outstandingBalance || 0),
              0
            );
            setTotalCod(total);
          }
        }
      } catch (err) {
        console.error("Failed to load managed riders:", err);
      }
    }
    loadRiders();
  }, []);

  const handleSelectRider = (rider: any) => {
    router.push(`/seller/delivery/handover?riderId=${rider.id}`);
  };

  return (
    <ResponsiveManageRiders
      activeRidersCount={riders.filter((r) => r.status === "Online").length}
      totalCodAmount={`₹${totalCod.toLocaleString("en-IN")}`}
      riders={riders}
      onSelectRider={handleSelectRider}
      onBack={() => router.push("/seller/delivery")}
    />
  );
}


