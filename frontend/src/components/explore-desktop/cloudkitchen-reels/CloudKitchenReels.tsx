"use client";

import React from "react";
import Image, { StaticImageData } from "next/image";
import { Play } from "lucide-react";
import styles from "./CloudKitchenReels.module.css";

import reel1 from "./reel-1.jpg";
import reel2 from "./reel-2.jpg";
import reel3 from "./reel-3.jpg";
import reel4 from "./reel-4.jpg";
import reel5 from "./reel-5.jpg";
import reel6 from "./reel-6.jpg";
import reel7 from "./reel-7.jpg";
import reel8 from "./reel-8.jpg";

export interface ReelItem {
  id: string;
  name: string;
  subtitle: string;
  image: StaticImageData | string;
}

const DEFAULT_REELS: ReelItem[] = [
  {
    id: "reel-1",
    name: "Chef Arjun",
    subtitle: "Butter Chicken",
    image: reel1,
  },
  {
    id: "reel-2",
    name: "Biryani Hub",
    subtitle: "Dum Biryani",
    image: reel2,
  },
  {
    id: "reel-3",
    name: "Pizza Lab",
    subtitle: "Wood-fire Dough",
    image: reel3,
  },
  {
    id: "reel-4",
    name: "Wok Station",
    subtitle: "Pad Thai Flambé",
    image: reel4,
  },
  {
    id: "reel-5",
    name: "Dessert Bar",
    subtitle: "Chocolate Soufflé",
    image: reel5,
  },
  {
    id: "reel-6",
    name: "Taco Cloud",
    subtitle: "Crispy Birria",
    image: reel6,
  },
  {
    id: "reel-7",
    name: "Burger Bistro",
    subtitle: "Smashed Patties",
    image: reel7,
  },
  {
    id: "reel-8",
    name: "Sushi Zen",
    subtitle: "Hand-rolled Maki",
    image: reel8,
  },
];

export interface CloudKitchenReelsProps {
  heading?: string;
  reels?: ReelItem[];
  onReelClick?: (reel: ReelItem) => void;
}

export const CloudKitchenReels: React.FC<CloudKitchenReelsProps> = ({
  heading = "Cloud Kitchen Reels",
  reels = DEFAULT_REELS,
  onReelClick,
}) => {
  const handleItemClick = (reel: ReelItem) => {
    if (onReelClick) {
      onReelClick(reel);
    }
  };

  return (
    <section className={styles.sectionContainer} aria-label={heading}>
      <h2 className={styles.heading}>{heading}</h2>

      <div className={styles.reelsRow} role="region" aria-label="Chef Live Streams">
        {reels.map((reel) => (
          <button
            key={reel.id}
            type="button"
            className={styles.reelItem}
            onClick={() => handleItemClick(reel)}
            aria-label={`Watch ${reel.name} - ${reel.subtitle}`}
          >
            {/* Circular Ring with Avatar & Play Icon */}
            <div className={styles.avatarRing}>
              <div className={styles.imageInner}>
                <Image
                  src={reel.image}
                  alt={reel.name}
                  fill
                  sizes="86px"
                  className={styles.avatarImg}
                />
              </div>

              {/* Play Overlay */}
              <div className={styles.playOverlay}>
                <Play size={10} fill="#ffffff" color="#ffffff" className={styles.playIcon} />
              </div>
            </div>

            {/* Name and Subtitle */}
            <div className={styles.reelMeta}>
              <span className={styles.reelName} title={reel.name}>
                {reel.name}
              </span>
              <span className={styles.reelSubtitle} title={reel.subtitle}>
                {reel.subtitle}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default CloudKitchenReels;
