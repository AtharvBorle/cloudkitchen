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

  const handleConfirm = async (bookingId: string) => {
    try {
      await fetchApi("/api/seller/rooms/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status: "CONFIRMED" }),
      });
    } catch (err) {
      console.error("Failed to confirm booking:", err);
    }
  };

  const handleDecline = async (bookingId: string) => {
    try {
      await fetchApi("/api/seller/rooms/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status: "CANCELLED" }),
      });
    } catch (err) {
      console.error("Failed to decline booking:", err);
    }
  };

  const mappedBookings: ResponsiveBookingItem[] = useMemo(() => {
    if (!bookings || bookings.length === 0) return [];
    return bookings.map((b: any) => {
      const checkInRaw = b.startDate || b.checkInDate || b.checkIn;
      const checkOutRaw = b.endDate || b.checkOutDate || b.checkOut;
      const start = checkInRaw ? new Date(checkInRaw).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "-";
      const end = checkOutRaw ? new Date(checkOutRaw).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "-";

      let durationStr = "";
      if (checkInRaw && checkOutRaw) {
        const d1 = new Date(checkInRaw);
        const d2 = new Date(checkOutRaw);
        if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
          const diffDays = Math.max(1, Math.round(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
          durationStr = `${diffDays} ${diffDays === 1 ? "Night" : "Nights"}`;
        }
      }

      let statusVal: "Requested" | "Confirmed" | "Paid" | "Declined" = "Requested";
      const s = (b.status || "").toUpperCase();
      if (s === "CONFIRMED") statusVal = "Confirmed";
      else if (s === "PAID" || b.isPaid) statusVal = "Paid";
      else if (s === "CANCELLED" || s === "DECLINED") statusVal = "Declined";
      else statusVal = "Requested";

      const dateDisplay = start !== "-" && end !== "-"
        ? (durationStr ? `${start} – ${end} • ${durationStr}` : `${start} – ${end}`)
        : "-";

      return {
        id: b.id,
        guestName: b.user?.name || "Guest",
        roomName: b.room?.title || "Room",
        dateRange: dateDisplay,
        amount: `₹${b.totalAmount || 0}`,
        status: statusVal,
      };
    });
  }, [bookings]);

  return (
    <ResponsiveBooking
      bookings={mappedBookings}
      onConfirm={handleConfirm}
      onDecline={handleDecline}
    />
  );
}


