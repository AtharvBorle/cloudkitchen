"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Camera, Bell, X, Plus, Loader2 } from "lucide-react";
import styles from "./ResponsiveRoomAdd.module.css";

export interface ResponsiveAmenity {
  id: string;
  name: string;
  selected: boolean;
}

export interface ResponsiveRoomAddProps {
  initialRoomName?: string;
  initialCapacity?: string | number;
  initialPricePerNight?: string;
  initialFloorNo?: string;
  initialAbout?: string;
  initialAmenities?: ResponsiveAmenity[];
  initialHouseRules?: string[];
  initialIsAvailable?: boolean;
  initialImageUrl?: string;
  isEditMode?: boolean;
  isSaving?: boolean;
  onBack?: () => void;
  onDelete?: () => void;
  onSave?: (data: {
    roomName: string;
    capacity: string | number;
    pricePerNight: string;
    floorNo?: string;
    about: string;
    amenities: ResponsiveAmenity[];
    houseRules: string[];
    isAvailable: boolean;
    imageFile?: File | null;
  }) => void;
}

const DEFAULT_AMENITIES: ResponsiveAmenity[] = [
  { id: "wifi", name: "WiFi", selected: true },
  { id: "ac", name: "AC", selected: true },
  { id: "tv", name: "TV", selected: true },
  { id: "desk", name: "Work Desk", selected: false },
  { id: "balcony", name: "Balcony", selected: false },
];

