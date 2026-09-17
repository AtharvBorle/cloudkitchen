"use client";

import React from "react";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import styles from "./ConfirmRegistration.module.css";

export interface ConfirmRegistrationData {
  account?: {
    ownerName?: string;
    email?: string;
    phone?: string;
    sellerRole?: string;
  };
  business?: {
    name?: string;
    type?: string;
    cuisines?: string;
    address?: string;
  };
  documents?: {
    identityProof?: string;
    fssaiLicense?: string;
    electricityBill?: string;
    bankAccountNumber?: string;
    ifscCode?: string;
  };
  media?: {
    photosCount?: number;
    previewThumbnails?: (string | null)[];
  };
}

import {
  getSellerRegistrationDraft,
  SellerRegistrationDraft,
} from "@/utils/sellerRegistrationDraft";

export interface ConfirmRegistrationProps {
  data?: Partial<ConfirmRegistrationData>;
  onSubmit?: () => void;
  onBack?: () => void;
}

export const ConfirmRegistration: React.FC<ConfirmRegistrationProps> = ({
  data,
  onSubmit,
  onBack,
}) => {
  const [draft, setDraft] = React.useState<SellerRegistrationDraft>(() =>
    getSellerRegistrationDraft()
  );

  React.useEffect(() => {
    setDraft(getSellerRegistrationDraft());
  }, [data]);

  const account = {
    ownerName: data?.account?.ownerName || draft.account.ownerName || "—",
    email: data?.account?.email || draft.account.email || "—",
    phone:
      data?.account?.phone ||
      (draft.account.phone
        ? draft.account.phone.startsWith("+91")
          ? draft.account.phone
          : `+91 ${draft.account.phone}`
        : "—"),
    sellerRole: data?.account?.sellerRole || draft.account.sellerRole || "Owner",
  };

  const business = {
    name: data?.business?.name || draft.business.businessName || "—",
    type: data?.business?.type || draft.business.sellerType || "FOOD",
    cuisines:
      data?.business?.cuisines ||
      (draft.business.categories && draft.business.categories.length > 0
        ? draft.business.categories.join(", ")
        : "—"),
    address: data?.business?.address || draft.business.address || "—",
  };

  const documents = {
    identityProof:
      data?.documents?.identityProof ||
      draft.documents.identityProofFile ||
      "Identity Proof (Aadhaar/PAN)",
    fssaiLicense:
      data?.documents?.fssaiLicense ||
      draft.documents.fssaiLicenseFile ||
      "FSSAI License",
    electricityBill:
      data?.documents?.electricityBill ||
      draft.documents.utilityBillFile ||
      "Electricity Bill",
    bankAccountNumber:
      data?.documents?.bankAccountNumber ||
      draft.documents.bankAccountNumber ||
      "",
    ifscCode:
      data?.documents?.ifscCode ||
      draft.documents.ifscCode ||
      "",
  };

  const media = {
    photosCount: data?.media?.photosCount ?? draft.media.photosCount ?? 0,
    previewThumbnails:
      data?.media?.previewThumbnails ||
      draft.media.previewThumbnails || [null, null, null],
  };

  return (
    <div className={styles.containerWrapper}>
      {/* ========================================================= */}
      {/* MOBILE VIEW: Distinct 4 Cards Stack with Submit Button    */}
      {/* ========================================================= */}
      <div className={styles.mobileReviewStack}>
        {/* Card 1: Account */}
        <div className={styles.mobileCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Account</h3>
            <Link href="/seller/account-information" className={styles.editLink}>
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
            <Link href="/seller/business-information" className={styles.editLink}>
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
              <span className={styles.rowKey}>Cuisines</span>
              <span className={styles.rowValue}>{business.cuisines}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Documents */}
        <div className={styles.mobileCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Legal Documents & Payout</h3>
            <Link href="/seller/legal-documents" className={styles.editLink}>
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
            {documents.bankAccountNumber && (
              <div className={styles.mobileRow} style={{ marginTop: "4px" }}>
                <span className={styles.rowKey}>A/C:</span>
                <span className={styles.rowValue}>{documents.bankAccountNumber}</span>
              </div>
            )}
            {documents.ifscCode && (
              <div className={styles.mobileRow}>
                <span className={styles.rowKey}>IFSC:</span>
                <span className={styles.rowValue}>{documents.ifscCode}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 4: Media */}
        <div className={styles.mobileCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Media</h3>
            <Link href="/seller/media-gallery" className={styles.editLink}>
              Edit
            </Link>
          </div>
          <div className={styles.thumbnailsRow}>
            {media.previewThumbnails.map((thumb, idx) =>
              thumb ? (
                <img
                  key={idx}
                  src={thumb}
                  alt="Upload thumbnail"
                  className={styles.thumbImage}
                />
              ) : (
                <div key={idx} className={styles.thumbPlaceholder} />
              )
            )}
            <div className={styles.thumbMoreSlot}>
              +{media.photosCount > 3 ? media.photosCount - 3 : 0}
            </div>
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
              <Link href="/seller/account-information" className={styles.editBtn}>
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
              <Link href="/seller/business-information" className={styles.editBtn}>
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
                <span className={styles.key}>Cuisines / Categories</span>
                <span className={styles.value}>{business.cuisines}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.key}>Address</span>
                <span className={styles.value}>{business.address}</span>
              </div>
            </div>
          </div>

          {/* 3. Legal Documents */}
          <div className={styles.sectionBlock}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Legal Documents & Bank Details</h3>
              <Link href="/seller/legal-documents" className={styles.editBtn}>
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
              {documents.bankAccountNumber && (
                <div className={styles.row}>
                  <span className={styles.key}>Bank Account</span>
                  <span className={styles.value}>{documents.bankAccountNumber}</span>
                </div>
              )}
              {documents.ifscCode && (
                <div className={styles.row}>
                  <span className={styles.key}>IFSC Code</span>
                  <span className={styles.value}>{documents.ifscCode}</span>
                </div>
              )}
            </div>
          </div>

          {/* 4. Media */}
          <div className={styles.sectionBlock}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Media Assets</h3>
              <Link href="/seller/media-gallery" className={styles.editBtn}>
                Edit
              </Link>
            </div>
            <div className={styles.thumbnailsRow}>
              {media.previewThumbnails.map((thumb, idx) =>
                thumb ? (
                  <img
                    key={idx}
                    src={thumb}
                    alt="Upload thumbnail"
                    className={styles.thumbImage}
                  />
                ) : (
                  <div key={idx} className={styles.thumbPlaceholder} />
                )
              )}
              <div className={styles.thumbMoreSlot}>
                +{media.photosCount > 3 ? media.photosCount - 3 : 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ACTION CONTROLS: Desktop Inline / Mobile Fixed Bottom     */}
      {/* ========================================================= */}
      <div className={styles.actionRow}>
        {onBack && (
          <button type="button" onClick={onBack} className={styles.backBtn}>
            Back
          </button>
        )}

        <button
          type="button"
          onClick={onSubmit}
          className={styles.submitBtn}
        >
          <span>Submit for verification</span>
          <ArrowRight className={styles.btnArrow} />
        </button>
      </div>
    </div>
  );
};

export default ConfirmRegistration;
