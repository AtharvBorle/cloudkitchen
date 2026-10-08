"use client";
import { fetchApi } from "@/lib/fetch-api";


import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, LogIn, MapPin, Star } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { AddToCartButton, BookRoomButton } from "@/components/cart-buttons";
import { useLocation } from "@/components/location-provider";
import { useSession } from "next-auth/react";
import { useRoomModule } from "@/context/RoomModuleContext";
import {
    calculateDistanceKm,
    MAX_DELIVERY_RADIUS_KM,
    getPincodeCoordinates,
    formatDistance,
} from "@/lib/geo-distance";

const isCurrentlyOpen = (item: any) => {
    const now = new Date();
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const currentDayStr = daysOfWeek[now.getDay()];

    if (item.operationalHours) {
        try {
            const hours = typeof item.operationalHours === 'string'
                ? JSON.parse(item.operationalHours)
                : item.operationalHours;
            const dayHours = hours[currentDayStr];
            if (dayHours) {
                if (!dayHours.isOpen) return false;
                if (!dayHours.openTime || !dayHours.closeTime) return true;

                const currentHours = now.getHours().toString().padStart(2, '0');
                const currentMinutes = now.getMinutes().toString().padStart(2, '0');
                const currentTimeStr = `${currentHours}:${currentMinutes}`;
                const openTime = dayHours.openTime;
                const closeTime = dayHours.closeTime;
                if (openTime <= closeTime) {
                    return currentTimeStr >= openTime && currentTimeStr <= closeTime;
                } else {
                    return currentTimeStr >= openTime || currentTimeStr <= closeTime;
                }
            }
        } catch (e) {
            console.error("Failed to parse operationalHours on client", e);
        }
    }

    if (!item.openTime || !item.closeTime) return true;
    const currentHours = now.getHours().toString().padStart(2, '0');
    const currentMinutes = now.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;
    const openTime = item.openTime;
    const closeTime = item.closeTime;
    if (openTime <= closeTime) {
        return currentTimeStr >= openTime && currentTimeStr <= closeTime;
    } else {
        return currentTimeStr >= openTime || currentTimeStr <= closeTime;
    }
};

