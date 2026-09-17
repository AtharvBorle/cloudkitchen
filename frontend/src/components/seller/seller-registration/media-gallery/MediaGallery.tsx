"use client";

import React, { useState, useEffect } from "react";
import { Plus, X, ArrowRight, ImageIcon, AlertTriangle } from "lucide-react";
import styles from "./MediaGallery.module.css";
import {
  compressImageFile,
  saveSellerDraft,
  getSellerDraft,
} from "@/lib/seller-registration-store";

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

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

interface OversizeModalState {
  isOpen: boolean;
  fileName: string;
  fileSizeFormatted: string;
  categoryLabel: string;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  initialData,
  onContinue,
  onBack,
}) => {
  const [kitchenPhotos, setKitchenPhotos] = useState<(string | null)[]>(() => {
    const fromInit = initialData?.kitchenPhotos;
    if (fromInit && fromInit.length === 4) return fromInit;
    const fromDraft = getSellerDraft()?.kitchenPhotos;
    if (fromDraft && fromDraft.length === 4) return fromDraft;
    return [null, null, null, null];
  });

  const [cuisinePhotos, setCuisinePhotos] = useState<(string | null)[]>(() => {
    const fromInit = initialData?.cuisinePhotos;
    if (fromInit && fromInit.length === 4) return fromInit;
    const fromDraft = getSellerDraft()?.cuisinePhotos;
    if (fromDraft && fromDraft.length === 4) return fromDraft;
    return [null, null, null, null];
  });

  const [roomPhotos, setRoomPhotos] = useState<(string | null)[]>(() => {
    const fromInit = initialData?.roomPhotos;
    if (fromInit && fromInit.length === 2) return fromInit;
    const fromDraft = getSellerDraft()?.roomPhotos;
    if (fromDraft && fromDraft.length === 2) return fromDraft;
    return [null, null];
  });

  const [oversizeModal, setOversizeModal] = useState<OversizeModalState | null>(null);
  const [dragTarget, setDragTarget] = useState<string | null>(null);

  useEffect(() => {
    if (initialData?.kitchenPhotos && initialData.kitchenPhotos.some(Boolean)) {
      setKitchenPhotos(initialData.kitchenPhotos);
    }
    if (initialData?.cuisinePhotos && initialData.cuisinePhotos.some(Boolean)) {
      setCuisinePhotos(initialData.cuisinePhotos);
    }
    if (initialData?.roomPhotos && initialData.roomPhotos.some(Boolean)) {
      setRoomPhotos(initialData.roomPhotos);
    }
  }, [initialData]);

  const getCategoryLabel = (category: "kitchen" | "cuisine" | "room") => {
    if (category === "kitchen") return "Kitchen Photos";
    if (category === "cuisine") return "Cuisine Photos";
    return "Room Photos";
  };

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
      const file = fileArray[i];
      const targetIdx = startIndex + i;
      const maxSlots = category === "room" ? 2 : 4;
      if (targetIdx >= maxSlots) break;

      const sizeInMB = file.size / (1024 * 1024);
      const sizeFormatted = `${sizeInMB.toFixed(2)} MB`;

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setOversizeModal({
          isOpen: true,
          fileName: file.name,
          fileSizeFormatted: sizeFormatted,
          categoryLabel: getCategoryLabel(category),
        });
        continue;
      }

      try {
        const { dataUrl } = await compressImageFile(file, 1600, 1600, 0.85);
        if (category === "kitchen") {
          setKitchenPhotos((prev) => {
            const next = [...prev];
            next[targetIdx] = dataUrl;
            saveSellerDraft({ kitchenPhotos: next });
            return next;
          });
        } else if (category === "cuisine") {
          setCuisinePhotos((prev) => {
            const next = [...prev];
            next[targetIdx] = dataUrl;
            saveSellerDraft({ cuisinePhotos: next });
            return next;
          });
        } else {
          setRoomPhotos((prev) => {
            const next = [...prev];
            next[targetIdx] = dataUrl;
            saveSellerDraft({ roomPhotos: next });
            return next;
          });
        }
      } catch (err) {
        console.error("Error compressing media photo:", err);
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
        saveSellerDraft({ kitchenPhotos: next });
        return next;
      });
    } else if (category === "cuisine") {
      setCuisinePhotos((prev) => {
        const next = [...prev];
        next[index] = null;
        saveSellerDraft({ cuisinePhotos: next });
        return next;
      });
    } else {
      setRoomPhotos((prev) => {
        const next = [...prev];
        next[index] = null;
        saveSellerDraft({ roomPhotos: next });
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mediaPayload: MediaGalleryData = {
      kitchenPhotos,
      cuisinePhotos,
      roomPhotos,
    };
    saveSellerDraft(mediaPayload);
    if (onContinue) {
      onContinue(mediaPayload);
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

      {/* Oversize warning modal popup */}
      {oversizeModal?.isOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setOversizeModal(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalIconWrap}>
                <AlertTriangle className={styles.modalAlertIcon} size={28} />
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setOversizeModal(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <h3 className={styles.modalTitle}>Image Size Limit Exceeded</h3>
              <p className={styles.modalText}>
                The selected photo for{" "}
                <span className={styles.highlightText}>
                  {oversizeModal.categoryLabel}
                </span>{" "}
                is too large to upload.
              </p>

              <div className={styles.fileDetailCard}>
                <div className={styles.fileDetailRow}>
                  <span className={styles.fileDetailLabel}>Selected Image:</span>
                  <span className={styles.fileDetailValue} title={oversizeModal.fileName}>
                    {oversizeModal.fileName}
                  </span>
                </div>
                <div className={styles.fileDetailRow}>
                  <span className={styles.fileDetailLabel}>Detected Size:</span>
                  <span className={styles.fileSizeExceeded}>
                    {oversizeModal.fileSizeFormatted}
                  </span>
                </div>
                <div className={styles.fileDetailRow}>
                  <span className={styles.fileDetailLabel}>Max Allowed:</span>
                  <span className={styles.fileSizeLimit}>5.00 MB</span>
                </div>
              </div>

              <p className={styles.modalTip}>
                Please compress your image or select a photo under 5MB (PNG, JPG, WebP).
              </p>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.modalPrimaryBtn}
                onClick={() => setOversizeModal(null)}
              >
                Choose Another Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaGallery;
