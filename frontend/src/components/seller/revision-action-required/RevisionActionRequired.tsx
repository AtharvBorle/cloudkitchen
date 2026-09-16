"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Upload, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Loader2, Image as ImageIcon, FileText } from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";
import { useSellerProfile } from "@/hooks/useSellerProfile";
import styles from "./RevisionActionRequired.module.css";

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

  // Flag detection
  const [needsFssai, setNeedsFssai] = useState(false);
  const [needsAadhaar, setNeedsAadhaar] = useState(false);
  const [needsLightBill, setNeedsLightBill] = useState(false);
  const [needsPassbook, setNeedsPassbook] = useState(false);
  const [needsKitchen, setNeedsKitchen] = useState(false);
  const [needsCuisine, setNeedsCuisine] = useState(false);
  const [needsRooms, setNeedsRooms] = useState(false);
  const [needsAddress, setNeedsAddress] = useState(false);

  // Toggle for additional non-flagged documents
  const [showOptionalDocs, setShowOptionalDocs] = useState(false);
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

          const note = profile.verificationNote || "Administrative review requested changes to your documents.";
          setAdminNote(note);

          const lower = note.toLowerCase();
          const hasAadhaar = lower.includes("aadhaar") || lower.includes("adhaar") || lower.includes("id proof") || lower.includes("identity") || lower.includes("pan");
          const hasFssai = lower.includes("fssai") || lower.includes("license");
          const hasLightBill = lower.includes("light bill") || lower.includes("electricity bill") || lower.includes("utility");
          const hasPassbook = lower.includes("passbook") || lower.includes("bank");
          const hasKitchen = lower.includes("kitchen");
          const hasCuisine = lower.includes("cuisine") || lower.includes("food");
          const hasRooms = lower.includes("room");
          const hasAddr = lower.includes("address") || lower.includes("location");

          // If note has specific flags, enable them; if none matched, enable FSSAI and ID proof by default
          const anyFlagged = hasAadhaar || hasFssai || hasLightBill || hasPassbook || hasKitchen || hasCuisine || hasRooms || hasAddr;

          setNeedsAadhaar(hasAadhaar || (!anyFlagged && true));
          setNeedsFssai(hasFssai || (!anyFlagged && true));
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

  const handleSingleFile = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  const handleMultiFiles = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File[]>>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files).slice(0, 3);
      setter(prev => [...prev, ...selected].slice(0, 3));
    }
  };

  const handleDropSingle = (e: React.DragEvent, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setter(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (onResubmit) {
      onResubmit({ businessAddress: address, fssaiFile });
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      if (address.trim()) {
        formData.append("businessAddress", address.trim());
      }

      if (fssaiFile) formData.append("fssaiFile", fssaiFile);
      if (lightBillFile) formData.append("lightBillFile", lightBillFile);
      if (passbookFile) formData.append("passbookFile", passbookFile);

      if (idProofType === "AADHAAR") {
        if (adhaarFrontFile) formData.append("adhaarFrontFile", adhaarFrontFile);
        if (adhaarBackFile) formData.append("adhaarBackFile", adhaarBackFile);
      } else {
        if (panFile) formData.append("adhaarFile", panFile);
      }

      kitchenFiles.forEach((file, index) => {
        formData.append(`kitchenImage_${index}`, file);
      });
      cuisineFiles.forEach((file, index) => {
        formData.append(`cuisineImage_${index}`, file);
      });
      roomFiles.forEach((file, index) => {
        formData.append(`roomImage_${index}`, file);
      });

      const res = await fetchApi("/api/seller/revision", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        alert("Documents resubmitted successfully! Your application is now back under review.");
        router.push("/seller/verification-status");
      } else {
        const data = await res.json();
        alert(data.message || "Failed to resubmit documents. Please try again.");
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
        onChange={(e) => handleSingleFile(e, setFssaiFile)}
      />
      <input
        id="adhaar-front-input"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: "none" }}
        onChange={(e) => handleSingleFile(e, setAdhaarFrontFile)}
      />
      <input
        id="adhaar-back-input"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: "none" }}
        onChange={(e) => handleSingleFile(e, setAdhaarBackFile)}
      />
      <input
        id="pan-input"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: "none" }}
        onChange={(e) => handleSingleFile(e, setPanFile)}
      />
      <input
        id="lightbill-input"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: "none" }}
        onChange={(e) => handleSingleFile(e, setLightBillFile)}
      />
      <input
        id="passbook-input"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: "none" }}
        onChange={(e) => handleSingleFile(e, setPassbookFile)}
      />
      <input
        id="kitchen-input"
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => handleMultiFiles(e, setKitchenFiles)}
      />
      <input
        id="cuisine-input"
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => handleMultiFiles(e, setCuisineFiles)}
      />
      <input
        id="room-input"
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => handleMultiFiles(e, setRoomFiles)}
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
              Administrative review requested updates for your registration{trackingId ? ` (${trackingId})` : ""}. Please address the following feedback:
            </p>
            <div style={{ backgroundColor: "#ffffff", padding: "10px 14px", borderRadius: "8px", border: "1px solid #fca5a5", marginTop: "6px", fontSize: "13px", color: "#991b1b", whiteSpace: "pre-wrap" }}>
              {adminNote}
            </div>
          </div>
        </div>

        {/* Main Desktop Form Card */}
        <form className={styles.formCard} onSubmit={handleSubmit}>
          <div className={styles.headerGroup}>
            <h2 className={styles.title}>Correct Flagged Information</h2>
            <p className={styles.subtitle}>
              Re-upload the requested documents or update information to resume verification.
            </p>
          </div>

          <div className={styles.formSection}>
            {/* Field: FSSAI Certificate */}
            {needsFssai && (
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  FSSAI Certificate Re-upload <span className={styles.requiredStar}>*</span>
                </label>
                {!fssaiFile ? (
                  <div
                    className={`${styles.flaggedUploadBox} ${isDragging === "fssai" ? styles.flaggedUploadBoxDragging : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging("fssai"); }}
                    onDragLeave={() => setIsDragging(null)}
                    onDrop={(e) => handleDropSingle(e, setFssaiFile)}
                  >
                    <div className={styles.flaggedFileText}>
                      <span className={styles.flagTag}>[ACTION_REQUIRED]</span>
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
                  <div className={styles.filePreviewRow}>
                    {fssaiFile.type.startsWith("image/") ? (
                      <img src={URL.createObjectURL(fssaiFile)} alt="FSSAI Preview" className={styles.previewThumb} />
                    ) : (
                      <div className={styles.previewPdfBadge}>PDF</div>
                    )}
                    <span className={styles.previewFileName}>{fssaiFile.name}</span>
                    <div className={styles.fileActionBtns}>
                      <button type="button" className={styles.changeBtn} onClick={() => document.getElementById("fssai-reupload-input")?.click()}>
                        Change
                      </button>
                      <button type="button" className={styles.removeBtn} onClick={() => setFssaiFile(null)}>
                        Remove
                      </button>
                    </div>
                  </div>
                )}
                <p className={styles.helperText}>
                  FSSAI certificate document must be a high-resolution scanned PDF or JPG under 5MB.
                </p>
              </div>
            )}

            {/* Field: Aadhaar / Identity Proof */}
            {needsAadhaar && (
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Identity Proof (Aadhaar / PAN Card) <span className={styles.requiredStar}>*</span>
                </label>
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
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {/* Front */}
                    {!adhaarFrontFile ? (
                      <div className={styles.flaggedUploadBox}>
                        <div className={styles.flaggedFileText}>
                          <span className={styles.flagTag}>[FRONT]</span>
                          <span className={styles.fileName}>No new front side chosen</span>
                        </div>
                        <button type="button" className={styles.reuploadBtn} onClick={() => document.getElementById("adhaar-front-input")?.click()}>
                          Choose Front
                        </button>
                      </div>
                    ) : (
                      <div className={styles.filePreviewRow}>
                        {adhaarFrontFile.type.startsWith("image/") ? (
                          <img src={URL.createObjectURL(adhaarFrontFile)} alt="Front" className={styles.previewThumb} />
                        ) : (
                          <div className={styles.previewPdfBadge}>PDF</div>
                        )}
                        <span className={styles.previewFileName}>{adhaarFrontFile.name} (Front)</span>
                        <button type="button" className={styles.removeBtn} onClick={() => setAdhaarFrontFile(null)}>Remove</button>
                      </div>
                    )}

                    {/* Back */}
                    {!adhaarBackFile ? (
                      <div className={styles.flaggedUploadBox}>
                        <div className={styles.flaggedFileText}>
                          <span className={styles.flagTag}>[BACK]</span>
                          <span className={styles.fileName}>No new back side chosen</span>
                        </div>
                        <button type="button" className={styles.reuploadBtn} onClick={() => document.getElementById("adhaar-back-input")?.click()}>
                          Choose Back
                        </button>
                      </div>
                    ) : (
                      <div className={styles.filePreviewRow}>
                        {adhaarBackFile.type.startsWith("image/") ? (
                          <img src={URL.createObjectURL(adhaarBackFile)} alt="Back" className={styles.previewThumb} />
                        ) : (
                          <div className={styles.previewPdfBadge}>PDF</div>
                        )}
                        <span className={styles.previewFileName}>{adhaarBackFile.name} (Back)</span>
                        <button type="button" className={styles.removeBtn} onClick={() => setAdhaarBackFile(null)}>Remove</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {!panFile ? (
                      <div className={styles.flaggedUploadBox}>
                        <div className={styles.flaggedFileText}>
                          <span className={styles.flagTag}>[PAN]</span>
                          <span className={styles.fileName}>No new PAN document chosen</span>
                        </div>
                        <button type="button" className={styles.reuploadBtn} onClick={() => document.getElementById("pan-input")?.click()}>
                          Choose PAN
                        </button>
                      </div>
                    ) : (
                      <div className={styles.filePreviewRow}>
                        {panFile.type.startsWith("image/") ? (
                          <img src={URL.createObjectURL(panFile)} alt="PAN" className={styles.previewThumb} />
                        ) : (
                          <div className={styles.previewPdfBadge}>PDF</div>
                        )}
                        <span className={styles.previewFileName}>{panFile.name}</span>
                        <button type="button" className={styles.removeBtn} onClick={() => setPanFile(null)}>Remove</button>
                      </div>
                    )}
                  </div>
                )}
                <p className={styles.helperText}>
                  Please ensure identity documents are clear, without reflections or watermarks.
                </p>
              </div>
            )}

            {/* Field: Electricity Bill / Light Bill */}
            {needsLightBill && (
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Electricity Bill (Light Bill) <span className={styles.requiredStar}>*</span>
                </label>
                {!lightBillFile ? (
                  <div className={styles.flaggedUploadBox}>
                    <div className={styles.flaggedFileText}>
                      <span className={styles.flagTag}>[UTILITY]</span>
                      <span className={styles.fileName}>No new electricity bill chosen</span>
                    </div>
                    <button type="button" className={styles.reuploadBtn} onClick={() => document.getElementById("lightbill-input")?.click()}>
                      Choose Bill
                    </button>
                  </div>
                ) : (
                  <div className={styles.filePreviewRow}>
                    {lightBillFile.type.startsWith("image/") ? (
                      <img src={URL.createObjectURL(lightBillFile)} alt="Bill" className={styles.previewThumb} />
                    ) : (
                      <div className={styles.previewPdfBadge}>PDF</div>
                    )}
                    <span className={styles.previewFileName}>{lightBillFile.name}</span>
                    <button type="button" className={styles.removeBtn} onClick={() => setLightBillFile(null)}>Remove</button>
                  </div>
                )}
              </div>
            )}

            {/* Field: Bank Passbook */}
            {needsPassbook && (
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Bank Passbook / Cheque <span className={styles.requiredStar}>*</span>
                </label>
                {!passbookFile ? (
                  <div className={styles.flaggedUploadBox}>
                    <div className={styles.flaggedFileText}>
                      <span className={styles.flagTag}>[PASSBOOK]</span>
                      <span className={styles.fileName}>No new passbook chosen</span>
                    </div>
                    <button type="button" className={styles.reuploadBtn} onClick={() => document.getElementById("passbook-input")?.click()}>
                      Choose File
                    </button>
                  </div>
                ) : (
                  <div className={styles.filePreviewRow}>
                    {passbookFile.type.startsWith("image/") ? (
                      <img src={URL.createObjectURL(passbookFile)} alt="Passbook" className={styles.previewThumb} />
                    ) : (
                      <div className={styles.previewPdfBadge}>PDF</div>
                    )}
                    <span className={styles.previewFileName}>{passbookFile.name}</span>
                    <button type="button" className={styles.removeBtn} onClick={() => setPassbookFile(null)}>Remove</button>
                  </div>
                )}
              </div>
            )}

            {/* Field: Kitchen Images */}
            {needsKitchen && (
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Kitchen Images (Up to 3 photos) <span className={styles.requiredStar}>*</span>
                </label>
                <div className={styles.flaggedUploadBox}>
                  <div className={styles.flaggedFileText}>
                    <span className={styles.flagTag}>[PHOTOS]</span>
                    <span className={styles.fileName}>{kitchenFiles.length} / 3 selected</span>
                  </div>
                  <button type="button" className={styles.reuploadBtn} onClick={() => document.getElementById("kitchen-input")?.click()}>
                    Choose Photos
                  </button>
                </div>
                {kitchenFiles.length > 0 && (
                  <div className={styles.photoGrid}>
                    {kitchenFiles.map((f, i) => (
                      <div key={i} className={styles.photoThumbWrapper}>
                        <img src={URL.createObjectURL(f)} alt={`Kitchen ${i}`} className={styles.photoThumb} />
                        <button type="button" className={styles.photoRemoveBtn} onClick={() => setKitchenFiles(prev => prev.filter((_, idx) => idx !== i))}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Field: Cuisine Images */}
            {needsCuisine && (
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Cuisine / Food Images (Up to 3 photos) <span className={styles.requiredStar}>*</span>
                </label>
                <div className={styles.flaggedUploadBox}>
                  <div className={styles.flaggedFileText}>
                    <span className={styles.flagTag}>[PHOTOS]</span>
                    <span className={styles.fileName}>{cuisineFiles.length} / 3 selected</span>
                  </div>
                  <button type="button" className={styles.reuploadBtn} onClick={() => document.getElementById("cuisine-input")?.click()}>
                    Choose Photos
                  </button>
                </div>
                {cuisineFiles.length > 0 && (
                  <div className={styles.photoGrid}>
                    {cuisineFiles.map((f, i) => (
                      <div key={i} className={styles.photoThumbWrapper}>
                        <img src={URL.createObjectURL(f)} alt={`Cuisine ${i}`} className={styles.photoThumb} />
                        <button type="button" className={styles.photoRemoveBtn} onClick={() => setCuisineFiles(prev => prev.filter((_, idx) => idx !== i))}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Field: Room Images */}
            {needsRooms && (
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Room Photos (Up to 3 photos) <span className={styles.requiredStar}>*</span>
                </label>
                <div className={styles.flaggedUploadBox}>
                  <div className={styles.flaggedFileText}>
                    <span className={styles.flagTag}>[ROOMS]</span>
                    <span className={styles.fileName}>{roomFiles.length} / 3 selected</span>
                  </div>
                  <button type="button" className={styles.reuploadBtn} onClick={() => document.getElementById("room-input")?.click()}>
                    Choose Photos
                  </button>
                </div>
                {roomFiles.length > 0 && (
                  <div className={styles.photoGrid}>
                    {roomFiles.map((f, i) => (
                      <div key={i} className={styles.photoThumbWrapper}>
                        <img src={URL.createObjectURL(f)} alt={`Room ${i}`} className={styles.photoThumb} />
                        <button type="button" className={styles.photoRemoveBtn} onClick={() => setRoomFiles(prev => prev.filter((_, idx) => idx !== i))}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Field: Correct Business Address */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Business Address {needsAddress && <span className={styles.requiredStar}>*</span>}
              </label>
              <input
                type="text"
                className={styles.flaggedInput}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter correct full business address"
                required={needsAddress}
              />
              <p className={styles.helperText}>
                Must accurately match your physical location and legal registry records.
              </p>
            </div>

            {/* Accordion: Need to update other documents? */}
            <div style={{ marginTop: "10px" }}>
              <button
                type="button"
                className={styles.accordionToggle}
                onClick={() => setShowOptionalDocs(!showOptionalDocs)}
              >
                <span>Update other documents (Optional)</span>
                {showOptionalDocs ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {showOptionalDocs && (
                <div className={styles.optionalDocsSection}>
                  {/* Optional FSSAI if not already shown */}
                  {!needsFssai && (
                    <div>
                      <label className={styles.label}>FSSAI License</label>
                      <button type="button" className={styles.changeBtn} onClick={() => document.getElementById("fssai-reupload-input")?.click()}>
                        {fssaiFile ? `Selected: ${fssaiFile.name}` : "Upload FSSAI License"}
                      </button>
                    </div>
                  )}

                  {/* Optional Light Bill if not already shown */}
                  {!needsLightBill && (
                    <div>
                      <label className={styles.label}>Electricity Bill</label>
                      <button type="button" className={styles.changeBtn} onClick={() => document.getElementById("lightbill-input")?.click()}>
                        {lightBillFile ? `Selected: ${lightBillFile.name}` : "Upload Electricity Bill"}
                      </button>
                    </div>
                  )}

                  {/* Optional Passbook if not already shown */}
                  {!needsPassbook && (
                    <div>
                      <label className={styles.label}>Bank Passbook</label>
                      <button type="button" className={styles.changeBtn} onClick={() => document.getElementById("passbook-input")?.click()}>
                        {passbookFile ? `Selected: ${passbookFile.name}` : "Upload Bank Passbook"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
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
      {/* 2. MOBILE VIEW                                                            */}
      {/* ========================================================================= */}
      <form className={styles.mobileOnly} onSubmit={handleSubmit}>
        {/* Amber Notification Card */}
        <div className={styles.mobileAlertBanner}>
          <div className={styles.mobileAlertIconCircle}>
            <AlertCircle size={18} className={styles.mobileAlertIcon} />
          </div>
          <p className={styles.mobileAlertText}>
            {adminNote || "Please re-upload your flagged documents to continue onboarding."}
          </p>
        </div>

        {/* Mobile Field: FSSAI License */}
        <div className={styles.mobileFieldGroup}>
          <label className={styles.mobileLabel}>
            FSSAI License <span className={styles.mobileRequiredStar}>*</span>
          </label>
          <div
            className={styles.mobileDropzoneBox}
            onClick={() => document.getElementById("fssai-reupload-input")?.click()}
            role="button"
            tabIndex={0}
          >
            <Upload size={28} strokeWidth={1.7} className={styles.mobileUploadIcon} />
            <span className={styles.mobileUploadTitle}>
              {fssaiFile ? fssaiFile.name : "Click to re-upload license"}
            </span>
            <span className={styles.mobileUploadSubtitle}>
              {fssaiFile ? "File selected • Click to change" : "PDF, PNG or JPG (Max 5MB)"}
            </span>
          </div>
        </div>

        {/* Mobile Field: Aadhaar Front / Back */}
        <div className={styles.mobileFieldGroup}>
          <label className={styles.mobileLabel}>
            Identity Proof (Aadhaar Front & Back)
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div
              className={styles.mobileDropzoneBox}
              style={{ padding: "14px 10px" }}
              onClick={() => document.getElementById("adhaar-front-input")?.click()}
            >
              <Upload size={20} className={styles.mobileUploadIcon} />
              <span style={{ fontSize: "12px", fontWeight: "600" }}>{adhaarFrontFile ? "Front Added" : "Upload Front"}</span>
            </div>
            <div
              className={styles.mobileDropzoneBox}
              style={{ padding: "14px 10px" }}
              onClick={() => document.getElementById("adhaar-back-input")?.click()}
            >
              <Upload size={20} className={styles.mobileUploadIcon} />
              <span style={{ fontSize: "12px", fontWeight: "600" }}>{adhaarBackFile ? "Back Added" : "Upload Back"}</span>
            </div>
          </div>
        </div>

        {/* Mobile Field: Business Address */}
        <div className={styles.mobileFieldGroup}>
          <label className={styles.mobileLabel}>
            Business Address
          </label>
          <textarea
            className={styles.mobileTextarea}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            placeholder="Enter full address"
          />
        </div>

        {/* Fixed Mobile Bottom Action Bar */}
        <div className={styles.mobileBottomActionBar}>
          <button type="submit" className={styles.mobileSubmitBtn} disabled={submitting}>
            {submitting ? "Resubmitting..." : "Resubmit"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RevisionActionRequired;

