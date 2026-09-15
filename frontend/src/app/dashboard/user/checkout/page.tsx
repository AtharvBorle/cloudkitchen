"use client";
import { fetchApi } from "@/lib/fetch-api";
import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { Banknote, ShieldCheck, Tag, Zap, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import Script from "next/script";
import { useLocation } from "@/components/location-provider";
import { useSession } from "next-auth/react";

const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
        if ((window as any).Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.id = "razorpay-checkout-script";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
};

interface InteractiveCalendarProps {
    bookedDates: { startDate: string; endDate: string }[];
    startValue: string;
    endValue: string;
    onChange: (dates: { start: string; end: string }) => void;
}

function InteractiveCalendar({ bookedDates, startValue, endValue, onChange }: InteractiveCalendarProps) {
    const [currentDate, setCurrentDate] = useState(() => new Date());
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const handlePrevMonth = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() - 1);
            return newDate;
        });
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + 1);
            return newDate;
        });
    };

    // Calculate occupied nights
    const occupiedNights = useMemo(() => {
        const nights = new Set<string>();
        bookedDates.forEach(b => {
            const start = new Date(b.startDate);
            const end = new Date(b.endDate);
            const temp = new Date(start);
            while (temp < end) {
                const y = temp.getUTCFullYear();
                const m = String(temp.getUTCMonth() + 1).padStart(2, '0');
                const d = String(temp.getUTCDate()).padStart(2, '0');
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
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const checkInDateStr = startValue;
    const checkOutDateStr = endValue;

    // Find the first occupied night after checkIn
    const firstOccupiedNightAfterCheckIn = useMemo<string | null>(() => {
        if (!checkInDateStr) return null;
        let earliest: string | null = null;
        occupiedNights.forEach(night => {
            if (night >= checkInDateStr) {
                if (!earliest || night < earliest) {
                    earliest = night;
                }
            }
        });
        return earliest;
    }, [checkInDateStr, occupiedNights]);

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
    // Offset cells for days of week
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} style={{ width: "36px", height: "36px" }} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const mStr = String(month + 1).padStart(2, '0');
        const dStr = String(day).padStart(2, '0');
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
            transition: "all 0.2s"
        };

        let isDisabled = false;
        
        const isSelectedStart = checkInDateStr && dayStr === checkInDateStr;
        const isSelectedEnd = checkOutDateStr && dayStr === checkOutDateStr;
        const isWithinRange = checkInDateStr && checkOutDateStr && dayStr > checkInDateStr && dayStr < checkOutDateStr;

        if (isPast) {
            style.color = "#CBD5E1";
            style.backgroundColor = "transparent";
            style.cursor = "not-allowed";
            isDisabled = true;
        } else if (!checkInDateStr || (checkInDateStr && checkOutDateStr)) {
            // Selecting Check-In
            if (isBooked) {
                style.color = "#DC2626";
                style.backgroundColor = "#FEE2E2";
                style.border = "1px solid #FCA5A5";
                style.cursor = "not-allowed";
                isDisabled = true;
            } else {
                style.color = "#16A34A";
                style.backgroundColor = "#F0FDF4";
                style.border = "1px solid #BBF7D0";
            }
        } else {
            // Selecting Check-Out
            const isValidCheckout = dayStr > checkInDateStr && (!firstOccupiedNightAfterCheckIn || dayStr <= firstOccupiedNightAfterCheckIn);

            if (isSelectedStart) {
                style.color = "white";
                style.backgroundColor = "var(--primary, #16a34a)";
                style.fontWeight = "bold";
            } else if (isValidCheckout) {
                style.color = "#16A34A";
                style.backgroundColor = "#F0FDF4";
                style.border = "1px solid #BBF7D0";
            } else {
                style.color = "#DC2626";
                style.backgroundColor = "#FEE2E2";
                style.border = "1px solid #FCA5A5";
                style.cursor = "not-allowed";
                isDisabled = true;
            }
        }

        if (isSelectedStart || isSelectedEnd) {
            style.color = "white";
            style.backgroundColor = "var(--primary, #16a34a)";
            style.fontWeight = "bold";
            style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
            style.border = "none";
        } else if (isWithinRange) {
            style.color = "#15803D";
            style.backgroundColor = "#DCFCE7";
            style.borderRadius = "0";
            style.border = "none";
        }

        days.push(
            <button
                key={`day-${day}`}
                type="button"
                disabled={isDisabled}
                onClick={() => handleDateClick(dayStr)}
                style={style}
                onMouseEnter={(e) => {
                    if (!isDisabled && !isSelectedStart && !isSelectedEnd && !isWithinRange) {
                        e.currentTarget.style.backgroundColor = "#DCFCE7";
                        e.currentTarget.style.color = "#15803D";
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isDisabled && !isSelectedStart && !isSelectedEnd && !isWithinRange) {
                        e.currentTarget.style.backgroundColor = isBooked ? "#FEE2E2" : "#F0FDF4";
                        e.currentTarget.style.color = isBooked ? "#DC2626" : "#16A34A";
                    }
                }}
            >
                {day}
            </button>
        );
    }

    return (
        <div style={{ border: "1px solid #E2E8F0", borderRadius: "12px", padding: "15px", backgroundColor: "#FFF", width: "100%", maxWidth: "340px", margin: "15px auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <button type="button" onClick={handlePrevMonth} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}>
                    <ChevronLeft size={20} color="#475569" />
                </button>
                <span style={{ fontWeight: "700", color: "#1E293B", fontSize: "0.95rem" }}>
                    {monthNames[month]} {year}
                </span>
                <button type="button" onClick={handleNextMonth} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}>
                    <ChevronRight size={20} color="#475569" />
                </button>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", marginBottom: "8px", fontWeight: "600", color: "#64748B", fontSize: "0.75rem" }}>
                <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", justifyItems: "center" }}>
                {days}
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: "15px", marginTop: "15px", paddingTop: "10px", borderTop: "1px solid #F1F5F9", fontSize: "0.75rem", fontWeight: "600" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0" }} />
                    <span style={{ color: "#16A34A" }}>Available</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#FEE2E2", border: "1px solid #FCA5A5" }} />
                    <span style={{ color: "#DC2626" }}>Booked</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "var(--primary, #16a34a)" }} />
                    <span style={{ color: "#334155" }}>Selected</span>
                </div>
            </div>
        </div>
    );
}

