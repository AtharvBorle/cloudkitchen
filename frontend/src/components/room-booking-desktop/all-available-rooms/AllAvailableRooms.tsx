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

const DEFAULT_ROOMS: AvailableRoomItem[] = [
  {
    id: "room-1",
    title: "Premium Single Room",
    rating: "4.8",
    location: "MIT College Road, Kothrud",
    tags: ["Free Wi-Fi", "Daily Cleaning"],
    startingLabel: "STARTING FROM",
    price: "₹6,200/month",
    buttonText: "Book Now",
    image: premiumSingleImg,
  },
  {
    id: "room-2",
    title: "Executive Double Sharing",
    rating: "4.6",
    location: "Paud Road, Pune",
    tags: ["Free Wi-Fi", "Daily Cleaning"],
    startingLabel: "STARTING FROM",
    price: "₹6,200/month",
    buttonText: "Book Now",
    image: executiveDoubleImg,
  },
  {
    id: "room-3",
    title: "Standard Hostel Room",
    rating: "4.5",
    location: "Karve Nagar, Pune",
    tags: ["Free Wi-Fi", "Daily Cleaning"],
    startingLabel: "STARTING FROM",
    price: "₹6,200/month",
    buttonText: "Book Now",
    image: standardHostelImg,
  },
];

export interface AllAvailableRoomsProps {
  heading?: string;
  rooms?: AvailableRoomItem[];
  searchQuery?: string;
  onBookNow?: (room: AvailableRoomItem) => void;
}

export const AllAvailableRooms: React.FC<AllAvailableRoomsProps> = ({
  heading = "All Available Rooms",
  rooms: propRooms,
  searchQuery: propQuery,
  onBookNow,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = propQuery !== undefined ? propQuery : (searchParams ? searchParams.get("query") || "" : "");
  const [dynamicRooms, setDynamicRooms] = useState<AvailableRoomItem[]>([]);

  useEffect(() => {
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

              const locality = r.seller?.addressLocality || "Kothrud";
              const city = r.seller?.addressCity || "Pune";

              return {
                id: r.id,
                title: r.title || `Deluxe Room ${idx + 101}`,
                rating: r.seller?.rating ? Number(r.seller.rating).toFixed(1) : "4.8",
                location: `${locality}, ${city}`,
                tags: ["Free Wi-Fi", `${r.capacity || 2} Guests`, "Air Conditioned"],
                startingLabel: "STARTING FROM",
                price: `₹${Number(r.price || 2500).toLocaleString("en-IN")}/night`,
                buttonText: "Book Now",
                image: imgUrl,
              };
            });
            setDynamicRooms(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to load public rooms:", err);
      }
    }
    loadPublicRooms();
  }, []);

  const rawDisplayRooms =
    propRooms || (dynamicRooms.length > 0 ? dynamicRooms : DEFAULT_ROOMS);

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

  return (
    <section className={styles.sectionContainer} aria-label={heading}>
      {/* Active Search Filter Banner */}
      {queryParam.trim() && (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            padding: "18px 24px",
            marginBottom: "28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
            border: "1px solid #FFE4D3",
          }}
        >
          <div>
            <h3
              style={{
                fontSize: "1.2rem",
                fontWeight: "700",
                color: "#0F172A",
                margin: "0 0 4px 0",
              }}
            >
              Rooms matching &quot;{queryParam}&quot;
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#64748B", margin: 0 }}>
              Found {displayRooms.length} available{" "}
              {displayRooms.length === 1 ? "room" : "rooms"}
            </p>
          </div>
          <Link
            href="/room-booking"
            style={{
              fontSize: "0.85rem",
              fontWeight: "600",
              color: "#FF6B00",
              textDecoration: "none",
              padding: "6px 14px",
              borderRadius: "8px",
              backgroundColor: "#FFF3EB",
            }}
          >
            Clear Search
          </Link>
        </div>
      )}

      <h2 className={styles.heading}>{heading}</h2>

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
    </section>
  );
};

export default AllAvailableRooms;
