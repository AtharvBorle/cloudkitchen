"use client";
import { fetchApi } from "@/lib/fetch-api";


import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, LogIn } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { AddToCartButton, BookRoomButton } from "@/components/cart-buttons";
import { useLocation } from "@/components/location-provider";
import { useSession } from "next-auth/react";

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
    const { status } = useSession();

    const [vegOnly, setVegOnly] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activePincode, setActivePincode] = useState<string | null>(null);
    const [foodItems, setFoodItems] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [foodCategories, setFoodCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (status === "loading") return;
            setLoading(true);
            try {
                const url = (status === "authenticated") ? "/api/user/dashboard" : "/api/public/explore";
                const res = await fetchApi(url);
                const data = await res.json();
                if (res.ok) {
                    let items = data.foodItems || [];
                    let availableRooms = data.availableRooms || [];
                    
                    if (status !== "authenticated" && defaultAddress?.pincode) {
                        const guestPin = defaultAddress.pincode.trim();
                        items = items.filter((item: any) => {
                            if (item.deliveryPincodes) {
                                const pins = item.deliveryPincodes.split(",").map((p: any) => p.trim());
                                return pins.includes(guestPin);
                            }
                            return item.sellerPincode === guestPin;
                        });
                        availableRooms = availableRooms.filter((room: any) => room.sellerPincode === guestPin);
                    }
                    
                    setFoodItems(items);
                    setRooms(availableRooms);
                    setFoodCategories(data.foodCategories || []);
                    setActivePincode(data.userPincode || defaultAddress?.pincode || null);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
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

    const categoriesMap: { [key: string]: any[] } = {};
    filteredFoodItems.forEach(item => {
        const catName = item.foodCategory?.name || "Signature Dishes";
        if (!categoriesMap[catName]) {
            categoriesMap[catName] = [];
        }
        categoriesMap[catName].push(item);
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
                <div style={{ backgroundColor: '#F8F9F9', padding: '40px', textAlign: 'center', borderRadius: '12px', color: 'var(--text-muted)', marginBottom: '40px' }}>
                    No food items available in this area right now. Check back later!
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
                                    {items.map(item => (
                                        <div key={item.id} style={{ 
                                            backgroundColor: 'white', 
                                            borderRadius: '12px', 
                                            overflow: 'hidden', 
                                            boxShadow: 'var(--shadow-card)', 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            width: '280px',
                                            flexShrink: 0,
                                            transition: 'transform 0.2s ease, box-shadow 0.2s' 
                                        }} className="hover-lift">
                                            <Link href={`/shop/${item.sellerTrackingId}`} style={{ display: 'block', height: '160px', position: 'relative' }}>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={item.imageUrl || placeholderImage} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'white', padding: '4px 8px', borderRadius: '20px', fontWeight: 'bold', color: 'var(--coral)', fontSize: '0.85rem', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                                                    ₹{item.price}
                                                </div>
                                            </Link>
                                            <div style={{ padding: '15px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                <Link href={`/shop/${item.sellerTrackingId}`} style={{ color: 'inherit', textDecoration: 'none', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                    <h4 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '8px' }}>By {item.sellerName}</p>
                                                    <p style={{ color: '#555', fontSize: '0.8rem', marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '2.4rem' }}>{item.description}</p>
                                                    <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '10px' }}>
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
                        );
                    })}
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
