import type { Metadata } from "next";
import RoomConfigCanvasDas from "@/components/seller/rooms/RoomConfigCanvasDas";

export const metadata: Metadata = {
  title: "Room Configurator | Neo Cloud Kitchen",
  description:
    "Configure parameters, pricing models, and media elements for specific hotel rooms.",
};

export default function SellerRoomConfigPage() {
  return <RoomConfigCanvasDas />;
}
