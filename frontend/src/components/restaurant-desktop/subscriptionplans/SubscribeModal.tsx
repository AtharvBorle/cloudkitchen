"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  CheckCircle2, 
  Loader2, 
  Utensils, 
  MapPin, 
  Phone, 
  Calendar,
  Navigation,
  Home,
  Briefcase,
  Search,
  Check
} from "lucide-react";
import { 
  loadRazorpayScript,
  initiateMealSubscriptionPayment,
  verifyAndActivateMealSubscription,
} from "@/lib/meal-subscriptions";
import { fetchApi } from "@/lib/fetch-api";
import { useLocation } from "@/components/location-provider";
import styles from "./SubscribeModal.module.css";

export const PUNE_LOCALITY_SUGGESTIONS = [
  { name: "Kothrud, Pune", pincode: "411038" },
  { name: "Baner, Pune", pincode: "411045" },
  { name: "Aundh, Pune", pincode: "411007" },
  { name: "Hinjawadi, Pune", pincode: "411057" },
  { name: "Deccan Gymkhana, Pune", pincode: "411004" },
  { name: "Viman Nagar, Pune", pincode: "411014" },
  { name: "Kalyani Nagar, Pune", pincode: "411006" },
  { name: "Shivajinagar, Pune", pincode: "411005" },
  { name: "Wakad, Pune", pincode: "411057" },
  { name: "Koregaon Park, Pune", pincode: "411001" },
  { name: "Magarpatta City, Hadapsar, Pune", pincode: "411028" },
  { name: "Pimple Saudagar, Pune", pincode: "411027" },
  { name: "Senapati Bapat Road, Pune", pincode: "411016" },
  { name: "Swargate / Dattawadi, Pune", pincode: "411030" },
  { name: "Karve Nagar, Pune", pincode: "411052" },
  { name: "Bavdhan, Pune", pincode: "411021" },
];

export interface SubscribeModalPlan {
  id: string;
  name: string;
  tier?: string;
  price?: number | string;
  weeklyPrice?: number | string;
  monthlyPrice?: number | string;
  duration?: string;
  period?: string;
  description?: string;
  features?: string[];
  mealTimings?: string[];
  sellerName?: string;
}

export interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SubscribeModalPlan | null;
  onSubscribed?: (newSubscription: any) => void;
}

