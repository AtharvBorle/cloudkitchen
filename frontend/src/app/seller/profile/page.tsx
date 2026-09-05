import type { Metadata } from "next";
import Profile from "@/components/seller/seller-profile/Profile";

export const metadata: Metadata = {
  title: "Partner Profile Settings | Neo Cloud Kitchen",
  description: "Manage operational credentials, personal contacts, and business workspace parameters.",
};

export default function SellerProfilePage() {
  return <Profile />;
}
