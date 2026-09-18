"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Star, ArrowRight } from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";
import styles from "./AllAvailableRooms.module.css";
import premiumSingleImg from "./premium-single-room.jpg";
import executiveDoubleImg from "./executive-double-room.jpg";
import standardHostelImg from "./standard-hostel-room.jpg";

export interface AvailableRoomItem {
  id: string;
  title: string;
  rating: string;
  location: string;
  tags: string[];
  startingLabel: string;
  price: string;
  buttonText: string;
  image: StaticImageData | string;
}

export interface AllAvailableRoomsProps {
  heading?: string;
  rooms?: any[];
  searchQuery?: string;
  activeLocation?: string;
  activeBudget?: string;
  activeRoomType?: string;
  onReset?: () => void;
  onBookNow?: (room: any) => void;
}

export const AllAvailableRooms: React.FC<AllAvailableRoomsProps> = ({
  heading = "All Available Rooms",
  rooms: propRooms,
  searchQuery: propQuery,
  activeLocation = "all",
  activeBudget = "all",
  activeRoomType = "all",
  onReset,
  onBookNow,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = propQuery !== undefined ? propQuery : (searchParams ? searchParams.get("query") || "" : "");
  const [dynamicRooms, setDynamicRooms] = useState<AvailableRoomItem[]>([]);

  useEffect(() => {
    if (propRooms !== undefined) {
      const mapped: AvailableRoomItem[] = propRooms.map((r: any, idx: number) => {
        let imgUrl: string | StaticImageData =
          idx % 3 === 0
            ? premiumSingleImg
            : idx % 3 === 1
            ? executiveDoubleImg
            : standardHostelImg;

        if (r.images) {
          try {
            const parsed = typeof r.images === "string" ? JSON.parse(r.images) : r.images;
            if (Array.isArray(parsed) && parsed[0]) imgUrl = parsed[0];
          } catch {
            if (typeof r.images === "string" && r.images.startsWith("http")) {
              imgUrl = r.images;
            }
          }
        }

        const locality = r.sellerLocality || r.seller?.addressLocality || "";
        const city = r.sellerCity || r.seller?.user?.city || "Pune";
        const locStr = locality ? `${locality}, ${city}` : city;

        const tagsList: string[] = [];
        if (Array.isArray(r.amenities) && r.amenities.length > 0) {
          tagsList.push(...r.amenities.slice(0, 2).map((a: any) => (typeof a === "string" ? a : a.name || "")));
        }
        tagsList.push(`${r.capacity || 1} Guest${(r.capacity || 1) > 1 ? "s" : ""}`);

        const numRating = Number(r.rating) || 0;

        return {
          id: r.id,
          title: r.title || `Room ${idx + 101}`,
          rating: numRating > 0 ? numRating.toFixed(1) : "New",
          location: locStr,
          tags: tagsList.filter(Boolean),
          startingLabel: "STARTING FROM",
          price: `₹${Number(r.price || 0).toLocaleString("en-IN")}/night`,
          buttonText: "Book Now",
          image: imgUrl,
        };
      });
      setDynamicRooms(mapped);
      return;
    }

    async function loadPublicRooms() {
      try {
        const res = await fetchApi("/api/public/rooms");
        if (res.ok) {
          const json = await res.json();
          const list = json.data || json;
          if (Array.isArray(list) && list.length > 0) {
            const mapped: AvailableRoomItem[] = list.map((r: any, idx: number) => {
              let imgUrl: string | StaticImageData =
                idx % 3 === 0
                  ? premiumSingleImg
                  : idx % 3 === 1
                  ? executiveDoubleImg
                  : standardHostelImg;

              if (r.images) {
                try {
                  const parsed = typeof r.images === "string" ? JSON.parse(r.images) : r.images;
                  if (Array.isArray(parsed) && parsed[0]) imgUrl = parsed[0];
                } catch {
                  if (typeof r.images === "string" && r.images.startsWith("http")) {
                    imgUrl = r.images;
                  }
                }
              }

              const locality = r.sellerLocality || r.seller?.addressLocality || "";
              const city = r.sellerCity || r.seller?.user?.city || "Pune";
              const locStr = locality ? `${locality}, ${city}` : city;

              const tagsList: string[] = [];
              if (Array.isArray(r.amenities) && r.amenities.length > 0) {
                tagsList.push(...r.amenities.slice(0, 2).map((a: any) => (typeof a === "string" ? a : a.name || "")));
              }
              tagsList.push(`${r.capacity || 1} Guest${(r.capacity || 1) > 1 ? "s" : ""}`);

              const numRating = Number(r.rating) || 0;

              return {
                id: r.id,
                title: r.title || `Room ${idx + 101}`,
                rating: numRating > 0 ? numRating.toFixed(1) : "New",
                location: locStr,
                tags: tagsList.filter(Boolean),
                startingLabel: "STARTING FROM",
                price: `₹${Number(r.price || 0).toLocaleString("en-IN")}/night`,
                buttonText: "Book Now",
                image: imgUrl,
              };
            });
            setDynamicRooms(mapped);
          } else {
            setDynamicRooms([]);
          }
        }
      } catch (err) {
        console.error("Failed to load public rooms:", err);
      }
    }
    loadPublicRooms();
  }, [propRooms]);

  const rawDisplayRooms = dynamicRooms;

  const displayRooms = useMemo(() => {
    if (!queryParam.trim()) return rawDisplayRooms;
    const q = queryParam.toLowerCase().trim();
    return rawDisplayRooms.filter(
      (room) =>
        room.title.toLowerCase().includes(q) ||
        room.location.toLowerCase().includes(q) ||
        room.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        room.price.toLowerCase().includes(q)
    );
  }, [rawDisplayRooms, queryParam]);

  const handleBookClick = (room: AvailableRoomItem) => {
    if (onBookNow) {
      onBookNow(room);
    } else {
      router.push(`/room-booking/${room.id}`);
    }
  };

  const isFiltered = activeLocation !== "all" || activeBudget !== "all" || activeRoomType !== "all" || Boolean(queryParam.trim());

  return (
    <section id="available-rooms-grid" className={styles.sectionContainer} aria-label={heading}>
      {/* Active Search & Filter Banner */}
      {isFiltered && (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            padding: "16px 24px",
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
            border: "1px solid #FFE4D3",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.95rem", fontWeight: "700", color: "#1E293B" }}>
              Showing {displayRooms.length} room{displayRooms.length === 1 ? "" : "s"}
            </span>
            {activeLocation !== "all" && (
              <span style={{ background: "#FFF7ED", color: "#EA580C", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" }}>
                📍 {activeLocation}
              </span>
            )}
            {activeBudget !== "all" && (
              <span style={{ background: "#FFF7ED", color: "#EA580C", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" }}>
                💰 Budget: {activeBudget}
              </span>
            )}
            {activeRoomType !== "all" && (
              <span style={{ background: "#FFF7ED", color: "#EA580C", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" }}>
                👥 Type: {activeRoomType === "1" ? "Single" : activeRoomType === "2" ? "Double" : activeRoomType === "3" ? "Triple" : "Hostel"}
              </span>
            )}
          </div>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              style={{
                background: "none",
                border: "none",
                color: "#EA580C",
                fontSize: "0.9rem",
                fontWeight: "700",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      <h2 className={styles.heading}>{heading}</h2>

      {displayRooms.length === 0 ? (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            padding: "48px 24px",
            textAlign: "center",
            border: "1px dashed #CBD5E1",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div style={{ fontSize: "2.5rem" }}>🏠</div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#1E293B", margin: 0 }}>
            No rooms found matching your criteria
          </h3>
          <p style={{ fontSize: "0.92rem", color: "#64748B", margin: 0, maxWidth: "420px" }}>
            Try adjusting your location, budget, or room type filters to discover available stays.
          </p>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              style={{
                marginTop: "12px",
                background: "#EA580C",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "9999px",
                padding: "10px 24px",
                fontSize: "0.92rem",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className={styles.cardsGrid}>
          {displayRooms.map((room) => (
          <article key={room.id} className={styles.roomCard}>
            {/* Top Room Image */}
            <div className={styles.imageWrapper}>
              {typeof room.image === "string" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={room.image}
                  alt={room.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  className={styles.roomImg}
                />
              ) : (
                <Image
                  src={room.image}
                  alt={room.title}
                  fill
                  priority
                  sizes="(max-width: 1400px) 33vw, 450px"
                  className={styles.roomImg}
                />
              )}
            </div>

            {/* Card Body */}
            <div className={styles.cardBody}>
              <div className={styles.mainInfo}>
                {/* Title & Rating Badge */}
                <div className={styles.headerRow}>
                  <h3 className={styles.cardTitle} title={room.title}>
                    {room.title}
                  </h3>
                  <span className={styles.ratingBadge}>
                    <Star size={12} fill="#16a34a" color="#16a34a" />
                    <span>{room.rating}</span>
                  </span>
                </div>

                {/* Location */}
                <div className={styles.locationRow}>
                  <span>{room.location}</span>
                </div>

                {/* Feature Tags */}
                <div className={styles.tagsRow}>
                  {room.tags.map((tag, idx) => (
                    <span key={idx} className={styles.tagPill}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className={styles.cardDivider} />

              {/* Price & Action Button */}
              <div className={styles.bottomRow}>
                <div className={styles.priceBox}>
                  <span className={styles.startingLabel}>
                    {room.startingLabel}
                  </span>
                  <span className={styles.priceAmount}>{room.price}</span>
                </div>

                <button
                  type="button"
                  className={styles.bookBtn}
                  onClick={() => handleBookClick(room)}
                  aria-label={`Book ${room.title}`}
                >
                  <span>{room.buttonText}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      )}
    </section>
  );
};

export default AllAvailableRooms;
