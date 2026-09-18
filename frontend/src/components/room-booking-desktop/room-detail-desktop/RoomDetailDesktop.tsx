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
  Fan,
  Laptop,
  Sparkles,
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
  id: "",
  name: "",
  roomTag: "Room",
  rating: 0,
  reviewsCount: "(0 reviews)",
  location: "",
  city: "Pune",
  pricePerMonth: "₹0",
  availableFrom: "",
  roomSize: "",
  occupancy: "",
  floor: "",
  furnished: "",
  depositAmount: "",
  description: "",
  amenities: [],
  houseRules: [],
  reviews: [],
  priceBreakdown: {
    roomCharges: "₹0",
    serviceFee: "₹0",
    cleaningFee: "₹0",
    total: "₹0",
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
  const [checkInDate, setCheckInDate] = useState("Today");
  const [checkOutDate, setCheckOutDate] = useState("Next Month");
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
            const locality = r.sellerLocality || r.seller?.addressLocality || "";
            const city = r.sellerCity || r.seller?.user?.city || "Pune";
            const locationStr = locality ? `${locality}, ${city}` : city;

            let parsedAmenities: { name: string; icon: string }[] = [];
            if (Array.isArray(r.amenities)) {
              parsedAmenities = r.amenities.map((item: any) => {
                if (typeof item === "string") {
                  return { name: item, icon: item.toLowerCase().replace(/\s+/g, "") };
                }
                return { name: item.name || String(item), icon: (item.icon || item.name || "").toLowerCase() };
              });
            }

            let parsedHouseRules: string[] = [];
            if (Array.isArray(r.houseRules)) {
              parsedHouseRules = r.houseRules.map(String).filter(Boolean);
            }

            const revCount = Number(r.reviewCount) || (Array.isArray(r.reviews) ? r.reviews.length : 0);
            const numRating = Number(r.rating) || 0;

            setFetchedRoomData({
              id: r.id,
              name: r.title || "Room Listing",
              roomTag: cap === 1 ? "Single Room" : cap === 2 ? "Double Sharing" : `${cap} Guests Sharing`,
              rating: numRating,
              reviewsCount: revCount > 0 ? `(${revCount} ${revCount === 1 ? "review" : "reviews"})` : "(0 reviews)",
              location: locationStr,
              address: r.sellerLandmark ? `${locality} (Near ${r.sellerLandmark})` : locality,
              city: city,
              pricePerMonth: `₹${price.toLocaleString("en-IN")}`,
              availableFrom: "Immediate / Today",
              roomSize: `${cap * 120} sq ft`,
              occupancy: cap === 1 ? "Single" : `${cap} Persons`,
              floor: "1st Floor",
              furnished: "Fully Furnished",
              depositAmount: `₹${(price * 2).toLocaleString("en-IN")}`,
              description: r.about || r.description || "",
              amenities: parsedAmenities,
              houseRules: parsedHouseRules,
              sellerId: r.sellerId || r.seller?.id,
              sellerName: r.seller?.businessName || r.seller?.restaurantName || r.sellerName || "Host",
              capacity: cap,
              images: r.images,
              reviews: Array.isArray(r.reviews) ? r.reviews : [],
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

  const allGalleryImages = React.useMemo(() => {
    if (roomData.images && roomData.images.length > 0) {
      return roomData.images.map((img: any) => (typeof img === "string" ? img : img?.src || ""));
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
        setActivePhotoIdx((prev) => (prev === 0 ? allGalleryImages.length - 1 : prev - 1));
      } else if (e.key === "ArrowRight") {
        setActivePhotoIdx((prev) => (prev + 1) % allGalleryImages.length);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isGalleryOpen, allGalleryImages.length]);

  const renderAmenityIcon = (iconName: string) => {
    const clean = (iconName || "").toLowerCase();
    if (clean.includes("wifi") || clean.includes("internet")) {
      return <Wifi size={20} className={styles.amenityIcon} />;
    }
    if (clean.includes("tv")) {
      return <Tv size={20} className={styles.amenityIcon} />;
    }
    if (clean.includes("ac") || clean.includes("air") || clean.includes("fan")) {
      return <Fan size={20} className={styles.amenityIcon} />;
    }
    if (clean.includes("parking") || clean.includes("car")) {
      return <Car size={20} className={styles.amenityIcon} />;
    }
    if (clean.includes("laundry") || clean.includes("wash") || clean.includes("clean")) {
      return <Clock size={20} className={styles.amenityIcon} />;
    }
    if (clean.includes("kitchen") || clean.includes("food") || clean.includes("meal")) {
      return <ChefHat size={20} className={styles.amenityIcon} />;
    }
    if (clean.includes("water") || clean.includes("geyser") || clean.includes("hot")) {
      return <Droplets size={20} className={styles.amenityIcon} />;
    }
    if (clean.includes("power") || clean.includes("backup") || clean.includes("electricity") || clean.includes("zap")) {
      return <Zap size={20} className={styles.amenityIcon} />;
    }
    if (clean.includes("desk") || clean.includes("work") || clean.includes("laptop")) {
      return <Laptop size={20} className={styles.amenityIcon} />;
    }
    if (clean.includes("security") || clean.includes("cctv")) {
      return <ShieldCheck size={20} className={styles.amenityIcon} />;
    }
    return <Sparkles size={20} className={styles.amenityIcon} />;
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
          <span className={styles.breadcrumbCurrent}>{roomData.name || "Room Details"}</span>
        </nav>

        {/* Photo Gallery Grid Showcase */}
        <section
          aria-label="Room Photo Gallery"
          className={styles.galleryContainer}
          style={{ cursor: "pointer" }}
          onClick={() => {
            setActivePhotoIdx(0);
            setIsGalleryOpen(true);
          }}
        >
          {roomData.images && roomData.images.length > 0 && typeof roomData.images[0] === "string" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={roomData.images[0]}
              alt={roomData.name}
              className={styles.galleryBannerImg}
              style={{ width: "100%", maxHeight: "420px", objectFit: "cover", borderRadius: "16px" }}
            />
          ) : (
            <Image
              src={roomGalleryBanner}
              alt={roomData.name}
              priority
              sizes="(max-width: 1400px) 100vw, 1400px"
              className={styles.galleryBannerImg}
            />
          )}
          <button
            type="button"
            className={styles.viewAllPhotosBtn}
            onClick={(e) => {
              e.stopPropagation();
              setActivePhotoIdx(0);
              setIsGalleryOpen(true);
            }}
          >
            <Grid size={15} />
            <span>View all {allGalleryImages.length} photos</span>
          </button>
        </section>

        {/* Two Column Layout (Details Left + Sticky Booking Card Right) */}
        <div className={styles.twoColumnLayout}>
          {/* Left Column: Room Info, About, Amenities & House Rules */}
          <div className={styles.leftColumn}>
            {/* Header Section */}
            <div className={styles.roomHeaderSection}>
              <div className={styles.headerTopRow}>
                <span className={styles.roomTag}>{roomData.roomTag || "Single Room"}</span>
                <div className={styles.ratingBadge}>
                  {roomData.rating > 0 ? (
                    <>
                      <Star size={16} className={styles.ratingStar} />
                      <span>{roomData.rating.toFixed(1)}</span>
                      <span className={styles.reviewsCount}>{roomData.reviewsCount}</span>
                    </>
                  ) : (
                    <span className={styles.reviewsCount}>New Listing • No reviews yet</span>
                  )}
                </div>
              </div>

              <h1 className={styles.roomMainTitle}>{roomData.name}</h1>

              {roomData.location && (
                <div className={styles.roomLocationRow}>
                  <MapPin size={16} color="#EA580C" />
                  <span>{roomData.location}</span>
                </div>
              )}
            </div>

            {roomData.description ? (
              <>
                <div className={styles.sectionDivider} />
                {/* About This Property */}
                <section className={styles.sectionBlock}>
                  <h2 className={styles.sectionHeading}>About This Property</h2>
                  <p className={styles.aboutDescription}>{roomData.description}</p>
                </section>
              </>
            ) : null}

            {/* Dynamic Amenities (Only if seller has configured amenities) */}
            {roomData.amenities && roomData.amenities.length > 0 && (
              <>
                <div className={styles.sectionDivider} />
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
              </>
            )}

            {/* Dynamic House Rules (Only if seller has configured house rules) */}
            {roomData.houseRules && roomData.houseRules.length > 0 && (
              <>
                <div className={styles.sectionDivider} />
                <section className={styles.sectionBlock}>
                  <h2 className={styles.sectionHeading}>House Rules</h2>
                  <div className={styles.houseRulesGrid}>
                    {roomData.houseRules.map((rule, idx) => (
                      <div key={idx} className={styles.ruleItem}>
                        <span className={styles.ruleBullet} />
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* Reviews Section */}
            <div className={styles.sectionDivider} />
            <section className={styles.sectionBlock}>
              <div className={styles.reviewsHeaderRow}>
                <h2 className={styles.sectionHeading}>
                  Reviews ({roomData.reviews?.length || 0})
                </h2>
              </div>

              {roomData.reviews && roomData.reviews.length > 0 ? (
                <div className={styles.reviewsGrid}>
                  {roomData.reviews.map((rev) => (
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
              ) : (
                <p style={{ color: "#64748B", fontSize: "14px", margin: "16px 0 0 0" }}>
                  No reviews yet for this room property.
                </p>
              )}
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
                  {roomData.rating > 0 ? (
                    <>
                      <Star size={15} className={styles.ratingStar} />
                      <span>{roomData.rating.toFixed(1)}</span>
                      <span className={styles.reviewsCount}>{roomData.reviewsCount}</span>
                    </>
                  ) : (
                    <span className={styles.reviewsCount}>New Listing</span>
                  )}
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
            {allGalleryImages.length > 1 && (
              <button
                type="button"
                className={`${styles.galleryNavBtn} ${styles.galleryNavBtnLeft}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhotoIdx((prev) =>
                    prev === 0 ? allGalleryImages.length - 1 : prev - 1
                  );
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

            {allGalleryImages.length > 1 && (
              <button
                type="button"
                className={`${styles.galleryNavBtn} ${styles.galleryNavBtnRight}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhotoIdx((prev) => (prev + 1) % allGalleryImages.length);
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

