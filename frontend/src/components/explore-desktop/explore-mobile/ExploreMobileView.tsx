"use client";

import React, { useState } from "react";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Play,
  Eye,
  Heart,
  Menu,
  ChevronDown,
  Bell,
  Globe,
  Check,
} from "lucide-react";
import styles from "./ExploreMobileView.module.css";
import { MobileSidebar } from "@/components/mobile-sidebar";
import logoImg from "@/components/navbar/logo-nav.png";

const LANG_OPTIONS = [
  { id: "hi", label: "Hindi", code: "HI" },
  { id: "mr", label: "Marathi", code: "MR" },
  { id: "en", label: "English", code: "EN" },
];

import { ReelModal, ReelModalData } from "./ReelModal";

// Creator & Story Avatars
import chefArjunAvatar from "../featured-collections/chef-arjun-avatar.jpg";
import chefYukiAvatar from "../featured-collections/chef-yuki-avatar.jpg";

// Reel Thumbnails
import butterChickenImg from "../featured-collections/collection-butter-chicken.jpg";
import woodfirePizzaImg from "../featured-collections/collection-woodfire-pizza.jpg";
import reel1Img from "../cloudkitchen-reels/reel-1.jpg";
import reel2Img from "../cloudkitchen-reels/reel-2.jpg";

// Featured Collections
import streetFoodImg from "../curated-dining-collections/dining-street-food.jpg";
import fineDiningImg from "../curated-dining-collections/dining-fine-dining.jpg";

// What's on Your Mind Icons
import breakfastIcon from "../whats-on-your-mind/icon-breakfast.png";
import lunchIcon from "../whats-on-your-mind/icon-lunch.png";
import dinnerIcon from "../whats-on-your-mind/icon-dinner.png";
import snacksIcon from "../whats-on-your-mind/icon-snacks.png";
import lateNightIcon from "../whats-on-your-mind/icon-latenight.png";
import drinksIcon from "../whats-on-your-mind/icon-drinks.png";

// Vector Artworks matching the design
const BiryaniHubArtwork = () => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: "100%", height: "100%", display: "block" }}
  >
    <circle cx="50" cy="50" r="50" fill="#204a4d" />
    {/* Steam Swirls */}
    <path
      d="M44 26C42 22 46 19 44 15M50 24C48 20 52 17 50 13M56 26C54 22 58 19 56 15"
      stroke="#e0f2fe"
      strokeWidth="2.2"
      strokeLinecap="round"
      opacity="0.85"
    />
    {/* Rice Mound */}
    <ellipse cx="50" cy="48" rx="30" ry="17" fill="#f59e0b" />
    <ellipse cx="50" cy="46" rx="26" ry="14" fill="#fbbf24" />
    {/* Rice textures & spices */}
    <path
      d="M34 46C37 42 42 41 46 44C49 46 52 42 56 43C60 44 64 42 66 46"
      stroke="#d97706"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    <circle cx="42" cy="43" r="1.8" fill="#15803d" />
    <circle cx="58" cy="44" r="1.8" fill="#15803d" />
    <circle cx="50" cy="40" r="2.2" fill="#b91c1c" />
    <circle cx="48" cy="47" r="1.5" fill="#166534" />
    {/* Star Anise on Top */}
    <path
      d="M50 36L52 39L55 38L53 41L55 43L52 43L50 46L48 43L45 43L47 41L45 38L48 39Z"
      fill="#78350f"
    />
    {/* Bowl */}
    <path
      d="M20 48C20 48 24 74 50 74C76 74 80 48 80 48H20Z"
      fill="#ea580c"
    />
    {/* Bowl Rim */}
    <ellipse cx="50" cy="48" rx="30" ry="4.5" fill="#f8fafc" />
    <ellipse cx="50" cy="48" rx="28" ry="3.5" fill="#ea580c" />
    {/* Bowl Base */}
    <rect x="42" y="74" width="16" height="4" rx="2" fill="#f8fafc" />
  </svg>
);

