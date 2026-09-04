"use client";

import React, { useState } from "react";
import styles from "./SavedAddresses.module.css";
import { Pencil, Trash2 } from "lucide-react";

export interface AddressItem {
  id: string;
  tag: string;
  isDefault?: boolean;
  recipientName: string;
  recipientPhone: string;
  addressLines: string;
  mapType: "home" | "office";
}

const DEFAULT_ADDRESSES: AddressItem[] = [
  {
    id: "home",
    tag: "HOME",
    isDefault: true,
    recipientName: "Rahul Sharma",
    recipientPhone: "+91 98765 43210",
    addressLines: "Flat 402, Shanti Vihar, Sector 56, Gurgaon, Haryana - 122011",
    mapType: "home",
  },
  {
    id: "office",
    tag: "OFFICE",
    isDefault: false,
    recipientName: "Rahul Sharma",
    recipientPhone: "+91 98765 43210",
    addressLines: "Lumen Tech Corp, 5th Floor, Block C, Cyber City, Gurgaon, Haryana",
    mapType: "office",
  },
];

export const SavedAddresses: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>("home");
  const [addresses, setAddresses] = useState<AddressItem[]>(DEFAULT_ADDRESSES);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAddresses((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className={styles.addressesGrid}>
      {addresses.map((addr) => {
        const isSelected = selectedId === addr.id;

        return (
          <div
            key={addr.id}
            className={`${styles.addressCard} ${
              isSelected ? styles.cardSelected : ""
            }`}
            onClick={() => setSelectedId(addr.id)}
          >
            {/* Top Row: Tags + Radio Selector */}
            <div className={styles.topRow}>
              <div className={styles.tagsGroup}>
                {addr.tag === "HOME" ? (
                  <span className={styles.homeTag}>HOME</span>
                ) : (
                  <span className={styles.officeTag}>OFFICE</span>
                )}
                {addr.isDefault && (
                  <span className={styles.defaultTag}>DEFAULT</span>
                )}
              </div>

              {/* Radio Indicator */}
              <div
                className={`${styles.radioOuter} ${
                  isSelected ? styles.radioSelected : ""
                }`}
              >
                {isSelected && <div className={styles.radioInner} />}
              </div>
            </div>

            {/* Middle Row: Map Thumbnail + Details */}
            <div className={styles.middleRow}>
              {addr.mapType === "home" ? (
                <div className={styles.homeMapThumbnail}>
                  <svg
                    viewBox="0 0 100 90"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={styles.mapSvg}
                  >
                    {/* Perspective grid / road lines */}
                    <path
                      d="M15 65C30 58 70 72 85 65"
                      stroke="#CBD5E1"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M20 70C35 63 65 77 80 70"
                      stroke="#E2E8F0"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M30 58L50 72M70 58L50 72"
                      stroke="#E2E8F0"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    {/* Ground shadow */}
                    <ellipse cx="50" cy="66" rx="9" ry="3.5" fill="#E2E8F0" />
                    {/* Orange location pin */}
                    <path
                      d="M50 32C44.4772 32 40 36.4772 40 42C40 49 50 63 50 63C50 63 60 49 60 42C60 36.4772 55.5228 32 50 32Z"
                      fill="#F97316"
                    />
                    <circle cx="50" cy="42" r="4.5" fill="#FFFFFF" />
                  </svg>
                </div>
              ) : (
                <div className={styles.officeMapThumbnail}>
                  <svg
                    viewBox="0 0 100 90"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={styles.mapSvg}
                  >
                    {/* Block map background */}
                    <rect width="100" height="90" rx="14" fill="#E2E8F0" />
                    {/* Road grid */}
                    <path
                      d="M0 20L100 80M100 20L0 80M0 50L100 50M50 0L50 90"
                      stroke="#FFFFFF"
                      strokeWidth="8"
                    />
                    {/* Ground shadow */}
                    <ellipse cx="50" cy="58" rx="10" ry="4" fill="#94A3B8" opacity="0.4" />
                    {/* Blue location pin */}
                    <path
                      d="M50 24C44.4772 24 40 28.4772 40 34C40 41 50 55 50 55C50 55 60 41 60 34C60 28.4772 55.5228 24 50 24Z"
                      fill="#0284C7"
                    />
                    <circle cx="50" cy="34" r="4.5" fill="#FFFFFF" />
                  </svg>
                </div>
              )}

              <div className={styles.addressInfo}>
                <h4 className={styles.recipientName}>{addr.recipientName}</h4>
                <p className={styles.recipientPhone}>{addr.recipientPhone}</p>
                <p className={styles.addressLines}>{addr.addressLines}</p>
              </div>
            </div>

            {/* Bottom Row: Set Location on Map + Actions (Pencil & Trash) */}
            <div className={styles.bottomRow}>
              <button
                type="button"
                className={`${styles.setLocationBtn} ${
                  isSelected ? styles.setLocationActive : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={styles.setPinSvg}
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Set Location on Map</span>
              </button>

              <div className={styles.actionButtons}>
                <button
                  type="button"
                  className={styles.editBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  aria-label={`Edit ${addr.tag} address`}
                >
                  <Pencil size={15} strokeWidth={2.4} className={styles.pencilIcon} />
                </button>

                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={(e) => handleDelete(addr.id, e)}
                  aria-label={`Delete ${addr.tag} address`}
                >
                  <Trash2 size={15} strokeWidth={2.4} className={styles.trashIcon} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};