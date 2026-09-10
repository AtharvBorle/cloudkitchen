import type { Metadata } from "next";
import BookingCanvasDas from "@/components/seller/booking/BookingCanvasDas";

export const metadata: Metadata = {
  title: "Reservations Ledger & Booking Management | Neo Cloud Kitchen",
  description: "Track booking requests, check-in schedules, payment completion statuses, and cancellations.",
};

export default function SellerBookingPage() {
  return <BookingCanvasDas />;
}