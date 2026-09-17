"use client";

import React, { useState, useEffect, useMemo } from "react";
import ResponsiveRoom, {
  ResponsiveRoomItem,
} from "@/components/seller/rooms/responsive/ResponsiveRoom";
import { fetchApi } from "@/lib/fetch-api";
import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ResponsiveRoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusChecked, setStatusChecked] = useState(false);
  const [isPropertyActive, setIsPropertyActive] = useState<boolean | null>(null);
  const [propertyVerification, setPropertyVerification] = useState<string>("NONE");

  useEffect(() => {
    let isMounted = true;

    async function checkCategoryAccess() {
      try {
        const res = await fetchApi("/api/seller/dashboard/status");
        if (res.ok) {
          const data = await res.json();
          const status = data.data || data;
          const active = Boolean(status.isPropertyActive);
          const verif = status.sellerProfile?.propertyVerificationStatus || "NONE";
          if (isMounted) {
            setIsPropertyActive(active);
            setPropertyVerification(verif);
            setStatusChecked(true);
          }

          if (!active) {
            window.dispatchEvent(
              new CustomEvent(verif === "APPROVED" ? "open-subscription-modal" : "open-category-upgrade", {
                detail: { category: "PROPERTY" },
              })
            );
          }
        } else if (isMounted) {
          setStatusChecked(true);
        }
      } catch (e) {
        if (isMounted) setStatusChecked(true);
      }
    }

    checkCategoryAccess();

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

  if (statusChecked && isPropertyActive === false) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#F8FAFC", padding: "32px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: "420px", backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #FED7AA", padding: "32px 20px", textAlign: "center", boxShadow: "0 10px 25px rgba(249, 115, 22, 0.08)" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#FFF1E8", color: "#F97316", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Lock size={24} />
          </div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0F172A", marginBottom: "8px" }}>
            Room Services Locked
          </h2>
          <p style={{ color: "#64748B", fontSize: "0.88rem", lineHeight: 1.5, marginBottom: "20px" }}>
            {propertyVerification === "APPROVED"
              ? "Your property verification is approved! Please subscribe to the Rooms & Stay category plan to activate room bookings."
              : "Your seller account is currently configured for Food Services only. To list rooms and receive hotel bookings, please apply for the Property category upgrade."}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {propertyVerification === "APPROVED" ? (
              <Link
                href="/seller/res/payment?category=PROPERTY"
                style={{
                  padding: "12px 16px",
                  backgroundColor: "#F97316",
                  color: "#FFFFFF",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <span>Subscribe to Rooms Plan</span>
                <ArrowRight size={16} />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("open-category-upgrade", { detail: { category: "PROPERTY" } })
                  );
                }}
                style={{
                  padding: "12px 16px",
                  backgroundColor: "#F97316",
                  color: "#FFFFFF",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  fontFamily: "inherit",
                }}
              >
                <span>Apply for Category Upgrade</span>
                <ArrowRight size={16} />
              </button>
            )}
            <Link
              href="/seller/res/dashboard"
              style={{
                padding: "11px 16px",
                backgroundColor: "#F1F5F9",
                color: "#475569",
                borderRadius: "10px",
                fontWeight: 600,
                fontSize: "0.88rem",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveRoom
      rooms={mappedRooms}
      onSelectRoom={(room) => router.push(`/seller/rooms/config?id=${encodeURIComponent(room.id)}`)}
      onAddRoom={() => router.push("/seller/rooms/add")}
      onToggleAvailability={handleToggleAvailability}
    />
  );
}


