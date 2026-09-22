"use client";
import { fetchApi } from "@/lib/fetch-api";


import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, MapPin } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { BookRoomButton } from "@/components/cart-buttons";
import { useLocation } from "@/components/location-provider";
import { useSession } from "next-auth/react";
import {
    calculateDistanceKm,
    MAX_DELIVERY_RADIUS_KM,
    getPincodeCoordinates,
    formatDistance,
} from "@/lib/geo-distance";

export default function UserRoomsPage() {
    const { initiateRoomBooking } = useCart();
    const { defaultAddress } = useLocation();
    const { status } = useSession();
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const userLat = defaultAddress?.latitude != null && !isNaN(Number(defaultAddress.latitude)) ? Number(defaultAddress.latitude) : null;
    const userLng = defaultAddress?.longitude != null && !isNaN(Number(defaultAddress.longitude)) ? Number(defaultAddress.longitude) : null;
    const userFallback = defaultAddress?.pincode ? getPincodeCoordinates(defaultAddress.pincode) : null;
    const finalUserLat = userLat ?? userFallback?.lat ?? null;
    const finalUserLng = userLng ?? userFallback?.lng ?? null;
    const hasUserCoords = finalUserLat !== null && finalUserLng !== null;

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (status === "loading") return;
            setLoading(true);
            try {
                const url = (status === "authenticated") ? "/api/user/dashboard" : "/api/public/explore";
                const res = await fetchApi(url);
                const data = await res.json();
                if (res.ok) {
                    setRooms(data.availableRooms || []);
                }
            } catch (error) {
                console.error("Failed to fetch rooms", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [defaultAddress?.pincode, status]);

    const roomPlaceholder = "https://placehold.co/400x250?text=Cozy+Room";

    const getFirstImage = (jsonStr: string) => {
        try {
            const arr = JSON.parse(jsonStr);
            return arr.length > 0 ? arr[0] : roomPlaceholder;
        } catch {
            return roomPlaceholder;
        }
    };

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
            if (hasUserCoords && room.distanceKm !== undefined) {
                if (room.distanceKm > MAX_DELIVERY_RADIUS_KM) return false;
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
        <div style={{ paddingBottom: '50px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--text-main)", marginBottom: "5px" }}>Book a Room</h1>
                    <p style={{ color: "var(--text-muted)" }}>Find comfortable stays directly from verified PG owners.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'white', border: '1px solid #EAEAEA', borderRadius: '8px', padding: '5px 15px', width: '300px' }}>
                    <Search size={18} color="var(--text-muted)" />
                    <input
                        type="text"
                        placeholder="Search area, locality, or room..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ border: 'none', outline: 'none', padding: '10px', width: '100%', fontSize: '0.95rem' }}
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading rooms...</div>
            ) : filteredRooms.length === 0 ? (
                <div style={{ backgroundColor: '#F8F9F9', padding: '40px', textAlign: 'center', borderRadius: '12px', color: 'var(--text-muted)' }}>
                    {searchQuery ? "No rooms found matching your search." : "No rooms available within 5 km right now."}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' }}>
                    {filteredRooms.map(room => (
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
        </div>
    );
}
