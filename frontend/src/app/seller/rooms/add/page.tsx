import type { Metadata } from "next";
import { Suspense } from "react";
import { RoomConfigCanvasDas, SellerResponsiveWrapper } from "@/components/seller";
import ResponsiveRoomAddPage from "@/app/seller/res/rooms/add/page";

export const metadata: Metadata = {
  title: "Add New Room | Neo Cloud Kitchen",
  description: "Create and publish a new cloud room with amenities, pricing, and photo gallery.",
};

export default function SellerRoomAddPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>Loading Room Configurator...</div>}>
      <SellerResponsiveWrapper
        desktop={<RoomConfigCanvasDas />}
        mobile={<ResponsiveRoomAddPage />}
      />
    </Suspense>
  );
}
