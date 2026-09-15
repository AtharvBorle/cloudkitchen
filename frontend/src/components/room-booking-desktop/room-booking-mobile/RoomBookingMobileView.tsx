"use client";

import React, { useState } from "react";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import {
  Menu,
  Bell,
  Search,
  ChevronDown,
  Globe,
  Check,
  Star,
  Heart,
  MapPin,
} from "lucide-react";
import styles from "./RoomBookingMobileView.module.css";
import neoLivingImg from "../featured-colivings/neo-living-room.jpg";
import comfortStayImg from "../featured-colivings/comfort-stay-room.jpg";
import executiveDoubleImg from "../all-available-rooms/executive-double-room.jpg";
import premiumSingleImg from "../all-available-rooms/premium-single-room.jpg";
import logoImg from "@/components/navbar/logo-nav.png";
import { MobileSidebar } from "@/components/mobile-sidebar";

const LANG_OPTIONS = [
  { id: "hi", label: "Hindi", code: "HI" },
  { id: "mr", label: "Marathi", code: "MR" },
  { id: "en", label: "English", code: "EN" },
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

export interface MobileRoomCard {
  id: string;
  title: string;
  location: string;
  rating: number;
  reviewCount: number;
  overallScore?: number;
  price: string;
  tags: string[];
  image: StaticImageData | string;
  category: "all" | "single" | "shared" | "hostel" | "flat";
}

const SAMPLE_ROOMS: MobileRoomCard[] = [
  {
    id: "room-1",
    title: "Sunrise Co-Living PG for Boys",
    location: "Near MIT College Back Gate, Kothrud",
    rating: 4.2,
    reviewCount: 32,
    overallScore: 4.8,
    price: "₹5,500/month",
    tags: ["Wi-Fi", "AC", "Meals Included", "Laundry"],
    image: neoLivingImg,
    category: "shared",
  },
  {
    id: "room-2",
    title: "Green View Premium Hostel",
    location: "Ideal Colony, Kothrud",
    rating: 4.5,
    reviewCount: 112,
    price: "₹6,200/month",
    tags: ["Gym", "24/7 Security", "Meals Included"],
    image: comfortStayImg,
    category: "hostel",
  },
  {
    id: "room-3",
    title: "Cozy 1BHK Flat near Paud Road",
    location: "MIT College Area, Paud Road, Kothrud",
    rating: 4.0,
    reviewCount: 22,
    price: "₹12,000/month",
    tags: ["Full Furnished", "No Brokerage", "Parking"],
    image: executiveDoubleImg,
    category: "flat",
  },
  {
    id: "room-4",
    title: "Executive Single Private Suite",
    location: "Behind Cummins College, Karve Nagar",
    rating: 4.7,
    reviewCount: 45,
    price: "₹8,500/month",
    tags: ["Wi-Fi", "Attached Washroom", "Power Backup"],
    image: premiumSingleImg,
    category: "single",
  },
];

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "single", label: "Single Room" },
  { id: "shared", label: "Shared PG" },
  { id: "hostel", label: "Hostel" },
  { id: "flat", label: "1BHK Flat" },
];

export const RoomBookingMobileView: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLang, setSelectedLang] = useState("en");
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({
    "room-1": false,
    "room-2": false,
    "room-3": false,
    "room-4": false,
  });

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLangSelect = (id: string) => {
    setSelectedLang(id);
    setIsLangDropdownOpen(false);
  };

  const getSelectedLangCode = () => {
    const found = LANG_OPTIONS.find((l) => l.id === selectedLang);
    return found ? found.code : "EN";
  };

  const filteredRooms = SAMPLE_ROOMS.filter((room) => {
    const matchesCategory =
      selectedCategory === "all" || room.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={styles.mobileContainer}>
      {/* Slide-out Mobile Sidebar Drawer */}
      <MobileSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeItem="Rooms"
      />

      {/* 1. Top Navigation Bar (Logo, Location, Bell, Lang) matching Explore */}
      <nav className={styles.topNavRow} aria-label="Rooms Mobile Top Navigation">
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

      {/* 2. Room Title Section */}
      <div className={styles.roomTitleSection}>
        <h1 className={styles.title}>Cloud Bites Rooms</h1>
        <p className={styles.subtitle}>Find your ideal PG, hostel or flat</p>
      </div>

      {/* 3. Horizontal Category Filters */}
      <div className={styles.categoryScroller}>
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              className={`${styles.categoryPill} ${isActive ? styles.categoryPillActive : ""}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* 4. Promotional Banner Card */}
      <div className={styles.promoCard}>
        <div className={styles.promoContent}>
          <span className={styles.promoTag}>LIMITED TIME VERIFIED LISTINGS</span>
          <h3 className={styles.promoTitle}>Find Your Perfect Stay</h3>
          <p className={styles.promoSubtitle}>
            Browse over 200+ fully-furnished PGs & rooms near MIT & Kothrud colleges.
          </p>
        </div>
        <div className={styles.promoIllustration}>
          <span>🛏️</span>
        </div>
      </div>

      {/* 5. Section Header */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Featured Accommodation</h2>
        <span className={styles.seeAllLink}>See All</span>
      </div>

      {/* 6. Vertical Feed of Accommodation Cards */}
      <div className={styles.cardsList}>
        {filteredRooms.map((room) => {
          const isFav = !!favorites[room.id];
          return (
            <article key={room.id} className={styles.roomCard}>
              {/* Photo Box */}
              <div className={styles.imageBox}>
                <Image
                  src={room.image}
                  alt={room.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className={styles.roomImage}
                />

                {/* Rating Badge on Top Left */}
                <div className={styles.glassRatingBadge}>
                  <Star size={12} className={styles.starIcon} />
                  <span>
                    {room.rating} ({room.reviewCount})
                  </span>
                </div>

                {/* Heart / Favorite Toggle Button on Top Right */}
                <button
                  className={`${styles.heartBtn} ${isFav ? styles.heartBtnActive : ""}`}
                  onClick={(e) => toggleFavorite(room.id, e)}
                  aria-label="Save to favorites"
                >
                  <Heart
                    size={16}
                    strokeWidth={2}
                    className={isFav ? styles.heartIconFilled : ""}
                  />
                </button>
              </div>

              {/* Card Body */}
              <div className={styles.cardBody}>
                <div className={styles.cardTopRow}>
                  <h3 className={styles.cardTitle}>{room.title}</h3>
                  {room.overallScore && (
                    <div className={styles.greenRatingPill}>
                      <Star size={11} className={styles.greenStarIcon} />
                      <span>{room.overallScore}</span>
                    </div>
                  )}
                </div>

                <div className={styles.locationRow}>
                  <MapPin size={13} className={styles.pinIcon} />
                  <span>{room.location}</span>
                </div>

                <div className={styles.amenitiesRow}>
                  {room.tags.map((tag, idx) => (
                    <span key={idx} className={styles.amenityPill}>
                      {tag}
                    </span>
                  ))}
                </div>

                <div className={styles.cardBottomRow}>
                  <div className={styles.priceCol}>
                    <span className={styles.startingLabel}>STARTING FROM</span>
                    <span className={styles.priceValue}>{room.price}</span>
                  </div>

                  <button className={styles.bookBtn}>Book Room</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default RoomBookingMobileView;
