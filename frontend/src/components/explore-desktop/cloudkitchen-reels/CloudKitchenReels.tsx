"use client";

import React, { useState } from "react";
import Image, { StaticImageData } from "next/image";
import { Play } from "lucide-react";
import styles from "./CloudKitchenReels.module.css";
import { ReelModal, ReelModalData } from "../explore-mobile/ReelModal";

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
  kitchenId?: string;
}

export interface CloudKitchenReelsProps {
  heading?: string;
  reels?: ReelItem[];
  onReelClick?: (reel: ReelItem) => void;
}

export const CloudKitchenReels: React.FC<CloudKitchenReelsProps> = ({
  heading = "Cloud Kitchen Reels",
  reels,
  onReelClick,
}) => {
  const [activeReelIndex, setActiveReelIndex] = useState<number | null>(null);

  // Dynamically map reels into rich ReelModalData entries
  const modalReels: ReelModalData[] = React.useMemo(() => {
    if (!reels || reels.length === 0) return [];
    return reels.map((r, idx) => {
      return {
        id: r.id || `reel-${idx}`,
        author: r.name || "Cloud Kitchen Partner",
        authorAvatar: r.image || "/images/places/place-biryani.png",
        thumbnail: r.image || "/images/places/place-biryani.png",
        caption: `${r.subtitle || "Fresh gourmet preparation"} • Behind the scenes kitchen stream 🍳🔥`,
        hashtags: "#cloudkitchen #culinaryart #foodie #freshpreparation",
        partnerTitle: "Verified Kitchen Partner",
        likes: `${(2.1 + ((idx * 0.7) % 4)).toFixed(1)}k`,
        views: `${(11 + idx * 2.8).toFixed(1)}k views`,
        audioTitle: `${r.name} • Original Audio`,
        verified: true,
        kitchenId: r.kitchenId,
      };
    });
  }, [reels]);

  if (!reels || reels.length === 0) {
    return null;
  }

  const handleItemClick = (index: number, reel: ReelItem) => {
    if (onReelClick) {
      onReelClick(reel);
    } else {
      setActiveReelIndex(index);
    }
  };

  const handleNextReel = () => {
    setActiveReelIndex((prev) =>
      prev !== null && prev < modalReels.length - 1 ? prev + 1 : 0
    );
  };

  const handlePrevReel = () => {
    setActiveReelIndex((prev) =>
      prev !== null && prev > 0 ? prev - 1 : modalReels.length - 1
    );
  };

  return (
    <>
      <section className={styles.sectionContainer} aria-label={heading}>
        <h2 className={styles.heading}>{heading}</h2>

        <div className={styles.reelsRow} role="region" aria-label="Chef Live Streams">
          {reels.map((reel, index) => (
            <button
              key={reel.id}
              type="button"
              className={styles.reelItem}
              onClick={() => handleItemClick(index, reel)}
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

      {/* Full-Screen Reel Modal on Explore Page */}
      <ReelModal
        isOpen={activeReelIndex !== null}
        onClose={() => setActiveReelIndex(null)}
        reel={activeReelIndex !== null ? modalReels[activeReelIndex] : null}
        onNext={handleNextReel}
        onPrev={handlePrevReel}
      />
    </>
  );
};

export default CloudKitchenReels;
