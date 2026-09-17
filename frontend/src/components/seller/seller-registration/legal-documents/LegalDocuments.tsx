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
  AlertTriangle,
  X,
  RefreshCw,
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

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

interface OversizeModalState {
  isOpen: boolean;
  fileName: string;
  fileSizeFormatted: string;
  fieldLabel: string;
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

  const [bankTouched, setBankTouched] = useState(!!initialData?.bankAccountNumber);
  const [ifscTouched, setIfscTouched] = useState(!!initialData?.ifscCode);

  const isBankValid = formData.bankAccountNumber.length >= 9 && formData.bankAccountNumber.length <= 18;
  const isIfscValid = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode.trim().toUpperCase());

  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({
    identityProofFile: null,
    fssaiLicenseFile: null,
    utilityBillFile: null,
  });

  const [fieldSizes, setFieldSizes] = useState<Record<string, string>>({});
  const [dragActiveField, setDragActiveField] = useState<string | null>(null);
  const [oversizeModal, setOversizeModal] = useState<OversizeModalState | null>(null);

  const identityInputRef = useRef<HTMLInputElement>(null);
  const fssaiInputRef = useRef<HTMLInputElement>(null);
  const utilityInputRef = useRef<HTMLInputElement>(null);

  const getFieldRef = (field: "identityProofFile" | "fssaiLicenseFile" | "utilityBillFile") => {
    if (field === "identityProofFile") return identityInputRef;
    if (field === "fssaiLicenseFile") return fssaiInputRef;
    return utilityInputRef;
  };

  const getFieldLabel = (field: "identityProofFile" | "fssaiLicenseFile" | "utilityBillFile") => {
    if (field === "identityProofFile") return "Identity Proof";
    if (field === "fssaiLicenseFile") return "FSSAI License";
    return "Electricity Bill / Utility Statement";
  };

  const validateAndProcessFile = (
    fileField: "identityProofFile" | "fssaiLicenseFile" | "utilityBillFile",
    file: File | undefined
  ) => {
    if (!file) return;

    const sizeInMB = file.size / (1024 * 1024);
    const sizeFormatted = `${sizeInMB.toFixed(2)} MB`;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      // Reject file
      const inputRef = getFieldRef(fileField);
      if (inputRef.current) {
        inputRef.current.value = "";
      }

      setFormData((prev) => ({
        ...prev,
        [fileField]: "",
      }));

      setFieldErrors((prev) => ({
        ...prev,
        [fileField]: `File size (${sizeFormatted}) exceeds 5MB limit. Please choose a smaller file.`,
      }));

      setOversizeModal({
        isOpen: true,
        fileName: file.name,
        fileSizeFormatted: sizeFormatted,
        fieldLabel: getFieldLabel(fileField),
      });
      return;
    }

    // Valid file under 5MB
    setFieldErrors((prev) => ({
      ...prev,
      [fileField]: null,
    }));

    setFieldSizes((prev) => ({
      ...prev,
      [fileField]: sizeFormatted,
    }));

    setFormData((prev) => ({
      ...prev,
      [fileField]: file.name,
    }));
  };

  const handleFileSelect = (
    fileField: "identityProofFile" | "fssaiLicenseFile" | "utilityBillFile",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    validateAndProcessFile(fileField, file);
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
    validateAndProcessFile(field, file);
  };

  const handleRemoveFile = (
    field: "identityProofFile" | "fssaiLicenseFile" | "utilityBillFile",
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const inputRef = getFieldRef(field);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setFormData((prev) => ({
      ...prev,
      [field]: "",
    }));
    setFieldErrors((prev) => ({
      ...prev,
      [field]: null,
    }));
    setFieldSizes((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleBankAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "").slice(0, 18);
    setFormData((prev) => ({ ...prev, bankAccountNumber: rawValue }));
    setBankTouched(true);
  };

  const handleIfscChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11);
    setFormData((prev) => ({ ...prev, ifscCode: rawValue }));
    setIfscTouched(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBankTouched(true);
    setIfscTouched(true);

    if (!isBankValid) {
      document.getElementById("bankAccountNumber")?.focus();
      return;
    }
    if (!isIfscValid) {
      document.getElementById("ifscCode")?.focus();
      return;
    }

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
          <div
            className={`${styles.mobileDocCard} ${
              formData.identityProofFile
                ? styles.mobileDocCardSuccess
                : fieldErrors.identityProofFile
                ? styles.mobileDocCardError
                : ""
            }`}
          >
            <input
              type="file"
              ref={identityInputRef}
              onChange={(e) => handleFileSelect("identityProofFile", e)}
              accept=".pdf,.png,.jpg,.jpeg"
              className={styles.hiddenFileInput}
            />
            <div className={styles.mobileDocLeft}>
              <div
                className={`${styles.iconSquircle} ${
                  formData.identityProofFile
                    ? styles.iconSquircleSuccess
                    : fieldErrors.identityProofFile
                    ? styles.iconSquircleError
                    : ""
                }`}
              >
                {formData.identityProofFile ? (
                  <CheckCircle2 className={styles.docIconSuccess} />
                ) : fieldErrors.identityProofFile ? (
                  <AlertTriangle className={styles.docIconError} />
                ) : (
                  <FileText className={styles.docIcon} />
                )}
              </div>
              <div className={styles.mobileDocInfo}>
                <h3 className={styles.mobileDocTitle}>
                  Identity proof (Aadhaar / PAN)
                </h3>
                <span
                  className={
                    formData.identityProofFile
                      ? styles.statusSelected
                      : fieldErrors.identityProofFile
                      ? styles.statusError
                      : styles.statusMuted
                  }
                >
                  {formData.identityProofFile
                    ? `${formData.identityProofFile} (${fieldSizes.identityProofFile || "<5MB"})`
                    : fieldErrors.identityProofFile
                    ? "Oversize file rejected (>5MB)"
                    : "Max 5MB (PDF, PNG, JPG)"}
                </span>
              </div>
            </div>
            <div className={styles.mobileCardActions}>
              {formData.identityProofFile ? (
                <button
                  type="button"
                  onClick={(e) => handleRemoveFile("identityProofFile", e)}
                  className={styles.mobileRemoveBtn}
                  title="Remove"
                >
                  <X size={14} />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => identityInputRef.current?.click()}
                className={`${styles.mobileUploadBtn} ${
                  formData.identityProofFile ? styles.mobileUploadBtnChange : ""
                }`}
              >
                {formData.identityProofFile ? "Change" : "Upload"}
              </button>
            </div>
          </div>
          {fieldErrors.identityProofFile && (
            <div className={styles.fieldErrorBanner}>
              <AlertCircle size={13} />
              <span>{fieldErrors.identityProofFile}</span>
            </div>
          )}

          {/* 2. FSSAI License */}
          <div
            className={`${styles.mobileDocCard} ${
              formData.fssaiLicenseFile
                ? styles.mobileDocCardSuccess
                : fieldErrors.fssaiLicenseFile
                ? styles.mobileDocCardError
                : ""
            }`}
          >
            <input
              type="file"
              ref={fssaiInputRef}
              onChange={(e) => handleFileSelect("fssaiLicenseFile", e)}
              accept=".pdf,.png,.jpg,.jpeg"
              className={styles.hiddenFileInput}
            />
            <div className={styles.mobileDocLeft}>
              <div
                className={`${styles.iconSquircle} ${
                  formData.fssaiLicenseFile
                    ? styles.iconSquircleSuccess
                    : fieldErrors.fssaiLicenseFile
                    ? styles.iconSquircleError
                    : ""
                }`}
              >
                {formData.fssaiLicenseFile ? (
                  <CheckCircle2 className={styles.docIconSuccess} />
                ) : fieldErrors.fssaiLicenseFile ? (
                  <AlertTriangle className={styles.docIconError} />
                ) : (
                  <Shield className={styles.docIcon} />
                )}
              </div>
              <div className={styles.mobileDocInfo}>
                <h3 className={styles.mobileDocTitle}>FSSAI License</h3>
                <span
                  className={
                    formData.fssaiLicenseFile
                      ? styles.statusSelected
                      : fieldErrors.fssaiLicenseFile
                      ? styles.statusError
                      : styles.statusMuted
                  }
                >
                  {formData.fssaiLicenseFile
                    ? `${formData.fssaiLicenseFile} (${fieldSizes.fssaiLicenseFile || "<5MB"})`
                    : fieldErrors.fssaiLicenseFile
                    ? "Oversize file rejected (>5MB)"
                    : "Max 5MB (PDF, PNG, JPG)"}
                </span>
              </div>
            </div>
            <div className={styles.mobileCardActions}>
              {formData.fssaiLicenseFile ? (
                <button
                  type="button"
                  onClick={(e) => handleRemoveFile("fssaiLicenseFile", e)}
                  className={styles.mobileRemoveBtn}
                  title="Remove"
                >
                  <X size={14} />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => fssaiInputRef.current?.click()}
                className={`${styles.mobileUploadBtn} ${
                  formData.fssaiLicenseFile ? styles.mobileUploadBtnChange : ""
                }`}
              >
                {formData.fssaiLicenseFile ? "Change" : "Upload"}
              </button>
            </div>
          </div>
          {fieldErrors.fssaiLicenseFile && (
            <div className={styles.fieldErrorBanner}>
              <AlertCircle size={13} />
              <span>{fieldErrors.fssaiLicenseFile}</span>
            </div>
          )}

          {/* 3. Electricity bill */}
          <div
            className={`${styles.mobileDocCard} ${
              formData.utilityBillFile
                ? styles.mobileDocCardSuccess
                : fieldErrors.utilityBillFile
                ? styles.mobileDocCardError
                : ""
            }`}
          >
            <input
              type="file"
              ref={utilityInputRef}
              onChange={(e) => handleFileSelect("utilityBillFile", e)}
              accept=".pdf,.png,.jpg,.jpeg"
              className={styles.hiddenFileInput}
            />
            <div className={styles.mobileDocLeft}>
              <div
                className={`${styles.iconSquircle} ${
                  formData.utilityBillFile
                    ? styles.iconSquircleSuccess
                    : fieldErrors.utilityBillFile
                    ? styles.iconSquircleError
                    : ""
                }`}
              >
                {formData.utilityBillFile ? (
                  <CheckCircle2 className={styles.docIconSuccess} />
                ) : fieldErrors.utilityBillFile ? (
                  <AlertTriangle className={styles.docIconError} />
                ) : (
                  <Zap className={styles.docIcon} />
                )}
              </div>
              <div className={styles.mobileDocInfo}>
                <h3 className={styles.mobileDocTitle}>Electricity bill</h3>
                <span
                  className={
                    formData.utilityBillFile
                      ? styles.statusSelected
                      : fieldErrors.utilityBillFile
                      ? styles.statusError
                      : styles.statusMuted
                  }
                >
                  {formData.utilityBillFile
                    ? `${formData.utilityBillFile} (${fieldSizes.utilityBillFile || "<5MB"})`
                    : fieldErrors.utilityBillFile
                    ? "Oversize file rejected (>5MB)"
                    : "Max 5MB (PDF, PNG, JPG)"}
                </span>
              </div>
            </div>
            <div className={styles.mobileCardActions}>
              {formData.utilityBillFile ? (
                <button
                  type="button"
                  onClick={(e) => handleRemoveFile("utilityBillFile", e)}
                  className={styles.mobileRemoveBtn}
                  title="Remove"
                >
                  <X size={14} />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => utilityInputRef.current?.click()}
                className={`${styles.mobileUploadBtn} ${
                  formData.utilityBillFile ? styles.mobileUploadBtnChange : ""
                }`}
              >
                {formData.utilityBillFile ? "Change" : "Upload"}
              </button>
            </div>
          </div>
          {fieldErrors.utilityBillFile && (
            <div className={styles.fieldErrorBanner}>
              <AlertCircle size={13} />
              <span>{fieldErrors.utilityBillFile}</span>
            </div>
          )}
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
                formData.identityProofFile
                  ? styles.dropzoneSuccess
                  : fieldErrors.identityProofFile
                  ? styles.dropzoneError
                  : dragActiveField === "identityProofFile"
                  ? styles.dropzoneActive
                  : ""
              }`}
              onClick={() => identityInputRef.current?.click()}
              onDragOver={(e) => handleDragOver(e, "identityProofFile")}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, "identityProofFile")}
            >
              {formData.identityProofFile ? (
                <>
                  <div className={styles.successIconBadge}>
                    <CheckCircle2 className={styles.checkIconAnimated} size={32} />
                  </div>
                  <div className={styles.fileSuccessContent}>
                    <p className={styles.dropzoneSelectedFile}>
                      {formData.identityProofFile}
                    </p>
                    <span className={styles.fileSizeBadge}>
                      {fieldSizes.identityProofFile || "Valid Document (<5MB)"}
                    </span>
                  </div>
                  <div className={styles.dropzoneActionBtns}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        identityInputRef.current?.click();
                      }}
                      className={styles.changeFileBtn}
                    >
                      <RefreshCw size={12} /> Replace
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveFile("identityProofFile", e)}
                      className={styles.removeFileBtn}
                    >
                      <X size={12} /> Remove
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <UploadCloud
                    className={`${styles.dropzoneIcon} ${
                      fieldErrors.identityProofFile ? styles.dropzoneIconError : ""
                    }`}
                  />
                  <p className={styles.dropzoneMainText}>
                    {fieldErrors.identityProofFile ? (
                      <span className={styles.textError}>
                        File rejected - Exceeds 5MB
                      </span>
                    ) : (
                      "Click to upload or drag & drop"
                    )}
                  </p>
                  <p className={styles.dropzoneSubText}>PDF, PNG, JPG up to 5MB</p>
                </>
              )}
            </div>
            {fieldErrors.identityProofFile && (
              <div className={styles.fieldErrorBanner}>
                <AlertCircle size={14} />
                <span>{fieldErrors.identityProofFile}</span>
              </div>
            )}
          </div>

          {/* 2. FSSAI License */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>FSSAI License</label>
            <div
              className={`${styles.dropzone} ${
                formData.fssaiLicenseFile
                  ? styles.dropzoneSuccess
                  : fieldErrors.fssaiLicenseFile
                  ? styles.dropzoneError
                  : dragActiveField === "fssaiLicenseFile"
                  ? styles.dropzoneActive
                  : ""
              }`}
              onClick={() => fssaiInputRef.current?.click()}
              onDragOver={(e) => handleDragOver(e, "fssaiLicenseFile")}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, "fssaiLicenseFile")}
            >
              {formData.fssaiLicenseFile ? (
                <>
                  <div className={styles.successIconBadge}>
                    <CheckCircle2 className={styles.checkIconAnimated} size={32} />
                  </div>
                  <div className={styles.fileSuccessContent}>
                    <p className={styles.dropzoneSelectedFile}>
                      {formData.fssaiLicenseFile}
                    </p>
                    <span className={styles.fileSizeBadge}>
                      {fieldSizes.fssaiLicenseFile || "Valid Document (<5MB)"}
                    </span>
                  </div>
                  <div className={styles.dropzoneActionBtns}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fssaiInputRef.current?.click();
                      }}
                      className={styles.changeFileBtn}
                    >
                      <RefreshCw size={12} /> Replace
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveFile("fssaiLicenseFile", e)}
                      className={styles.removeFileBtn}
                    >
                      <X size={12} /> Remove
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <UploadCloud
                    className={`${styles.dropzoneIcon} ${
                      fieldErrors.fssaiLicenseFile ? styles.dropzoneIconError : ""
                    }`}
                  />
                  <p className={styles.dropzoneMainText}>
                    {fieldErrors.fssaiLicenseFile ? (
                      <span className={styles.textError}>
                        File rejected - Exceeds 5MB
                      </span>
                    ) : (
                      "Click to upload or drag & drop"
                    )}
                  </p>
                  <p className={styles.dropzoneSubText}>PDF, PNG, JPG up to 5MB</p>
                </>
              )}
            </div>
            {fieldErrors.fssaiLicenseFile ? (
              <div className={styles.fieldErrorBanner}>
                <AlertCircle size={14} />
                <span>{fieldErrors.fssaiLicenseFile}</span>
              </div>
            ) : (
              <div className={styles.noticeBox}>
                <AlertCircle className={styles.noticeIcon} />
                <span className={styles.noticeText}>
                  Mandatory for partners offering Food and Cloud Kitchen services.
                </span>
              </div>
            )}
          </div>

          {/* 3. Electricity Bill / Utility Statement */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Electricity Bill / Utility Statement{" "}
              <span className={styles.required}>*</span>
            </label>
            <div
              className={`${styles.dropzone} ${
                formData.utilityBillFile
                  ? styles.dropzoneSuccess
                  : fieldErrors.utilityBillFile
                  ? styles.dropzoneError
                  : dragActiveField === "utilityBillFile"
                  ? styles.dropzoneActive
                  : ""
              }`}
              onClick={() => utilityInputRef.current?.click()}
              onDragOver={(e) => handleDragOver(e, "utilityBillFile")}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, "utilityBillFile")}
            >
              {formData.utilityBillFile ? (
                <>
                  <div className={styles.successIconBadge}>
                    <CheckCircle2 className={styles.checkIconAnimated} size={32} />
                  </div>
                  <div className={styles.fileSuccessContent}>
                    <p className={styles.dropzoneSelectedFile}>
                      {formData.utilityBillFile}
                    </p>
                    <span className={styles.fileSizeBadge}>
                      {fieldSizes.utilityBillFile || "Valid Document (<5MB)"}
                    </span>
                  </div>
                  <div className={styles.dropzoneActionBtns}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        utilityInputRef.current?.click();
                      }}
                      className={styles.changeFileBtn}
                    >
                      <RefreshCw size={12} /> Replace
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveFile("utilityBillFile", e)}
                      className={styles.removeFileBtn}
                    >
                      <X size={12} /> Remove
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <UploadCloud
                    className={`${styles.dropzoneIcon} ${
                      fieldErrors.utilityBillFile ? styles.dropzoneIconError : ""
                    }`}
                  />
                  <p className={styles.dropzoneMainText}>
                    {fieldErrors.utilityBillFile ? (
                      <span className={styles.textError}>
                        File rejected - Exceeds 5MB
                      </span>
                    ) : (
                      "Click to upload or drag & drop"
                    )}
                  </p>
                  <p className={styles.dropzoneSubText}>PDF, PNG, JPG up to 5MB</p>
                </>
              )}
            </div>
            {fieldErrors.utilityBillFile && (
              <div className={styles.fieldErrorBanner}>
                <AlertCircle size={14} />
                <span>{fieldErrors.utilityBillFile}</span>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* BANKING DETAILS (Adaptive Grid for Web / Stack for Mobile)*/}
        {/* ========================================================= */}
        <div className={styles.bankingSection}>
          {/* Bank Account Number */}
          <div className={styles.fieldGroup}>
            <div className={styles.labelRow}>
              <label className={styles.label} htmlFor="bankAccountNumber">
                Bank account number <span className={styles.required}>*</span>
              </label>
              <span
                className={`${styles.digitCounter} ${
                  formData.bankAccountNumber.length === 0
                    ? bankTouched
                      ? styles.digitCounterIncomplete
                      : styles.digitCounterNeutral
                    : isBankValid
                    ? styles.digitCounterComplete
                    : styles.digitCounterIncomplete
                }`}
              >
                {formData.bankAccountNumber.length > 0
                  ? isBankValid
                    ? `${formData.bankAccountNumber.length} digits`
                    : `${formData.bankAccountNumber.length}/9-18 digits`
                  : bankTouched
                  ? "Required"
                  : "9-18 digits (numbers only)"}
              </span>
            </div>
            <div
              className={`${styles.inputWrapper} ${
                bankTouched
                  ? isBankValid
                    ? styles.inputSuccess
                    : styles.inputError
                  : ""
              }`}
            >
              <input
                id="bankAccountNumber"
                name="bankAccountNumber"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={18}
                required
                placeholder="e.g. 987654321012 (numbers only)"
                value={formData.bankAccountNumber}
                onChange={handleBankAccountChange}
                onBlur={() => setBankTouched(true)}
                className={styles.input}
              />
              <div className={styles.statusIconBox}>
                {isBankValid ? (
                  <CheckCircle2 size={18} className={styles.validCheckIcon} />
                ) : bankTouched ? (
                  <AlertCircle size={18} className={styles.invalidAlertIcon} />
                ) : null}
              </div>
            </div>
            {bankTouched && (
              isBankValid ? (
                <div className={styles.helperTextSuccess}>
                  <CheckCircle2 size={13} />
                  <span>Valid bank account number (digits only)</span>
                </div>
              ) : formData.bankAccountNumber.length === 0 ? (
                <div className={styles.helperTextError}>
                  <AlertCircle size={13} />
                  <span>Bank account number cannot be empty (numbers only, no symbols or letters)</span>
                </div>
              ) : (
                <div className={styles.helperTextError}>
                  <AlertCircle size={13} />
                  <span>Bank account must be between 9 and 18 digits (numbers only)</span>
                </div>
              )
            )}
          </div>

          {/* IFSC Code */}
          <div className={styles.fieldGroup}>
            <div className={styles.labelRow}>
              <label className={styles.label} htmlFor="ifscCode">
                IFSC code <span className={styles.required}>*</span>
              </label>
              <span
                className={`${styles.digitCounter} ${
                  formData.ifscCode.length === 0
                    ? ifscTouched
                      ? styles.digitCounterIncomplete
                      : styles.digitCounterNeutral
                    : isIfscValid
                    ? styles.digitCounterComplete
                    : styles.digitCounterIncomplete
                }`}
              >
                {formData.ifscCode.length > 0
                  ? `${formData.ifscCode.length}/11 chars`
                  : ifscTouched
                  ? "Required"
                  : "11 chars (no symbols)"}
              </span>
            </div>
            <div
              className={`${styles.inputWrapper} ${
                ifscTouched
                  ? isIfscValid
                    ? styles.inputSuccess
                    : styles.inputError
                  : ""
              }`}
            >
              <input
                id="ifscCode"
                name="ifscCode"
                type="text"
                maxLength={11}
                required
                placeholder="e.g. HDFC0001234"
                value={formData.ifscCode}
                onChange={handleIfscChange}
                onBlur={() => setIfscTouched(true)}
                className={styles.input}
                style={{ textTransform: "uppercase" }}
              />
              <div className={styles.statusIconBox}>
                {isIfscValid ? (
                  <CheckCircle2 size={18} className={styles.validCheckIcon} />
                ) : ifscTouched ? (
                  <AlertCircle size={18} className={styles.invalidAlertIcon} />
                ) : null}
              </div>
            </div>
            {ifscTouched && (
              isIfscValid ? (
                <div className={styles.helperTextSuccess}>
                  <CheckCircle2 size={13} />
                  <span>Valid IFSC code format</span>
                </div>
              ) : formData.ifscCode.length === 0 ? (
                <div className={styles.helperTextError}>
                  <AlertCircle size={13} />
                  <span>IFSC code cannot be empty (no symbols allowed)</span>
                </div>
              ) : (
                <div className={styles.helperTextError}>
                  <AlertCircle size={13} />
                  <span>11 chars: 4 letters + 0 + 6 alphanumeric (e.g. HDFC0001234, no symbols)</span>
                </div>
              )
            )}
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

      {/* ========================================================= */}
      {/* OVERSIZE WARNING MODAL POPUP                              */}
      {/* ========================================================= */}
      {oversizeModal?.isOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setOversizeModal(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalIconWrap}>
                <AlertTriangle className={styles.modalAlertIcon} size={28} />
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setOversizeModal(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <h3 className={styles.modalTitle}>File Size Limit Exceeded</h3>
              <p className={styles.modalText}>
                The selected document for{" "}
                <span className={styles.highlightText}>
                  {oversizeModal.fieldLabel}
                </span>{" "}
                is too large to upload.
              </p>

              <div className={styles.fileDetailCard}>
                <div className={styles.fileDetailRow}>
                  <span className={styles.fileDetailLabel}>Selected File:</span>
                  <span className={styles.fileDetailValue} title={oversizeModal.fileName}>
                    {oversizeModal.fileName}
                  </span>
                </div>
                <div className={styles.fileDetailRow}>
                  <span className={styles.fileDetailLabel}>Detected Size:</span>
                  <span className={styles.fileSizeExceeded}>
                    {oversizeModal.fileSizeFormatted}
                  </span>
                </div>
                <div className={styles.fileDetailRow}>
                  <span className={styles.fileDetailLabel}>Max Allowed:</span>
                  <span className={styles.fileSizeLimit}>5.00 MB</span>
                </div>
              </div>

              <p className={styles.modalTip}>
                Please compress your file or select an image/document under 5MB (PDF, PNG, JPG).
              </p>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.modalPrimaryBtn}
                onClick={() => setOversizeModal(null)}
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

export default LegalDocuments;
