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
                : "RK",
              phone: dp.phone || "+91 98765 00000",
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
    router.push(`/seller/res/delivery/handover?riderId=${rider.id}`);
  };

  return (
    <ResponsiveManageRiders
      activeRidersCount={riders.length > 0 ? riders.filter((r) => r.status === "Online").length : 4}
      totalCodAmount={`₹${(totalCod || 14800).toLocaleString("en-IN")}`}
      riders={riders.length > 0 ? riders : undefined}
      onSelectRider={handleSelectRider}
      onBack={() => router.push("/seller/res/delivery")}
    />
  );
}


