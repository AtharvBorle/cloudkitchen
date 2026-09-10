import type { Metadata } from "next";
import { BookingCanvasDas, SellerResponsiveWrapper } from "@/components/seller";
import ResponsiveBookingDetailsPage from "@/app/seller/res/booking/details/page";

export const metadata: Metadata = {
  title: "Reservation Details | Neo Cloud Kitchen",
  description: "View and manage guest reservation details, payment status, and verification.",
};

export default function SellerBookingDetailsPage() {
  return (
    <SellerResponsiveWrapper
      desktop={<ResponsiveBookingDetailsPage />}
      mobile={<ResponsiveBookingDetailsPage />}
    />
  );
}
