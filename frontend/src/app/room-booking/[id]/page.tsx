import React from "react";
import { RoomDetailDesktop } from "@/components/room-booking-desktop/room-detail-desktop";

export const dynamic = "force-dynamic";

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <RoomDetailDesktop
      roomId={id}
      navbarProps={{
        initialActiveItem: "Rooms",
      }}
    />
  );
}
