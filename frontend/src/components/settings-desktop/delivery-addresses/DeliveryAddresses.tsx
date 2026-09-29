"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  MapPin,
  Plus,
  Check,
  Pencil,
  Trash2,
  X,
  Home,
  Briefcase,
  Navigation,
  Loader2,
  AlertCircle,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";
import { HouseMapPicker } from "@/components/house-map-picker";
import {
  isSameAddress,
  findDuplicateAddress,
  findDuplicateAddressIds,
  normalizeAddressText,
  calculateStringSimilarity,
} from "@/lib/address-validation";
import styles from "./DeliveryAddresses.module.css";

export interface AddressItem {
  id: string;
  type: string;
  houseNumber: string;
  street: string;
  landmark?: string | null;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
  recipientName?: string;
  recipientPhone?: string;
}

export interface DeliveryAddressesProps {
  onAddNewAddress?: () => void;
  onSetLocationMap?: (id: string) => void;
  onEditAddress?: (id: string) => void;
  onDeleteAddress?: (id: string) => void;
}

interface FormErrors {
  houseNumber?: string;
  street?: string;
  pincode?: string;
  duplicate?: string;
  general?: string;
}

export { isSameAddress, normalizeAddressText };

export const DeliveryAddresses: React.FC<DeliveryAddressesProps> = ({
  onAddNewAddress,
  onSetLocationMap,
  onEditAddress,
  onDeleteAddress,
}) => {
  const router = useRouter();
  const { data: session } = useSession();

  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [cleaningDuplicates, setCleaningDuplicates] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Address Form State
  const [addressType, setAddressType] = useState<"Home" | "Work" | "Other">("Home");
  const [houseNumber, setHouseNumber] = useState("");
  const [street, setStreet] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pincode, setPincode] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isDefault, setIsDefault] = useState(false);

  // Validation State
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [duplicateMatchedItem, setDuplicateMatchedItem] = useState<AddressItem | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const fetchAddresses = useCallback(async () => {
    if (!session?.user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetchApi("/api/user/addresses");
      if (res.ok) {
        const data = await res.json();
        const list = data.data?.addresses || data.addresses || data.data || [];
        if (Array.isArray(list)) {
          setAddresses(
            list.map((a: any) => ({
              id: a.id,
              type: a.type || "Home",
              houseNumber: a.houseNumber || "",
              street: a.street || "",
              landmark: a.landmark || "",
              pincode: a.pincode || "",
              latitude: a.latitude ? parseFloat(a.latitude) : null,
              longitude: a.longitude ? parseFloat(a.longitude) : null,
              isDefault: Boolean(a.isDefault),
              recipientName: session?.user?.name || "Registered User",
              recipientPhone: (session?.user as any)?.phone || "",
            }))
          );
        }
      } else {
        const profRes = await fetchApi("/api/user/profile");
        if (profRes.ok) {
          const profData = await profRes.json();
          const userObj = profData.data || profData;
          if (Array.isArray(userObj?.addresses)) {
            setAddresses(
              userObj.addresses.map((a: any) => ({
                id: a.id,
                type: a.type || "Home",
                houseNumber: a.houseNumber || "",
                street: a.street || "",
                landmark: a.landmark || "",
                pincode: a.pincode || "",
                latitude: a.latitude ? parseFloat(a.latitude) : null,
                longitude: a.longitude ? parseFloat(a.longitude) : null,
                isDefault: Boolean(a.isDefault),
                recipientName: userObj.name || session?.user?.name || "Registered User",
                recipientPhone: userObj.phone || "",
              }))
            );
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Identify duplicate addresses in the existing list using fuzzy algorithm
  const duplicateIds = useMemo(() => {
    return findDuplicateAddressIds(addresses);
  }, [addresses]);

  // Sort addresses so that DEFAULT address is always displayed first
  const sortedAddresses = useMemo(() => {
    return [...addresses].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
  }, [addresses]);

  // Validation function with fuzzy duplicate matching
  const validateForm = (
    hNum: string,
    str: string,
    pin: string,
    land: string,
    ignoreId: string | null = null
  ): { isValid: boolean; newErrors: FormErrors; duplicateMatch: AddressItem | null } => {
    const newErrors: FormErrors = {};

    // 1. House Number / Flat Validation
    const trimmedHouse = hNum.trim();
    if (!trimmedHouse) {
      newErrors.houseNumber = "Flat / House / Floor number is required.";
    } else if (trimmedHouse.length < 2) {
      newErrors.houseNumber = "Please enter at least 2 characters for flat or house name.";
    } else if (/^[^a-zA-Z0-9]+$/.test(trimmedHouse)) {
      newErrors.houseNumber = "Please enter a valid flat or building identifier.";
    }

    // 2. Street / Locality Validation
    const trimmedStreet = str.trim();
    if (!trimmedStreet) {
      newErrors.street = "Street / Area / Locality is required.";
    } else if (trimmedStreet.length < 3) {
      newErrors.street = "Please enter at least 3 characters for street or locality.";
    }

    // 3. Pincode Validation (Indian 6-Digit Format)
    const cleanPin = pin.replace(/\D/g, "");
    if (!cleanPin) {
      newErrors.pincode = "6-digit Pincode is required.";
    } else if (cleanPin.length !== 6) {
      newErrors.pincode = "Pincode must be exactly 6 numeric digits.";
    } else if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      newErrors.pincode = "Please enter a valid Indian pincode (e.g. 411038).";
    }

    // 4. Intelligent Fuzzy Duplicate Address Check
    let duplicateMatch: AddressItem | null = null;
    if (trimmedHouse && trimmedStreet && cleanPin.length === 6) {
      const dupCheck = findDuplicateAddress(
        {
          houseNumber: trimmedHouse,
          street: trimmedStreet,
          pincode: cleanPin,
          landmark: land.trim(),
        },
        addresses,
        ignoreId
      );

      if (dupCheck.isDuplicate && dupCheck.matchedItem) {
        duplicateMatch = dupCheck.matchedItem;
        newErrors.duplicate = dupCheck.message || "This delivery address matches an existing saved address.";
      }
    }

    const isValid = Object.keys(newErrors).length === 0;
    return { isValid, newErrors, duplicateMatch };
  };

  const handleFieldChange = (field: "houseNumber" | "street" | "landmark" | "pincode", value: string) => {
    let nextHouse = houseNumber;
    let nextStreet = street;
    let nextLandmark = landmark;
    let nextPincode = pincode;

    if (field === "houseNumber") {
      setHouseNumber(value);
      nextHouse = value;
    } else if (field === "street") {
      setStreet(value);
      nextStreet = value;
    } else if (field === "landmark") {
      setLandmark(value);
      nextLandmark = value;
    } else if (field === "pincode") {
      const clean = value.replace(/\D/g, "").slice(0, 6);
      setPincode(clean);
      nextPincode = clean;
    }

    // Run real-time validation & fuzzy duplicate check
    const { newErrors, duplicateMatch } = validateForm(nextHouse, nextStreet, nextPincode, nextLandmark, editingAddressId);
    setErrors(newErrors);
    setDuplicateMatchedItem(duplicateMatch);
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleCleanDuplicates = async () => {
    if (duplicateIds.size === 0) return;
    if (!confirm(`Are you sure you want to remove ${duplicateIds.size} duplicate address entries? One clean primary copy of each address will be kept.`)) {
      return;
    }

    setCleaningDuplicates(true);
    try {
      const idArray = Array.from(duplicateIds);
      await Promise.all(
        idArray.map((id) => fetchApi(`/api/user/addresses/${id}`, { method: "DELETE" }))
      );
      await fetchAddresses();
      showToast(`${idArray.length} duplicate address(es) removed successfully!`);
    } catch (err) {
      console.error("Failed to clean duplicate addresses:", err);
      showToast("Failed to clean up some duplicates. Please try again.");
    } finally {
      setCleaningDuplicates(false);
    }
  };

  const openAddModal = () => {
    if (onAddNewAddress) {
      onAddNewAddress();
      return;
    }
    if (!session?.user) {
      router.push("/login?callbackUrl=/delivery-addresses-desktop");
      return;
    }
    if (addresses.length >= 5) {
      alert("You can add a maximum of 5 delivery addresses. Please edit or delete an existing address.");
      return;
    }
    setEditingAddressId(null);
    setAddressType("Home");
    setHouseNumber("");
    setStreet("");
    setLandmark("");
    setPincode("");
    setLatitude(18.5204);
    setLongitude(73.8567);
    setIsDefault(addresses.length === 0);
    setErrors({});
    setTouched({});
    setIsModalOpen(true);
  };

  const openEditModal = (addr: AddressItem) => {
    if (onEditAddress) {
      onEditAddress(addr.id);
      return;
    }
    setEditingAddressId(addr.id);
    setAddressType((addr.type === "Work" ? "Work" : addr.type === "Other" ? "Other" : "Home") as any);
    setHouseNumber(addr.houseNumber);
    setStreet(addr.street);
    setLandmark(addr.landmark || "");
    setPincode(addr.pincode);
    setLatitude(addr.latitude ?? 18.5204);
    setLongitude(addr.longitude ?? 73.8567);
    setIsDefault(addr.isDefault);
    setErrors({});
    setTouched({});
    setIsModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingAddressId && addresses.length >= 5) {
      alert("You can add a maximum of 5 delivery addresses. Please edit or delete an existing address.");
      return;
    }

    // Mark all fields touched
    setTouched({
      houseNumber: true,
      street: true,
      pincode: true,
    });

    const { isValid, newErrors } = validateForm(houseNumber, street, pincode, landmark, editingAddressId);
    setErrors(newErrors);

    if (!isValid) {
      return;
    }

    const cleanPin = pincode.replace(/\D/g, "");

    const normHouse = houseNumber.trim().toLowerCase();
    const normStreet = street.trim().toLowerCase();
    const normPin = cleanPin;

    const isDuplicate = addresses.some((addr) => {
      if (editingAddressId && addr.id === editingAddressId) return false;
      return (
        addr.houseNumber.trim().toLowerCase() === normHouse &&
        addr.street.trim().toLowerCase() === normStreet &&
        addr.pincode.replace(/\D/g, "") === normPin
      );
    });

    if (isDuplicate) {
      alert("This address already exists in your saved addresses.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        type: addressType,
        houseNumber: houseNumber.trim(),
        street: street.trim(),
        landmark: landmark.trim() || undefined,
        pincode: cleanPin,
        latitude: latitude !== null ? latitude : 18.5204,
        longitude: longitude !== null ? longitude : 73.8567,
        isDefault,
      };

      const url = editingAddressId
        ? `/api/user/addresses/${editingAddressId}`
        : "/api/user/addresses";
      const method = editingAddressId ? "PUT" : "POST";

      const res = await fetchApi(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const resData = await res.json().catch(() => ({}));
        const targetId = editingAddressId || resData.data?.address?.id || resData.address?.id || resData.data?.id || resData.id;

        if (isDefault && targetId) {
          try {
            await fetchApi(`/api/user/addresses/${targetId}/default`, {
              method: "PATCH",
            });
          } catch (patchErr) {
            console.warn("Failed to set address as default:", patchErr);
          }
        }

        setIsModalOpen(false);
        if (isDefault || addresses.length === 0) {
          if (typeof window !== "undefined") {
            localStorage.setItem("active-selected-pincode", cleanPin);
            localStorage.setItem("guest-pincode", cleanPin);
            if (street) localStorage.setItem("guest-locality", street.trim());
            if (latitude !== null) localStorage.setItem("guest-lat", String(latitude));
            if (longitude !== null) localStorage.setItem("guest-lng", String(longitude));
            window.dispatchEvent(new Event("location-changed"));
            window.dispatchEvent(new CustomEvent("default-address-changed", { detail: { id: targetId, pincode: cleanPin, street, latitude, longitude, isDefault: true } }));
            window.dispatchEvent(new Event("storage"));
          }
        }
        await fetchAddresses();
        showToast(editingAddressId ? "Address updated successfully!" : "New address added successfully!");
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrors((prev) => ({
          ...prev,
          general: errData.message || "Failed to save delivery address. Please try again.",
        }));
      }
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        general: err.message || "An unexpected error occurred while saving the address.",
      }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteAddress) {
      onDeleteAddress(id);
      return;
    }
    if (!confirm("Are you sure you want to delete this delivery address?")) return;

    try {
      const res = await fetchApi(`/api/user/addresses/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchAddresses();
        showToast("Address deleted successfully");
      } else {
        alert("Failed to delete address.");
      }
    } catch (err) {
      alert("Failed to delete address.");
    }
  };

  const handleSetDefault = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const target = addresses.find((a) => a.id === id);
      if (!target) return;

      // Optimistically update local state so user sees toggle change immediately
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          isDefault: a.id === id,
        }))
      );

      if (typeof window !== "undefined") {
        localStorage.setItem("active-selected-pincode", target.pincode);
        localStorage.setItem("guest-pincode", target.pincode);
        if (target.street) localStorage.setItem("guest-locality", target.street);
        if (target.latitude !== null && target.latitude !== undefined) {
          localStorage.setItem("guest-lat", String(target.latitude));
        }
        if (target.longitude !== null && target.longitude !== undefined) {
          localStorage.setItem("guest-lng", String(target.longitude));
        }
        window.dispatchEvent(new Event("location-changed"));
        window.dispatchEvent(new CustomEvent("default-address-changed", { detail: target }));
        window.dispatchEvent(new Event("storage"));
      }

      const res = await fetchApi(`/api/user/addresses/${id}/default`, { method: "PATCH" });
      if (res.ok) {
        await fetchAddresses();
        showToast("Default delivery address updated");
      } else {
        await fetchAddresses();
        alert("Failed to set as default address.");
      }
    } catch (err) {
      console.error("Set default failed", err);
      await fetchAddresses();
    }
  };

  const userName = session?.user?.name || "Registered User";
  const userPhone = (session?.user as any)?.phone || "";

  return (
    <div className={styles.sectionCard}>
      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.iconBox}>
            <MapPin size={18} strokeWidth={2.4} />
          </div>
          <div>
            <h2 className={styles.cardTitle}>Delivery Addresses</h2>
          </div>
        </div>

        <button
          type="button"
          className={styles.addBtn}
          onClick={openAddModal}
          disabled={addresses.length >= 5}
          title={addresses.length >= 5 ? "Maximum 5 addresses limit reached" : "Add New Address"}
          style={addresses.length >= 5 ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
          aria-label="Add New Address"
        >
          <Plus size={15} strokeWidth={3} />
          <span>Add New Address ({addresses.length}/5)</span>
        </button>
      </div>

      {/* Top Duplicate Cleanup Banner if duplicates exist in account */}
      {duplicateIds.size > 0 && !loading && (
        <div className={styles.cleanupBanner}>
          <div className={styles.cleanupLeft}>
            <ShieldAlert size={24} className={styles.cleanupIcon} />
            <div>
              <h4 className={styles.cleanupTitle}>
                Duplicate Addresses Detected ({duplicateIds.size} redundant {duplicateIds.size === 1 ? "entry" : "entries"})
              </h4>
              <p className={styles.cleanupSubtitle}>
                You have duplicate saved addresses with identical or near-identical locations. Clean them up with one click to keep your account organized.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCleanDuplicates}
            disabled={cleaningDuplicates}
            className={styles.cleanupBtn}
            title="Remove all duplicate address copies and keep one clean primary copy"
          >
            {cleaningDuplicates ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <Sparkles size={14} />
            )}
            <span>{cleaningDuplicates ? "Cleaning Duplicates..." : "Remove All Duplicates"}</span>
          </button>
        </div>
      )}

      {/* Addresses Grid */}
      <div className={styles.addressesGrid}>
        {loading ? (
          <div className={styles.emptyState}>
            <Loader2 className="animate-spin" size={28} color="#F97316" />
            <p style={{ marginTop: "10px", fontSize: "0.9rem", color: "#64748B" }}>Loading addresses...</p>
          </div>
        ) : addresses.length === 0 ? (
          <div className={styles.emptyState}>
            <MapPin size={40} className={styles.emptyIcon} />
            <p className={styles.emptyText}>No addresses saved yet</p>
            <p className={styles.emptySubtext}>
              Click <strong>&quot;+ Add New Address&quot;</strong> above to add your first delivery address for seamless checkout.
            </p>
          </div>
        ) : (
          sortedAddresses.map((addr) => {
            const isHome = (addr.type || "").toUpperCase().includes("HOME");
            const isWork = (addr.type || "").toUpperCase().includes("WORK") || (addr.type || "").toUpperCase().includes("OFFICE");
            const isDuplicate = duplicateIds.has(addr.id);

            return (
              <div
                key={addr.id}
                className={`${styles.addressBox} ${isDuplicate ? styles.addressBoxDuplicate : ""}`}
                style={{
                  borderColor: addr.isDefault ? "#F97316" : isDuplicate ? "#FCA5A5" : "#F1F5F9",
                  boxShadow: addr.isDefault ? "0 4px 16px rgba(249, 115, 22, 0.08)" : undefined,
                }}
              >
                <div>
                  <div className={styles.addressTop}>
                    <div className={styles.tagsRow}>
                      <span className={isHome ? styles.homeTag : styles.officeTag}>
                        {addr.type.toUpperCase()}
                      </span>
                      {addr.isDefault && (
                        <span className={styles.defaultTag}>DEFAULT</span>
                      )}
                      {isDuplicate && (
                        <span className={styles.duplicateTag} title="This is a duplicate of another saved address">
                          <AlertCircle size={11} />
                          <span>DUPLICATE</span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleSetDefault(addr.id, e)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "2px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      title={addr.isDefault ? "Current default delivery address" : "Click to set as default"}
                      aria-label={addr.isDefault ? "Current default delivery address" : "Click to set as default"}
                    >
                      {addr.isDefault ? (
                        <div className={styles.radioSelectedCircle}>
                          <Check size={13} strokeWidth={3.5} />
                        </div>
                      ) : (
                        <div className={styles.radioCircle} />
                      )}
                    </button>
                  </div>

                  <div className={styles.addressMiddle}>
                    <div
                      className={styles.mapThumb}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: isHome ? "#FFF7ED" : "#F0F9FF",
                        color: isHome ? "#F97316" : "#0284C7",
                      }}
                    >
                      {isHome ? <Home size={22} /> : isWork ? <Briefcase size={22} /> : <Navigation size={22} />}
                    </div>

                    <div className={styles.addressDetails}>
                      <h3 className={styles.recipientName}>{addr.recipientName || userName}</h3>
                      <p className={styles.recipientPhone}>{addr.recipientPhone || userPhone}</p>
                      <p className={styles.addressText}>
                        {addr.houseNumber}, {addr.street}
                        {addr.landmark ? `, Near ${addr.landmark}` : ""} - {addr.pincode}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={styles.addressBottom}>
                  <button
                    type="button"
                    className={styles.mapLocationBtn}
                    onClick={() => openEditModal(addr)}
                  >
                    <MapPin size={14} color="#F97316" />
                    <span>Set Location on Map</span>
                  </button>

                  <div className={styles.actionIcons}>
                    <button
                      type="button"
                      className={styles.iconActionBtn}
                      onClick={() => openEditModal(addr)}
                      aria-label="Edit Address"
                      title="Edit Address"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={(e) => handleDelete(addr.id, e)}
                      aria-label="Delete Address"
                      title={isDuplicate ? "Delete Duplicate Address" : "Delete Address"}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Address Modal with Validations */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingAddressId ? "Edit Delivery Address" : "Add New Delivery Address"}
              </h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className={styles.addressForm} noValidate>
              {/* Rich Duplicate Warning Banner with Matched Address Preview */}
              {errors.duplicate && (
                <div className={styles.duplicateBanner}>
                  <div className={styles.duplicateBannerHeader}>
                    <ShieldAlert size={20} className={styles.duplicateBannerIcon} />
                    <div>
                      <div className={styles.duplicateBannerTitle}>Address Already Exists in Your Saved List</div>
                      <div className={styles.duplicateBannerDesc}>
                        You already have a saved delivery address matching this location:
                      </div>
                    </div>
                  </div>

                  {duplicateMatchedItem && (
                    <div className={styles.duplicatePreviewCard}>
                      <span className={styles.duplicatePreviewTag}>
                        {(duplicateMatchedItem.type || "HOME").toUpperCase()}
                      </span>
                      <span className={styles.duplicatePreviewText} title={`${duplicateMatchedItem.houseNumber}, ${duplicateMatchedItem.street} - ${duplicateMatchedItem.pincode}`}>
                        {duplicateMatchedItem.houseNumber}, {duplicateMatchedItem.street}
                        {duplicateMatchedItem.landmark ? `, Near ${duplicateMatchedItem.landmark}` : ""} - {duplicateMatchedItem.pincode}
                      </span>
                    </div>
                  )}

                  <p className={styles.duplicateAdvice}>
                    To prevent duplicate entries, please modify your flat/house or street name, or choose your existing saved address.
                  </p>
                </div>
              )}

              {/* General Error Banner */}
              {errors.general && (
                <div
                  style={{
                    backgroundColor: "#FEF2F2",
                    border: "1px solid #FECACA",
                    color: "#991B1B",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    fontSize: "0.84rem",
                    fontWeight: 600,
                  }}
                >
                  {errors.general}
                </div>
              )}

              {/* Type Selector */}
              <div className={styles.typeSelectorRow}>
                <label className={styles.typeLabel}>Address Type</label>
                <div className={styles.typeButtons}>
                  {(["Home", "Work", "Other"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`${styles.typeBtn} ${addressType === t ? styles.typeBtnActive : ""}`}
                      onClick={() => setAddressType(t)}
                    >
                      {t === "Home" && <Home size={15} />}
                      {t === "Work" && <Briefcase size={15} />}
                      {t === "Other" && <Navigation size={15} />}
                      <span>{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* House Number / Flat */}
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>House / Flat / Floor / Building *</label>
                <input
                  type="text"
                  placeholder="e.g. Flat 402, Golden Crest Apartments"
                  value={houseNumber}
                  onChange={(e) => handleFieldChange("houseNumber", e.target.value)}
                  onBlur={() => handleBlur("houseNumber")}
                  className={`${styles.inputField} ${
                    errors.duplicate
                      ? styles.inputFieldDuplicate
                      : touched.houseNumber && errors.houseNumber
                      ? styles.inputFieldError
                      : ""
                  }`}
                />
                {touched.houseNumber && errors.houseNumber && (
                  <span className={styles.fieldErrorText}>
                    <AlertCircle size={13} />
                    <span>{errors.houseNumber}</span>
                  </span>
                )}
              </div>

              {/* Street / Locality */}
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Street / Area / Locality *</label>
                <input
                  type="text"
                  placeholder="e.g. Paud Road, Kothrud"
                  value={street}
                  onChange={(e) => handleFieldChange("street", e.target.value)}
                  onBlur={() => handleBlur("street")}
                  className={`${styles.inputField} ${
                    errors.duplicate
                      ? styles.inputFieldDuplicate
                      : touched.street && errors.street
                      ? styles.inputFieldError
                      : ""
                  }`}
                />
                {touched.street && errors.street && (
                  <span className={styles.fieldErrorText}>
                    <AlertCircle size={13} />
                    <span>{errors.street}</span>
                  </span>
                )}
              </div>

              {/* Landmark & Pincode */}
              <div className={styles.inputRow}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Landmark (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Near City Pride Kothrud"
                    value={landmark}
                    onChange={(e) => handleFieldChange("landmark", e.target.value)}
                    className={styles.inputField}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>6-Digit Pincode *</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 411038"
                    value={pincode}
                    onChange={(e) => handleFieldChange("pincode", e.target.value)}
                    onBlur={() => handleBlur("pincode")}
                    className={`${styles.inputField} ${
                      errors.duplicate
                        ? styles.inputFieldDuplicate
                        : touched.pincode && errors.pincode
                        ? styles.inputFieldError
                        : ""
                    }`}
                  />
                  {touched.pincode && errors.pincode && (
                    <span className={styles.fieldErrorText}>
                      <AlertCircle size={13} />
                      <span>{errors.pincode}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Interactive House Map Picker */}
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Pin Exact Location on Map (Drag pin or click on map)
                </label>
                <div className={styles.mapPickerWrapper}>
                  <HouseMapPicker
                    latitude={latitude}
                    longitude={longitude}
                    onChange={(newLat, newLng, details) => {
                      setLatitude(newLat);
                      setLongitude(newLng);
                      if (details?.pincode && !pincode) {
                        handleFieldChange("pincode", details.pincode);
                      }
                      if (details?.street && !street) {
                        handleFieldChange("street", details.street);
                      }
                      if (details?.landmark && !landmark) {
                        handleFieldChange("landmark", details.landmark);
                      }
                      if (details?.houseNumber && !houseNumber) {
                        handleFieldChange("houseNumber", details.houseNumber);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Default Checkbox */}
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className={styles.checkboxInput}
                />
                <span>Set as default delivery address</span>
              </label>

              {/* Modal Footer Actions */}
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelModalBtn}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || Boolean(errors.duplicate)}
                  className={`${styles.saveModalBtn} ${
                    errors.duplicate ? styles.saveModalBtnDuplicate : ""
                  }`}
                  title={errors.duplicate ? "Cannot save duplicate address" : "Save delivery address"}
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Saving...</span>
                    </>
                  ) : errors.duplicate ? (
                    <>
                      <ShieldAlert size={16} />
                      <span>Duplicate Address Detected</span>
                    </>
                  ) : (
                    <span>{editingAddressId ? "Update Address" : "Save Address"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast message */}
      {toastMessage && (
        <div className={styles.toast}>
          <Check size={16} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default DeliveryAddresses;

