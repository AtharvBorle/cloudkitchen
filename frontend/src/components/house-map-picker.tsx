"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Search, MapPin, Crosshair, X, Loader2 } from "lucide-react";
import {
    loadGoogleMapsScript,
    fetchPlaceSuggestions,
    fetchPlaceDetails,
    reverseGeocodeCoords,
    PlacePredictionItem,
    NormalizedAddressDetails,
} from "@/lib/google-maps";

export interface AddressDetails {
    pincode?: string;
    street?: string;
    landmark?: string;
    houseNumber?: string;
    city?: string;
    state?: string;
    formattedAddress?: string;
}

interface HouseMapPickerProps {
    latitude: number | null;
    longitude: number | null;
    onChange: (lat: number, lng: number, details?: AddressDetails) => void;
    label?: string;
    height?: string;
    skipInitialReverseGeocode?: boolean;
}

export function HouseMapPicker({
    latitude,
    longitude,
    onChange,
    label,
    height,
    skipInitialReverseGeocode = false,
}: HouseMapPickerProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const googleMapRef = useRef<any>(null);
    const googleMarkerRef = useRef<any>(null);
    const leafletMapRef = useRef<any>(null);
    const leafletMarkerRef = useRef<any>(null);
    const isMountedRef = useRef<boolean>(true);

    const [mapEngine, setMapEngine] = useState<"google" | "leaflet">("leaflet");
    const [mapLoaded, setMapLoaded] = useState(false);

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<PlacePredictionItem[]>([]);
    const [showResultsDropdown, setShowResultsDropdown] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [isLocatingGps, setIsLocatingGps] = useState(false);
    const searchWrapperRef = useRef<HTMLDivElement>(null);
    const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

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

    // Reverse geocode helper (Google Geocoding with OSM fallback)
    const handleReverseGeocode = useCallback(
        async (newLat: number, newLng: number) => {
            if (!isMountedRef.current) return;
            try {
                const details = await reverseGeocodeCoords(newLat, newLng);
                if (isMountedRef.current) {
                    onChange(newLat, newLng, {
                        pincode: details.pincode || "",
                        street: details.street || "",
                        landmark: details.landmark || "",
                        houseNumber: details.houseNumber || "",
                        city: details.city || "Pune",
                        state: details.state || "Maharashtra",
                        formattedAddress: details.formattedAddress || "",
                    });
                }
            } catch (err) {
                console.warn("Reverse geocode warning:", err);
            }
        },
        [onChange]
    );

    // Initialize Map (Google Maps or Leaflet Fallback)
    useEffect(() => {
        isMountedRef.current = true;

        const defaultLat = latitude || 18.5204;
        const defaultLng = longitude || 73.8567;

        async function setupMap() {
            if (!isMountedRef.current || !mapContainerRef.current) return;

            // 1. Attempt to load Google Maps JS SDK
            const isGoogleLoaded = await loadGoogleMapsScript();

            if (isGoogleLoaded && (window as any).google?.maps && mapContainerRef.current) {
                try {
                    const google = (window as any).google;
                    setMapEngine("google");

                    const center = { lat: defaultLat, lng: defaultLng };
                    const map = new google.maps.Map(mapContainerRef.current, {
                        center,
                        zoom: 16,
                        mapTypeControl: false,
                        streetViewControl: false,
                        fullscreenControl: false,
                        zoomControl: true,
                        gestureHandling: "greedy",
                    });
                    googleMapRef.current = map;

                    // Create branded draggable Pin
                    const marker = new google.maps.Marker({
                        position: center,
                        map,
                        draggable: true,
                        title: "Selected Delivery Location",
                        animation: google.maps.Animation.DROP,
                    });
                    googleMarkerRef.current = marker;

                    marker.addListener("dragend", () => {
                        const pos = marker.getPosition();
                        if (pos) {
                            const curLat = pos.lat();
                            const curLng = pos.lng();
                            handleReverseGeocode(curLat, curLng);
                        }
                    });

                    map.addListener("click", (e: any) => {
                        if (e.latLng) {
                            const curLat = e.latLng.lat();
                            const curLng = e.latLng.lng();
                            marker.setPosition(e.latLng);
                            handleReverseGeocode(curLat, curLng);
                        }
                    });

                    if (!skipInitialReverseGeocode && (latitude === null || longitude === null)) {
                        handleReverseGeocode(defaultLat, defaultLng);
                    }

                    if (isMountedRef.current) {
                        setMapLoaded(true);
                    }
                    return;
                } catch (gErr) {
                    console.warn("Google Maps initialization warning, falling back to Leaflet:", gErr);
                }
            }

            // 2. Fallback: Leaflet OpenStreetMap
            setMapEngine("leaflet");
            initLeaflet(defaultLat, defaultLng);
        }

        function initLeaflet(lat: number, lng: number) {
            if (!isMountedRef.current || !mapContainerRef.current) return;

            if (!document.querySelector('link[href*="leaflet.css"]')) {
                const link = document.createElement("link");
                link.rel = "stylesheet";
                link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
                document.head.appendChild(link);
            }

            const runLeaflet = () => {
                const L = (window as any).L;
                if (!L || !mapContainerRef.current) return;

                const container = mapContainerRef.current;
                if (leafletMapRef.current) {
                    try {
                        leafletMapRef.current.off();
                        leafletMapRef.current.remove();
                    } catch (e) {}
                    leafletMapRef.current = null;
                }
                if ((container as any)._leaflet_id) {
                    delete (container as any)._leaflet_id;
                }

                try {
                    const map = L.map(container, {
                        center: [lat, lng],
                        zoom: 16,
                        zoomControl: true,
                    });
                    leafletMapRef.current = map;

                    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                        maxZoom: 19,
                    }).addTo(map);

                    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
                    leafletMarkerRef.current = marker;

                    marker.on("dragend", () => {
                        const pos = marker.getLatLng();
                        handleReverseGeocode(pos.lat, pos.lng);
                    });

                    map.on("click", (e: any) => {
                        const { lat: clickLat, lng: clickLng } = e.latlng;
                        marker.setLatLng([clickLat, clickLng]);
                        handleReverseGeocode(clickLat, clickLng);
                    });

                    if (!skipInitialReverseGeocode && (latitude === null || longitude === null)) {
                        handleReverseGeocode(lat, lng);
                    }

                    if (isMountedRef.current) {
                        setMapLoaded(true);
                    }
                } catch (lErr) {
                    console.warn("Leaflet map initialization warning in HouseMapPicker:", lErr);
                }
            };

            if ((window as any).L) {
                runLeaflet();
            } else {
                let script = document.querySelector('script[src*="leaflet.js"]') as HTMLScriptElement;
                if (!script) {
                    script = document.createElement("script");
                    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
                    script.async = true;
                    document.body.appendChild(script);
                }
                script.addEventListener("load", runLeaflet);
            }
        }

        const handleAuthFailure = () => {
            if (!isMountedRef.current || !mapContainerRef.current) return;
            console.warn("[HouseMapPicker] Google Maps auth failure. Switching to Leaflet immediately.");
            if (googleMapRef.current) {
                googleMapRef.current = null;
                googleMarkerRef.current = null;
            }
            if (mapContainerRef.current) {
                mapContainerRef.current.innerHTML = "";
            }
            setMapEngine("leaflet");
            initLeaflet(defaultLat, defaultLng);
        };

        window.addEventListener("google-maps-auth-failure", handleAuthFailure);

        setupMap();

        return () => {
            isMountedRef.current = false;
            window.removeEventListener("google-maps-auth-failure", handleAuthFailure);
            if (leafletMapRef.current) {
                try {
                    leafletMapRef.current.off();
                    leafletMapRef.current.remove();
                } catch (e) {}
                leafletMapRef.current = null;
            }
            if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id) {
                delete (mapContainerRef.current as any)._leaflet_id;
            }
        };
    }, [handleReverseGeocode, skipInitialReverseGeocode, latitude, longitude]);

    // Update marker position and center map when latitude/longitude change from parent
    useEffect(() => {
        if (latitude !== null && longitude !== null) {
            // 1. Google Maps
            if (googleMapRef.current && googleMarkerRef.current) {
                const pos = { lat: latitude, lng: longitude };
                googleMarkerRef.current.setPosition(pos);
                googleMapRef.current.panTo(pos);
            }
            // 2. Leaflet
            if (leafletMapRef.current && leafletMarkerRef.current) {
                try {
                    leafletMarkerRef.current.setLatLng([latitude, longitude]);
                    if (typeof leafletMapRef.current.flyTo === "function") {
                        leafletMapRef.current.flyTo([latitude, longitude], 16, { animate: true, duration: 0.5 });
                    } else {
                        leafletMapRef.current.setView([latitude, longitude], 16);
                    }
                } catch {}
            }
        }
    }, [latitude, longitude]);

    // Live Places Autocomplete suggestions as user types
    const handleQueryChange = (text: string) => {
        setSearchQuery(text);
        if (searchError) setSearchError(null);

        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
        }

        const trimmed = text.trim();
        if (trimmed.length < 2) {
            setSearchResults([]);
            setShowResultsDropdown(false);
            return;
        }

        searchDebounceRef.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const centerLat = latitude || 18.5204;
                const centerLng = longitude || 73.8567;
                const suggestions = await fetchPlaceSuggestions(trimmed, { lat: centerLat, lng: centerLng });

                if (isMountedRef.current) {
                    setSearchResults(suggestions);
                    setShowResultsDropdown(suggestions.length > 0);
                    if (suggestions.length === 0) {
                        setSearchError(`No locations found for "${trimmed}". Try searching with landmark or pincode.`);
                    }
                }
            } catch (err) {
                console.warn("Live places suggestion error:", err);
            } finally {
                if (isMountedRef.current) {
                    setIsSearching(false);
                }
            }
        }, 260);
    };

    // Handle form submit search
    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const query = searchQuery.trim();
        if (!query) return;

        setIsSearching(true);
        setSearchError(null);

        try {
            const centerLat = latitude || 18.5204;
            const centerLng = longitude || 73.8567;
            const suggestions = await fetchPlaceSuggestions(query, { lat: centerLat, lng: centerLng });

            if (suggestions.length > 0) {
                if (suggestions.length === 1) {
                    selectLocation(suggestions[0]);
                } else {
                    setSearchResults(suggestions);
                    setShowResultsDropdown(true);
                }
            } else {
                setSearchError(`No locations found for "${query}". Try searching with landmark or pincode.`);
            }
        } catch (err) {
            console.error("Location search error:", err);
            setSearchError("Unable to search location right now. Please pin manually on map.");
        } finally {
            setIsSearching(false);
        }
    };

    // Apply selected location from search dropdown
    const selectLocation = async (item: PlacePredictionItem) => {
        setShowResultsDropdown(false);
        setSearchResults([]);
        setSearchError(null);
        setSearchQuery(item.mainText || item.description.split(",")[0]);

        let targetLat = item.lat;
        let targetLng = item.lng;
        let details: NormalizedAddressDetails | undefined = item.details as NormalizedAddressDetails;

        // If suggestion has a Google placeId, fetch exact coordinates & components
        if (item.placeId && !targetLat && !targetLng) {
            setIsSearching(true);
            const detailed = await fetchPlaceDetails(item.placeId);
            setIsSearching(false);
            if (detailed && detailed.lat && detailed.lng) {
                targetLat = detailed.lat;
                targetLng = detailed.lng;
                details = detailed;
            }
        }

        if (targetLat === undefined || targetLng === undefined) {
            // Reverse geocode fallback
            return;
        }

        // Reposition Google Map or Leaflet
        if (googleMapRef.current && googleMarkerRef.current) {
            const pos = { lat: targetLat, lng: targetLng };
            googleMarkerRef.current.setPosition(pos);
            googleMapRef.current.panTo(pos);
            googleMapRef.current.setZoom(16);
        } else if (leafletMapRef.current && leafletMarkerRef.current) {
            leafletMarkerRef.current.setLatLng([targetLat, targetLng]);
            if (typeof leafletMapRef.current.flyTo === "function") {
                leafletMapRef.current.flyTo([targetLat, targetLng], 16, { animate: true, duration: 0.6 });
            } else {
                leafletMapRef.current.setView([targetLat, targetLng], 16);
            }
        }

        if (details) {
            onChange(targetLat, targetLng, {
                pincode: details.pincode || "",
                street: details.street || "",
                landmark: details.landmark || "",
                houseNumber: details.houseNumber || "",
                city: details.city || "Pune",
                state: details.state || "Maharashtra",
                formattedAddress: details.formattedAddress || item.description,
            });
        } else {
            handleReverseGeocode(targetLat, targetLng);
        }
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

                if (googleMapRef.current && googleMarkerRef.current) {
                    const gPos = { lat: curLat, lng: curLng };
                    googleMarkerRef.current.setPosition(gPos);
                    googleMapRef.current.panTo(gPos);
                    googleMapRef.current.setZoom(17);
                } else if (leafletMapRef.current && leafletMarkerRef.current) {
                    leafletMarkerRef.current.setLatLng([curLat, curLng]);
                    if (typeof leafletMapRef.current.flyTo === "function") {
                        leafletMapRef.current.flyTo([curLat, curLng], 16, { animate: true, duration: 0.6 });
                    } else {
                        leafletMapRef.current.setView([curLat, curLng], 16);
                    }
                }

                handleReverseGeocode(curLat, curLng);
            },
            (err) => {
                setIsLocatingGps(false);
                console.warn("GPS error:", err);
                alert("Unable to detect GPS position. Please check location permissions or pin manually.");
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
                        onChange={(e) => handleQueryChange(e.target.value)}
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

                {/* Live Places Autocomplete Suggestions Dropdown */}
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
                                key={item.placeId || index}
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
                                        {item.mainText || item.description.split(",")[0]}
                                    </div>
                                    <div style={{ fontSize: "0.72rem", color: "#64748B", marginTop: "1px" }}>
                                        {item.secondaryText || item.description}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Interactive Map Canvas */}
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
                <div style={{ fontSize: "0.75rem", color: "#16A34A", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span>📍</span>
                        <span>Coordinates selected: {latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
                    </div>
                    <span style={{ fontSize: "0.70rem", color: "#64748B" }}>
                        {mapEngine === "google" ? "Powered by Google Maps" : "Interactive Map"}
                    </span>
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
