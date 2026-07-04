"use client";
import { fetchApi } from "@/lib/fetch-api";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import Link from "next/link";
import { AddToCartButton } from "@/components/cart-buttons";
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

export default function ExploreFoodPage() {
    const [foodItems, setFoodItems] = useState<any[]>([]);
    const [foodCategories, setFoodCategories] = useState<any[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await fetchApi("/api/public/explore");
                const data = await res.json();
                if (res.ok) {
                    setFoodItems(data.foodItems || []);
                    setFoodCategories(data.foodCategories || []);
                }
            } catch (error) {
                console.error("Failed to fetch food items", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();

        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const q = params.get("query");
            if (q) setSearchQuery(q);
            const cat = params.get("category");
            if (cat) setSelectedCategoryId(cat);
        }
    }, []);

    const placeholderImage = "https://placehold.co/400x250?text=Delicious+Food";

    const { defaultAddress } = useLocation();
    const guestPincode = defaultAddress?.pincode ? defaultAddress.pincode.trim() : null;

    const filteredFood = foodItems.filter(item => {
        if (!isCurrentlyOpen(item)) return false;

        // Filter by guest location pincode if set
        if (guestPincode) {
            let matchesPincode = false;
            if (item.deliveryPincodes) {
                const pins = item.deliveryPincodes.split(",").map((p: string) => p.trim());
                matchesPincode = pins.includes(guestPincode);
            } else {
                matchesPincode = item.sellerPincode === guestPincode;
            }
            if (!matchesPincode) return false;
        }

        // Filter by category if selected
        if (selectedCategoryId && item.foodCategoryId !== selectedCategoryId) {
            return false;
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
                                width: '65px', 
                                height: '65px', 
                                borderRadius: '50%', 
                                border: selectedCategoryId === null ? '3px solid var(--teal)' : '2px solid #EAEAEA', 
                                marginBottom: '8px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                backgroundColor: selectedCategoryId === null ? 'var(--teal)' : '#f9f9f9',
                                color: selectedCategoryId === null ? 'white' : 'var(--text-main)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '0.9rem'
                            }}>
                                All
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: selectedCategoryId === null ? '700' : '600', color: 'var(--text-main)' }}>
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
                                        width: '65px', 
                                        height: '65px', 
                                        borderRadius: '50%', 
                                        overflow: 'hidden', 
                                        border: isSelected ? '3px solid var(--teal)' : '2px solid #EAEAEA', 
                                        marginBottom: '8px',
                                        boxShadow: isSelected ? '0 2px 10px rgba(0, 128, 128, 0.2)' : '0 2px 8px rgba(0,0,0,0.05)',
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
                                    <span style={{ fontSize: '0.8rem', fontWeight: isSelected ? '700' : '600', color: 'var(--text-main)', textAlign: 'center', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '85px' }}>
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
                                                backgroundColor: item.itemType === 'NON_VEG' ? '#EF4444' : '#10B981'
                                            }}>
                                                {item.itemType === 'NON_VEG' ? 'Non-Veg' : 'Veg'}
                                            </span>
                                        </h3>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '15px' }}>By {item.sellerName} • {item.sellerCity}</p>
                                        <p style={{ color: '#555', fontSize: '0.9rem', flex: 1, marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</p>
                                    </Link>

                                    <AddToCartButton item={{ ...item, sellerId: item.sellerId, sellerName: item.sellerName }} disabled={!item.sellerIsOnline} />
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
                                                        backgroundColor: item.itemType === 'NON_VEG' ? '#EF4444' : '#10B981'
                                                    }}>
                                                        {item.itemType === 'NON_VEG' ? 'Non-Veg' : 'Veg'}
                                                    </span>
                                                </h3>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '15px' }}>By {item.sellerName} • {item.sellerCity}</p>
                                                <p style={{ color: '#555', fontSize: '0.9rem', flex: 1, marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</p>
                                            </Link>

                                            <AddToCartButton item={{ ...item, sellerId: item.sellerId, sellerName: item.sellerName }} disabled={!item.sellerIsOnline} />
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
