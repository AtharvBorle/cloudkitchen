"use client";

import React, { useState } from "react";
import { Plus, X, ArrowRight, ImageIcon } from "lucide-react";
import styles from "./MediaGallery.module.css";
import { readFileAsDataUrl } from "@/lib/seller-registration-store";

export interface MediaGalleryData {
  kitchenPhotos: (string | null)[];
  cuisinePhotos: (string | null)[];
  roomPhotos: (string | null)[];
}

export interface MediaGalleryProps {
  initialData?: Partial<MediaGalleryData>;
  onContinue?: (data: MediaGalleryData) => void;
  onBack?: () => void;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  initialData,
  onContinue,
  onBack,
}) => {
  const [kitchenPhotos, setKitchenPhotos] = useState<(string | null)[]>(
    initialData?.kitchenPhotos && initialData.kitchenPhotos.length === 4
      ? initialData.kitchenPhotos
      : [null, null, null, null]
  );
  const [cuisinePhotos, setCuisinePhotos] = useState<(string | null)[]>(
    initialData?.cuisinePhotos && initialData.cuisinePhotos.length === 4
      ? initialData.cuisinePhotos
      : [null, null, null, null]
  );
  const [roomPhotos, setRoomPhotos] = useState<(string | null)[]>(
    initialData?.roomPhotos && initialData.roomPhotos.length === 2
      ? initialData.roomPhotos
      : [null, null]
  );

  const [dragTarget, setDragTarget] = useState<string | null>(null);

  const triggerUpload = (category: "kitchen" | "cuisine" | "room", index: number) => {
    const el = document.getElementById(`${category}-media-input-${index}`) as HTMLInputElement;
    if (el) el.click();
  };

  const processFiles = async (
    category: "kitchen" | "cuisine" | "room",
    startIndex: number,
    files: FileList | File[]
  ) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (fileArray.length === 0) return;

    for (let i = 0; i < fileArray.length; i++) {
      const targetIdx = startIndex + i;
      const maxSlots = category === "room" ? 2 : 4;
      if (targetIdx >= maxSlots) break;

      try {
        const dataUrl = await readFileAsDataUrl(fileArray[i]);
        if (category === "kitchen") {
          setKitchenPhotos((prev) => {
            const next = [...prev];
            next[targetIdx] = dataUrl;
            return next;
          });
        } else if (category === "cuisine") {
          setCuisinePhotos((prev) => {
            const next = [...prev];
            next[targetIdx] = dataUrl;
            return next;
          });
        } else {
          setRoomPhotos((prev) => {
            const next = [...prev];
            next[targetIdx] = dataUrl;
            return next;
          });
        }
      } catch (err) {
        console.error("Error reading media image:", err);
      }
    }
  };

  const handleInputChange = (
    category: "kitchen" | "cuisine" | "room",
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(category, index, e.target.files);
    }
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragTarget(targetKey);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragTarget(null);
  };

  const handleDrop = (
    category: "kitchen" | "cuisine" | "room",
    index: number,
    e: React.DragEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragTarget(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(category, index, e.dataTransfer.files);
    }
  };

  const removePhoto = (
    category: "kitchen" | "cuisine" | "room",
    index: number,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (category === "kitchen") {
      setKitchenPhotos((prev) => {
        const next = [...prev];
        next[index] = null;
        return next;
      });
    } else if (category === "cuisine") {
      setCuisinePhotos((prev) => {
        const next = [...prev];
        next[index] = null;
        return next;
      });
    } else {
      setRoomPhotos((prev) => {
        const next = [...prev];
        next[index] = null;
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onContinue) {
      onContinue({
        kitchenPhotos,
        cuisinePhotos,
        roomPhotos,
      });
    }
  };

  return (
    <div className={styles.cardContainer}>
      {/* Top Level Hidden File Inputs */}
      {[0, 1, 2, 3].map((idx) => (
        <React.Fragment key={`inputs-k-c-${idx}`}>
          <input
            id={`kitchen-media-input-${idx}`}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => handleInputChange("kitchen", idx, e)}
          />
          <input
            id={`cuisine-media-input-${idx}`}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => handleInputChange("cuisine", idx, e)}
          />
        </React.Fragment>
      ))}
      {[0, 1].map((idx) => (
        <input
          key={`input-room-${idx}`}
          id={`room-media-input-${idx}`}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => handleInputChange("room", idx, e)}
        />
      ))}

      {/* Desktop Header (Desktop only) */}
      <div className={styles.desktopHeaderGroup}>
        <h2 className={styles.title}>Media Assets & Gallery</h2>
        <p className={styles.subtitle}>
          Upload high-resolution photography showcasing your kitchen, cuisine, and rooms.
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* ========================================================= */}
        {/* MOBILE VIEW: Sectioned 2x2 Grid Matching Mockup           */}
        {/* ========================================================= */}
        <div className={styles.mobileGalleryContainer}>
          {/* Section 1: Kitchen Photos */}
          <div className={styles.mobileSection}>
            <span className={styles.mobileSectionHeader}>KITCHEN PHOTOS</span>
            <div className={styles.mobilePhotoGrid}>
              {[0, 1, 2, 3].map((idx) => (
                <div key={`mob-kitchen-${idx}`} className={styles.slotWrapper}>
                  <div
                    className={`${styles.mobileSlot} ${
                      idx === 0 && !kitchenPhotos[idx] ? styles.slotUploadActive : ""
                    }`}
                    onClick={() => triggerUpload("kitchen", idx)}
                  >
                    {kitchenPhotos[idx] ? (
                      <>
                        <img
                          src={kitchenPhotos[idx]!}
                          alt={`Kitchen photo ${idx + 1}`}
                          className={styles.previewImg}
                        />
                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={(e) => removePhoto("kitchen", idx, e)}
                          title="Remove photo"
                        >
                          <X size={13} strokeWidth={2.5} />
                        </button>
                      </>
                    ) : idx === 0 ? (
                      <div className={styles.uploadPrompt}>
                        <Plus size={16} className={styles.orangePlus} />
                        <span className={styles.uploadText}>Upload</span>
                      </div>
                    ) : (
                      <Plus size={16} className={styles.grayPlus} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Cuisine Photos */}
          <div className={styles.mobileSection}>
            <span className={styles.mobileSectionHeader}>CUISINE PHOTOS</span>
            <div className={styles.mobilePhotoGrid}>
              {[0, 1, 2, 3].map((idx) => (
                <div key={`mob-cuisine-${idx}`} className={styles.slotWrapper}>
                  <div
                    className={styles.mobileSlot}
                    onClick={() => triggerUpload("cuisine", idx)}
                  >
                    {cuisinePhotos[idx] ? (
                      <>
                        <img
                          src={cuisinePhotos[idx]!}
                          alt={`Cuisine photo ${idx + 1}`}
                          className={styles.previewImg}
                        />
                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={(e) => removePhoto("cuisine", idx, e)}
                          title="Remove photo"
                        >
                          <X size={13} strokeWidth={2.5} />
                        </button>
                      </>
                    ) : (
                      <Plus size={16} className={styles.grayPlus} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Room Photos */}
          <div className={styles.mobileSection}>
            <span className={styles.mobileSectionHeader}>ROOM PHOTOS</span>
            <div className={styles.mobilePhotoGrid}>
              {[0, 1].map((idx) => (
                <div key={`mob-room-${idx}`} className={styles.slotWrapper}>
                  <div
                    className={styles.mobileSlot}
                    onClick={() => triggerUpload("room", idx)}
                  >
                    {roomPhotos[idx] ? (
                      <>
                        <img
                          src={roomPhotos[idx]!}
                          alt={`Room photo ${idx + 1}`}
                          className={styles.previewImg}
                        />
                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={(e) => removePhoto("room", idx, e)}
                          title="Remove photo"
                        >
                          <X size={13} strokeWidth={2.5} />
                        </button>
                      </>
                    ) : (
                      <Plus size={16} className={styles.grayPlus} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* DESKTOP VIEW: Multi-Column Desktop Gallery Layout         */}
        {/* ========================================================= */}
        <div className={styles.desktopGalleryContainer}>
          {/* Kitchen Photos */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Kitchen Photos (Min. 3)</label>
            <div className={styles.desktopGrid}>
              {[0, 1, 2, 3].map((idx) => {
                const key = `desktop-k-${idx}`;
                return (
                  <div
                    key={key}
                    className={`${styles.desktopPhotoBox} ${
                      dragTarget === key ? styles.photoBoxDragging : ""
                    }`}
                    onClick={() => triggerUpload("kitchen", idx)}
                    onDragOver={(e) => handleDragOver(e, key)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop("kitchen", idx, e)}
                  >
                    {kitchenPhotos[idx] ? (
                      <>
                        <img
                          src={kitchenPhotos[idx]!}
                          alt={`Kitchen photo ${idx + 1}`}
                          className={styles.previewImg}
                        />
                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={(e) => removePhoto("kitchen", idx, e)}
                          title="Remove photo"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <ImageIcon className={styles.photoIcon} />
                        <p className={styles.photoText}>Add photo</p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cuisine Photos */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Cuisine Photos (Min. 3)</label>
            <div className={styles.desktopGrid}>
              {[0, 1, 2, 3].map((idx) => {
                const key = `desktop-c-${idx}`;
                return (
                  <div
                    key={key}
                    className={`${styles.desktopPhotoBox} ${
                      dragTarget === key ? styles.photoBoxDragging : ""
                    }`}
                    onClick={() => triggerUpload("cuisine", idx)}
                    onDragOver={(e) => handleDragOver(e, key)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop("cuisine", idx, e)}
                  >
                    {cuisinePhotos[idx] ? (
                      <>
                        <img
                          src={cuisinePhotos[idx]!}
                          alt={`Cuisine photo ${idx + 1}`}
                          className={styles.previewImg}
                        />
                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={(e) => removePhoto("cuisine", idx, e)}
                          title="Remove photo"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <ImageIcon className={styles.photoIcon} />
                        <p className={styles.photoText}>Add photo</p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Room Photos */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Room Photos (Required for Properties)</label>
            <div className={styles.desktopGrid}>
              {[0, 1].map((idx) => {
                const key = `desktop-r-${idx}`;
                return (
                  <div
                    key={key}
                    className={`${styles.desktopPhotoBox} ${
                      dragTarget === key ? styles.photoBoxDragging : ""
                    }`}
                    onClick={() => triggerUpload("room", idx)}
                    onDragOver={(e) => handleDragOver(e, key)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop("room", idx, e)}
                  >
                    {roomPhotos[idx] ? (
                      <>
                        <img
                          src={roomPhotos[idx]!}
                          alt={`Room photo ${idx + 1}`}
                          className={styles.previewImg}
                        />
                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={(e) => removePhoto("room", idx, e)}
                          title="Remove photo"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <ImageIcon className={styles.photoIcon} />
                        <p className={styles.photoText}>Add photo</p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className={styles.actionRow}>
          {onBack && (
            <button type="button" onClick={onBack} className={styles.backBtn}>
              Back
            </button>
          )}

          <button type="submit" className={styles.continueBtn}>
            <span>Continue</span>
            <ArrowRight className={styles.btnArrow} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default MediaGallery;
