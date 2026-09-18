"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Grid,
  MapPin,
  Star,
  Wifi,
  Tv,
  Car,
  Clock,
  ChefHat,
  Droplets,
  Zap,
  ShieldCheck,
  Calendar,
  User,
  Info,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Navbar, NavbarProps } from "@/components/navbar";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { Menu, ArrowLeft } from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";
import { Footer } from "@/components/explore-desktop/footer";
import styles from "./RoomDetailDesktop.module.css";
import roomGalleryBanner from "./room-gallery-banner.png";
import roomImg1 from "../featured-colivings/neo-living-room.jpg";
import roomImg2 from "../featured-colivings/comfort-stay-room.jpg";
import roomImg3 from "../all-available-rooms/premium-single-room.jpg";
import roomImg4 from "../all-available-rooms/executive-double-room.jpg";

export interface ReviewItem {
  id: string;
  name: string;
  avatarLetter: string;
  date: string;
  rating: number;
  comment: string;
}

export interface RoomDetailData {
  id: string;
  name: string;
  roomTag?: string;
  rating: number;
  reviewsCount: string;
  location: string;
  address?: string;
  city: string;
  pricePerMonth: string;
  availableFrom: string;
  roomSize: string;
  occupancy: string;
  floor: string;
  furnished: string;
  depositAmount: string;
  description: string;
  amenities: { name: string; icon: string }[];
  houseRules?: string[];
  reviews?: ReviewItem[];
  images?: string[];
  priceBreakdown: {
    roomCharges: string;
    serviceFee: string;
    cleaningFee: string;
    total: string;
  };
}

export interface RoomDetailDesktopProps {
  roomId?: string;
  navbarProps?: NavbarProps;
  roomData?: RoomDetailData;
  children?: React.ReactNode;
}

const DEFAULT_ROOM_DATA: RoomDetailData = {
  id: "sunrise-pg-kothamangalam",
  name: "Sunrise Co-Living PG for Boys",
  roomTag: "Single Room",
  rating: 4.2,
  reviewsCount: "(128 reviews)",
  location: "Main SBT College Back Gate, Kothamangalam",
  city: "Kothamangalam",
  pricePerMonth: "₹5,500",
  availableFrom: "Oct 15, 2026",
  roomSize: "120 sq ft",
  occupancy: "Single",
  floor: "Ground Floor",
  furnished: "Fully Furnished",
  depositAmount: "₹10,000",
  description:
    "Sunrise Co-Living PG offers comfortable and affordable living spaces for students and working professionals. Located just steps from SBT College, this PG provides a safe, clean, and well-maintained environment with all essential amenities.",
  amenities: [
    { name: "WiFi", icon: "wifi" },
    { name: "AC", icon: "ac" },
    { name: "Parking", icon: "parking" },
    { name: "Laundry", icon: "laundry" },
    { name: "Kitchen", icon: "kitchen" },
    { name: "Hot Water", icon: "hotwater" },
    { name: "Power Backup", icon: "power" },
    { name: "CCTV Security", icon: "security" },
  ],
  houseRules: [
    "No smoking inside rooms",
    "Visitors allowed till 9 PM",
    "Quiet hours: 10 PM – 7 AM",
    "Keep common areas clean",
  ],
  reviews: [
    {
      id: "1",
      name: "Priya S.",
      avatarLetter: "P",
      date: "2 months ago",
      rating: 4.5,
      comment: "Great location and clean rooms. The staff is very helpful. WiFi could be better though.",
    },
    {
      id: "2",
      name: "Rahul K.",
      avatarLetter: "R",
      date: "1 month ago",
      rating: 4.0,
      comment: "Good value for money. Food quality is decent. Maintenance team responds quickly.",
    },
  ],
  priceBreakdown: {
    roomCharges: "₹2,750",
    serviceFee: "₹250",
    cleaningFee: "₹150",
    total: "₹2,835",
  },
};

