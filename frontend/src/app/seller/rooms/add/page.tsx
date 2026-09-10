import type { Metadata } from "next";
import { RoomConfigCanvasDas, SellerResponsiveWrapper } from "@/components/seller";
import ResponsiveRoomAddPage from "@/app/seller/res/rooms/add/page";

export const metadata: Metadata = {
  title: "Add New Room | Neo Cloud Kitchen",
  description: "Create and publish a new cloud room with amenities, pricing, and photo gallery.",
};

export default function SellerRoomAddPage() {
  return (
    <SellerResponsiveWrapper
      desktop={<RoomConfigCanvasDas />}
      mobile={<ResponsiveRoomAddPage />}
    />
  );
}
