"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import styles from "./ConfirmRegistration.module.css";

export interface ConfirmRegistrationData {
  account: {
    ownerName: string;
    email: string;
    phone: string;
    sellerRole: string;
  };
  business: {
    companyName: string;
    businessType: string;
    industryCategory: string;
    headquartersAddress: string;
  };
  legal: {
    businessLicense: string;
    fssaiCertificate: string;
    taxClearanceCopy: string;
  };
  media: {
    uploadedPhotos: string;
    coverVideoHighlight: string;
  };
}

export interface ConfirmRegistrationProps {
  data?: Partial<ConfirmRegistrationData>;
  onSubmit?: () => void;
  onBack?: () => void;
}

const DEFAULT_REVIEW_DATA: ConfirmRegistrationData = {
  account: {
    ownerName: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 000-0000",
    sellerRole: "Owner",
  },
  business: {
    companyName: "Neo Cloud Room Solutions LLC",
    businessType: "Cloud Co-Working Operator",
    industryCategory: "Real Estate & Shared Workspaces",
    headquartersAddress: "451 Innovation Way, Suite 300, New York, NY 10001",
  },
  legal: {
    businessLicense: "Business_License_2024.pdf",
    fssaiCertificate: "FSSAI_Certificate_No_847.pdf",
    taxClearanceCopy: "IRS_Tax_Form_W9.pdf",
  },
  media: {
    uploadedPhotos: "5 files (Entrance, Lounge, Hot Desks, Boardroom, Tech Closet)",
    coverVideoHighlight: "NeoCloudRoom_Walkthrough.mp4",
  },
};

export const ConfirmRegistration: React.FC<ConfirmRegistrationProps> = ({
  data,
  onSubmit,
  onBack,
}) => {
  const reviewData: ConfirmRegistrationData = {
    account: { ...DEFAULT_REVIEW_DATA.account, ...data?.account },
    business: { ...DEFAULT_REVIEW_DATA.business, ...data?.business },
    legal: { ...DEFAULT_REVIEW_DATA.legal, ...data?.legal },
    media: { ...DEFAULT_REVIEW_DATA.media, ...data?.media },
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
          Review & Confirm Registration
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
          Please verify all entered credentials before submitting for review.
        </p>
      </div>

      <div className={styles.sectionsList}>
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
              <span className={styles.value}>{reviewData.account.ownerName}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.key}>Email Address</span>
              <span className={styles.value}>{reviewData.account.email}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.key}>Phone Number</span>
              <span className={styles.value}>{reviewData.account.phone}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.key}>Seller Role</span>
              <span className={styles.value}>{reviewData.account.sellerRole}</span>
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
              <span className={styles.value}>{reviewData.business.companyName}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.key}>Business Type</span>
              <span className={styles.value}>{reviewData.business.businessType}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.key}>Industry Category</span>
              <span className={styles.value}>{reviewData.business.industryCategory}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.key}>Headquarters Address</span>
              <span className={styles.value}>{reviewData.business.headquartersAddress}</span>
            </div>
          </div>
        </div>

        {/* 3. Legal Documents */}
        <div className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Legal Documents</h3>
            <Link href="/seller/legal-documents" className={styles.editBtn}>
              Edit
            </Link>
          </div>
          <div className={styles.keyValueGrid}>
            <div className={styles.row}>
              <span className={styles.key}>Business License</span>
              <span className={styles.value}>{reviewData.legal.businessLicense}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.key}>FSSAI Certificate</span>
              <span className={styles.value}>{reviewData.legal.fssaiCertificate}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.key}>Tax Clearance Copy</span>
              <span className={styles.value}>{reviewData.legal.taxClearanceCopy}</span>
            </div>
          </div>
        </div>

        {/* 4. Media */}
        <div className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Media</h3>
            <Link href="/seller/media-gallery" className={styles.editBtn}>
              Edit
            </Link>
          </div>
          <div className={styles.keyValueGrid}>
            <div className={styles.row}>
              <span className={styles.key}>Uploaded Photos</span>
              <span className={styles.value}>{reviewData.media.uploadedPhotos}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.key}>Cover Video Highlight</span>
              <span className={styles.value}>{reviewData.media.coverVideoHighlight}</span>
            </div>
          </div>
        </div>

        {/* 5. Bottom Action Row */}
        <div className={styles.actionRow}>
          {onBack ? (
            <button type="button" onClick={onBack} className={styles.backBtn}>
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onSubmit}
            className={styles.submitBtn}
          >
            <span>Submit for Verification</span>
            <ArrowRight className={styles.btnArrow} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmRegistration;
