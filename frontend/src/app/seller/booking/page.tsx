import type { Metadata } from "next";
import { BookingCanvasDas, SellerResponsiveWrapper } from "@/components/seller";
import ResponsiveBookingPage from "@/app/seller/res/booking/page";

export const metadata: Metadata = {
  title: "Reservations Ledger & Booking Management | Neo Cloud Kitchen",
  description: "Track booking requests, check-in schedules, payment completion statuses, and cancellations.",
};

export default function SellerBookingPage() {
  return (
    <SellerResponsiveWrapper
      desktop={<BookingCanvasDas />}
      mobile={<ResponsiveBookingPage />}
    />
  );
}