export const RoomDetailDesktop: React.FC<RoomDetailDesktopProps> = ({
  roomId,
  navbarProps,
  roomData: propRoomData,
  children,
}) => {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [checkInDate, setCheckInDate] = useState("Oct 15, 2026");
  const [checkOutDate, setCheckOutDate] = useState("Oct 30, 2026");
  const [guestCount, setGuestCount] = useState("1 Guest");
  const [fetchedRoomData, setFetchedRoomData] = useState<RoomDetailData | null>(null);
  const [loading, setLoading] = useState(Boolean(roomId));

  useEffect(() => {
    if (!roomId) return;
    async function loadRoomDetails() {
      try {
        setLoading(true);
        const res = await fetchApi(`/api/public/rooms/${roomId}`);
        if (res.ok) {
          const json = await res.json();
          const r = json.data || json;
          if (r) {
            const cap = Number(r.capacity) || 1;
            const price = Number(r.price) || 2800;
            const locality = r.sellerLocality || r.seller?.addressLocality || "Kothrud";
            const city = r.sellerCity || r.seller?.user?.city || "Pune";

            setFetchedRoomData({
              id: r.id,
              name: r.title || "Deluxe AC Room",
              roomTag: cap === 1 ? "Single Room" : cap === 2 ? "Double Sharing" : `${cap} Guests Sharing`,
              rating: Number(r.rating || 4.8),
              reviewsCount: `(${r.reviewCount || r.reviews?.length || 12} reviews)`,
              location: `${locality}, ${city}`,
              address: r.sellerLandmark ? `${locality} (Near ${r.sellerLandmark})` : locality,
              city: city,
              pricePerMonth: `₹${price.toLocaleString("en-IN")}`,
              availableFrom: "Immediate / Today",
              roomSize: `${cap * 120} sq ft`,
              occupancy: cap === 1 ? "Single" : `${cap} Persons`,
              floor: "1st Floor",
              furnished: "Fully Furnished",
              depositAmount: `₹${(price * 2).toLocaleString("en-IN")}`,
              description:
                r.description ||
                "Comfortable, modern and secure living space with quality fittings, high-speed WiFi, dedicated desk, and power backup.",
              amenities: [
                { name: "WiFi", icon: "wifi" },
                { name: "AC", icon: "ac" },
                { name: "Daily Cleaning", icon: "kitchen" },
                { name: "Hot Water", icon: "hotwater" },
                { name: "Power Backup", icon: "power" },
                { name: "CCTV Security", icon: "security" },
              ],
              houseRules: [
                "No smoking inside room premises",
                "Visitors allowed during daytime hours",
                "Maintain cleanliness in common spaces",
              ],
              sellerId: r.sellerId || r.seller?.id,
              sellerName: r.seller?.restaurantName || r.sellerName || "Host",
              capacity: cap,
              images: r.images,
              reviews: r.reviews?.length > 0 ? r.reviews : DEFAULT_ROOM_DATA.reviews,
              priceBreakdown: {
                roomCharges: `₹${price.toLocaleString("en-IN")}`,
                serviceFee: "₹150",
                cleaningFee: "₹100",
                total: `₹${(price + 250).toLocaleString("en-IN")}`,
              },
            });
          }
        }
      } catch (err) {
        console.error("Failed to load room details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadRoomDetails();
  }, [roomId]);

  const roomData = propRoomData || fetchedRoomData || DEFAULT_ROOM_DATA;

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);

  const allGalleryImages = React.useMemo(() => {
    let list: string[] = [];
    if (roomData.images) {
      if (typeof roomData.images === "string") {
        try {
          const parsed = JSON.parse(roomData.images);
          if (Array.isArray(parsed)) list = parsed;
          else if (typeof parsed === "string") list = [parsed];
        } catch {
          if (roomData.images.startsWith("http") || roomData.images.startsWith("/")) {
            list = [roomData.images];
          }
        }
      } else if (Array.isArray(roomData.images)) {
        list = roomData.images.map((img: any) => (typeof img === "string" ? img : img?.src || ""));
      }
    }
    const cleanList = list.filter((u) => typeof u === "string" && u.trim().length > 0 && !u.startsWith("["));
    if (cleanList.length > 0) {
      return cleanList;
    }
    return [
      typeof roomGalleryBanner === "string" ? roomGalleryBanner : roomGalleryBanner.src,
      typeof roomImg1 === "string" ? roomImg1 : roomImg1.src,
      typeof roomImg2 === "string" ? roomImg2 : roomImg2.src,
      typeof roomImg3 === "string" ? roomImg3 : roomImg3.src,
      typeof roomImg4 === "string" ? roomImg4 : roomImg4.src,
    ].filter(Boolean);
  }, [roomData.images]);

  useEffect(() => {
    if (!isGalleryOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsGalleryOpen(false);
      } else if (e.key === "ArrowLeft") {
        setActivePhotoIdx((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        setActivePhotoIdx((prev) => Math.min(allGalleryImages.length - 1, prev + 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isGalleryOpen, allGalleryImages.length]);

  const renderAmenityIcon = (iconName: string) => {
    switch (iconName) {
      case "wifi":
        return <Wifi size={20} className={styles.amenityIcon} />;
      case "ac":
        return <Tv size={20} className={styles.amenityIcon} />;
      case "parking":
        return <Car size={20} className={styles.amenityIcon} />;
      case "laundry":
        return <Clock size={20} className={styles.amenityIcon} />;
      case "kitchen":
        return <ChefHat size={20} className={styles.amenityIcon} />;
      case "hotwater":
        return <Droplets size={20} className={styles.amenityIcon} />;
      case "power":
        return <Zap size={20} className={styles.amenityIcon} />;
      case "security":
      default:
        return <ShieldCheck size={20} className={styles.amenityIcon} />;
    }
  };

  const handleBooking = () => {
    try {
      const activeData = {
        id: roomData.id,
        title: roomData.name,
        price: Number(roomData.pricePerMonth.replace(/[^0-9]/g, "")) || 2800,
        sellerId: (roomData as any).sellerId,
        sellerName: (roomData as any).sellerName || roomData.name,
        description: roomData.description,
        capacity: (roomData as any).capacity || 1,
        images: roomData.images,
      };
      sessionStorage.setItem("active_room_booking", JSON.stringify(activeData));
    } catch (e) {
      console.error(e);
    }
    router.push(`/dashboard/user/checkout?type=room&roomId=${roomData.id}`);
  };

  return (
    <div className={styles.container}>
      <Navbar initialActiveItem="Rooms" />

      {/* 2. Main Desktop Content Shell */}
      <main className={styles.mainContent}>
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className={styles.breadcrumbsNav}>
          <Link href="/room-booking" className={styles.breadcrumbLink}>
            Search Listings
          </Link>
          <span className={styles.breadcrumbSeparator}>›</span>
          <Link
            href={`/room-booking?city=${encodeURIComponent(roomData.city || "Pune")}`}
            className={styles.breadcrumbLink}
          >
            {roomData.city || "Pune"}
          </Link>
          <span className={styles.breadcrumbSeparator}>›</span>
          <span className={styles.breadcrumbCurrent}>{roomData.name}</span>
        </nav>

        {/* Photo Gallery Grid Showcase */}
        <section
          aria-label="Room Photo Gallery"
          className={styles.galleryContainer}
          style={{ cursor: "pointer", position: "relative" }}
          onClick={() => {
            setActivePhotoIdx(activeBannerIdx);
            setIsGalleryOpen(true);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={allGalleryImages[activeBannerIdx] || allGalleryImages[0]}
            alt={roomData.name}
            className={styles.galleryBannerImg}
            style={{ width: "100%", maxHeight: "420px", minHeight: "260px", objectFit: "cover", borderRadius: "16px" }}
          />

          {/* Banner Left Arrow: shown ONLY when activeBannerIdx > 0 */}
          {activeBannerIdx > 0 && (
            <button
              type="button"
              className={`${styles.bannerNavBtn} ${styles.bannerNavBtnLeft}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveBannerIdx((prev) => Math.max(0, prev - 1));
              }}
              aria-label="Previous photo"
            >
              <ChevronLeft size={22} strokeWidth={2.4} />
            </button>
          )}

          {/* Banner Right Arrow: shown when multiple images and activeBannerIdx < allGalleryImages.length - 1 */}
          {allGalleryImages.length > 1 && activeBannerIdx < allGalleryImages.length - 1 && (
            <button
              type="button"
              className={`${styles.bannerNavBtn} ${styles.bannerNavBtnRight}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveBannerIdx((prev) => Math.min(allGalleryImages.length - 1, prev + 1));
              }}
              aria-label="Next photo"
            >
              <ChevronRight size={22} strokeWidth={2.4} />
            </button>
          )}

          <button
            type="button"
            className={styles.viewAllPhotosBtn}
            onClick={(e) => {
              e.stopPropagation();
              setActivePhotoIdx(activeBannerIdx);
              setIsGalleryOpen(true);
            }}
          >
            <Grid size={15} />
            <span>View all {allGalleryImages.length} photos</span>
          </button>
        </section>

        {/* Two Column Layout (Details Left + Sticky Booking Card Right) */}
        <div className={styles.twoColumnLayout}>
          {/* Left Column: Room Info, About, Room Details & Amenities */}
          <div className={styles.leftColumn}>
            {/* Header Section */}
            <div className={styles.roomHeaderSection}>
              <div className={styles.headerTopRow}>
                <span className={styles.roomTag}>{roomData.roomTag || "Single Room"}</span>
                <div className={styles.ratingBadge}>
                  <Star size={16} className={styles.ratingStar} />
                  <span>{roomData.rating}</span>
                  <span className={styles.reviewsCount}>{roomData.reviewsCount}</span>
                </div>
              </div>

              <h1 className={styles.roomMainTitle}>{roomData.name}</h1>

              <div className={styles.roomLocationRow}>
                <MapPin size={16} color="#EA580C" />
                <span>{roomData.location}</span>
              </div>
            </div>

            <div className={styles.sectionDivider} />

            {/* About This Property */}
            <section className={styles.sectionBlock}>
              <h2 className={styles.sectionHeading}>About This Property</h2>
              <p className={styles.aboutDescription}>{roomData.description}</p>
            </section>

            <div className={styles.sectionDivider} />

            {/* Room Details Grid */}
            <section className={styles.sectionBlock}>
              <h2 className={styles.sectionHeading}>Room Details</h2>
              <div className={styles.roomDetailsGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailSubLabel}>AVAILABLE FROM</span>
                  <span className={styles.detailValue}>{roomData.availableFrom}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailSubLabel}>ROOM SIZE</span>
                  <span className={styles.detailValue}>{roomData.roomSize}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailSubLabel}>OCCUPANCY</span>
                  <span className={styles.detailValue}>{roomData.occupancy}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailSubLabel}>FLOOR</span>
                  <span className={styles.detailValue}>{roomData.floor}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailSubLabel}>FURNISHED</span>
                  <span className={styles.detailValue}>{roomData.furnished}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailSubLabel}>DEPOSIT</span>
                  <span className={styles.detailValue}>{roomData.depositAmount}</span>
                </div>
              </div>
            </section>

            <div className={styles.sectionDivider} />

            {/* Amenities Grid */}
            <section className={styles.sectionBlock}>
              <h2 className={styles.sectionHeading}>Amenities</h2>
              <div className={styles.amenitiesGrid}>
                {roomData.amenities.map((item, idx) => (
                  <div key={idx} className={styles.amenityCard}>
                    {renderAmenityIcon(item.icon)}
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            </section>

            <div className={styles.sectionDivider} />

            {/* House Rules */}
            <section className={styles.sectionBlock}>
              <h2 className={styles.sectionHeading}>House Rules</h2>
              <div className={styles.houseRulesGrid}>
                {roomData.houseRules?.map((rule, idx) => (
                  <div key={idx} className={styles.ruleItem}>
                    <span className={styles.ruleBullet} />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </section>

            <div className={styles.sectionDivider} />

            {/* Reviews Section */}
            <section className={styles.sectionBlock}>
              <div className={styles.reviewsHeaderRow}>
                <h2 className={styles.sectionHeading}>Reviews (128)</h2>
                <Link href="#all-reviews" className={styles.seeAllReviewsLink}>
                  See All 128 Reviews
                </Link>
              </div>

              <div className={styles.reviewsGrid}>
                {roomData.reviews?.map((rev) => (
                  <div key={rev.id} className={styles.reviewCard}>
                    <div className={styles.reviewCardHeader}>
                      <div className={styles.reviewerInfoGroup}>
                        <div className={styles.reviewerAvatar}>{rev.avatarLetter}</div>
                        <div className={styles.reviewerDetails}>
                          <span className={styles.reviewerName}>{rev.name}</span>
                          <span className={styles.reviewDate}>{rev.date}</span>
                        </div>
                      </div>
                      <div className={styles.reviewRatingBadge}>
                        <Star size={14} className={styles.reviewStarIcon} />
                        <span>{rev.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <p className={styles.reviewComment}>&ldquo;{rev.comment}&rdquo;</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Sticky Booking Card */}
          <aside className={styles.rightColumn}>
            <div className={styles.bookingCard}>
              {/* Header Price & Rating */}
              <div className={styles.cardPriceHeader}>
                <div className={styles.priceGroup}>
                  <span className={styles.priceVal}>{roomData.pricePerMonth}</span>
                  <span className={styles.pricePeriod}>/month</span>
                </div>
                <div className={styles.ratingBadge}>
                  <Star size={15} className={styles.ratingStar} />
                  <span>{roomData.rating}</span>
                  <span className={styles.reviewsCount}>{roomData.reviewsCount}</span>
                </div>
              </div>

              {/* Input Dates & Guests */}
              <div className={styles.bookingInputsGroup}>
                <div className={styles.inputFieldWrapper}>
                  <label className={styles.inputFieldLabel}>CHECK IN DATE</label>
                  <div className={styles.inputFieldPill}>
                    <Calendar size={16} className={styles.inputFieldIcon} />
                    <span>{checkInDate}</span>
                  </div>
                </div>

                <div className={styles.inputFieldWrapper}>
                  <label className={styles.inputFieldLabel}>CHECK OUT DATE</label>
                  <div className={styles.inputFieldPill}>
                    <Calendar size={16} className={styles.inputFieldIcon} />
                    <span>{checkOutDate}</span>
                  </div>
                </div>

                <div className={styles.inputFieldWrapper}>
                  <label className={styles.inputFieldLabel}>GUESTS</label>
                  <div className={styles.inputFieldPill}>
                    <User size={16} className={styles.inputFieldIcon} />
                    <span>{guestCount}</span>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className={styles.priceBreakdown}>
                <div className={styles.breakdownRow}>
                  <span>Room Charges</span>
                  <span className={styles.breakdownRowValue}>{roomData.priceBreakdown.roomCharges}</span>
                </div>
                <div className={styles.breakdownRow}>
                  <span>Service Fee</span>
                  <span className={styles.breakdownRowValue}>{roomData.priceBreakdown.serviceFee}</span>
                </div>
                <div className={styles.breakdownRow}>
                  <span>Cleaning Fee</span>
                  <span className={styles.breakdownRowValue}>{roomData.priceBreakdown.cleaningFee}</span>
                </div>
                <div className={styles.breakdownTotalRow}>
                  <span>Total</span>
                  <span className={styles.totalPriceVal}>{roomData.priceBreakdown.total}</span>
                </div>
              </div>

              {/* Booking CTA Button */}
              <button
                type="button"
                className={styles.bookNowBtn}
                onClick={handleBooking}
              >
                Book Room Now
              </button>

              <p className={styles.notChargedSubtext}>You won't be charged yet</p>

              {/* Free Cancellation Notice */}
              <div className={styles.cancellationCallout}>
                <Info size={16} className={styles.calloutIcon} />
                <span>Free cancellation up to 48 hours before check-in</span>
              </div>
            </div>
          </aside>
        </div>

        {children}
      </main>

      {/* Interactive Lightbox Photo Gallery Modal */}
      {isGalleryOpen && (
        <div
          className={styles.galleryModalOverlay}
          onClick={() => setIsGalleryOpen(false)}
        >
          {/* Top Bar */}
          <div
            className={styles.galleryModalHeader}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className={styles.galleryModalTitle}>
                {roomData.name}
                <span className={styles.galleryModalCounter}>
                  — Photo {activePhotoIdx + 1} of {allGalleryImages.length}
                </span>
              </h3>
            </div>
            <button
              type="button"
              className={styles.galleryCloseBtn}
              onClick={() => setIsGalleryOpen(false)}
              aria-label="Close Gallery"
            >
              <X size={20} strokeWidth={2.4} />
            </button>
          </div>

          {/* Main Photo Display Area */}
          <div
            className={styles.galleryMainView}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Arrow: ONLY show when activePhotoIdx > 0 */}
            {activePhotoIdx > 0 && (
              <button
                type="button"
                className={`${styles.galleryNavBtn} ${styles.galleryNavBtnLeft}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhotoIdx((prev) => Math.max(0, prev - 1));
                }}
                aria-label="Previous photo"
              >
                <ChevronLeft size={28} strokeWidth={2.4} />
              </button>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={allGalleryImages[activePhotoIdx]}
              alt={`${roomData.name} photo ${activePhotoIdx + 1}`}
              className={styles.galleryMainImg}
            />

            {/* Right Arrow: show when activePhotoIdx < allGalleryImages.length - 1 */}
            {allGalleryImages.length > 1 && activePhotoIdx < allGalleryImages.length - 1 && (
              <button
                type="button"
                className={`${styles.galleryNavBtn} ${styles.galleryNavBtnRight}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhotoIdx((prev) => Math.min(allGalleryImages.length - 1, prev + 1));
                }}
                aria-label="Next photo"
              >
                <ChevronRight size={28} strokeWidth={2.4} />
              </button>
            )}
          </div>

          {/* Bottom Thumbnail Strip */}
          <div
            className={styles.galleryThumbnailStrip}
            onClick={(e) => e.stopPropagation()}
          >
            {allGalleryImages.map((imgUrl, idx) => (
              <button
                key={idx}
                type="button"
                className={`${styles.galleryThumbBtn} ${
                  activePhotoIdx === idx ? styles.galleryThumbBtnActive : ""
                }`}
                onClick={() => setActivePhotoIdx(idx)}
                aria-label={`Jump to photo ${idx + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imgUrl}
                  alt={`Thumbnail ${idx + 1}`}
                  className={styles.galleryThumbImg}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Global Responsive Footer */}
      <Footer />
    </div>
  );
};

export default RoomDetailDesktop;

