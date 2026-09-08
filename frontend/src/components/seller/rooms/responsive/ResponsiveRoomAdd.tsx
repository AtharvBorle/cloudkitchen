"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Camera } from "lucide-react";
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
  initialAmenities?: ResponsiveAmenity[];
  initialIsAvailable?: boolean;
  initialImageUrl?: string;
  onBack?: () => void;
  onSave?: (data: {
    roomName: string;
    capacity: string | number;
    pricePerNight: string;
    amenities: ResponsiveAmenity[];
    isAvailable: boolean;
    imageFile?: File | null;
  }) => void;
}

const DEFAULT_AMENITIES: ResponsiveAmenity[] = [
  { id: "wifi", name: "WiFi", selected: true },
  { id: "ac", name: "AC", selected: true },
  { id: "tv", name: "TV", selected: true },
  { id: "minibar", name: "Minibar", selected: false },
  { id: "balcony", name: "Balcony", selected: false },
];

export const ResponsiveRoomAdd: React.FC<ResponsiveRoomAddProps> = ({
  initialRoomName = "Deluxe Premium Suite",
  initialCapacity = "4",
  initialPricePerNight = "2,500",
  initialAmenities = DEFAULT_AMENITIES,
  initialIsAvailable = true,
  initialImageUrl,
  onBack,
  onSave,
}) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [roomName, setRoomName] = useState(initialRoomName);
  const [capacity, setCapacity] = useState(initialCapacity);
  const [pricePerNight, setPricePerNight] = useState(initialPricePerNight);
  const [amenities, setAmenities] =
    useState<ResponsiveAmenity[]>(initialAmenities);
  const [isAvailable, setIsAvailable] = useState(initialIsAvailable);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialImageUrl || null
  );
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/seller/res/rooms");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      roomName,
      capacity,
      pricePerNight,
      amenities,
      isAvailable,
      imageFile,
    };

    if (onSave) {
      onSave(data);
    } else {
      router.push("/seller/res/rooms");
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

          <h1 className={styles.headerTitle}>Add room</h1>

          <div className={styles.headerPlaceholder} />
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
                placeholder="4"
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
                  placeholder="2,500"
                  required
                />
              </div>
            </div>
          </div>

          {/* 4. Amenities Pills */}
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel}>Amenities</label>
            <div className={styles.amenitiesList}>
              {amenities.map((amenity) => (
                <button
                  key={amenity.id}
                  type="button"
                  className={`${styles.amenityPill} ${
                    amenity.selected ? styles.amenityPillSelected : ""
                  }`}
                  onClick={() => handleToggleAmenity(amenity.id)}
                  aria-pressed={amenity.selected}
                >
                  {amenity.name}
                </button>
              ))}
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
          <button type="submit" className={styles.saveButton}>
            Save room
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResponsiveRoomAdd;