function CheckoutContent() {
    const { data: session, status } = useSession();
    const { cartItems, cartTotal, clearCart, addToCart, decreaseQuantity, removeFromCart } = useCart();
    const router = useRouter();
    const { defaultAddress } = useLocation();
    const [isClient, setIsClient] = useState(false);



    // For Room booking direct bypass
    const searchParams = useSearchParams();
    const isRoomBooking = searchParams?.get("type") === "room";
    const roomIdParam = searchParams?.get("roomId");
    const [roomDetails, setRoomDetails] = useState<any>(null);
    const [roomLoadingError, setRoomLoadingError] = useState("");
    const [bookingDates, setBookingDates] = useState({ start: "", end: "" });

    const [paymentMethod, setPaymentMethod] = useState("COD");
    const [addressId, setAddressId] = useState("");
    const [addresses, setAddresses] = useState<any[]>([]);
    const [phone, setPhone] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Coupon logic
    const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [discountAmount, setDiscountAmount] = useState(0);

    // Room Availability tracking
    const [bookedDates, setBookedDates] = useState<{ startDate: string, endDate: string }[]>([]);
    const [dateOverlapError, setDateOverlapError] = useState("");
    const [showCalendar, setShowCalendar] = useState(false);

    // Seller processing
    const [sellerUpiId, setSellerUpiId] = useState<string | null>(null);
    const [isFetchingSeller, setIsFetchingSeller] = useState(false);
    const [sellerDetails, setSellerDetails] = useState<any>(null);

    // Hydration fix & dynamic room loading (from sessionStorage or /api/public/rooms/[id])
    useEffect(() => {
        setIsClient(true);
        if (!isRoomBooking) return;

        let loaded = false;
        const savedRoom = sessionStorage.getItem("active_room_booking");
        if (savedRoom) {
            try {
                const parsed = JSON.parse(savedRoom);
                if (parsed && (!roomIdParam || parsed.id === roomIdParam)) {
                    setRoomDetails(parsed);
                    loaded = true;
                }
            } catch (e) {
                console.error("Failed to parse saved room booking:", e);
            }
        }

        if (!loaded && roomIdParam) {
            const fetchRoomData = async () => {
                try {
                    const res = await fetchApi(`/api/public/rooms/${roomIdParam}`);
                    if (res.ok) {
                        const json = await res.json();
                        const r = json.data || json;
                        if (r && r.id) {
                            const formatted = {
                                id: r.id,
                                title: r.title || "Deluxe Room",
                                price: Number(r.price) || 2800,
                                sellerId: r.sellerId || r.seller?.id,
                                sellerName: r.seller?.restaurantName || r.sellerName || "Property Host",
                                description: r.description || "",
                                capacity: r.capacity || 1,
                                images: r.images,
                            };
                            setRoomDetails(formatted);
                            sessionStorage.setItem("active_room_booking", JSON.stringify(formatted));
                        } else {
                            setRoomLoadingError("Room details could not be found.");
                        }
                    } else {
                        setRoomLoadingError("Failed to load room details. Please try again.");
                    }
                } catch (err) {
                    console.error("Failed to fetch room details for checkout:", err);
                    setRoomLoadingError("An error occurred while loading room details.");
                }
            };
            fetchRoomData();
        }
    }, [isRoomBooking, roomIdParam]);

    // Set default check-in (tomorrow) and check-out (day after) for room bookings
    useEffect(() => {
        if (isRoomBooking && !bookingDates.start) {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dayAfter = new Date(tomorrow);
            dayAfter.setDate(dayAfter.getDate() + 1);

            const formatYMD = (d: Date) => {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, "0");
                const day = String(d.getDate()).padStart(2, "0");
                return `${y}-${m}-${day}`;
            };

            setBookingDates({
                start: formatYMD(tomorrow),
                end: formatYMD(dayAfter),
            });
        }
    }, [isRoomBooking, bookingDates.start]);

    // Fetch User Profile for Phone & Addresses
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const res = await fetchApi("/api/user/profile");
                if (res.ok) {
                    const data = await res.json();
                    setPhone(data.phone || "");
                    setAddresses(data.addresses || []);

                    // Find and set default address
                    if (data.addresses && data.addresses.length > 0) {
                        const defaultAddr = data.addresses.find((a: any) => a.isDefault);
                        if (defaultAddr) {
                            setAddressId(defaultAddr.id);
                        } else {
                            setAddressId(data.addresses[0].id); // fallback to first
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to load profile for checkout", err);
            }
        };

        if (isClient && session?.user?.role === "USER") {
            fetchUserProfile();
        } else if (isClient && status === "unauthenticated") {
            router.push(`/login?callbackUrl=${encodeURIComponent("/dashboard/user/checkout")}`);
        }
    }, [isClient, defaultAddress, session, status, router]);

    // Fetch Seller data when items or room are confirmed
    useEffect(() => {
        const fetchSeller = async () => {
            const sellerId = isRoomBooking ? roomDetails?.sellerId : cartItems[0]?.sellerId;
            if (!sellerId) return;

            setIsFetchingSeller(true);
            try {
                const res = await fetchApi(`/api/seller/profile/${sellerId}`);
                if (res.ok) {
                    const data = await res.json();
                    setSellerDetails(data);
                    if (data?.upiId) {
                        setSellerUpiId(data.upiId);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch seller payment details", err);
            } finally {
                setIsFetchingSeller(false);
            }
        };

        if (isClient && (roomDetails || cartItems.length > 0)) {
            fetchSeller();
        }
    }, [isClient, isRoomBooking, roomDetails, cartItems]);

    const selectedAddress = addresses.find((a: any) => a.id === addressId);

    const getOutOfRangeItems = () => {
        if (isRoomBooking) return [];
        if (!selectedAddress || !sellerDetails || cartItems.length === 0) return [];

        const userPincode = selectedAddress.pincode.trim();
        const outOfRange: string[] = [];

        for (const cartItem of cartItems) {
            const itemDetail = sellerDetails.foodItems?.find((f: any) => f.id === cartItem.id);
            if (!itemDetail) continue;

            let deliverable = false;
            if (itemDetail.deliveryPincodes) {
                const pins = itemDetail.deliveryPincodes.split(",").map((p: string) => p.trim());
                deliverable = pins.includes(userPincode);
            } else {
                deliverable = sellerDetails.user?.pincode === userPincode;
            }

            if (!deliverable) {
                outOfRange.push(cartItem.name);
            }
        }

        return outOfRange;
    };

    const outOfRangeItems = getOutOfRangeItems();
    const hasOutOfRangeItems = outOfRangeItems.length > 0;

    const getClosedItems = () => {
        if (isRoomBooking) return [];
        if (!sellerDetails || cartItems.length === 0) return [];

        const closed: string[] = [];
        const now = new Date();
        const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const currentDayStr = daysOfWeek[now.getDay()];
        const currentHours = now.getHours().toString().padStart(2, '0');
        const currentMinutes = now.getMinutes().toString().padStart(2, '0');
        const currentTimeStr = `${currentHours}:${currentMinutes}`;

        for (const cartItem of cartItems) {
            const itemDetail = sellerDetails.foodItems?.find((f: any) => f.id === cartItem.id);
            if (!itemDetail) continue;

            let isOpen = true;
            let operationalHoursInfo = "";

            if (itemDetail.operationalHours) {
                try {
                    const hours = typeof itemDetail.operationalHours === 'string'
                        ? JSON.parse(itemDetail.operationalHours)
                        : itemDetail.operationalHours;
                    const dayHours = hours[currentDayStr];
                    if (dayHours) {
                        if (!dayHours.isOpen) {
                            isOpen = false;
                            operationalHoursInfo = "Closed today";
                        } else if (dayHours.openTime && dayHours.closeTime) {
                            const openTime = dayHours.openTime;
                            const closeTime = dayHours.closeTime;
                            operationalHoursInfo = `Operational hours today: ${openTime} - ${closeTime}`;
                            if (openTime <= closeTime) {
                                isOpen = currentTimeStr >= openTime && currentTimeStr <= closeTime;
                            } else {
                                isOpen = currentTimeStr >= openTime || currentTimeStr <= closeTime;
                            }
                        }
                    }
                } catch (e) {
                    console.error("Failed to parse operationalHours in checkout check", e);
                }
            } else if (itemDetail.openTime && itemDetail.closeTime) {
                const openTime = itemDetail.openTime;
                const closeTime = itemDetail.closeTime;
                operationalHoursInfo = `Operational hours: ${openTime} - ${closeTime}`;
                if (openTime <= closeTime) {
                    isOpen = currentTimeStr >= openTime && currentTimeStr <= closeTime;
                } else {
                    isOpen = currentTimeStr >= openTime || currentTimeStr <= closeTime;
                }
            }

            if (!isOpen) {
                closed.push(`${cartItem.name} (${operationalHoursInfo || 'Closed'})`);
            }
        }

        return closed;
    };

    const closedItems = getClosedItems();
    const hasClosedItems = closedItems.length > 0;

    // Fetch existing room bookings
    useEffect(() => {
        if (!isRoomBooking || !roomDetails?.id) return;
        const fetchAvailability = async () => {
            try {
                const res = await fetchApi(`/api/public/rooms/${roomDetails.id}/availability`);
                if (res.ok) {
                    const json = await res.json();
                    const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
                    setBookedDates(list);
                }
            } catch (err) {
                console.error("Failed to fetch room availability", err);
            }
        };
        fetchAvailability();
    }, [isRoomBooking, roomDetails]);

    // Check for date overlaps
    useEffect(() => {
        if (!isRoomBooking || !bookingDates.start || !bookingDates.end) {
            setDateOverlapError("");
            return;
        }

        const start = bookingDates.start;
        const end = bookingDates.end;

        if (start >= end) {
            setDateOverlapError("Check-out date must be after check-in date.");
            return;
        }

        // Build occupied set
        const occupied = new Set<string>();
        bookedDates.forEach(b => {
            const bStart = new Date(b.startDate);
            const bEnd = new Date(b.endDate);
            const temp = new Date(bStart);
            while (temp < bEnd) {
                const y = temp.getUTCFullYear();
                const m = String(temp.getUTCMonth() + 1).padStart(2, '0');
                const d = String(temp.getUTCDate()).padStart(2, '0');
                occupied.add(`${y}-${m}-${d}`);
                temp.setDate(temp.getDate() + 1);
            }
        });

        // Check if any night from check-in up to check-out (exclusive) is occupied
        const [sYear, sMonth, sDay] = start.split("-").map(Number);
        const temp = new Date(sYear, sMonth - 1, sDay);
        
        const [eYear, eMonth, eDay] = end.split("-").map(Number);
        const checkOutDate = new Date(eYear, eMonth - 1, eDay);
        
        let isOverlapping = false;
        
        while (temp < checkOutDate) {
            const y = temp.getFullYear();
            const m = String(temp.getMonth() + 1).padStart(2, '0');
            const d = String(temp.getDate()).padStart(2, '0');
            const key = `${y}-${m}-${d}`;
            if (occupied.has(key)) {
                isOverlapping = true;
                break;
            }
            temp.setDate(temp.getDate() + 1);
        }

        if (isOverlapping) {
            setDateOverlapError("These dates are already booked.");
        } else {
            setDateOverlapError("");
        }

    }, [bookingDates, bookedDates, isRoomBooking]);

    // Fetch applicable coupons
    useEffect(() => {
        const fetchCoupons = async () => {
            const sellerId = isRoomBooking ? roomDetails?.sellerId : cartItems[0]?.sellerId;
            if (!sellerId) return;

            try {
                const res = await fetchApi(`/api/public/coupons?sellerId=${sellerId}`);
                if (res.ok) {
                    const data = await res.json();
                    setAvailableCoupons(data);
                }
            } catch (err) {
                console.error("Failed to fetch coupons", err);
            }
        };

        if (isClient && (roomDetails || cartItems.length > 0)) {
            fetchCoupons();
        }
    }, [isClient, isRoomBooking, roomDetails, cartItems]);

    // Recalculate discount when coupon or total changes
    useEffect(() => {
        if (!appliedCoupon) {
            setDiscountAmount(0);
            return;
        }

        const baseTotal = isRoomBooking
            ? Math.max(roomDetails.price * (bookingDates.end && bookingDates.start ? Math.ceil((new Date(bookingDates.end).getTime() - new Date(bookingDates.start).getTime()) / (1000 * 60 * 60 * 24)) : 1), roomDetails.price)
            : cartTotal;

        // Check Minimum Cart Value
        if (appliedCoupon.minimumCartValue && baseTotal < appliedCoupon.minimumCartValue) {
            setDiscountAmount(0);
            return;
        }

        if (appliedCoupon.discountPercentage) {
            setDiscountAmount(Math.round((baseTotal * appliedCoupon.discountPercentage) / 100));
        } else if (appliedCoupon.discountAmount) {
            // Don't discount more than the order value
            setDiscountAmount(Math.min(appliedCoupon.discountAmount, baseTotal));
        }
    }, [appliedCoupon, cartTotal, isRoomBooking, roomDetails, bookingDates]);

    if (status === "loading" || !isClient) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <div style={{ padding: '20px', fontSize: '1.2rem', color: 'var(--text-muted)' }}>Loading checkout...</div>
            </div>
        );
    }

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!phone) {
            setError("Please update your phone number in your profile to proceed.");
            return;
        }

        if (!addressId && !isRoomBooking) {
            setError("Please select a delivery address or add one in your profile.");
            return;
        }

        if (paymentMethod === "QR" && !sellerUpiId) {
            setError("The seller has not provided a valid UPI ID for QR payments. Please select Cash on Delivery.");
            return;
        }

        setIsSubmitting(true);

        try {
            if (isRoomBooking) {
                if (!bookingDates.start || !bookingDates.end) {
                    setError("Please select the check-in and check-out dates.");
                    setIsSubmitting(false);
                    return;
                }

                // Calculate days to multiply by nightly price
                const msPerDay = 1000 * 60 * 60 * 24;
                const days = Math.ceil((new Date(bookingDates.end).getTime() - new Date(bookingDates.start).getTime()) / msPerDay);
                const totalAmount = days > 0 ? (roomDetails.price * days) : roomDetails.price;

                const res = await fetchApi("/api/user/bookings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        roomId: roomDetails.id,
                        startDate: bookingDates.start,
                        endDate: bookingDates.end,
                        totalAmount: totalAmount,
                        paymentMethod: paymentMethod
                    })
                });

                if (res.ok) {
                    sessionStorage.removeItem("active_room_booking");
                    alert("Room booked successfully! Awaiting host confirmation.");
                    router.push("/dashboard/user");
                } else {
                    const data = await res.json();
                    setError(data.message || "Failed to book room.");
                }
            } else {
                // Food Cart Checkout
                if (cartItems.length === 0) {
                    setError("Your cart is empty.");
                    setIsSubmitting(false);
                    return;
                }

                if (hasOutOfRangeItems) {
                    setError(`Some items in your cart are out of delivery range for the selected address: ${outOfRangeItems.join(', ')}.`);
                    setIsSubmitting(false);
                    return;
                }

                if (hasClosedItems) {
                    setError(`Some items in your cart are currently closed and cannot be ordered: ${closedItems.join(', ')}.`);
                    setIsSubmitting(false);
                    return;
                }

                // Get full address line based on selection
                const selectedAddress = addresses.find((a: any) => a.id === addressId);
                let finalAddressText = "";
                if (selectedAddress) {
                    finalAddressText = `[${selectedAddress.type}] ${selectedAddress.houseNumber}, ${selectedAddress.street}${selectedAddress.landmark ? `, ${selectedAddress.landmark}` : ''}, ${selectedAddress.pincode}`;
                    if (selectedAddress.latitude !== undefined && selectedAddress.latitude !== null && selectedAddress.longitude !== undefined && selectedAddress.longitude !== null) {
                        finalAddressText += ` | Loc: ${selectedAddress.latitude},${selectedAddress.longitude}`;
                    }
                }

                const baseTotal = isRoomBooking
                    ? Math.max(roomDetails.price * (bookingDates.end && bookingDates.start ? Math.ceil((new Date(bookingDates.end).getTime() - new Date(bookingDates.start).getTime()) / (1000 * 60 * 60 * 24)) : 1), roomDetails.price)
                    : cartTotal;

                if (appliedCoupon && appliedCoupon.minimumCartValue && baseTotal < appliedCoupon.minimumCartValue) {
                    setError(`Minimum cart value of ₹${appliedCoupon.minimumCartValue} required for coupon ${appliedCoupon.code}.`);
                    setIsSubmitting(false);
                    return;
                }

                const finalTotalAmount = Math.max(0, baseTotal - discountAmount);

                const res = await fetchApi("/api/user/orders", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sellerId: cartItems[0].sellerId, // Validated to be single-seller earlier
                        items: cartItems.map((item: any) => ({ id: item.id, name: item.name, quantity: item.quantity, price: item.price })),
                        totalAmount: finalTotalAmount,
                        deliveryAddress: finalAddressText,
                        customerPhone: phone,
                        paymentMethod: paymentMethod,
                        appliedCouponId: appliedCoupon ? appliedCoupon.id : null
                    })
                });

                const data = await res.json();

                if (res.ok) {
                    if (paymentMethod === "ONLINE" && data.razorpayOrder) {
                        const scriptLoaded = await loadRazorpayScript();
                        if (!scriptLoaded) {
                            setError("Failed to load Razorpay SDK. Please check your internet connection.");
                            setIsSubmitting(false);
                            return;
                        }

                        const options = {
                            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_SBd0GNxh5TYLm3",
                            amount: data.razorpayOrder.amount,
                            currency: "INR",
                            name: "Neo Cloud Room",
                            description: "Order Payment",
                            order_id: data.razorpayOrder.id,
                            handler: async function (response: any) {
                                try {
                                    const verifyRes = await fetchApi("/api/user/orders/verify", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                            razorpay_payment_id: response.razorpay_payment_id,
                                            razorpay_order_id: response.razorpay_order_id,
                                            razorpay_signature: response.razorpay_signature,
                                            orderId: data.order.id
                                        })
                                    });

                                    if (verifyRes.ok) {
                                        clearCart();
                                        alert("Payment successful! Order placed.");
                                        router.push("/dashboard/user/orders");
                                    } else {
                                        const verifyData = await verifyRes.json();
                                        setError(verifyData.message || "Payment verification failed.");
                                    }
                                } catch (e) {
                                    setError("An error occurred during payment verification.");
                                }
                            },
                            prefill: {
                                contact: phone
                            },
                            theme: {
                                color: "#16a34a"
                            }
                        };
                        const rzp = new (window as any).Razorpay(options);
                        rzp.open();
                    } else {
                        clearCart();
                        alert("Order placed successfully!");
                        router.push("/dashboard/user/orders");
                    }
                } else {
                    setError(data.message || "Failed to place order.");
                }
            }
        } catch (err) {
            setError("An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isRoomBooking && cartItems.length === 0) {
        return (
            <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: 'white', borderRadius: '12px' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '15px' }}>Your Cart is Empty</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>Looks like you haven't added any delicious food yet!</p>
                <button onClick={() => router.push(session ? "/dashboard/user/food" : "/explore-desktop")} className="btn btn-primary">Browse Menus</button>
            </div>
        );
    }

    if (isRoomBooking && !roomDetails) {
        if (roomLoadingError) {
            return (
                <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: 'white', borderRadius: '12px' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#DC2626', marginBottom: '15px' }}>Room Not Available</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>{roomLoadingError}</p>
                    <button onClick={() => router.push("/room-booking")} className="btn btn-primary">
                        Browse Available Rooms
                    </button>
                </div>
            );
        }
        return (
            <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: 'white', borderRadius: '12px' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-muted)' }}>Loading Room Details...</div>
            </div>
        );
    }

    // Dynamic upi string construction
    // UPI string format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=INR
    const basePayable = isRoomBooking
        ? Math.max(roomDetails.price * (bookingDates.end && bookingDates.start ? Math.ceil((new Date(bookingDates.end).getTime() - new Date(bookingDates.start).getTime()) / (1000 * 60 * 60 * 24)) : 1), roomDetails.price)
        : cartTotal;

    const totalPayable = Math.max(0, basePayable - discountAmount);

    const upiString = sellerUpiId ? `upi://pay?pa=${sellerUpiId}&pn=${isRoomBooking ? roomDetails.sellerName : cartItems[0]?.sellerName}&am=${totalPayable}&cu=INR` : "";

    return (
        <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Left Column - Checkout Form */}
            <div style={{ flex: '1 1 60%', minWidth: '320px', backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: 'var(--shadow-card)' }}>
                <h1 style={{ fontSize: "1.8rem", fontWeight: "bold", marginBottom: "25px", borderBottom: "1px solid #EEE", paddingBottom: "15px" }}>
                    Secure Checkout
                </h1>

                {error && <div style={{ padding: '15px', backgroundColor: '#FDE8E8', color: '#C81E1E', borderRadius: '8px', marginBottom: '20px', fontWeight: '500' }}>{error}</div>}

                {(!session || session.user.role !== "USER") ? (
                    <div style={{ padding: '30px 20px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1', textAlign: 'center', margin: '20px 0' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <ShieldCheck size={32} color="#3B82F6" />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0F172A', marginBottom: '0.75rem' }}>Login Required to Place Order</h3>
                        <p style={{ color: '#64748B', marginBottom: '1.75rem', lineHeight: '1.6', fontSize: '0.95rem' }}>
                            Please sign in to select your delivery address, configure payment details, and complete your order.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                const redirectUrl = window.location.pathname + window.location.search;
                                router.push(`/user?callbackUrl=${encodeURIComponent(redirectUrl)}`);
                            }}
                            className="btn btn-primary"
                            style={{ padding: '12px 24px', fontSize: '1rem', fontWeight: 'bold', width: 'auto', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            Sign In to Proceed
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleCheckout}>
                        <div style={{ marginBottom: "25px" }}>
                            <h3 style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "15px" }}>Contact Details</h3>
                            <div style={{ marginBottom: "15px" }}>
                                <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "5px" }}>Phone Number</label>
                                <input
                                    type="tel"
                                    readOnly
                                    value={phone}
                                    className="input-field"
                                    style={{ backgroundColor: '#F9FAFB', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                                    placeholder="Phone missing - update in profile"
                                />
                                <p style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '5px' }}><a href="/dashboard/user/profile" style={{ textDecoration: 'underline' }}>Update phone number in Profile</a></p>
                            </div>

                            {!isRoomBooking && (
                                <div>
                                    <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "5px" }}>Delivery Address</label>
                                    {addresses.length > 0 ? (
                                        <select
                                            className="input-field"
                                            value={addressId}
                                            onChange={(e) => setAddressId(e.target.value)}
                                            style={{ backgroundColor: 'white', padding: '12px', border: '1px solid #EAEAEA', borderRadius: '8px', cursor: 'pointer', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23131313%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7rem top 50%', backgroundSize: '.65rem auto' }}
                                        >
                                            <option value="" disabled>Select an address</option>
                                            {addresses.map(addr => (
                                                <option key={addr.id} value={addr.id}>
                                                    {addr.type} - {addr.houseNumber}, {addr.street}, {addr.pincode}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div style={{ padding: '15px', backgroundColor: '#FFF4F2', color: '#D9534F', borderRadius: '8px', fontSize: '0.9rem' }}>
                                            No saved addresses found. <a href="/dashboard/user/profile" style={{ fontWeight: 'bold', textDecoration: 'underline' }}>Add an address in your Profile</a> to checkout.
                                        </div>
                                    )}

                                    {selectedAddress && hasOutOfRangeItems && (
                                        <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: '8px', fontSize: '0.9rem' }}>
                                            <span style={{ fontWeight: 'bold' }}>⚠️ Delivery Pincode Issue:</span>
                                            <p style={{ marginTop: '5px' }}>
                                                The following items in your cart are not deliverable to pincode <span style={{ fontWeight: 'bold' }}>{selectedAddress.pincode}</span>:
                                            </p>
                                            <ul style={{ marginTop: '5px', paddingLeft: '20px', listStyleType: 'disc' }}>
                                                {outOfRangeItems.map((name: string, idx: number) => (
                                                    <li key={idx} style={{ fontWeight: '500' }}>{name}</li>
                                                ))}
                                            </ul>
                                            <p style={{ marginTop: '5px', fontSize: '0.85rem' }}>
                                                Please select a different delivery address or remove these items from your cart to proceed.
                                            </p>
                                        </div>
                                    )}

                                    {hasClosedItems && (
                                        <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: '8px', fontSize: '0.9rem' }}>
                                            <span style={{ fontWeight: 'bold' }}>⚠️ Operational Hours Issue:</span>
                                            <p style={{ marginTop: '5px' }}>
                                                The following items in your cart are currently outside of their operational hours:
                                            </p>
                                            <ul style={{ marginTop: '5px', paddingLeft: '20px', listStyleType: 'disc' }}>
                                                {closedItems.map((name: string, idx: number) => (
                                                    <li key={idx} style={{ fontWeight: '500' }}>{name}</li>
                                                ))}
                                            </ul>
                                            <p style={{ marginTop: '5px', fontSize: '0.85rem' }}>
                                                Please remove these items from your cart to proceed.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {isRoomBooking && (
                                <div style={{ marginTop: '15px' }}>
                                    <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                                        <div style={{ flex: 1 }} onClick={() => setShowCalendar(true)}>
                                            <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "5px", cursor: 'pointer' }}>Check-In Date</label>
                                            <input
                                                type="text"
                                                required
                                                readOnly
                                                value={bookingDates.start}
                                                style={{ backgroundColor: '#F9FAFB', cursor: 'pointer' }}
                                                className="input-field"
                                                placeholder="Select on calendar"
                                            />
                                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                                                🕑 Check-in from 12:00 PM
                                            </div>
                                        </div>
                                        <div style={{ flex: 1 }} onClick={() => setShowCalendar(true)}>
                                            <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "5px", cursor: 'pointer' }}>Check-Out Date</label>
                                            <input
                                                type="text"
                                                required
                                                readOnly
                                                value={bookingDates.end}
                                                style={{ backgroundColor: '#F9FAFB', cursor: 'pointer' }}
                                                className="input-field"
                                                placeholder="Select on calendar"
                                            />
                                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                                                🕛 Check-out by 11:00 AM
                                            </div>
                                        </div>
                                    </div>

                                    {showCalendar && (
                                        <div style={{
                                            position: 'fixed',
                                            top: 0,
                                            left: 0,
                                            width: '100vw',
                                            height: '100vh',
                                            backgroundColor: 'rgba(15, 23, 42, 0.6)',
                                            backdropFilter: 'blur(4px)',
                                            zIndex: 9999,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '20px'
                                        }}>
                                            <div style={{
                                                backgroundColor: '#FFF',
                                                borderRadius: '16px',
                                                padding: '20px',
                                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                                                width: '100%',
                                                maxWidth: '380px',
                                                position: 'relative'
                                            }}>
                                                {/* Header */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1E293B', margin: 0 }}>Select Booking Dates</h3>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowCalendar(false);
                                                        }}
                                                        style={{
                                                            background: '#F1F5F9',
                                                            border: 'none',
                                                            borderRadius: '50%',
                                                            width: '30px',
                                                            height: '30px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            color: '#64748B',
                                                            fontSize: '1rem',
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>

                                                {/* Selected Summary */}
                                                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px dashed #E2E8F0' }}>
                                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                                        <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', fontWeight: '700' }}>Check-In</div>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: bookingDates.start ? 'var(--primary)' : '#94A3B8' }}>
                                                            {bookingDates.start || "Select date"}
                                                        </div>
                                                    </div>
                                                    <div style={{ alignSelf: 'center', color: '#CBD5E1', fontWeight: 'bold' }}>→</div>
                                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                                        <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', fontWeight: '700' }}>Check-Out</div>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: bookingDates.end ? 'var(--primary)' : '#94A3B8' }}>
                                                            {bookingDates.end || "Select date"}
                                                        </div>
                                                    </div>
                                                </div>

                                                <InteractiveCalendar
                                                    bookedDates={bookedDates}
                                                    startValue={bookingDates.start}
                                                    endValue={bookingDates.end}
                                                    onChange={(dates) => {
                                                        setBookingDates(dates);
                                                        if (dates.start && dates.end) {
                                                            setTimeout(() => {
                                                                setShowCalendar(false);
                                                            }, 600);
                                                        }
                                                    }}
                                                />

                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowCalendar(false);
                                                    }}
                                                    disabled={!bookingDates.start || !bookingDates.end}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px',
                                                        backgroundColor: (bookingDates.start && bookingDates.end) ? 'var(--primary, #16a34a)' : '#CBD5E1',
                                                        color: 'white',
                                                        borderRadius: '8px',
                                                        fontWeight: '700',
                                                        border: 'none',
                                                        marginTop: '15px',
                                                        cursor: (bookingDates.start && bookingDates.end) ? 'pointer' : 'not-allowed',
                                                        transition: 'background-color 0.2s'
                                                    }}
                                                >
                                                    Confirm Dates
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {dateOverlapError && (
                                <div style={{ padding: '10px', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '4px', marginTop: '15px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                    ⚠️ {dateOverlapError}
                                </div>
                            )}
                            {isRoomBooking && bookedDates.length > 0 && (
                                <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#F8F9F9', borderRadius: '8px', border: '1px solid #EAEAEA' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px' }}>Currently Booked Dates:</div>
                                    <ul style={{ listStyleType: 'none', padding: 0, margin: 0, fontSize: '0.8rem', color: '#555' }}>
                                        {bookedDates.map((b, idx) => (
                                            <li key={idx}>🚫 {new Date(b.startDate).toLocaleDateString()} to {new Date(b.endDate).toLocaleDateString()}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: "30px" }}>
                            <h3 style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "15px" }}>Payment Method</h3>
                            <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", flexDirection: "column" }}>

                                <label style={{ flex: '1 1 auto', border: paymentMethod === 'ONLINE' ? '2px solid var(--primary)' : '1px solid #EAEAEA', borderRadius: '8px', padding: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input type="radio" value="ONLINE" checked={paymentMethod === 'ONLINE'} onChange={() => setPaymentMethod('ONLINE')} style={{ display: 'none' }} />
                                    <Zap size={24} color={paymentMethod === 'ONLINE' ? 'var(--primary)' : 'var(--text-muted)'} />
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>Pay Online (Razorpay)</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Credit Card, UPI, Net Banking</div>
                                    </div>
                                </label>

                                <label style={{ flex: '1 1 auto', border: paymentMethod === 'COD' ? '2px solid var(--primary)' : '1px solid #EAEAEA', borderRadius: '8px', padding: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input type="radio" value="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} style={{ display: 'none' }} />
                                    <Banknote size={24} color={paymentMethod === 'COD' ? 'var(--primary)' : 'var(--text-muted)'} />
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{isRoomBooking ? "Pay on Check-in/out" : "Pay on Delivery"}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{isRoomBooking ? "Cash or UPI at the property" : "Cash or UPI"}</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <button type="submit" disabled={isSubmitting || hasOutOfRangeItems || hasClosedItems} className="btn btn-primary" style={{ width: "100%", padding: "15px", fontSize: "1.1rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", opacity: (isSubmitting || hasOutOfRangeItems || hasClosedItems) ? 0.7 : 1 }}>
                            {isSubmitting ? "Processing..." : (
                                <>
                                    <ShieldCheck size={20} />
                                    {isRoomBooking ? "Confirm Booking" : "Place Order"}
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>

            {/* Right Column - Order Summary */}
            <div style={{ flex: 1, backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: 'var(--shadow-card)', position: 'sticky', top: '90px' }}>
                <h3 style={{ fontSize: "1.3rem", fontWeight: "bold", marginBottom: "20px", borderBottom: "1px solid #EEE", paddingBottom: "10px" }}>
                    Order Summary
                </h3>

                {isRoomBooking ? (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <span style={{ fontWeight: '500' }}>Room Title</span>
                            <span>{roomDetails.title}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            <span>Host</span>
                            <span>{roomDetails.sellerName}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <span style={{ fontWeight: '500' }}>Rate</span>
                            <span>₹{roomDetails.price} / night</span>
                        </div>
                        <hr style={{ border: 'none', borderTop: '1px solid #EEE', marginBottom: '20px' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                            <span>Total Payable</span>
                            <span>₹{totalPayable}</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '10px', textAlign: 'center' }}>Total will adjust based on selected dates above.</p>
                    </div>
                ) : (
                    <div>
                        <div style={{ marginBottom: "20px", maxHeight: "400px", overflowY: "auto", paddingRight: "10px" }}>
                            {cartItems.map((item) => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #f9fafb' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '500' }}>{item.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>₹{item.price} each</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #EAEAEA', borderRadius: '6px', overflow: 'hidden' }}>
                                            <button type="button" onClick={() => decreaseQuantity(item.id)} style={{ padding: '4px 10px', backgroundColor: '#F9FAFB', borderRight: '1px solid #EAEAEA', cursor: 'pointer', border: 'none' }}>-</button>
                                            <span style={{ padding: '0 12px', fontSize: '0.9rem', fontWeight: '500' }}>{item.quantity}</span>
                                            <button type="button" onClick={() => addToCart({ ...item, quantity: 1 })} style={{ padding: '4px 10px', backgroundColor: '#F9FAFB', borderLeft: '1px solid #EAEAEA', cursor: 'pointer', border: 'none' }}>+</button>
                                        </div>
                                        <div style={{ fontWeight: 'bold', minWidth: '60px', textAlign: 'right' }}>₹{item.price * item.quantity}</div>
                                        <button type="button" onClick={() => removeFromCart(item.id)} style={{ padding: '6px', color: '#EF4444', backgroundColor: '#FEF2F2', borderRadius: '6px', cursor: 'pointer', border: 'none', fontSize: '0.8rem' }}>Remove</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <hr style={{ border: 'none', borderTop: '1px solid #EEE', marginBottom: '20px' }} />

                        {/* Coupons Section */}
                        {availableCoupons.length > 0 && (
                            <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#F9FAFB", borderRadius: "8px", border: "1px dashed #CBD5E1" }}>
                                <h4 style={{ fontSize: "1rem", fontWeight: "bold", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <Tag size={16} color="var(--primary)" />
                                    Available Offers
                                </h4>
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    {availableCoupons.map((coupon) => {
                                        const isMinOrderMet = !coupon.minimumCartValue || basePayable >= coupon.minimumCartValue;

                                        return (
                                            <label key={coupon.id} style={{
                                                display: "flex",
                                                alignItems: "flex-start",
                                                gap: "10px",
                                                cursor: isMinOrderMet ? "pointer" : "not-allowed",
                                                padding: "10px",
                                                backgroundColor: "white",
                                                borderRadius: "6px",
                                                border: appliedCoupon?.id === coupon.id ? "2px solid var(--primary)" : "1px solid #EAEAEA",
                                                opacity: isMinOrderMet ? 1 : 0.6
                                            }}>
                                                <input
                                                    type="radio"
                                                    name="coupon"
                                                    disabled={!isMinOrderMet}
                                                    checked={appliedCoupon?.id === coupon.id}
                                                    onChange={() => setAppliedCoupon(coupon)}
                                                    style={{ marginTop: "4px" }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: "bold", color: "var(--primary)" }}>{coupon.code}</div>
                                                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{coupon.description}</div>
                                                    {!isMinOrderMet && (
                                                        <div style={{ fontSize: "0.8rem", color: "#EF4444", fontWeight: "600", marginTop: "4px" }}>
                                                            Min. Order ₹{coupon.minimumCartValue} required
                                                        </div>
                                                    )}
                                                    <div style={{ fontSize: "0.8rem", fontWeight: "600", color: isMinOrderMet ? "#16a34a" : "#94a3b8", marginTop: "4px" }}>
                                                        Save {coupon.discountPercentage ? `${coupon.discountPercentage}%` : `₹${coupon.discountAmount}`}
                                                    </div>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                                {appliedCoupon && (
                                    <button
                                        type="button"
                                        onClick={() => setAppliedCoupon(null)}
                                        style={{ marginTop: "10px", fontSize: "0.85rem", color: "#EF4444", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                                    >
                                        Remove Coupon
                                    </button>
                                )}
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '1rem', color: 'var(--text-main)' }}>
                            <span>Subtotal</span>
                            <span>₹{basePayable}</span>
                        </div>
                        {discountAmount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '1rem', color: '#16a34a', fontWeight: '500' }}>
                                <span>Discount ({appliedCoupon?.code})</span>
                                <span>- ₹{discountAmount}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)', borderTop: '1px solid #EEE', paddingTop: '15px' }}>
                            <span>Total Amount</span>
                            <span>₹{totalPayable}</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--teal)', marginTop: '10px', fontWeight: '500', textAlign: 'center' }}>Ordering from {cartItems[0]?.sellerName}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div style={{ textAlign: "center", padding: "40px" }}>Loading checkout...</div>}>
            <CheckoutContent />
        </Suspense>
    );
}
