"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/fetch-api";
import Link from "next/link";
import { AddToCartButton, BookRoomButton } from "@/components/cart-buttons";
import PopupBannerDisplay from "@/components/PopupBannerDisplay";
import { useSession } from "next-auth/react";
import { UserHeader } from "@/app/dashboard/user/layout";
import { ExploreHeader } from "@/app/explore/layout";
import { useLocation } from "@/components/location-provider";
import { Star, MessageSquare, Utensils } from "lucide-react";
import { DietaryTag } from "@/components/common/DietaryTag";

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

export default function PublicShopClient({ trackingId }: { trackingId: string }) {
    const { data: session, status } = useSession();
    const { defaultAddress: userAddress } = useLocation();
    const [loading, setLoading] = useState(true);
    const [seller, setSeller] = useState<any | null>(null);
    const [error, setError] = useState<boolean>(false);
    const [foodFilter, setFoodFilter] = useState<"ALL" | "VEG" | "NON_VEG" | "JAIN" | "VEGAN">("ALL");
    const [activeTab, setActiveTab] = useState<"menu" | "reviews">("menu");

    const isDeliverable = (item: any) => {
        if (!userAddress || !userAddress.pincode) return true;
        const userPincode = userAddress.pincode.trim();
        if (item.deliveryPincodes) {
            const pins = item.deliveryPincodes.split(",").map((p: string) => p.trim());
            return pins.includes(userPincode);
        }
        return seller?.user?.pincode === userPincode;
    };

    useEffect(() => {
        if (!trackingId) return;

        const fetchShop = async () => {
            try {
                const res = await fetchApi(`/api/public/shop/${trackingId}`);
                if (res.ok) {
                    const data = await res.json();
                    setSeller(data.data || data);
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error("Error fetching public shop:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchShop();
    }, [trackingId]);

    if (loading) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>Loading store...</div>;
    }

    if (error || !seller) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <h2>Store Not Found</h2>
                <p>The store you are looking for does not exist or has been disabled.</p>
                <Link href="/" style={{ marginTop: '20px', color: 'var(--primary)', fontWeight: 'bold' }}>Go to Home</Link>
            </div>
        );
    }

    const placeholderImage = "https://placehold.co/400x250?text=No+Image";

    const getFirstImage = (jsonStr: string) => {
        try {
            const arr = JSON.parse(jsonStr);
            return arr.length > 0 ? arr[0] : placeholderImage;
        } catch {
            return placeholderImage;
        }
    };

    const renderStaticStars = (rating: number) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Star
                    key={i}
                    size={14}
                    fill={i <= rating ? "var(--coral, #F16F68)" : "none"}
                    color={i <= rating ? "var(--coral, #F16F68)" : "#CBD5E1"}
                    style={{ marginRight: '1px' }}
                />
            );
        }
        return <div style={{ display: 'flex' }}>{stars}</div>;
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F8F9F9', paddingBottom: '50px' }}>
            {status === "authenticated" && session?.user?.role === "USER" ? (
                <UserHeader />
            ) : (
                <ExploreHeader />
            )}
            <PopupBannerDisplay sellerId={seller.id} />

            {/* Header / Banner Area */}
            <div style={{ backgroundColor: '#555A5D', color: 'white', padding: '60px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                {seller.bannerImageUrl && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, opacity: 0.4 }}>
                        <img
                            src={seller.bannerImageUrl}
                            alt="Banner"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                filter: !seller.isOnline ? 'grayscale(100%)' : 'none',
                            }}
                        />
                    </div>
                )}

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '10px' }}>{seller.businessName || seller.user.name}</h1>
                    <p style={{ fontSize: '1.1rem', marginBottom: '5px' }}>{`${seller.addressFlat || ""}, ${seller.addressLocality || ""}${seller.addressLandmark ? `, ${seller.addressLandmark}` : ""}` || `${seller.user.city} - ${seller.user.pincode}`}</p>
                    <p style={{ fontSize: '1.1rem', marginBottom: '5px' }}>{seller.user.city}</p>
                    <p style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Phone: {seller.user.phone}</p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {!seller.isOnline && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#EF4444', padding: '6px 14px', borderRadius: '20px', color: 'white', fontWeight: '800', fontSize: '0.85rem', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                                <span>🔴 CLOSED</span>
                            </div>
                        )}
                        {/* Overall Rating Badge in Header */}
                        {seller.averageRating > 0 && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(15, 23, 42, 0.75)', padding: '6px 14px', borderRadius: '20px', backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <Star size={16} fill="var(--coral, #F16F68)" color="var(--coral, #F16F68)" />
                                <span style={{ fontWeight: '800', fontSize: '0.95rem' }}>{seller.averageRating}</span>
                                <span style={{ opacity: 0.8, fontSize: '0.85rem' }}>({seller.totalReviews} reviews)</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>

                {!seller.isOnline && (
                    <div style={{
                        backgroundColor: '#FEF2F2',
                        color: '#991B1B',
                        padding: '18px 24px',
                        borderRadius: '16px',
                        marginBottom: '30px',
                        border: '1.5px solid #FECACA',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <span style={{ fontSize: '26px' }}>🔴</span>
                            <div>
                                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: '0 0 4px 0', color: '#991B1B' }}>Store is Currently Closed</h3>
                                <p style={{ margin: 0, color: '#DC2626', fontSize: '0.9rem' }}>This cloud kitchen is not accepting orders at this time. You can explore the menu items below.</p>
                            </div>
                        </div>
                        <span style={{
                            backgroundColor: '#DC2626',
                            color: '#FFFFFF',
                            fontWeight: '800',
                            fontSize: '0.78rem',
                            padding: '6px 14px',
                            borderRadius: '12px',
                            letterSpacing: '0.6px',
                            textTransform: 'uppercase'
                        }}>
                            Not Accepting Orders
                        </span>
                    </div>
                )}

                {/* Tab switcher */}
                <div style={{ display: 'flex', borderBottom: '2px solid #E5E7EB', marginBottom: '30px', gap: '10px' }}>
                    <button
                        onClick={() => setActiveTab("menu")}
                        style={{
                            padding: '12px 24px',
                            fontSize: '1rem',
                            fontWeight: '700',
                            color: activeTab === "menu" ? "var(--primary, #10B981)" : "#6B7280",
                            borderBottom: activeTab === "menu" ? "3px solid var(--primary, #10B981)" : "3px solid transparent",
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            marginBottom: '-2px'
                        }}
                    >
                        Menu & Rooms
                    </button>
                    <button
                        onClick={() => setActiveTab("reviews")}
                        style={{
                            padding: '12px 24px',
                            fontSize: '1rem',
                            fontWeight: '700',
                            color: activeTab === "reviews" ? "var(--primary, #10B981)" : "#6B7280",
                            borderBottom: activeTab === "reviews" ? "3px solid var(--primary, #10B981)" : "3px solid transparent",
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            marginBottom: '-2px'
                        }}
                    >
                        Reviews & Ratings ({seller.totalReviews || 0})
                    </button>
                </div>

                {activeTab === "menu" ? (
                    <>
                        {/* Menu Section */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '2px solid #EAEAEA', paddingBottom: '10px', flexWrap: 'wrap', gap: '15px' }}>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>Menu</h2>
                            {seller.foodItems && seller.foodItems.length > 0 && (
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {(["ALL", "VEG", "NON_VEG", "JAIN", "VEGAN"] as const).map((filter) => {
                                        let label = "All";
                                        let activeBg = "#10B981";
                                        if (filter === "VEG") { label = "Veg 🌱"; activeBg = "#10B981"; }
                                        else if (filter === "NON_VEG") { label = "Non-Veg 🍖"; activeBg = "#EF4444"; }
                                        else if (filter === "JAIN") { label = "Jain 🙏"; activeBg = "#10B981"; }
                                        else if (filter === "VEGAN") { label = "Vegan 🌿"; activeBg = "#059669"; }

                                        const isActive = foodFilter === filter;
                                        return (
                                            <button
                                                key={filter}
                                                onClick={() => setFoodFilter(filter)}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '20px',
                                                    border: isActive ? 'none' : '1px solid #D1D5DB',
                                                    backgroundColor: isActive ? activeBg : 'white',
                                                    color: isActive ? 'white' : 'var(--text-main)',
                                                    fontWeight: '600',
                                                    fontSize: '0.9rem',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    boxShadow: isActive ? `0 4px 10px ${activeBg}35` : 'none'
                                                }}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {(() => {
                            const filteredFoodItems = seller.foodItems
                                .filter((item: any) => isCurrentlyOpen(item))
                                .filter((item: any) => {
                                    const raw = String(item.itemType || "VEG").toUpperCase();
                                    if (foodFilter === "VEG") return raw.includes("VEG") && !raw.includes("NON_VEG");
                                    if (foodFilter === "NON_VEG") return raw.includes("NON_VEG");
                                    if (foodFilter === "JAIN") return raw.includes("JAIN");
                                    if (foodFilter === "VEGAN") return raw.includes("VEGAN");
                                    return true;
                                });

                            if (filteredFoodItems.length === 0) {
                                let emptyMsg = "No items available at the moment.";
                                if (foodFilter === "VEG") emptyMsg = "No Veg items available.";
                                else if (foodFilter === "NON_VEG") emptyMsg = "No Non-Veg items available.";
                                else if (foodFilter === "JAIN") emptyMsg = "No Jain items available.";
                                else if (foodFilter === "VEGAN") emptyMsg = "No Vegan items available.";

                                return (
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>
                                        {emptyMsg}
                                    </p>
                                );
                            }

                            // Group items by category
                            const groupedItems: Record<string, any[]> = {};
                            const uncategorizedItems: any[] = [];

                            filteredFoodItems.forEach((item: any) => {
                                if (item.foodCategory && item.foodCategory.name) {
                                    const catName = item.foodCategory.name;
                                    if (!groupedItems[catName]) {
                                        groupedItems[catName] = [];
                                    }
                                    groupedItems[catName].push(item);
                                } else {
                                    uncategorizedItems.push(item);
                                }
                            });

                            const renderDietaryBadge = (itemType: string) => {
                                const raw = String(itemType || "VEG").split(",").map(s => s.trim().toUpperCase());
                                if (raw.includes("NON_VEG") || raw.includes("NON-VEG") || raw.includes("NON VEG")) {
                                    return <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', color: 'white', backgroundColor: '#EF4444' }}>Non-Veg</span>;
                                }
                                return (
                                    <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {raw.includes("VEG") && (
                                            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', color: 'white', backgroundColor: '#10B981' }}>Veg</span>
                                        )}
                                        {raw.includes("VEGAN") && (
                                            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', color: 'white', backgroundColor: '#059669' }}>Vegan 🌿</span>
                                        )}
                                        {raw.includes("JAIN") && (
                                            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', color: 'white', backgroundColor: '#10B981' }}>Jain 🙏</span>
                                        )}
                                    </div>
                                );
                            };

                            const FoodItemCard = ({ item }: { item: any }) => {
                                let addons: Array<{ id: string; name: string; price: number }> = [];
                                const rawAddons = item.addons || item.variants;
                                if (rawAddons) {
                                    try {
                                        const parsed = typeof rawAddons === "string" ? JSON.parse(rawAddons) : rawAddons;
                                        if (Array.isArray(parsed) && parsed.length > 0) {
                                            addons = parsed
                                                .filter((a: any) => a && (a.name || "").trim())
                                                .map((a: any, idx: number) => ({
                                                    id: String(a.id || idx + 1),
                                                    name: String(a.name || ""),
                                                    price: Number(a.price) || 0
                                                }));
                                        }
                                    } catch {}
                                }

                                const cartPayload = {
                                    id: item.id,
                                    foodItemId: item.id,
                                    name: item.name,
                                    price: Number(item.price) || 0,
                                    addons,
                                    stockQuantity: item.stockQuantity,
                                    maxStock: item.stockQuantity,
                                    sellerId: seller.id,
                                    sellerName: seller.businessName || seller.user.name,
                                    image: item.imageUrl,
                                    imageUrl: item.imageUrl,
                                    itemType: item.itemType,
                                    description: item.description,
                                };

                                return (
                                    <div style={{
                                        backgroundColor: !seller.isOnline ? '#F8FAFC' : 'white',
                                        borderRadius: '10px',
                                        overflow: 'hidden',
                                        boxShadow: 'var(--shadow-card)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        opacity: !seller.isOnline ? 0.85 : 1,
                                        border: !seller.isOnline ? '1px solid #E2E8F0' : undefined,
                                    }}>
                                        <div style={{ height: '200px', backgroundColor: '#EEE', position: 'relative' }}>
                                            <img
                                                src={item.imageUrl || placeholderImage}
                                                alt={item.name}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    filter: !seller.isOnline ? 'grayscale(100%)' : 'none',
                                                }}
                                            />
                                            <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 2 }}>
                                                <DietaryTag itemType={item.itemType} size="sm" />
                                            </div>
                                            {!seller.isOnline && (
                                                <div
                                                    style={{
                                                        position: "absolute",
                                                        top: 0,
                                                        left: 0,
                                                        right: 0,
                                                        bottom: 0,
                                                        backgroundColor: "rgba(15, 23, 42, 0.4)",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        zIndex: 3,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            backgroundColor: "#0F172A",
                                                            color: "#FFFFFF",
                                                            fontSize: "11px",
                                                            fontWeight: "800",
                                                            letterSpacing: "0.8px",
                                                            padding: "5px 12px",
                                                            borderRadius: "14px",
                                                            textTransform: "uppercase",
                                                            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                                                            border: "1px solid rgba(255,255,255,0.2)",
                                                        }}
                                                    >
                                                        🔴 CLOSED
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5px' }}>
                                                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {item.name}
                                                    </span>
                                                    
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                                                        {item.averageRating > 0 && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#FEF3C7', padding: '2px 8px', borderRadius: '6px', width: 'fit-content' }}>
                                                                <Star size={12} fill="#D97706" color="#D97706" />
                                                                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#D97706' }}>
                                                                    {item.averageRating} ({item.totalRatings})
                                                                </span>
                                                            </div>
                                                        )}
                                                        {item.foodSubCategory && (
                                                            <span style={{ backgroundColor: '#F0FDF4', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                {item.foodSubCategory.imageUrl ? (
                                                                    <img
                                                                        src={item.foodSubCategory.imageUrl}
                                                                        alt={item.foodSubCategory.name}
                                                                        style={{ width: "14px", height: "14px", borderRadius: "3px", objectFit: "cover" }}
                                                                    />
                                                                ) : "🏷️"}
                                                                {item.foodSubCategory.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </h3>
                                                <span style={{ color: 'var(--coral)', fontWeight: 'bold', fontSize: '1.15rem' }}>₹{item.price}</span>
                                            </div>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', flex: 1, marginBottom: '10px' }}>{item.description}</p>

                                            {/* Add-ons available preview */}
                                            {addons.length > 0 && (
                                                <div style={{ marginBottom: '12px' }}>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', marginBottom: '4px', textTransform: 'uppercase' }}>
                                                        Available Add-ons:
                                                    </div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                        {addons.map((a) => (
                                                            <span
                                                                key={a.id}
                                                                style={{
                                                                    padding: '3px 8px',
                                                                    borderRadius: '6px',
                                                                    fontSize: '0.78rem',
                                                                    fontWeight: '600',
                                                                    border: '1px solid #FFEDD5',
                                                                    backgroundColor: '#FFF7ED',
                                                                    color: '#EA580C',
                                                                }}
                                                            >
                                                                + {a.name} (₹{a.price})
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '15px' }}>
                                                {item.stockQuantity === 0 ? (
                                                    <span style={{ color: '#EF4444', fontWeight: 'bold' }}>Out of Stock</span>
                                                ) : item.stockQuantity > 0 ? (
                                                    <span>Only {item.stockQuantity} left!</span>
                                                ) : (
                                                    <span style={{ color: '#10B981' }}>In Stock</span>
                                                )}
                                            </div>

                                            {userAddress && !isDeliverable(item) && (
                                                <div style={{
                                                    backgroundColor: '#FEF2F2',
                                                    color: '#EF4444',
                                                    padding: '6px 10px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold',
                                                    marginBottom: '15px',
                                                    border: '1px solid #FEE2E2',
                                                    textAlign: 'center'
                                                }}>
                                                    Out of delivery range for {userAddress.pincode}
                                                </div>
                                            )}

                                            <AddToCartButton item={cartPayload} disabled={!seller.isOnline || item.stockQuantity === 0 || !!(userAddress && !isDeliverable(item))} />
                                        </div>
                                    </div>
                                );
                            };

                            return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', marginBottom: '50px' }}>
                                    {Object.entries(groupedItems).map(([categoryName, items]) => {
                                        const catImageUrl = items[0]?.foodCategory?.imageUrl;
                                        return (
                                            <div key={categoryName}>
                                                <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '15px', borderBottom: '1px solid #EAEAEA', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {catImageUrl && (
                                                        <img
                                                            src={catImageUrl}
                                                            alt={categoryName}
                                                            style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", border: "1px solid #EAEAEA" }}
                                                        />
                                                    )}
                                                    {categoryName}
                                                </h3>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
                                                    {items.map((it) => (
                                                        <FoodItemCard key={it.id} item={it} />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {uncategorizedItems.length > 0 && (
                                        <div>
                                            <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '15px', borderBottom: '1px solid #EAEAEA', paddingBottom: '8px' }}>
                                                General Menu
                                            </h3>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
                                                {uncategorizedItems.map((it) => (
                                                    <FoodItemCard key={it.id} item={it} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Rooms Section */}
                        {seller.rooms && seller.rooms.length > 0 && (
                            <>
                                <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '25px', borderBottom: '2px solid #EAEAEA', paddingBottom: '10px' }}>Rooms</h2>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' }}>
                                    {seller.rooms.map((room: any) => (
                                        <div key={room.id} style={{ backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ height: '220px', backgroundColor: '#EEE' }}>
                                                <img src={getFirstImage(room.images)} alt={room.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                            <div style={{ padding: '25px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                                    <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{room.title}</h3>
                                                    <span style={{ color: 'var(--coral)', fontWeight: 'bold', fontSize: '1.1rem' }}>₹{room.price}/night</span>
                                                </div>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', flex: 1, marginBottom: '15px' }}>{room.description}</p>
                                                <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '25px', fontWeight: '500' }}>Capacity: {room.capacity} Guests</p>

                                                <BookRoomButton room={{ ...room, sellerCity: seller.user.city, sellerName: seller.businessName || seller.user.name }} disabled={!seller.isOnline} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    /* Reviews Tab Content */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {!seller.reviews || seller.reviews.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'white', borderRadius: '12px', boxShadow: 'var(--shadow-card)', color: 'var(--text-muted)' }}>
                                No reviews left for this store yet. Be the first to place an order and leave feedback!
                            </div>
                        ) : (
                            seller.reviews.map((review: any) => (
                                <div key={review.id} style={{
                                    backgroundColor: 'white',
                                    padding: '25px',
                                    borderRadius: '12px',
                                    boxShadow: 'var(--shadow-card)',
                                    border: '1px solid #EAEAEA'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                                        <div>
                                            <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#334155' }}>
                                                {review.user?.name || "Anonymous Customer"}
                                            </span>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                Reviewed on {new Date(review.createdAt).toLocaleDateString("en-IN", {
                                                    year: "numeric", month: "long", day: "numeric"
                                                })}
                                            </div>
                                        </div>
                                        <div>{renderStaticStars(review.rating)}</div>
                                    </div>
                                    <p style={{
                                        fontSize: '0.9rem',
                                        color: 'var(--text-main)',
                                        margin: '0 0 15px 0',
                                        padding: '12px 15px',
                                        backgroundColor: '#F9FAFB',
                                        borderRadius: '8px',
                                        borderLeft: '3px solid var(--coral, #F16F68)',
                                        fontStyle: review.comment ? 'normal' : 'italic'
                                    }}>
                                        {review.comment || "Rated overall order without additional comments."}
                                    </p>

                                    {/* Item specific ratings */}
                                    {review.itemRatings && review.itemRatings.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', borderTop: '1px solid #F3F4F6', paddingTop: '12px' }}>
                                            {review.itemRatings.map((ir: any) => (
                                                <div key={ir.id} style={{
                                                    backgroundColor: '#FFFBEB',
                                                    border: '1px solid #FEF3C7',
                                                    borderRadius: '6px',
                                                    padding: '6px 12px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '2px'
                                                }}>
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#451A03' }}>
                                                        {ir.foodItem?.name || "Item"}
                                                    </span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        {renderStaticStars(ir.rating)}
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#D97706' }}>{ir.rating}/5</span>
                                                    </div>
                                                    {ir.comment && (
                                                        <span style={{ fontSize: '0.75rem', color: '#78350F', fontStyle: 'italic', borderTop: '1px dashed #FDE68A', paddingTop: '2px', marginTop: '2px' }}>
                                                            💬 "{ir.comment}"
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
