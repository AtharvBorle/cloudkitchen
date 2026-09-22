import type { Metadata } from "next";
import { SellerReviewsCanvasDas, SellerResponsiveWrapper } from "@/components/seller";
import ResponsiveSellerReviewsPage from "@/app/seller/res/reviews/page";

export const metadata: Metadata = {
  title: "Reviews & Feedback | Neo Cloud Kitchen",
  description: "View customer reviews, ratings, and feedback for your store.",
};

export default function SellerReviewsPage() {
  return (
    <SellerResponsiveWrapper
      desktop={<SellerReviewsCanvasDas />}
      mobile={<ResponsiveSellerReviewsPage />}
    />
  );
}
