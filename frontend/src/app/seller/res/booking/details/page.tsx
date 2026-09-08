"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ResponsiveBookingDetails from "@/components/seller/booking/responsive/ResponsiveBookingDetails";

function BookingDetailsContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId") || "B-2047";

  return (
    <ResponsiveBookingDetails
      bookingId={bookingId}
      guestName="Aarav Mehta"
      guestInitials="AM"
      guestPhone="+91 98765 43210"
      roomName="Deluxe Suite"
      roomCapacity="Sleeps 4 Guests"
      dateRange="Aug 28 – Sep 1"
      stayDuration="4 Nights Stay"
      ratePerNight="₹2,500"
      nightsCount={4}
      roomChargeTotal="₹10,000"
      serviceFee="₹500"
      totalAmount="₹10,500"
      initialStatus="Requested"
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
