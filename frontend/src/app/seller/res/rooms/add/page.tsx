"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ResponsiveRoomAdd from "@/components/seller/rooms/responsive/ResponsiveRoomAdd";

export default function ResponsiveRoomAddPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleSave = async (data: any) => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", data.roomName);
      formData.append(
        "price",
        data.pricePerNight.replace(/[^\d.]/g, "") || "2500"
      );
      formData.append("capacity", String(data.capacity || 4));
      formData.append(
        "description",
        `Amenities: ${data.amenities
          .filter((a: any) => a.selected)
          .map((a: any) => a.name)
          .join(", ")}`
      );

      if (data.imageFile) {
        formData.append("image", data.imageFile);
      }

      const res = await fetch("/api/seller/rooms", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Failed to create room");
        return;
      }

      router.push("/seller/rooms");
    } catch (err: any) {
      console.error("Error creating room:", err);
      alert(err.message || "Error creating room");
    } finally {
      setSaving(false);
    }
  };

  return <ResponsiveRoomAdd onSave={handleSave} />;
}

