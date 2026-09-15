"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { Navbar, NavbarProps } from "@/components/room-booking-desktop/navbar";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { Menu, ArrowLeft } from "lucide-react";
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
  priceBreakdown: {
    roomCharges: string;
    serviceFee: string;
    cleaningFee: string;
    total: string;
  };
}

export interface RoomDetailDesktopProps {
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
  navbarProps,
  roomData = DEFAULT_ROOM_DATA,
  children,
}) => {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [checkInDate, setCheckInDate] = useState("Oct 15, 2026");
  const [checkOutDate, setCheckOutDate] = useState("Oct 30, 2026");
  const [guestCount, setGuestCount] = useState("1 Guest");

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
    router.push(`/dashboard/user/checkout?type=room&roomId=${roomData.id}`);
  };

  return (
    <div className={styles.container}>
      {/* Mobile Sidebar Navigation Drawer */}
      <MobileSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeItem="Rooms"
      />

      {/* 1. Desktop Navbar (hidden on mobile <=768px) */}
      <div className={styles.desktopNavbar}>
        <Navbar
          initialActiveItem="Rooms"
          location={roomData.city || "Pune"}
          {...navbarProps}
        />
      </div>

      {/* 2. Mobile Top Navigation Bar (visible only on <=768px) */}
      <div className={styles.mobileHeaderBar}>
        <button
          type="button"
          className={styles.mobileMenuBtn}
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={24} strokeWidth={2.2} />
        </button>

        <Link href="/room-booking" className={styles.mobileBackBtn} aria-label="Back to rooms">
          <ArrowLeft size={20} />
          <span>Rooms</span>
        </Link>
      </div>

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
        <section aria-label="Room Photo Gallery" className={styles.galleryContainer}>
          <Image
            src={roomGalleryBanner}
            alt={roomData.name}
            priority
            sizes="(max-width: 1400px) 100vw, 1400px"
            className={styles.galleryBannerImg}
          />
          <button
            type="button"
            className={styles.viewAllPhotosBtn}
            onClick={() => alert("Opening full 18-photo high-res gallery")}
          >
            <Grid size={15} />
            <span>View all 18 photos</span>
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

      {/* 3. Global Responsive Footer */}
      <Footer />
    </div>
  );
};

export default RoomDetailDesktop;

