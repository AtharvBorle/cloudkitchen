import type { Metadata } from "next";
import UserCart from "@/components/user-cart/UserCart";

export const metadata: Metadata = {
  title: "Your Cart | Neo Cloud Bites",
  description: "Review your items, apply a promo, and proceed to checkout.",
};

export default function UserCartPage() {
  return <UserCart />;
}
