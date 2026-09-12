"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ResponsiveRoomAdd, {
  ResponsiveAmenity,
} from "@/components/seller/rooms/responsive/ResponsiveRoomAdd";
import { fetchApi } from "@/lib/fetch-api";

const DEFAULT_AMENITIES: ResponsiveAmenity[] = [
  { id: "wifi", name: "WiFi", selected: false },
  { id: "ac", name: "AC", selected: false },
  { id: "tv", name: "TV", selected: false },
  { id: "minibar", name: "Minibar", selected: false },
  { id: "balcony", name: "Balcony", selected: false },
];

function RoomAddEditContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams ? (searchParams.get("id") || searchParams.get("roomId")) : null;
  const isEditMode = Boolean(roomId);

  const [initialData, setInitialData] = useState<{
    roomName: string;
    capacity: string | number;
    pricePerNight: string;
    amenities: ResponsiveAmenity[];
    isAvailable: boolean;
    imageUrl?: string;
  }>({
    roomName: "",
    capacity: "",
    pricePerNight: "",
    amenities: DEFAULT_AMENITIES,
    isAvailable: true,
  });

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    async function loadRoom() {
      try {
        setLoading(true);
        const res = await fetchApi(`/api/seller/rooms/${roomId}`);
        if (res.ok) {
          const data = await res.json();
          const room = data.data?.room || data.room;
          if (room) {
            let imgUrl = "";
            try {
              const parsed = typeof room.images === "string" ? JSON.parse(room.images) : room.images;
              if (Array.isArray(parsed) && parsed[0]) imgUrl = parsed[0];
              else if (typeof parsed === "string") imgUrl = parsed;
            } catch (e) {
              if (room.images) imgUrl = room.images;
            }

            const desc = room.description || "";
            const mappedAmenities = DEFAULT_AMENITIES.map((a) => ({
              ...a,
              selected: desc.toLowerCase().includes(a.name.toLowerCase()),
            }));

            setInitialData({
              roomName: room.title || "",
              capacity: room.capacity ? String(room.capacity) : "2",
              pricePerNight: room.price ? String(room.price) : "2500",
              amenities: mappedAmenities,
              isAvailable: room.isAvailable ?? true,
              imageUrl: imgUrl || undefined,
            });
          }
        }
      } catch (err) {
        console.error("Failed to load room details for edit:", err);
      } finally {
        setLoading(false);
      }
    }

    loadRoom();
  }, [roomId]);

  const handleSave = async (data: any) => {
    setSaving(true);
    try {
      const formData = new FormData();
      if (roomId) {
        formData.append("roomId", roomId);
      }
      formData.append("title", data.roomName);
      formData.append(
        "price",
        data.pricePerNight.replace(/[^\d.]/g, "") || "2500"
      );
      formData.append("capacity", String(data.capacity || 2));
      formData.append("isAvailable", String(data.isAvailable));
      formData.append(
        "description",
        `Amenities: ${data.amenities
          .filter((a: any) => a.selected)
          .map((a: any) => a.name)
          .join(", ")}`
      );

      if (data.imageFile) {
        formData.append("image", data.imageFile);
      } else if (initialData.imageUrl) {
        formData.append("imageUrl", initialData.imageUrl);
      }

      const endpoint = roomId ? `/api/seller/rooms/${roomId}` : "/api/seller/rooms";
      const method = roomId ? "PATCH" : "POST";

      const res = await fetchApi(endpoint, {
        method,
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || (isEditMode ? "Failed to update room" : "Failed to create room"));
        return;
      }

      router.push("/seller/rooms");
    } catch (err: any) {
      console.error(isEditMode ? "Error updating room:" : "Error creating room:", err);
      alert(err.message || (isEditMode ? "Error updating room" : "Error creating room"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!roomId) return;
    if (!confirm("Are you sure you want to delete this room?")) return;
    try {
      const res = await fetchApi(`/api/seller/rooms?id=${encodeURIComponent(roomId)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/seller/rooms");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Failed to delete room");
      }
    } catch (err) {
      console.error("Error deleting room:", err);
      alert("Failed to delete room");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#64748B", fontFamily: "sans-serif" }}>
        Loading Room Details...
      </div>
    );
  }

  return (
    <ResponsiveRoomAdd
      initialRoomName={initialData.roomName}
      initialCapacity={initialData.capacity}
      initialPricePerNight={initialData.pricePerNight}
      initialAmenities={initialData.amenities}
      initialIsAvailable={initialData.isAvailable}
      initialImageUrl={initialData.imageUrl}
      isEditMode={isEditMode}
      onSave={handleSave}
      onDelete={isEditMode ? handleDelete : undefined}
      onBack={() => router.push("/seller/rooms")}
    />
  );
}

export default function ResponsiveRoomAddPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "40px", textAlign: "center", color: "#64748B", fontFamily: "sans-serif" }}>
          Loading Room Form...
        </div>
      }
    >
      <RoomAddEditContent />
    </Suspense>
  );
}

