"use client";

import React, { useState, useRef } from "react";
import { Plus, X, ArrowRight, ImageIcon } from "lucide-react";
import styles from "./MediaGallery.module.css";

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
    initialData?.kitchenPhotos || [null, null, null, null]
  );
  const [cuisinePhotos, setCuisinePhotos] = useState<(string | null)[]>(
    initialData?.cuisinePhotos || [null, null, null, null]
  );
  const [roomPhotos, setRoomPhotos] = useState<(string | null)[]>(
    initialData?.roomPhotos || [null, null]
  );

  const kitchenRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const cuisineRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const roomRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const [dragTarget, setDragTarget] = useState<string | null>(null);

  const handleFileUpload = (
    category: "kitchen" | "cuisine" | "room",
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (category === "kitchen") {
        setKitchenPhotos((prev) => {
          const next = [...prev];
          next[index] = url;
          return next;
        });
      } else if (category === "cuisine") {
        setCuisinePhotos((prev) => {
          const next = [...prev];
          next[index] = url;
          return next;
        });
      } else {
        setRoomPhotos((prev) => {
          const next = [...prev];
          next[index] = url;
          return next;
        });
      }
    }
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

  const handleDropFile = (
    category: "kitchen" | "cuisine" | "room",
    index: number,
    e: React.DragEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragTarget(null);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      if (category === "kitchen") {
        setKitchenPhotos((prev) => {
          const next = [...prev];
          next[index] = url;
          return next;
        });
      } else if (category === "cuisine") {
        setCuisinePhotos((prev) => {
          const next = [...prev];
          next[index] = url;
          return next;
        });
      } else {
        setRoomPhotos((prev) => {
          const next = [...prev];
          next[index] = url;
          return next;
        });
      }
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
      if (kitchenRefs[index].current) {
        kitchenRefs[index].current.value = "";
      }
    } else if (category === "cuisine") {
      setCuisinePhotos((prev) => {
        const next = [...prev];
        next[index] = null;
        return next;
      });
      if (cuisineRefs[index].current) {
        cuisineRefs[index].current.value = "";
      }
    } else {
      setRoomPhotos((prev) => {
        const next = [...prev];
        next[index] = null;
        return next;
      });
      if (roomRefs[index].current) {
        roomRefs[index].current.value = "";
      }
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
                <div key={`kitchen-${idx}`} className={styles.slotWrapper}>
                  <input
                    type="file"
                    ref={kitchenRefs[idx]}
                    onChange={(e) => handleFileUpload("kitchen", idx, e)}
                    accept="image/*"
                    className={styles.hiddenInput}
                  />
                  <div
                    className={`${styles.mobileSlot} ${
                      idx === 0 && !kitchenPhotos[idx] ? styles.slotUploadActive : ""
                    }`}
                    onClick={() => kitchenRefs[idx].current?.click()}
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
                <div key={`cuisine-${idx}`} className={styles.slotWrapper}>
                  <input
                    type="file"
                    ref={cuisineRefs[idx]}
                    onChange={(e) => handleFileUpload("cuisine", idx, e)}
                    accept="image/*"
                    className={styles.hiddenInput}
                  />
                  <div
                    className={styles.mobileSlot}
                    onClick={() => cuisineRefs[idx].current?.click()}
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
                <div key={`room-${idx}`} className={styles.slotWrapper}>
                  <input
                    type="file"
                    ref={roomRefs[idx]}
                    onChange={(e) => handleFileUpload("room", idx, e)}
                    accept="image/*"
                    className={styles.hiddenInput}
                  />
                  <div
                    className={styles.mobileSlot}
                    onClick={() => roomRefs[idx].current?.click()}
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
                    onClick={() => kitchenRefs[idx].current?.click()}
                    onDragOver={(e) => handleDragOver(e, key)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDropFile("kitchen", idx, e)}
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
                    onClick={() => cuisineRefs[idx].current?.click()}
                    onDragOver={(e) => handleDragOver(e, key)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDropFile("cuisine", idx, e)}
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
                    onClick={() => roomRefs[idx].current?.click()}
                    onDragOver={(e) => handleDragOver(e, key)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDropFile("room", idx, e)}
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
