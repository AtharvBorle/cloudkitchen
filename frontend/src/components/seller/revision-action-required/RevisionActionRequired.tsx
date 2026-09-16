"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Upload, AlertCircle, CheckCircle2, AlertTriangle, X } from "lucide-react";
import styles from "./RevisionActionRequired.module.css";
import { validateFileSize } from "@/lib/file-validation";

export interface RevisionActionRequiredProps {
  initialAddress?: string;
  initialFssaiFile?: string;
  trackingId?: string;
  onResubmit?: (data: { businessAddress: string; fssaiFile: File | null }) => void;
}

export const RevisionActionRequired: React.FC<RevisionActionRequiredProps> = ({
  initialAddress = "Shop No. 12, Sector 4, HSR Layout, Bangalore, Karnataka - 560102",
  initialFssaiFile = "FSSAI_Certificate_No_847.pdf",
  trackingId = "NCR-2026-0847",
  onResubmit,
}) => {
  const [address, setAddress] = useState(initialAddress);
  const [fssaiFile, setFssaiFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState(initialFssaiFile);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileSizeFormatted, setFileSizeFormatted] = useState<string>("");
  const [showOversizeModal, setShowOversizeModal] = useState(false);

  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File | undefined) => {
    if (!file) return;
    const result = validateFileSize(file);
    if (!result.isValid) {
      setFileError(result.errorMessage || "File exceeds 5MB size limit.");
      setFileSizeFormatted(result.sizeFormatted);
      setShowOversizeModal(true);
      const inputEl = document.getElementById("fssai-reupload-input") as HTMLInputElement;
      if (inputEl) inputEl.value = "";
      return;
    }
    setFileError(null);
    setFssaiFile(file);
    setFileName(file.name);
    setFileSizeFormatted(result.sizeFormatted);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const handleTriggerUpload = () => {
    document.getElementById("fssai-reupload-input")?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onResubmit) {
      onResubmit({ businessAddress: address, fssaiFile });
    }
  };

  return (
    <div className={styles.container}>
      {/* Hidden File Input for Re-upload */}
      <input
        id="fssai-reupload-input"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: "none" }}
        onChange={handleFileUpload}
      />

      {/* ========================================================================= */}
      {/* 1. DESKTOP VIEW                                                           */}
      {/* ========================================================================= */}
      <div className={styles.desktopOnly}>
        {/* Red Alert Banner */}
        <div className={styles.alertCard}>
          <div className={styles.alertIconCircle}>!</div>
          <div className={styles.alertContent}>
            <h3 className={styles.alertTitle}>Revision Action Required</h3>
            <p className={styles.alertDescription}>
              Administrative review failed due to incomplete parameters. Please address the following flags:
            </p>
            <ul className={styles.flagList}>
              <li className={styles.flagItem}>
                <strong>FSSAI Document:</strong> Re-upload required. Current file is blurry and the license number cannot be read.
              </li>
              <li className={styles.flagItem}>
                <strong>Business Address:</strong> Mismatch detected. Correct address is required to match your legal incorporation registry.
              </li>
            </ul>
          </div>
        </div>

        {/* Main Desktop Form Card */}
        <form className={styles.formCard} onSubmit={handleSubmit}>
          <div className={styles.headerGroup}>
            <h2 className={styles.title}>Correct Flagged Information</h2>
            <p className={styles.subtitle}>
              Submit the requested modifications to resume verification.
            </p>
          </div>

          <div className={styles.formSection}>
            {/* Field 1: FSSAI Certificate Re-upload */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                FSSAI Certificate Re-upload <span className={styles.requiredStar}>*</span>
              </label>
              <div
                className={`${styles.flaggedUploadBox} ${
                  fssaiFile
                    ? styles.flaggedUploadBoxSuccess
                    : fileError
                    ? styles.flaggedUploadBoxError
                    : isDragging
                    ? styles.flaggedUploadBoxDragging
                    : ""
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className={styles.flaggedFileText}>
                  {fssaiFile ? (
                    <span className={styles.successTag}>
                      <CheckCircle2 size={13} /> READY ({fileSizeFormatted})
                    </span>
                  ) : (
                    <span className={styles.flagTag}>[FLAGGED_BLURRY]</span>
                  )}
                  <span className={styles.fileName}>{fileName}</span>
                </div>
                <button
                  type="button"
                  className={styles.reuploadBtn}
                  onClick={handleTriggerUpload}
                >
                  {fssaiFile ? "Change" : "Re-upload"}
                </button>
              </div>
              {fileError ? (
                <p className={styles.errorHelperText}>{fileError}</p>
              ) : (
                <p className={styles.helperText}>
                  FSSAI certificate document must be a high-resolution scanned PDF or JPG under 5MB.
                </p>
              )}
            </div>

            {/* Field 2: Correct Business Address */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Correct Business Address <span className={styles.requiredStar}>*</span>
              </label>
              <input
                type="text"
                className={styles.flaggedInput}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter correct business address"
                required
              />
              <p className={styles.helperText}>
                Must match perfectly with your NY State Business filing database registry records.
              </p>
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.actionFooter}>
            <Link href="/seller/verification-status" className={styles.backBtn}>
              Back to Status
            </Link>
            <button type="submit" className={styles.submitBtn}>
              <span>Resubmit for Verification</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE VIEW                                                            */}
      {/* ========================================================================= */}
      <form className={styles.mobileOnly} onSubmit={handleSubmit}>
        {/* Amber Notification Card */}
        <div className={styles.mobileAlertBanner}>
          <div className={styles.mobileAlertIconCircle}>
            <AlertCircle size={18} className={styles.mobileAlertIcon} />
          </div>
          <p className={styles.mobileAlertText}>
            Please re-upload a clearer copy of your FSSAI license and update your business address.
          </p>
        </div>

        {/* Mobile Field 1: FSSAI License */}
        <div className={styles.mobileFieldGroup}>
          <label className={styles.mobileLabel}>
            FSSAI License <span className={styles.mobileRequiredStar}>*</span>
          </label>
          <div
            className={`${styles.mobileDropzoneBox} ${
              fssaiFile
                ? styles.mobileDropzoneSuccess
                : fileError
                ? styles.mobileDropzoneError
                : isDragging
                ? styles.mobileDropzoneBoxDragging
                : ""
            }`}
            onClick={handleTriggerUpload}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
          >
            {fssaiFile ? (
              <CheckCircle2 size={28} className={styles.mobileSuccessIcon} />
            ) : (
              <Upload size={28} strokeWidth={1.7} className={styles.mobileUploadIcon} />
            )}
            <span className={styles.mobileUploadTitle}>
              {fssaiFile ? fssaiFile.name : "Click to re-upload license"}
            </span>
            <span className={styles.mobileUploadSubtitle}>
              {fssaiFile ? `Valid File (${fileSizeFormatted}) • Click to change` : "PDF, PNG or JPG (Max 5MB)"}
            </span>
          </div>
          {fileError ? (
            <p className={styles.mobileErrorHelper}>{fileError}</p>
          ) : (
            <p className={styles.mobileErrorHelper}>
              File is blurry. Please capture document under clear light.
            </p>
          )}
        </div>

        {/* Mobile Field 2: Business Address */}
        <div className={styles.mobileFieldGroup}>
          <label className={styles.mobileLabel}>
            Business Address <span className={styles.mobileRequiredStar}>*</span>
          </label>
          <textarea
            className={styles.mobileTextarea}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            placeholder="Enter full address"
            required
          />
          <p className={styles.mobileErrorHelper}>
            Please enter full address including landmark and exact pincode.
          </p>
        </div>

        {/* Fixed Mobile Bottom Action Bar */}
        <div className={styles.mobileBottomActionBar}>
          <button type="submit" className={styles.mobileSubmitBtn}>
            Resubmit
          </button>
        </div>
      </form>

      {/* Oversize warning modal popup */}
      {showOversizeModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowOversizeModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalIconWrap}>
                <AlertTriangle className={styles.modalAlertIcon} size={28} />
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowOversizeModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <h3 className={styles.modalTitle}>File Size Limit Exceeded</h3>
              <p className={styles.modalText}>
                The selected FSSAI certificate is larger than the 5MB upload limit.
              </p>
              <div className={styles.fileDetailCard}>
                <div className={styles.fileDetailRow}>
                  <span className={styles.fileDetailLabel}>Detected Size:</span>
                  <span className={styles.fileSizeExceeded}>{fileSizeFormatted}</span>
                </div>
                <div className={styles.fileDetailRow}>
                  <span className={styles.fileDetailLabel}>Max Allowed:</span>
                  <span className={styles.fileSizeLimit}>5.00 MB</span>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.modalPrimaryBtn}
                onClick={() => setShowOversizeModal(false)}
              >
                Choose Another File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevisionActionRequired;