const WokStationArtwork = () => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: "100%", height: "100%", display: "block" }}
  >
    <circle cx="50" cy="50" r="50" fill="#841c1c" />
    {/* Double Golden Ring */}
    <circle
      cx="50"
      cy="50"
      r="40"
      stroke="#f59e0b"
      strokeWidth="1.8"
      strokeDasharray="2 2"
      opacity="0.6"
    />
    <circle
      cx="50"
      cy="50"
      r="36"
      stroke="#f59e0b"
      strokeWidth="1.8"
      opacity="0.9"
    />
    {/* Smoke Swirls */}
    <path
      d="M45 28C43 23 47 20 45 16M52 26C50 21 54 18 52 14M58 28C56 23 60 20 58 16"
      stroke="#fde047"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.8"
    />
    {/* Wok Pan with Handle */}
    <path
      d="M30 48C30 63 46 68 58 64C68 60 70 48 70 48L30 48Z"
      fill="#d97706"
      stroke="#fde047"
      strokeWidth="2"
    />
    {/* Handle */}
    <path
      d="M68 49L80 43"
      stroke="#fde047"
      strokeWidth="4"
      strokeLinecap="round"
    />
    {/* Flames under Wok */}
    <path
      d="M38 68C38 68 41 62 44 64C47 66 48 60 52 65C56 61 58 66 62 67C59 72 41 72 38 68Z"
      fill="#f59e0b"
    />
    <path
      d="M42 68C42 68 45 64 47 65C49 66 50 63 53 66C50 69 43 69 42 68Z"
      fill="#fef08a"
    />
  </svg>
);

interface StoryCreator {
  id: string;
  name: string;
  avatar?: StaticImageData | string;
  customSvg?: React.ReactNode;
}

const STORIES: StoryCreator[] = [
  {
    id: "s1",
    name: "Chef Arjun",
    avatar: chefArjunAvatar,
  },
  {
    id: "s2",
    name: "Biryani Hub",
    customSvg: <BiryaniHubArtwork />,
  },
  {
    id: "s3",
    name: "Pizza Lab",
    avatar: chefYukiAvatar,
  },
  {
    id: "s4",
    name: "Wok Station",
    customSvg: <WokStationArtwork />,
  },
];

const REELS: ReelModalData[] = [
  {
    id: "r1",
    author: "Chef Arjun",
    authorAvatar: chefArjunAvatar,
    thumbnail: butterChickenImg,
    caption: "Making butter chicken from scratch",
    hashtags: "#homecooking #butterchicken",
    partnerTitle: "Cloud Kitchen Partner",
    likes: "2.4k",
    views: "12.4k views",
    audioTitle: "Chef Arjun • Original Audio",
    verified: true,
  },
  {
    id: "r2",
    author: "Pizza Lab",
    authorAvatar: chefYukiAvatar,
    thumbnail: woodfirePizzaImg,
    caption: "Fresh dough for our wood-fired pizzas 🍕",
    hashtags: "#pizzalovers #woodfire",
    partnerTitle: "Cloud Kitchen Partner",
    likes: "1.8k",
    views: "8.9k views",
    audioTitle: "Pizza Lab • Original Audio",
    verified: true,
  },
  {
    id: "r3",
    author: "Chef Arjun",
    authorAvatar: chefArjunAvatar,
    thumbnail: reel1Img,
    caption: "Making butter chicken from scratch",
    hashtags: "#homecooking #butterchicken",
    partnerTitle: "Cloud Kitchen Partner",
    likes: "2.4k",
    views: "12.4k views",
    audioTitle: "Chef Arjun • Original Audio",
    verified: true,
  },
  {
    id: "r4",
    author: "Pizza Lab",
    authorAvatar: chefYukiAvatar,
    thumbnail: reel2Img,
    caption: "Fresh dough for our wood-fired pizzas 🍕",
    hashtags: "#pizzalovers #woodfire",
    partnerTitle: "Cloud Kitchen Partner",
    likes: "1.8k",
    views: "8.9k views",
    audioTitle: "Pizza Lab • Original Audio",
    verified: true,
  },
];

interface MealMoment {
  id: string;
  tag: string;
  name: string;
  icon: StaticImageData | string;
  cardClass: string;
  isDark?: boolean;
}

const MEAL_MOMENTS: MealMoment[] = [
  {
    id: "m1",
    tag: "Morning",
    name: "Breakfast",
    icon: breakfastIcon,
    cardClass: styles.cardBreakfast,
  },
  {
    id: "m2",
    tag: "Midday",
    name: "Lunch",
    icon: lunchIcon,
    cardClass: styles.cardLunch,
  },
  {
    id: "m3",
    tag: "Evening",
    name: "Dinner",
    icon: dinnerIcon,
    cardClass: styles.cardDinner,
  },
  {
    id: "m4",
    tag: "Anytime",
    name: "Snacks",
    icon: snacksIcon,
    cardClass: styles.cardSnacks,
  },
  {
    id: "m5",
    tag: "Late night",
    name: "Late Night",
    icon: lateNightIcon,
    cardClass: styles.cardLateNight,
    isDark: true,
  },
  {
    id: "m6",
    tag: "Refresh",
    name: "Drinks",
    icon: drinksIcon,
    cardClass: styles.cardDrinks,
  },
];

