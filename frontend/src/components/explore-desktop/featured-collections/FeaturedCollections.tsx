"use client";

import React from "react";
import Image, { StaticImageData } from "next/image";
import { Play, Eye } from "lucide-react";
import styles from "./FeaturedCollections.module.css";

import butterChickenImg from "./collection-butter-chicken.jpg";
import tonkotsuRamenImg from "./collection-tonkotsu-ramen.jpg";
import woodfirePizzaImg from "./collection-woodfire-pizza.jpg";
import thaiCurryImg from "./collection-thai-curry.jpg";
import fluffyPancakesImg from "./collection-fluffy-pancakes.jpg";
import carneAsadaTacosImg from "./collection-carne-asada-tacos.jpg";
import crispySalmonImg from "./collection-crispy-salmon.jpg";
import moltenLavaCakeImg from "./collection-molten-lava-cake.jpg";

import chefArjunAvatar from "./chef-arjun-avatar.jpg";
import chefYukiAvatar from "./chef-yuki-avatar.jpg";

import { ReelModal, ReelModalData } from "../explore-mobile/ReelModal";

export interface CollectionCardItem {
  id: string;
  author: string;
  avatarImg?: StaticImageData | string;
  title: string;
  views: string;
  image: StaticImageData | string;
  kitchenId?: string;
}

export interface FeaturedCollectionsProps {
  heading?: string;
  subheading?: string;
  seeAllText?: string;
  collections?: CollectionCardItem[];
  onCardClick?: (item: CollectionCardItem) => void;
  onSeeAllClick?: () => void;
}

export const FeaturedCollections: React.FC<FeaturedCollectionsProps> = ({
  heading = "Featured Collections",
  subheading = "Hand-curated food groupings tailored for your dining preferences",
  seeAllText = "See all",
  collections,
  onCardClick,
  onSeeAllClick,
}) => {
  const [activeCollectionIndex, setActiveCollectionIndex] = React.useState<number | null>(null);

  // Map collections into ReelModalData
  const modalReels: ReelModalData[] = React.useMemo(() => {
    if (!collections || collections.length === 0) return [];
    return collections.map((item, idx) => ({
      id: item.id || `collection-${idx}`,
      author: item.author || "Featured Chef",
      authorAvatar: item.avatarImg || item.image,
      thumbnail: item.image,
      caption: `${item.title} • Live recipe & step-by-step masterclass`,
      hashtags: "#foodie #recipevideo #chefsecrets #cloudkitchen",
      partnerTitle: "Featured Culinary Master",
      likes: `${(3.2 + ((idx * 0.8) % 5)).toFixed(1)}k`,
      views: item.views || "14.2k views",
      audioTitle: `${item.author} • Original Cooking Audio`,
      verified: true,
      kitchenId: item.kitchenId,
    }));
  }, [collections]);

  if (!collections || collections.length === 0) {
    return null;
  }

  const handleItemClick = (index: number, item: CollectionCardItem) => {
    if (onCardClick) {
      onCardClick(item);
    } else {
      setActiveCollectionIndex(index);
    }
  };

  const handleNext = () => {
    setActiveCollectionIndex((prev) =>
      prev !== null && prev < modalReels.length - 1 ? prev + 1 : 0
    );
  };

  const handlePrev = () => {
    setActiveCollectionIndex((prev) =>
      prev !== null && prev > 0 ? prev - 1 : modalReels.length - 1
    );
  };

  return (
    <>
      <section className={styles.sectionContainer} aria-label={heading}>
        {/* 1. Section Header Row */}
        <div className={styles.headerRow}>
          <div className={styles.headerText}>
            <h2 className={styles.heading}>{heading}</h2>
            <p className={styles.subheading}>{subheading}</p>
          </div>

          <button
            type="button"
            className={styles.seeAllLink}
            onClick={onSeeAllClick}
          >
            {seeAllText}
          </button>
        </div>

        {/* 2. 4-Column x 2-Row Collections Grid */}
        <div className={styles.collectionsGrid}>
          {collections.map((item, index) => (
            <article
              key={item.id}
              className={styles.collectionCard}
              onClick={() => handleItemClick(index, item)}
              tabIndex={0}
              role="button"
              aria-label={item.title}
            >
              {/* Background Image */}
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 1400px) 25vw, 350px"
                className={styles.cardBgImage}
              />

              {/* Gradient Overlays */}
              <div className={styles.gradientOverlay} />

              {/* Top Badge & Play Button */}
              <div className={styles.topRow}>
                <div className={styles.authorPill}>
                  {item.avatarImg ? (
                    <div className={styles.authorAvatar}>
                      <Image
                        src={item.avatarImg}
                        alt={item.author}
                        fill
                        sizes="24px"
                        className={styles.avatarImg}
                      />
                    </div>
                  ) : (
                    <div className={styles.avatarDot}>
                      {item.author.charAt(0)}
                    </div>
                  )}
                  <span className={styles.authorName}>{item.author}</span>
                </div>

                <div className={styles.playBtn} aria-label="Play video">
                  <Play size={16} strokeWidth={2.5} fill="none" color="#0f172a" className={styles.playIcon} />
                </div>
              </div>

              {/* Bottom Title & Views */}
              <div className={styles.bottomArea}>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <div className={styles.viewsCount}>
                  <Eye size={12} />
                  <span>{item.views}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Full-Screen Video Recipe Modal */}
      <ReelModal
        isOpen={activeCollectionIndex !== null}
        onClose={() => setActiveCollectionIndex(null)}
        reel={activeCollectionIndex !== null ? modalReels[activeCollectionIndex] : null}
        onNext={handleNext}
        onPrev={handlePrev}
      />
    </>
  );
};

export default FeaturedCollections;
