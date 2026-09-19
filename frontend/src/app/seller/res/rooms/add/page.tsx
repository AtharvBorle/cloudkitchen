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
  { id: "desk", name: "Work Desk", selected: false },
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
    floorNo: string;
    about: string;
    amenities: ResponsiveAmenity[];
    houseRules: string[];
    isAvailable: boolean;
    imageUrl?: string;
  }>({
    roomName: "",
    capacity: "",
    pricePerNight: "",
    floorNo: "",
    about: "",
    amenities: DEFAULT_AMENITIES,
    houseRules: [],
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

            let loadedAmenitiesList: string[] = [];
            if (Array.isArray(room.amenities)) {
              loadedAmenitiesList = room.amenities.map(String);
            } else if (typeof room.amenities === "string" && room.amenities.trim()) {
              try {
                const parsed = JSON.parse(room.amenities);
                if (Array.isArray(parsed)) loadedAmenitiesList = parsed.map(String);
                else loadedAmenitiesList = room.amenities.split(",").map((s: string) => s.trim());
              } catch {
                loadedAmenitiesList = room.amenities.split(",").map((s: string) => s.trim());
              }
            } else if (room.description) {
              const match = room.description.match(/Amenities:\s*([^\n]+)/i);
              if (match) {
                loadedAmenitiesList = match[1].split(",").map((s: string) => s.trim());
              }
            }

            const mappedAmenities: ResponsiveAmenity[] = DEFAULT_AMENITIES.map((a) => ({
              ...a,
              selected: loadedAmenitiesList.some((la) => la.toLowerCase() === a.name.toLowerCase()),
            }));

            loadedAmenitiesList.forEach((la, idx) => {
              const exists = mappedAmenities.some(
                (ma) => ma.name.toLowerCase() === la.toLowerCase()
              );
              if (!exists && la.trim()) {
                mappedAmenities.push({
                  id: `custom-${idx}-${Date.now()}`,
                  name: la.trim(),
                  selected: true,
                });
              }
            });

            let loadedHouseRules: string[] = [];
            if (Array.isArray(room.houseRules)) {
              loadedHouseRules = room.houseRules.map(String).filter(Boolean);
            } else if (typeof room.houseRules === "string" && room.houseRules.trim()) {
              try {
                const parsed = JSON.parse(room.houseRules);
                if (Array.isArray(parsed)) loadedHouseRules = parsed.map(String).filter(Boolean);
                else loadedHouseRules = room.houseRules.split("\n").map((s: string) => s.trim()).filter(Boolean);
              } catch {
                loadedHouseRules = room.houseRules.split("\n").map((s: string) => s.trim()).filter(Boolean);
              }
            }

            // Extract floor
            let loadedFloor = "";
            if (typeof room.floor === "string" && room.floor.trim()) {
              loadedFloor = room.floor.trim();
            } else if (typeof room.floorNo === "string" && room.floorNo.trim()) {
              loadedFloor = room.floorNo.trim();
            }

            // Extract clean about
            let loadedAbout = "";
            if (typeof room.about === "string" && room.about.trim()) {
              loadedAbout = room.about.trim();
            } else if (typeof room.description === "string" && room.description.trim() && !room.description.startsWith("{")) {
              loadedAbout = room.description.replace(/Amenities:[^\n]+/i, "").replace(/House Rules:[^\n]+/i, "").replace(/Floor(?:\s*No)?:[^\n]+/i, "").trim();
            }
            if (loadedAbout.startsWith("{")) {
              try {
                const parsed = JSON.parse(loadedAbout);
                loadedAbout = typeof parsed.about === "string" ? parsed.about : "";
              } catch {
                loadedAbout = "";
              }
            }

            setInitialData({
              roomName: room.title || "",
              capacity: room.capacity ? String(room.capacity) : "2",
              pricePerNight: room.price ? String(room.price) : "2500",
              floorNo: loadedFloor,
              about: loadedAbout,
              amenities: mappedAmenities,
              houseRules: loadedHouseRules,
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
      formData.append("about", data.about || "");
      formData.append("floor", data.floorNo || "");
      formData.append(
        "amenities",
        JSON.stringify(data.amenities.filter((a: any) => a.selected).map((a: any) => a.name))
      );
      formData.append("houseRules", JSON.stringify(data.houseRules || []));
      formData.append("description", data.about || "");

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
      initialFloorNo={initialData.floorNo}
      initialAbout={initialData.about}
      initialAmenities={initialData.amenities}
      initialHouseRules={initialData.houseRules}
      initialIsAvailable={initialData.isAvailable}
      initialImageUrl={initialData.imageUrl}
      isEditMode={isEditMode}
      isSaving={saving}
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

