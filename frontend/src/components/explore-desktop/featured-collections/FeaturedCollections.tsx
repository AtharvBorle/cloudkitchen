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

export interface CollectionCardItem {
  id: string;
  author: string;
  avatarImg?: StaticImageData | string;
  title: string;
  views: string;
  image: StaticImageData | string;
}

const DEFAULT_COLLECTIONS: CollectionCardItem[] = [
  {
    id: "col-1",
    author: "Chef Arjun",
    avatarImg: chefArjunAvatar,
    title: "Making butter chicken from scratch 🍗",
    views: "12.4k views",
    image: butterChickenImg,
  },
  {
    id: "col-2",
    author: "Chef Yuki",
    avatarImg: chefYukiAvatar,
    title: "Perfect tonkotsu ramen at home 🍜",
    views: "18.2k views",
    image: tonkotsuRamenImg,
  },
  {
    id: "col-3",
    author: "Pizza Lab",
    title: "Wood-fired Margherita in 90 seconds 🍕",
    views: "8.9k views",
    image: woodfirePizzaImg,
  },
  {
    id: "col-4",
    author: "Chef Niran",
    title: "Authentic Thai green curry secrets 🌿",
    views: "15.7k views",
    image: thaiCurryImg,
  },
  {
    id: "col-5",
    author: "Maple & Co",
    title: "Fluffiest pancakes you'll ever make 🥞",
    views: "22.1k views",
    image: fluffyPancakesImg,
  },
  {
    id: "col-6",
    author: "Chef Rosa",
    title: "Street-style carne asada tacos 🌮",
    views: "9.6k views",
    image: carneAsadaTacosImg,
  },
  {
    id: "col-7",
    author: "Ocean Grill",
    title: "Crispy skin salmon done right 🐟",
    views: "14.3k views",
    image: crispySalmonImg,
  },
  {
    id: "col-8",
    author: "Cocoa Tales",
    title: "Molten chocolate lava cake tutorial 🍫",
    views: "31.5k views",
    image: moltenLavaCakeImg,
  },
];

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
  collections = DEFAULT_COLLECTIONS,
  onCardClick,
  onSeeAllClick,
}) => {
  const handleItemClick = (item: CollectionCardItem) => {
    if (onCardClick) {
      onCardClick(item);
    }
  };

  return (
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
        {collections.map((item) => (
          <article
            key={item.id}
            className={styles.collectionCard}
            onClick={() => handleItemClick(item)}
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
                <Play size={13} fill="#0f172a" color="#0f172a" className={styles.playIcon} />
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
  );
};

export default FeaturedCollections;
