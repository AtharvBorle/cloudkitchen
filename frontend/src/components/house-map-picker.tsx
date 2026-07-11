"use client";

import { useEffect, useRef, useState } from "react";

interface HouseMapPickerProps {
    latitude: number | null;
    longitude: number | null;
    pincode?: string;
    onChange: (lat: number, lng: number, pincode?: string) => void;
}

export function HouseMapPicker({ latitude, longitude, pincode, onChange }: HouseMapPickerProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const lastMapSetPincodeRef = useRef("");

    useEffect(() => {
        // Load Leaflet dynamically
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

            // If coordinates exist, use them. Otherwise use standard fallback.
            const initialLat = latitude || lat;
            const initialLng = longitude || lng;

            const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 16);
            mapRef.current = map;

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
            markerRef.current = marker;

            if (latitude === null || longitude === null) {
                onChange(initialLat, initialLng);
            }

            const updateCoords = async (newLat: number, newLng: number) => {
                let detectedPincode = "";
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}`);
                    if (res.ok) {
                        const data = await res.json();
                        detectedPincode = data.address?.postcode || "";
                    }
                } catch (e) {
                    console.error("Reverse geocoding error in HouseMapPicker:", e);
                }
                lastMapSetPincodeRef.current = detectedPincode;
                onChange(newLat, newLng, detectedPincode);
            };

            marker.on("dragend", () => {
                const pos = marker.getLatLng();
                updateCoords(pos.lat, pos.lng);
            });

            map.on("click", (e: any) => {
                const { lat, lng } = e.latlng;
                marker.setLatLng([lat, lng]);
                updateCoords(lat, lng);
            });
        };

        script.onload = () => {
            setMapLoaded(true);
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        initMap(pos.coords.latitude, pos.coords.longitude);
                    },
                    () => {
                        initMap(19.0760, 72.8777); // Mumbai fallback
                    },
                    { enableHighAccuracy: true, timeout: 5000 }
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
                mapRef.current.remove();
            }
        };
    }, []);

    // Update marker position if coordinates change externally
    useEffect(() => {
        if (mapRef.current && markerRef.current && latitude && longitude) {
            const L = (window as any).L;
            if (L) {
                const currentLatLng = markerRef.current.getLatLng();
                if (currentLatLng.lat !== latitude || currentLatLng.lng !== longitude) {
                    markerRef.current.setLatLng([latitude, longitude]);
                    mapRef.current.panTo([latitude, longitude]);
                }
            }
        }
    }, [latitude, longitude]);

    // Update map/marker position based on typed/updated pincode (India-focused)
    useEffect(() => {
        if (!pincode || pincode.length !== 6) return;
        if (pincode === lastMapSetPincodeRef.current) return;

        const geocodePincode = async () => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&postalcode=${pincode}&country=India`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) {
                        const lat = parseFloat(data[0].lat);
                        const lng = parseFloat(data[0].lon);
                        
                        if (mapRef.current) {
                            mapRef.current.setView([lat, lng], 15);
                        }
                        if (markerRef.current) {
                            markerRef.current.setLatLng([lat, lng]);
                        }
                        
                        lastMapSetPincodeRef.current = pincode;
                        onChange(lat, lng, pincode);
                    }
                }
            } catch (e) {
                console.error("Geocoding pincode error in HouseMapPicker:", e);
            }
        };

        const timer = setTimeout(geocodePincode, 800);
        return () => clearTimeout(timer);
    }, [pincode]);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
            <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "2px", fontWeight: "bold" }}>
                Approx. House Location Pin *
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
