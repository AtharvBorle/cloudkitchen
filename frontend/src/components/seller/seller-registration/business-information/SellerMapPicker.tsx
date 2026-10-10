"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Search, Navigation, MapPin, CheckCircle2, Loader2, AlertCircle, X } from "lucide-react";
import {
  loadGoogleMapsScript,
  fetchPlaceSuggestions,
  fetchPlaceDetails,
  reverseGeocodeCoords,
  PlacePredictionItem,
  NormalizedAddressDetails,
} from "@/lib/google-maps";
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
  disabled?: boolean;
  onChange: (lat: number, lng: number, formattedAddress?: string, details?: AddressDetails) => void;
}

export const SellerMapPicker: React.FC<SellerMapPickerProps> = ({
  latitude,
  longitude,
  isPinned = true,
  onChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const googleMarkerRef = useRef<any>(null);
  const leafletMapRef = useRef<any>(null);
  const leafletMarkerRef = useRef<any>(null);
  const isMountedRef = useRef<boolean>(true);

  const [mapEngine, setMapEngine] = useState<"google" | "leaflet">("leaflet");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlacePredictionItem[]>([]);
  const [showResultsDropdown, setShowResultsDropdown] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: latitude || 18.5204, // Default Pune
    lng: longitude || 73.8567,
  });

  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setShowResultsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleReverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      try {
        const details = await reverseGeocodeCoords(lat, lng);
        if (isMountedRef.current) {
          setCurrentCoords({ lat, lng });
          onChange(lat, lng, details.formattedAddress || "", {
            pincode: details.pincode || "",
            street: details.street || "",
            landmark: details.landmark || "",
            city: details.city || "Pune",
            state: details.state || "Maharashtra",
            fullAddress: details.formattedAddress || "",
          });
        }
      } catch (err) {
        console.warn("Reverse geocoding warning in SellerMapPicker:", err);
        if (isMountedRef.current) {
          onChange(lat, lng);
        }
      }
    },
    [onChange]
  );

  useEffect(() => {
    isMountedRef.current = true;
    const initialLat = latitude || currentCoords.lat;
    const initialLng = longitude || currentCoords.lng;

    async function initMap() {
      if (!isMountedRef.current || !mapContainerRef.current) return;

      // 1. Try Google Maps JS SDK
      const isGoogleLoaded = await loadGoogleMapsScript();

      if (isGoogleLoaded && (window as any).google?.maps && mapContainerRef.current) {
        try {
          const google = (window as any).google;
          setMapEngine("google");

          const center = { lat: initialLat, lng: initialLng };
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

          const marker = new google.maps.Marker({
            position: center,
            map,
            draggable: true,
            title: "Cloud Kitchen Outlet Location",
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

          if (!latitude || !longitude) {
            handleReverseGeocode(initialLat, initialLng);
          }

          if (isMountedRef.current) {
            setMapLoaded(true);
          }
          return;
        } catch (gErr) {
          console.warn("Google Maps init warning in SellerMapPicker, falling back to Leaflet:", gErr);
        }
      }

      // 2. Fallback: Leaflet
      setMapEngine("leaflet");
      initLeaflet(initialLat, initialLng);
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

          if (!latitude || !longitude) {
            handleReverseGeocode(lat, lng);
          }

          if (isMountedRef.current) {
            setMapLoaded(true);
          }
        } catch (lErr) {
          console.warn("Leaflet map initialization warning in SellerMapPicker:", lErr);
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

    initMap();

    return () => {
      isMountedRef.current = false;
      if (leafletMapRef.current) {
        try {
          leafletMapRef.current.off();
          leafletMapRef.current.remove();
        } catch (e) {}
        leafletMapRef.current = null;
      }
      if (mapContainerRef.current) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
    };
  }, [handleReverseGeocode]);

  // Update marker position if external coordinates change
  useEffect(() => {
    if (latitude && longitude) {
      if (googleMapRef.current && googleMarkerRef.current) {
        const pos = { lat: latitude, lng: longitude };
        googleMarkerRef.current.setPosition(pos);
        googleMapRef.current.panTo(pos);
        setCurrentCoords({ lat: latitude, lng: longitude });
      } else if (leafletMapRef.current && leafletMarkerRef.current) {
        const current = leafletMarkerRef.current.getLatLng();
        if (Math.abs(current.lat - latitude) > 0.0001 || Math.abs(current.lng - longitude) > 0.0001) {
          leafletMarkerRef.current.setLatLng([latitude, longitude]);
          leafletMapRef.current.panTo([latitude, longitude]);
          setCurrentCoords({ lat: latitude, lng: longitude });
        }
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

        if (googleMapRef.current && googleMarkerRef.current) {
          const gPos = { lat, lng };
          googleMarkerRef.current.setPosition(gPos);
          googleMapRef.current.panTo(gPos);
          googleMapRef.current.setZoom(17);
        } else if (leafletMapRef.current && leafletMarkerRef.current) {
          leafletMarkerRef.current.setLatLng([lat, lng]);
          leafletMapRef.current.setView([lat, lng], 17);
        }

        handleReverseGeocode(lat, lng);
      },
      (err) => {
        if (!isMountedRef.current) return;
        setIsLocating(false);
        console.warn("GPS Geolocation notice:", err);
        setSearchError("GPS access requires location permissions. You can also search an address or click directly on the map.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Live Places Search Input
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
        const centerLat = currentCoords.lat || 18.5204;
        const centerLng = currentCoords.lng || 73.8567;
        const suggestions = await fetchPlaceSuggestions(trimmed, { lat: centerLat, lng: centerLng });

        if (isMountedRef.current) {
          setSearchResults(suggestions);
          setShowResultsDropdown(suggestions.length > 0);
          if (suggestions.length === 0) {
            setSearchError(`No locations found matching "${trimmed}".`);
          }
        }
      } catch (err) {
        console.warn("SellerMapPicker places search error:", err);
      } finally {
        if (isMountedRef.current) {
          setIsSearching(false);
        }
      }
    }, 260);
  };

  // Handle Enter Search
  const handleSearchLocation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const centerLat = currentCoords.lat || 18.5204;
      const centerLng = currentCoords.lng || 73.8567;
      const suggestions = await fetchPlaceSuggestions(query, { lat: centerLat, lng: centerLng });

      if (suggestions.length > 0) {
        if (suggestions.length === 1) {
          selectLocation(suggestions[0]);
        } else {
          setSearchResults(suggestions);
          setShowResultsDropdown(true);
        }
      } else {
        setSearchError("No location found matching your search. Try a landmark or area name.");
      }
    } catch (err) {
      console.warn("Geocoding search warning:", err);
      setSearchError("Search unavailable. Please click or drag the pin on the map directly.");
    } finally {
      if (isMountedRef.current) {
        setIsSearching(false);
      }
    }
  };

  const selectLocation = async (item: PlacePredictionItem) => {
    setShowResultsDropdown(false);
    setSearchResults([]);
    setSearchError(null);
    setSearchQuery(item.mainText || item.description.split(",")[0]);

    let targetLat = item.lat;
    let targetLng = item.lng;
    let details: NormalizedAddressDetails | undefined = item.details as NormalizedAddressDetails;

    if (item.placeId && (!targetLat || !targetLng)) {
      setIsSearching(true);
      const detailed = await fetchPlaceDetails(item.placeId);
      setIsSearching(false);
      if (detailed && detailed.lat && detailed.lng) {
        targetLat = detailed.lat;
        targetLng = detailed.lng;
        details = detailed;
      }
    }

    if (targetLat === undefined || targetLng === undefined) return;

    setCurrentCoords({ lat: targetLat, lng: targetLng });

    if (googleMapRef.current && googleMarkerRef.current) {
      const pos = { lat: targetLat, lng: targetLng };
      googleMarkerRef.current.setPosition(pos);
      googleMapRef.current.panTo(pos);
      googleMapRef.current.setZoom(16);
    } else if (leafletMapRef.current && leafletMarkerRef.current) {
      leafletMarkerRef.current.setLatLng([targetLat, targetLng]);
      leafletMapRef.current.setView([targetLat, targetLng], 16);
    }

    if (details) {
      onChange(targetLat, targetLng, details.formattedAddress || item.description, {
        pincode: details.pincode || "",
        street: details.street || "",
        landmark: details.landmark || "",
        city: details.city || "Pune",
        state: details.state || "Maharashtra",
        fullAddress: details.formattedAddress || item.description,
      });
    } else {
      handleReverseGeocode(targetLat, targetLng);
    }
  };

  return (
    <div className={styles.container}>
      {/* Top Search & GPS Action Bar */}
      <div className={styles.topControls}>
        <div ref={searchWrapperRef} className={styles.searchWrapper} style={{ position: "relative" }}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search kitchen address, landmark, area..."
            value={searchQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearchLocation();
              }
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
                setShowResultsDropdown(false);
              }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: "4px" }}
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            className={styles.searchBtn}
            onClick={() => handleSearchLocation()}
            disabled={isSearching}
          >
            {isSearching ? <Loader2 size={13} className="animate-spin" /> : "Search"}
          </button>

          {/* Autocomplete Suggestions Dropdown */}
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
                  <MapPin size={15} color="#FF5500" style={{ marginTop: "2px", flexShrink: 0 }} />
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
          <span style={{ fontSize: "0.70rem", color: "#64748B", marginLeft: "auto" }}>
            {mapEngine === "google" ? "Google Maps" : "Interactive Map"}
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
