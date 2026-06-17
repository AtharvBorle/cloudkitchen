"use client";
import { fetchApi } from "@/lib/fetch-api";


import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, LogIn } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { AddToCartButton, BookRoomButton } from "@/components/cart-buttons";
import { useLocation } from "@/components/location-provider";

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
    const { addToCart, initiateRoomBooking } = useCart();
    const router = useRouter();
    const { defaultAddress } = useLocation();

    const [vegOnly, setVegOnly] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activePincode, setActivePincode] = useState<string | null>(null);
    const [foodItems, setFoodItems] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const res = await fetchApi("/api/user/dashboard");
                const data = await res.json();
                if (res.ok) {
                    setFoodItems(data.foodItems);
                    setRooms(data.availableRooms);
                    setActivePincode(data.userPincode || null);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [defaultAddress?.pincode]);

    const placeholderImage = "https://via.placeholder.com/400x250?text=Delicious+Food";
    const roomPlaceholder = "https://via.placeholder.com/400x250?text=Cozy+Room";

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
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <div style={{ padding: '20px', fontSize: '1.2rem', color: 'var(--text-muted)' }}>Loading amazing options nearby...</div>
            </div>
        );
    }

    const filteredFoodItems = foodItems.filter(item => {
        if (!isCurrentlyOpen(item)) return false;
        if (vegOnly) {
            if (item.itemType !== 'VEG') return false;
            if (item.sellerFoodType !== 'VEG') return false;
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
    });

    const filteredRooms = rooms.filter(room =>
        room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.sellerCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.sellerLocality?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.sellerLandmark?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.sellerPincode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div>
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

            {filteredFoodItems.length === 0 ? (
                <div style={{ backgroundColor: '#F8F9F9', padding: '40px', textAlign: 'center', borderRadius: '12px', color: 'var(--text-muted)', marginBottom: '40px' }}>
                    No food items available in this area right now. Check back later!
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px', marginBottom: '50px' }}>
                    {filteredFoodItems.slice(0, 4).map(item => (
                        <div key={item.id} style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s ease' }} className="hover-lift">
                            <Link href={`/shop/${item.sellerTrackingId}`} style={{ display: 'block', height: '180px', position: 'relative' }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={item.imageUrl || placeholderImage} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'white', padding: '5px 10px', borderRadius: '20px', fontWeight: 'bold', color: 'var(--coral)', fontSize: '0.9rem', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                                    ₹{item.price}
                                </div>
                            </Link>
                            <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <Link href={`/shop/${item.sellerTrackingId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                                    </h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '15px' }}>By {item.sellerName} • {item.sellerCity}</p>
                                    <p style={{ color: '#555', fontSize: '0.9rem', flex: 1, marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</p>
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
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--text-main)" }}>Need a Place to Stay?</h2>
                <Link href="/dashboard/user/rooms" style={{ color: 'var(--teal)', fontWeight: 'bold' }}>Browse Rooms &rarr;</Link>
            </div>

            {filteredRooms.length === 0 ? (
                <div style={{ backgroundColor: '#F8F9F9', padding: '40px', textAlign: 'center', borderRadius: '12px', color: 'var(--text-muted)' }}>
                    No rooms available in this area right now.
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
                            </Link>
                            <div style={{ padding: '25px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <Link href={`/shop/${room.sellerTrackingId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                        <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--text-main)', paddingRight: '10px' }}>{room.title}</h3>
                                        <span style={{ color: 'var(--teal)', fontWeight: 'bold', fontSize: '1.1rem', whiteSpace: 'nowrap' }}>₹{room.price}/night</span>
                                    </div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '15px' }}>Location: {room.sellerCity} • Hosted by {room.sellerName}</p>
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


            {/* Global style for hover effect */}
            <style jsx global>{`
                .hover-lift:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
                }
            `}</style>
        </div>
    );
}
