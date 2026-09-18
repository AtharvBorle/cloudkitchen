"use client";

import React, { useState, useEffect } from "react";
import Image, { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/fetch-api";
import styles from "./FeaturedColivings.module.css";
import neoLivingImg from "./neo-living-room.jpg";
import comfortStayImg from "./comfort-stay-room.jpg";

export interface ColivingCardItem {
  id: string;
  title: string;
  location: string;
  startingLabel: string;
  price: string;
  tags: string[];
  buttonText: string;
  image: StaticImageData | string;
}

export interface FeaturedColivingsProps {
  heading?: string;
  cards?: ColivingCardItem[];
  rooms?: any[];
  onBookRoom?: (card: ColivingCardItem) => void;
}

export const FeaturedColivings: React.FC<FeaturedColivingsProps> = ({
  heading = "Featured Premium co-livings",
  cards: propCards,
  rooms: propRooms,
  onBookRoom,
}) => {
  const router = useRouter();
  const [dynamicCards, setDynamicCards] = useState<ColivingCardItem[]>([]);

  useEffect(() => {
    if (propRooms !== undefined) {
      if (!propRooms || propRooms.length === 0) {
        setDynamicCards([]);
        return;
      }
      const mapped: ColivingCardItem[] = propRooms.slice(0, 4).map((r: any, idx: number) => {
        let imgUrl: string | StaticImageData = idx % 2 === 0 ? neoLivingImg : comfortStayImg;
        if (r.images) {
          try {
            const parsed = typeof r.images === "string" ? JSON.parse(r.images) : r.images;
            if (Array.isArray(parsed) && parsed[0]) imgUrl = parsed[0];
          } catch {
            if (typeof r.images === "string" && r.images.startsWith("http")) imgUrl = r.images;
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

        return {
          id: r.id,
          title: r.title || "Room Listing",
          location: locStr,
          startingLabel: "STARTING FROM",
          price: `₹${Number(r.price || 0).toLocaleString("en-IN")}/night`,
          tags: tagsList.filter(Boolean),
          buttonText: "Book Room",
          image: imgUrl,
        };
      });
      setDynamicCards(mapped);
      return;
    }

    async function loadFeatured() {
      try {
        const res = await fetchApi("/api/public/rooms");
        if (res.ok) {
          const json = await res.json();
          const list = json.data || json;
          if (Array.isArray(list) && list.length > 0) {
            const mapped: ColivingCardItem[] = list.slice(0, 4).map((r: any, idx: number) => {
              let imgUrl: string | StaticImageData = idx % 2 === 0 ? neoLivingImg : comfortStayImg;
              if (r.images) {
                try {
                  const parsed = typeof r.images === "string" ? JSON.parse(r.images) : r.images;
                  if (Array.isArray(parsed) && parsed[0]) imgUrl = parsed[0];
                } catch {
                  if (typeof r.images === "string" && r.images.startsWith("http")) imgUrl = r.images;
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

              return {
                id: r.id,
                title: r.title || "Room Listing",
                location: locStr,
                startingLabel: "STARTING FROM",
                price: `₹${Number(r.price || 0).toLocaleString("en-IN")}/night`,
                tags: tagsList.filter(Boolean),
                buttonText: "Book Room",
                image: imgUrl,
              };
            });
            setDynamicCards(mapped);
          } else {
            setDynamicCards([]);
          }
        }
      } catch (err) {
        console.error("Failed to load featured rooms:", err);
      }
    }
    loadFeatured();
  }, [propRooms]);

  const displayCards = propCards || dynamicCards;

  if (!displayCards || displayCards.length === 0) {
    return null;
  }

  const handleBookClick = (card: ColivingCardItem) => {
    if (onBookRoom) {
      onBookRoom(card);
    } else {
      router.push(`/room-booking/${card.id}`);
    }
  };

  return (
    <section className={styles.sectionContainer} aria-label={heading}>
      <h2 className={styles.heading}>{heading}</h2>

      <div className={styles.cardsGrid}>
        {displayCards.map((card) => (
          <article key={card.id} className={styles.card}>
            {/* Top Room Image */}
            <div className={styles.imageWrapper}>
              {typeof card.image === "string" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={card.image}
                  alt={card.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  className={styles.cardImg}
                />
              ) : (
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  priority
                  sizes="(max-width: 1400px) 25vw, 340px"
                  className={styles.cardImg}
                />
              )}
            </div>

            {/* Card Body */}
            <div className={styles.cardBody}>
              <div className={styles.mainInfo}>
                <h3 className={styles.cardTitle} title={card.title}>
                  {card.title}
                </h3>
                <p className={styles.location}>{card.location}</p>

                {/* Price Box */}
                <div className={styles.priceBox}>
                  <span className={styles.startingLabel}>
                    {card.startingLabel}
                  </span>
                  <span className={styles.priceAmount}>{card.price}</span>
                </div>

                {/* Tags */}
                <div className={styles.tagsRow}>
                  {card.tags.map((tag, idx) => (
                    <span key={idx} className={styles.tagPill}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                className={styles.bookBtn}
                onClick={() => handleBookClick(card)}
                aria-label={`Book ${card.title}`}
              >
                {card.buttonText}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default FeaturedColivings;
