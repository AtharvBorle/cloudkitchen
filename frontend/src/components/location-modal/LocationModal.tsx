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
import { getPincodeCoordinates } from "@/lib/geo-distance";
import styles from "./LocationModal.module.css";

const POPULAR_AREAS = [
  { pincode: "411038", name: "Kothrud, Pune", lat: 18.5074, lng: 73.8077 },
  { pincode: "411045", name: "Baner, Pune", lat: 18.5590, lng: 73.7868 },
  { pincode: "411007", name: "Aundh, Pune", lat: 18.5580, lng: 73.8075 },
  { pincode: "411057", name: "Hinjawadi, Pune", lat: 18.5913, lng: 73.7389 },
  { pincode: "411004", name: "Deccan, Pune", lat: 18.5173, lng: 73.8415 },
  { pincode: "411014", name: "Viman Nagar, Pune", lat: 18.5679, lng: 73.9143 },
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

  const isStaffOrSeller = Boolean(
    session?.user?.role && session.user.role !== "USER"
  );

  const isNonCustomerRoute = Boolean(
    !pathname ||
      pathname.startsWith("/seller") ||
      pathname.startsWith("/seller-onboarding") ||
      pathname.startsWith("/dashboard/seller") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/dashboard/admin") ||
      pathname.startsWith("/superadmin") ||
      pathname.startsWith("/dashboard/superadmin") ||
      pathname.startsWith("/dashboard/support") ||
      pathname.startsWith("/support") ||
      pathname.startsWith("/dashboard/delivery") ||
      pathname.startsWith("/delivery") ||
      pathname.startsWith("/auth") ||
      pathname.startsWith("/invoice") ||
      pathname === "/login" ||
      pathname === "/signup"
  );

  const [pincodeInput, setPincodeInput] = useState("");
  const [selectedAreaInfo, setSelectedAreaInfo] = useState<{
    pincode: string;
    name: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
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
    if (isLocationModalOpen && !isStaffOrSeller && !isNonCustomerRoute) {
      const pin =
        defaultAddress?.pincode ||
        (typeof window !== "undefined"
          ? localStorage.getItem("active-selected-pincode") || localStorage.getItem("guest-pincode") || ""
          : "");
      setPincodeInput(pin);
      const matched = POPULAR_AREAS.find((a) => a.pincode === pin) || null;
      setSelectedAreaInfo(matched);
      setShowAddForm(false);
      setFeedback(null);
      setIsApplying(false);
    }
  }, [isLocationModalOpen, defaultAddress, isStaffOrSeller, isNonCustomerRoute]);

  if (!isLocationModalOpen || isStaffOrSeller || isNonCustomerRoute) return null;

  const showNotification = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  // 1. Handle Manual Pincode / Area Submission (Instant, Smooth, Optimistic)
  const handleApplyLocation = (
    targetInput: string,
    areaOverride?: { pincode: string; name: string; lat: number; lng: number } | null
  ) => {
    const raw = (targetInput || "").trim();
    if (!raw && !areaOverride) {
      showNotification("error", "Please enter a 6-digit pincode or select an area");
      return;
    }

    setIsApplying(true);

    let cleanPin = "";
    let localityName = "";
    let city = "Pune";
    let finalLat: number | null = null;
    let finalLng: number | null = null;

    if (areaOverride && (areaOverride.pincode === raw || raw.toLowerCase().includes(areaOverride.name.toLowerCase().split(",")[0].trim()))) {
      cleanPin = areaOverride.pincode;
      localityName = areaOverride.name;
      finalLat = areaOverride.lat;
      finalLng = areaOverride.lng;
    } else {
      const pinMatch = raw.match(/\b\d{6}\b/);
      if (pinMatch) {
        cleanPin = pinMatch[0];
        const matched = POPULAR_AREAS.find((a) => a.pincode === cleanPin);
        const pinInfo = getPincodeCoordinates(cleanPin);
        localityName = matched?.name || pinInfo?.locality || `PIN ${cleanPin}`;
        city = pinInfo?.city || "Pune";
        finalLat = (matched?.lat != null) ? matched.lat : (pinInfo?.lat ?? null);
        finalLng = (matched?.lng != null) ? matched.lng : (pinInfo?.lng ?? null);
      } else {
        // Match by Area Name (e.g., "Kothrud", "Baner", "Hinjawadi", "Deccan", "Viman Nagar")
        const lower = raw.toLowerCase();
        const matched = POPULAR_AREAS.find(
          (a) =>
            a.name.toLowerCase().includes(lower) ||
            lower.includes(a.name.toLowerCase().split(",")[0].trim())
        );
        if (matched) {
          cleanPin = matched.pincode;
          localityName = matched.name;
          city = "Pune";
          finalLat = matched.lat;
          finalLng = matched.lng;
        } else {
          showNotification("error", "Please enter a valid 6-digit pincode (e.g. 411038) or choose a Pune area below");
          setIsApplying(false);
          return;
        }
      }
    }

    // 1. Optimistically set location immediately (0ms delay for seamless response)
    setGuestLocation(cleanPin, localityName, city, finalLat, finalLng);
    showNotification("success", `Location updated to ${localityName || `PIN ${cleanPin}`}`);

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
    }, 180);
  };

  // 2. Handle GPS Auto Detection
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      showNotification("error", "Geolocation is not supported by your browser");
      return;
    }

    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          // Reverse geocode via OpenStreetMap Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const pin = (addr.postcode || "").replace(/\D/g, "").slice(0, 6);
            const locality =
              addr.suburb ||
              addr.neighbourhood ||
              addr.residential ||
              addr.city_district ||
              addr.road ||
              addr.town ||
              addr.city ||
              "Current Location";
            const city = addr.city || addr.town || addr.state_district || addr.state || "Pune";

            if (pin && pin.length === 6) {
              setGuestLocation(pin, locality, city, lat, lng);
              if (session?.user) {
                await fetchApi("/api/user/location", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ pincode: pin, lat, lng }),
                }).catch(() => {});
                await refreshAddress();
              }

              showNotification("success", `GPS Location Detected: ${locality} (${pin})`);
              setTimeout(() => closeLocationModal(), 800);
            } else {
              showNotification("error", "Could not detect a 6-digit postal pincode for your GPS coordinates. Please enter your pincode below.");
            }
          } else {
            showNotification("error", "Failed to retrieve address from GPS. Please enter your pincode manually.");
          }
        } catch (err) {
          console.error("GPS Reverse Geocode Error:", err);
          showNotification("error", "Error connecting to location service. Please enter pincode manually.");
        } finally {
          setIsLocatingGps(false);
        }
      },
      (error) => {
        setIsLocatingGps(false);
        console.warn("Geolocation permission error:", error);
        showNotification("error", "Location permission denied. Please enter pincode manually.");
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

    const normHouse = houseNumber.trim().toLowerCase();
    const normStreet = street.trim().toLowerCase();
    const normPin = cleanPin;

    const isDuplicate = savedAddresses?.some((addr) => {
      return (
        (addr.houseNumber || "").trim().toLowerCase() === normHouse &&
        (addr.street || "").trim().toLowerCase() === normStreet &&
        (addr.pincode || "").replace(/\D/g, "") === normPin
      );
    });

    if (isDuplicate) {
      showNotification("error", "This address already exists in your saved addresses.");
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

  return (
    <div className={styles.modalBackdrop} onClick={closeLocationModal}>
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
            onClick={closeLocationModal}
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
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (pincodeInput.trim()) {
                        handleApplyLocation(pincodeInput, selectedAreaInfo);
                      }
                    }
                  }}
                  className={styles.pincodeInput}
                />
              </div>
              <button
                type="button"
                className={styles.applyBtn}
                disabled={!pincodeInput.trim() || isApplying}
                onClick={() => handleApplyLocation(pincodeInput, selectedAreaInfo)}
              >
                {isApplying ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  "Apply"
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
                      setPincodeInput(area.pincode);
                      setSelectedAreaInfo(area);
                    }}
                  >
                    <MapPin size={12} />
                    <span>{area.name}</span>
                  </button>
                );
              })}
            </div>
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
                    savedAddresses.map((addr) => {
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
