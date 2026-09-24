"use client";

import React, { useState, useEffect } from "react";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  X,
} from "lucide-react";
import { SearchResultsSection } from "@/components/explore-desktop/search-results";
import styles from "./ExploreMobileView.module.css";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { useLocation } from "@/components/location-provider";
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

import { useHomeData } from "@/lib/useHomeData";

export const ExploreMobileView: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryFilter = searchParams?.get("category") || "";
  const queryParam = searchParams?.get("query") || "";

  const { defaultAddress, openLocationModal } = useLocation();
  const homeData = useHomeData();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [selectedLang, setSelectedLang] = useState("en");
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [activeReelIndex, setActiveReelIndex] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (queryParam) {
      setSearchQuery(queryParam);
    } else {
      setSearchQuery("");
    }
  }, [queryParam]);

  // Filtered Kitchens
  const filteredKitchens = React.useMemo(() => {
    if (!categoryFilter && !queryParam) return [];
    let list = homeData.kitchens || [];
    if (categoryFilter) {
      const q = categoryFilter.toLowerCase();
      list = list.filter(
        (k) =>
          k.category?.toLowerCase().includes(q) ||
          k.name.toLowerCase().includes(q)
      );
    }
    if (queryParam) {
      const q = queryParam.toLowerCase().trim();
      list = list.filter(
        (k) =>
          k.name.toLowerCase().includes(q) ||
          k.category?.toLowerCase().includes(q) ||
          k.locality?.toLowerCase().includes(q) ||
          k.city?.toLowerCase().includes(q) ||
          k.pincode?.includes(q)
      );
    }
    return list;
  }, [homeData.kitchens, categoryFilter, queryParam]);

  // Filtered Food Items
  const filteredFoodItems = React.useMemo(() => {
    if (!categoryFilter && !queryParam) return [];
    let list = homeData.foodItems || [];
    if (categoryFilter) {
      const q = categoryFilter.toLowerCase();
      list = list.filter(
        (f) =>
          f.categoryName?.toLowerCase().includes(q) ||
          f.name.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q)
      );
    }
    if (queryParam) {
      const q = queryParam.toLowerCase().trim();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.sellerName.toLowerCase().includes(q) ||
          f.categoryName?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [homeData.foodItems, categoryFilter, queryParam]);

  // Filtered Rooms
  const filteredRooms = React.useMemo(() => {
    if (!categoryFilter && !queryParam) return [];
    let list = homeData.rooms || [];
    if (categoryFilter) {
      const q = categoryFilter.toLowerCase();
      if (q === "rooms" || q === "room") return list;
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.sellerLocality?.toLowerCase().includes(q) ||
          r.sellerCity?.toLowerCase().includes(q)
      );
    }
    if (queryParam) {
      const q = queryParam.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.sellerName.toLowerCase().includes(q) ||
          r.sellerLocality?.toLowerCase().includes(q) ||
          r.sellerCity?.toLowerCase().includes(q) ||
          r.sellerPincode?.includes(q)
      );
    }
    return list;
  }, [homeData.rooms, categoryFilter, queryParam]);

  const stories = React.useMemo(() => {
    return (homeData.kitchens || []).map((k) => ({
      id: k.id,
      name: k.name,
      avatar: k.imageUrl || "/images/places/place-biryani.png",
    }));
  }, [homeData.kitchens]);

  const reels: ReelModalData[] = React.useMemo(() => {
    return (homeData.kitchens || []).map((k, idx) => ({
      id: k.id,
      author: k.name,
      authorAvatar: k.imageUrl || "/images/places/place-biryani.png",
      thumbnail: k.imageUrl || "/images/places/place-biryani.png",
      caption: `${k.name} • Special Fresh Gourmet Preparation`,
      hashtags: "#cloudkitchen #foodie #delicious",
      partnerTitle: "Verified Cloud Kitchen Partner",
      likes: `${(3 + (idx % 4)).toFixed(1)}k`,
      views: `${(12 + idx * 2).toFixed(1)}k views`,
      audioTitle: `${k.name} • Original Audio`,
      verified: true,
      kitchenId: k.trackingId || k.id,
    }));
  }, [homeData.kitchens]);

  const featuredCollections = React.useMemo(() => {
    return (homeData.foodItems || []).slice(0, 4).map((f) => ({
      id: f.id,
      title: f.name,
      badge: f.price ? `₹${f.price}` : "Special",
      image: f.imageUrl || "/images/places/place-pizza.png",
      link: f.sellerTrackingId ? `/shop/${f.sellerTrackingId}` : `/explore-desktop?item=${f.id}`,
    }));
  }, [homeData.foodItems]);

  const mealMoments = React.useMemo(() => {
    const cardClasses = [
      styles.cardBreakfast,
      styles.cardLunch,
      styles.cardDinner,
      styles.cardSnacks,
      styles.cardLateNight,
      styles.cardDrinks,
    ];
    return (homeData.categories || []).slice(0, 6).map((c, idx) => ({
      id: c.id,
      tag: "Category",
      name: c.name,
      icon: c.image || "/images/categories/cat-food.png",
      cardClass: cardClasses[idx % cardClasses.length],
      isDark: idx % 2 === 1,
    }));
  }, [homeData.categories]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore-desktop?query=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/explore-desktop");
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
      prev !== null && prev < reels.length - 1 ? prev + 1 : 0
    );
  };

  const handlePrevReel = () => {
    setActiveReelIndex((prev) =>
      prev !== null && prev > 0 ? prev - 1 : reels.length - 1
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
              <div
                className={styles.locationContainer}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openLocationModal();
                }}
                style={{ cursor: "pointer" }}
                title="Choose Delivery Location"
              >
                <span>
                  {defaultAddress?.locality || defaultAddress?.city
                    ? `${defaultAddress.locality ? defaultAddress.locality + ", " : ""}${
                        defaultAddress.city || defaultAddress.pincode
                      }`
                    : defaultAddress?.pincode
                    ? `PIN: ${defaultAddress.pincode}`
                    : "Select Location"}
                </span>
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

          {/* Language Selector Pill with Dropdown (Commented out for now) */}
          {/*
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
          */}
        </div>
      </nav>

      {/* 2. Explore Title Section */}
      <div className={styles.exploreTitleSection}>
        <h1 className={styles.title}>Explore</h1>
        <p className={styles.subtitle}>Find your next favorite meal, restaurant, or stay</p>
      </div>

      {/* Interactive Mobile Search Bar */}
      <div style={{ padding: "0 16px 14px 16px" }}>
        <form
          onSubmit={handleSearchSubmit}
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#FFFFFF",
            borderRadius: "14px",
            padding: "8px 14px",
            border: "1.5px solid #FED7AA",
            boxShadow: "0 2px 8px rgba(249, 115, 22, 0.08)",
            gap: "10px",
          }}
        >
          <Search size={18} color="#FF6B00" />
          <input
            type="text"
            placeholder="Search restaurants, dishes, rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              width: "100%",
              fontSize: "14px",
              color: "#0F172A",
              backgroundColor: "transparent",
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                router.push("/explore-desktop");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#94A3B8",
                cursor: "pointer",
                padding: "2px",
                display: "flex",
                alignItems: "center",
              }}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
          <button
            type="submit"
            style={{
              backgroundColor: "#FF6B00",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              padding: "5px 12px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Go
          </button>
        </form>
      </div>

      {/* Search Results Section if Search or Category filter is active */}
      {(Boolean(categoryFilter) || Boolean(queryParam)) && (
        <div style={{ padding: "0 16px 24px 16px" }}>
          <SearchResultsSection
            searchQuery={queryParam}
            categoryFilter={categoryFilter}
            kitchens={filteredKitchens}
            foodItems={filteredFoodItems}
            rooms={filteredRooms}
            onClearSearch={() => {
              setSearchQuery("");
              router.push("/explore-desktop");
            }}
            onTagClick={(tag) => {
              setSearchQuery(tag);
              router.push(`/explore-desktop?query=${encodeURIComponent(tag)}`);
            }}
          />
        </div>
      )}

      {/* 3. Cloud Kitchen Reels */}
      {reels.length > 0 && (
        <section className={styles.reelsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Cloud Kitchen Reels</h2>
            <Link href="/explore-desktop" className={styles.seeAllLink}>See all</Link>
          </div>

          {/* Stories Creators Row */}
          {stories.length > 0 && (
            <div className={styles.storiesRow}>
              {stories.map((story, index) => (
                <div
                  key={story.id}
                  className={styles.storyItem}
                  onClick={() => setActiveReelIndex(index % reels.length)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setActiveReelIndex(index % reels.length);
                    }
                  }}
                  aria-label={`Watch story by ${story.name}`}
                >
                  <div className={styles.storyRing}>
                    <div className={styles.storyAvatarInner}>
                      <Image
                        src={story.avatar}
                        alt={story.name}
                        fill
                        className={styles.storyAvatarImg}
                      />
                    </div>
                  </div>
                  <span className={styles.storyName}>{story.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* 2x2 Reels Grid */}
          <div className={styles.reelsGrid}>
            {reels.slice(0, 4).map((reel, index) => (
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
      )}

      {/* 4. Featured Collections */}
      {featuredCollections.length > 0 && (
        <section className={styles.featuredSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Featured Collections</h2>
            <Link href="/explore-desktop" className={styles.seeAllLink}>See all</Link>
          </div>

          <div className={styles.collectionsGrid}>
            {featuredCollections.map((col) => (
              <article
                key={col.id}
                className={styles.collectionCard}
                onClick={() => router.push(col.link)}
                style={{ cursor: "pointer" }}
              >
                <Image
                  src={col.image}
                  alt={col.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 200px"
                  className={styles.collectionImg}
                />
                <div className={styles.collectionOverlay}>
                  <div className={styles.collectionTopRow}>
                    <span className={styles.pillBadge}>{col.badge}</span>
                    <button
                      className={styles.heartBtn}
                      onClick={(e) => toggleFavorite(col.id, e)}
                      aria-label="Favorite"
                    >
                      <Heart
                        size={16}
                        strokeWidth={2}
                        className={favorites[col.id] ? styles.heartIconActive : ""}
                      />
                    </button>
                  </div>
                  <h3 className={styles.collectionTitle}>{col.title}</h3>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* 5. What's on Your Mind? */}
      {mealMoments.length > 0 && (
        <section className={styles.mindSection}>
          <div className={styles.mindHeaderCol}>
            <h2 className={styles.mindTitle}>What’s on Your Mind?</h2>
            <p className={styles.mindSubtitle}>
              Pick a category to explore delicious options.
            </p>
          </div>

          <div className={styles.mindGrid}>
            {mealMoments.map((moment) => (
              <div
                key={moment.id}
                className={`${styles.momentCard} ${moment.cardClass}`}
                onClick={() => router.push(`/explore-desktop?category=${encodeURIComponent(moment.name.toLowerCase())}`)}
                style={{ cursor: "pointer" }}
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
                    width={32}
                    height={32}
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
      )}

      {/* 6. Full-Screen Reels Modal */}
      {reels.length > 0 && (
        <ReelModal
          isOpen={activeReelIndex !== null}
          onClose={() => setActiveReelIndex(null)}
          reel={activeReelIndex !== null ? reels[activeReelIndex] : null}
          onNext={handleNextReel}
          onPrev={handlePrevReel}
        />
      )}
    </div>
  );
};

export default ExploreMobileView;
