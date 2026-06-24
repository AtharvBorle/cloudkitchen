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
    const [foodFilter, setFoodFilter] = useState<"ALL" | "VEG" | "NON_VEG">("ALL");
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
                        <img src={seller.bannerImageUrl} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                )}

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '10px' }}>{seller.businessName || seller.user.name}</h1>
                    <p style={{ fontSize: '1.1rem', marginBottom: '5px' }}>{`${seller.addressFlat || ""}, ${seller.addressLocality || ""}${seller.addressLandmark ? `, ${seller.addressLandmark}` : ""}` || `${seller.user.city} - ${seller.user.pincode}`}</p>
                    <p style={{ fontSize: '1.1rem', marginBottom: '5px' }}>{seller.user.city}</p>
                    <p style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Phone: {seller.user.phone}</p>

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

            <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>

                {!seller.isOnline && (
                    <div style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '20px', borderRadius: '8px', marginBottom: '30px', textAlign: 'center', border: '1px solid #F87171' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Store is Currently Offline</h3>
                        <p>This kitchen is not accepting orders at this time. Please check back later.</p>
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
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {(["ALL", "VEG", "NON_VEG"] as const).map((filter) => {
                                        const label = filter === "ALL" ? "All" : filter === "VEG" ? "Veg 🌱" : "Non-Veg 🍖";
                                        const isActive = foodFilter === filter;
                                        return (
                                            <button
                                                key={filter}
                                                onClick={() => setFoodFilter(filter)}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '20px',
                                                    border: isActive ? 'none' : '1px solid #D1D5DB',
                                                    backgroundColor: isActive ? '#10B981' : 'white',
                                                    color: isActive ? 'white' : 'var(--text-main)',
                                                    fontWeight: '600',
                                                    fontSize: '0.9rem',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    boxShadow: isActive ? '0 4px 10px rgba(16, 185, 129, 0.25)' : 'none'
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
                                    if (foodFilter === "VEG") return item.itemType === "VEG";
                                    if (foodFilter === "NON_VEG") return item.itemType === "NON_VEG";
                                    return true;
                                });

                            if (filteredFoodItems.length === 0) {
                                return (
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>
                                        {foodFilter === "ALL" ? "No items available at the moment." : `No ${foodFilter === "VEG" ? "Veg" : "Non-Veg"} items available.`}
                                    </p>
                                );
                            }

                            return (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px', marginBottom: '50px' }}>
                                    {filteredFoodItems.map((item: any) => (
                                        <div key={item.id} style={{ backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ height: '200px', backgroundColor: '#EEE' }}>
                                                <img src={item.imageUrl || placeholderImage} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                            <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5px' }}>
                                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {item.name}
                                                            <span style={{
                                                                display: 'inline-block',
                                                                padding: '2px 6px',
                                                                borderRadius: '4px',
                                                                fontSize: '0.7rem',
                                                                fontWeight: 'bold',
                                                                color: 'white',
                                                                backgroundColor: item.itemType === 'NON_VEG' ? '#EF4444' : '#10B981'
                                                            }}>
                                                                {item.itemType === 'NON_VEG' ? 'Non-Veg' : 'Veg'}
                                                            </span>
                                                        </span>
                                                        
                                                        {/* Item Rating Badge */}
                                                        {item.averageRating > 0 && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#FEF3C7', padding: '2px 8px', borderRadius: '6px', width: 'fit-content' }}>
                                                                <Star size={12} fill="#D97706" color="#D97706" />
                                                                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#D97706' }}>
                                                                    {item.averageRating} ({item.totalRatings})
                                                                </span>
                                                            </div>
                                                        )}
                                                    </h3>
                                                    <span style={{ color: 'var(--coral)', fontWeight: 'bold', fontSize: '1.1rem' }}>₹{item.price}</span>
                                                </div>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', flex: 1, marginBottom: '10px' }}>{item.description}</p>
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

                                                <AddToCartButton item={{ ...item, sellerId: seller.id, sellerName: seller.businessName || seller.user.name }} disabled={!seller.isOnline || item.stockQuantity === 0 || !!(userAddress && !isDeliverable(item))} />
                                            </div>
                                        </div>
                                    ))}
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
