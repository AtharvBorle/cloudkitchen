"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, AlertCircle } from "lucide-react";
import styles from "./RevisionActionRequired.module.css";

export interface RevisionActionRequiredProps {
  initialAddress?: string;
  initialFssaiFile?: string;
  onResubmit?: (data: { businessAddress: string; fssaiFile: File | null }) => void;
}

export const RevisionActionRequired: React.FC<RevisionActionRequiredProps> = ({
  initialAddress = "451 Innovation Way, Suite 300, New York, NY 10001",
  initialFssaiFile = "FSSAI_Certificate_No_847.pdf",
  onResubmit,
}) => {
  const [address, setAddress] = useState(initialAddress);
  const [fssaiFile, setFssaiFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState(initialFssaiFile);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFssaiFile(file);
      setFileName(file.name);
    }
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
      {/* 1. Red Alert Banner */}
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

      {/* 2. Main Form Card */}
      <form className={styles.formCard} onSubmit={handleSubmit}>
        {/* Header Group */}
        <div className={styles.headerGroup}>
          <h2 className={styles.title}>Correct Flagged Information</h2>
          <p className={styles.subtitle}>
            Submit the requested modifications to resume verification.
          </p>
        </div>

        {/* Form Fields */}
        <div className={styles.formSection}>
          {/* Field 1: FSSAI Certificate Re-upload */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              FSSAI Certificate Re-upload <span className={styles.requiredStar}>*</span>
            </label>
            <input
              id="fssai-reupload-input"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />
            <div className={styles.flaggedUploadBox}>
              <div className={styles.flaggedFileText}>
                <span className={styles.flagTag}>[FLAGGED_BLURRY]</span>
                <span className={styles.fileName}>{fileName}</span>
              </div>
              <button
                type="button"
                className={styles.reuploadBtn}
                onClick={handleTriggerUpload}
              >
                Re-upload
              </button>
            </div>
            <p className={styles.helperText}>
              FSSAI certificate document must be a high-resolution scanned PDF or JPG under 5MB.
            </p>
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

        {/* Divider */}
        <div className={styles.divider} />

        {/* Footer Actions */}
        <div className={styles.actionFooter}>
          <Link href="/seller/verification" className={styles.backBtn}>
            Back to Status
          </Link>
          <button type="submit" className={styles.submitBtn}>
            <span>Resubmit for Verification</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default RevisionActionRequired;