export const ResponsiveRoomAdd: React.FC<ResponsiveRoomAddProps> = ({
  initialRoomName = "",
  initialCapacity = "",
  initialPricePerNight = "",
  initialFloorNo = "",
  initialAbout = "",
  initialAmenities = DEFAULT_AMENITIES.map((a) => ({ ...a, selected: false })),
  initialHouseRules = [],
  initialIsAvailable = true,
  initialImageUrl,
  isEditMode = false,
  isSaving,
  onBack,
  onDelete,
  onSave,
}) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [roomName, setRoomName] = useState(initialRoomName);
  const [capacity, setCapacity] = useState(initialCapacity);
  const [pricePerNight, setPricePerNight] = useState(initialPricePerNight);
  const [floorNo, setFloorNo] = useState(initialFloorNo);
  const [about, setAbout] = useState(initialAbout);
  const [amenities, setAmenities] = useState<ResponsiveAmenity[]>(initialAmenities);
  const [houseRules, setHouseRules] = useState<string[]>(initialHouseRules);
  const [customAmenity, setCustomAmenity] = useState("");
  const [customRule, setCustomRule] = useState("");
  const [isAvailable, setIsAvailable] = useState(initialIsAvailable);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialImageUrl || null
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [internalSaving, setInternalSaving] = useState(false);

  const savingActive = isSaving !== undefined ? isSaving : internalSaving;

  React.useEffect(() => {
    if (initialRoomName !== undefined) setRoomName(initialRoomName);
  }, [initialRoomName]);

  React.useEffect(() => {
    if (initialFloorNo !== undefined) setFloorNo(initialFloorNo);
  }, [initialFloorNo]);

  React.useEffect(() => {
    if (initialAbout !== undefined) setAbout(initialAbout);
  }, [initialAbout]);

  React.useEffect(() => {
    if (initialCapacity !== undefined) setCapacity(initialCapacity);
  }, [initialCapacity]);

  React.useEffect(() => {
    if (initialPricePerNight !== undefined) setPricePerNight(initialPricePerNight);
  }, [initialPricePerNight]);

  React.useEffect(() => {
    if (initialAmenities && initialAmenities.length > 0) setAmenities(initialAmenities);
  }, [initialAmenities]);

  React.useEffect(() => {
    if (initialHouseRules && initialHouseRules.length > 0) setHouseRules(initialHouseRules);
  }, [initialHouseRules]);

  React.useEffect(() => {
    if (initialIsAvailable !== undefined) setIsAvailable(initialIsAvailable);
  }, [initialIsAvailable]);

  React.useEffect(() => {
    if (initialImageUrl !== undefined) setImagePreview(initialImageUrl || null);
  }, [initialImageUrl]);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/seller/rooms");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        alert(`Room image "${file.name}" (${sizeMB} MB) exceeds the 5MB limit. Please select an image under 5MB.`);
        e.target.value = "";
        return;
      }
      setImageFile(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleToggleAmenity = (amenityId: string) => {
    setAmenities((prev) =>
      prev.map((a) =>
        a.id === amenityId ? { ...a, selected: !a.selected } : a
      )
    );
  };

  const handleDeleteAmenity = (amenityId: string) => {
    setAmenities((prev) => prev.filter((a) => a.id !== amenityId));
  };

  const handleAddCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (!trimmed) return;
    const exists = amenities.some(
      (a) => a.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setAmenities((prev) =>
        prev.map((a) =>
          a.name.toLowerCase() === trimmed.toLowerCase() ? { ...a, selected: true } : a
        )
      );
    } else {
      setAmenities((prev) => [
        ...prev,
        { id: `custom-${Date.now()}`, name: trimmed, selected: true },
      ]);
    }
    setCustomAmenity("");
  };

  const handleAddHouseRule = () => {
    const trimmed = customRule.trim();
    if (!trimmed) return;
    if (houseRules.includes(trimmed)) {
      setCustomRule("");
      return;
    }
    setHouseRules((prev) => [...prev, trimmed]);
    setCustomRule("");
  };

  const handleDeleteHouseRule = (idx: number) => {
    setHouseRules((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (savingActive) return;
    if (isSaving === undefined) {
      setInternalSaving(true);
    }
    const data = {
      roomName,
      capacity,
      pricePerNight,
      floorNo,
      about,
      amenities,
      houseRules,
      isAvailable,
      imageFile,
    };

    if (onSave) {
      onSave(data);
    } else {
      router.push("/seller/rooms");
    }
  };

  return (
    <div className={styles.screenWrapper}>
      {/* 390px Mobile View Container */}
      <div className={styles.mobileContainer}>
        {/* Top Header */}
        <header className={styles.topBar}>
          <button
            type="button"
            className={styles.backButton}
            onClick={handleBackClick}
            aria-label="Back to Rooms"
            title="Back"
          >
            <ChevronLeft size={24} />
          </button>

          <h1 className={styles.headerTitle}>{isEditMode ? "Edit room" : "Add room"}</h1>

          <button
            type="button"
            className={styles.iconButton}
            onClick={() => router.push("/seller/notifications")}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={22} />
          </button>
        </header>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className={styles.contentArea}>
          {/* 1. Upload Room Photos Banner */}
          <div
            className={styles.uploadDropzone}
            onClick={handleTriggerUpload}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleTriggerUpload();
              }
            }}
            aria-label="Upload Room Photos"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              className={styles.fileInputHidden}
              onChange={handleImageChange}
            />

            {imagePreview ? (
              <div className={styles.previewContainer}>
                <img
                  src={imagePreview}
                  alt="Room Preview"
                  className={styles.previewImage}
                />
                <span className={styles.changePhotoText}>Change photo</span>
              </div>
            ) : (
              <>
                <div className={styles.cameraCircle}>
                  <Camera size={22} strokeWidth={2.2} />
                </div>
                <span className={styles.uploadTitle}>Upload room photos</span>
              </>
            )}
          </div>

          {/* 2. Room Name */}
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel} htmlFor="roomNameInput">
              Room Name
            </label>
            <input
              id="roomNameInput"
              type="text"
              className={styles.textInput}
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g. Deluxe Premium Suite"
              required
            />
          </div>

          {/* 3. 2-Column Row: Capacity & Price */}
          <div className={styles.twoColRow}>
            <div className={styles.formGroup}>
              <label className={styles.fieldLabel} htmlFor="capacityInput">
                Capacity (Sleeps)
              </label>
              <input
                id="capacityInput"
                type="number"
                className={styles.textInput}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="e.g. 2"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.fieldLabel} htmlFor="priceNightInput">
                Price/Night
              </label>
              <div className={styles.priceInputWrapper}>
                <span className={styles.pricePrefix}>{"\u20B9"}</span>
                <input
                  id="priceNightInput"
                  type="text"
                  className={`${styles.textInput} ${styles.priceInput}`}
                  value={pricePerNight}
                  onChange={(e) => setPricePerNight(e.target.value)}
                  placeholder="e.g. 2,500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Floor No / Level */}
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel} htmlFor="floorNoInput">
              Floor No / Level
            </label>
            <input
              id="floorNoInput"
              type="text"
              className={styles.textInput}
              value={floorNo}
              onChange={(e) => setFloorNo(e.target.value)}
              placeholder="e.g. 2nd Floor, Ground Floor"
            />
          </div>

          {/* About / Description */}
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel} htmlFor="aboutInput">
              About This Property
            </label>
            <textarea
              id="aboutInput"
              className={styles.textInput}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Describe the room, amenities, and location highlights..."
              rows={3}
              style={{ resize: "vertical", fontFamily: "inherit" }}
            />
          </div>

          {/* 4. Amenities Pills & Custom Add */}
          <div className={styles.formGroup}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label className={styles.fieldLabel} style={{ margin: 0 }}>Amenities</label>
              <span style={{ fontSize: "11px", color: "#94A3B8" }}>Toggle or delete</span>
            </div>
            <div className={styles.amenitiesList} style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {amenities.map((amenity) => (
                <div
                  key={amenity.id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    borderRadius: "9999px",
                    backgroundColor: amenity.selected ? "#FFF1E8" : "#F1F5F9",
                    border: amenity.selected ? "1.5px solid #FF5500" : "1px solid #E2E8F0",
                    overflow: "hidden",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleAmenity(amenity.id)}
                    style={{
                      padding: "6px 10px 6px 12px",
                      background: "none",
                      border: "none",
                      color: amenity.selected ? "#FF5500" : "#475569",
                      fontWeight: amenity.selected ? 600 : 500,
                      fontSize: "12px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {amenity.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAmenity(amenity.id)}
                    style={{
                      padding: "6px 8px 6px 0px",
                      background: "none",
                      border: "none",
                      color: amenity.selected ? "#FF5500" : "#94A3B8",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                    title={`Delete ${amenity.name}`}
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                </div>
              ))}
            </div>

            {/* Custom Amenity Input */}
            <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
              <input
                type="text"
                value={customAmenity}
                onChange={(e) => setCustomAmenity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomAmenity();
                  }
                }}
                placeholder="Add custom amenity"
                className={styles.textInput}
                style={{ fontSize: "12px", padding: "8px 12px" }}
              />
              <button
                type="button"
                onClick={handleAddCustomAmenity}
                style={{
                  backgroundColor: "#FF5500",
                  color: "#FFF",
                  border: "none",
                  borderRadius: "10px",
                  padding: "0 14px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                + Add
              </button>
            </div>
          </div>

          {/* House Rules */}
          <div className={styles.formGroup}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label className={styles.fieldLabel} style={{ margin: 0 }}>House Rules</label>
              <span style={{ fontSize: "11px", color: "#94A3B8" }}>Rules for guests</span>
            </div>

            {houseRules.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px" }}>
                {houseRules.map((rule, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      backgroundColor: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#334155",
                    }}
                  >
                    <span>• {rule}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteHouseRule(idx)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#EF4444",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                      title="Remove rule"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: "6px" }}>
              <input
                type="text"
                value={customRule}
                onChange={(e) => setCustomRule(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddHouseRule();
                  }
                }}
                placeholder="e.g. No smoking inside, Quiet hours 10 PM"
                className={styles.textInput}
                style={{ fontSize: "12px", padding: "8px 12px" }}
              />
              <button
                type="button"
                onClick={handleAddHouseRule}
                style={{
                  backgroundColor: "#0F172A",
                  color: "#FFF",
                  border: "none",
                  borderRadius: "10px",
                  padding: "0 14px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                + Add Rule
              </button>
            </div>
          </div>

          {/* 5. Mark as Available Card */}
          <div className={styles.availabilityCard}>
            <div className={styles.availInfo}>
              <span className={styles.availTitle}>Mark as Available</span>
              <span className={styles.availSubtitle}>
                Visible to guests for booking instantly
              </span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isAvailable}
              className={`${styles.toggleSwitch} ${
                isAvailable ? styles.toggleSwitchActive : ""
              }`}
              onClick={() => setIsAvailable((prev) => !prev)}
              aria-label="Toggle availability"
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>

          {/* 6. Save Room Button */}
          <button
            type="submit"
            className={styles.saveButton}
            disabled={savingActive}
            style={{
              opacity: savingActive ? 0.75 : 1,
              cursor: savingActive ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {savingActive && (
              <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
            )}
            <span>
              {savingActive
                ? isEditMode
                  ? "Updating..."
                  : "Saving..."
                : isEditMode
                ? "Update room"
                : "Save room"}
            </span>
          </button>

          {isEditMode && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              style={{
                marginTop: "12px",
                width: "100%",
                padding: "14px",
                backgroundColor: "#FEF2F2",
                color: "#EF4444",
                border: "1.5px solid #FEE2E2",
                borderRadius: "14px",
                fontSize: "14.5px",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Delete Room
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default ResponsiveRoomAdd;

