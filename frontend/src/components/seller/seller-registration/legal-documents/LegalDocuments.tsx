"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, AlertCircle, ArrowRight } from "lucide-react";
import styles from "./LegalDocuments.module.css";

export interface LegalDocumentsData {
  identityProofFile?: string;
  fssaiLicenseFile?: string;
  utilityBillFile?: string;
  bankAccountNumber: string;
  ifscCode: string;
}

export interface LegalDocumentsProps {
  initialData?: Partial<LegalDocumentsData>;
  onContinue?: (data: LegalDocumentsData) => void;
  onBack?: () => void;
}

export const LegalDocuments: React.FC<LegalDocumentsProps> = ({
  initialData,
  onContinue,
  onBack,
}) => {
  const [formData, setFormData] = useState<LegalDocumentsData>({
    identityProofFile: initialData?.identityProofFile || "",
    fssaiLicenseFile: initialData?.fssaiLicenseFile || "",
    utilityBillFile: initialData?.utilityBillFile || "",
    bankAccountNumber: initialData?.bankAccountNumber || "",
    ifscCode: initialData?.ifscCode || "",
  });

  const identityInputRef = useRef<HTMLInputElement>(null);
  const fssaiInputRef = useRef<HTMLInputElement>(null);
  const utilityInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (
    field: keyof LegalDocumentsData,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, [field]: file.name }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onContinue) {
      onContinue(formData);
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
          Legal Documents & Verification
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
          Upload valid certificates and configure payout banking parameters.
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* 1. Identity Proof */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            Identity Proof (Passport / Driver's License) <span className={styles.required}>*</span>
          </label>
          <input
            type="file"
            ref={identityInputRef}
            onChange={(e) => handleFileChange("identityProofFile", e)}
            accept=".pdf,.png,.jpg,.jpeg"
            className={styles.hiddenFileInput}
          />
          <div
            className={styles.dropzone}
            onClick={() => identityInputRef.current?.click()}
          >
            <UploadCloud className={styles.dropzoneIcon} />
            <p className={styles.dropzoneMainText}>
              {formData.identityProofFile
                ? `Selected: ${formData.identityProofFile}`
                : "Click to upload or drag & drop"}
            </p>
            <p className={styles.dropzoneSubText}>PDF, PNG, JPG up to 5MB</p>
          </div>
        </div>

        {/* 2. FSSAI License */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>FSSAI License</label>
          <input
            type="file"
            ref={fssaiInputRef}
            onChange={(e) => handleFileChange("fssaiLicenseFile", e)}
            accept=".pdf,.png,.jpg,.jpeg"
            className={styles.hiddenFileInput}
          />
          <div
            className={styles.dropzone}
            onClick={() => fssaiInputRef.current?.click()}
          >
            <UploadCloud className={styles.dropzoneIcon} />
            <p className={styles.dropzoneMainText}>
              {formData.fssaiLicenseFile
                ? `Selected: ${formData.fssaiLicenseFile}`
                : "Click to upload or drag & drop"}
            </p>
            <p className={styles.dropzoneSubText}>PDF, PNG, JPG up to 5MB</p>
          </div>

          {/* Mandatory Notice */}
          <div className={styles.noticeBox}>
            <AlertCircle className={styles.noticeIcon} />
            <span className={styles.noticeText}>
              Mandatory for partners offering Food and Cloud Kitchen services.
            </span>
          </div>
        </div>

        {/* 3. Electricity Bill / Utility Statement */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            Electricity Bill / Utility Statement <span className={styles.required}>*</span>
          </label>
          <input
            type="file"
            ref={utilityInputRef}
            onChange={(e) => handleFileChange("utilityBillFile", e)}
            accept=".pdf,.png,.jpg,.jpeg"
            className={styles.hiddenFileInput}
          />
          <div
            className={styles.dropzone}
            onClick={() => utilityInputRef.current?.click()}
          >
            <UploadCloud className={styles.dropzoneIcon} />
            <p className={styles.dropzoneMainText}>
              {formData.utilityBillFile
                ? `Selected: ${formData.utilityBillFile}`
                : "Click to upload or drag & drop"}
            </p>
            <p className={styles.dropzoneSubText}>PDF, PNG, JPG up to 5MB</p>
          </div>
        </div>

        {/* 4. Bank Account & IFSC Code */}
        <div className={styles.twoColGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="bankAccountNumber">
              Bank Account Number <span className={styles.required}>*</span>
            </label>
            <input
              id="bankAccountNumber"
              name="bankAccountNumber"
              type="text"
              required
              placeholder="Enter account number"
              value={formData.bankAccountNumber}
              onChange={handleInputChange}
              className={styles.input}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="ifscCode">
              IFSC Code <span className={styles.required}>*</span>
            </label>
            <input
              id="ifscCode"
              name="ifscCode"
              type="text"
              required
              placeholder="e.g. NEOB0123456"
              value={formData.ifscCode}
              onChange={handleInputChange}
              className={styles.input}
              style={{ textTransform: "uppercase" }}
            />
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

          <button type="submit" className={styles.continueBtn}>
            <span>Continue</span>
            <ArrowRight className={styles.btnArrow} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default LegalDocuments;
