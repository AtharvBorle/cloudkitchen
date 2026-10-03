"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Search, MapPin, Crosshair, X, Loader2 } from "lucide-react";

export interface AddressDetails {
    pincode?: string;
    street?: string;
    landmark?: string;
    houseNumber?: string;
    city?: string;
    formattedAddress?: string;
}

interface HouseMapPickerProps {
    latitude: number | null;
    longitude: number | null;
    onChange: (lat: number, lng: number, details?: AddressDetails) => void;
    label?: string;
    height?: string;
}

interface SearchResultItem {
    place_id: string | number;
    display_name: string;
    lat: string;
    lon: string;
    address?: {
        postcode?: string;
        road?: string;
        suburb?: string;
        neighbourhood?: string;
        city?: string;
        town?: string;
        village?: string;
        city_district?: string;
        state?: string;
        amenity?: string;
        shop?: string;
        commercial?: string;
        retail?: string;
        house_number?: string;
        building?: string;
    };
}

export function HouseMapPicker({ latitude, longitude, onChange, label, height }: HouseMapPickerProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const isMountedRef = useRef<boolean>(true);
    const [mapLoaded, setMapLoaded] = useState(false);

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
    const [showResultsDropdown, setShowResultsDropdown] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [isLocatingGps, setIsLocatingGps] = useState(false);
    const searchWrapperRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
                setShowResultsDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Reverse geocode helper
    const reverseGeocode = useCallback(async (newLat: number, newLng: number) => {
        if (!isMountedRef.current) return;
        let pincode = "";
        let street = "";
        let landmark = "";
        let houseNumber = "";
        let city = "";
        let formattedAddress = "";

        // Primary: Nominatim OpenStreetMap
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}`, {
                headers: { "Accept-Language": "en" }
            });
            if (res.ok) {
                const data = await res.json();
                formattedAddress = data.display_name || "";
                const address = data.address || {};
                pincode = address.postcode || "";
                street = address.road || address.suburb || address.neighbourhood || address.city_district || "";
                landmark = address.amenity || address.shop || address.commercial || address.retail || address.suburb || "";
                houseNumber = address.house_number || address.building || "";
                city = address.city || address.town || address.village || address.state_district || "";
            }
        } catch (nomErr) {
            console.warn("Nominatim reverse geocode fallback:", nomErr);
        }

        // Secondary fallback: BigDataCloud Reverse Geocoding
        if (!pincode && !street) {
            try {
                const bdcRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${newLat}&longitude=${newLng}&localityLanguage=en`);
                if (bdcRes.ok) {
                    const bdcData = await bdcRes.json();
                    pincode = bdcData.postcode || "";
                    street = bdcData.locality || bdcData.city || "";
                    landmark = bdcData.principalSubdivision || "";
                    city = bdcData.city || "";
                }
            } catch (bdcErr) {
                console.warn("BigDataCloud reverse geocode fallback:", bdcErr);
            }
        }

        if (isMountedRef.current) {
            onChange(newLat, newLng, { pincode, street, landmark, houseNumber, city, formattedAddress });
        }
    }, [onChange]);

    useEffect(() => {
        isMountedRef.current = true;

        // Ensure Leaflet CSS is present in document head
        if (!document.querySelector('link[href*="leaflet.css"]')) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            document.head.appendChild(link);
        }

        const initMap = (lat: number, lng: number) => {
            if (!isMountedRef.current || !mapContainerRef.current) return;
            const L = (window as any).L;
            if (!L) return;

            const container = mapContainerRef.current;

            // 1. Safely remove and detach any previous map instance from mapRef
            if (mapRef.current) {
                try {
                    mapRef.current.off();
                    mapRef.current.remove();
                } catch (e) {
                    // Ignore removal error
                }
                mapRef.current = null;
            }

            // 2. Prevent Leaflet "Map container is already initialized" by deleting _leaflet_id from the DOM element
            if ((container as any)._leaflet_id) {
                try {
                    delete (container as any)._leaflet_id;
                } catch (e) {
                    (container as any)._leaflet_id = undefined;
                }
            }

            const initialLat = latitude !== null && latitude !== undefined ? latitude : lat;
            const initialLng = longitude !== null && longitude !== undefined ? longitude : lng;

            try {
                const map = L.map(container, {
                    center: [initialLat, initialLng],
                    zoom: 16,
                    zoomControl: true,
                });
                mapRef.current = map;

                L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/">Humanitarian OSM Team</a> hosted by <a href="https://openstreetmap.fr/">OSM France</a>',
                    subdomains: 'abc',
                    maxZoom: 19,
                }).addTo(map);

                const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
                markerRef.current = marker;

                // Invalidate size shortly after mounting in case modal is animating
                setTimeout(() => {
                    if (isMountedRef.current && mapRef.current) {
                        mapRef.current.invalidateSize();
                    }
                }, 200);

                // Trigger initial geocoding if we are using the fallback/gps location
                if (latitude === null || longitude === null) {
                    reverseGeocode(initialLat, initialLng);
                }

                marker.on("dragend", () => {
                    const pos = marker.getLatLng();
                    reverseGeocode(pos.lat, pos.lng);
                });

                map.on("click", (e: any) => {
                    const { lat: clickLat, lng: clickLng } = e.latlng;
                    marker.setLatLng([clickLat, clickLng]);
                    reverseGeocode(clickLat, clickLng);
                });

                if (isMountedRef.current) {
                    setMapLoaded(true);
                }
            } catch (err) {
                console.warn("Leaflet map initialization warning in HouseMapPicker:", err);
            }
        };

        const startInit = () => {
            const fallbackLat = latitude || 18.5204;
            const fallbackLng = longitude || 73.8567;

            if (latitude !== null && longitude !== null) {
                initMap(latitude, longitude);
            } else if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        if (isMountedRef.current) {
                            initMap(pos.coords.latitude, pos.coords.longitude);
                        }
                    },
                    () => {
                        if (isMountedRef.current) {
                            initMap(fallbackLat, fallbackLng);
                        }
                    },
                    { enableHighAccuracy: true, timeout: 5000 }
                );
            } else {
                initMap(fallbackLat, fallbackLng);
            }
        };

        if ((window as any).L) {
            startInit();
        } else {
            let script = document.querySelector('script[src*="leaflet.js"]') as HTMLScriptElement;
            if (!script) {
                script = document.createElement("script");
                script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
                script.async = true;
                document.body.appendChild(script);
            }

            const handleScriptLoad = () => {
                if (isMountedRef.current) {
                    startInit();
                }
            };

            script.addEventListener("load", handleScriptLoad);
            if ((window as any).L) {
                handleScriptLoad();
            }

            return () => {
                isMountedRef.current = false;
                script.removeEventListener("load", handleScriptLoad);
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
        }

        return () => {
            isMountedRef.current = false;
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
    }, [reverseGeocode]);

    // Update marker position and center map when latitude/longitude change from parent
    useEffect(() => {
        if (mapRef.current && markerRef.current && latitude !== null && longitude !== null) {
            const L = (window as any).L;
            if (L) {
                try {
                    const currentLatLng = markerRef.current.getLatLng();
                    if (!currentLatLng || currentLatLng.lat !== latitude || currentLatLng.lng !== longitude) {
                        markerRef.current.setLatLng([latitude, longitude]);
                        if (typeof mapRef.current.flyTo === "function") {
                            mapRef.current.flyTo([latitude, longitude], 16, { animate: true, duration: 0.6 });
                        } else {
                            mapRef.current.setView([latitude, longitude], 16);
                        }
                        setTimeout(() => {
                            if (isMountedRef.current && mapRef.current) {
                                mapRef.current.invalidateSize();
                            }
                        }, 150);
                    }
                } catch (e) {
                    try {
                        mapRef.current.setView([latitude, longitude], 16);
                    } catch {}
                }
            }
        }
    }, [latitude, longitude]);

    // Handle searching location by text or pincode
    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const query = searchQuery.trim();
        if (!query) return;

        setIsSearching(true);
        setSearchError(null);
        setShowResultsDropdown(false);

        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`,
                { headers: { "Accept-Language": "en" } }
            );

            if (!res.ok) throw new Error("Search request failed");
            const data: SearchResultItem[] = await res.json();

            if (data && data.length > 0) {
                if (data.length === 1) {
                    selectLocation(data[0]);
                } else {
                    setSearchResults(data);
                    setShowResultsDropdown(true);
                }
            } else {
                setSearchError(`No locations found for "${query}". Try searching with landmark or city.`);
            }
        } catch (err) {
            console.error("Location search error:", err);
            setSearchError("Unable to search location right now. Please check connection or pin manually.");
        } finally {
            setIsSearching(false);
        }
    };

    // Apply selected location from search dropdown
    const selectLocation = (item: SearchResultItem) => {
        const itemLat = parseFloat(item.lat);
        const itemLng = parseFloat(item.lon);
        if (isNaN(itemLat) || isNaN(itemLng)) return;

        setShowResultsDropdown(false);
        setSearchResults([]);
        setSearchError(null);
        setSearchQuery(item.display_name.split(",").slice(0, 3).join(","));

        // Reposition map and marker
        if (mapRef.current && markerRef.current) {
            markerRef.current.setLatLng([itemLat, itemLng]);
            if (typeof mapRef.current.flyTo === "function") {
                mapRef.current.flyTo([itemLat, itemLng], 16, { animate: true, duration: 0.6 });
            } else {
                mapRef.current.setView([itemLat, itemLng], 16);
            }
        }

        const addr = item.address || {};
        const pincode = addr.postcode || "";
        const street = addr.road || addr.suburb || addr.neighbourhood || addr.city_district || "";
        const landmark = addr.amenity || addr.shop || addr.commercial || addr.retail || addr.suburb || "";
        const houseNumber = addr.house_number || addr.building || "";
        const city = addr.city || addr.town || addr.village || addr.city_district || "";

        onChange(itemLat, itemLng, {
            pincode,
            street,
            landmark,
            houseNumber,
            city,
            formattedAddress: item.display_name,
        });
    };

    // Detect GPS location
    const handleDetectCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        setIsLocatingGps(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setIsLocatingGps(false);
                const curLat = pos.coords.latitude;
                const curLng = pos.coords.longitude;

                if (mapRef.current && markerRef.current) {
                    markerRef.current.setLatLng([curLat, curLng]);
                    if (typeof mapRef.current.flyTo === "function") {
                        mapRef.current.flyTo([curLat, curLng], 16, { animate: true, duration: 0.6 });
                    } else {
                        mapRef.current.setView([curLat, curLng], 16);
                    }
                }

                reverseGeocode(curLat, curLng);
            },
            (err) => {
                setIsLocatingGps(false);
                console.warn("GPS location failed:", err);
                alert("Could not retrieve your current GPS location. Please ensure location permissions are granted.");
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
            {label !== "" && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#1E293B" }}>
                        {label || "Pin Exact Location on Map *"}
                    </label>
                    <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                        Drag pin or search address below
                    </span>
                </div>
            )}

            {/* Location Search Bar & GPS Locate Action */}
            <div ref={searchWrapperRef} style={{ position: "relative", width: "100%", zIndex: 30 }}>
                <form
                    onSubmit={handleSearch}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #CBD5E1",
                        borderRadius: "8px",
                        padding: "4px 8px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    }}
                >
                    <Search size={16} color="#94A3B8" style={{ flexShrink: 0 }} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (searchError) setSearchError(null);
                        }}
                        placeholder="Search area, landmark, street, or pincode..."
                        style={{
                            flex: 1,
                            border: "none",
                            outline: "none",
                            fontSize: "0.85rem",
                            color: "#1E293B",
                            backgroundColor: "transparent",
                            minWidth: "120px",
                        }}
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchQuery("");
                                setSearchResults([]);
                                setShowResultsDropdown(false);
                                setSearchError(null);
                            }}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: "2px",
                                display: "flex",
                                alignItems: "center",
                                color: "#94A3B8",
                            }}
                            title="Clear search"
                        >
                            <X size={14} />
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isSearching || !searchQuery.trim()}
                        style={{
                            padding: "6px 12px",
                            backgroundColor: isSearching || !searchQuery.trim() ? "#E2E8F0" : "#F97316",
                            color: isSearching || !searchQuery.trim() ? "#94A3B8" : "#FFFFFF",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            cursor: isSearching || !searchQuery.trim() ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            flexShrink: 0,
                            transition: "background-color 0.15s ease",
                        }}
                    >
                        {isSearching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
                        <span>Search</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleDetectCurrentLocation}
                        disabled={isLocatingGps}
                        style={{
                            padding: "6px 10px",
                            backgroundColor: "#F1F5F9",
                            color: "#0F172A",
                            border: "1px solid #CBD5E1",
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            cursor: isLocatingGps ? "wait" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            flexShrink: 0,
                        }}
                        title="Locate with GPS"
                    >
                        {isLocatingGps ? <Loader2 size={13} className="animate-spin" /> : <Crosshair size={13} color="#2563EB" />}
                        <span style={{ display: "inline" }}>GPS</span>
                    </button>
                </form>

                {/* Search Error Notice */}
                {searchError && (
                    <div
                        style={{
                            marginTop: "4px",
                            padding: "6px 10px",
                            backgroundColor: "#FEF2F2",
                            border: "1px solid #FECACA",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            color: "#DC2626",
                        }}
                    >
                        {searchError}
                    </div>
                )}

                {/* Dropdown Suggestions */}
                {showResultsDropdown && searchResults.length > 0 && (
                    <div
                        style={{
                            position: "absolute",
                            top: "calc(100% + 4px)",
                            left: 0,
                            right: 0,
                            backgroundColor: "#FFFFFF",
                            borderRadius: "8px",
                            border: "1px solid #CBD5E1",
                            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15)",
                            maxHeight: "220px",
                            overflowY: "auto",
                            zIndex: 1000,
                        }}
                    >
                        {searchResults.map((item, index) => (
                            <div
                                key={item.place_id || index}
                                onClick={() => selectLocation(item)}
                                style={{
                                    padding: "8px 12px",
                                    borderBottom: index < searchResults.length - 1 ? "1px solid #F1F5F9" : "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "8px",
                                    fontSize: "0.8rem",
                                    color: "#1E293B",
                                    transition: "background-color 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "#F8FAFC";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "#FFFFFF";
                                }}
                            >
                                <MapPin size={15} color="#F97316" style={{ marginTop: "2px", flexShrink: 0 }} />
                                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "normal" }}>
                                    <div style={{ fontWeight: 600, color: "#0F172A" }}>
                                        {item.display_name.split(",")[0]}
                                    </div>
                                    <div style={{ fontSize: "0.72rem", color: "#64748B", marginTop: "1px" }}>
                                        {item.display_name}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Leaflet Map Canvas */}
            <div
                ref={mapContainerRef}
                style={{
                    height: height || "190px",
                    width: "100%",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    zIndex: 10,
                }}
            />

            {latitude && longitude ? (
                <div style={{ fontSize: "0.75rem", color: "#16A34A", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span>📍</span>
                    <span>Coordinates selected: {latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
                </div>
            ) : (
                <div style={{ fontSize: "0.75rem", color: "#DC2626", fontWeight: "600" }}>
                    ⚠️ Map pin of location is required! Search your address or drag the pin.
                </div>
            )}
        </div>
    );
}

export default HouseMapPicker;
