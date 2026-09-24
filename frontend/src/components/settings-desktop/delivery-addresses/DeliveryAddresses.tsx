"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { MapPin, Plus, Check, Pencil, Trash2, X, Home, Briefcase, Navigation, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";
import { HouseMapPicker } from "@/components/house-map-picker";
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
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
        // Fallback check on user profile
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

  const openAddModal = () => {
    if (onAddNewAddress) {
      onAddNewAddress();
      return;
    }
    if (!session?.user) {
      router.push("/login?callbackUrl=/profile");
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
    setIsModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingAddressId && addresses.length >= 5) {
      alert("You can add a maximum of 5 delivery addresses. Please edit or delete an existing address.");
      return;
    }

    if (!houseNumber.trim()) {
      alert("Please enter Flat / House / Floor number.");
      return;
    }
    if (!street.trim()) {
      alert("Please enter Street / Area / Locality.");
      return;
    }
    const cleanPin = pincode.replace(/\D/g, "");
    if (cleanPin.length !== 6) {
      alert("Please enter a valid 6-digit Pincode.");
      return;
    }

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
        setIsModalOpen(false);
        await fetchAddresses();
        showToast(editingAddressId ? "Address updated successfully!" : "New address added successfully!");
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || "Failed to save address.");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred while saving the address.");
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
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const res = await fetchApi(`/api/user/addresses/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchAddresses();
        showToast("Address deleted");
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
      const res = await fetchApi(`/api/user/addresses/${id}/default`, { method: "PATCH" });
      if (res.ok) {
        await fetchAddresses();
        showToast("Default delivery address updated");
      } else {
        alert("Failed to set as default address.");
      }
    } catch (err) {
      console.error("Set default failed", err);
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
          <h2 className={styles.cardTitle}>Delivery Addresses</h2>
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
          addresses.map((addr) => {
            const isHome = (addr.type || "").toUpperCase().includes("HOME");
            const isWork = (addr.type || "").toUpperCase().includes("WORK") || (addr.type || "").toUpperCase().includes("OFFICE");

            return (
              <div
                key={addr.id}
                className={styles.addressBox}
                style={{
                  borderColor: addr.isDefault ? "#F97316" : "#F1F5F9",
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
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleSetDefault(addr.id, e)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                      }}
                      title={addr.isDefault ? "Current default delivery address" : "Click to set as default"}
                    >
                      {addr.isDefault ? (
                        <Check size={18} strokeWidth={3} className={styles.checkIcon} />
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
                      title="Delete Address"
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

      {/* Add / Edit Address Modal */}
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

            <form onSubmit={handleSaveAddress} className={styles.addressForm}>
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
                  required
                  placeholder="e.g. Flat 402, Golden Crest Apartments"
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  className={styles.inputField}
                />
              </div>

              {/* Street / Locality */}
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Street / Area / Locality *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paud Road, Kothrud"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className={styles.inputField}
                />
              </div>

              {/* Landmark & Pincode */}
              <div className={styles.inputRow}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Landmark (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Opp. City Pride Theatre"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className={styles.inputField}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>6-Digit Pincode *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 411038"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className={styles.inputField}
                  />
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
                        setPincode(details.pincode.replace(/\D/g, "").slice(0, 6));
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
                  disabled={saving}
                  className={styles.saveModalBtn}
                >
                  {saving && <Loader2 className="animate-spin" size={16} />}
                  <span>{saving ? "Saving..." : editingAddressId ? "Update Address" : "Save Address"}</span>
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
