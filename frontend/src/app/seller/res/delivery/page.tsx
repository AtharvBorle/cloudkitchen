"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import ResponsiveDelivery, {
  ResponsiveRiderItem,
} from "@/components/seller/delivery/responsive/ResponsiveDelivery";
import { fetchApi } from "@/lib/fetch-api";

export default function ResponsiveDeliveryPage() {
  const router = useRouter();
  const [deliveryData, setDeliveryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDelivery() {
      try {
        const res = await fetchApi("/api/seller/delivery");
        if (res.ok) {
          const data = await res.json();
          const list = data.data?.deliveryPersons || data.deliveryPersons || data.data || [];
          if (Array.isArray(list) && isMounted) {
            setDeliveryData(list);
          }
        }
      } catch (err) {
        console.error("Failed to load seller delivery data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDelivery();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalOutstandingStr = useMemo(() => {
    if (!deliveryData || deliveryData.length === 0) return undefined;
    const total = deliveryData.reduce((acc, dp) => acc + (dp.outstandingBalance || 0), 0);
    return `₹${total.toLocaleString("en-IN")}`;
  }, [deliveryData]);

  const mappedRiders: ResponsiveRiderItem[] | undefined = useMemo(() => {
    if (!deliveryData || deliveryData.length === 0) return undefined;
    return deliveryData.map((dp: any) => {
      const initials = (dp.name || "Rider")
        .split(" ")
        .map((p: string) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      return {
        id: dp.id,
        name: dp.name,
        initials: initials || "RD",
        phone: dp.phone || "+91 98765 00000",
        outstandingAmount: `₹${(dp.outstandingBalance || 0).toLocaleString("en-IN")}`,
      };
    });
  }, [deliveryData]);

  return (
    <ResponsiveDelivery
      ownerName="Rahul Sharma"
      totalOutstanding={totalOutstandingStr}
      riders={mappedRiders}
      onSelectRider={(rider) => router.push(`/seller/res/delivery/handover?riderId=${rider.id}`)}
    />
  );
}


