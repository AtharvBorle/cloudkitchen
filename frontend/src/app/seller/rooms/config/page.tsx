import type { Metadata } from "next";
import { RoomConfigCanvasDas, SellerResponsiveWrapper } from "@/components/seller";
import ResponsiveRoomAddPage from "@/app/seller/res/rooms/add/page";

export const metadata: Metadata = {
  title: "Room Configurator | Neo Cloud Kitchen",
  description:
    "Configure parameters, pricing models, and media elements for specific hotel rooms.",
};

export default function SellerRoomConfigPage() {
  return (
    <SellerResponsiveWrapper
      desktop={<RoomConfigCanvasDas />}
      mobile={<ResponsiveRoomAddPage />}
    />
  );
}
