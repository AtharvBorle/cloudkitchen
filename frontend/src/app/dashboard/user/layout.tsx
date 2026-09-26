"use client";
import { fetchApi } from "@/lib/fetch-api";


import { useSession } from "next-auth/react";
import { performLogout } from "@/lib/logout";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, LogOut, LogIn, Menu, X, MapPin } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import PopupBannerDisplay from "@/components/PopupBannerDisplay";
import { LocationProvider, useLocation } from "@/components/location-provider";
import { HouseMapPicker } from "@/components/house-map-picker";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/explore-desktop/footer";

interface MapPickerProps {
    onLocationSelected: (pincode: string) => void;
}

function MapPicker({ onLocationSelected }: MapPickerProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const [loadingGeocode, setLoadingGeocode] = useState(false);
    const [selectedPincode, setSelectedPincode] = useState<string>("");
    const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    const handleGeocode = async (lat: number, lng: number) => {
        setLoadingGeocode(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            if (res.ok) {
                const data = await res.json();
                const pincode = data.address?.postcode || "";
                const displayName = data.display_name || "";
                setSelectedPincode(pincode);
                setSelectedAddress(displayName);
            }
        } catch (err) {
            console.error("Reverse geocoding error:", err);
        } finally {
            setLoadingGeocode(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=in&limit=5`
            );
            if (res.ok) {
                const data = await res.json();
                setSearchResults(data);
            }
        } catch (err) {
            console.error("Search error:", err);
        } finally {
            setSearching(false);
        }
    };

    const handleSelectResult = (result: any) => {
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        setCoords({ lat, lng: lon });
        setSearchResults([]);
        setSearchQuery("");
        if (mapRef.current && markerRef.current) {
            const L = (window as any).L;
            if (L) {
                mapRef.current.setView([lat, lon], 16);
                markerRef.current.setLatLng([lat, lon]);
            }
        }
        handleGeocode(lat, lon);
    };

    useEffect(() => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);

        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.async = true;
        document.body.appendChild(script);

        const initMap = (lat: number, lng: number) => {
            const L = (window as any).L;
            if (!L || !mapContainerRef.current) return;

            if (mapRef.current) {
                try {
                    mapRef.current.off();
                    mapRef.current.remove();
                } catch (e) {}
                mapRef.current = null;
            }

            if ((mapContainerRef.current as any)._leaflet_id) {
                delete (mapContainerRef.current as any)._leaflet_id;
            }

            try {
                // Zoom level 16 for close house-level detail
                const map = L.map(mapContainerRef.current).setView([lat, lng], 16);
                mapRef.current = map;

                L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                    subdomains: 'abcd',
                    maxZoom: 20,
                }).addTo(map);

                const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
                markerRef.current = marker;

                setCoords({ lat, lng });
                handleGeocode(lat, lng);

                marker.on("dragend", () => {
                    const position = marker.getLatLng();
                    setCoords({ lat: position.lat, lng: position.lng });
                    handleGeocode(position.lat, position.lng);
                });

                map.on("click", (e: any) => {
                    const { lat: clickLat, lng: clickLng } = e.latlng;
                    marker.setLatLng([clickLat, clickLng]);
                    setCoords({ lat: clickLat, lng: clickLng });
                    handleGeocode(clickLat, clickLng);
                });
            } catch (err) {
                console.warn("Leaflet map initialization warning:", err);
            }
        };

        script.onload = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        initMap(position.coords.latitude, position.coords.longitude);
                    },
                    () => {
                        initMap(19.0760, 72.8777); // Mumbai fallback
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                );
            } else {
                initMap(19.0760, 72.8777);
            }
        };

        return () => {
            try {
                if (document.head.contains(link)) document.head.removeChild(link);
                if (document.body.contains(script)) document.body.removeChild(script);
            } catch (e) {}
            if (mapRef.current) {
                try {
                    mapRef.current.off();
                    mapRef.current.remove();
                } catch (e) {}
                mapRef.current = null;
            }
            if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id) {
                delete (mapContainerRef.current as any)._leaflet_id;
            }
        };
    }, []);

    const handleConfirm = () => {
        if (selectedPincode) {
            onLocationSelected(selectedPincode);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", marginTop: "5px" }}>
            <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px", position: "relative" }}>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search area, street, society or city..."
                    style={{
                        flex: 1,
                        padding: "8px 12px",
                        border: "1px solid #CBD5E1",
                        borderRadius: "8px",
                        fontSize: "0.85rem",
                        outline: "none"
                    }}
                />
                <button
                    type="submit"
                    className="btn btn-secondary"
                    style={{
                        padding: "8px 16px",
                        fontSize: "0.85rem",
                        width: "auto",
                        whiteSpace: "nowrap"
                    }}
                    disabled={searching}
                >
                    {searching ? "Searching..." : "Search"}
                </button>

                {searchResults.length > 0 && (
                    <div style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        backgroundColor: "white",
                        border: "1px solid #CBD5E1",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                        zIndex: 1000,
                        maxHeight: "180px",
                        overflowY: "auto",
                        marginTop: "4px"
                    }}>
                        {searchResults.map((res, index) => (
                            <div
                                key={index}
                                onClick={() => handleSelectResult(res)}
                                style={{
                                    padding: "8px 12px",
                                    fontSize: "0.8rem",
                                    borderBottom: index < searchResults.length - 1 ? "1px solid #E2E8F0" : "none",
                                    cursor: "pointer",
                                    color: "#334155"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F1F5F9"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                                {res.display_name}
                            </div>
                        ))}
                    </div>
                )}
            </form>

            <div 
                ref={mapContainerRef} 
                style={{ 
                    height: "220px", 
                    width: "100%", 
                    borderRadius: "8px", 
                    border: "1px solid #CBD5E1",
                    zIndex: 10 
                }} 
            />
            {coords && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", backgroundColor: "#F8FAFC", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                    {loadingGeocode ? (
                        <div style={{ fontSize: "0.85rem", color: "#64748B", fontStyle: "italic" }}>Fetching address & pincode...</div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ fontSize: "0.8rem", color: "#64748B", maxHeight: "60px", overflow: "hidden", textOverflow: "ellipsis" }}>
                                <strong>Detected Address:</strong> {selectedAddress || "No address found"}
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "0.9rem", fontWeight: "700", color: "#0F172A", whiteSpace: "nowrap" }}>
                                        Confirm Pincode:
                                    </span>
                                    <input
                                        type="text"
                                        value={selectedPincode}
                                        onChange={(e) => setSelectedPincode(e.target.value.replace(/\D/g, ""))}
                                        style={{
                                            width: "100px",
                                            padding: "4px 8px",
                                            border: "1px solid #CBD5E1",
                                            borderRadius: "6px",
                                            fontSize: "0.9rem",
                                            fontWeight: "700",
                                            color: "#0F172A",
                                            textAlign: "center"
                                        }}
                                        placeholder="Pincode"
                                        maxLength={6}
                                    />
                                </div>
                                {selectedPincode && selectedPincode.length === 6 && (
                                    <button 
                                        type="button"
                                        onClick={handleConfirm}
                                        className="btn btn-primary"
                                        style={{ padding: "6px 12px", fontSize: "0.8rem", width: "auto" }}
                                    >
                                        Confirm
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function UserHeader() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const router = useRouter();
    const { cartItems } = useCart();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { defaultAddress, isLoading: isLocationLoading, refreshAddress, setGuestLocation } = useLocation();
    const [isClient, setIsClient] = useState(false);

    // Inline Address Selector Modal State
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [addresses, setAddresses] = useState<any[]>([]);
    const [isFetchingAddresses, setIsFetchingAddresses] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [addressForm, setAddressForm] = useState({
        type: "Home",
        houseNumber: "",
        street: "",
        landmark: "",
        pincode: "",
        latitude: null as number | null,
        longitude: null as number | null
    });
    const [isSavingAddress, setIsSavingAddress] = useState(false);

    // Tabbed selection state
    const [locationTab, setLocationTab] = useState<"saved" | "map" | "gps" | "manual">("saved");
    const [gpsLoading, setGpsLoading] = useState(false);
    const [gpsError, setGpsError] = useState("");
    const [gpsSuccessPincode, setGpsSuccessPincode] = useState("");
    const [gpsAddress, setGpsAddress] = useState("");

    const handleTabChange = (tab: "saved" | "map" | "gps" | "manual") => {
        setLocationTab(tab);
        setGpsSuccessPincode("");
        setGpsError("");
        setGpsAddress("");
    };

    // Hydration Fix
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Fetch user addresses when modal opens
    useEffect(() => {
        if (isAddressModalOpen) {
            fetchUserAddresses().then((fetchedAddresses) => {
                if (fetchedAddresses && fetchedAddresses.length === 0) {
                    setLocationTab("map");
                } else {
                    setLocationTab("saved");
                }
            });
        }
    }, [isAddressModalOpen]);

    // Auto-open modal if no default location is configured (only for regular user or guest)
    useEffect(() => {
        const isNonCustomer = Boolean(session?.user?.role && session.user.role !== "USER");
        if (!isLocationLoading && !defaultAddress && !isNonCustomer) {
            setIsAddressModalOpen(true);
        }
    }, [isLocationLoading, defaultAddress, session]);

    const fetchUserAddresses = async () => {
        if (!session || !session.user) return [];
        setIsFetchingAddresses(true);
        try {
            const res = await fetchApi("/api/user/profile");
            if (res.ok) {
                const data = await res.json();
                setAddresses(data.addresses || []);
                return data.addresses || [];
            }
        } catch (error) {
            console.error("Failed to load addresses", error);
        } finally {
            setIsFetchingAddresses(false);
        }
        return [];
    };

    const handleSelectAddress = async (id: string) => {
        try {
            const res = await fetchApi(`/api/user/addresses/${id}/default`, { method: "PATCH" });
            if (res.ok) {
                await refreshAddress();
                setIsAddressModalOpen(false);
            } else {
                alert("Failed to set default address");
            }
        } catch (err) {
            console.error("Error setting default address", err);
        }
    };

    const handleSelectOnMap = async (pincode: string) => {
        if (!session || !session.user) {
            setGuestLocation(pincode);
            setIsAddressModalOpen(false);
            return;
        }
        try {
            const updateRes = await fetchApi("/api/user/location", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pincode })
            });
            if (updateRes.status === 401) {
                setGuestLocation(pincode);
                setIsAddressModalOpen(false);
            } else if (updateRes.ok) {
                await refreshAddress();
                setIsAddressModalOpen(false);
            } else {
                alert("Failed to update location.");
            }
        } catch (err) {
            console.error("Map selection error:", err);
            setGuestLocation(pincode);
            setIsAddressModalOpen(false);
        }
    };

    const handleUseGps = () => {
        if (!navigator.geolocation) {
            setGpsError("Geolocation is not supported by your browser.");
            return;
        }
        setGpsLoading(true);
        setGpsError("");
        setGpsSuccessPincode("");
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    if (res.ok) {
                        const data = await res.json();
                        const pincode = data.address?.postcode;
                        const displayName = data.display_name;
                        if (pincode) {
                            setGpsSuccessPincode(pincode);
                            setGpsAddress(displayName || "");
                        } else {
                            setGpsError("Could not detect a valid pincode at your GPS coordinates.");
                        }
                    } else {
                        setGpsError("Failed to fetch address from geocoding service.");
                    }
                } catch (err) {
                    setGpsError("Error communicating with reverse-geocoding service.");
                } finally {
                    setGpsLoading(false);
                }
            },
            (error) => {
                setGpsLoading(false);
                setGpsError("Permission denied or location unavailable.");
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleConfirmGps = async () => {
        if (!gpsSuccessPincode) return;
        if (!session || !session.user) {
            setGuestLocation(gpsSuccessPincode);
            setIsAddressModalOpen(false);
            return;
        }
        try {
            const updateRes = await fetchApi("/api/user/location", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pincode: gpsSuccessPincode })
            });
            if (updateRes.status === 401) {
                setGuestLocation(gpsSuccessPincode);
                setIsAddressModalOpen(false);
            } else if (updateRes.ok) {
                await refreshAddress();
                setIsAddressModalOpen(false);
            } else {
                alert("Failed to update location.");
            }
        } catch (err) {
            console.error("GPS confirmation error:", err);
            setGuestLocation(gpsSuccessPincode);
            setIsAddressModalOpen(false);
        }
    };

    const handleCreateAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (addresses.length >= 5) {
            alert("You can add a maximum of 5 delivery addresses. Please edit or delete an existing address.");
            return;
        }
        if (!addressForm.houseNumber || !addressForm.street || !addressForm.pincode) {
            alert("Please fill in all required fields");
            return;
        }

        const normHouse = addressForm.houseNumber.trim().toLowerCase();
        const normStreet = addressForm.street.trim().toLowerCase();
        const normPin = addressForm.pincode.replace(/\D/g, "");

        const isDuplicate = addresses.some((addr) => (
            (addr.houseNumber || "").trim().toLowerCase() === normHouse &&
            (addr.street || "").trim().toLowerCase() === normStreet &&
            (addr.pincode || "").replace(/\D/g, "") === normPin
        ));

        if (isDuplicate) {
            alert("This address already exists in your saved addresses.");
            return;
        }

        if (addressForm.latitude === null || addressForm.longitude === null) {
            alert("Approximate location pin of the house is compulsory. Please select it on the map.");
            return;
        }
        setIsSavingAddress(true);
        try {
            const res = await fetchApi("/api/user/addresses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...addressForm,
                    isDefault: true
                })
            });
            if (res.status === 401) {
                alert("Please sign in to save your address.");
                router.push("/user");
                return;
            }
            if (res.ok) {
                await refreshAddress();
                setAddressForm({ type: "Home", houseNumber: "", street: "", landmark: "", pincode: "", latitude: null, longitude: null });
                setShowAddForm(false);
                setIsAddressModalOpen(false);
            } else {
                const data = await res.json();
                alert(data.message || "Failed to save address");
            }
        } catch (err) {
            console.error("Error saving address", err);
        } finally {
            setIsSavingAddress(false);
        }
    };

    // Total items tally across quantities
    const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    const navLinks = [
        { href: "/dashboard/user", label: "Home", exact: true },
        { href: "/dashboard/user/food", label: "Order Food" },
        { href: "/dashboard/user/rooms", label: "Book a Room" },
        { href: "/dashboard/user/orders", label: "My Orders" },
        { href: "/dashboard/user/bookings", label: "My Bookings" },
        { href: "/dashboard/user/profile", label: "My Profile" },
        { href: "/dashboard/user/support", label: "Support" },
    ];

    const isActive = (href: string, exact?: boolean) => {
        return exact ? pathname === href : pathname.includes(href.split('/').pop() || '');
    };

    return (
        <header style={{
            minHeight: "72px",
            backgroundColor: "var(--surface)",
            borderBottom: "1px solid var(--surface-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "18px",
            padding: "15px var(--spacing-6)",
            position: "sticky",
            top: 0,
            zIndex: 10,
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-8)" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
                    <Link href="/dashboard/user" style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--primary)", lineHeight: 1 }}>
                        Cloud Kitchen
                     </Link>

                    {isClient && (
                        <div
                            onClick={() => setIsAddressModalOpen(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                backgroundColor: '#F3F4F6',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                color: 'var(--text-main)',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s',
                                marginTop: '2px',
                                border: 'none',
                                outline: 'none',
                                userSelect: 'none'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                        >
                            {isLocationLoading ? (
                                <span style={{ color: 'var(--text-muted)' }}>Updating location...</span>
                            ) : defaultAddress ? (
                                <>
                                    <MapPin size={12} color="var(--primary)" />
                                    <span style={{ fontWeight: 'bold' }}>{defaultAddress.type} ({defaultAddress.pincode})</span>
                                    <span style={{
                                        fontSize: '0.65rem',
                                        backgroundColor: 'var(--primary)',
                                        color: 'white',
                                        padding: '1px 5px',
                                        borderRadius: '4px',
                                        marginLeft: '4px',
                                        fontWeight: 'bold'
                                    }}>Change</span>
                                </>
                            ) : (
                                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <MapPin size={12} /> Set Location
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <nav className="desktop-only" style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            style={{
                                color: isActive(link.href, link.exact) ? "var(--primary)" : "var(--text-main)",
                                fontWeight: isActive(link.href, link.exact) ? "600" : "normal"
                            }}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="desktop-only" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <button onClick={() => router.push("/user/cart")} className="btn btn-secondary" style={{ borderRadius: "var(--radius-full)", padding: "8px 16px", display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", whiteSpace: "nowrap", width: "auto" }}>
                    <ShoppingCart size={18} /> Cart ({totalCount})
                </button>
                {session ? (
                    <button className="btn btn-primary" onClick={() => performLogout({ role: "USER" })} style={{ display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap", width: "auto" }}>
                        <LogOut size={18} /> Sign Out
                    </button>
                ) : (
                    <button className="btn btn-primary" onClick={() => router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`)} style={{ display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap", width: "auto" }}>
                        <LogIn size={18} /> Sign In
                    </button>
                )}
            </div>

            <button className="mobile-only" onClick={() => setIsMenuOpen(true)} style={{ color: "var(--text-main)", background: 'none', border: 'none', cursor: 'pointer' }}>
                <Menu size={28} />
            </button>

            {/* Backdrop */}
            <div
                className={`mobile-only mobile-nav-menu-backdrop ${isMenuOpen ? 'open' : ''}`}
                onClick={() => setIsMenuOpen(false)}
            />

            {/* Sidebar Details */}
            <div className={`mobile-only mobile-nav-menu ${isMenuOpen ? 'open' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <span style={{ fontSize: "1.25rem", fontWeight: "bold", color: "var(--primary)" }}>Menu</span>
                    <button onClick={() => setIsMenuOpen(false)} style={{ color: "var(--text-main)", background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsMenuOpen(false)}
                            style={{
                                color: isActive(link.href, link.exact) ? "var(--primary)" : "var(--text-main)",
                                fontWeight: isActive(link.href, link.exact) ? "600" : "500",
                                backgroundColor: isActive(link.href, link.exact) ? "#FFF0F0" : "transparent"
                            }}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "auto", paddingTop: "20px", borderTop: "1px solid var(--surface-border)" }}>
                    <button onClick={() => { setIsMenuOpen(false); router.push("/user/cart"); }} className="btn btn-secondary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontWeight: "bold" }}>
                        <ShoppingCart size={18} /> Cart ({totalCount})
                    </button>
                    {session ? (
                        <button className="btn btn-primary" onClick={() => { setIsMenuOpen(false); performLogout({ role: "USER" }); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                            <LogOut size={18} /> Sign Out
                        </button>
                    ) : (
                        <button className="btn btn-primary" onClick={() => { setIsMenuOpen(false); router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                            <LogIn size={18} /> Sign In
                        </button>
                    )}
                </div>
            </div>

            {/* Address Selector Inline Modal */}
            {isAddressModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 9999,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '12px',
                        width: '90%',
                        maxWidth: '500px',
                        boxShadow: 'var(--shadow-card)',
                        maxHeight: '85vh',
                        overflowY: 'auto',
                        position: 'relative'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #EEE', paddingBottom: '12px' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <MapPin size={20} color="var(--primary)" /> Select Delivery Location
                            </h2>
                            <button
                                onClick={() => { setIsAddressModalOpen(false); setShowAddForm(false); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#666', lineHeight: 1 }}
                            >
                                &times;
                            </button>
                        </div>

                        {!showAddForm ? (
                            <div>
                                {/* Location Selection Methods Tabs */}
                                <div style={{ display: "flex", gap: "8px", marginBottom: "15px", borderBottom: "1px solid #E2E8F0", paddingBottom: "10px", flexWrap: "wrap" }}>
                                    <button
                                        type="button"
                                        onClick={() => handleTabChange("saved")}
                                        style={{
                                            padding: "6px 12px",
                                            borderRadius: "20px",
                                            border: "none",
                                            backgroundColor: locationTab === "saved" ? "var(--primary)" : "#F1F5F9",
                                            color: locationTab === "saved" ? "white" : "#475569",
                                            fontSize: "0.8rem",
                                            fontWeight: "600",
                                            cursor: "pointer"
                                        }}
                                    >
                                        Saved Addresses
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleTabChange("map")}
                                        style={{
                                            padding: "6px 12px",
                                            borderRadius: "20px",
                                            border: "none",
                                            backgroundColor: locationTab === "map" ? "var(--primary)" : "#F1F5F9",
                                            color: locationTab === "map" ? "white" : "#475569",
                                            fontSize: "0.8rem",
                                            fontWeight: "600",
                                            cursor: "pointer"
                                        }}
                                    >
                                        Select on Map
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleTabChange("gps")}
                                        style={{
                                            padding: "6px 12px",
                                            borderRadius: "20px",
                                            border: "none",
                                            backgroundColor: locationTab === "gps" ? "var(--primary)" : "#F1F5F9",
                                            color: locationTab === "gps" ? "white" : "#475569",
                                            fontSize: "0.8rem",
                                            fontWeight: "600",
                                            cursor: "pointer"
                                        }}
                                    >
                                        🛰️ Use GPS
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleTabChange("manual")}
                                        style={{
                                            padding: "6px 12px",
                                            borderRadius: "20px",
                                            border: "none",
                                            backgroundColor: locationTab === "manual" ? "var(--primary)" : "#F1F5F9",
                                            color: locationTab === "manual" ? "white" : "#475569",
                                            fontSize: "0.8rem",
                                            fontWeight: "600",
                                            cursor: "pointer"
                                        }}
                                    >
                                        ✏️ Enter Pincode
                                    </button>
                                </div>

                                {locationTab === "saved" && (
                                    <div>
                                        {isFetchingAddresses ? (
                                            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Loading addresses...</div>
                                        ) : addresses.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--text-muted)' }}>
                                                <p style={{ marginBottom: '15px' }}>No saved addresses found.</p>
                                                <button
                                                    onClick={() => setShowAddForm(true)}
                                                    className="btn btn-primary"
                                                    style={{ fontSize: '0.9rem', padding: '8px 16px' }}
                                                >
                                                    Add First Address
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                                                {addresses.map(addr => (
                                                    <div
                                                        key={addr.id}
                                                        onClick={() => handleSelectAddress(addr.id)}
                                                        style={{
                                                            padding: '12px 15px',
                                                            border: addr.isDefault ? '2px solid var(--primary)' : '1px solid #E2E8F0',
                                                            borderRadius: '8px',
                                                            backgroundColor: addr.isDefault ? '#FFF' : '#F8FAFC',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            position: 'relative'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.borderColor = addr.isDefault ? 'var(--primary)' : '#E2E8F0'}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                            <span style={{
                                                                padding: '2px 6px',
                                                                backgroundColor: '#E0F2FE',
                                                                color: '#0369A1',
                                                                borderRadius: '4px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 'bold'
                                                            }}>{addr.type}</span>
                                                            {addr.isDefault && (
                                                                <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold' }}>Active</span>
                                                            )}
                                                        </div>
                                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0, lineHeight: '1.4' }}>
                                                            {addr.houseNumber}, {addr.street} {addr.landmark ? `, ${addr.landmark}` : ''}
                                                        </p>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                            Pincode: {addr.pincode}
                                                        </div>
                                                    </div>
                                                ))}

                                                <button
                                                    onClick={() => {
                                                        if (addresses.length >= 5) {
                                                            alert("You can add a maximum of 5 delivery addresses. Please edit or delete an existing address.");
                                                            return;
                                                        }
                                                        setShowAddForm(true);
                                                    }}
                                                    className="btn btn-secondary"
                                                    disabled={addresses.length >= 5}
                                                    style={{
                                                        width: '100%',
                                                        marginTop: '10px',
                                                        fontSize: '0.9rem',
                                                        padding: '10px',
                                                        opacity: addresses.length >= 5 ? 0.6 : 1,
                                                        cursor: addresses.length >= 5 ? 'not-allowed' : 'pointer'
                                                    }}
                                                    title={addresses.length >= 5 ? "Maximum 5 addresses limit reached" : "Add New Address"}
                                                >
                                                    + Add New Address ({addresses.length}/5)
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {locationTab === "map" && (
                                    <MapPicker onLocationSelected={handleSelectOnMap} />
                                )}

                                {locationTab === "gps" && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "15px", alignItems: "center", padding: "20px 10px", textAlign: "center" }}>
                                        <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
                                            Detect your current pincode automatically using your browser's GPS.
                                        </div>
                                        
                                        <button
                                            type="button"
                                            onClick={handleUseGps}
                                            disabled={gpsLoading}
                                            className="btn btn-primary"
                                            style={{ display: "flex", alignItems: "center", gap: "8px", width: "auto", padding: "10px 20px" }}
                                        >
                                            {gpsLoading ? "Detecting GPS..." : "🛰️ Find My Location"}
                                        </button>

                                        {gpsError && (
                                            <div style={{ fontSize: "0.85rem", color: "#EF4444", fontWeight: "500", marginTop: "10px" }}>
                                                {gpsError}
                                            </div>
                                        )}

                                        {gpsSuccessPincode && (
                                            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px", backgroundColor: "#F0FDF4", padding: "15px", borderRadius: "8px", border: "1px solid #BBF7D0", marginTop: "10px" }}>
                                                <div style={{ fontSize: "0.8rem", color: "#166534", fontWeight: "600" }}>Detected Location:</div>
                                                <div style={{ fontSize: "0.85rem", color: "#1E293B", maxHeight: "60px", overflow: "hidden", textOverflow: "ellipsis" }}>{gpsAddress}</div>
                                                
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginTop: "5px" }}>
                                                    <span style={{ fontSize: "0.95rem", fontWeight: "700", color: "#166534" }}>Confirm Pincode:</span>
                                                    <input
                                                        type="text"
                                                        value={gpsSuccessPincode}
                                                        onChange={(e) => setGpsSuccessPincode(e.target.value.replace(/\D/g, ""))}
                                                        style={{
                                                            width: "100px",
                                                            padding: "4px 8px",
                                                            border: "1px solid #BBF7D0",
                                                            borderRadius: "6px",
                                                            fontSize: "0.95rem",
                                                            fontWeight: "700",
                                                            color: "#166534",
                                                            backgroundColor: "white",
                                                            textAlign: "center"
                                                        }}
                                                        maxLength={6}
                                                    />
                                                </div>

                                                <button
                                                    type="button"
                                                    disabled={gpsSuccessPincode.length !== 6}
                                                    onClick={handleConfirmGps}
                                                    className="btn btn-primary"
                                                    style={{ marginTop: "10px" }}
                                                >
                                                    Confirm & Set Location
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {locationTab === "manual" && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "15px", alignItems: "center", padding: "20px 10px", textAlign: "center" }}>
                                        <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
                                            Enter your delivery pincode manually.
                                        </div>
                                        
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", width: "100%" }}>
                                            <span style={{ fontSize: "0.95rem", fontWeight: "700", color: "#334155" }}>Pincode:</span>
                                            <input
                                                type="text"
                                                value={gpsSuccessPincode}
                                                onChange={(e) => setGpsSuccessPincode(e.target.value.replace(/\D/g, ""))}
                                                style={{
                                                    width: "120px",
                                                    padding: "6px 12px",
                                                    border: "1px solid #CBD5E1",
                                                    borderRadius: "6px",
                                                    fontSize: "0.95rem",
                                                    fontWeight: "700",
                                                    color: "#0F172A",
                                                    textAlign: "center"
                                                }}
                                                placeholder="6-digit"
                                                maxLength={6}
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            disabled={gpsSuccessPincode.length !== 6}
                                            onClick={handleConfirmGps}
                                            className="btn btn-primary"
                                            style={{ marginTop: "10px", width: "100%" }}
                                        >
                                            Confirm & Set Location
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <form onSubmit={handleCreateAddress} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '5px' }}>Add New Address</h3>

                                <div>
                                    <HouseMapPicker
                                        latitude={addressForm.latitude}
                                        longitude={addressForm.longitude}
                                        onChange={(lat, lng, details) => {
                                            setAddressForm(prev => ({
                                                ...prev,
                                                latitude: lat,
                                                longitude: lng,
                                                pincode: details?.pincode ? details.pincode.replace(/\D/g, '').slice(0, 6) : prev.pincode,
                                                street: details?.street || prev.street,
                                                landmark: details?.landmark || prev.landmark,
                                                houseNumber: details?.houseNumber || prev.houseNumber
                                            }));
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', fontWeight: 'bold' }}>Address Type</label>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        {['Home', 'Work', 'Other'].map(type => (
                                            <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', cursor: 'pointer' }}>
                                                <input
                                                    type="radio"
                                                    value={type}
                                                    checked={addressForm.type === type}
                                                    onChange={(e) => setAddressForm({ ...addressForm, type: e.target.value })}
                                                />
                                                {type}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', fontWeight: 'bold' }}>House / Flat / Floor *</label>
                                    <input
                                        type="text"
                                        required
                                        value={addressForm.houseNumber}
                                        onChange={(e) => setAddressForm({ ...addressForm, houseNumber: e.target.value })}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.9rem' }}
                                        placeholder="e.g. Flat 402, 4th Floor"
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', fontWeight: 'bold' }}>Street *</label>
                                    <input
                                        type="text"
                                        required
                                        value={addressForm.street}
                                        onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.9rem' }}
                                        placeholder="e.g. Park Avenue Road"
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', fontWeight: 'bold' }}>Landmark (Optional)</label>
                                    <input
                                        type="text"
                                        value={addressForm.landmark}
                                        onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.9rem' }}
                                        placeholder="e.g. Near HDFC Bank"
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', fontWeight: 'bold' }}>Pincode *</label>
                                    <input
                                        type="text"
                                        required
                                        value={addressForm.pincode}
                                        onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value.replace(/\D/g, '') })}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.9rem' }}
                                        placeholder="6-digit Pincode"
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button
                                        type="submit"
                                        disabled={isSavingAddress}
                                        className="btn btn-primary"
                                        style={{ flex: 1, padding: '10px' }}
                                    >
                                        {isSavingAddress ? 'Saving...' : 'Save & Select'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddForm(false)}
                                        className="btn btn-secondary"
                                        style={{ flex: 1, padding: '10px', backgroundColor: 'white', border: '1px solid #CBD5E1', color: '#333' }}
                                    >
                                        Back
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
export default function UserLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    const isCheckout = pathname === "/dashboard/user/checkout";
    const isUserRole = session?.user?.role === "USER";

    useEffect(() => {
        if (status === "loading") return;
        if (!isCheckout) {
            if (!session) {
                router.push("/user");
            } else if (!isUserRole) {
                // If logged in as another role (SELLER/ADMIN/DELIVERY), redirect them out of user dashboard
                router.push("/user");
            }
        }
    }, [session, status, router, isCheckout, isUserRole]);

    if (status === "loading" || (!session && !isCheckout) || (session && !isUserRole && !isCheckout)) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--background)' }}>
                <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Checking authorization...</span>
            </div>
        );
    }

    return (
        <LocationProvider>
            <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "var(--background)" }}>
                <PopupBannerDisplay />
                {isCheckout ? <Navbar /> : <UserHeader />}
                <main style={{ flex: 1, padding: "var(--spacing-8) var(--spacing-6)", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
                    {children}
                </main>
                <Footer />
            </div>
        </LocationProvider>
    );
}
