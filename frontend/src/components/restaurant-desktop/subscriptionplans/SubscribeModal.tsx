"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
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
  const { data: session } = useSession();
  const { defaultAddress } = useLocation();
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [startDatePreference, setStartDatePreference] = useState("Tomorrow");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Address intelligence & selection states
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string | null>(null);
  const [isChangingAddress, setIsChangingAddress] = useState<boolean>(false);
  const [isEditingPhone, setIsEditingPhone] = useState<boolean>(false);
  const [showManualAddressInput, setShowManualAddressInput] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Initialize and load saved addresses
  useEffect(() => {
    if (!isOpen) return;

    setIsChangingAddress(false);
    setIsEditingPhone(false);
    setShowManualAddressInput(false);
    setErrorMsg(null);

    if ((session?.user as any)?.phone) {
      setContactPhone((session.user as any).phone);
    }

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
          if (Array.isArray(list) && list.length > 0) {
            setSavedAddresses(list);

            const defaultSaved = list.find((a: any) => a.isDefault) || list.find((a: any) => (a.type || "").toLowerCase() === "home") || list[0];
            if (defaultSaved) {
              setSelectedSavedAddressId(defaultSaved.id);
              const parts = [
                defaultSaved.houseNumber,
                defaultSaved.street,
                defaultSaved.landmark ? `Near ${defaultSaved.landmark}` : null,
                defaultSaved.city || "Pune",
                defaultSaved.pincode,
              ].filter(Boolean);
              const line = parts.join(", ");
              setDeliveryAddress(line || defaultSaved.address || defaultSaved.label || "");
              if (defaultSaved.recipientPhone && !(session?.user as any)?.phone) {
                setContactPhone(defaultSaved.recipientPhone);
              }
            }
          }
        }
      } catch (err) {
        // Fallback gracefully
      }
    }
    loadAddresses();
  }, [isOpen, defaultAddress, session]);

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

  // Handle GPS location detection with Nominatim reverse geocoding
  const handleDetectGpsLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    setIsDetectingGps(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const road = addr.road || addr.street || addr.neighbourhood || addr.suburb || addr.residential || "";
            const suburb = addr.suburb || addr.neighbourhood || addr.city_district || "";
            const city = addr.city || addr.town || addr.municipality || "Pune";
            const pincode = (addr.postcode || "").replace(/\D/g, "").slice(0, 6) || "411038";

            const parts = [road, suburb && suburb !== road ? suburb : "", city, `Maharashtra - ${pincode}`].filter(Boolean);
            const fullAddr = parts.join(", ") || data.display_name?.split(",").slice(0, 3).join(",") || "Kothrud, Pune - 411038";
            setDeliveryAddress(fullAddr);
            setSelectedSavedAddressId(null);
            setIsChangingAddress(false);
            setShowSuggestions(false);
          } else {
            setDeliveryAddress(defaultAddress?.address || "Kothrud, Pune - 411038");
            setIsChangingAddress(false);
          }
        } catch (e) {
          setDeliveryAddress(defaultAddress?.address || "Kothrud, Pune - 411038");
          setIsChangingAddress(false);
        } finally {
          setIsDetectingGps(false);
        }
      },
      () => {
        setIsDetectingGps(false);
        const fallback = defaultAddress?.address || "Kothrud, Pune - 411038";
        setDeliveryAddress(fallback);
        setIsChangingAddress(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleSelectSavedAddress = (addr: any) => {
    const parts = [
      addr.houseNumber,
      addr.street,
      addr.landmark ? `Near ${addr.landmark}` : null,
      addr.city || "Pune",
      addr.pincode,
    ].filter(Boolean);
    const line = parts.join(", ");
    setDeliveryAddress(line || addr.address || addr.label || "");
    setSelectedSavedAddressId(addr.id);
    setIsChangingAddress(false);
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
    const trimmedAddress = deliveryAddress.trim();
    if (!trimmedAddress) {
      setErrorMsg("Please enter your delivery address or room number.");
      return;
    }
    if (trimmedAddress.length < 5) {
      setErrorMsg("Delivery address must be at least 5 characters long.");
      return;
    }
    if (trimmedAddress.length > 120) {
      setErrorMsg("Delivery address cannot exceed 120 characters.");
      return;
    }

    const cleanPhone = contactPhone.replace(/\D/g, "");
    if (!cleanPhone) {
      setErrorMsg("Please enter your 10-digit contact phone number.");
      return;
    }
    if (cleanPhone.length !== 10) {
      setErrorMsg("Contact phone number must be exactly 10 digits.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setErrorMsg("Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.");
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
              startDatePreference: startDatePreference,
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

          {/* Delivery Address */}
          <div className={styles.formGroup} ref={suggestionsRef}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
              <label className={styles.formLabel}>
                <MapPin size={14} color="#EA580C" />
                <span>Delivery Address *</span>
              </label>
            </div>

            {!isChangingAddress && deliveryAddress ? (
              /* Selected Address Display Card */
              <div className={styles.selectedAddressCard}>
                <div className={styles.addressCardHeader}>
                  <div className={styles.addressCardType}>
                    {(() => {
                      const selected = savedAddresses.find((a) => a.id === selectedSavedAddressId);
                      const type = (selected?.type || "Home").toLowerCase();
                      return type === "work" ? <Briefcase size={14} color="#EA580C" /> : <Home size={14} color="#EA580C" />;
                    })()}
                    <span>
                      {(() => {
                        const selected = savedAddresses.find((a) => a.id === selectedSavedAddressId);
                        return selected?.type || "Delivery Address";
                      })()}
                    </span>
                    {savedAddresses.find((a) => a.id === selectedSavedAddressId)?.isDefault && (
                      <span className={styles.defaultBadge}>Default</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsChangingAddress(true)}
                    className={styles.changeAddressBtn}
                  >
                    Change Address
                  </button>
                </div>
                <div className={styles.addressCardDetails}>
                  {deliveryAddress}
                </div>
              </div>
            ) : (
              /* Address Picker / Selection Mode */
              <div className={styles.addressPickerContainer}>
                <div className={styles.addressPickerHeader}>
                  <span className={styles.addressPickerTitle}>Choose Saved Delivery Address</span>
                  {deliveryAddress && (
                    <button
                      type="button"
                      onClick={() => setIsChangingAddress(false)}
                      className={styles.addressPickerCloseBtn}
                    >
                      Keep Current
                    </button>
                  )}
                </div>

                {savedAddresses.length > 0 && (
                  <div className={styles.savedAddressesList}>
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedSavedAddressId === addr.id;
                      return (
                        <button
                          key={addr.id}
                          type="button"
                          className={`${styles.savedAddressItem} ${isSelected ? styles.savedAddressItemSelected : ""}`}
                          onClick={() => handleSelectSavedAddress(addr)}
                        >
                          <div className={styles.savedAddressRadio}>
                            {isSelected ? (
                              <CheckCircle2 size={16} color="#EA580C" />
                            ) : (
                              <div style={{ width: 14, height: 14, borderRadius: "50%", border: "1.5px solid #CBD5E1" }} />
                            )}
                          </div>
                          <div className={styles.savedAddressInfo}>
                            <div className={styles.savedAddressTypeRow}>
                              {addr.type?.toLowerCase() === "work" ? <Briefcase size={12} /> : <Home size={12} />}
                              <span>{addr.type || "Home"}</span>
                              {addr.isDefault && <span className={styles.defaultBadge}>Default</span>}
                            </div>
                            <div className={styles.savedAddressLines}>
                              <div style={{ fontWeight: 600, color: "#1E293B" }}>
                                {addr.houseNumber ? `${addr.houseNumber}, ` : ""}{addr.street}
                              </div>
                              <div>
                                {addr.landmark ? `Landmark: ${addr.landmark}, ` : ""}{addr.city || "Pune"} - {addr.pincode}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Picker Action Buttons */}
                <div className={styles.addressPickerActions}>
                  <button
                    type="button"
                    onClick={handleDetectGpsLocation}
                    disabled={isDetectingGps}
                    className={styles.gpsDetectBtn}
                    title="Detect current location via GPS"
                  >
                    {isDetectingGps ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                    <span>{isDetectingGps ? "Detecting GPS..." : "Use Current GPS"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowManualAddressInput((prev) => !prev)}
                    className={styles.customAddrBtn}
                  >
                    {showManualAddressInput ? "Hide Custom Input" : "Type Custom Address"}
                  </button>
                </div>

                {/* Manual Input / Suggestions */}
                {(showManualAddressInput || savedAddresses.length === 0) && (
                  <div style={{ position: "relative", marginTop: "4px" }}>
                    <input
                      type="text"
                      maxLength={120}
                      className={styles.formInput}
                      placeholder="Type flat/room number, building, street (max 120 chars)..."
                      value={deliveryAddress}
                      onChange={(e) => {
                        setDeliveryAddress(e.target.value.slice(0, 120));
                        setSelectedSavedAddressId(null);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      style={{ width: "100%", boxSizing: "border-box" }}
                    />
                    <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8", pointerEvents: "none" }}>
                      <MapPin size={16} />
                    </div>

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
                )}
              </div>
            )}
          </div>

          {/* Phone */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <Phone size={14} color="#EA580C" />
              <span>Contact Phone Number</span>
            </label>

            {!isEditingPhone && contactPhone ? (
              <div className={styles.phoneCard}>
                <div className={styles.phoneCardLeft}>
                  <div className={styles.phoneCardIcon}>
                    <Phone size={14} />
                  </div>
                  <div>
                    <div className={styles.phoneCardNumber}>+91 {contactPhone}</div>
                    <div className={styles.phoneCardLabel}>Account Registered Phone (Used for delivery &amp; OTP)</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingPhone(true)}
                  className={styles.editPhoneBtn}
                >
                  Edit Number
                </button>
              </div>
            ) : (
              <div className={styles.phoneEditRow}>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  className={styles.formInput}
                  placeholder="e.g. 9876543210"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  style={{ flex: 1 }}
                />
                {contactPhone.length === 10 && (
                  <button
                    type="button"
                    onClick={() => setIsEditingPhone(false)}
                    className={styles.phoneDoneBtn}
                  >
                    Done
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Subscription Start Date Preference */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <Calendar size={14} color="#EA580C" />
              <span>Subscription Start Date</span>
            </label>
            <select
              value={startDatePreference}
              onChange={(e) => setStartDatePreference(e.target.value)}
              className={styles.formInput}
              style={{ width: "100%", boxSizing: "border-box", cursor: "pointer", fontWeight: 600, color: "#1E293B" }}
            >
              <option value="Tomorrow">Starts Tomorrow (Next Delivery Slot)</option>
              <option value="Monday">Starts Coming Monday</option>
              <option value="1st">Starts 1st of Next Month</option>
            </select>
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
