"use client";
import { fetchApi } from "@/lib/fetch-api";


import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import Link from "next/link";
import { AddToCartButton } from "@/components/cart-buttons";

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
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await fetchApi("/api/public/explore");
                const data = await res.json();
                if (res.ok) setFoodItems(data.foodItems);
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
        }
    }, []);

    const placeholderImage = "https://via.placeholder.com/400x250?text=Delicious+Food";

    const filteredFood = foodItems.filter(item =>
        isCurrentlyOpen(item) && (
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sellerCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sellerLocality?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sellerLandmark?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sellerPincode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

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

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading menus...</div>
            ) : filteredFood.length === 0 ? (
                <div style={{ backgroundColor: '#F8F9F9', padding: '40px', textAlign: 'center', borderRadius: '12px', color: 'var(--text-muted)' }}>
                    {searchQuery ? "No food items found matching your search." : "No food items available at the moment."}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
                    {filteredFood.map(item => (
                        <div key={item.id} style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s ease' }}>
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
                                    <p style={{ color: '#555', fontSize: '0.9rem', flex: 1, marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</p>
                                </Link>

                                <AddToCartButton item={{ ...item, sellerId: item.sellerId, sellerName: item.sellerName }} disabled={!item.sellerIsOnline} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
