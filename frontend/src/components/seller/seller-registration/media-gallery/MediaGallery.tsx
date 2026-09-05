"use client";

import React, { useState, useRef } from "react";
import { ImageIcon, ArrowRight, X } from "lucide-react";
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
    initialData?.kitchenPhotos || [null, null, null]
  );
  const [cuisinePhotos, setCuisinePhotos] = useState<(string | null)[]>(
    initialData?.cuisinePhotos || [null, null, null]
  );
  const [roomPhotos, setRoomPhotos] = useState<(string | null)[]>(
    initialData?.roomPhotos || [null, null, null]
  );

  const kitchenInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const cuisineInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const roomInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

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
      if (kitchenInputRefs[index].current) {
        kitchenInputRefs[index].current.value = "";
      }
    } else if (category === "cuisine") {
      setCuisinePhotos((prev) => {
        const next = [...prev];
        next[index] = null;
        return next;
      });
      if (cuisineInputRefs[index].current) {
        cuisineInputRefs[index].current.value = "";
      }
    } else {
      setRoomPhotos((prev) => {
        const next = [...prev];
        next[index] = null;
        return next;
      });
      if (roomInputRefs[index].current) {
        roomInputRefs[index].current.value = "";
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
    <div
      className={styles.cardContainer}
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 16,
        border: "1px solid #f1f5f9",
        boxShadow: "0 4px 25px -2px rgba(0, 0, 0, 0.04)",
        padding: "40px 48px 36px 48px",
        width: "100%",
        maxWidth: 700,
        margin: "0 auto 48px auto",
        boxSizing: "border-box",
      }}
    >
      {/* Header Group */}
      <div className={styles.headerGroup} style={{ marginBottom: 26 }}>
        <h2
          className={styles.title}
          style={{
            fontSize: "1.45rem",
            fontWeight: 700,
            color: "#0f172a",
            margin: "0 0 6px 0",
            letterSpacing: "-0.015em",
          }}
        >
          Media Assets & Gallery
        </h2>
        <p
          className={styles.subtitle}
          style={{
            fontSize: "0.88rem",
            color: "#64748b",
            margin: 0,
            lineHeight: 1.45,
          }}
        >
          Upload high-resolution photography showcasing your kitchen, cuisine, and rooms.
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* 1. Kitchen Photos (Min. 3) */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Kitchen Photos (Min. 3)</label>
          <div className={styles.photoGrid}>
            {[0, 1, 2].map((idx) => (
              <div key={idx}>
                <input
                  type="file"
                  ref={kitchenInputRefs[idx]}
                  onChange={(e) => handleFileUpload("kitchen", idx, e)}
                  accept="image/*"
                  className={styles.hiddenInput}
                />
                <div
                  className={styles.photoBox}
                  onClick={() => kitchenInputRefs[idx].current?.click()}
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
                        <X style={{ width: 14, height: 14 }} />
                      </button>
                    </>
                  ) : (
                    <>
                      <ImageIcon className={styles.photoIcon} />
                      <p className={styles.photoText}>Add photo</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Cuisine Photos (Min. 3) */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Cuisine Photos (Min. 3)</label>
          <div className={styles.photoGrid}>
            {[0, 1, 2].map((idx) => (
              <div key={idx}>
                <input
                  type="file"
                  ref={cuisineInputRefs[idx]}
                  onChange={(e) => handleFileUpload("cuisine", idx, e)}
                  accept="image/*"
                  className={styles.hiddenInput}
                />
                <div
                  className={styles.photoBox}
                  onClick={() => cuisineInputRefs[idx].current?.click()}
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
                        <X style={{ width: 14, height: 14 }} />
                      </button>
                    </>
                  ) : (
                    <>
                      <ImageIcon className={styles.photoIcon} />
                      <p className={styles.photoText}>Add photo</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Room Photos (Required for Properties) */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Room Photos (Required for Properties)</label>
          <div className={styles.photoGrid}>
            {[0, 1, 2].map((idx) => (
              <div key={idx}>
                <input
                  type="file"
                  ref={roomInputRefs[idx]}
                  onChange={(e) => handleFileUpload("room", idx, e)}
                  accept="image/*"
                  className={styles.hiddenInput}
                />
                <div
                  className={styles.photoBox}
                  onClick={() => roomInputRefs[idx].current?.click()}
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
                        <X style={{ width: 14, height: 14 }} />
                      </button>
                    </>
                  ) : (
                    <>
                      <ImageIcon className={styles.photoIcon} />
                      <p className={styles.photoText}>Add photo</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Bottom Action Row */}
        <div className={styles.actionRow}>
          {onBack ? (
            <button type="button" onClick={onBack} className={styles.backBtn}>
              Back
            </button>
          ) : (
            <div />
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
