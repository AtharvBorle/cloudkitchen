"use client";

import React, { useState, useEffect, useMemo } from "react";
import ResponsiveBooking, {
  ResponsiveBookingItem,
} from "@/components/seller/booking/responsive/ResponsiveBooking";
import { fetchApi } from "@/lib/fetch-api";

export default function ResponsiveBookingPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadBookings() {
      try {
        const res = await fetchApi("/api/seller/rooms/bookings");
        if (res.ok) {
          const data = await res.json();
          const list = data.data?.bookings || data.bookings || data.data || [];
          if (Array.isArray(list) && isMounted) {
            setBookings(list);
          }
        }
      } catch (err) {
        console.error("Failed to load seller bookings:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadBookings();

    return () => {
      isMounted = false;
    };
  }, []);

  const mappedBookings: ResponsiveBookingItem[] | undefined = useMemo(() => {
    if (!bookings || bookings.length === 0) return undefined;
    return bookings.map((b: any) => {
      const start = b.startDate ? new Date(b.startDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Aug 28";
      const end = b.endDate ? new Date(b.endDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Sep 01";

      let statusVal: "Requested" | "Confirmed" | "Paid" | "Declined" = "Requested";
      const s = (b.status || "").toUpperCase();
      if (s === "CONFIRMED") statusVal = "Confirmed";
      else if (s === "PAID" || b.isPaid) statusVal = "Paid";
      else if (s === "CANCELLED" || s === "DECLINED") statusVal = "Declined";
      else statusVal = "Requested";

      return {
        id: b.id,
        guestName: b.user?.name || "Guest",
        roomName: b.room?.title || "Deluxe Suite",
        dateRange: `${start} - ${end}`,
        amount: `₹${b.totalAmount || 0}`,
        status: statusVal,
      };
    });
  }, [bookings]);

  return (
    <ResponsiveBooking
      ownerName="Rahul Sharma"
      bookings={mappedBookings}
    />
  );
}


