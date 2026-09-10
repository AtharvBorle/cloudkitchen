"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ResponsiveBookingDetails from "@/components/seller/booking/responsive/ResponsiveBookingDetails";
import { fetchApi } from "@/lib/fetch-api";

function BookingDetailsContent() {
  const searchParams = useSearchParams();
  const rawId = searchParams.get("bookingId") || "B-2047";
  const cleanId = rawId.replace("B-", "");

  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    async function loadBooking() {
      try {
        const res = await fetchApi("/api/seller/rooms/bookings");
        if (res.ok) {
          const data = await res.json();
          const list = data.data?.bookings || data.bookings || data.data || [];
          if (Array.isArray(list)) {
            const found = list.find(
              (b: any) => b.id === cleanId || b.id === rawId || `B-${b.id.slice(0, 4)}` === rawId
            );
            if (found) setBooking(found);
          }
        }
      } catch (err) {
        console.error("Failed to load booking details:", err);
      }
    }
    loadBooking();
  }, [cleanId, rawId]);

  const handleUpdateStatus = async (status: "CONFIRMED" | "CANCELLED") => {
    const targetId = booking?.id || cleanId;
    try {
      await fetchApi("/api/seller/rooms/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: targetId, status }),
      });
    } catch (err) {
      console.error("Failed to update booking status:", err);
    }
  };

  const mapStatusToStep = (st: string) => {
    switch (st) {
      case "CONFIRMED":
        return "Confirmed" as const;
      case "PAID":
        return "Paid" as const;
      case "COMPLETED":
        return "Completed" as const;
      default:
        return "Requested" as const;
    }
  };

  let dateRange = "Aug 28 – Sep 1";
  let nights = 4;
  if (booking?.startDate && booking?.endDate) {
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    dateRange = `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  }

  return (
    <ResponsiveBookingDetails
      bookingId={booking ? `B-${booking.id.slice(0, 4)}` : rawId}
      guestName={booking?.user?.name || (booking ? "Guest" : "Aarav Mehta")}
      guestInitials={
        booking?.user?.name
          ? booking.user.name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
          : "AM"
      }
      guestPhone={booking?.user?.phone || "+91 98765 43210"}
      roomName={booking?.room?.title || "Deluxe Suite"}
      roomCapacity="Sleeps 4 Guests"
      dateRange={dateRange}
      stayDuration={`${nights} Nights Stay`}
      ratePerNight={`₹${booking ? Math.round(booking.totalAmount / nights) : 2500}`}
      nightsCount={nights}
      roomChargeTotal={`₹${booking ? booking.totalAmount : 10000}`}
      serviceFee="₹500"
      totalAmount={`₹${booking ? booking.totalAmount + 500 : 10500}`}
      initialStatus={booking ? mapStatusToStep(booking.status) : "Requested"}
      onConfirm={() => handleUpdateStatus("CONFIRMED")}
      onDecline={() => handleUpdateStatus("CANCELLED")}
    />
  );
}

export default function ResponsiveBookingDetailsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 24, textAlign: "center", color: "#64748B" }}>
          Loading Booking Details...
        </div>
      }
    >
      <BookingDetailsContent />
    </Suspense>
  );
}

