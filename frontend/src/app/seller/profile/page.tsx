import type { Metadata } from "next";
import { Profile, SellerResponsiveWrapper } from "@/components/seller";
import ResponsiveSellerProfilePage from "@/app/seller/res/profile/page";

export const metadata: Metadata = {
  title: "Partner Profile Settings | Neo Cloud Kitchen",
  description: "Manage operational credentials, personal contacts, and business workspace parameters.",
};

export default function SellerProfilePage() {
  return (
    <SellerResponsiveWrapper
      desktop={<Profile />}
      mobile={<ResponsiveSellerProfilePage />}
    />
  );
}
