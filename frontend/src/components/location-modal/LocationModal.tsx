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
import { HouseMapPicker } from "@/components/house-map-picker";
import styles from "./LocationModal.module.css";

const POPULAR_AREAS = [
  { pincode: "411038", name: "Kothrud, Pune" },
  { pincode: "411045", name: "Baner, Pune" },
  { pincode: "411007", name: "Aundh, Pune" },
  { pincode: "411057", name: "Hinjawadi, Pune" },
  { pincode: "411004", name: "Deccan, Pune" },
  { pincode: "411014", name: "Viman Nagar, Pune" },
];

export const LocationModal: React.FC = () => {
  const { data: session } = useSession();
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
  const [isLocatingGps, setIsLocatingGps] = useState(false);
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
      setPincodeInput(defaultAddress?.pincode || "");
      setShowAddForm(false);
      setFeedback(null);
    }
  }, [isLocationModalOpen, defaultAddress]);

  if (!isLocationModalOpen) return null;

  const showNotification = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  // 1. Handle Manual Pincode Submission
  const handleApplyPincode = async (targetPin: string, localityName?: string) => {
    const cleanPin = targetPin.replace(/\D/g, "").slice(0, 6);
    if (cleanPin.length !== 6) {
      showNotification("error", "Please enter a valid 6-digit Indian Pincode");
      return;
    }

    try {
      if (session?.user) {
        const res = await fetchApi("/api/user/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pincode: cleanPin }),
        });
        if (res.ok) {
          await refreshAddress();
          showNotification("success", `Location updated to PIN ${cleanPin}`);
          setTimeout(() => closeLocationModal(), 700);
          return;
        }
      }

      // Guest / Fallback
      setGuestLocation(cleanPin, localityName || `PIN ${cleanPin}`, "Pune");
      showNotification("success", `Delivery location set to PIN ${cleanPin}`);
      setTimeout(() => closeLocationModal(), 700);
    } catch (err: any) {
      showNotification("error", err?.message || "Failed to update location");
    }
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
            const pin = (addr.postcode || "").replace(/\D/g, "").slice(0, 6) || "411038";
            const locality = addr.suburb || addr.neighbourhood || addr.city_district || addr.road || "Current Location";
            const city = addr.city || addr.town || addr.state_district || "Pune";

            if (session?.user) {
              await fetchApi("/api/user/location", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pincode: pin, lat, lng }),
              });
              await refreshAddress();
            } else {
              setGuestLocation(pin, locality, city);
            }

            showNotification("success", `GPS Location Detected: ${locality} (${pin})`);
            setTimeout(() => closeLocationModal(), 800);
          } else {
            handleApplyPincode("411038", "Kothrud, Pune");
          }
        } catch (err) {
          console.error("GPS Reverse Geocode Error:", err);
          handleApplyPincode("411038", "Kothrud, Pune");
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

          {/* 2. Manual Pincode Search */}
          <div className={styles.searchSection}>
            <span className={styles.sectionLabel}>Search by Pincode or Area</span>
            <div className={styles.pincodeInputRow}>
              <div className={styles.pincodeInputWrapper}>
                <Search size={18} className={styles.pincodeIcon} />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit Pincode (e.g. 411038)"
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyPincode(pincodeInput);
                    }
                  }}
                  className={styles.pincodeInput}
                />
              </div>
              <button
                type="button"
                className={styles.applyBtn}
                disabled={pincodeInput.length !== 6}
                onClick={() => handleApplyPincode(pincodeInput)}
              >
                Apply
              </button>
            </div>

            {/* Quick Area Chips */}
            <div className={styles.chipsRow}>
              {POPULAR_AREAS.map((area) => {
                const isActive = defaultAddress?.pincode === area.pincode;
                return (
                  <button
                    key={area.pincode}
                    type="button"
                    className={`${styles.chipBtn} ${isActive ? styles.chipBtnActive : ""}`}
                    onClick={() => {
                      setPincodeInput(area.pincode);
                      handleApplyPincode(area.pincode, area.name);
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
                    onClick={() => setShowAddForm(true)}
                  >
                    <Plus size={14} strokeWidth={3} />
                    <span>Add Address</span>
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