export const SubscribeModal: React.FC<SubscribeModalProps> = ({
  isOpen,
  onClose,
  plan,
  onSubscribed,
}) => {
  const { defaultAddress } = useLocation();
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Address intelligence & selection states
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Initialize and load saved addresses
  useEffect(() => {
    if (!isOpen) return;

    // Prefill default address if empty
    if (!deliveryAddress) {
      if (defaultAddress?.address || defaultAddress?.label) {
        setDeliveryAddress(defaultAddress.address || defaultAddress.label || "");
      } else if (typeof window !== "undefined") {
        const cached = localStorage.getItem("active-selected-address") || "";
        if (cached) setDeliveryAddress(cached);
      }
    }

    // Fetch user's saved addresses
    async function loadAddresses() {
      try {
        const res = await fetchApi("/api/user/addresses");
        if (res.ok) {
          const data = await res.json();
          const list = data.data?.addresses || data.addresses || data.data || [];
          if (Array.isArray(list)) {
            setSavedAddresses(list);
          }
        }
      } catch (err) {
        // Fallback gracefully
      }
    }
    loadAddresses();
  }, [isOpen, defaultAddress]);

  // Click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen || !plan) return null;

  const planDuration = plan.duration || "1 Week";
  const planPriceNum = typeof plan.price === "number"
    ? plan.price
    : typeof plan.weeklyPrice === "number"
    ? plan.weeklyPrice
    : parseFloat(String(plan.price || plan.weeklyPrice || "0").replace(/[^\d.]/g, "")) || 499;

  // Handle GPS location detection
  const handleDetectGpsLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    setIsDetectingGps(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsDetectingGps(false);
        const { latitude, longitude } = position.coords;
        // Find closest Pune hub or set GPS label
        const formatted = `Current Location (Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}), Pune`;
        setDeliveryAddress(formatted);
        setShowSuggestions(false);
      },
      (err) => {
        setIsDetectingGps(false);
        // Fallback to active/default Pune address
        const fallback = defaultAddress?.address || "Kothrud, Pune - 411038";
        setDeliveryAddress(fallback);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleSelectSavedAddress = (addr: any) => {
    const parts = [addr.houseNumber, addr.street, addr.landmark, addr.city || "Pune", addr.pincode].filter(Boolean);
    const line = parts.join(", ");
    setDeliveryAddress(line || addr.address || addr.label || "");
    if (addr.recipientPhone && !contactPhone) {
      setContactPhone(addr.recipientPhone);
    }
    setShowSuggestions(false);
  };

  const handleSelectLocality = (loc: { name: string; pincode: string }) => {
    // Preserve flat/room prefix if user started typing it
    const trimmed = deliveryAddress.trim();
    if (trimmed && !trimmed.toLowerCase().includes(loc.name.toLowerCase().split(",")[0])) {
      setDeliveryAddress(`${trimmed}, ${loc.name} - ${loc.pincode}`);
    } else {
      setDeliveryAddress(`${loc.name} - ${loc.pincode}`);
    }
    setShowSuggestions(false);
  };

  // Filter locality suggestions based on user query
  const filteredLocalities = PUNE_LOCALITY_SUGGESTIONS.filter((loc) => {
    if (!deliveryAddress.trim()) return true;
    const q = deliveryAddress.toLowerCase();
    return loc.name.toLowerCase().includes(q) || loc.pincode.includes(q);
  });

  const handleConfirm = async () => {
    if (!deliveryAddress.trim()) {
      setErrorMsg("Please enter your delivery address or room number.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Initiate online payment order on the backend
      const initData = await initiateMealSubscriptionPayment(plan.id, planDuration);

      // 2. Load Razorpay Checkout SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setErrorMsg("Failed to load Razorpay payment SDK. Please check your internet connection.");
        setIsSubmitting(false);
        return;
      }

      // 3. Open Razorpay Checkout Modal
      const options = {
        key: initData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TX4MPQgJuetMFP",
        amount: initData.amount,
        currency: initData.currency || "INR",
        name: "Neo Cloud Kitchen",
        description: `Meal Plan: ${plan.name} (${initData.subscriptionCycle || planDuration})`,
        order_id: initData.razorpayOrderId,
        handler: async function (response: any) {
          try {
            setIsSubmitting(true);
            const verified = await verifyAndActivateMealSubscription({
              planId: plan.id,
              cycle: initData.subscriptionCycle || planDuration,
              deliveryAddress: deliveryAddress.trim(),
              contactPhone: contactPhone.trim(),
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (onSubscribed) {
              onSubscribed(verified.subscription);
            }
            onClose();
          } catch (vErr: any) {
            console.error("Verification error:", vErr);
            setErrorMsg(vErr.message || "Payment verification failed. Please contact support.");
            setIsSubmitting(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
            setErrorMsg("Payment was cancelled. Subscription was not activated.");
          },
        },
        prefill: {
          contact: contactPhone.trim(),
        },
        theme: {
          color: "#FF6B00",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setIsSubmitting(false);
        setErrorMsg("Payment failed: " + (response.error?.description || "Transaction declined. Subscription was not activated."));
      });
      rzp.open();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to initiate subscription payment. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.iconCircle}>
              <Utensils size={24} />
            </div>
            <div className={styles.headerTitles}>
              <h3 className={styles.modalTitle}>Subscribe to Meal Plan</h3>
              <p className={styles.modalSubtitle}>{plan.sellerName || "Cloud Kitchen"}</p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {errorMsg && (
            <div style={{ backgroundColor: "#FEF2F2", color: "#DC2626", padding: "10px 14px", borderRadius: "10px", fontSize: "0.875rem" }}>
              {errorMsg}
            </div>
          )}

          {/* Plan overview */}
          <div className={styles.planOverviewCard}>
            <div className={styles.planCardTop}>
              <span className={styles.planName}>{plan.name}</span>
              <span className={`${styles.tierBadge} ${
                plan.tier?.toLowerCase() === "gold"
                  ? styles.tierGold
                  : plan.tier?.toLowerCase() === "silver"
                  ? styles.tierSilver
                  : styles.tierBronze
              }`}>
                {plan.tier || "Bronze"}
              </span>
            </div>
            {plan.description && (
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748B" }}>
                {plan.description}
              </p>
            )}
          </div>

          {/* Plan Duration & Billing Summary */}
          <div className={styles.planDurationBox}>
            <div className={styles.planDurationLabel}>
              <span className={styles.planDurationTitle}>Plan Validity &amp; Duration</span>
              <span className={styles.planDurationSubtitle}>Billed once for <strong>{planDuration}</strong></span>
            </div>
            <span className={styles.planDurationPrice}>₹{planPriceNum.toFixed(0)}</span>
          </div>

          {/* Delivery Address with Map Pin, GPS detection & Suggestions */}
          <div className={styles.formGroup} ref={suggestionsRef}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
              <label className={styles.formLabel}>
                <MapPin size={14} color="#EA580C" />
                <span>Delivery Address / Room Number *</span>
              </label>
              <button
                type="button"
                onClick={handleDetectGpsLocation}
                disabled={isDetectingGps}
                className={styles.gpsDetectBtn}
                title="Detect current location via GPS"
              >
                {isDetectingGps ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Navigation size={12} />
                )}
                <span>{isDetectingGps ? "Locating..." : "Use Current GPS"}</span>
              </button>
            </div>

            {/* Saved address quick chips */}
            {savedAddresses.length > 0 && (
              <div className={styles.addressChipsContainer}>
                <span className={styles.chipLabel}>Saved:</span>
                {savedAddresses.slice(0, 3).map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    className={styles.addressChip}
                    onClick={() => handleSelectSavedAddress(addr)}
                  >
                    {addr.type?.toLowerCase() === "work" ? (
                      <Briefcase size={12} />
                    ) : (
                      <Home size={12} />
                    )}
                    <span>{addr.type || "Home"}</span>
                  </button>
                ))}
              </div>
            )}

            <div style={{ position: "relative" }}>
              <input
                type="text"
                className={styles.formInput}
                placeholder="Type street, room number, or select area suggestion below..."
                value={deliveryAddress}
                onChange={(e) => {
                  setDeliveryAddress(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
              />
              <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8", pointerEvents: "none" }}>
                <MapPin size={16} />
              </div>

              {/* Suggestions dropdown */}
              {showSuggestions && filteredLocalities.length > 0 && (
                <div className={styles.suggestionsDropdown}>
                  <div className={styles.suggestionsHeader}>
                    <Search size={12} />
                    <span>Suggested Delivery Hubs &amp; Localities in Pune</span>
                  </div>
                  <div className={styles.suggestionsList}>
                    {filteredLocalities.slice(0, 6).map((loc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={styles.suggestionItem}
                        onClick={() => handleSelectLocality(loc)}
                      >
                        <MapPin size={14} className={styles.suggestionPin} />
                        <div className={styles.suggestionText}>
                          <span className={styles.suggestionName}>{loc.name}</span>
                          <span className={styles.suggestionPinCode}>PIN: {loc.pincode}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <Phone size={14} color="#EA580C" />
              <span>Contact Phone</span>
            </label>
            <input
              type="tel"
              className={styles.formInput}
              placeholder="Your contact number for daily meal delivery"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>

          {/* Included Features */}
          {plan.features && plan.features.length > 0 && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Plan Highlights</label>
              <ul className={styles.featuresList}>
                {plan.features.slice(0, 4).map((f, i) => (
                  <li key={i} className={styles.featureItem}>
                    <CheckCircle2 size={16} color="#16A34A" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button type="button" className={styles.btnCancel} onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.btnSubscribe}
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                <span>Processing...</span>
              </>
            ) : (
              <span>Confirm & Subscribe (₹{planPriceNum.toFixed(0)})</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscribeModal;
