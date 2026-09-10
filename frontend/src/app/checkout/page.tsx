import type { Metadata } from "next";
import SecureCheckout from "@/components/user-cart/SecureCheckout";

export const metadata: Metadata = {
  title: "Secure Checkout | Neo Cloud Bites",
  description: "Complete your gourmet order in just a few simple steps.",
};

export default function CheckoutPage() {
  return <SecureCheckout />;
}
