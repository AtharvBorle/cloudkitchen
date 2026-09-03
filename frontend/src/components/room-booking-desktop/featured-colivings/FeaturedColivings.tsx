"use client";

import React from "react";
import Image, { StaticImageData } from "next/image";
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

const DEFAULT_COLIVINGS: ColivingCardItem[] = [
  {
    id: "coliving-1",
    title: "Neo Living PG Space",
    location: "Behind MIT, Kothrud",
    startingLabel: "STARTING FROM",
    price: "₹5,500/month",
    tags: ["WiFi", "AC", "Meals Included", "Laundry"],
    buttonText: "Book Room",
    image: neoLivingImg,
  },
  {
    id: "coliving-2",
    title: "Comfort Stay co-living",
    location: "Ideal Colony, Pune",
    startingLabel: "STARTING FROM",
    price: "₹5,500/month",
    tags: ["WiFi", "AC", "Meals Included", "Laundry"],
    buttonText: "Book Room",
    image: comfortStayImg,
  },
  {
    id: "coliving-3",
    title: "Neo Living PG Space",
    location: "Behind MIT, Kothrud",
    startingLabel: "STARTING FROM",
    price: "₹5,500/month",
    tags: ["WiFi", "AC", "Meals Included", "Laundry"],
    buttonText: "Book Room",
    image: neoLivingImg,
  },
  {
    id: "coliving-4",
    title: "Comfort Stay co-living",
    location: "Ideal Colony, Pune",
    startingLabel: "STARTING FROM",
    price: "₹5,500/month",
    tags: ["WiFi", "AC", "Meals Included", "Laundry"],
    buttonText: "Book Room",
    image: comfortStayImg,
  },
];

export interface FeaturedColivingsProps {
  heading?: string;
  cards?: ColivingCardItem[];
  onBookRoom?: (card: ColivingCardItem) => void;
}

export const FeaturedColivings: React.FC<FeaturedColivingsProps> = ({
  heading = "Featured Premium co-livings",
  cards = DEFAULT_COLIVINGS,
  onBookRoom,
}) => {
  const handleBookClick = (card: ColivingCardItem) => {
    if (onBookRoom) {
      onBookRoom(card);
    }
  };

  return (
    <section
      className={styles.sectionContainer}
      aria-label={heading}
    >
      <h2 className={styles.heading}>{heading}</h2>

      <div className={styles.cardsGrid}>
        {cards.map((card) => (
          <article key={card.id} className={styles.colivingCard}>
            {/* Top Room Image */}
            <div className={styles.imageWrapper}>
              <Image
                src={card.image}
                alt={card.title}
                fill
                priority
                sizes="(max-width: 1400px) 50vw, 700px"
                className={styles.roomImg}
              />
            </div>

            {/* Card Body */}
            <div className={styles.cardBody}>
              {/* Row 1: Title & Location (Left) + Price Box (Right) */}
              <div className={styles.headerRow}>
                <div className={styles.titleLocation}>
                  <h3 className={styles.cardTitle}>{card.title}</h3>
                  <span className={styles.locationText}>{card.location}</span>
                </div>

                <div className={styles.priceBox}>
                  <span className={styles.startingLabel}>
                    {card.startingLabel}
                  </span>
                  <span className={styles.priceAmount}>{card.price}</span>
                </div>
              </div>

              {/* Row 2: Amenity Pills (Left) + Book Room Button (Right) */}
              <div className={styles.bottomRow}>
                <div className={styles.tagsRow}>
                  {card.tags.map((tag, idx) => (
                    <span key={idx} className={styles.tagPill}>
                      {tag}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  className={styles.bookBtn}
                  onClick={() => handleBookClick(card)}
                  aria-label={`${card.buttonText} for ${card.title}`}
                >
                  {card.buttonText}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default FeaturedColivings;
