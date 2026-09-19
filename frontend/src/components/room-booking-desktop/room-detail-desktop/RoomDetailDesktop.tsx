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
  capacity?: number;
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
    serviceFee?: string;
    cleaningFee?: string;
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
  capacity: 1,
  floor: "",
  furnished: "",
  depositAmount: "",
  description: "",
  amenities: [],
  houseRules: [],
  reviews: [],
  priceBreakdown: {
    roomCharges: "₹0",
    total: "₹0",
  },
};

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const formatYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatDisplayDate = (ymd: string) => {
  if (!ymd) return "Select date";
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

interface InteractiveCalendarProps {
  bookedDates: { startDate: string; endDate: string }[];
  startValue: string;
  endValue: string;
  onChange: (dates: { start: string; end: string }) => void;
}

function InteractiveCalendar({
  bookedDates,
  startValue,
  endValue,
  onChange,
}: InteractiveCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  // Calculate occupied nights
  const occupiedNights = React.useMemo(() => {
    const nights = new Set<string>();
    bookedDates.forEach((b) => {
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      const temp = new Date(start);
      while (temp < end) {
        const y = temp.getUTCFullYear();
        const m = String(temp.getUTCMonth() + 1).padStart(2, "0");
        const d = String(temp.getUTCDate()).padStart(2, "0");
        nights.add(`${y}-${m}-${d}`);
        temp.setDate(temp.getDate() + 1);
      }
    });
    return nights;
  }, [bookedDates]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = formatYMD(today);

  const checkInDateStr = startValue;
  const checkOutDateStr = endValue;

  const handleDateClick = (dayStr: string) => {
    if (!checkInDateStr || (checkInDateStr && checkOutDateStr)) {
      // Set Check-in
      onChange({ start: dayStr, end: "" });
    } else {
      // Set Check-out
      if (dayStr <= checkInDateStr) {
        // Reset Check-in
        onChange({ start: dayStr, end: "" });
      } else {
        onChange({ start: checkInDateStr, end: dayStr });
      }
    }
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} style={{ width: "36px", height: "36px" }} />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const mStr = String(month + 1).padStart(2, "0");
    const dStr = String(day).padStart(2, "0");
    const dayStr = `${year}-${mStr}-${dStr}`;

    const isPast = dayStr < todayStr;
    const isBooked = occupiedNights.has(dayStr);

    let style: React.CSSProperties = {
      width: "36px",
      height: "36px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "50%",
      fontSize: "0.85rem",
      fontWeight: "600",
      cursor: "pointer",
      border: "none",
      transition: "all 0.2s",
    };

    let isDisabled = false;

    const isSelectedStart = checkInDateStr && dayStr === checkInDateStr;
    const isSelectedEnd = checkOutDateStr && dayStr === checkOutDateStr;
    const isWithinRange =
      checkInDateStr && checkOutDateStr && dayStr > checkInDateStr && dayStr < checkOutDateStr;

    if (isPast) {
      style.color = "#CBD5E1";
      style.cursor = "not-allowed";
      isDisabled = true;
    } else if (isBooked) {
      style.backgroundColor = "#FEE2E2";
      style.color = "#EF4444";
      style.textDecoration = "line-through";
      style.cursor = "not-allowed";
      isDisabled = true;
    } else if (isSelectedStart || isSelectedEnd) {
      style.backgroundColor = "#EA580C";
      style.color = "#FFFFFF";
      style.fontWeight = "bold";
    } else if (isWithinRange) {
      style.backgroundColor = "#FFEDD5";
      style.color = "#C2410C";
      style.borderRadius = "0";
    } else {
      style.color = "#1E293B";
      style.backgroundColor = "#F8FAFC";
    }

    days.push(
      <button
        key={dayStr}
        type="button"
        disabled={isDisabled}
        onClick={() => handleDateClick(dayStr)}
        style={style}
        title={isBooked ? "Date already booked" : isPast ? "Past date" : `Select ${dayStr}`}
      >
        {day}
      </button>
    );
  }

  return (
    <div style={{ userSelect: "none" }}>
      {/* Month Navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <button
          type="button"
          onClick={handlePrevMonth}
          style={{
            background: "transparent",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            padding: "4px 8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <ChevronLeft size={16} color="#64748B" />
        </button>
        <span style={{ fontWeight: "700", fontSize: "0.95rem", color: "#1E293B" }}>
          {monthNames[month]} {year}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          style={{
            background: "transparent",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            padding: "4px 8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <ChevronRight size={16} color="#64748B" />
        </button>
      </div>

      {/* Days of Week Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "4px",
          textAlign: "center",
          fontWeight: "700",
          fontSize: "0.75rem",
          color: "#94A3B8",
          marginBottom: "8px",
        }}
      >
        <span>Su</span>
        <span>Mo</span>
        <span>Tu</span>
        <span>We</span>
        <span>Th</span>
        <span>Fr</span>
        <span>Sa</span>
      </div>

      {/* Days Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "4px",
          justifyItems: "center",
        }}
      >
        {days}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          marginTop: "14px",
          fontSize: "0.75rem",
          color: "#64748B",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: "#EA580C",
            }}
          />
          <span>Selected</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: "#FEE2E2",
              border: "1px solid #EF4444",
            }}
          />
          <span>Booked</span>
        </div>
      </div>
    </div>
  );
}

export const RoomDetailDesktop: React.FC<RoomDetailDesktopProps> = ({
  roomId,
  navbarProps,
  roomData: propRoomData,
  children,
}) => {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const todayYMD = React.useMemo(() => formatYMD(new Date()), []);
  const tomorrowYMD = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return formatYMD(d);
  }, []);

  const [checkInDate, setCheckInDate] = useState<string>(todayYMD);
  const [checkOutDate, setCheckOutDate] = useState<string>(tomorrowYMD);
  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false);
  const [bookedDates, setBookedDates] = useState<{ startDate: string; endDate: string }[]>([]);
  const [dateError, setDateError] = useState<string>("");

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

            // Extract and sanitize clean about text
            let cleanAbout = "";
            if (typeof r.about === "string" && r.about.trim()) {
              cleanAbout = r.about.trim();
            } else if (typeof r.description === "string" && r.description.trim()) {
              cleanAbout = r.description.trim();
            }
            if (cleanAbout.startsWith("{")) {
              try {
                const parsed = JSON.parse(cleanAbout);
                cleanAbout = typeof parsed.about === "string" ? parsed.about.trim() : (typeof parsed.description === "string" ? parsed.description.trim() : "");
              } catch {
                cleanAbout = "";
              }
            }

            // Extract floor
            let cleanFloor = "";
            if (typeof r.floor === "string" && r.floor.trim()) {
              cleanFloor = r.floor.trim();
            } else if (typeof r.floorNo === "string" && r.floorNo.trim()) {
              cleanFloor = r.floorNo.trim();
            } else if (typeof r.description === "string" && r.description.startsWith("{")) {
              try {
                const parsed = JSON.parse(r.description);
                if (parsed.floor) cleanFloor = String(parsed.floor).trim();
                else if (parsed.floorNo) cleanFloor = String(parsed.floorNo).trim();
              } catch {}
            }

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
              floor: cleanFloor,
              furnished: "Fully Furnished",
              depositAmount: `₹${(price * 2).toLocaleString("en-IN")}`,
              description: cleanAbout,
              amenities: parsedAmenities,
              houseRules: parsedHouseRules,
              sellerId: r.sellerId || r.seller?.id,
              sellerName: r.seller?.businessName || r.seller?.restaurantName || r.sellerName || "Host",
              capacity: cap,
              images: r.images,
              reviews: Array.isArray(r.reviews) ? r.reviews : [],
              priceBreakdown: {
                roomCharges: `₹${price.toLocaleString("en-IN")}`,
                total: `₹${price.toLocaleString("en-IN")}`,
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

  // Fetch booked dates for availability check
  useEffect(() => {
    if (!roomId) return;
    async function fetchAvailability() {
      try {
        const res = await fetchApi(`/api/public/rooms/${roomId}/availability`);
        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
          setBookedDates(list);
        }
      } catch (err) {
        console.error("Failed to load room availability:", err);
      }
    }
    fetchAvailability();
  }, [roomId]);

  const stayNights = React.useMemo(() => {
    if (!checkInDate || !checkOutDate) return 1;
    const d1 = new Date(checkInDate);
    const d2 = new Date(checkOutDate);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 1;
    const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  }, [checkInDate, checkOutDate]);

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

  const nightlyRate = React.useMemo(() => {
    return Number(roomData.pricePerMonth.replace(/[^0-9]/g, "")) || 2800;
  }, [roomData.pricePerMonth]);

  const roomCharges = nightlyRate * stayNights;
  const totalCalculated = roomCharges;

  const handleDatesChange = (dates: { start: string; end: string }) => {
    setCheckInDate(dates.start);
    setCheckOutDate(dates.end);

    if (dates.start && dates.end) {
      if (dates.start >= dates.end) {
        setDateError("Check-out date must be after check-in date.");
        return;
      }
      // Check for overlap with bookedDates
      const occupied = new Set<string>();
      bookedDates.forEach((b) => {
        const bStart = new Date(b.startDate);
        const bEnd = new Date(b.endDate);
        const temp = new Date(bStart);
        while (temp < bEnd) {
          const y = temp.getUTCFullYear();
          const m = String(temp.getUTCMonth() + 1).padStart(2, "0");
          const d = String(temp.getUTCDate()).padStart(2, "0");
          occupied.add(`${y}-${m}-${d}`);
          temp.setDate(temp.getDate() + 1);
        }
      });

      const [sYear, sMonth, sDay] = dates.start.split("-").map(Number);
      const temp = new Date(sYear, sMonth - 1, sDay);
      const [eYear, eMonth, eDay] = dates.end.split("-").map(Number);
      const checkOutDateObj = new Date(eYear, eMonth - 1, eDay);

      let isOverlapping = false;
      while (temp < checkOutDateObj) {
        const y = temp.getFullYear();
        const m = String(temp.getMonth() + 1).padStart(2, "0");
        const d = String(temp.getDate()).padStart(2, "0");
        if (occupied.has(`${y}-${m}-${d}`)) {
          isOverlapping = true;
          break;
        }
        temp.setDate(temp.getDate() + 1);
      }

      if (isOverlapping) {
        setDateError("Selected dates overlap with an existing booking.");
      } else {
        setDateError("");
      }
    } else {
      setDateError("");
    }
  };

  const handleBooking = () => {
    if (!checkInDate || !checkOutDate) {
      setShowCalendarModal(true);
      return;
    }
    if (dateError) {
      alert(dateError);
      return;
    }
    try {
      const activeData = {
        id: roomData.id,
        title: roomData.name,
        price: nightlyRate,
        sellerId: (roomData as any).sellerId,
        sellerName: (roomData as any).sellerName || roomData.name,
        description: roomData.description,
        capacity: roomData.capacity || 1,
        images: roomData.images,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights: stayNights,
        guestCount: roomData.capacity || 1,
        totalAmount: totalCalculated,
      };
      sessionStorage.setItem("active_room_booking", JSON.stringify(activeData));
    } catch (e) {
      console.error(e);
    }
    router.push(
      `/dashboard/user/checkout?type=room&roomId=${roomData.id}&checkIn=${checkInDate}&checkOut=${checkOutDate}`
    );
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

            {(roomData.description || roomData.floor || roomData.capacity || roomData.occupancy) ? (
              <>
                <div className={styles.sectionDivider} />
                {/* About This Property */}
                <section className={styles.sectionBlock}>
                  <h2 className={styles.sectionHeading}>About This Property</h2>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: roomData.description ? "12px" : "0" }}>
                    {roomData.floor ? (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          backgroundColor: "#FFF7ED",
                          color: "#C2410C",
                          border: "1px solid #FFEDD5",
                          padding: "5px 12px",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: 600,
                          width: "fit-content",
                        }}
                      >
                        <span>🏢 Floor Level: {roomData.floor}</span>
                      </div>
                    ) : null}

                    {(roomData.capacity || roomData.occupancy) ? (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          backgroundColor: "#EFF6FF",
                          color: "#1D4ED8",
                          border: "1px solid #DBEAFE",
                          padding: "5px 12px",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: 600,
                          width: "fit-content",
                        }}
                      >
                        <User size={14} color="#2563EB" />
                        <span>
                          Capacity: {roomData.capacity || 1} {(roomData.capacity || 1) === 1 ? "Guest" : "Guests"}
                          {roomData.occupancy ? ` (${roomData.occupancy})` : ""}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {roomData.description ? (
                    <p className={styles.aboutDescription}>{roomData.description}</p>
                  ) : null}
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
                  <span className={styles.pricePeriod}>/day</span>
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

              {/* Input Dates */}
              <div className={styles.bookingInputsGroup}>
                {/* Check In Date */}
                <div className={styles.inputFieldWrapper}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label className={styles.inputFieldLabel}>CHECK IN DATE</label>
                    <span style={{ fontSize: "11px", color: "#EA580C", fontWeight: 700 }}>
                      From 12:00 PM
                    </span>
                  </div>
                  <div
                    className={styles.inputFieldPill}
                    onClick={() => setShowCalendarModal(true)}
                    title="Click to select check-in date"
                  >
                    <Calendar size={16} className={styles.inputFieldIcon} />
                    <span style={{ flex: 1 }}>{formatDisplayDate(checkInDate)}</span>
                    <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>
                      Entry Time
                    </span>
                  </div>
                </div>

                {/* Check Out Date */}
                <div className={styles.inputFieldWrapper}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label className={styles.inputFieldLabel}>CHECK OUT DATE</label>
                    <span style={{ fontSize: "11px", color: "#EA580C", fontWeight: 700 }}>
                      Until 11:00 AM
                    </span>
                  </div>
                  <div
                    className={styles.inputFieldPill}
                    onClick={() => setShowCalendarModal(true)}
                    title="Click to select check-out date"
                  >
                    <Calendar size={16} className={styles.inputFieldIcon} />
                    <span style={{ flex: 1 }}>{formatDisplayDate(checkOutDate)}</span>
                    <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>
                      Exit Time
                    </span>
                  </div>
                </div>

                {/* Stay Duration Badge */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    backgroundColor: "#EFF6FF",
                    border: "1px solid #DBEAFE",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#1E40AF",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Clock size={14} color="#3B82F6" />
                    Stay Duration:
                  </span>
                  <span style={{ fontWeight: 800 }}>
                    {stayNights} {stayNights === 1 ? "Night" : "Nights"}
                  </span>
                </div>

                {dateError && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#DC2626",
                      backgroundColor: "#FEF2F2",
                      border: "1px solid #FCA5A5",
                      padding: "6px 10px",
                      borderRadius: "8px",
                      fontWeight: 600,
                    }}
                  >
                    ⚠️ {dateError}
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className={styles.priceBreakdown}>
                <div className={styles.breakdownRow}>
                  <span>Room Charges ({stayNights} {stayNights === 1 ? "night" : "nights"})</span>
                  <span className={styles.breakdownRowValue}>₹{roomCharges.toLocaleString("en-IN")}</span>
                </div>
                <div className={styles.breakdownTotalRow}>
                  <span>Total</span>
                  <span className={styles.totalPriceVal}>₹{totalCalculated.toLocaleString("en-IN")}</span>
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

      {/* Interactive Booking Calendar Modal */}
      {showCalendarModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setShowCalendarModal(false)}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              width: "100%",
              maxWidth: "400px",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#1E293B", margin: 0 }}>
                  Select Stay Dates
                </h3>
                <span style={{ fontSize: "12px", color: "#64748B" }}>
                  Check-in 12:00 PM • Check-out 11:00 AM
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowCalendarModal(false)}
                style={{
                  background: "#F1F5F9",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#64748B",
                  fontWeight: "bold",
                }}
              >
                ✕
              </button>
            </div>

            {/* Selected Summary */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "16px",
                backgroundColor: "#F8FAFC",
                padding: "12px",
                borderRadius: "10px",
                border: "1px dashed #E2E8F0",
              }}
            >
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: "0.7rem", color: "#64748B", textTransform: "uppercase", fontWeight: "700" }}>
                  Check-In (12:00 PM)
                </div>
                <div style={{ fontSize: "0.85rem", fontWeight: "700", color: checkInDate ? "#EA580C" : "#94A3B8", marginTop: "2px" }}>
                  {formatDisplayDate(checkInDate)}
                </div>
              </div>
              <div style={{ alignSelf: "center", color: "#CBD5E1", fontWeight: "bold", fontSize: "18px" }}>→</div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: "0.7rem", color: "#64748B", textTransform: "uppercase", fontWeight: "700" }}>
                  Check-Out (11:00 AM)
                </div>
                <div style={{ fontSize: "0.85rem", fontWeight: "700", color: checkOutDate ? "#EA580C" : "#94A3B8", marginTop: "2px" }}>
                  {formatDisplayDate(checkOutDate)}
                </div>
              </div>
            </div>

            {dateError && (
              <div
                style={{
                  marginBottom: "12px",
                  padding: "8px 12px",
                  backgroundColor: "#FEF2F2",
                  border: "1px solid #FCA5A5",
                  color: "#B91C1C",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                ⚠️ {dateError}
              </div>
            )}

            <InteractiveCalendar
              bookedDates={bookedDates}
              startValue={checkInDate}
              endValue={checkOutDate}
              onChange={(dates) => {
                handleDatesChange(dates);
                if (dates.start && dates.end) {
                  setTimeout(() => {
                    setShowCalendarModal(false);
                  }, 600);
                }
              }}
            />

            <button
              type="button"
              onClick={() => setShowCalendarModal(false)}
              disabled={!checkInDate || !checkOutDate || Boolean(dateError)}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: checkInDate && checkOutDate && !dateError ? "#EA580C" : "#CBD5E1",
                color: "white",
                borderRadius: "10px",
                fontWeight: "700",
                border: "none",
                marginTop: "16px",
                cursor: checkInDate && checkOutDate && !dateError ? "pointer" : "not-allowed",
                transition: "background-color 0.2s",
                boxShadow: checkInDate && checkOutDate && !dateError ? "0 4px 12px rgba(234, 88, 12, 0.3)" : "none",
              }}
            >
              Confirm Dates ({stayNights} {stayNights === 1 ? "Night" : "Nights"})
            </button>
          </div>
        </div>
      )}

      {/* 3. Global Responsive Footer */}
      <Footer />
    </div>
  );
};

export default RoomDetailDesktop;

