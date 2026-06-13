"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/fetch-api";
import Link from "next/link";
import { AddToCartButton, BookRoomButton } from "@/components/cart-buttons";
import PopupBannerDisplay from "@/components/PopupBannerDisplay";

export default function PublicShopClient({ trackingId }: { trackingId: string }) {
    const [loading, setLoading] = useState(true);
    const [seller, setSeller] = useState<any | null>(null);
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        if (!trackingId) return;

        const fetchShop = async () => {
            try {
                const res = await fetchApi(`/api/public/shop/${trackingId}`);
                if (res.ok) {
                    const data = await res.json();
                    setSeller(data);
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

    const placeholderImage = "https://via.placeholder.com/400x250?text=No+Image";

    const getFirstImage = (jsonStr: string) => {
        try {
            const arr = JSON.parse(jsonStr);
            return arr.length > 0 ? arr[0] : placeholderImage;
        } catch {
            return placeholderImage;
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F8F9F9', paddingBottom: '50px' }}>
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
                    <p style={{ fontSize: '1.1rem' }}>Phone: {seller.user.phone}</p>
                </div>
            </div>

            <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>

                {!seller.isOnline && (
                    <div style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '20px', borderRadius: '8px', marginBottom: '30px', textAlign: 'center', border: '1px solid #F87171' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Store is Currently Offline</h3>
                        <p>This kitchen is not accepting orders at this time. Please check back later.</p>
                    </div>
                )}

                {/* Menu Section */}
                <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '25px', borderBottom: '2px solid #EAEAEA', paddingBottom: '10px' }}>Menu</h2>

                {seller.foodItems.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>No items available at the moment.</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px', marginBottom: '50px' }}>
                        {seller.foodItems.map((item: any) => (
                            <div key={item.id} style={{ backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ height: '200px', backgroundColor: '#EEE' }}>
                                    <img src={item.imageUrl || placeholderImage} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{item.name}</h3>
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

                                    <AddToCartButton item={{ ...item, sellerId: seller.id, sellerName: seller.businessName || seller.user.name }} disabled={!seller.isOnline || item.stockQuantity === 0} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Rooms Section */}
                {seller.rooms.length > 0 && (
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

            </div>
        </div>
    );
}
