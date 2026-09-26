"use client";

import { useEffect, useRef, useState } from "react";

interface AddressDetails {
    pincode?: string;
    street?: string;
    landmark?: string;
    houseNumber?: string;
}

interface HouseMapPickerProps {
    latitude: number | null;
    longitude: number | null;
    onChange: (lat: number, lng: number, details?: AddressDetails) => void;
}

export function HouseMapPicker({ latitude, longitude, onChange }: HouseMapPickerProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const isMountedRef = useRef<boolean>(true);
    const [mapLoaded, setMapLoaded] = useState(false);

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

                const updateCoords = async (newLat: number, newLng: number) => {
                    if (!isMountedRef.current) return;
                    try {
                        let pincode = "";
                        let street = "";
                        let landmark = "";
                        let houseNumber = "";

                        // Primary: Nominatim OpenStreetMap
                        try {
                            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}`, {
                                headers: { "Accept-Language": "en" }
                            });
                            if (res.ok) {
                                const data = await res.json();
                                const address = data.address || {};
                                pincode = address.postcode || "";
                                street = address.road || address.suburb || address.neighbourhood || address.city_district || "";
                                landmark = address.amenity || address.shop || address.commercial || address.retail || address.suburb || "";
                                houseNumber = address.house_number || address.building || "";
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
                                }
                            } catch (bdcErr) {
                                console.warn("BigDataCloud reverse geocode fallback:", bdcErr);
                            }
                        }

                        if (isMountedRef.current) {
                            onChange(newLat, newLng, { pincode, street, landmark, houseNumber });
                        }
                    } catch (e) {
                        console.error("Reverse geocoding error in HouseMapPicker:", e);
                        if (isMountedRef.current) {
                            onChange(newLat, newLng);
                        }
                    }
                };

                // Trigger initial geocoding if we are using the fallback/gps location
                if (latitude === null || longitude === null) {
                    updateCoords(initialLat, initialLng);
                }

                marker.on("dragend", () => {
                    const pos = marker.getLatLng();
                    updateCoords(pos.lat, pos.lng);
                });

                map.on("click", (e: any) => {
                    const { lat: clickLat, lng: clickLng } = e.latlng;
                    marker.setLatLng([clickLat, clickLng]);
                    updateCoords(clickLat, clickLng);
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
    }, []);

    // Update marker position if coordinates change externally
    useEffect(() => {
        if (mapRef.current && markerRef.current && latitude !== null && longitude !== null) {
            const L = (window as any).L;
            if (L) {
                try {
                    const currentLatLng = markerRef.current.getLatLng();
                    if (currentLatLng && (currentLatLng.lat !== latitude || currentLatLng.lng !== longitude)) {
                        markerRef.current.setLatLng([latitude, longitude]);
                        mapRef.current.panTo([latitude, longitude]);
                    }
                } catch (e) {
                    // Ignore transient pan error
                }
            }
        }
    }, [latitude, longitude]);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
            <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "2px", fontWeight: "bold" }}>
                1. Select House Location on Map *
            </label>
            <div
                ref={mapContainerRef}
                style={{
                    height: "180px",
                    width: "100%",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    zIndex: 10
                }}
            />
            {latitude && longitude ? (
                <div style={{ fontSize: "0.75rem", color: "#16A34A", fontWeight: "600" }}>
                    📍 House coordinates set: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </div>
            ) : (
                <div style={{ fontSize: "0.75rem", color: "#DC2626", fontWeight: "600" }}>
                    ⚠️ Map pin of house is required! Drag the marker or click on the map.
                </div>
            )}
        </div>
    );
}

export default HouseMapPicker;
