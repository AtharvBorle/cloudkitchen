"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Upload, AlertCircle, CheckCircle2, Loader2, Image as ImageIcon, FileText, AlertTriangle, X, Eye } from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";
import { useSellerProfile, updateCachedProfile } from "@/hooks/useSellerProfile";
import styles from "./RevisionActionRequired.module.css";
import { validateFileSize } from "@/lib/file-validation";

export interface RevisionActionRequiredProps {
  initialAddress?: string;
  initialFssaiFile?: string;
  trackingId?: string;
  onResubmit?: (data: any) => void;
}

export const RevisionActionRequired: React.FC<RevisionActionRequiredProps> = ({
  initialAddress,
  trackingId: propTrackingId,
  onResubmit,
}) => {
  const router = useRouter();
  const seller = useSellerProfile();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [trackingId, setTrackingId] = useState(propTrackingId || "");
  const [adminNote, setAdminNote] = useState<string>("");
  const [businessCategory, setBusinessCategory] = useState<string>("FOOD");

  // Form State
  const [address, setAddress] = useState(initialAddress || "");
  const [idProofType, setIdProofType] = useState<"AADHAAR" | "PAN">("AADHAAR");

  const [fssaiFile, setFssaiFile] = useState<File | null>(null);
  const [adhaarFrontFile, setAdhaarFrontFile] = useState<File | null>(null);
  const [adhaarBackFile, setAdhaarBackFile] = useState<File | null>(null);
  const [panFile, setPanFile] = useState<File | null>(null);
  const [lightBillFile, setLightBillFile] = useState<File | null>(null);
  const [passbookFile, setPassbookFile] = useState<File | null>(null);

  const [kitchenFiles, setKitchenFiles] = useState<File[]>([]);
  const [cuisineFiles, setCuisineFiles] = useState<File[]>([]);
  const [roomFiles, setRoomFiles] = useState<File[]>([]);

  // Previous document URLs on file
  const [prevAdhaarFront, setPrevAdhaarFront] = useState<string | null>(null);
  const [prevAdhaarBack, setPrevAdhaarBack] = useState<string | null>(null);
  const [prevFssaiUrl, setPrevFssaiUrl] = useState<string | null>(null);
  const [prevLightBillUrl, setPrevLightBillUrl] = useState<string | null>(null);
  const [prevPassbookUrl, setPrevPassbookUrl] = useState<string | null>(null);

  // File size validation modal
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileSizeFormatted, setFileSizeFormatted] = useState<string>("");
  const [showOversizeModal, setShowOversizeModal] = useState(false);
  const [oversizeDocName, setOversizeDocName] = useState("document");

  // Image preview modal
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [previewModalTitle, setPreviewModalTitle] = useState<string>("");

  // Flag detection (Strictly only documents requested by admin)
  const [needsFssai, setNeedsFssai] = useState(false);
  const [needsAadhaar, setNeedsAadhaar] = useState(false);
  const [needsLightBill, setNeedsLightBill] = useState(false);
  const [needsPassbook, setNeedsPassbook] = useState(false);
  const [needsKitchen, setNeedsKitchen] = useState(false);
  const [needsCuisine, setNeedsCuisine] = useState(false);
  const [needsRooms, setNeedsRooms] = useState(false);
  const [needsAddress, setNeedsAddress] = useState(false);

  const [isDragging, setIsDragging] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetchApi("/api/seller/profile");
        if (res.ok) {
          const data = await res.json();
          const profile = data.data?.profile || data.profile || {};
          const user = data.data?.user || data.user || {};

          setTrackingId(profile.trackingId || propTrackingId || "");
          setBusinessCategory(profile.businessCategory || profile.type || "FOOD");
          setAddress(
            initialAddress ||
            profile.addressLocality ||
            `${profile.addressFlat ? profile.addressFlat + ", " : ""}${profile.addressLocality || ""}` ||
            user.city ||
            ""
          );

          // Store previous URLs for comparison & reference
          if (profile.adhaarUrl) {
            try {
              const parsed = JSON.parse(profile.adhaarUrl);
              if (Array.isArray(parsed)) {
                setPrevAdhaarFront(parsed[0] || null);
                setPrevAdhaarBack(parsed[1] || null);
              } else if (typeof parsed === "string") {
                setPrevAdhaarFront(parsed);
              }
            } catch {
              setPrevAdhaarFront(profile.adhaarUrl);
            }
          }
          if (profile.fssaiUrl) setPrevFssaiUrl(profile.fssaiUrl);
          if (profile.lightBillUrl) setPrevLightBillUrl(profile.lightBillUrl);
          if (profile.passbookUrl) setPrevPassbookUrl(profile.passbookUrl);

          const note = profile.verificationNote || "Administrative review requested changes to your documents.";
          setAdminNote(note);

          const lower = note.toLowerCase();

          // Precise flag extraction
          const hasAadhaar =
            lower.includes("aadhaar") ||
            lower.includes("adhaar") ||
            lower.includes("aadhar") ||
            lower.includes("id proof") ||
            lower.includes("identity proof") ||
            lower.includes("identity card") ||
            lower.includes("pan card") ||
            (lower.includes("identity") && !lower.includes("proof")) ||
            (lower.includes("pan") && !lower.includes("company"));

          const hasFssai =
            lower.includes("fssai") ||
            lower.includes("food license") ||
            lower.includes("food safety") ||
            lower.includes("license certificate") ||
            (lower.includes("license") && !lower.includes("driving license"));

          const hasLightBill =
            lower.includes("light bill") ||
            lower.includes("electricity") ||
            lower.includes("electric bill") ||
            lower.includes("utility bill") ||
            lower.includes("premises statement") ||
            lower.includes("power bill");

          const hasPassbook =
            lower.includes("passbook") ||
            lower.includes("bank passbook") ||
            lower.includes("bank statement") ||
            lower.includes("cheque") ||
            lower.includes("bank account") ||
            lower.includes("bank document");

          const hasKitchen =
            lower.includes("kitchen") ||
            lower.includes("cooking area");

          const hasCuisine =
            lower.includes("cuisine") ||
            lower.includes("food image") ||
            lower.includes("food photo") ||
            lower.includes("dish image") ||
            lower.includes("dish photo") ||
            lower.includes("menu photo") ||
            lower.includes("dishes");

          const hasRooms =
            lower.includes("room") ||
            lower.includes("stay photo") ||
            lower.includes("property photo");

          const hasAddr =
            lower.includes("business address") ||
            lower.includes("premises address") ||
            lower.includes("shop address") ||
            lower.includes("address proof") ||
            (lower.includes("address") && !lower.includes("email address") && !lower.includes("ip address"));

          const anyFlagged =
            hasAadhaar ||
            hasFssai ||
            hasLightBill ||
            hasPassbook ||
            hasKitchen ||
            hasCuisine ||
            hasRooms ||
            hasAddr;

          // If note specifically flagged certain items, ONLY enable those specific items.
          // If no specific keyword matched, default to Aadhaar as the primary identity document.
          setNeedsAadhaar(hasAadhaar || (!anyFlagged && true));
          setNeedsFssai(hasFssai);
          setNeedsLightBill(hasLightBill);
          setNeedsPassbook(hasPassbook);
          setNeedsKitchen(hasKitchen);
          setNeedsCuisine(hasCuisine);
          setNeedsRooms(hasRooms);
          setNeedsAddress(hasAddr);
        }
      } catch (err) {
        console.error("Error loading revision profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [initialAddress, propTrackingId]);

  const handleSingleFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<File | null>>,
    docName: string = "document"
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const result = validateFileSize(file);
      if (!result.isValid) {
        setFileError(result.errorMessage || "File exceeds 5MB size limit.");
        setFileSizeFormatted(result.sizeFormatted);
        setOversizeDocName(docName);
        setShowOversizeModal(true);
        e.target.value = "";
        return;
      }
      setFileError(null);
      setter(file);
    }
  };

  const handleMultiFiles = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<File[]>>,
    docName: string = "photos"
  ) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      const validFiles: File[] = [];
      for (const file of selected) {
        const result = validateFileSize(file);
        if (!result.isValid) {
          setFileError(result.errorMessage || "File exceeds 5MB limit.");
          setFileSizeFormatted(result.sizeFormatted);
          setOversizeDocName(docName);
          setShowOversizeModal(true);
          e.target.value = "";
          return;
        }
        validFiles.push(file);
      }
      setter((prev) => [...prev, ...validFiles].slice(0, 3));
    }
  };

  const handleDropSingle = (
    e: React.DragEvent,
    setter: React.Dispatch<React.SetStateAction<File | null>>,
    docName: string = "document"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const result = validateFileSize(file);
      if (!result.isValid) {
        setFileError(result.errorMessage || "File exceeds 5MB size limit.");
        setFileSizeFormatted(result.sizeFormatted);
        setOversizeDocName(docName);
        setShowOversizeModal(true);
        return;
      }
      setFileError(null);
      setter(file);
    }
  };

  const openPreview = (url: string, title: string = "Document Preview") => {
    if (!url) return;
    if (url.toLowerCase().endsWith(".pdf")) {
      window.open(url, "_blank");
    } else {
      setPreviewModalUrl(url);
      setPreviewModalTitle(title);
    }
  };

  const openFilePreview = (file: File, title: string = "New File Preview") => {
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      const objUrl = URL.createObjectURL(file);
      window.open(objUrl, "_blank");
    } else {
      const objUrl = URL.createObjectURL(file);
      setPreviewModalUrl(objUrl);
      setPreviewModalTitle(title);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: Ensure the requested replacement documents are provided
    if (needsAadhaar) {
      if (idProofType === "AADHAAR" && !adhaarFrontFile && !adhaarBackFile) {
        alert("Please upload at least the front side of your Aadhaar Card (or both front & back) to resubmit.");
        return;
      }
      if (idProofType === "PAN" && !panFile) {
        alert("Please upload your PAN Card to resubmit.");
        return;
      }
    }

    if (needsFssai && !fssaiFile) {
      alert("Please upload the requested FSSAI Certificate to resubmit.");
      return;
    }

    if (needsLightBill && !lightBillFile) {
      alert("Please upload the requested Electricity Bill to resubmit.");
      return;
    }

    if (needsPassbook && !passbookFile) {
      alert("Please upload the requested Bank Passbook to resubmit.");
      return;
    }

    if (needsKitchen && kitchenFiles.length === 0) {
      alert("Please select at least 1 new kitchen photo to resubmit.");
      return;
    }

    if (needsCuisine && cuisineFiles.length === 0) {
      alert("Please select at least 1 new cuisine / food photo to resubmit.");
      return;
    }

    if (needsRooms && roomFiles.length === 0) {
      alert("Please select at least 1 new room photo to resubmit.");
      return;
    }

    if (needsAddress && !address.trim()) {
      alert("Please enter the updated business address to resubmit.");
      return;
    }

    if (onResubmit) {
      onResubmit({ businessAddress: address, fssaiFile });
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();

      // Only append fields that were explicitly flagged by the admin
      if (needsAddress && address.trim()) {
        formData.append("businessAddress", address.trim());
      }

      if (needsFssai && fssaiFile) {
        formData.append("fssaiFile", fssaiFile);
      }

      if (needsLightBill && lightBillFile) {
        formData.append("lightBillFile", lightBillFile);
      }

      if (needsPassbook && passbookFile) {
        formData.append("passbookFile", passbookFile);
      }

      if (needsAadhaar) {
        if (idProofType === "AADHAAR") {
          if (adhaarFrontFile) formData.append("adhaarFrontFile", adhaarFrontFile);
          if (adhaarBackFile) formData.append("adhaarBackFile", adhaarBackFile);
        } else if (idProofType === "PAN" && panFile) {
          formData.append("adhaarFile", panFile);
        }
      }

      if (needsKitchen) {
        kitchenFiles.forEach((file, index) => {
          formData.append(`kitchenImage_${index}`, file);
        });
      }

      if (needsCuisine) {
        cuisineFiles.forEach((file, index) => {
          formData.append(`cuisineImage_${index}`, file);
        });
      }

      if (needsRooms) {
        roomFiles.forEach((file, index) => {
          formData.append(`roomImage_${index}`, file);
        });
      }

      const res = await fetchApi("/api/seller/revision", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        try {
          const profRes = await fetchApi("/api/seller/profile");
          if (profRes.ok) {
            const profData = await profRes.json();
            const usr = profData.data?.user || profData.user;
            const prof = profData.data?.profile || profData.profile;
            updateCachedProfile({
              user: usr,
              profile: prof,
              isOnline: prof?.isOnline ?? true,
            });
          }
        } catch {
          updateCachedProfile({
            profile: {
              ...seller.profile,
              verificationStatus: "PENDING",
              verificationNote: null,
              foodVerificationStatus: "PENDING",
              propertyVerificationStatus: "PENDING",
            },
          });
        }

        alert("Flagged document resubmitted successfully! Your application is now back under review.");
        router.push("/seller/verification-status");
      } else {
        const data = await res.json();
        alert(data.message || "Failed to resubmit document. Please try again.");
      }
    } catch (error) {
      console.error("Resubmit error:", error);
      alert("An unexpected error occurred during document resubmission.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container} style={{ textAlign: "center", padding: "40px 0" }}>
        <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto 12px auto", color: "#f97316" }} />
        <p style={{ color: "#64748b", fontSize: "14px" }}>Loading revision details...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Hidden Global File Inputs */}
      <input
        id="fssai-reupload-input"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: "none" }}
        onChange={(e) => handleSingleFile(e, setFssaiFile, "FSSAI Certificate")}
      />
      <input
        id="adhaar-front-input"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: "none" }}
        onChange={(e) => handleSingleFile(e, setAdhaarFrontFile, "Aadhaar Front")}
      />
      <input
        id="adhaar-back-input"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: "none" }}
        onChange={(e) => handleSingleFile(e, setAdhaarBackFile, "Aadhaar Back")}
      />
      <input
        id="pan-input"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: "none" }}
        onChange={(e) => handleSingleFile(e, setPanFile, "PAN Card")}
      />
      <input
        id="lightbill-input"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: "none" }}
        onChange={(e) => handleSingleFile(e, setLightBillFile, "Electricity Bill")}
      />
      <input
        id="passbook-input"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: "none" }}
        onChange={(e) => handleSingleFile(e, setPassbookFile, "Bank Passbook")}
      />
      <input
        id="kitchen-input"
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => handleMultiFiles(e, setKitchenFiles, "Kitchen Photos")}
      />
      <input
        id="cuisine-input"
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => handleMultiFiles(e, setCuisineFiles, "Cuisine Photos")}
      />
      <input
        id="room-input"
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => handleMultiFiles(e, setRoomFiles, "Room Photos")}
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
              Administrative review requested updates for your registration{trackingId ? ` (${trackingId})` : ""}. Please re-upload only the highlighted document(s) below. All other approved documents remain saved.
            </p>
            <div style={{ backgroundColor: "#ffffff", padding: "10px 14px", borderRadius: "8px", border: "1px solid #fca5a5", marginTop: "6px", fontSize: "13px", color: "#991b1b", whiteSpace: "pre-wrap" }}>
              {adminNote}
            </div>
          </div>
        </div>

        {/* Main Desktop Form Card */}
        <form className={styles.formCard} onSubmit={handleSubmit}>
          <div className={styles.headerGroup}>
            <h2 className={styles.title}>Re-upload Flagged Document</h2>
            <p className={styles.subtitle}>
              Only the specific item requested by admin is shown below. Non-flagged documents remain safe and unchanged.
            </p>
          </div>

          <div className={styles.formSection}>
            {/* Field: Aadhaar / Identity Proof */}
            {needsAadhaar && (
              <div className={styles.flaggedFieldCard}>
                <div className={styles.flaggedCardHeader}>
                  <h4 className={styles.flaggedCardTitle}>
                    Identity Proof (Aadhaar / PAN Card) <span className={styles.requiredStar}>*</span>
                  </h4>
                  <span className={styles.actionRequiredBadge}>[Action Required • Retake / Re-upload]</span>
                </div>

                <p className={styles.helperText} style={{ margin: "0 0 4px 0" }}>
                  Please upload a clear, high-resolution photo without glare, blur, or reflections.
                </p>

                <div className={styles.idProofToggleGroup}>
                  <button
                    type="button"
                    className={`${styles.idToggleBtn} ${idProofType === "AADHAAR" ? styles.idToggleBtnActive : ""}`}
                    onClick={() => setIdProofType("AADHAAR")}
                  >
                    Aadhaar Card (Front & Back)
                  </button>
                  <button
                    type="button"
                    className={`${styles.idToggleBtn} ${idProofType === "PAN" ? styles.idToggleBtnActive : ""}`}
                    onClick={() => setIdProofType("PAN")}
                  >
                    PAN Card
                  </button>
                </div>

                {idProofType === "AADHAAR" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {/* Front */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>
                        Front Side of Aadhaar Card <span className={styles.requiredStar}>*</span>
                      </label>
                      {prevAdhaarFront && !adhaarFrontFile && (
                        <div className={styles.prevFileNotice}>
                          <div className={styles.prevFileText}>
                            <span>Previous Uploaded Front:</span>
                            <span className={styles.prevStatusTag}>Flagged (Unclear/Retake)</span>
                          </div>
                          <button
                            type="button"
                            className={styles.viewPrevBtn}
                            onClick={() => openPreview(prevAdhaarFront, "Previous Aadhaar Front")}
                          >
                            <Eye size={13} />
                            <span>View Previous</span>
                          </button>
                        </div>
                      )}
                      {!adhaarFrontFile ? (
                        <div className={styles.flaggedUploadBox}>
                          <div className={styles.flaggedFileText}>
                            <span className={styles.flagTag}>[FRONT]</span>
                            <span className={styles.fileName}>No new clear front photo selected</span>
                          </div>
                          <button
                            type="button"
                            className={styles.reuploadBtn}
                            onClick={() => document.getElementById("adhaar-front-input")?.click()}
                          >
                            Choose New Front
                          </button>
                        </div>
                      ) : (
                        <div className={`${styles.filePreviewRow} ${styles.previewRowSuccess}`}>
                          {adhaarFrontFile.type.startsWith("image/") ? (
                            <img src={URL.createObjectURL(adhaarFrontFile)} alt="Front Preview" className={styles.previewThumb} />
                          ) : (
                            <div className={styles.previewPdfBadge}>PDF</div>
                          )}
                          <span className={styles.previewFileName}>{adhaarFrontFile.name} (New Front Ready)</span>
                          <div className={styles.fileActionBtns}>
                            <button
                              type="button"
                              className={styles.viewNewBtn}
                              onClick={() => openFilePreview(adhaarFrontFile, "New Front Preview")}
                            >
                              <Eye size={13} />
                              <span>Preview</span>
                            </button>
                            <button
                              type="button"
                              className={styles.changeBtn}
                              onClick={() => document.getElementById("adhaar-front-input")?.click()}
                            >
                              Change
                            </button>
                            <button
                              type="button"
                              className={styles.removeBtn}
                              onClick={() => setAdhaarFrontFile(null)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Back */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>
                        Back Side of Aadhaar Card
                      </label>
                      {prevAdhaarBack && !adhaarBackFile && (
                        <div className={styles.prevFileNotice}>
                          <div className={styles.prevFileText}>
                            <span>Previous Uploaded Back:</span>
                            <span className={styles.prevStatusTag}>Flagged (Unclear/Retake)</span>
                          </div>
                          <button
                            type="button"
                            className={styles.viewPrevBtn}
                            onClick={() => openPreview(prevAdhaarBack, "Previous Aadhaar Back")}
                          >
                            <Eye size={13} />
                            <span>View Previous</span>
                          </button>
                        </div>
                      )}
                      {!adhaarBackFile ? (
                        <div className={styles.flaggedUploadBox}>
                          <div className={styles.flaggedFileText}>
                            <span className={styles.flagTag}>[BACK]</span>
                            <span className={styles.fileName}>No new clear back photo selected</span>
                          </div>
                          <button
                            type="button"
                            className={styles.reuploadBtn}
                            onClick={() => document.getElementById("adhaar-back-input")?.click()}
                          >
                            Choose New Back
                          </button>
                        </div>
                      ) : (
                        <div className={`${styles.filePreviewRow} ${styles.previewRowSuccess}`}>
                          {adhaarBackFile.type.startsWith("image/") ? (
                            <img src={URL.createObjectURL(adhaarBackFile)} alt="Back Preview" className={styles.previewThumb} />
                          ) : (
                            <div className={styles.previewPdfBadge}>PDF</div>
                          )}
                          <span className={styles.previewFileName}>{adhaarBackFile.name} (New Back Ready)</span>
                          <div className={styles.fileActionBtns}>
                            <button
                              type="button"
                              className={styles.viewNewBtn}
                              onClick={() => openFilePreview(adhaarBackFile, "New Back Preview")}
                            >
                              <Eye size={13} />
                              <span>Preview</span>
                            </button>
                            <button
                              type="button"
                              className={styles.changeBtn}
                              onClick={() => document.getElementById("adhaar-back-input")?.click()}
                            >
                              Change
                            </button>
                            <button
                              type="button"
                              className={styles.removeBtn}
                              onClick={() => setAdhaarBackFile(null)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    {!panFile ? (
                      <div className={styles.flaggedUploadBox}>
                        <div className={styles.flaggedFileText}>
                          <span className={styles.flagTag}>[PAN]</span>
                          <span className={styles.fileName}>No new PAN document chosen</span>
                        </div>
                        <button
                          type="button"
                          className={styles.reuploadBtn}
                          onClick={() => document.getElementById("pan-input")?.click()}
                        >
                          Choose PAN
                        </button>
                      </div>
                    ) : (
                      <div className={`${styles.filePreviewRow} ${styles.previewRowSuccess}`}>
                        {panFile.type.startsWith("image/") ? (
                          <img src={URL.createObjectURL(panFile)} alt="PAN Preview" className={styles.previewThumb} />
                        ) : (
                          <div className={styles.previewPdfBadge}>PDF</div>
                        )}
                        <span className={styles.previewFileName}>{panFile.name} (Ready)</span>
                        <div className={styles.fileActionBtns}>
                          <button
                            type="button"
                            className={styles.viewNewBtn}
                            onClick={() => openFilePreview(panFile, "PAN Preview")}
                          >
                            <Eye size={13} />
                            <span>Preview</span>
                          </button>
                          <button
                            type="button"
                            className={styles.changeBtn}
                            onClick={() => document.getElementById("pan-input")?.click()}
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            className={styles.removeBtn}
                            onClick={() => setPanFile(null)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Field: FSSAI Certificate */}
            {needsFssai && (
              <div className={styles.flaggedFieldCard}>
                <div className={styles.flaggedCardHeader}>
                  <h4 className={styles.flaggedCardTitle}>
                    FSSAI Certificate Re-upload <span className={styles.requiredStar}>*</span>
                  </h4>
                  <span className={styles.actionRequiredBadge}>[Action Required • Retake / Re-upload]</span>
                </div>

                {prevFssaiUrl && !fssaiFile && (
                  <div className={styles.prevFileNotice}>
                    <div className={styles.prevFileText}>
                      <span>Previous Uploaded FSSAI:</span>
                      <span className={styles.prevStatusTag}>Flagged (Unclear/Retake)</span>
                    </div>
                    <button
                      type="button"
                      className={styles.viewPrevBtn}
                      onClick={() => openPreview(prevFssaiUrl, "Previous FSSAI Certificate")}
                    >
                      <Eye size={13} />
                      <span>View Previous</span>
                    </button>
                  </div>
                )}

                {!fssaiFile ? (
                  <div
                    className={`${styles.flaggedUploadBox} ${isDragging === "fssai" ? styles.flaggedUploadBoxDragging : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging("fssai"); }}
                    onDragLeave={() => setIsDragging(null)}
                    onDrop={(e) => handleDropSingle(e, setFssaiFile, "FSSAI Certificate")}
                  >
                    <div className={styles.flaggedFileText}>
                      <span className={styles.flagTag}>[FSSAI]</span>
                      <span className={styles.fileName}>No new FSSAI document chosen</span>
                    </div>
                    <button
                      type="button"
                      className={styles.reuploadBtn}
                      onClick={() => document.getElementById("fssai-reupload-input")?.click()}
                    >
                      Choose File
                    </button>
                  </div>
                ) : (
                  <div className={`${styles.filePreviewRow} ${styles.previewRowSuccess}`}>
                    {fssaiFile.type.startsWith("image/") ? (
                      <img src={URL.createObjectURL(fssaiFile)} alt="FSSAI Preview" className={styles.previewThumb} />
                    ) : (
                      <div className={styles.previewPdfBadge}>PDF</div>
                    )}
                    <span className={styles.previewFileName}>{fssaiFile.name} (Ready)</span>
                    <div className={styles.fileActionBtns}>
                      <button
                        type="button"
                        className={styles.viewNewBtn}
                        onClick={() => openFilePreview(fssaiFile, "New FSSAI Preview")}
                      >
                        <Eye size={13} />
                        <span>Preview</span>
                      </button>
                      <button
                        type="button"
                        className={styles.changeBtn}
                        onClick={() => document.getElementById("fssai-reupload-input")?.click()}
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => setFssaiFile(null)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
                <p className={styles.helperText} style={{ margin: "0" }}>
                  FSSAI certificate document must be a high-resolution scanned PDF or JPG under 5MB.
                </p>
              </div>
            )}

            {/* Field: Electricity Bill / Light Bill */}
            {needsLightBill && (
              <div className={styles.flaggedFieldCard}>
                <div className={styles.flaggedCardHeader}>
                  <h4 className={styles.flaggedCardTitle}>
                    Electricity Bill (Light Bill) <span className={styles.requiredStar}>*</span>
                  </h4>
                  <span className={styles.actionRequiredBadge}>[Action Required • Retake / Re-upload]</span>
                </div>

                {prevLightBillUrl && !lightBillFile && (
                  <div className={styles.prevFileNotice}>
                    <div className={styles.prevFileText}>
                      <span>Previous Uploaded Bill:</span>
                      <span className={styles.prevStatusTag}>Flagged (Unclear/Retake)</span>
                    </div>
                    <button
                      type="button"
                      className={styles.viewPrevBtn}
                      onClick={() => openPreview(prevLightBillUrl, "Previous Electricity Bill")}
                    >
                      <Eye size={13} />
                      <span>View Previous</span>
                    </button>
                  </div>
                )}

                {!lightBillFile ? (
                  <div className={styles.flaggedUploadBox}>
                    <div className={styles.flaggedFileText}>
                      <span className={styles.flagTag}>[UTILITY]</span>
                      <span className={styles.fileName}>No new electricity bill chosen</span>
                    </div>
                    <button
                      type="button"
                      className={styles.reuploadBtn}
                      onClick={() => document.getElementById("lightbill-input")?.click()}
                    >
                      Choose Bill
                    </button>
                  </div>
                ) : (
                  <div className={`${styles.filePreviewRow} ${styles.previewRowSuccess}`}>
                    {lightBillFile.type.startsWith("image/") ? (
                      <img src={URL.createObjectURL(lightBillFile)} alt="Bill Preview" className={styles.previewThumb} />
                    ) : (
                      <div className={styles.previewPdfBadge}>PDF</div>
                    )}
                    <span className={styles.previewFileName}>{lightBillFile.name} (Ready)</span>
                    <div className={styles.fileActionBtns}>
                      <button
                        type="button"
                        className={styles.viewNewBtn}
                        onClick={() => openFilePreview(lightBillFile, "Electricity Bill Preview")}
                      >
                        <Eye size={13} />
                        <span>Preview</span>
                      </button>
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => setLightBillFile(null)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Field: Bank Passbook */}
            {needsPassbook && (
              <div className={styles.flaggedFieldCard}>
                <div className={styles.flaggedCardHeader}>
                  <h4 className={styles.flaggedCardTitle}>
                    Bank Passbook / Cheque <span className={styles.requiredStar}>*</span>
                  </h4>
                  <span className={styles.actionRequiredBadge}>[Action Required • Retake / Re-upload]</span>
                </div>

                {prevPassbookUrl && !passbookFile && (
                  <div className={styles.prevFileNotice}>
                    <div className={styles.prevFileText}>
                      <span>Previous Uploaded Passbook:</span>
                      <span className={styles.prevStatusTag}>Flagged (Unclear/Retake)</span>
                    </div>
                    <button
                      type="button"
                      className={styles.viewPrevBtn}
                      onClick={() => openPreview(prevPassbookUrl, "Previous Bank Passbook")}
                    >
                      <Eye size={13} />
                      <span>View Previous</span>
                    </button>
                  </div>
                )}

                {!passbookFile ? (
                  <div className={styles.flaggedUploadBox}>
                    <div className={styles.flaggedFileText}>
                      <span className={styles.flagTag}>[PASSBOOK]</span>
                      <span className={styles.fileName}>No new passbook chosen</span>
                    </div>
                    <button
                      type="button"
                      className={styles.reuploadBtn}
                      onClick={() => document.getElementById("passbook-input")?.click()}
                    >
                      Choose File
                    </button>
                  </div>
                ) : (
                  <div className={`${styles.filePreviewRow} ${styles.previewRowSuccess}`}>
                    {passbookFile.type.startsWith("image/") ? (
                      <img src={URL.createObjectURL(passbookFile)} alt="Passbook Preview" className={styles.previewThumb} />
                    ) : (
                      <div className={styles.previewPdfBadge}>PDF</div>
                    )}
                    <span className={styles.previewFileName}>{passbookFile.name} (Ready)</span>
                    <div className={styles.fileActionBtns}>
                      <button
                        type="button"
                        className={styles.viewNewBtn}
                        onClick={() => openFilePreview(passbookFile, "Passbook Preview")}
                      >
                        <Eye size={13} />
                        <span>Preview</span>
                      </button>
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => setPassbookFile(null)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Field: Kitchen Images */}
            {needsKitchen && (
              <div className={styles.flaggedFieldCard}>
                <div className={styles.flaggedCardHeader}>
                  <h4 className={styles.flaggedCardTitle}>
                    Kitchen Images (Up to 3 photos) <span className={styles.requiredStar}>*</span>
                  </h4>
                  <span className={styles.actionRequiredBadge}>[Action Required • Retake / Re-upload]</span>
                </div>
                <div className={styles.flaggedUploadBox}>
                  <div className={styles.flaggedFileText}>
                    <span className={styles.flagTag}>[PHOTOS]</span>
                    <span className={styles.fileName}>{kitchenFiles.length} / 3 selected</span>
                  </div>
                  <button
                    type="button"
                    className={styles.reuploadBtn}
                    onClick={() => document.getElementById("kitchen-input")?.click()}
                  >
                    Choose Photos
                  </button>
                </div>
                {kitchenFiles.length > 0 && (
                  <div className={styles.photoGrid}>
                    {kitchenFiles.map((f, i) => (
                      <div key={i} className={styles.photoThumbWrapper}>
                        <img src={URL.createObjectURL(f)} alt={`Kitchen ${i}`} className={styles.photoThumb} />
                        <button
                          type="button"
                          className={styles.photoRemoveBtn}
                          onClick={() => setKitchenFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Field: Cuisine Images */}
            {needsCuisine && (
              <div className={styles.flaggedFieldCard}>
                <div className={styles.flaggedCardHeader}>
                  <h4 className={styles.flaggedCardTitle}>
                    Cuisine / Food Images (Up to 3 photos) <span className={styles.requiredStar}>*</span>
                  </h4>
                  <span className={styles.actionRequiredBadge}>[Action Required • Retake / Re-upload]</span>
                </div>
                <div className={styles.flaggedUploadBox}>
                  <div className={styles.flaggedFileText}>
                    <span className={styles.flagTag}>[PHOTOS]</span>
                    <span className={styles.fileName}>{cuisineFiles.length} / 3 selected</span>
                  </div>
                  <button
                    type="button"
                    className={styles.reuploadBtn}
                    onClick={() => document.getElementById("cuisine-input")?.click()}
                  >
                    Choose Photos
                  </button>
                </div>
                {cuisineFiles.length > 0 && (
                  <div className={styles.photoGrid}>
                    {cuisineFiles.map((f, i) => (
                      <div key={i} className={styles.photoThumbWrapper}>
                        <img src={URL.createObjectURL(f)} alt={`Cuisine ${i}`} className={styles.photoThumb} />
                        <button
                          type="button"
                          className={styles.photoRemoveBtn}
                          onClick={() => setCuisineFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Field: Room Images */}
            {needsRooms && (
              <div className={styles.flaggedFieldCard}>
                <div className={styles.flaggedCardHeader}>
                  <h4 className={styles.flaggedCardTitle}>
                    Room Photos (Up to 3 photos) <span className={styles.requiredStar}>*</span>
                  </h4>
                  <span className={styles.actionRequiredBadge}>[Action Required • Retake / Re-upload]</span>
                </div>
                <div className={styles.flaggedUploadBox}>
                  <div className={styles.flaggedFileText}>
                    <span className={styles.flagTag}>[ROOMS]</span>
                    <span className={styles.fileName}>{roomFiles.length} / 3 selected</span>
                  </div>
                  <button
                    type="button"
                    className={styles.reuploadBtn}
                    onClick={() => document.getElementById("room-input")?.click()}
                  >
                    Choose Photos
                  </button>
                </div>
                {roomFiles.length > 0 && (
                  <div className={styles.photoGrid}>
                    {roomFiles.map((f, i) => (
                      <div key={i} className={styles.photoThumbWrapper}>
                        <img src={URL.createObjectURL(f)} alt={`Room ${i}`} className={styles.photoThumb} />
                        <button
                          type="button"
                          className={styles.photoRemoveBtn}
                          onClick={() => setRoomFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Field: Correct Business Address (Only rendered if specifically flagged) */}
            {needsAddress && (
              <div className={styles.flaggedFieldCard}>
                <div className={styles.flaggedCardHeader}>
                  <h4 className={styles.flaggedCardTitle}>
                    Business Address <span className={styles.requiredStar}>*</span>
                  </h4>
                  <span className={styles.actionRequiredBadge}>[Action Required • Correction]</span>
                </div>
                <input
                  type="text"
                  className={styles.flaggedInput}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter correct full business address"
                  required={needsAddress}
                />
                <p className={styles.helperText} style={{ margin: "0" }}>
                  Must accurately match your physical location and legal registry records.
                </p>
              </div>
            )}
          </div>

          <div className={styles.divider} />

          <div className={styles.actionFooter}>
            <Link href="/seller/verification-status" className={styles.backBtn}>
              Back to Status
            </Link>
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Resubmitting...</span>
                </>
              ) : (
                <>
                  <span>Resubmit for Verification</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE VIEW (Strictly mirrors Desktop flagged items)                   */}
      {/* ========================================================================= */}
      <form className={styles.mobileOnly} onSubmit={handleSubmit}>
        {/* Amber Notification Card */}
        <div className={styles.mobileAlertBanner}>
          <div className={styles.mobileAlertIconCircle}>
            <AlertCircle size={18} className={styles.mobileAlertIcon} />
          </div>
          <p className={styles.mobileAlertText}>
            {adminNote || "Please re-upload your flagged document to continue onboarding."}
          </p>
        </div>

        {/* Mobile Field: Aadhaar Front / Back */}
        {needsAadhaar && (
          <div className={styles.mobileFlaggedCard}>
            <div className={styles.mobileCardHeader}>
              <span className={styles.mobileCardTitle}>
                Identity Proof (Aadhaar Card) <span className={styles.mobileRequiredStar}>*</span>
              </span>
              <span className={styles.actionRequiredBadge}>[Retake]</span>
            </div>

            <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
              Upload clear, sharp photo without glare or blur.
            </p>

            {prevAdhaarFront && !adhaarFrontFile && (
              <div className={styles.mobilePrevNotice}>
                <span>Previous: <strong>Unclear/Retake</strong></span>
                <button
                  type="button"
                  className={styles.viewPrevBtn}
                  onClick={() => openPreview(prevAdhaarFront, "Previous Aadhaar")}
                >
                  <Eye size={12} />
                  <span>View</span>
                </button>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div
                className={`${styles.mobileDropzoneBox} ${adhaarFrontFile ? styles.mobileDropzoneSuccess : ""}`}
                style={{ padding: "14px 10px" }}
                onClick={() => document.getElementById("adhaar-front-input")?.click()}
              >
                {adhaarFrontFile ? (
                  <CheckCircle2 size={20} className={styles.mobileSuccessIcon} />
                ) : (
                  <Upload size={20} className={styles.mobileUploadIcon} />
                )}
                <span style={{ fontSize: "12px", fontWeight: "600", marginTop: "4px" }}>
                  {adhaarFrontFile ? "Front Added" : "Upload Front"}
                </span>
                {adhaarFrontFile && (
                  <span style={{ fontSize: "10px", color: "#16a34a" }}>Tap to change</span>
                )}
              </div>

              <div
                className={`${styles.mobileDropzoneBox} ${adhaarBackFile ? styles.mobileDropzoneSuccess : ""}`}
                style={{ padding: "14px 10px" }}
                onClick={() => document.getElementById("adhaar-back-input")?.click()}
              >
                {adhaarBackFile ? (
                  <CheckCircle2 size={20} className={styles.mobileSuccessIcon} />
                ) : (
                  <Upload size={20} className={styles.mobileUploadIcon} />
                )}
                <span style={{ fontSize: "12px", fontWeight: "600", marginTop: "4px" }}>
                  {adhaarBackFile ? "Back Added" : "Upload Back"}
                </span>
                {adhaarBackFile && (
                  <span style={{ fontSize: "10px", color: "#16a34a" }}>Tap to change</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Field: FSSAI License */}
        {needsFssai && (
          <div className={styles.mobileFlaggedCard}>
            <div className={styles.mobileCardHeader}>
              <span className={styles.mobileCardTitle}>
                FSSAI License <span className={styles.mobileRequiredStar}>*</span>
              </span>
              <span className={styles.actionRequiredBadge}>[Retake]</span>
            </div>

            {prevFssaiUrl && !fssaiFile && (
              <div className={styles.mobilePrevNotice}>
                <span>Previous FSSAI: <strong>Flagged</strong></span>
                <button
                  type="button"
                  className={styles.viewPrevBtn}
                  onClick={() => openPreview(prevFssaiUrl, "Previous FSSAI")}
                >
                  <Eye size={12} />
                  <span>View</span>
                </button>
              </div>
            )}

            <div
              className={`${styles.mobileDropzoneBox} ${
                fssaiFile
                  ? styles.mobileDropzoneSuccess
                  : isDragging === "fssai"
                  ? styles.mobileDropzoneBoxDragging
                  : ""
              }`}
              onClick={() => document.getElementById("fssai-reupload-input")?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging("fssai"); }}
              onDragLeave={() => setIsDragging(null)}
              onDrop={(e) => handleDropSingle(e, setFssaiFile, "FSSAI License")}
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
                {fssaiFile ? "Valid File • Click to change" : "PDF, PNG or JPG (Max 5MB)"}
              </span>
            </div>
          </div>
        )}

        {/* Mobile Field: Electricity Bill */}
        {needsLightBill && (
          <div className={styles.mobileFlaggedCard}>
            <div className={styles.mobileCardHeader}>
              <span className={styles.mobileCardTitle}>
                Electricity Bill <span className={styles.mobileRequiredStar}>*</span>
              </span>
              <span className={styles.actionRequiredBadge}>[Retake]</span>
            </div>
            <div
              className={`${styles.mobileDropzoneBox} ${lightBillFile ? styles.mobileDropzoneSuccess : ""}`}
              onClick={() => document.getElementById("lightbill-input")?.click()}
            >
              {lightBillFile ? (
                <CheckCircle2 size={24} className={styles.mobileSuccessIcon} />
              ) : (
                <Upload size={24} className={styles.mobileUploadIcon} />
              )}
              <span className={styles.mobileUploadTitle}>
                {lightBillFile ? lightBillFile.name : "Re-upload Electricity Bill"}
              </span>
            </div>
          </div>
        )}

        {/* Mobile Field: Bank Passbook */}
        {needsPassbook && (
          <div className={styles.mobileFlaggedCard}>
            <div className={styles.mobileCardHeader}>
              <span className={styles.mobileCardTitle}>
                Bank Passbook <span className={styles.mobileRequiredStar}>*</span>
              </span>
              <span className={styles.actionRequiredBadge}>[Retake]</span>
            </div>
            <div
              className={`${styles.mobileDropzoneBox} ${passbookFile ? styles.mobileDropzoneSuccess : ""}`}
              onClick={() => document.getElementById("passbook-input")?.click()}
            >
              {passbookFile ? (
                <CheckCircle2 size={24} className={styles.mobileSuccessIcon} />
              ) : (
                <Upload size={24} className={styles.mobileUploadIcon} />
              )}
              <span className={styles.mobileUploadTitle}>
                {passbookFile ? passbookFile.name : "Re-upload Passbook / Cheque"}
              </span>
            </div>
          </div>
        )}

        {/* Mobile Field: Kitchen Photos */}
        {needsKitchen && (
          <div className={styles.mobileFlaggedCard}>
            <div className={styles.mobileCardHeader}>
              <span className={styles.mobileCardTitle}>
                Kitchen Photos ({kitchenFiles.length}/3) <span className={styles.mobileRequiredStar}>*</span>
              </span>
              <span className={styles.actionRequiredBadge}>[Retake]</span>
            </div>
            <div
              className={styles.mobileDropzoneBox}
              onClick={() => document.getElementById("kitchen-input")?.click()}
            >
              <Upload size={24} className={styles.mobileUploadIcon} />
              <span className={styles.mobileUploadTitle}>Choose New Kitchen Photos</span>
            </div>
          </div>
        )}

        {/* Mobile Field: Cuisine Photos */}
        {needsCuisine && (
          <div className={styles.mobileFlaggedCard}>
            <div className={styles.mobileCardHeader}>
              <span className={styles.mobileCardTitle}>
                Cuisine Photos ({cuisineFiles.length}/3) <span className={styles.mobileRequiredStar}>*</span>
              </span>
              <span className={styles.actionRequiredBadge}>[Retake]</span>
            </div>
            <div
              className={styles.mobileDropzoneBox}
              onClick={() => document.getElementById("cuisine-input")?.click()}
            >
              <Upload size={24} className={styles.mobileUploadIcon} />
              <span className={styles.mobileUploadTitle}>Choose New Cuisine Photos</span>
            </div>
          </div>
        )}

        {/* Mobile Field: Room Photos */}
        {needsRooms && (
          <div className={styles.mobileFlaggedCard}>
            <div className={styles.mobileCardHeader}>
              <span className={styles.mobileCardTitle}>
                Room Photos ({roomFiles.length}/3) <span className={styles.mobileRequiredStar}>*</span>
              </span>
              <span className={styles.actionRequiredBadge}>[Retake]</span>
            </div>
            <div
              className={styles.mobileDropzoneBox}
              onClick={() => document.getElementById("room-input")?.click()}
            >
              <Upload size={24} className={styles.mobileUploadIcon} />
              <span className={styles.mobileUploadTitle}>Choose New Room Photos</span>
            </div>
          </div>
        )}

        {/* Mobile Field: Business Address (Strictly conditional) */}
        {needsAddress && (
          <div className={styles.mobileFlaggedCard}>
            <div className={styles.mobileCardHeader}>
              <span className={styles.mobileCardTitle}>
                Business Address <span className={styles.mobileRequiredStar}>*</span>
              </span>
              <span className={styles.actionRequiredBadge}>[Correction]</span>
            </div>
            <textarea
              className={styles.mobileTextarea}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              placeholder="Enter full corrected business address"
              required={needsAddress}
            />
          </div>
        )}

        {/* Fixed Mobile Bottom Action Bar */}
        <div className={styles.mobileBottomActionBar}>
          <button type="submit" className={styles.mobileSubmitBtn} disabled={submitting}>
            {submitting ? "Resubmitting..." : "Resubmit for Verification"}
          </button>
        </div>
      </form>

      {/* Image Preview Modal (Full resolution viewer) */}
      {previewModalUrl && (
        <div
          className={styles.imagePreviewOverlay}
          onClick={() => setPreviewModalUrl(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.imagePreviewCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.imagePreviewHeader}>
              <h4 className={styles.imagePreviewTitle}>{previewModalTitle || "Document Preview"}</h4>
              <button
                type="button"
                className={styles.imagePreviewCloseBtn}
                onClick={() => setPreviewModalUrl(null)}
                title="Close Preview"
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.imagePreviewBody}>
              <img src={previewModalUrl} alt="Document Preview" className={styles.imagePreviewImg} />
            </div>
          </div>
        </div>
      )}

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
                The selected {oversizeDocName} is larger than the 5MB upload limit.
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
