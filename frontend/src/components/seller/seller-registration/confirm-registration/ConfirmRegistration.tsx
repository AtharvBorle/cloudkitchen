"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Check, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import styles from "./ConfirmRegistration.module.css";
import {
  getSellerDraft,
  hydrateSellerDraftAsync,
  SellerRegistrationDraft,
} from "@/lib/seller-registration-store";

export interface ConfirmRegistrationProps {
  draft?: Partial<SellerRegistrationDraft>;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onSubmit?: () => void;
  onBack?: () => void;
}

export const ConfirmRegistration: React.FC<ConfirmRegistrationProps> = ({
  draft: propDraft,
  isSubmitting = false,
  errorMessage = null,
  onSubmit,
  onBack,
}) => {
  const [liveDraft, setLiveDraft] = useState<SellerRegistrationDraft>(() => getSellerDraft());

  useEffect(() => {
    const current = getSellerDraft();
    setLiveDraft(current);

    hydrateSellerDraftAsync().then((hydrated) => {
      setLiveDraft((prev) => ({
        ...prev,
        ...hydrated,
      }));
    });
  }, [propDraft]);

  const activeDraft = { ...liveDraft, ...(propDraft || {}) };

  const cleanPhone = (activeDraft.phone || "").replace(/\D/g, "").slice(-10);
  const account = {
    ownerName: activeDraft.ownerName || "—",
    email: activeDraft.email || "—",
    phone: cleanPhone ? `+91 ${cleanPhone}` : "—",
  };

  const business = {
    name: activeDraft.businessName || "—",
    type:
      activeDraft.sellerType === "FOOD"
        ? "Food"
        : activeDraft.sellerType === "PROPERTY"
        ? "Property"
        : activeDraft.sellerType === "BOTH"
        ? "Both (Food & Property)"
        : "Food",
    cuisines:
      activeDraft.categories && activeDraft.categories.length > 0
        ? activeDraft.categories.join(", ")
        : "—",
    foodType:
      activeDraft.foodType === "BOTH"
        ? "Both (Veg & Non-veg)"
        : activeDraft.foodType === "PURE_VEG"
        ? "Pure Veg (includes Jain, and vegan foods)"
        : "Non-veg",
    address: activeDraft.address || "—",
    deliveryPin:
      activeDraft.locationCoordinates?.lat && activeDraft.locationCoordinates?.lng
        ? `📍 Pinned (${activeDraft.locationCoordinates.lat.toFixed(4)}, ${activeDraft.locationCoordinates.lng.toFixed(4)})`
        : "Standard Location",
  };

  const documents = {
    identityProof:
      activeDraft.identityProofFileName ||
      (activeDraft.identityProofDataUrl ? "Uploaded Identity Proof" : "Pending Upload"),
    fssaiLicense:
      activeDraft.fssaiLicenseFileName ||
      (activeDraft.fssaiLicenseDataUrl ? "Uploaded FSSAI License" : "Optional / Pending"),
    electricityBill:
      activeDraft.utilityBillFileName ||
      (activeDraft.utilityBillDataUrl ? "Uploaded Electricity Bill" : "Pending Upload"),
    bankAccountFull: activeDraft.bankAccountNumber || "—",
    ifscCode: activeDraft.ifscCode || "—",
  };

  // Collect all real uploaded preview images
  const allImages = [
    ...(activeDraft.kitchenPhotos || []),
    ...(activeDraft.cuisinePhotos || []),
    ...(activeDraft.roomPhotos || []),
  ].filter((src) => Boolean(src && src !== "data:image/present")) as string[];

  const previewImages = allImages.slice(0, 3);
  const remainingCount = Math.max(0, allImages.length - 3);

  return (
    <div className={styles.containerWrapper}>
      {errorMessage && (
        <div
          style={{
            backgroundColor: "#FEF2F2",
            border: "1px solid #F87171",
            borderRadius: "12px",
            padding: "14px 18px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
            color: "#991B1B",
            fontSize: "0.9rem",
            fontWeight: 500,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertCircle size={20} color="#DC2626" style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
          {(errorMessage.includes("exists") || errorMessage.includes("sign in") || errorMessage.includes("login")) && (
            <Link
              href="/seller/login"
              style={{
                backgroundColor: "#DC2626",
                color: "#FFFFFF",
                padding: "6px 14px",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.85rem",
              }}
            >
              Sign In Now
            </Link>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MOBILE VIEW: Distinct 4 Cards Stack with Submit Button    */}
      {/* ========================================================= */}
      <div className={styles.mobileReviewStack}>
        {/* Card 1: Account */}
        <div className={styles.mobileCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Account</h3>
            <Link href="/seller/account-information?from=review" className={styles.editLink}>
              Edit
            </Link>
          </div>
          <div className={styles.cardRows}>
            <div className={styles.mobileRow}>
              <span className={styles.rowKey}>Name</span>
              <span className={styles.rowValue}>{account.ownerName}</span>
            </div>
            <div className={styles.mobileRow}>
              <span className={styles.rowKey}>Email</span>
              <span className={styles.rowValue}>{account.email}</span>
            </div>
            <div className={styles.mobileRow}>
              <span className={styles.rowKey}>Phone</span>
              <span className={styles.rowValue}>{account.phone}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Business */}
        <div className={styles.mobileCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Business</h3>
            <Link href="/seller/business-information?from=review" className={styles.editLink}>
              Edit
            </Link>
          </div>
          <div className={styles.cardRows}>
            <div className={styles.mobileRow}>
              <span className={styles.rowKey}>Name</span>
              <span className={styles.rowValue}>{business.name}</span>
            </div>
            <div className={styles.mobileRow}>
              <span className={styles.rowKey}>Type</span>
              <span className={styles.rowValue}>{business.type}</span>
            </div>
            <div className={styles.mobileRow}>
              <span className={styles.rowKey}>Business Category</span>
              <span className={styles.rowValue}>{business.cuisines}</span>
            </div>
            <div className={styles.mobileRow}>
              <span className={styles.rowKey}>Delivery Pin</span>
              <span className={styles.rowValue}>{business.deliveryPin}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Documents */}
        <div className={styles.mobileCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Documents & Bank</h3>
            <Link href="/seller/legal-documents?from=review" className={styles.editLink}>
              Edit
            </Link>
          </div>
          <div className={styles.docCheckList}>
            <div className={styles.docCheckItem}>
              <Check className={styles.checkIcon} size={15} strokeWidth={2.6} />
              <span className={styles.docCheckText}>{documents.identityProof}</span>
            </div>
            <div className={styles.docCheckItem}>
              <Check className={styles.checkIcon} size={15} strokeWidth={2.6} />
              <span className={styles.docCheckText}>{documents.fssaiLicense}</span>
            </div>
            <div className={styles.docCheckItem}>
              <Check className={styles.checkIcon} size={15} strokeWidth={2.6} />
              <span className={styles.docCheckText}>{documents.electricityBill}</span>
            </div>
            {documents.bankAccountFull !== "—" && (
              <div className={styles.mobileRow} style={{ marginTop: "4px" }}>
                <span className={styles.rowKey}>Bank A/C</span>
                <span className={styles.rowValue}>{documents.bankAccountFull}</span>
              </div>
            )}
            {documents.ifscCode !== "—" && (
              <div className={styles.mobileRow}>
                <span className={styles.rowKey}>IFSC Code</span>
                <span className={styles.rowValue}>{documents.ifscCode}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 4: Media */}
        <div className={styles.mobileCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Media ({allImages.length} Photos)</h3>
            <Link href="/seller/media-gallery?from=review" className={styles.editLink}>
              Edit
            </Link>
          </div>
          <div className={styles.thumbnailsRow}>
            {previewImages.map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt={`Media thumbnail ${idx + 1}`}
                className={styles.thumbImage}
              />
            ))}
            {remainingCount > 0 && <div className={styles.thumbMoreSlot}>+{remainingCount}</div>}
            {allImages.length === 0 && <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>No photos uploaded</span>}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DESKTOP VIEW: Unified White Card with Review Sections     */}
      {/* ========================================================= */}
      <div className={styles.desktopCardContainer}>
        <div className={styles.desktopHeaderGroup}>
          <h2 className={styles.title}>Review & Confirm Registration</h2>
          <p className={styles.subtitle}>
            Please verify all entered credentials before submitting for review.
          </p>
        </div>

        <div className={styles.desktopSectionsList}>
          {/* 1. Account Details */}
          <div className={styles.sectionBlock}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Account Details</h3>
              <Link href="/seller/account-information?from=review" className={styles.editBtn}>
                Edit
              </Link>
            </div>
            <div className={styles.keyValueGrid}>
              <div className={styles.row}>
                <span className={styles.key}>Owner Name</span>
                <span className={styles.value}>{account.ownerName}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.key}>Email Address</span>
                <span className={styles.value}>{account.email}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.key}>Phone Number</span>
                <span className={styles.value}>{account.phone}</span>
              </div>
            </div>
          </div>

          {/* 2. Business Details */}
          <div className={styles.sectionBlock}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Business Details</h3>
              <Link href="/seller/business-information?from=review" className={styles.editBtn}>
                Edit
              </Link>
            </div>
            <div className={styles.keyValueGrid}>
              <div className={styles.row}>
                <span className={styles.key}>Company Name</span>
                <span className={styles.value}>{business.name}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.key}>Business Type</span>
                <span className={styles.value}>{business.type}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.key}>Food Type</span>
                <span className={styles.value}>{business.foodType}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.key}>Business Category</span>
                <span className={styles.value}>{business.cuisines}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.key}>Address</span>
                <span className={styles.value}>{business.address}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.key}>Delivery Pin</span>
                <span className={styles.value}>{business.deliveryPin}</span>
              </div>
            </div>
          </div>

          {/* 3. Legal Documents & Payout */}
          <div className={styles.sectionBlock}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Legal Documents & Payout</h3>
              <Link href="/seller/legal-documents?from=review" className={styles.editBtn}>
                Edit
              </Link>
            </div>
            <div className={styles.keyValueGrid}>
              <div className={styles.row}>
                <span className={styles.key}>Identity Proof</span>
                <span className={styles.value}>{documents.identityProof}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.key}>FSSAI License</span>
                <span className={styles.value}>{documents.fssaiLicense}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.key}>Electricity Bill</span>
                <span className={styles.value}>{documents.electricityBill}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.key}>Bank Account</span>
                <span className={styles.value}>{documents.bankAccountFull}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.key}>IFSC Code</span>
                <span className={styles.value}>{documents.ifscCode}</span>
              </div>
            </div>
          </div>

          {/* 4. Media */}
          <div className={styles.sectionBlock}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Media Assets ({allImages.length} Photos)</h3>
              <Link href="/seller/media-gallery?from=review" className={styles.editBtn}>
                Edit
              </Link>
            </div>
            <div className={styles.thumbnailsRow} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {previewImages.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`Media asset ${idx + 1}`}
                  className={styles.thumbImage}
                />
              ))}
              {remainingCount > 0 && <div className={styles.thumbMoreSlot}>+{remainingCount}</div>}
              {allImages.length === 0 && (
                <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>No photos uploaded yet</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ACTION CONTROLS: Desktop Inline / Mobile Fixed Bottom     */}
      {/* ========================================================= */}
      <div className={styles.actionRow}>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className={styles.backBtn}
            disabled={isSubmitting}
          >
            Back
          </button>
        )}

        <button
          type="button"
          onClick={onSubmit}
          className={styles.submitBtn}
          disabled={isSubmitting}
          style={{
            opacity: isSubmitting ? 0.7 : 1,
            cursor: isSubmitting ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Submitting Application...</span>
            </>
          ) : (
            <>
              <span>Submit for verification</span>
              <ArrowRight className={styles.btnArrow} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ConfirmRegistration;
