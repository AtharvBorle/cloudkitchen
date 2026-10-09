"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  MapPin,
  X,
  Navigation,
  Search,
  Plus,
  Check,
  Home,
  Briefcase,
  Loader2,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { useLocation } from "@/components/location-provider";
import { fetchApi } from "@/lib/fetch-api";
import { usePathname } from "next/navigation";
import { HouseMapPicker } from "@/components/house-map-picker";
import { getPincodeCoordinates, PINCODE_COORDINATES } from "@/lib/geo-distance";
import { findDuplicateAddress } from "@/lib/address-validation";
import styles from "./LocationModal.module.css";

const POPULAR_AREAS = [
  { pincode: "411038", name: "Kothrud, Pune", lat: 18.5074, lng: 73.8077 },
  { pincode: "411045", name: "Baner, Pune", lat: 18.5590, lng: 73.7868 },
  { pincode: "411007", name: "Aundh, Pune", lat: 18.5580, lng: 73.8075 },
  { pincode: "411057", name: "Hinjawadi, Pune", lat: 18.5913, lng: 73.7389 },
  { pincode: "411058", name: "Warje, Pune", lat: 18.4891, lng: 73.8105 },
  { pincode: "411004", name: "Deccan, Pune", lat: 18.5173, lng: 73.8415 },
  { pincode: "411014", name: "Viman Nagar, Pune", lat: 18.5679, lng: 73.9143 },
  { pincode: "411051", name: "Karve Nagar, Pune", lat: 18.4912, lng: 73.8217 },
  { pincode: "411028", name: "Hadapsar, Pune", lat: 18.5089, lng: 73.9259 },
  { pincode: "411006", name: "Kalyani Nagar, Pune", lat: 18.5463, lng: 73.9033 },
  { pincode: "411030", name: "Sadashiv Peth, Pune", lat: 18.5126, lng: 73.8478 },
  { pincode: "411021", name: "Bavdhan, Pune", lat: 18.5330, lng: 73.7745 },
  { pincode: "411061", name: "Wakad, Pune", lat: 18.6015, lng: 73.7885 },
];

