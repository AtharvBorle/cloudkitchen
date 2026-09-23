"use client";
import { fetchApi } from "@/lib/fetch-api";


import { useState, useEffect } from "react";
import { ShoppingCart, Search, MapPin } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useLocation } from "@/components/location-provider";
import { AddToCartButton } from "@/components/cart-buttons";
import { useSession } from "next-auth/react";
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

export default function UserFoodPage() {
    const { addToCart } = useCart();
    const { defaultAddress } = useLocation();
    const { status } = useSession();
    const [vegOnly, setVegOnly] = useState(false);
    const [foodItems, setFoodItems] = useState<any[]>([]);
    const [foodCategories, setFoodCategories] = useState<any[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

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
                let cats: any[] = [];
                let activePin = (defaultAddress?.pincode || "").trim() || null;

                const exploreRes = await fetchApi("/api/public/explore");
                if (exploreRes.ok) {
                    const exploreData = await exploreRes.json();
                    items = exploreData.foodItems || [];
                    cats = exploreData.foodCategories || [];
                }

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
                        }
                    } catch {
                        // Fallback to explore catalogue data
                    }
                }

                if (activePin) {
                    const cleanPin = activePin.trim();
                    items = items.filter((item: any) => {
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
                    });
                }

                if (isMounted) {
                    setFoodItems(items);
                    setFoodCategories(cats);
                }
            } catch (error) {
                console.error("Failed to fetch food items", error);
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

        // Read query parameter from URL without triggering Next.js deopts
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const q = params.get("query");
            if (q) setSearchQuery(q);
            const cat = params.get("category");
            if (cat) setSelectedCategoryId(cat);
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

    const filteredFood = foodItems
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

            // 5 km delivery radius filter
            if (hasUserCoords && item.distanceKm !== undefined) {
                if (item.distanceKm > MAX_DELIVERY_RADIUS_KM) return false;
            } else if (defaultAddress?.pincode) {
                const guestPin = defaultAddress.pincode.trim();
                const pins = item.deliveryPincodes ? item.deliveryPincodes.split(",").map((p: any) => p.trim()) : [];
                const match = item.sellerPincode === guestPin || pins.includes(guestPin);
                if (!match) return false;
            }

            if (vegOnly) {
                if (item.itemType !== 'VEG') return false;
                if (item.sellerFoodType !== 'VEG') return false;
            }
            if (selectedCategoryId && item.foodCategoryId !== selectedCategoryId) {
                return false;
            }
            return (
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.sellerCity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.sellerLocality?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.sellerLandmark?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.sellerPincode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        });

    const getGroupedFood = (items: any[]) => {
        const groups: { [key: string]: any[] } = {};
        items.forEach(item => {
            const catName = item.foodCategory?.name || "Signature Dishes";
            if (!groups[catName]) groups[catName] = [];
            groups[catName].push(item);
        });
        return groups;
    };

    const grouped = getGroupedFood(filteredFood);

    return (
        <div style={{ paddingBottom: '50px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--text-main)", marginBottom: "5px" }}>Order Food</h1>
                    <p style={{ color: "var(--text-muted)" }}>Explore all available homely meals from verified kitchens.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', userSelect: 'none' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)' }}>Pure Veg 🌱</span>
                        <div
                            onClick={() => setVegOnly(!vegOnly)}
                            style={{
                                width: '50px',
                                height: '26px',
                                backgroundColor: vegOnly ? '#10B981' : '#E2E8F0',
                                borderRadius: '9999px',
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s ease',
                                border: '1px solid #E2E8F0',
                                boxShadow: vegOnly ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none'
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
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)'
                            }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'white', border: '1px solid #EAEAEA', borderRadius: '8px', padding: '5px 15px', width: '300px' }}>
                        <Search size={18} color="var(--text-muted)" />
                        <input
                            type="text"
                            placeholder="Search area, locality, or food..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ border: 'none', outline: 'none', padding: '10px', width: '100%', fontSize: '0.95rem' }}
                        />
                    </div>
                </div>
            </div>

            {/* Admin-created Categories Slider */}
            {foodCategories.length > 0 && (
                <div style={{ marginBottom: '35px' }}>
                    <div style={{ 
                        display: 'flex', 
                        gap: '15px', 
                        overflowX: 'auto', 
                        paddingBottom: '15px',
                    }} className="hide-scrollbar">
                        {/* "All" button */}
                        <div 
                            onClick={() => setSelectedCategoryId(null)}
                            style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                minWidth: '80px', 
                                cursor: 'pointer',
                                transition: 'transform 0.2s'
                            }}
                            className="category-circle-card"
                        >
                            <div style={{ 
                                width: '64px', 
                                height: '64px', 
                                borderRadius: '50%', 
                                border: selectedCategoryId === null ? '3px solid var(--teal)' : '2px solid #E2E8F0', 
                                boxShadow: selectedCategoryId === null ? '0 4px 15px rgba(0,128,128,0.3)' : '0 2px 6px rgba(0,0,0,0.05)',
                                backgroundColor: 'white',
                                color: 'black',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '0.9rem',
                                transition: 'all 0.2s ease',
                                transform: selectedCategoryId === null ? 'scale(1.1)' : 'scale(1)'
                            }}>
                                All
                            </div>
                            <span style={{ 
                                fontSize: '0.8rem', 
                                fontWeight: selectedCategoryId === null ? '700' : '500', 
                                color: selectedCategoryId === null ? 'var(--teal)' : 'var(--text-main)', 
                                backgroundColor: selectedCategoryId === null ? 'rgba(0,128,128,0.08)' : 'transparent',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                marginTop: '6px',
                                transition: 'all 0.2s ease'
                            }}>
                                All Items
                            </span>
                        </div>

                        {foodCategories.map((cat: any) => {
                            const isSelected = selectedCategoryId === cat.id;
                            return (
                                <div 
                                    key={cat.id} 
                                    onClick={() => setSelectedCategoryId(cat.id)}
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
                                        width: '64px', 
                                        height: '64px', 
                                        borderRadius: '50%', 
                                        overflow: 'hidden', 
                                        border: isSelected ? '3px solid var(--teal)' : '2px solid #E2E8F0',
                                        padding: isSelected ? '2px' : '0px',
                                        boxShadow: isSelected ? '0 4px 15px rgba(0,128,128,0.3)' : '0 2px 6px rgba(0,0,0,0.05)',
                                        backgroundColor: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease',
                                        transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                                    }}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img 
                                            src={cat.imageUrl || `https://placehold.co/100x100?text=${encodeURIComponent(cat.name)}`} 
                                            alt={cat.name} 
                                            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                                        />
                                    </div>
                                    <span style={{ 
                                        fontSize: '0.8rem', 
                                        fontWeight: isSelected ? '700' : '500', 
                                        color: isSelected ? 'var(--teal)' : 'var(--text-main)', 
                                        backgroundColor: isSelected ? 'rgba(0,128,128,0.08)' : 'transparent',
                                        padding: '4px 10px',
                                        borderRadius: '12px',
                                        marginTop: '6px',
                                        textAlign: 'center', 
                                        whiteSpace: 'nowrap', 
                                        textOverflow: 'ellipsis', 
                                        overflow: 'hidden', 
                                        width: '85px',
                                        transition: 'all 0.2s ease'
                                    }}>
                                        {cat.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading menus...</div>
            ) : filteredFood.length === 0 ? (
                <div style={{ backgroundColor: '#F8F9F9', padding: '40px', textAlign: 'center', borderRadius: '12px', color: 'var(--text-muted)' }}>
                    {searchQuery ? "No food items found matching your search." : "No food items available at the moment."}
                </div>
            ) : selectedCategoryId ? (
                /* Single selected category layout */
                <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '20px' }}>
                        {foodCategories.find(c => c.id === selectedCategoryId)?.name || "Food Items"}
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
                        {filteredFood.map(item => (
                            <div key={item.id} style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s ease' }} className="hover-lift">
                                <Link href={`/shop/${item.sellerTrackingId}`} style={{ display: 'block', height: '180px', position: 'relative' }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={item.imageUrl || placeholderImage} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'white', padding: '5px 10px', borderRadius: '20px', fontWeight: 'bold', color: 'var(--coral)', fontSize: '0.9rem', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                                        ₹{item.price}
                                    </div>
                                </Link>
                                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <Link href={`/shop/${item.sellerTrackingId}`} style={{ color: 'inherit', textDecoration: 'none', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {item.name}
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontSize: '0.7rem',
                                                fontWeight: 'bold',
                                                color: 'white',
                                                backgroundColor: item.itemType === 'NON_VEG' ? '#EF4444' : item.itemType === 'JAIN' ? '#10B981' : item.itemType === 'VEGAN' ? '#059669' : '#10B981'
                                            }}>
                                                {item.itemType === 'NON_VEG' ? 'Non-Veg' : item.itemType === 'JAIN' ? 'Jain 🙏' : item.itemType === 'VEGAN' ? 'Vegan 🌿' : 'Veg'}
                                            </span>
                                        </h3>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '15px' }}>
                                            By {item.sellerName} • {item.sellerCity}
                                            {item.distanceText ? (
                                                <span style={{ marginLeft: '8px', color: '#FF6B00', fontWeight: '700', backgroundColor: '#FFF3EB', padding: '2px 6px', borderRadius: '6px', fontSize: '0.78rem' }}>
                                                    📍 {item.distanceText}
                                                </span>
                                            ) : null}
                                        </p>
                                        <p style={{ color: '#555', fontSize: '0.9rem', flex: 1, marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</p>
                                        <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '15px' }}>
                                            {item.stockQuantity === 0 ? (
                                                <span style={{ color: '#EF4444', fontWeight: 'bold' }}>Out of Stock</span>
                                            ) : item.stockQuantity > 0 ? (
                                                <span>Only {item.stockQuantity} left!</span>
                                            ) : (
                                                <span style={{ color: '#10B981' }}>In Stock</span>
                                            )}
                                        </div>
                                    </Link>

                                    <AddToCartButton item={{ ...item, sellerId: item.sellerId, sellerName: item.sellerName }} disabled={!item.sellerIsOnline || item.stockQuantity === 0} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* Grouped category-wise layout */
                <div>
                    {Object.keys(grouped).map(catName => (
                        <div key={catName} style={{ marginBottom: '40px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{catName}</h2>
                                <span style={{ height: '2px', backgroundColor: '#EAEAEA', flex: 1 }} />
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>{grouped[catName].length} items</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
                                {grouped[catName].map(item => (
                                    <div key={item.id} style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s ease' }} className="hover-lift">
                                        <Link href={`/shop/${item.sellerTrackingId}`} style={{ display: 'block', height: '180px', position: 'relative' }}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={item.imageUrl || placeholderImage} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'white', padding: '5px 10px', borderRadius: '20px', fontWeight: 'bold', color: 'var(--coral)', fontSize: '0.9rem', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                                                ₹{item.price}
                                            </div>
                                        </Link>
                                        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <Link href={`/shop/${item.sellerTrackingId}`} style={{ color: 'inherit', textDecoration: 'none', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {item.name}
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 'bold',
                                                        color: 'white',
                                                        backgroundColor: item.itemType === 'NON_VEG' ? '#EF4444' : item.itemType === 'JAIN' ? '#10B981' : item.itemType === 'VEGAN' ? '#059669' : '#10B981'
                                                    }}>
                                                        {item.itemType === 'NON_VEG' ? 'Non-Veg' : item.itemType === 'JAIN' ? 'Jain 🙏' : item.itemType === 'VEGAN' ? 'Vegan 🌿' : 'Veg'}
                                                    </span>
                                                </h3>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '15px' }}>
                                                    By {item.sellerName} • {item.sellerCity}
                                                    {item.distanceText ? (
                                                        <span style={{ marginLeft: '8px', color: '#FF6B00', fontWeight: '700', backgroundColor: '#FFF3EB', padding: '2px 6px', borderRadius: '6px', fontSize: '0.78rem' }}>
                                                            📍 {item.distanceText}
                                                        </span>
                                                    ) : null}
                                                </p>
                                                <p style={{ color: '#555', fontSize: '0.9rem', flex: 1, marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</p>
                                                <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '15px' }}>
                                                    {item.stockQuantity === 0 ? (
                                                        <span style={{ color: '#EF4444', fontWeight: 'bold' }}>Out of Stock</span>
                                                    ) : item.stockQuantity > 0 ? (
                                                        <span>Only {item.stockQuantity} left!</span>
                                                    ) : (
                                                        <span style={{ color: '#10B981' }}>In Stock</span>
                                                    )}
                                                </div>
                                            </Link>

                                            <AddToCartButton item={{ ...item, sellerId: item.sellerId, sellerName: item.sellerName }} disabled={!item.sellerIsOnline || item.stockQuantity === 0} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
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
