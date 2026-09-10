import type { Metadata } from "next";
import { SellerResponsiveWrapper } from "@/components/seller";
import ResponsiveAssignRiderPage from "@/app/seller/res/orders/assign-rider/page";

export const metadata: Metadata = {
  title: "Assign Rider | Neo Cloud Kitchen",
  description: "Assign an active rider to dispatch the prepared kitchen order.",
};

export default function SellerAssignRiderPage() {
  return (
    <SellerResponsiveWrapper
      desktop={<ResponsiveAssignRiderPage />}
      mobile={<ResponsiveAssignRiderPage />}
    />
  );
}