export const LocationModal: React.FC = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const {
    defaultAddress,
    isLocationModalOpen,
    closeLocationModal,
    setGuestLocation,
    selectAddress,
    refreshAddress,
    savedAddresses,
  } = useLocation();

  const [pincodeInput, setPincodeInput] = useState("");
  const [selectedAreaInfo, setSelectedAreaInfo] = useState<{
    pincode: string;
    name: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [mapLat, setMapLat] = useState<number>(18.5016);
  const [mapLng, setMapLng] = useState<number>(73.8216);
  const [resolvedPincode, setResolvedPincode] = useState<string>("411051");
  const [resolvedLocality, setResolvedLocality] = useState<string>("Karve Nagar, Pune");
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Add Address Form State
  const [addressType, setAddressType] = useState<"Home" | "Work" | "Other">("Home");
  const [houseNumber, setHouseNumber] = useState("");
  const [street, setStreet] = useState("");
  const [landmark, setLandmark] = useState("");
  const [formPincode, setFormPincode] = useState("");
  const [latitude, setLatitude] = useState<number | null>(18.5204);
  const [longitude, setLongitude] = useState<number | null>(73.8567);

  useEffect(() => {
    if (isLocationModalOpen) {
      const pin =
        defaultAddress?.pincode ||
        (typeof window !== "undefined"
          ? localStorage.getItem("active-selected-pincode") || localStorage.getItem("guest-pincode") || "411051"
          : "411051");
      setPincodeInput(pin);
      setResolvedPincode(pin);

      const pinCoords = getPincodeCoordinates(pin);
      const initialLat = defaultAddress?.latitude != null && !isNaN(Number(defaultAddress.latitude))
        ? Number(defaultAddress.latitude)
        : (pinCoords?.lat ?? 18.5016);
      const initialLng = defaultAddress?.longitude != null && !isNaN(Number(defaultAddress.longitude))
        ? Number(defaultAddress.longitude)
        : (pinCoords?.lng ?? 73.8216);

      setMapLat(initialLat);
      setMapLng(initialLng);
      setLatitude(initialLat);
      setLongitude(initialLng);

      const matched = POPULAR_AREAS.find((a) => a.pincode === pin) || null;
      setSelectedAreaInfo(matched);
      setResolvedLocality(defaultAddress?.locality || defaultAddress?.street || matched?.name || pinCoords?.locality || "Pune Area");
      setShowAddForm(false);
      setFeedback(null);
      setIsApplying(false);
    }
  }, [isLocationModalOpen, defaultAddress]);

  if (!isLocationModalOpen) return null;

  const showNotification = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  // 1. Handle Pincode / Area Selection (Centers Map on Area & Updates Pin)
  const handleSelectAreaOrPin = async (
    targetInput: string,
    areaOverride?: { pincode: string; name: string; lat: number; lng: number } | null,
    autoClose: boolean = false
  ) => {
    const raw = (targetInput || "").trim();
    if (!raw && !areaOverride) {
      showNotification("error", "Please enter a pincode or area name to search");
      return;
    }

    let cleanPin = "";
    let localityName = "";
    let finalLat: number | null = null;
    let finalLng: number | null = null;

    if (areaOverride) {
      cleanPin = areaOverride.pincode;
      localityName = areaOverride.name;
      finalLat = areaOverride.lat;
      finalLng = areaOverride.lng;
    } else {
      const pinDigits = raw.replace(/\D/g, "");
      const pinMatch = pinDigits.length === 6 ? pinDigits : raw.match(/\b\d{6}\b/)?.[0];
      if (pinMatch) {
        cleanPin = pinMatch;
        const matched = POPULAR_AREAS.find((a) => a.pincode === cleanPin);
        const pinInfo = getPincodeCoordinates(cleanPin);
        localityName = matched?.name || (pinInfo ? `${pinInfo.locality}, ${pinInfo.city}` : `PIN ${cleanPin}`);
        finalLat = matched?.lat ?? pinInfo?.lat ?? null;
        finalLng = matched?.lng ?? pinInfo?.lng ?? null;
      } else {
        const lower = raw.toLowerCase();
        // 1. Match from POPULAR_AREAS
        const matched = POPULAR_AREAS.find(
          (a) =>
            a.name.toLowerCase().includes(lower) ||
            lower.includes(a.name.toLowerCase().split(",")[0].trim())
        );
        if (matched) {
          cleanPin = matched.pincode;
          localityName = matched.name;
          finalLat = matched.lat;
          finalLng = matched.lng;
        } else {
          // 2. Match from all known Pune PINCODE_COORDINATES
          for (const [pin, info] of Object.entries(PINCODE_COORDINATES)) {
            const locLower = info.locality.toLowerCase();
            const segments = locLower.split(/[\/,]/).map((s) => s.trim());
            if (
              locLower.includes(lower) ||
              lower.includes(locLower) ||
              segments.some((seg) => seg && (seg.includes(lower) || lower.includes(seg)))
            ) {
              cleanPin = pin;
              localityName = `${info.locality}, ${info.city}`;
              finalLat = info.lat;
              finalLng = info.lng;
              break;
            }
          }
        }
      }

      // 3. Fallback: Online forward geocoding via OpenStreetMap Nominatim
      if (finalLat === null || finalLng === null) {
        setIsSearchingLocation(true);
        try {
          const searchQuery = cleanPin ? `${cleanPin}, India` : `${raw}, Pune, Maharashtra, India`;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              searchQuery
            )}&countrycodes=in&limit=1`,
            { headers: { "Accept-Language": "en" } }
          );
          if (res.ok) {
            const results = await res.json();
            if (results && results.length > 0) {
              const item = results[0];
              finalLat = parseFloat(item.lat);
              finalLng = parseFloat(item.lon);
              const displayName = item.display_name || raw;
              const parts = displayName.split(",");
              localityName = parts.slice(0, 2).join(",").trim() || raw;
              const matchPin = displayName.match(/\b\d{6}\b/);
              if (matchPin) {
                cleanPin = matchPin[0];
              }
            }
          }
        } catch (geoErr) {
          console.warn("Forward geocoding error:", geoErr);
        } finally {
          setIsSearchingLocation(false);
        }
      }
    }

    if (finalLat === null || finalLng === null) {
      if (cleanPin && cleanPin.length === 6) {
        finalLat = 18.5204;
        finalLng = 73.8567;
        localityName = localityName || `Pune Area (${cleanPin})`;
      } else {
        showNotification("error", "Location not found. Please enter a valid 6-digit pincode (e.g. 411038) or choose an area below");
        return;
      }
    }

    const effectivePin = cleanPin || resolvedPincode || "411051";
    const effectiveLocality = localityName || `PIN ${effectivePin}`;
    setPincodeInput(effectivePin);
    setResolvedPincode(effectivePin);
    setResolvedLocality(effectiveLocality);
    setMapLat(finalLat);
    setMapLng(finalLng);
    setLatitude(finalLat);
    setLongitude(finalLng);
    setSelectedAreaInfo(areaOverride || POPULAR_AREAS.find((a) => a.pincode === effectivePin) || null);

    // Apply & persist the location immediately across the application
    setGuestLocation(effectivePin, effectiveLocality, "Pune", finalLat, finalLng);
    if (session?.user) {
      fetchApi("/api/user/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode: effectivePin, lat: finalLat, lng: finalLng }),
      })
        .then(() => refreshAddress())
        .catch((e) => console.warn("Background location sync warning:", e));
    }

    if (autoClose) {
      showNotification("success", `✓ PIN Code updated to ${effectivePin} (${effectiveLocality})!`);
      setTimeout(() => {
        closeLocationModal();
        if (typeof window !== "undefined") {
          const el = document.getElementById("places-section");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }
      }, 500);
    } else {
      showNotification("success", `PIN Code updated to ${effectivePin} (${effectiveLocality}). Adjust doorstep pin below if needed.`);
    }
  };

  // 2. Handle Confirming Pinned Delivery Location
  const handleConfirmPinnedLocation = () => {
    setIsApplying(true);
    const typedPin = (pincodeInput || "").replace(/\D/g, "").slice(0, 6);
    const cleanPin = typedPin.length === 6 ? typedPin : ((resolvedPincode || typedPin || "").replace(/\D/g, "").slice(0, 6) || "411051");
    const pinInfo = getPincodeCoordinates(cleanPin);
    const locName = resolvedLocality || (selectedAreaInfo?.name ?? (pinInfo ? `${pinInfo.locality}, ${pinInfo.city}` : `PIN ${cleanPin}`));
    const city = "Pune";
    const finalLat = mapLat;
    const finalLng = mapLng;

    // 1. Optimistically set location immediately with exact GPS coordinates
    setGuestLocation(cleanPin, locName, city, finalLat, finalLng);
    showNotification("success", `Delivery pin set: ${locName} (${cleanPin})`);

    // 2. Sync to database in background if user is authenticated
    if (session?.user) {
      fetchApi("/api/user/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode: cleanPin, lat: finalLat, lng: finalLng }),
      })
        .then(() => refreshAddress())
        .catch((e) => console.warn("Background location sync warning:", e));
    }

    // 3. Smooth, snappy modal close & scroll into view
    setTimeout(() => {
      setIsApplying(false);
      closeLocationModal();
      if (typeof window !== "undefined") {
        const el = document.getElementById("places-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    }, 250);
  };

  // 3. Handle GPS Auto Detection
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      showNotification("error", "Geolocation is not supported by your browser");
      return;
    }

    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setMapLat(lat);
        setMapLng(lng);
        setLatitude(lat);
        setLongitude(lng);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const pin = (addr.postcode || "").replace(/\D/g, "").slice(0, 6) || "411001";
            const locality =
              addr.suburb ||
              addr.neighbourhood ||
              addr.residential ||
              addr.city_district ||
              addr.road ||
              addr.town ||
              addr.city ||
              "Current Location";

            setPincodeInput(pin);
            setResolvedPincode(pin);
            setResolvedLocality(locality);
            setGuestLocation(pin, locality, "Pune", lat, lng);
            if (session?.user) {
              fetchApi("/api/user/location", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pincode: pin, lat, lng }),
              }).catch(() => {});
            }
            showNotification("success", `GPS Location Detected: ${locality} (${pin})`);
          }
        } catch (err) {
          console.error("GPS Reverse Geocode Error:", err);
          showNotification("error", "Error connecting to location service. You can drag the pin manually.");
        } finally {
          setIsLocatingGps(false);
        }
      },
      (error) => {
        setIsLocatingGps(false);
        console.warn("Geolocation permission error:", error);
        showNotification("error", "Location permission denied. Please enter pincode or choose an area.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // 3. Handle Saved Address Selection
  const handleSelectSavedAddress = async (addrId: string) => {
    try {
      await selectAddress(addrId);
      showNotification("success", "Delivery address selected");
      setTimeout(() => closeLocationModal(), 600);
    } catch (err: any) {
      showNotification("error", err?.message || "Failed to select address");
    }
  };

  // 4. Handle Save New Address
  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savedAddresses && savedAddresses.length >= 5) {
      showNotification("error", "You can add a maximum of 5 delivery addresses. Please delete an existing address first.");
      return;
    }
    if (!houseNumber.trim()) {
      showNotification("error", "Please enter house / flat number");
      return;
    }
    if (!street.trim()) {
      showNotification("error", "Please enter street or area name");
      return;
    }
    const cleanPin = formPincode.replace(/\D/g, "").slice(0, 6);
    if (cleanPin.length !== 6) {
      showNotification("error", "Please enter a valid 6-digit Pincode");
      return;
    }

    // Check for duplicate address in savedAddresses
    const dupCheck = findDuplicateAddress(
      {
        houseNumber: houseNumber.trim(),
        street: street.trim(),
        pincode: cleanPin,
        landmark: landmark.trim(),
      },
      savedAddresses
    );

    if (dupCheck.isDuplicate && dupCheck.matchedItem) {
      showNotification(
        "error",
        `This address already exists in your saved list (${dupCheck.matchedItem.houseNumber}, ${dupCheck.matchedItem.street} - ${dupCheck.matchedItem.pincode})`
      );
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        type: addressType,
        houseNumber: houseNumber.trim(),
        street: street.trim(),
        landmark: landmark.trim() || undefined,
        pincode: cleanPin,
        latitude: latitude !== null ? latitude : 18.5204,
        longitude: longitude !== null ? longitude : 73.8567,
        isDefault: true,
      };

      const res = await fetchApi("/api/user/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const resData = await res.json().catch(() => ({}));
        const newId = resData.data?.address?.id || resData.address?.id || resData.data?.id || resData.id;
        if (newId) {
          await fetchApi(`/api/user/addresses/${newId}/default`, {
            method: "PATCH",
          }).catch(() => {});
        }
        if (typeof window !== "undefined") {
          localStorage.setItem("active-selected-pincode", cleanPin);
          localStorage.setItem("guest-pincode", cleanPin);
          if (street) localStorage.setItem("guest-locality", street.trim());
          if (latitude !== null) localStorage.setItem("guest-lat", String(latitude));
          if (longitude !== null) localStorage.setItem("guest-lng", String(longitude));
          window.dispatchEvent(new Event("location-changed"));
          window.dispatchEvent(new CustomEvent("default-address-changed", { detail: { id: newId, pincode: cleanPin, street, latitude, longitude, isDefault: true } }));
          window.dispatchEvent(new Event("storage"));
        }
        await refreshAddress();
        setShowAddForm(false);
        showNotification("success", "New address saved and set as default!");
        setTimeout(() => closeLocationModal(), 800);
      } else {
        const errData = await res.json().catch(() => ({}));
        showNotification("error", errData.message || "Failed to save address");
      }
    } catch (err: any) {
      showNotification("error", err?.message || "An error occurred while saving address");
    } finally {
      setIsSaving(false);
    }
  };

  const handleModalClose = () => {
    const cleanDigits = (pincodeInput || "").replace(/\D/g, "").slice(0, 6);
    if (cleanDigits.length === 6 && cleanDigits !== defaultAddress?.pincode) {
      const pinInfo = getPincodeCoordinates(cleanDigits);
      const matched = POPULAR_AREAS.find((a) => a.pincode === cleanDigits);
      const locName = matched?.name || (pinInfo ? `${pinInfo.locality}, ${pinInfo.city}` : `PIN ${cleanDigits}`);
      const finalLat = matched?.lat ?? pinInfo?.lat ?? mapLat;
      const finalLng = matched?.lng ?? pinInfo?.lng ?? mapLng;

      setGuestLocation(cleanDigits, locName, "Pune", finalLat, finalLng);
      if (session?.user) {
        fetchApi("/api/user/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pincode: cleanDigits, lat: finalLat, lng: finalLng }),
        })
          .then(() => refreshAddress())
          .catch(() => {});
      }
    }
    closeLocationModal();
  };

  return (
    <div className={styles.modalBackdrop} onClick={handleModalClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIconBox}>
              <MapPin size={20} strokeWidth={2.4} />
            </div>
            <div>
              <h2 className={styles.modalTitle}>Choose Location</h2>
              <p className={styles.modalSubtitle}>Select your delivery area for available kitchens</p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={handleModalClose}
            aria-label="Close location modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className={styles.modalBody}>
          {/* Notification Feedback Toast */}
          {feedback && (
            <div
              className={`${styles.statusToast} ${
                feedback.type === "success" ? styles.statusSuccess : styles.statusError
              }`}
            >
              {feedback.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* 1. GPS Auto-Detect Button */}
          <button
            type="button"
            className={styles.gpsBtn}
            onClick={handleDetectGps}
            disabled={isLocatingGps}
          >
            <div className={styles.gpsLeft}>
              <div className={styles.gpsIconCircle}>
                {isLocatingGps ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Navigation size={19} />
                )}
              </div>
              <div>
                <h3 className={styles.gpsTitle}>
                  {isLocatingGps ? "Detecting GPS Location..." : "Use Current Location"}
                </h3>
                <p className={styles.gpsSub}>Enable device GPS for precise nearby kitchens</p>
              </div>
            </div>
            <ChevronRight size={18} color="#EA580C" />
          </button>

          {/* 2. Manual Pincode or Area Search */}
          <div className={styles.searchSection}>
            <span className={styles.sectionLabel}>Search by Pincode or Area</span>
            <div className={styles.pincodeInputRow}>
              <div className={styles.pincodeInputWrapper}>
                <Search size={18} className={styles.pincodeIcon} />
                <input
                  type="text"
                  maxLength={30}
                  placeholder="Enter Pincode or Area (e.g. 411038, Baner)"
                  value={pincodeInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPincodeInput(val);
                    const cleanDigits = val.replace(/\D/g, "");
                    const matchedByPin = cleanDigits.length === 6 ? POPULAR_AREAS.find((a) => a.pincode === cleanDigits) : null;
                    const matchedByName = POPULAR_AREAS.find((a) =>
                      val.trim().length >= 3 && a.name.toLowerCase().includes(val.trim().toLowerCase())
                    );
                    setSelectedAreaInfo(matchedByPin || matchedByName || null);
                    if (cleanDigits.length === 6) {
                      setResolvedPincode(cleanDigits);
                      const pinInfo = getPincodeCoordinates(cleanDigits);
                      const loc = matchedByPin?.name || (pinInfo ? `${pinInfo.locality}, ${pinInfo.city}` : "");
                      if (loc) setResolvedLocality(loc);
                      const lat = matchedByPin?.lat ?? pinInfo?.lat;
                      const lng = matchedByPin?.lng ?? pinInfo?.lng;
                      if (lat && lng) {
                        setMapLat(lat);
                        setMapLng(lng);
                        setLatitude(lat);
                        setLongitude(lng);
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (pincodeInput.trim()) {
                        const cleanDigits = pincodeInput.replace(/\D/g, "");
                        handleSelectAreaOrPin(pincodeInput, selectedAreaInfo, cleanDigits.length === 6);
                      }
                    }
                  }}
                  className={styles.pincodeInput}
                />
              </div>
              <button
                type="button"
                className={styles.applyBtn}
                disabled={!pincodeInput.trim() || isSearchingLocation}
                onClick={() => {
                  const cleanDigits = pincodeInput.replace(/\D/g, "");
                  handleSelectAreaOrPin(pincodeInput, selectedAreaInfo, cleanDigits.length === 6);
                }}
              >
                {isSearchingLocation ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : pincodeInput.replace(/\D/g, "").length === 6 ? (
                  "Apply"
                ) : (
                  "Search"
                )}
              </button>
            </div>

            {/* Quick Area Chips */}
            <div className={styles.chipsRow}>
              {POPULAR_AREAS.map((area) => {
                const isActive =
                  selectedAreaInfo?.pincode === area.pincode ||
                  pincodeInput === area.pincode ||
                  (pincodeInput.length >= 3 && area.name.toLowerCase().includes(pincodeInput.toLowerCase().trim()));
                return (
                  <button
                    key={area.pincode}
                    type="button"
                    className={`${styles.chipBtn} ${isActive ? styles.chipBtnActive : ""}`}
                    onClick={() => {
                      handleSelectAreaOrPin(area.pincode, area, false);
                    }}
                  >
                    <MapPin size={12} />
                    <span>{area.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Doorstep Map Pin Picker Section */}
          <div className={styles.mapPinSection}>
            <div className={styles.mapPinHeader}>
              <h4 className={styles.mapPinTitle}>
                <MapPin size={16} color="#FF6B00" />
                <span>Exact Delivery Pinpoint (Doorstep)</span>
              </h4>
              <p className={styles.mapPinSub}>
                Drag the map pin to your exact delivery doorstep for accurate kitchen distance filtering & delivery routing.
              </p>
            </div>

            <HouseMapPicker
              latitude={mapLat}
              longitude={mapLng}
              height="200px"
              onChange={(newLat, newLng, details) => {
                setMapLat(newLat);
                setMapLng(newLng);
                setLatitude(newLat);
                setLongitude(newLng);
                if (details?.pincode) {
                  const p = details.pincode.replace(/\D/g, "").slice(0, 6);
                  if (p.length === 6) {
                    setResolvedPincode(p);
                    setPincodeInput(p);
                  }
                }
                const street = details?.street;
                const suburb = (details as any)?.suburb;
                const locality = (details as any)?.locality || (details as any)?.city;
                const loc = street || suburb || locality || "";
                if (loc) setResolvedLocality(loc);
              }}
            />

            <div className={styles.mapPinInfoCard}>
              <div className={styles.mapPinInfoRow}>
                <span className={styles.mapPinInfoLabel}>Location:</span>
                <span className={styles.mapPinInfoVal}>{resolvedLocality || "Pune Area"}</span>
              </div>
              <div className={styles.mapPinInfoRow}>
                <span className={styles.mapPinInfoLabel}>PIN Code:</span>
                <span className={styles.mapPinInfoVal}>{resolvedPincode || pincodeInput || "411051"}</span>
              </div>
              <div className={styles.mapPinInfoRow}>
                <span className={styles.mapPinInfoLabel}>GPS Coordinates:</span>
                <span className={styles.mapPinInfoVal}>
                  {mapLat.toFixed(4)}, {mapLng.toFixed(4)}
                </span>
              </div>
            </div>

            <button
              type="button"
              className={styles.confirmPinBtn}
              disabled={isApplying}
              onClick={handleConfirmPinnedLocation}
            >
              {isApplying ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Setting Delivery Location...</span>
                </>
              ) : (
                <>
                  <Check size={18} strokeWidth={3} />
                  <span>Confirm & Set Delivery Location</span>
                </>
              )}
            </button>
          </div>

          <div className={styles.divider} />

          {/* 3. Saved Addresses Section (For Authenticated Users) */}
          {session?.user ? (
            <div className={styles.savedSection}>
              <div className={styles.savedHeaderRow}>
                <span className={styles.sectionLabel}>Saved Delivery Addresses</span>
                {!showAddForm && (
                  <button
                    type="button"
                    className={styles.addAddressLinkBtn}
                    onClick={() => {
                      if (savedAddresses && savedAddresses.length >= 5) {
                        showNotification("error", "You can add a maximum of 5 delivery addresses. Please delete an existing address first.");
                        return;
                      }
                      setShowAddForm(true);
                    }}
                    title={savedAddresses && savedAddresses.length >= 5 ? "Maximum 5 addresses reached" : "Add Address"}
                  >
                    <Plus size={14} strokeWidth={3} />
                    <span>Add Address ({savedAddresses?.length || 0}/5)</span>
                  </button>
                )}
              </div>

              {/* Add New Address Collapsible Form */}
              {showAddForm ? (
                <form onSubmit={handleSaveNewAddress} className={styles.addFormCard}>
                  <h4 className={styles.formTitle}>Add New Delivery Address</h4>

                  {/* Type Selector */}
                  <div className={styles.typeBtnGroup}>
                    {(["Home", "Work", "Other"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`${styles.formTypeBtn} ${
                          addressType === t ? styles.formTypeBtnActive : ""
                        }`}
                        onClick={() => setAddressType(t)}
                      >
                        {t === "Home" && <Home size={14} />}
                        {t === "Work" && <Briefcase size={14} />}
                        {t === "Other" && <Navigation size={14} />}
                        <span>{t}</span>
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="House / Flat / Floor / Building *"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    className={styles.formField}
                  />

                  <input
                    type="text"
                    required
                    placeholder="Street / Area / Locality *"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className={styles.formField}
                  />

                  <div className={styles.formRow}>
                    <input
                      type="text"
                      placeholder="Landmark (Optional)"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      className={styles.formField}
                    />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="6-digit Pincode *"
                      value={formPincode}
                      onChange={(e) =>
                        setFormPincode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      className={styles.formField}
                    />
                  </div>

                  {/* Map Pin Picker */}
                  <div style={{ marginTop: "4px" }}>
                    <HouseMapPicker
                      latitude={latitude}
                      longitude={longitude}
                      onChange={(newLat, newLng, details) => {
                        setLatitude(newLat);
                        setLongitude(newLng);
                        if (details?.pincode && !formPincode) {
                          setFormPincode(details.pincode.replace(/\D/g, "").slice(0, 6));
                        }
                        if (details?.street && !street) {
                          setStreet(details.street);
                        }
                        if (details?.landmark && !landmark) {
                          setLandmark(details.landmark);
                        }
                        if (details?.houseNumber && !houseNumber) {
                          setHouseNumber(details.houseNumber);
                        }
                      }}
                    />
                  </div>

                  <div className={styles.formActions}>
                    <button
                      type="button"
                      className={styles.cancelFormBtn}
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" disabled={isSaving} className={styles.saveFormBtn}>
                      {isSaving ? "Saving..." : "Save & Set Default"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className={styles.addressesList}>
                  {savedAddresses && savedAddresses.length > 0 ? (
                    [...savedAddresses]
                      .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0))
                      .map((addr) => {
                        const isActive =
                          defaultAddress?.id === addr.id ||
                          (defaultAddress?.pincode === addr.pincode && addr.isDefault);
                        const isHome = (addr.type || "").toUpperCase().includes("HOME");
                        const isWork = (addr.type || "").toUpperCase().includes("WORK");

                        return (
                          <div
                            key={addr.id}
                            className={`${styles.addressCard} ${
                              isActive ? styles.addressCardActive : ""
                            }`}
                            onClick={() => handleSelectSavedAddress(addr.id)}
                            role="button"
                            tabIndex={0}
                          >
                            <div className={styles.radioIndicator}>
                              {isActive && <Check size={12} color="#FFFFFF" strokeWidth={3.5} />}
                            </div>

                            <div className={styles.addressCardContent}>
                              <div className={styles.tagRow}>
                                <span
                                  className={`${styles.typeBadge} ${
                                    isHome
                                      ? styles.typeHome
                                      : isWork
                                      ? styles.typeWork
                                      : styles.typeOther
                                  }`}
                                >
                                  {addr.type}
                                </span>
                                {addr.isDefault && (
                                  <span className={styles.defaultBadge}>DEFAULT</span>
                                )}
                              </div>

                              <p className={styles.addressMainText}>
                                {addr.houseNumber}, {addr.street}
                              </p>
                              <p className={styles.addressSubText}>
                                {addr.landmark ? `Near ${addr.landmark}, ` : ""}PIN: {addr.pincode}
                              </p>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div
                      style={{
                        padding: "16px",
                        textAlign: "center",
                        backgroundColor: "#F8FAFC",
                        borderRadius: "14px",
                        border: "1px dashed #CBD5E1",
                      }}
                    >
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748B" }}>
                        No addresses saved yet. Click <strong>&quot;+ Add Address&quot;</strong> to add your home or office.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Guest Sign In Banner */
            <div className={styles.guestBanner}>
              <p className={styles.guestText}>
                Sign in to save and easily switch between home & office delivery addresses.
              </p>
              <Link
                href="/login?callbackUrl=/"
                className={styles.signInLink}
                onClick={closeLocationModal}
              >
                Sign In →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