export default function UserDashboard() {
    const { isRoomEnabled } = useRoomModule();
    const { addToCart, initiateRoomBooking } = useCart();
    const router = useRouter();
    const { defaultAddress, isLoading: isLocationLoading, openLocationModal } = useLocation();
    const { status } = useSession();

    const [vegOnly, setVegOnly] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activePincode, setActivePincode] = useState<string | null>(null);
    const [foodItems, setFoodItems] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [foodCategories, setFoodCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const hasPromptedLocationRef = useRef(false);

    // Auto-prompt location modal on dashboard if no location is selected
    useEffect(() => {
        if (!isLocationLoading && !defaultAddress && !hasPromptedLocationRef.current) {
            hasPromptedLocationRef.current = true;
            openLocationModal();
        }
    }, [isLocationLoading, defaultAddress, openLocationModal]);

    const userLat = defaultAddress?.latitude != null && !isNaN(Number(defaultAddress.latitude)) ? Number(defaultAddress.latitude) : null;
    const userLng = defaultAddress?.longitude != null && !isNaN(Number(defaultAddress.longitude)) ? Number(defaultAddress.longitude) : null;
    const userFallback = defaultAddress?.pincode ? getPincodeCoordinates(defaultAddress.pincode) : null;
    const finalUserLat = userLat ?? userFallback?.lat ?? null;
    const finalUserLng = userLng ?? userFallback?.lng ?? null;
    const hasUserCoords = finalUserLat !== null && finalUserLng !== null;

    useEffect(() => {
        let isMounted = true;

        const fetchDashboardData = async (isSilent = false) => {
            if (status === "loading") return;
            if (!isSilent) {
                setLoading(true);
            }
            try {
                let items: any[] = [];
                let availableRooms: any[] = [];
                let cats: any[] = [];
                let activePin = (defaultAddress?.pincode || "").trim() || null;

                // 1. Fetch explore data (which contains full active catalogue and servedPincodes)
                const exploreRes = await fetchApi("/api/public/explore");
                if (exploreRes.ok) {
                    const exploreData = await exploreRes.json();
                    items = exploreData.foodItems || [];
                    availableRooms = exploreData.availableRooms || [];
                    cats = exploreData.foodCategories || [];
                }

                // 2. If authenticated, try user dashboard endpoint to also check active user profile pincode
                if (status === "authenticated") {
                    try {
                        const userDashRes = await fetchApi("/api/user/dashboard");
                        if (userDashRes.ok) {
                            const userDashData = await userDashRes.json();
                            if (userDashData?.userPincode && !activePin) {
                                activePin = userDashData.userPincode.trim();
                            }
                            if (Array.isArray(userDashData?.foodItems) && userDashData.foodItems.length > 0) {
                                items = userDashData.foodItems;
                            }
                            if (Array.isArray(userDashData?.availableRooms) && userDashData.availableRooms.length > 0) {
                                availableRooms = userDashData.availableRooms;
                            }
                        }
                    } catch {
                        // Fallback to explore catalogue data
                    }
                }

                // 3. Robust Pincode Filtering
                if (activePin) {
                    const cleanPin = activePin.trim();
                    const isPincodeMatch = (item: any) => {
                        if (item.sellerPincode && item.sellerPincode.trim() === cleanPin) return true;
                        if (Array.isArray(item.servedPincodes)) {
                            for (const sp of item.servedPincodes) {
                                if (typeof sp === "string" && (sp.trim() === cleanPin || sp.includes(cleanPin))) return true;
                            }
                        }
                        if (item.deliveryPincodes) {
                            const pins = String(item.deliveryPincodes).split(",").map((p: any) => p.trim());
                            if (pins.includes(cleanPin)) return true;
                        }
                        if (item.sellerLocality) {
                            const locPins = item.sellerLocality.match(/\b\d{6}\b/g);
                            if (locPins && locPins.includes(cleanPin)) return true;
                        }
                        if (item.sellerLandmark) {
                            const landPins = item.sellerLandmark.match(/\b\d{6}\b/g);
                            if (landPins && landPins.includes(cleanPin)) return true;
                        }
                        return false;
                    };

                    const isRoomMatch = (room: any) => {
                        if (room.sellerPincode && room.sellerPincode.trim() === cleanPin) return true;
                        if (room.sellerLocality) {
                            const locPins = room.sellerLocality.match(/\b\d{6}\b/g);
                            if (locPins && locPins.includes(cleanPin)) return true;
                        }
                        return false;
                    };

                    items = items.filter(isPincodeMatch);
                    availableRooms = availableRooms.filter(isRoomMatch);
                }

                if (isMounted) {
                    setFoodItems(items);
                    setRooms(availableRooms);
                    setFoodCategories(cats);
                    setActivePincode(activePin);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                if (!isSilent && isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchDashboardData(false);

        // Live polling interval (every 4 seconds)
        const interval = setInterval(() => {
            if (document.visibilityState === "visible") {
                fetchDashboardData(true);
            }
        }, 4000);

        const handleSync = () => {
            fetchDashboardData(true);
        };

        const handleVisibility = () => {
            if (document.visibilityState === "visible") {
                fetchDashboardData(true);
            }
        };

        if (typeof window !== "undefined") {
            window.addEventListener("focus", handleSync);
            window.addEventListener("seller-status-updated", handleSync);
            window.addEventListener("cloudkitchen-new-notification", handleSync);
            window.addEventListener("storage", handleSync);
            document.addEventListener("visibilitychange", handleVisibility);
        }

        let bcStatus: BroadcastChannel | null = null;
        let bcNotif: BroadcastChannel | null = null;
        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
            try {
                bcStatus = new BroadcastChannel("cloudkitchen_seller_status_bc");
                bcStatus.onmessage = () => handleSync();
                bcNotif = new BroadcastChannel("cloudkitchen_seller_notifications_bc");
                bcNotif.onmessage = () => handleSync();
            } catch {}
        }

        return () => {
            isMounted = false;
            clearInterval(interval);
            if (typeof window !== "undefined") {
                window.removeEventListener("focus", handleSync);
                window.removeEventListener("seller-status-updated", handleSync);
                window.removeEventListener("cloudkitchen-new-notification", handleSync);
                window.removeEventListener("storage", handleSync);
                document.removeEventListener("visibilitychange", handleVisibility);
            }
            if (bcStatus) {
                try { bcStatus.close(); } catch {}
            }
            if (bcNotif) {
                try { bcNotif.close(); } catch {}
            }
        };
    }, [defaultAddress?.pincode, status]);

    const placeholderImage = "https://placehold.co/400x250?text=Delicious+Food";
    const roomPlaceholder = "https://placehold.co/400x250?text=Cozy+Room";

    const getFirstImage = (jsonStr: string) => {
        try {
            const arr = JSON.parse(jsonStr);
            return arr.length > 0 ? arr[0] : roomPlaceholder;
        } catch {
            return roomPlaceholder;
        }
    };

    if (loading) {
        return (
            <div>
                <style>{`
                    @keyframes shimmer {
                        0% { background-position: -200% 0; }
                        100% { background-position: 200% 0; }
                    }
                    .dash-skeleton {
                        background: linear-gradient(90deg, #F1F5F9 0%, #E2E8F0 50%, #F1F5F9 100%);
                        background-size: 200% 100%;
                        animation: shimmer 1.5s infinite ease-in-out;
                    }
                `}</style>
                {/* Banner Skeleton */}
                <div
                    className="dash-skeleton"
                    style={{
                        height: "180px",
                        borderRadius: "16px",
                        marginBottom: "32px",
                    }}
                />

                {/* Popular Bites Near You Section */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <div className="dash-skeleton" style={{ width: "220px", height: "28px", borderRadius: "8px" }} />
                    <div className="dash-skeleton" style={{ width: "80px", height: "18px", borderRadius: "6px" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "24px", marginBottom: "40px" }}>
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={`food-skel-${i}`}
                            style={{
                                backgroundColor: "white",
                                borderRadius: "12px",
                                overflow: "hidden",
                                border: "1px solid #E2E8F0",
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
                            <div className="dash-skeleton" style={{ width: "100%", height: "180px" }} />
                            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                                <div className="dash-skeleton" style={{ width: "70%", height: "20px", borderRadius: "6px" }} />
                                <div className="dash-skeleton" style={{ width: "50%", height: "14px", borderRadius: "4px" }} />
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                                    <div className="dash-skeleton" style={{ width: "60px", height: "18px", borderRadius: "4px" }} />
                                    <div className="dash-skeleton" style={{ width: "70px", height: "30px", borderRadius: "6px" }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Rooms Section */}
                {isRoomEnabled && (
                    <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <div className="dash-skeleton" style={{ width: "220px", height: "28px", borderRadius: "8px" }} />
                            <div className="dash-skeleton" style={{ width: "80px", height: "18px", borderRadius: "6px" }} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={`room-skel-${i}`}
                                    style={{
                                        backgroundColor: "white",
                                        borderRadius: "12px",
                                        overflow: "hidden",
                                        border: "1px solid #E2E8F0",
                                        display: "flex",
                                        flexDirection: "column",
                                    }}
                                >
                                    <div className="dash-skeleton" style={{ width: "100%", height: "200px" }} />
                                    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                                        <div className="dash-skeleton" style={{ width: "65%", height: "20px", borderRadius: "6px" }} />
                                        <div className="dash-skeleton" style={{ width: "45%", height: "14px", borderRadius: "4px" }} />
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                                            <div className="dash-skeleton" style={{ width: "80px", height: "20px", borderRadius: "4px" }} />
                                            <div className="dash-skeleton" style={{ width: "90px", height: "32px", borderRadius: "6px" }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        );
    }

    const filteredFoodItems = foodItems
        .map(item => {
            let distanceKm: number | undefined;
            let distanceText: string | undefined;
            if (hasUserCoords && item.sellerLatitude != null && item.sellerLongitude != null) {
                distanceKm = calculateDistanceKm(finalUserLat!, finalUserLng!, Number(item.sellerLatitude), Number(item.sellerLongitude));
                distanceText = formatDistance(distanceKm);
            }
            return {
                ...item,
                distanceKm,
                distanceText,
            };
        })
        .filter(item => {
            if (!isCurrentlyOpen(item)) return false;

            // Dynamic delivery radius filter per seller
            const maxRadius = item.sellerDeliveryRadiusKm && Number(item.sellerDeliveryRadiusKm) > 0
                ? Number(item.sellerDeliveryRadiusKm)
                : MAX_DELIVERY_RADIUS_KM;
            if (hasUserCoords && item.distanceKm !== undefined) {
                if (item.distanceKm > maxRadius) return false;
            } else if (defaultAddress?.pincode) {
                const guestPin = defaultAddress.pincode.trim();
                const pins = item.deliveryPincodes ? item.deliveryPincodes.split(",").map((p: any) => p.trim()) : [];
                const match = item.sellerPincode === guestPin || pins.includes(guestPin);
                if (!match) return false;
            }

            if (vegOnly) {
                const rawItemType = String(item.itemType || 'VEG').toUpperCase();
                const isItemVeg = rawItemType !== 'NON_VEG' && !rawItemType.includes('NON_VEG');
                if (!isItemVeg) return false;
            }
            return (
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.sellerCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.sellerLocality?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.sellerLandmark?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.sellerPincode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        })
        .sort((a, b) => {
            if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
                return a.distanceKm - b.distanceKm;
            }
            return 0;
        });

    const categoriesMap: { [key: string]: any[] } = {};
    filteredFoodItems.forEach(item => {
        const catName = item.foodCategory?.name || "Signature Dishes";
        if (!categoriesMap[catName]) {
            categoriesMap[catName] = [];
        }
        categoriesMap[catName].push(item);
    });

    const filteredRooms = rooms
        .map(room => {
            let distanceKm: number | undefined;
            let distanceText: string | undefined;
            if (hasUserCoords && room.sellerLatitude != null && room.sellerLongitude != null) {
                distanceKm = calculateDistanceKm(finalUserLat!, finalUserLng!, Number(room.sellerLatitude), Number(room.sellerLongitude));
                distanceText = formatDistance(distanceKm);
            }
            return {
                ...room,
                distanceKm,
                distanceText,
            };
        })
        .filter(room => {
            const roomRadius = room.sellerDeliveryRadiusKm && Number(room.sellerDeliveryRadiusKm) > 0
                ? Number(room.sellerDeliveryRadiusKm)
                : MAX_DELIVERY_RADIUS_KM;
            if (hasUserCoords && room.distanceKm !== undefined) {
                if (room.distanceKm > roomRadius) return false;
            } else if (defaultAddress?.pincode) {
                const guestPin = defaultAddress.pincode.trim();
                if (room.sellerPincode !== guestPin) return false;
            }

            return (
                room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                room.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                room.sellerCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
                room.sellerLocality?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                room.sellerLandmark?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                room.sellerPincode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                room.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        })
        .sort((a, b) => {
            if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
                return a.distanceKm - b.distanceKm;
            }
            return 0;
        });

    return (
        <div>
            {/* Location Required Banner */}
            {!defaultAddress && (
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    backgroundColor: "#FFFBEB",
                    border: "1px solid #FDE68A",
                    padding: "16px 24px",
                    borderRadius: "var(--radius-xl)",
                    marginBottom: "var(--spacing-6)",
                    flexWrap: "wrap",
                    boxShadow: "0 2px 10px rgba(217, 119, 6, 0.08)"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div style={{
                            backgroundColor: "#FEF3C7",
                            padding: "10px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#D97706"
                        }}>
                            <MapPin size={24} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "#92400E" }}>
                                Delivery Location Not Selected
                            </h3>
                            <p style={{ margin: "3px 0 0 0", fontSize: "0.88rem", color: "#B45309" }}>
                                Please select your delivery area to view cloud kitchens and fresh food{isRoomEnabled ? ", and rooms" : ""} near you.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={openLocationModal}
                        className="btn btn-primary"
                        style={{
                            padding: "9px 24px",
                            fontWeight: "700",
                            fontSize: "0.9rem",
                            width: "auto",
                            whiteSpace: "nowrap"
                        }}
                    >
                        Select Location
                    </button>
                </div>
            )}

            {/* Greetings Banner */}
            <div style={{
                backgroundColor: "var(--primary)",
                color: "white",
                padding: "var(--spacing-8)",
                borderRadius: "var(--radius-xl)",
                marginBottom: "var(--spacing-8)",
                backgroundImage: "linear-gradient(to right, var(--primary), var(--secondary))"
            }}>
                <h1 style={{ fontSize: "2.25rem", fontWeight: "bold", marginBottom: "var(--spacing-2)" }}>Hungry? Or looking for a stay?</h1>
                <div style={{ marginTop: "var(--spacing-6)", display: "flex", gap: "var(--spacing-4)", maxWidth: "600px", flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ display: 'flex', flex: 2, minWidth: '250px', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search area, locality, or food..."
                            style={{ flex: 1, border: "none", outline: "none", padding: "12px 15px", fontSize: "1rem", color: "#333" }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', userSelect: 'none' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'white' }}>Pure Veg 🌱</span>
                        <div
                            onClick={() => setVegOnly(!vegOnly)}
                            style={{
                                width: '50px',
                                height: '26px',
                                backgroundColor: vegOnly ? '#10B981' : 'rgba(255, 255, 255, 0.3)',
                                borderRadius: '9999px',
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s ease',
                                border: '1px solid rgba(255, 255, 255, 0.4)',
                                boxShadow: vegOnly ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
                            }}
                        >
                            <div style={{
                                width: '20px',
                                height: '20px',
                                backgroundColor: 'white',
                                borderRadius: '50%',
                                position: 'absolute',
                                top: '2px',
                                left: vegOnly ? '26px' : '2px',
                                transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                            }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Featured Food Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--text-main)" }}>Popular Bites Near You</h2>
                <Link href="/dashboard/user/food" style={{ color: 'var(--teal)', fontWeight: 'bold' }}>View All Food &rarr;</Link>
            </div>

            {/* Browse by Category Slider */}
            {foodCategories.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                    <div style={{ 
                        display: 'flex', 
                        gap: '20px', 
                        overflowX: 'auto', 
                        paddingBottom: '15px',
                    }} className="hide-scrollbar">
                        {foodCategories.map((cat: any) => (
                            <div 
                                key={cat.id} 
                                onClick={() => {
                                    router.push(`/dashboard/user/food?category=${encodeURIComponent(cat.id)}`);
                                }}
                                style={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center', 
                                    minWidth: '85px', 
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s'
                                }}
                                className="category-circle-card"
                            >
                                <div style={{ 
                                    width: '70px', 
                                    height: '70px', 
                                    borderRadius: '50%', 
                                    overflow: 'hidden', 
                                    border: '2px solid #EAEAEA', 
                                    marginBottom: '8px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                    backgroundColor: '#f9f9f9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img 
                                        src={cat.imageUrl || `https://placehold.co/100x100?text=${encodeURIComponent(cat.name)}`} 
                                        alt={cat.name} 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                    />
                                </div>
                                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)', textAlign: 'center', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '85px' }}>
                                    {cat.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {filteredFoodItems.length === 0 ? (
                <div style={{ backgroundColor: '#F8F9F9', padding: '40px 20px', textAlign: 'center', borderRadius: '12px', color: 'var(--text-muted)', marginBottom: '40px' }}>
                    {!defaultAddress ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                            <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569', fontWeight: '500' }}>
                                📍 No delivery location selected. Please select your location to discover kitchens serving in your area.
                            </p>
                            <button
                                type="button"
                                onClick={openLocationModal}
                                className="btn btn-primary"
                                style={{ padding: '8px 22px', fontSize: '0.9rem', width: 'auto' }}
                            >
                                Select Delivery Location
                            </button>
                        </div>
                    ) : (
                        "No food items available in this area right now. Check back later!"
                    )}
                </div>
            ) : (
                <div style={{ marginBottom: '50px' }}>
                    {Object.keys(categoriesMap).map((catName) => {
                        const items = categoriesMap[catName];
                        return (
                            <div key={catName} style={{ marginBottom: '35px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{catName}</h3>
                                    <span style={{ height: '2px', backgroundColor: '#EAEAEA', flex: 1 }} />
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>{items.length} options</span>
                                </div>
                                <div style={{ 
                                    display: 'flex', 
                                    gap: '20px', 
                                    overflowX: 'auto', 
                                    padding: '5px 5px 15px 5px',
                                }} className="hide-scrollbar">
                                    {items.map(item => {
                                        const isOutOfStock = item.stockQuantity === 0 || item.maxStock === 0 || item.isAvailable === false;
                                        const isGrey = !item.sellerIsOnline || isOutOfStock;

                                        return (
                                        <div key={item.id} style={{ 
                                            backgroundColor: isGrey ? '#F8FAFC' : 'white', 
                                            borderRadius: '12px', 
                                            overflow: 'hidden', 
                                            boxShadow: 'var(--shadow-card)', 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            width: '280px',
                                            flexShrink: 0,
                                            opacity: isGrey ? 0.75 : 1,
                                            border: isGrey ? '1.5px solid #E2E8F0' : '1px solid transparent',
                                            transition: 'transform 0.2s ease, box-shadow 0.2s' 
                                        }} className="hover-lift">
                                            <Link href={`/shop/${item.sellerTrackingId}`} style={{ display: 'block', height: '160px', position: 'relative' }}>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img 
                                                    src={item.imageUrl || placeholderImage} 
                                                    alt={item.name} 
                                                    style={{ 
                                                        width: '100%', 
                                                        height: '100%', 
                                                        objectFit: 'cover',
                                                        filter: isGrey ? 'grayscale(80%)' : 'none'
                                                    }} 
                                                />
                                                {isOutOfStock && (
                                                    <div
                                                        style={{
                                                            position: "absolute",
                                                            top: 0,
                                                            left: 0,
                                                            right: 0,
                                                            bottom: 0,
                                                            backgroundColor: "rgba(0, 0, 0, 0.45)",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            zIndex: 2,
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                backgroundColor: "#DC2626",
                                                                color: "#FFFFFF",
                                                                padding: "4px 16px",
                                                                fontSize: "0.75rem",
                                                                fontWeight: "800",
                                                                letterSpacing: "1px",
                                                                textTransform: "uppercase",
                                                                borderRadius: "4px",
                                                                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                                                                transform: "rotate(-6deg)",
                                                            }}
                                                        >
                                                            Out of Stock
                                                        </div>
                                                    </div>
                                                )}
                                                {item.distanceText && !isOutOfStock && (
                                                    <div style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: 'rgba(0,0,0,0.75)', color: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' }}>
                                                        📍 {item.distanceText}
                                                    </div>
                                                )}
                                                <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'white', padding: '4px 8px', borderRadius: '20px', fontWeight: 'bold', color: isGrey ? '#64748B' : 'var(--coral)', fontSize: '0.85rem', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                                                    ₹{item.price}
                                                </div>
                                            </Link>
                                            <div style={{ padding: '15px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                <Link href={`/shop/${item.sellerTrackingId}`} style={{ color: 'inherit', textDecoration: 'none', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                    <h4 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: isGrey ? '#64748B' : 'var(--text-main)', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {item.name}
                                                        <span style={{
                                                            display: 'inline-block',
                                                            padding: '1px 4px',
                                                            borderRadius: '3px',
                                                            fontSize: '0.6rem',
                                                            fontWeight: 'bold',
                                                            color: 'white',
                                                            backgroundColor: item.itemType === 'NON_VEG' ? '#EF4444' : '#10B981'
                                                        }}>
                                                            {item.itemType === 'NON_VEG' ? 'N' : 'V'}
                                                        </span>
                                                    </h4>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', backgroundColor: isGrey ? '#F1F5F9' : (item.rating && item.rating > 0 ? '#ECFDF5' : '#F1F5F9'), padding: '1px 6px', borderRadius: '4px' }}>
                                                            <Star size={10} fill={isGrey ? '#94A3B8' : (item.rating && item.rating > 0 ? '#10B981' : '#94A3B8')} color={isGrey ? '#94A3B8' : (item.rating && item.rating > 0 ? '#10B981' : '#94A3B8')} />
                                                            <span style={{ fontSize: '0.72rem', fontWeight: '800', color: isGrey ? '#94A3B8' : (item.rating && item.rating > 0 ? '#047857' : '#64748B') }}>
                                                                {item.rating && item.rating > 0 ? Number(item.rating).toFixed(1) : (item.averageRating && item.averageRating > 0 ? Number(item.averageRating).toFixed(1) : "New")}
                                                            </span>
                                                        </div>
                                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'space-between' }}>
                                                            <span>By {item.sellerName}</span>
                                                            {item.distanceText && (
                                                                <span style={{ color: 'var(--teal)', fontWeight: '600' }}>
                                                                    📍 {item.distanceText}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                    <p style={{ color: '#555', fontSize: '0.8rem', marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '2.4rem' }}>{item.description}</p>
                                                    {isOutOfStock ? (
                                                        <div style={{ fontSize: '0.75rem', marginBottom: '10px' }}>
                                                            <span style={{ color: '#DC2626', fontWeight: '700' }}>Out of Stock</span>
                                                        </div>
                                                    ) : item.stockQuantity !== undefined && item.stockQuantity > 0 && item.stockQuantity <= 5 ? (
                                                        <div style={{ fontSize: '0.75rem', marginBottom: '10px' }}>
                                                            <span style={{ color: '#D97706', fontWeight: '700' }}>Only {item.stockQuantity} left</span>
                                                        </div>
                                                    ) : null}
                                                </Link>
                                                <AddToCartButton item={{ ...item, sellerId: item.sellerId, sellerName: item.sellerName }} disabled={!item.sellerIsOnline || isOutOfStock} />
                                            </div>
                                        </div>
                                    );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {isRoomEnabled && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--text-main)" }}>Need a Place to Stay?</h2>
                        <Link href="/dashboard/user/rooms" style={{ color: 'var(--teal)', fontWeight: 'bold' }}>Browse Rooms &rarr;</Link>
                    </div>

            {filteredRooms.length === 0 ? (
                <div style={{ backgroundColor: '#F8F9F9', padding: '40px 20px', textAlign: 'center', borderRadius: '12px', color: 'var(--text-muted)' }}>
                    {!defaultAddress ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                            <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569', fontWeight: '500' }}>
                                📍 No location selected. Please select your location to view rooms available near you.
                            </p>
                            <button
                                type="button"
                                onClick={openLocationModal}
                                className="btn btn-primary"
                                style={{ padding: '8px 22px', fontSize: '0.9rem', width: 'auto' }}
                            >
                                Select Location
                            </button>
                        </div>
                    ) : (
                        "No rooms available in this area right now."
                    )}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px', marginBottom: '40px' }}>
                    {filteredRooms.slice(0, 3).map(room => (
                        <div key={room.id} style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column' }}>
                            <Link href={`/shop/${room.sellerTrackingId}`} style={{ display: 'block', height: '200px', position: 'relative' }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={getFirstImage(room.images)} alt={room.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{ position: 'absolute', bottom: '10px', left: '10px', backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', padding: '5px 12px', borderRadius: '20px', fontSize: '0.85rem' }}>
                                    Up to {room.capacity} Guests
                                </div>
                                {room.distanceText && (
                                    <div style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: 'rgba(0,0,0,0.75)', color: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' }}>
                                        📍 {room.distanceText}
                                    </div>
                                )}
                            </Link>
                            <div style={{ padding: '25px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <Link href={`/shop/${room.sellerTrackingId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                        <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--text-main)', paddingRight: '10px' }}>{room.title}</h3>
                                        <span style={{ color: 'var(--teal)', fontWeight: 'bold', fontSize: '1.1rem', whiteSpace: 'nowrap' }}>₹{room.price}/night</span>
                                    </div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '15px' }}>
                                        Location: {room.sellerCity} • Hosted by {room.sellerName} {room.distanceText ? `• 📍 ${room.distanceText}` : ''}
                                    </p>
                                    <p style={{ color: '#555', fontSize: '0.95rem', flex: 1, marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{room.description}</p>
                                </Link>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <BookRoomButton room={{ ...room, sellerCity: room.sellerCity, sellerName: room.sellerName }} disabled={!room.sellerIsOnline} />
                                    <Link href={`/shop/${room.sellerTrackingId}`} className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', padding: '10px' }}>
                                        Visit Shop
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
                </>
            )}


            {/* Global style for hover effect */}
            <style jsx global>{`
                .hover-lift:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
                }
                .category-circle-card:hover {
                    transform: scale(1.05);
                }
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
