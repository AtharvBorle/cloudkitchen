"use client";

import React from "react";
import Image, { StaticImageData } from "next/image";
import { Star, ArrowRight } from "lucide-react";
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
    title: "Executive Double Shari...",
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
  onBookNow?: (room: AvailableRoomItem) => void;
}

export const AllAvailableRooms: React.FC<AllAvailableRoomsProps> = ({
  heading = "All Available Rooms",
  rooms = DEFAULT_ROOMS,
  onBookNow,
}) => {
  const handleBookClick = (room: AvailableRoomItem) => {
    if (onBookNow) {
      onBookNow(room);
    }
  };

  return (
    <section
      className={styles.sectionContainer}
      aria-label={heading}
    >
      <h2 className={styles.heading}>{heading}</h2>

      <div className={styles.cardsGrid}>
        {rooms.map((room) => (
          <article key={room.id} className={styles.roomCard}>
            {/* Top Room Image */}
            <div className={styles.imageWrapper}>
              <Image
                src={room.image}
                alt={room.title}
                fill
                priority
                sizes="(max-width: 1400px) 33vw, 450px"
                className={styles.roomImg}
              />
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
