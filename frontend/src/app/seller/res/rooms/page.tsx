"use client";

import React, { useState, useEffect, useMemo } from "react";
import ResponsiveRoom, {
  ResponsiveRoomItem,
} from "@/components/seller/rooms/responsive/ResponsiveRoom";
import { fetchApi } from "@/lib/fetch-api";

export default function ResponsiveRoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadRooms() {
      try {
        const res = await fetchApi("/api/seller/rooms");
        if (res.ok) {
          const data = await res.json();
          const list = data.data?.rooms || data.rooms || data.data || [];
          if (Array.isArray(list) && isMounted) {
            setRooms(list);
          }
        }
      } catch (err) {
        console.error("Failed to load seller rooms:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadRooms();

    return () => {
      isMounted = false;
    };
  }, []);

  const mappedRooms: ResponsiveRoomItem[] | undefined = useMemo(() => {
    if (!rooms || rooms.length === 0) return undefined;
    return rooms.map((r: any) => {
      let imgUrl = "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop&q=80";
      try {
        const parsed = typeof r.images === "string" ? JSON.parse(r.images) : r.images;
        if (Array.isArray(parsed) && parsed[0]) imgUrl = parsed[0];
      } catch (e) {
        // fallback image
      }

      return {
        id: r.id,
        name: r.title || "Deluxe Room",
        sleepsCount: r.capacity || 2,
        pricePerNight: `₹${r.price}/night`,
        isAvailable: r.isAvailable ?? true,
        imageUrl: imgUrl,
      };
    });
  }, [rooms]);

  const handleToggleAvailability = async (roomId: string, isAvailable: boolean) => {
    try {
      await fetchApi("/api/seller/rooms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, isAvailable }),
      });
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, isAvailable } : r))
      );
    } catch (err) {
      console.error("Failed to toggle room availability:", err);
    }
  };

  return (
    <ResponsiveRoom
      ownerName="Rahul Sharma"
      rooms={mappedRooms}
      onToggleAvailability={handleToggleAvailability}
    />
  );
}


