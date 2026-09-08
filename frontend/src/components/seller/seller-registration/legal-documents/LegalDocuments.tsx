"use client";

import React, { useState, useRef } from "react";
import {
  FileText,
  Shield,
  Zap,
  UploadCloud,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
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
    bankAccountNumber: initialData?.bankAccountNumber || "9876543210123",
    ifscCode: initialData?.ifscCode || "HDFC0001234",
  });

  const [dragActiveField, setDragActiveField] = useState<string | null>(null);

  const identityInputRef = useRef<HTMLInputElement>(null);
  const fssaiInputRef = useRef<HTMLInputElement>(null);
  const utilityInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (
    fileField: "identityProofFile" | "fssaiLicenseFile" | "utilityBillFile",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        [fileField]: file.name,
      }));
    }
  };

  const handleDragOver = (e: React.DragEvent, field: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveField(field);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveField(null);
  };

  const handleDrop = (
    e: React.DragEvent,
    field: "identityProofFile" | "fssaiLicenseFile" | "utilityBillFile"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveField(null);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        [field]: file.name,
      }));
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
    <div className={styles.cardContainer}>
      {/* Desktop Header Group (Desktop only) */}
      <div className={styles.desktopHeaderGroup}>
        <h2 className={styles.title}>Legal Documents & Verification</h2>
        <p className={styles.subtitle}>
          Upload valid certificates and configure payout banking parameters.
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* ========================================================= */}
        {/* MOBILE VIEW: Compact Card List (All with Upload Button)  */}
        {/* ========================================================= */}
        <div className={styles.mobileDocSection}>
          {/* 1. Identity proof (Aadhaar / PAN) */}
          <div className={styles.mobileDocCard}>
            <input
              type="file"
              ref={identityInputRef}
              onChange={(e) => handleFileSelect("identityProofFile", e)}
              accept=".pdf,.png,.jpg,.jpeg"
              className={styles.hiddenFileInput}
            />
            <div className={styles.mobileDocLeft}>
              <div className={styles.iconSquircle}>
                <FileText className={styles.docIcon} />
              </div>
              <div className={styles.mobileDocInfo}>
                <h3 className={styles.mobileDocTitle}>
                  Identity proof (Aadhaar / PAN)
                </h3>
                <span
                  className={
                    formData.identityProofFile
                      ? styles.statusSelected
                      : styles.statusMuted
                  }
                >
                  {formData.identityProofFile || "No file chosen"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => identityInputRef.current?.click()}
              className={styles.mobileUploadBtn}
            >
              Upload
            </button>
          </div>

          {/* 2. FSSAI License */}
          <div className={styles.mobileDocCard}>
            <input
              type="file"
              ref={fssaiInputRef}
              onChange={(e) => handleFileSelect("fssaiLicenseFile", e)}
              accept=".pdf,.png,.jpg,.jpeg"
              className={styles.hiddenFileInput}
            />
            <div className={styles.mobileDocLeft}>
              <div className={styles.iconSquircle}>
                <Shield className={styles.docIcon} />
              </div>
              <div className={styles.mobileDocInfo}>
                <h3 className={styles.mobileDocTitle}>FSSAI License</h3>
                <span
                  className={
                    formData.fssaiLicenseFile
                      ? styles.statusSelected
                      : styles.statusMuted
                  }
                >
                  {formData.fssaiLicenseFile || "No file chosen"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => fssaiInputRef.current?.click()}
              className={styles.mobileUploadBtn}
            >
              Upload
            </button>
          </div>

          {/* 3. Electricity bill */}
          <div className={styles.mobileDocCard}>
            <input
              type="file"
              ref={utilityInputRef}
              onChange={(e) => handleFileSelect("utilityBillFile", e)}
              accept=".pdf,.png,.jpg,.jpeg"
              className={styles.hiddenFileInput}
            />
            <div className={styles.mobileDocLeft}>
              <div className={styles.iconSquircle}>
                <Zap className={styles.docIcon} />
              </div>
              <div className={styles.mobileDocInfo}>
                <h3 className={styles.mobileDocTitle}>Electricity bill</h3>
                <span
                  className={
                    formData.utilityBillFile
                      ? styles.statusSelected
                      : styles.statusMuted
                  }
                >
                  {formData.utilityBillFile || "No file chosen"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => utilityInputRef.current?.click()}
              className={styles.mobileUploadBtn}
            >
              Upload
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* DESKTOP VIEW: Full Drag & Drop Large Upload Zones         */}
        {/* ========================================================= */}
        <div className={styles.desktopDocSection}>
          {/* 1. Identity Proof */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Identity Proof (Passport / Driver&apos;s License / Aadhaar){" "}
              <span className={styles.required}>*</span>
            </label>
            <div
              className={`${styles.dropzone} ${
                dragActiveField === "identityProofFile" ? styles.dropzoneActive : ""
              }`}
              onClick={() => identityInputRef.current?.click()}
              onDragOver={(e) => handleDragOver(e, "identityProofFile")}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, "identityProofFile")}
            >
              <UploadCloud className={styles.dropzoneIcon} />
              <p className={styles.dropzoneMainText}>
                {formData.identityProofFile ? (
                  <span className={styles.dropzoneSelectedFile}>
                    <CheckCircle2 size={16} color="#16a34a" />
                    Selected: {formData.identityProofFile}
                  </span>
                ) : (
                  "Click to upload or drag & drop"
                )}
              </p>
              <p className={styles.dropzoneSubText}>PDF, PNG, JPG up to 5MB</p>
            </div>
          </div>

          {/* 2. FSSAI License */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>FSSAI License</label>
            <div
              className={`${styles.dropzone} ${
                dragActiveField === "fssaiLicenseFile" ? styles.dropzoneActive : ""
              }`}
              onClick={() => fssaiInputRef.current?.click()}
              onDragOver={(e) => handleDragOver(e, "fssaiLicenseFile")}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, "fssaiLicenseFile")}
            >
              <UploadCloud className={styles.dropzoneIcon} />
              <p className={styles.dropzoneMainText}>
                {formData.fssaiLicenseFile ? (
                  <span className={styles.dropzoneSelectedFile}>
                    <CheckCircle2 size={16} color="#16a34a" />
                    Selected: {formData.fssaiLicenseFile}
                  </span>
                ) : (
                  "Click to upload or drag & drop"
                )}
              </p>
              <p className={styles.dropzoneSubText}>PDF, PNG, JPG up to 5MB</p>
            </div>
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
              Electricity Bill / Utility Statement{" "}
              <span className={styles.required}>*</span>
            </label>
            <div
              className={`${styles.dropzone} ${
                dragActiveField === "utilityBillFile" ? styles.dropzoneActive : ""
              }`}
              onClick={() => utilityInputRef.current?.click()}
              onDragOver={(e) => handleDragOver(e, "utilityBillFile")}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, "utilityBillFile")}
            >
              <UploadCloud className={styles.dropzoneIcon} />
              <p className={styles.dropzoneMainText}>
                {formData.utilityBillFile ? (
                  <span className={styles.dropzoneSelectedFile}>
                    <CheckCircle2 size={16} color="#16a34a" />
                    Selected: {formData.utilityBillFile}
                  </span>
                ) : (
                  "Click to upload or drag & drop"
                )}
              </p>
              <p className={styles.dropzoneSubText}>PDF, PNG, JPG up to 5MB</p>
            </div>
          </div>
        </div>


        {/* ========================================================= */}
        {/* BANKING DETAILS (Adaptive Grid for Web / Stack for Mobile)*/}
        {/* ========================================================= */}
        <div className={styles.bankingSection}>
          {/* Bank Account Number */}
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="bankAccountNumber">
              Bank account number <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="bankAccountNumber"
                name="bankAccountNumber"
                type="text"
                required
                placeholder="9876543210123"
                value={formData.bankAccountNumber}
                onChange={handleInputChange}
                className={styles.input}
              />
            </div>
          </div>

          {/* IFSC Code */}
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="ifscCode">
              IFSC code <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="ifscCode"
                name="ifscCode"
                type="text"
                required
                placeholder="HDFC0001234"
                value={formData.ifscCode}
                onChange={handleInputChange}
                className={styles.input}
                style={{ textTransform: "uppercase" }}
              />
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ACTION ROW: Desktop Inline Buttons / Mobile Fixed Bottom  */}
        {/* ========================================================= */}
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

export default LegalDocuments;
