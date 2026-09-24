"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search, Navigation, MapPin, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import styles from "./SellerMapPicker.module.css";

export interface AddressDetails {
  pincode?: string;
  street?: string;
  landmark?: string;
  city?: string;
  state?: string;
  fullAddress?: string;
}

export interface SellerMapPickerProps {
  latitude: number | null;
  longitude: number | null;
  isPinned?: boolean;
  onChange: (lat: number, lng: number, formattedAddress?: string, details?: AddressDetails) => void;
}

export const SellerMapPicker: React.FC<SellerMapPickerProps> = ({
  latitude,
  longitude,
  isPinned = true,
  onChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const isMountedRef = useRef<boolean>(true);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: latitude || 18.5204, // Default Pune
    lng: longitude || 73.8567,
  });

  const createCustomIcon = (L: any) => {
    return L.divIcon({
      className: "custom-seller-map-pin",
      html: `
        <div style="
          width: 38px;
          height: 38px;
          background: #FF5500;
          border: 2.5px solid #FFFFFF;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 12px rgba(255, 85, 0, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 14px;
            height: 14px;
            background: #FFFFFF;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -38],
    });
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      if (res.ok) {
        const data = await res.json();
        const address = data.address || {};
        const pincode = address.postcode || "";
        const street = address.road || address.suburb || address.neighbourhood || "";
        const landmark = address.amenity || address.shop || address.commercial || "";
        const city = address.city || address.town || address.village || address.state_district || "Pune";
        const state = address.state || "Maharashtra";
        const fullAddress = data.display_name || "";

        if (isMountedRef.current) {
          onChange(lat, lng, fullAddress, {
            pincode,
            street,
            landmark,
            city,
            state,
            fullAddress,
          });
        }
      } else {
        if (isMountedRef.current) {
          onChange(lat, lng);
        }
      }
    } catch (err) {
      console.warn("Reverse geocoding warning in SellerMapPicker:", err);
      if (isMountedRef.current) {
        onChange(lat, lng);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    // Dynamic Leaflet CSS injection
    const existingLink = document.querySelector('link[href*="leaflet.css"]');
    if (!existingLink) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const initLeafletMap = () => {
      if (!isMountedRef.current || !mapContainerRef.current) return;
      const L = (window as any).L;
      if (!L) return;

      const container = mapContainerRef.current;

      // Safely cleanup any previous map instance on this container
      if (mapRef.current) {
        try {
          mapRef.current.off();
          mapRef.current.remove();
        } catch (e) {
          // Ignore removal error
        }
        mapRef.current = null;
      }

      if ((container as any)._leaflet_id) {
        delete (container as any)._leaflet_id;
      }

      const initialLat = latitude || currentCoords.lat;
      const initialLng = longitude || currentCoords.lng;

      try {
        const map = L.map(container, {
          center: [initialLat, initialLng],
          zoom: 16,
          zoomControl: true,
        });
        mapRef.current = map;

        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20,
        }).addTo(map);

        const customIcon = createCustomIcon(L);
        const marker = L.marker([initialLat, initialLng], {
          icon: customIcon,
          draggable: true,
          autoPan: true,
        }).addTo(map);
        markerRef.current = marker;

        marker.bindPopup("<b>Outlet Pickup Location</b><br/>Drag pin to adjust exact point for delivery riders.").openPopup();

        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          if (isMountedRef.current) {
            setCurrentCoords({ lat: pos.lat, lng: pos.lng });
            reverseGeocode(pos.lat, pos.lng);
          }
        });

        map.on("click", (e: any) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          if (isMountedRef.current) {
            setCurrentCoords({ lat, lng });
            reverseGeocode(lat, lng);
          }
        });

        if (isMountedRef.current) {
          setMapLoaded(true);
        }
      } catch (mapErr) {
        console.warn("Leaflet map initialization warning:", mapErr);
      }
    };

    if (!(window as any).L) {
      const existingScript = document.querySelector('script[src*="leaflet.js"]');
      if (existingScript) {
        existingScript.addEventListener("load", initLeafletMap);
      } else {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.async = true;
        script.onload = () => {
          initLeafletMap();
        };
        document.body.appendChild(script);
      }
    } else {
      initLeafletMap();
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
      if (mapContainerRef.current) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
    };
  }, []);

  // Update marker position if external coordinates change
  useEffect(() => {
    if (mapRef.current && markerRef.current && latitude && longitude) {
      const current = markerRef.current.getLatLng();
      if (Math.abs(current.lat - latitude) > 0.0001 || Math.abs(current.lng - longitude) > 0.0001) {
        markerRef.current.setLatLng([latitude, longitude]);
        mapRef.current.panTo([latitude, longitude]);
        setCurrentCoords({ lat: latitude, lng: longitude });
      }
    }
  }, [latitude, longitude]);

  // Handle "Use Current Location" (GPS)
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setSearchError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setSearchError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!isMountedRef.current) return;
        setIsLocating(false);
        const { latitude: lat, longitude: lng } = pos.coords;
        setCurrentCoords({ lat, lng });

        if (mapRef.current && markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          mapRef.current.setView([lat, lng], 17);
        }

        reverseGeocode(lat, lng);
      },
      (err) => {
        if (!isMountedRef.current) return;
        setIsLocating(false);
        console.warn("GPS Geolocation notice:", err);
        setSearchError("GPS access requires HTTPS or localhost permissions. You can also search an address or click directly on the map.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Handle Search Location via Nominatim geocoding
  const handleSearchLocation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const lat = parseFloat(results[0].lat);
          const lng = parseFloat(results[0].lon);
          if (isMountedRef.current) {
            setCurrentCoords({ lat, lng });

            if (mapRef.current && markerRef.current) {
              markerRef.current.setLatLng([lat, lng]);
              mapRef.current.setView([lat, lng], 16);
            }

            reverseGeocode(lat, lng);
          }
        } else {
          if (isMountedRef.current) {
            setSearchError("No location found matching your search. Try a landmark or area name.");
          }
        }
      } else {
        if (isMountedRef.current) {
          setSearchError("Location search service unavailable. Please click on the map to pin.");
        }
      }
    } catch (err) {
      console.warn("Geocoding search warning:", err);
      if (isMountedRef.current) {
        setSearchError("Search unavailable. Please click or drag the pin on the map directly.");
      }
    } finally {
      if (isMountedRef.current) {
        setIsSearching(false);
      }
    }
  };

  return (
    <div className={styles.container}>
      {/* Top Search & GPS Action Bar */}
      <div className={styles.topControls}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search address, landmark, area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearchLocation();
              }
            }}
          />
          <button
            type="button"
            className={styles.searchBtn}
            onClick={() => handleSearchLocation()}
            disabled={isSearching}
          >
            {isSearching ? <Loader2 size={13} className="animate-spin" /> : "Search"}
          </button>
        </div>

        <button
          type="button"
          className={`${styles.gpsBtn} ${isLocating ? styles.gpsBtnActive : ""}`}
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          title="Detect and pin your current location automatically"
        >
          {isLocating ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Locating...</span>
            </>
          ) : (
            <>
              <Navigation size={14} />
              <span>Use Current GPS</span>
            </>
          )}
        </button>
      </div>

      {searchError && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#dc2626", marginTop: "4px" }}>
          <AlertCircle size={14} />
          <span>{searchError}</span>
        </div>
      )}

      {/* Interactive Map Canvas */}
      <div className={styles.mapWrapper}>
        <div ref={mapContainerRef} className={styles.mapElement} />
        {!mapLoaded && (
          <div className={styles.mapLoadingOverlay}>
            <Loader2 size={24} className="animate-spin" style={{ color: "#FF5500" }} />
            <span>Loading interactive map...</span>
          </div>
        )}
      </div>

      {/* Live Coordinates Badge for Delivery Routing */}
      <div className={styles.statusCard}>
        <div className={styles.statusLeft}>
          <CheckCircle2 size={16} color="#16a34a" />
          <span>Outlet Pinned for Delivery Routing:</span>
          <span className={styles.coordsPill}>
            {currentCoords.lat.toFixed(6)}, {currentCoords.lng.toFixed(6)}
          </span>
        </div>
        <p className={styles.hintText}>
          💡 Drag pin or click on map to fine-tune rider pickup location.
        </p>
      </div>
    </div>
  );
};

export default SellerMapPicker;
