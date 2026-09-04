"use client";

import React from "react";
import { MapPin, Plus, Check, Pencil, Trash2 } from "lucide-react";
import styles from "./DeliveryAddresses.module.css";

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
          onClick={onAddNewAddress}
          aria-label="Add New Address"
        >
          <Plus size={15} strokeWidth={3} />
          <span>Add New Address</span>
        </button>
      </div>

      {/* 2 Address Cards */}
      <div className={styles.addressesGrid}>
        {/* Card 1: HOME */}
        <div className={styles.addressBox}>
          <div>
            <div className={styles.addressTop}>
              <div className={styles.tagsRow}>
                <span className={styles.homeTag}>HOME</span>
                <span className={styles.defaultTag}>DEFAULT</span>
              </div>
              <Check size={18} strokeWidth={3} className={styles.checkIcon} />
            </div>

            <div className={styles.addressMiddle}>
              <div className={styles.mapThumb} />
              <div className={styles.addressDetails}>
                <h3 className={styles.recipientName}>Rahul Sharma</h3>
                <p className={styles.recipientPhone}>+91 98765 43210</p>
                <p className={styles.addressText}>
                  Flat 402, Shanti Vihar, Sector 58, Gurgaon, Haryana - 122011
                </p>
              </div>
            </div>
          </div>

          <div className={styles.addressBottom}>
            <button
              type="button"
              className={styles.mapLocationBtn}
              onClick={() => onSetLocationMap && onSetLocationMap("home")}
            >
              <MapPin size={14} />
              <span>Set Location on Map</span>
            </button>

            <div className={styles.actionIcons}>
              <button
                type="button"
                className={styles.iconActionBtn}
                onClick={() => onEditAddress && onEditAddress("home")}
                aria-label="Edit Home Address"
              >
                <Pencil size={15} />
              </button>
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={() => onDeleteAddress && onDeleteAddress("home")}
                aria-label="Delete Home Address"
              >
                <Trash2 size={14} color="#ef4444" />
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: OFFICE */}
        <div className={styles.addressBox}>
          <div>
            <div className={styles.addressTop}>
              <div className={styles.tagsRow}>
                <span className={styles.officeTag}>OFFICE</span>
              </div>
              <div className={styles.radioCircle} />
            </div>

            <div className={styles.addressMiddle}>
              <div className={styles.mapThumb} />
              <div className={styles.addressDetails}>
                <h3 className={styles.recipientName}>Rahul Sharma</h3>
                <p className={styles.recipientPhone}>+91 98765 43210</p>
                <p className={styles.addressText}>
                  Lumen Tech Corp, 5th Floor, Block C, Cyber City, Gurgaon, Haryana - 122002
                </p>
              </div>
            </div>
          </div>

          <div className={styles.addressBottom}>
            <button
              type="button"
              className={styles.mapLocationBtn}
              onClick={() => onSetLocationMap && onSetLocationMap("office")}
            >
              <MapPin size={14} />
              <span>Set Location on Map</span>
            </button>

            <div className={styles.actionIcons}>
              <button
                type="button"
                className={styles.iconActionBtn}
                onClick={() => onEditAddress && onEditAddress("office")}
                aria-label="Edit Office Address"
              >
                <Pencil size={15} />
              </button>
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={() => onDeleteAddress && onDeleteAddress("office")}
                aria-label="Delete Office Address"
              >
                <Trash2 size={14} color="#ef4444" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryAddresses;