// Orange 3-Slider Filter Icon matching design
const SlidersIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 21V14M4 10V3M12 21V12M12 8V3M20 21V16M20 12V3M1 14H7M9 8H15M17 16H23"
      stroke="#f97316"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ExploreMobileView: React.FC = () => {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLang, setSelectedLang] = useState("en");
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [activeReelIndex, setActiveReelIndex] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({
    c1: false,
    c2: false,
  });

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore-desktop?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLangSelect = (id: string) => {
    setSelectedLang(id);
    setIsLangDropdownOpen(false);
  };

  const getSelectedLangCode = () => {
    const found = LANG_OPTIONS.find((l) => l.id === selectedLang);
    return found ? found.code : "EN";
  };

  const handleNextReel = () => {
    setActiveReelIndex((prev) =>
      prev !== null && prev < REELS.length - 1 ? prev + 1 : 0
    );
  };

  const handlePrevReel = () => {
    setActiveReelIndex((prev) =>
      prev !== null && prev > 0 ? prev - 1 : REELS.length - 1
    );
  };

  return (
    <div className={styles.mobileContainer}>
      {/* Slide-out Mobile Sidebar Drawer */}
      <MobileSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeItem="Explore"
      />

      {/* 1. Top Navigation Bar (Logo, Location, Bell, Lang) */}
      <nav className={styles.topNavRow} aria-label="Explore Mobile Top Navigation">
        <div className={styles.navLeftGroup}>
          <button
            className={styles.menuBtn}
            aria-label="Open navigation menu"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} strokeWidth={2.2} />
          </button>

          <Link href="/" className={styles.brandLink}>
            <div className={styles.logoWrapper}>
              <Image
                src={logoImg}
                alt="Cloud Kitchen Logo"
                width={40}
                height={40}
                className={styles.logoImage}
                priority
              />
            </div>
            <div className={styles.brandInfo}>
              <span className={styles.brandTitle}>Cloud Kitchen</span>
              <div className={styles.locationContainer}>
                <span>Kothrud, Pune</span>
                <ChevronDown size={14} />
              </div>
            </div>
          </Link>
        </div>

        <div className={styles.navRightGroup}>
          {/* Notification Bell Button */}
          <button
            type="button"
            className={styles.bellBtn}
            aria-label="Notifications"
          >
            <Bell size={20} strokeWidth={2} />
          </button>

          {/* Language Selector Pill with Dropdown */}
          <div className={styles.langWrapper}>
            <button
              type="button"
              className={styles.langBtn}
              onClick={() => setIsLangDropdownOpen((prev) => !prev)}
              aria-label={`Language: ${getSelectedLangCode()}`}
              aria-expanded={isLangDropdownOpen}
            >
              <Globe size={20} strokeWidth={2.2} />
            </button>

            {isLangDropdownOpen && (
              <>
                <div
                  className={styles.langBackdrop}
                  onClick={() => setIsLangDropdownOpen(false)}
                />
                <div className={styles.langDropdown} role="menu">
                  {LANG_OPTIONS.map((option) => {
                    const isSelected = selectedLang === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        className={`${styles.langItem} ${
                          isSelected ? styles.langItemActive : ""
                        }`}
                        onClick={() => handleLangSelect(option.id)}
                        role="menuitem"
                      >
                        <span className={styles.langLabel}>{option.label}</span>
                        {isSelected && (
                          <Check size={18} color="#16A34A" strokeWidth={2.8} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 2. Explore Title Section */}
      <div className={styles.exploreTitleSection}>
        <h1 className={styles.title}>Explore</h1>
        <p className={styles.subtitle}>Find your next favorite meal</p>
      </div>

      {/* 3. Search Bar (Full Width, No Veg Toggle) */}
      <form onSubmit={handleSearchSubmit} className={styles.searchWrapper}>
        <Search size={19} strokeWidth={2.2} className={styles.searchIcon} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search cuisines, dishes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="submit" className={styles.filterBtn} aria-label="Filters">
          <SlidersIcon />
        </button>
      </form>

      {/* 3. Cloud Kitchen Reels */}
      <section className={styles.reelsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Cloud Kitchen Reels</h2>
          <span className={styles.seeAllLink}>See all</span>
        </div>

        {/* Stories Creators Row */}
        <div className={styles.storiesRow}>
          {STORIES.map((story, index) => (
            <div
              key={story.id}
              className={styles.storyItem}
              onClick={() => setActiveReelIndex(index % REELS.length)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setActiveReelIndex(index % REELS.length);
                }
              }}
              aria-label={`Watch story by ${story.name}`}
            >
              <div className={styles.storyRing}>
                <div className={styles.storyAvatarInner}>
                  {story.avatar ? (
                    <Image
                      src={story.avatar}
                      alt={story.name}
                      fill
                      className={styles.storyAvatarImg}
                    />
                  ) : (
                    story.customSvg
                  )}
                </div>
              </div>
              <span className={styles.storyName}>{story.name}</span>
            </div>
          ))}
        </div>

        {/* 2x2 Reels Grid */}
        <div className={styles.reelsGrid}>
          {REELS.map((reel, index) => (
            <article
              key={reel.id}
              className={styles.reelCard}
              onClick={() => setActiveReelIndex(index)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setActiveReelIndex(index);
                }
              }}
              aria-label={`Open reel: ${reel.caption}`}
            >
              <Image
                src={reel.thumbnail}
                alt={reel.caption}
                fill
                sizes="(max-width: 768px) 50vw, 200px"
                className={styles.reelThumbnail}
              />
              <div className={styles.reelOverlay}>
                <div className={styles.reelTopRow}>
                  <div className={reel.author ? styles.reelAuthor : ""}>
                    <div className={styles.reelAuthorAvatar}>
                      <Image
                        src={reel.authorAvatar}
                        alt={reel.author}
                        fill
                        className={styles.storyAvatarImg}
                      />
                    </div>
                    <span className={styles.reelAuthorName}>{reel.author}</span>
                  </div>
                  <div className={styles.reelPlayBtn}>
                    <Play size={10} className={styles.playIcon} />
                  </div>
                </div>

                <div className={styles.reelBottomCol}>
                  <p className={styles.reelCaption}>{reel.caption}</p>
                  <div className={styles.reelViews}>
                    <Eye size={11} />
                    <span>{reel.views}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 4. Featured Collections */}
      <section className={styles.featuredSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Featured Collections</h2>
          <span className={styles.seeAllLink}>See all</span>
        </div>

        <div className={styles.collectionsGrid}>
          {/* Card 1: Budget Friendly Meals */}
          <article className={styles.collectionCard}>
            <Image
              src={streetFoodImg}
              alt="Budget Friendly Meals"
              fill
              sizes="(max-width: 768px) 50vw, 200px"
              className={styles.collectionImg}
            />
            <div className={styles.collectionOverlay}>
              <div className={styles.collectionTopRow}>
                <span className={styles.pillBadge}>Under ₹149</span>
                <button
                  className={styles.heartBtn}
                  onClick={(e) => toggleFavorite("c1", e)}
                  aria-label="Favorite"
                >
                  <Heart
                    size={16}
                    strokeWidth={2}
                    className={favorites["c1"] ? styles.heartIconActive : ""}
                  />
                </button>
              </div>
              <h3 className={styles.collectionTitle}>Budget Friendly Meals</h3>
            </div>
          </article>

          {/* Card 2: Premium Dining */}
          <article className={styles.collectionCard}>
            <Image
              src={fineDiningImg}
              alt="Premium Dining"
              fill
              sizes="(max-width: 768px) 50vw, 200px"
              className={styles.collectionImg}
            />
            <div className={styles.collectionOverlay}>
              <div className={styles.collectionTopRow}>
                <span className={styles.pillBadge}>Fine dining</span>
                <button
                  className={styles.heartBtn}
                  onClick={(e) => toggleFavorite("c2", e)}
                  aria-label="Favorite"
                >
                  <Heart
                    size={16}
                    strokeWidth={2}
                    className={favorites["c2"] ? styles.heartIconActive : ""}
                  />
                </button>
              </div>
              <h3 className={styles.collectionTitle}>Premium Dining</h3>
            </div>
          </article>
        </div>
      </section>

      {/* 5. What's on Your Mind? */}
      <section className={styles.mindSection}>
        <div className={styles.mindHeaderCol}>
          <h2 className={styles.mindTitle}>What’s on Your Mind?</h2>
          <p className={styles.mindSubtitle}>
            Pick a meal moment to explore curated options.
          </p>
        </div>

        <div className={styles.mindGrid}>
          {MEAL_MOMENTS.map((moment) => (
            <div
              key={moment.id}
              className={`${styles.momentCard} ${moment.cardClass}`}
            >
              <span
                className={`${styles.momentTag} ${moment.isDark ? styles.momentTagDark : ""}`}
              >
                {moment.tag}
              </span>

              <div className={styles.momentBottomRow}>
                <Image
                  src={moment.icon}
                  alt={moment.name}
                  className={styles.momentIconImg}
                />
                <span
                  className={`${styles.momentName} ${moment.isDark ? styles.momentNameLight : ""}`}
                >
                  {moment.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Full-Screen Reels Modal */}
      <ReelModal
        isOpen={activeReelIndex !== null}
        onClose={() => setActiveReelIndex(null)}
        reel={activeReelIndex !== null ? REELS[activeReelIndex] : null}
        onNext={handleNextReel}
        onPrev={handlePrevReel}
      />
    </div>
  );
};

export default ExploreMobileView;
