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
import { readFileAsDataUrl, compressImageFile, saveSellerDraft } from "@/lib/seller-registration-store";

export interface LegalDocumentsData {
  identityProofFile?: string;
  identityProofDataUrl?: string;
  fssaiLicenseFile?: string;
  fssaiLicenseDataUrl?: string;
  utilityBillFile?: string;
  utilityBillDataUrl?: string;
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
    identityProofDataUrl: initialData?.identityProofDataUrl || "",
    fssaiLicenseFile: initialData?.fssaiLicenseFile || "",
    fssaiLicenseDataUrl: initialData?.fssaiLicenseDataUrl || "",
    utilityBillFile: initialData?.utilityBillFile || "",
    utilityBillDataUrl: initialData?.utilityBillDataUrl || "",
    bankAccountNumber: initialData?.bankAccountNumber || "",
    ifscCode: initialData?.ifscCode || "",
  });

  const [bankTouched, setBankTouched] = useState(!!initialData?.bankAccountNumber);
  const [ifscTouched, setIfscTouched] = useState(!!initialData?.ifscCode);

  const isBankValid = formData.bankAccountNumber.length >= 9 && formData.bankAccountNumber.length <= 18;
  const isIfscValid =
    formData.ifscCode.trim().length > 0 &&
    /^[A-Z0-9]+$/i.test(formData.ifscCode.trim()) &&
    /[A-Z]/i.test(formData.ifscCode.trim());

  const getIfscErrorMessage = (code: string): string => {
    const val = code.trim().toUpperCase();
    if (val.length === 0) {
      return "IFSC code cannot be empty";
    }
    if (/^\d+$/.test(val)) {
      return "Numbers only are not supported. IFSC code must be alphanumeric (contain letters and numbers)";
    }
    if (!/^[A-Z0-9]+$/.test(val)) {
      return "Special characters and symbols are not allowed";
    }
    return "Invalid alphanumeric IFSC code";
  };

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

  const validateAndProcessFile = async (
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

      const dataUrlField = fileField.replace("File", "DataUrl");

      setFormData((prev) => ({
        ...prev,
        [fileField]: "",
        [dataUrlField]: "",
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

    try {
      let dataUrl: string;
      if (file.type === "application/pdf") {
        dataUrl = await readFileAsDataUrl(file);
      } else {
        const compressed = await compressImageFile(file, 1600, 1600, 0.85);
        dataUrl = compressed.dataUrl;
      }
      const dataUrlField = fileField.replace("File", "DataUrl");

      setFormData((prev) => {
        const next = {
          ...prev,
          [fileField]: file.name,
          [dataUrlField]: dataUrl,
        };
        const draftKeyName = `${fileField.replace("File", "")}FileName` as any;
        const draftKeyData = `${fileField.replace("File", "")}DataUrl` as any;
        saveSellerDraft({
          [draftKeyName]: file.name,
          [draftKeyData]: dataUrl,
        });
        return next;
      });
    } catch (err) {
      console.error("Error reading file:", err);
      setFormData((prev) => {
        const next = {
          ...prev,
          [fileField]: file.name,
        };
        saveSellerDraft({
          [`${fileField.replace("File", "")}FileName` as any]: file.name,
        });
        return next;
      });
    }
  };

  const handleFileSelect = (
    fieldPrefix: "identityProof" | "fssaiLicense" | "utilityBill",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    const fileField = `${fieldPrefix}File` as "identityProofFile" | "fssaiLicenseFile" | "utilityBillFile";
    validateAndProcessFile(fileField, file);
    e.target.value = "";
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
    fieldPrefix: "identityProof" | "fssaiLicense" | "utilityBill"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveField(null);
    const file = e.dataTransfer.files?.[0];
    const fileField = `${fieldPrefix}File` as "identityProofFile" | "fssaiLicenseFile" | "utilityBillFile";
    validateAndProcessFile(fileField, file);
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
    const dataUrlField = field.replace("File", "DataUrl");
    setFormData((prev) => {
      const next = {
        ...prev,
        [field]: "",
        [dataUrlField]: "",
      };
      saveSellerDraft({
        [`${field.replace("File", "")}FileName` as any]: "",
        [`${field.replace("File", "")}DataUrl` as any]: "",
      });
      return next;
    });
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
    setFormData((prev) => {
      const next = { ...prev, bankAccountNumber: rawValue };
      saveSellerDraft({ bankAccountNumber: rawValue });
      return next;
    });
    setBankTouched(true);
  };

  const handleIfscChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11);
    setFormData((prev) => {
      const next = { ...prev, ifscCode: rawValue };
      saveSellerDraft({ ifscCode: rawValue });
      return next;
    });
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

    saveSellerDraft({
      identityProofFileName: formData.identityProofFile,
      identityProofDataUrl: formData.identityProofDataUrl,
      fssaiLicenseFileName: formData.fssaiLicenseFile,
      fssaiLicenseDataUrl: formData.fssaiLicenseDataUrl,
      utilityBillFileName: formData.utilityBillFile,
      utilityBillDataUrl: formData.utilityBillDataUrl,
      bankAccountNumber: formData.bankAccountNumber,
      ifscCode: formData.ifscCode,
    });

    if (onContinue) {
      onContinue(formData);
    }
  };

  return (
    <div className={styles.cardContainer}>
      {/* Desktop Header Group */}
      <div className={styles.desktopHeaderGroup}>
        <h2 className={styles.title}>Legal Documents & Payout</h2>
        <p className={styles.subtitle}>
          Upload regulatory certificates and enter your payout account details.
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Hidden File Inputs */}
        <input
          ref={identityInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          style={{ display: "none" }}
          onChange={(e) => handleFileSelect("identityProof", e)}
        />
        <input
          ref={fssaiInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          style={{ display: "none" }}
          onChange={(e) => handleFileSelect("fssaiLicense", e)}
        />
        <input
          ref={utilityInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          style={{ display: "none" }}
          onChange={(e) => handleFileSelect("utilityBill", e)}
        />

        {/* ========================================================= */}
        {/* MOBILE VIEW: Document Cards Stack Matching Mockup         */}
        {/* ========================================================= */}
        <div className={styles.mobileDocSection}>
          {/* Doc 1: Identity Proof */}
          <div
            className={`${styles.mobileDocCard} ${
              formData.identityProofFile ? styles.docCardUploaded : ""
            } ${fieldErrors.identityProofFile ? styles.docCardError : ""}`}
            onClick={() => identityInputRef.current?.click()}
          >
            <div className={styles.docIconBox}>
              <FileText className={styles.docIcon} size={22} />
            </div>
            <div className={styles.docContent}>
              <div className={styles.docTitleRow}>
                <span className={styles.docName}>Identity Proof</span>
                <span className={styles.docRequired}>*</span>
              </div>
              <p className={styles.docSub}>
                {fieldErrors.identityProofFile ? (
                  <span className={styles.errorSubText}>
                    {fieldErrors.identityProofFile}
                  </span>
                ) : formData.identityProofFile ? (
                  <span className={styles.uploadedSubText}>
                    {formData.identityProofFile} ({fieldSizes.identityProofFile || "Uploaded"})
                  </span>
                ) : (
                  "Aadhaar, Passport or Driving License (Max 5MB)"
                )}
              </p>
            </div>
            <div className={styles.docActionSlot}>
              {formData.identityProofFile ? (
                <button
                  type="button"
                  className={styles.removeFileBtn}
                  onClick={(e) => handleRemoveFile("identityProofFile", e)}
                  title="Remove file"
                >
                  <X size={15} />
                </button>
              ) : (
                <div className={styles.mobileUploadBtn}>
                  <UploadCloud size={16} />
                  <span>Upload</span>
                </div>
              )}
            </div>
          </div>

          {/* Doc 2: FSSAI License */}
          <div
            className={`${styles.mobileDocCard} ${
              formData.fssaiLicenseFile ? styles.docCardUploaded : ""
            } ${fieldErrors.fssaiLicenseFile ? styles.docCardError : ""}`}
            onClick={() => fssaiInputRef.current?.click()}
          >
            <div className={styles.docIconBox}>
              <Shield className={styles.docIcon} size={22} />
            </div>
            <div className={styles.docContent}>
              <div className={styles.docTitleRow}>
                <span className={styles.docName}>FSSAI License</span>
                <span className={styles.docRequired}>*</span>
              </div>
              <p className={styles.docSub}>
                {fieldErrors.fssaiLicenseFile ? (
                  <span className={styles.errorSubText}>
                    {fieldErrors.fssaiLicenseFile}
                  </span>
                ) : formData.fssaiLicenseFile ? (
                  <span className={styles.uploadedSubText}>
                    {formData.fssaiLicenseFile} ({fieldSizes.fssaiLicenseFile || "Uploaded"})
                  </span>
                ) : (
                  "Food safety registration certificate (Max 5MB)"
                )}
              </p>
            </div>
            <div className={styles.docActionSlot}>
              {formData.fssaiLicenseFile ? (
                <button
                  type="button"
                  className={styles.removeFileBtn}
                  onClick={(e) => handleRemoveFile("fssaiLicenseFile", e)}
                  title="Remove file"
                >
                  <X size={15} />
                </button>
              ) : (
                <div className={styles.mobileUploadBtn}>
                  <UploadCloud size={16} />
                  <span>Upload</span>
                </div>
              )}
            </div>
          </div>

          {/* Doc 3: Electricity Bill */}
          <div
            className={`${styles.mobileDocCard} ${
              formData.utilityBillFile ? styles.docCardUploaded : ""
            } ${fieldErrors.utilityBillFile ? styles.docCardError : ""}`}
            onClick={() => utilityInputRef.current?.click()}
          >
            <div className={styles.docIconBox}>
              <Zap className={styles.docIcon} size={22} />
            </div>
            <div className={styles.docContent}>
              <div className={styles.docTitleRow}>
                <span className={styles.docName}>Electricity Bill</span>
                <span className={styles.docRequired}>*</span>
              </div>
              <p className={styles.docSub}>
                {fieldErrors.utilityBillFile ? (
                  <span className={styles.errorSubText}>
                    {fieldErrors.utilityBillFile}
                  </span>
                ) : formData.utilityBillFile ? (
                  <span className={styles.uploadedSubText}>
                    {formData.utilityBillFile} ({fieldSizes.utilityBillFile || "Uploaded"})
                  </span>
                ) : (
                  "Recent utility bill showing address (Max 5MB)"
                )}
              </p>
            </div>
            <div className={styles.docActionSlot}>
              {formData.utilityBillFile ? (
                <button
                  type="button"
                  className={styles.removeFileBtn}
                  onClick={(e) => handleRemoveFile("utilityBillFile", e)}
                  title="Remove file"
                >
                  <X size={15} />
                </button>
              ) : (
                <div className={styles.mobileUploadBtn}>
                  <UploadCloud size={16} />
                  <span>Upload</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* DESKTOP VIEW: Clean Dropzones with Progress/States        */}
        {/* ========================================================= */}
        <div className={styles.desktopDocSection}>
          {/* Identity Proof Dropzone */}
          <div className={styles.fieldGroup}>
            <div className={styles.labelRow}>
              <label className={styles.label}>
                Identity proof (Aadhaar / Passport / DL){" "}
                <span className={styles.required}>*</span>
              </label>
              {fieldSizes.identityProofFile && (
                <span className={styles.fileSizeBadge}>
                  {fieldSizes.identityProofFile}
                </span>
              )}
            </div>
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
              onDrop={(e) => handleDrop(e, "identityProof")}
            >
              {formData.identityProofFile ? (
                <>
                  <div className={styles.uploadedIconWrap}>
                    <CheckCircle2 size={24} className={styles.successIcon} />
                  </div>
                  <div className={styles.fileInfoGroup}>
                    <p className={styles.fileName}>{formData.identityProofFile}</p>
                    <p className={styles.fileStatus}>Document verified and ready</p>
                  </div>
                  <div className={styles.dropzoneActions}>
                    <button
                      type="button"
                      className={styles.reuploadBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        identityInputRef.current?.click();
                      }}
                      title="Replace file"
                    >
                      <RefreshCw size={14} />
                      <span>Change</span>
                    </button>
                    <button
                      type="button"
                      className={styles.desktopRemoveBtn}
                      onClick={(e) => handleRemoveFile("identityProofFile", e)}
                      title="Remove file"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.dropzoneIconBox}>
                    <UploadCloud className={styles.uploadIcon} />
                  </div>
                  <div className={styles.dropzoneTextGroup}>
                    <p className={styles.primaryText}>
                      <span>Click to upload</span> or drag and drop
                    </p>
                    <p className={styles.secondaryText}>
                      PDF, PNG, JPG up to 5MB
                    </p>
                  </div>
                </>
              )}
            </div>
            {fieldErrors.identityProofFile && (
              <div className={styles.fieldErrorMsg}>
                <AlertCircle size={14} />
                <span>{fieldErrors.identityProofFile}</span>
              </div>
            )}
          </div>

          {/* FSSAI License Dropzone */}
          <div className={styles.fieldGroup}>
            <div className={styles.labelRow}>
              <label className={styles.label}>
                FSSAI food license certificate <span className={styles.required}>*</span>
              </label>
              {fieldSizes.fssaiLicenseFile && (
                <span className={styles.fileSizeBadge}>
                  {fieldSizes.fssaiLicenseFile}
                </span>
              )}
            </div>
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
              onDrop={(e) => handleDrop(e, "fssaiLicense")}
            >
              {formData.fssaiLicenseFile ? (
                <>
                  <div className={styles.uploadedIconWrap}>
                    <CheckCircle2 size={24} className={styles.successIcon} />
                  </div>
                  <div className={styles.fileInfoGroup}>
                    <p className={styles.fileName}>{formData.fssaiLicenseFile}</p>
                    <p className={styles.fileStatus}>Document verified and ready</p>
                  </div>
                  <div className={styles.dropzoneActions}>
                    <button
                      type="button"
                      className={styles.reuploadBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        fssaiInputRef.current?.click();
                      }}
                      title="Replace file"
                    >
                      <RefreshCw size={14} />
                      <span>Change</span>
                    </button>
                    <button
                      type="button"
                      className={styles.desktopRemoveBtn}
                      onClick={(e) => handleRemoveFile("fssaiLicenseFile", e)}
                      title="Remove file"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.dropzoneIconBox}>
                    <UploadCloud className={styles.uploadIcon} />
                  </div>
                  <div className={styles.dropzoneTextGroup}>
                    <p className={styles.primaryText}>
                      <span>Click to upload</span> or drag and drop
                    </p>
                    <p className={styles.secondaryText}>
                      PDF, PNG, JPG up to 5MB
                    </p>
                  </div>
                </>
              )}
            </div>
            {fieldErrors.fssaiLicenseFile && (
              <div className={styles.fieldErrorMsg}>
                <AlertCircle size={14} />
                <span>{fieldErrors.fssaiLicenseFile}</span>
              </div>
            )}
          </div>

          {/* Electricity Bill Dropzone */}
          <div className={styles.fieldGroup}>
            <div className={styles.labelRow}>
              <label className={styles.label}>
                Electricity bill / premises statement <span className={styles.required}>*</span>
              </label>
              {fieldSizes.utilityBillFile && (
                <span className={styles.fileSizeBadge}>
                  {fieldSizes.utilityBillFile}
                </span>
              )}
            </div>
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
              onDrop={(e) => handleDrop(e, "utilityBill")}
            >
              {formData.utilityBillFile ? (
                <>
                  <div className={styles.uploadedIconWrap}>
                    <CheckCircle2 size={24} className={styles.successIcon} />
                  </div>
                  <div className={styles.fileInfoGroup}>
                    <p className={styles.fileName}>{formData.utilityBillFile}</p>
                    <p className={styles.fileStatus}>Document verified and ready</p>
                  </div>
                  <div className={styles.dropzoneActions}>
                    <button
                      type="button"
                      className={styles.reuploadBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        utilityInputRef.current?.click();
                      }}
                      title="Replace file"
                    >
                      <RefreshCw size={14} />
                      <span>Change</span>
                    </button>
                    <button
                      type="button"
                      className={styles.desktopRemoveBtn}
                      onClick={(e) => handleRemoveFile("utilityBillFile", e)}
                      title="Remove file"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.dropzoneIconBox}>
                    <UploadCloud className={styles.uploadIcon} />
                  </div>
                  <div className={styles.dropzoneTextGroup}>
                    <p className={styles.primaryText}>
                      <span>Click to upload</span> or drag and drop
                    </p>
                    <p className={styles.secondaryText}>
                      PDF, PNG, JPG up to 5MB
                    </p>
                  </div>
                </>
              )}
            </div>
            {fieldErrors.utilityBillFile && (
              <div className={styles.fieldErrorMsg}>
                <AlertCircle size={14} />
                <span>{fieldErrors.utilityBillFile}</span>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* BANKING / PAYOUT ACCOUNT DETAILS                          */}
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
                  ? isIfscValid
                    ? "Valid IFSC"
                    : /^\d+$/.test(formData.ifscCode)
                    ? "Letters required"
                    : "Alphanumeric required"
                  : ifscTouched
                  ? "Required"
                  : "Alphanumeric (letters & numbers)"}
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
                autoCapitalize="characters"
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
                  <span>Valid alphanumeric IFSC code</span>
                </div>
              ) : (
                <div className={styles.helperTextError}>
                  <AlertCircle size={13} />
                  <span>{getIfscErrorMessage(formData.ifscCode)}</span>
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
