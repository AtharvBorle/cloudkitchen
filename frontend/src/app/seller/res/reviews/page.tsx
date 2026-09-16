import type { Metadata } from "next";
import { SellerReviewsCanvasDas } from "@/components/seller";

export const metadata: Metadata = {
  title: "Reviews & Feedback | Neo Cloud Kitchen",
  description: "View customer reviews, ratings, and feedback for your store.",
};

export default function ResponsiveSellerReviewsPage() {
  return <SellerReviewsCanvasDas />;
}
