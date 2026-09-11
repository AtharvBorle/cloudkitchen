import type { Metadata } from "next";
import { Suspense } from "react";
import { RoomConfigCanvasDas, SellerResponsiveWrapper } from "@/components/seller";
import ResponsiveRoomAddPage from "@/app/seller/res/rooms/add/page";

export const metadata: Metadata = {
  title: "Room Configurator | Neo Cloud Kitchen",
  description:
    "Configure parameters, pricing models, and media elements for specific hotel rooms.",
};

export default function SellerRoomConfigPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>Loading Room Configurator...</div>}>
      <SellerResponsiveWrapper
        desktop={<RoomConfigCanvasDas />}
        mobile={<ResponsiveRoomAddPage />}
      />
    </Suspense>
  );
}
