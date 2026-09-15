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

const DEFAULT_REELS: ReelItem[] = [
  {
    id: "reel-1",
    name: "Chef Arjun",
    subtitle: "Butter Chicken",
    image: reel1,
    kitchenId: "chef-arjun",
  },
  {
    id: "reel-2",
    name: "Biryani Hub",
    subtitle: "Dum Biryani",
    image: reel2,
    kitchenId: "biryani-hub",
  },
  {
    id: "reel-3",
    name: "Pizza Lab",
    subtitle: "Wood-fire Dough",
    image: reel3,
    kitchenId: "pizza-lab",
  },
  {
    id: "reel-4",
    name: "Wok Station",
    subtitle: "Pad Thai Flambé",
    image: reel4,
    kitchenId: "wok-station",
  },
  {
    id: "reel-5",
    name: "Dessert Bar",
    subtitle: "Chocolate Soufflé",
    image: reel5,
    kitchenId: "dessert-bar",
  },
  {
    id: "reel-6",
    name: "Taco Cloud",
    subtitle: "Crispy Birria",
    image: reel6,
    kitchenId: "taco-cloud",
  },
  {
    id: "reel-7",
    name: "Burger Bistro",
    subtitle: "Smashed Patties",
    image: reel7,
    kitchenId: "burger-bistro",
  },
  {
    id: "reel-8",
    name: "Sushi Zen",
    subtitle: "Hand-rolled Maki",
    image: reel8,
    kitchenId: "sushi-zen",
  },
];

const REELS_MODAL_ITEMS: ReelModalData[] = [
  {
    id: "reel-1",
    author: "Chef Arjun",
    authorAvatar: reel1,
    thumbnail: reel1,
    caption: "Making butter chicken from scratch",
    hashtags: "#homecooking #butterchicken",
    partnerTitle: "Cloud Kitchen Partner",
    likes: "2.4k",
    views: "12.4k views",
    audioTitle: "Chef Arjun • Original Audio",
    verified: true,
  },
  {
    id: "reel-2",
    author: "Biryani Hub",
    authorAvatar: reel2,
    thumbnail: reel2,
    caption: "Dum Biryani layered to perfection",
    hashtags: "#biryani #hyderabadi",
    partnerTitle: "Cloud Kitchen Partner",
    likes: "3.2k",
    views: "15.1k views",
    audioTitle: "Biryani Hub • Original Audio",
    verified: true,
  },
  {
    id: "reel-3",
    author: "Pizza Lab",
    authorAvatar: reel3,
    thumbnail: reel3,
    caption: "Fresh dough for our wood-fired pizzas 🍕",
    hashtags: "#pizzalovers #woodfire",
    partnerTitle: "Cloud Kitchen Partner",
    likes: "1.8k",
    views: "8.9k views",
    audioTitle: "Pizza Lab • Original Audio",
    verified: true,
  },
  {
    id: "reel-4",
    author: "Wok Station",
    authorAvatar: reel4,
    thumbnail: reel4,
    caption: "Pad Thai Flambé sizzling in the wok 🔥",
    hashtags: "#wok #streetfood",
    partnerTitle: "Cloud Kitchen Partner",
    likes: "4.1k",
    views: "19.8k views",
    audioTitle: "Wok Station • Original Audio",
    verified: true,
  },
  {
    id: "reel-5",
    author: "Dessert Bar",
    authorAvatar: reel5,
    thumbnail: reel5,
    caption: "Molten Chocolate Soufflé with gold dust",
    hashtags: "#dessert #chocolate",
    partnerTitle: "Cloud Kitchen Partner",
    likes: "5.6k",
    views: "22.4k views",
    audioTitle: "Dessert Bar • Original Audio",
    verified: true,
  },
  {
    id: "reel-6",
    author: "Taco Cloud",
    authorAvatar: reel6,
    thumbnail: reel6,
    caption: "Crispy Birria Tacos with rich dipping broth",
    hashtags: "#tacos #birria",
    partnerTitle: "Cloud Kitchen Partner",
    likes: "2.9k",
    views: "14.2k views",
    audioTitle: "Taco Cloud • Original Audio",
    verified: true,
  },
  {
    id: "reel-7",
    author: "Burger Bistro",
    authorAvatar: reel7,
    thumbnail: reel7,
    caption: "Smashed double beef patties with cheddar",
    hashtags: "#burgers #gourmet",
    partnerTitle: "Cloud Kitchen Partner",
    likes: "3.8k",
    views: "18.3k views",
    audioTitle: "Burger Bistro • Original Audio",
    verified: true,
  },
  {
    id: "reel-8",
    author: "Sushi Zen",
    authorAvatar: reel8,
    thumbnail: reel8,
    caption: "Hand-rolled Maki with fresh salmon & avocado",
    hashtags: "#sushi #japanese",
    partnerTitle: "Cloud Kitchen Partner",
    likes: "4.5k",
    views: "21.0k views",
    audioTitle: "Sushi Zen • Original Audio",
    verified: true,
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
  const [activeReelIndex, setActiveReelIndex] = useState<number | null>(null);

  // Dynamically map reels into rich ReelModalData entries
  const modalReels: ReelModalData[] = React.useMemo(() => {
    return reels.map((r, idx) => {
      const defaultMatch = REELS_MODAL_ITEMS.find(
        (m) => m.id === r.id || m.author.toLowerCase() === r.name.toLowerCase()
      );
      if (defaultMatch) {
        return {
          ...defaultMatch,
          author: r.name || defaultMatch.author,
          authorAvatar: r.image || defaultMatch.authorAvatar,
          thumbnail: r.image || defaultMatch.thumbnail,
          kitchenId: r.kitchenId,
        };
      }
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
