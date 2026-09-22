import type { Metadata } from "next";
import { Suspense } from "react";
import { SellerPaymentCanvasDas, SellerResponsiveWrapper } from "@/components/seller";
import ResponsiveSellerPaymentPage from "@/app/seller/res/payment/page";

export const metadata: Metadata = {
  title: "Partner Subscription & Plans | Neo Cloud Kitchen",
  description:
    "Choose a partner subscription plan to activate or renew your vendor store operations and access professional kitchen tools.",
};

export default function SellerPaymentPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>Loading payment options...</div>}>
      <SellerResponsiveWrapper
        desktop={<SellerPaymentCanvasDas />}
        mobile={<ResponsiveSellerPaymentPage />}
      />
    </Suspense>
  );
}
