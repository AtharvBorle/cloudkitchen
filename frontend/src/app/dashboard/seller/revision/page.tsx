"use client";
import { fetchApi, uploadWithProgress } from "@/lib/fetch-api";


import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UploadCloud, AlertTriangle } from "lucide-react";
import CameraCaptureModal from '@/app/components/CameraCaptureModal';

export default function RevisionPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [note, setNote] = useState("");
    const [type, setType] = useState("FOOD");

    const [idProofType, setIdProofType] = useState<"AADHAAR" | "PAN">("AADHAAR");
    const [panFile, setPanFile] = useState<File | null>(null);
    const [lightBillFile, setLightBillFile] = useState<File | null>(null);
    const [passbookFile, setPassbookFile] = useState<File | null>(null);

    const [adhaarFrontFile, setAdhaarFrontFile] = useState<File | null>(null);
    const [adhaarBackFile, setAdhaarBackFile] = useState<File | null>(null);
    const [fssaiFile, setFssaiFile] = useState<File | null>(null);
    const [kitchenImageFiles, setKitchenImageFiles] = useState<File[]>([]);
    const [cuisineImageFiles, setCuisineImageFiles] = useState<File[]>([]);
    const [roomImageFiles, setRoomImageFiles] = useState<File[]>([]);
    const [cameraMode, setCameraMode] = useState<'adhaarFront' | 'adhaarBack' | 'pan' | 'fssai' | 'kitchen' | 'cuisine' | 'lightBill' | 'passbook' | 'room' | null>(null);

    const handleCameraCapture = (file: File) => {
        if (cameraMode === 'adhaarFront') setAdhaarFrontFile(file);
        else if (cameraMode === 'adhaarBack') setAdhaarBackFile(file);
        else if (cameraMode === 'pan') setPanFile(file);
        else if (cameraMode === 'fssai') setFssaiFile(file);
        else if (cameraMode === 'lightBill') setLightBillFile(file);
        else if (cameraMode === 'passbook') setPassbookFile(file);
        else if (cameraMode === 'kitchen') setKitchenImageFiles(prev => [...prev, file].slice(0, 3));
        else if (cameraMode === 'cuisine') setCuisineImageFiles(prev => [...prev, file].slice(0, 3));
        else if (cameraMode === 'room') setRoomImageFiles(prev => [...prev, file].slice(0, 3));
        setCameraMode(null);
    };

    // Determine which fields are requested based on the admin note
    const [needsAadhaar, setNeedsAadhaar] = useState(false);
    const [needsFssai, setNeedsFssai] = useState(false);
    const [needsKitchen, setNeedsKitchen] = useState(false);
    const [needsCuisine, setNeedsCuisine] = useState(false);
    const [needsRooms, setNeedsRooms] = useState(false);
    const [needsLightBill, setNeedsLightBill] = useState(false);
    const [needsPassbook, setNeedsPassbook] = useState(false);

    useEffect(() => {
        // Fetch the seller profile note
        const fetchProfile = async () => {
            try {
                const res = await fetchApi("/api/seller/profile");
                if (res.ok) {
                    const data = await res.json();
                    if (data.profile.verificationStatus !== "REVISION") {
                        router.push("/dashboard/seller"); // Redirect if not in revision status
                        return;
                    }
                    const fetchedNote = data.profile.verificationNote || "The admin has requested changes to your documents.";
                    setNote(fetchedNote);
                    setType(data.profile.type || "ROOM");

                    // Parse the note to see what was requested
                    const lowerNote = fetchedNote.toLowerCase();
                    if (lowerNote.includes("aadhaar card")) setNeedsAadhaar(true);
                    if (lowerNote.includes("fssai certificate")) setNeedsFssai(true);
                    if (lowerNote.includes("kitchen images")) setNeedsKitchen(true);
                    if (lowerNote.includes("cuisine / food images")) setNeedsCuisine(true);
                    if (lowerNote.includes("room photos")) setNeedsRooms(true);
                    if (lowerNote.includes("electricity bill") || lowerNote.includes("light bill")) setNeedsLightBill(true);
                    if (lowerNote.includes("bank passbook") || lowerNote.includes("passbook")) setNeedsPassbook(true);
                }
            } catch (error) {
                console.error("Failed to fetch profile", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [router]);

    const handleMultiFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File[]>>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files).slice(0, 3);
            setter(files);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
        if (e.target.files && e.target.files.length > 0) {
            setter(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Manual validations
        if (needsAadhaar) {
            if (idProofType === "AADHAAR") {
                if (!adhaarFrontFile || !adhaarBackFile) {
                    alert("Please upload both front and back photos of your Aadhaar Card.");
                    return;
                }
            } else {
                if (!panFile) {
                    alert("Please upload your PAN Card file.");
                    return;
                }
            }
        }
        if (needsLightBill && !lightBillFile) {
            alert("Please upload your Electricity Bill (Light Bill).");
            return;
        }
        if (needsPassbook && !passbookFile) {
            alert("Please upload your Bank Passbook photo/file.");
            return;
        }
        if (needsFssai && !fssaiFile) {
            alert("Please upload your updated FSSAI Certificate.");
            return;
        }
        if (type.toLowerCase().includes("food")) {
            if (needsKitchen && kitchenImageFiles.length !== 3) {
                alert("Please upload exactly 3 Kitchen Images.");
                return;
            }
            if (needsCuisine && cuisineImageFiles.length !== 3) {
                alert("Please upload exactly 3 Cuisine / Food Images.");
                return;
            }
        }
        if (needsRooms && roomImageFiles.length !== 3) {
            alert("Please upload exactly 3 Room Photos.");
            return;
        }

        setSubmitting(true);

        try {
            const formData = new FormData();
            if (needsAadhaar) {
                if (idProofType === "AADHAAR") {
                    if (adhaarFrontFile) formData.append("adhaarFrontFile", adhaarFrontFile);
                    if (adhaarBackFile) formData.append("adhaarBackFile", adhaarBackFile);
                } else {
                    if (panFile) formData.append("adhaarFile", panFile);
                }
            }
            if (fssaiFile) formData.append("fssaiFile", fssaiFile);
            if (lightBillFile) formData.append("lightBillFile", lightBillFile);
            if (passbookFile) formData.append("passbookFile", passbookFile);

            kitchenImageFiles.forEach((file, index) => {
                formData.append(`kitchenImage_${index}`, file);
            });
            cuisineImageFiles.forEach((file, index) => {
                formData.append(`cuisineImage_${index}`, file);
            });
            roomImageFiles.forEach((file, index) => {
                formData.append(`roomImage_${index}`, file);
            });

            setUploadProgress(0);
            const res = await uploadWithProgress("/api/seller/revision", formData, (pct) => {
                setUploadProgress(pct);
            });

            if (res.ok) {
                alert("Documents uploaded successfully! Your profile is back in review.");
                window.location.href = "/dashboard/seller"; // Reload to hit the pending gate
            } else {
                const data = await res.json();
                alert(data.message || "Failed to submit revision.");
            }
        } catch (error) {
            console.error("Revision submit error", error);
            alert("An error occurred during submission.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
                <Loader2 size={40} className="animate-spin" color="var(--primary)" />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: "700px", margin: "0 auto", padding: "2rem 0", animation: "fadeIn 0.5s ease-out" }}>
            <div style={{ marginBottom: "2rem" }}>
                <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#0f172a", display: "flex", alignItems: "center", gap: "10px" }}>
                    <UploadCloud size={32} color="#d97706" />
                    Document Revision
                </h1>
                <p style={{ color: "#64748b", marginTop: "0.5rem" }}>
                    Please review the admin's notes and re-upload the requested files below. Leave fields empty if you do not need to change that specific document.
                </p>
            </div>

            {/* Admin Note Box */}
            <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fcd34d", padding: "1.5rem", borderRadius: "12px", marginBottom: "2rem", display: "flex", gap: "15px", alignItems: "flex-start" }}>
                <AlertTriangle size={24} color="#d97706" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#92400e", marginBottom: "0.5rem" }}>Admin Feedback</h3>
                    <div style={{ fontSize: "0.95rem", color: "#b45309", whiteSpace: "pre-wrap", lineHeight: "1.5" }}>
                        {note}
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ backgroundColor: "white", padding: "2.5rem", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

                {/* Alert message about watermarks / geotagging */}
                <div style={{
                    backgroundColor: "#FFF5F5",
                    border: "1px solid #FEB2B2",
                    color: "#C53030",
                    padding: "15px",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    lineHeight: "1.4"
                }}>
                    <strong>⚠️ Document Requirements:</strong> Please ensure that uploaded legal/official documents (Aadhaar Card, PAN Card, Bank Passbook, and FSSAI Certificate) <strong>do not contain any watermarks, digital overlays, geotagging stamps, or timestamps</strong>. Photos of these documents taken using the camera will automatically disable location/time watermarks to keep the document fully readable.
                </div>

                {needsAadhaar && (
                    <>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "15px" }}>
                            <label style={{ fontWeight: "600", color: "#334155", textAlign: "center" }}>Select ID Proof Type for Update</label>
                            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                                <button
                                    type="button"
                                    onClick={() => setIdProofType("AADHAAR")}
                                    style={{
                                        flex: 1,
                                        padding: "10px",
                                        borderRadius: "8px",
                                        border: idProofType === "AADHAAR" ? "2px solid #d97706" : "1px solid #cbd5e1",
                                        backgroundColor: idProofType === "AADHAAR" ? "rgba(217, 119, 6, 0.05)" : "white",
                                        color: idProofType === "AADHAAR" ? "#d97706" : "#475569",
                                        fontWeight: "bold",
                                        cursor: "pointer"
                                    }}
                                >
                                    Aadhaar Card
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIdProofType("PAN")}
                                    style={{
                                        flex: 1,
                                        padding: "10px",
                                        borderRadius: "8px",
                                        border: idProofType === "PAN" ? "2px solid #d97706" : "1px solid #cbd5e1",
                                        backgroundColor: idProofType === "PAN" ? "rgba(217, 119, 6, 0.05)" : "white",
                                        color: idProofType === "PAN" ? "#d97706" : "#475569",
                                        fontWeight: "bold",
                                        cursor: "pointer"
                                    }}
                                >
                                    PAN Card
                                </button>
                            </div>
                        </div>

                        {idProofType === "AADHAAR" ? (
                            <>
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    <label style={{ fontWeight: "600", color: "#334155" }}>Aadhaar Card Front Side Update</label>
                                    {!adhaarFrontFile ? (
                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                            <label className="btn" style={{ padding: "10px", backgroundColor: "#f8fafc", color: "#334155", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "bold", textAlign: "center", border: "1px dashed #cbd5e1", flex: 1 }}>
                                                Upload Front
                                                <input type="file" onChange={(e) => handleFileChange(e, setAdhaarFrontFile)} style={{ display: 'none' }} accept=".pdf,image/*" />
                                            </label>
                                            <button type="button" onClick={() => setCameraMode('adhaarFront')} className="btn" style={{ padding: "10px", backgroundColor: "#f8fafc", color: "#334155", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "bold", textAlign: "center", border: "1px dashed #cbd5e1", flex: 1 }}>
                                                Take Photo
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "8px", backgroundColor: "#f8fafc" }}>
                                            {adhaarFrontFile.type.startsWith("image/") ? (
                                                <img src={URL.createObjectURL(adhaarFrontFile)} alt="Aadhaar Front" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e2e8f0" }} />
                                            ) : (
                                                <div style={{ padding: "10px", backgroundColor: "#e2e8f0", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "bold", color: "#475569" }}>PDF</div>
                                            )}
                                            <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.9rem", color: "#334155" }}>
                                                {adhaarFrontFile.name}
                                            </div>
                                            <div style={{ display: "flex", gap: "10px" }}>
                                                <label style={{ padding: "6px 12px", backgroundColor: "#e2e8f0", color: "#334155", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}>
                                                    Change
                                                    <input type="file" onChange={(e) => handleFileChange(e, setAdhaarFrontFile)} style={{ display: 'none' }} accept=".pdf,image/*" />
                                                </label>
                                                <button type="button" onClick={() => setAdhaarFrontFile(null)} style={{ padding: "6px 12px", backgroundColor: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}>Remove</button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
                                    <label style={{ fontWeight: "600", color: "#334155" }}>Aadhaar Card Back Side Update</label>
                                    {!adhaarBackFile ? (
                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                            <label className="btn" style={{ padding: "10px", backgroundColor: "#f8fafc", color: "#334155", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "bold", textAlign: "center", border: "1px dashed #cbd5e1", flex: 1 }}>
                                                Upload Back
                                                <input type="file" onChange={(e) => handleFileChange(e, setAdhaarBackFile)} style={{ display: 'none' }} accept=".pdf,image/*" />
                                            </label>
                                            <button type="button" onClick={() => setCameraMode('adhaarBack')} className="btn" style={{ padding: "10px", backgroundColor: "#f8fafc", color: "#334155", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "bold", textAlign: "center", border: "1px dashed #cbd5e1", flex: 1 }}>
                                                Take Photo
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "8px", backgroundColor: "#f8fafc" }}>
                                            {adhaarBackFile.type.startsWith("image/") ? (
                                                <img src={URL.createObjectURL(adhaarBackFile)} alt="Aadhaar Back" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e2e8f0" }} />
                                            ) : (
                                                <div style={{ padding: "10px", backgroundColor: "#e2e8f0", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "bold", color: "#475569" }}>PDF</div>
                                            )}
                                            <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.9rem", color: "#334155" }}>
                                                {adhaarBackFile.name}
                                            </div>
                                            <div style={{ display: "flex", gap: "10px" }}>
                                                <label style={{ padding: "6px 12px", backgroundColor: "#e2e8f0", color: "#334155", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}>
                                                    Change
                                                    <input type="file" onChange={(e) => handleFileChange(e, setAdhaarBackFile)} style={{ display: 'none' }} accept=".pdf,image/*" />
                                                </label>
                                                <button type="button" onClick={() => setAdhaarBackFile(null)} style={{ padding: "6px 12px", backgroundColor: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}>Remove</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                <label style={{ fontWeight: "600", color: "#334155" }}>PAN Card Update</label>
                                {!panFile ? (
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                        <label className="btn" style={{ padding: "10px", backgroundColor: "#f8fafc", color: "#334155", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "bold", textAlign: "center", border: "1px dashed #cbd5e1", flex: 1 }}>
                                            Upload PAN File
                                            <input type="file" onChange={(e) => handleFileChange(e, setPanFile)} style={{ display: 'none' }} accept=".pdf,image/*" />
                                        </label>
                                        <button type="button" onClick={() => setCameraMode('pan')} className="btn" style={{ padding: "10px", backgroundColor: "#f8fafc", color: "#334155", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "bold", textAlign: "center", border: "1px dashed #cbd5e1", flex: 1 }}>
                                            Take Photo
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "8px", backgroundColor: "#f8fafc" }}>
                                        {panFile.type.startsWith("image/") ? (
                                            <img src={URL.createObjectURL(panFile)} alt="PAN Card" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e2e8f0" }} />
                                        ) : (
                                            <div style={{ padding: "10px", backgroundColor: "#e2e8f0", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "bold", color: "#475569" }}>PDF</div>
                                        )}
                                        <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.9rem", color: "#334155" }}>
                                            {panFile.name}
                                        </div>
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            <label style={{ padding: "6px 12px", backgroundColor: "#e2e8f0", color: "#334155", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}>
                                                Change
                                                <input type="file" onChange={(e) => handleFileChange(e, setPanFile)} style={{ display: 'none' }} accept=".pdf,image/*" />
                                            </label>
                                            <button type="button" onClick={() => setPanFile(null)} style={{ padding: "6px 12px", backgroundColor: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}>Remove</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {needsFssai && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontWeight: "600", color: "#334155" }}>FSSAI Certificate Update</label>
                        {!fssaiFile ? (
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <label className="btn" style={{ padding: "10px", backgroundColor: "#f8fafc", color: "#334155", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "bold", textAlign: "center", border: "1px dashed #cbd5e1", flex: 1 }}>
                                    Upload File
                                    <input type="file" onChange={(e) => handleFileChange(e, setFssaiFile)} style={{ display: 'none' }} accept=".pdf,image/*" />
                                </label>
                                <button type="button" onClick={() => setCameraMode('fssai')} className="btn" style={{ padding: "10px", backgroundColor: "#f8fafc", color: "#334155", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "bold", textAlign: "center", border: "1px dashed #cbd5e1", flex: 1 }}>
                                    Take Photo
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "8px", backgroundColor: "#f8fafc" }}>
                                {fssaiFile.type.startsWith("image/") ? (
                                    <img src={URL.createObjectURL(fssaiFile)} alt="FSSAI" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e2e8f0" }} />
                                ) : (
                                    <div style={{ padding: "10px", backgroundColor: "#e2e8f0", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "bold", color: "#475569" }}>PDF</div>
                                )}
                                <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.9rem", color: "#334155" }}>
                                    {fssaiFile.name}
                                </div>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <label style={{ padding: "6px 12px", backgroundColor: "#e2e8f0", color: "#334155", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}>
                                        Change
                                        <input type="file" onChange={(e) => handleFileChange(e, setFssaiFile)} style={{ display: 'none' }} accept=".pdf,image/*" />
                                    </label>
                                    <button type="button" onClick={() => setFssaiFile(null)} style={{ padding: "6px 12px", backgroundColor: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}>Remove</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {needsLightBill && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontWeight: "600", color: "#334155" }}>Electricity Bill (Light Bill) Update</label>
                        {!lightBillFile ? (
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <label className="btn" style={{ padding: "10px", backgroundColor: "#f8fafc", color: "#334155", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "bold", textAlign: "center", border: "1px dashed #cbd5e1", flex: 1 }}>
                                    Upload File
                                    <input type="file" onChange={(e) => handleFileChange(e, setLightBillFile)} style={{ display: 'none' }} accept=".pdf,image/*" />
                                </label>
                                <button type="button" onClick={() => setCameraMode('lightBill')} className="btn" style={{ padding: "10px", backgroundColor: "#f8fafc", color: "#334155", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "bold", textAlign: "center", border: "1px dashed #cbd5e1", flex: 1 }}>
                                    Take Photo
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "8px", backgroundColor: "#f8fafc" }}>
                                {lightBillFile.type.startsWith("image/") ? (
                                    <img src={URL.createObjectURL(lightBillFile)} alt="Light Bill" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e2e8f0" }} />
                                ) : (
                                    <div style={{ padding: "10px", backgroundColor: "#e2e8f0", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "bold", color: "#475569" }}>PDF</div>
                                )}
                                <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.9rem", color: "#334155" }}>
                                    {lightBillFile.name}
                                </div>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <label style={{ padding: "6px 12px", backgroundColor: "#e2e8f0", color: "#334155", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}>
                                        Change
                                        <input type="file" onChange={(e) => handleFileChange(e, setLightBillFile)} style={{ display: 'none' }} accept=".pdf,image/*" />
                                    </label>
                                    <button type="button" onClick={() => setLightBillFile(null)} style={{ padding: "6px 12px", backgroundColor: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}>Remove</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {needsPassbook && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontWeight: "600", color: "#334155" }}>Bank Passbook Update</label>
                        {!passbookFile ? (
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <label className="btn" style={{ padding: "10px", backgroundColor: "#f8fafc", color: "#334155", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "bold", textAlign: "center", border: "1px dashed #cbd5e1", flex: 1 }}>
                                    Upload File
                                    <input type="file" onChange={(e) => handleFileChange(e, setPassbookFile)} style={{ display: 'none' }} accept=".pdf,image/*" />
                                </label>
                                <button type="button" onClick={() => setCameraMode('passbook')} className="btn" style={{ padding: "10px", backgroundColor: "#f8fafc", color: "#334155", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "bold", textAlign: "center", border: "1px dashed #cbd5e1", flex: 1 }}>
                                    Take Photo
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "8px", backgroundColor: "#f8fafc" }}>
                                {passbookFile.type.startsWith("image/") ? (
                                    <img src={URL.createObjectURL(passbookFile)} alt="Bank Passbook" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e2e8f0" }} />
                                ) : (
                                    <div style={{ padding: "10px", backgroundColor: "#e2e8f0", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "bold", color: "#475569" }}>PDF</div>
                                )}
                                <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.9rem", color: "#334155" }}>
                                    {passbookFile.name}
                                </div>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <label style={{ padding: "6px 12px", backgroundColor: "#e2e8f0", color: "#334155", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}>
                                        Change
                                        <input type="file" onChange={(e) => handleFileChange(e, setPassbookFile)} style={{ display: 'none' }} accept=".pdf,image/*" />
                                    </label>
                                    <button type="button" onClick={() => setPassbookFile(null)} style={{ padding: "6px 12px", backgroundColor: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}>Remove</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {type.toLowerCase().includes("food") && (
                    <>
                        {needsKitchen && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
                                <label style={{ fontWeight: "600", color: "#334155", display: "flex", justifyContent: "space-between" }}>
                                    <span>Kitchen Images Update</span>
                                    <span style={{ fontSize: "0.8rem", fontWeight: "normal", color: "#64748b" }}>{kitchenImageFiles.length} / 3 selected</span>
                                </label>
                                {kitchenImageFiles.length === 0 ? (
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                        <label className="btn" style={{ display: "none" }}>
                                            Upload Images
                                            <input type="file" onChange={(e) => handleMultiFileChange(e, setKitchenImageFiles)} style={{ display: 'none' }} accept="image/*" multiple />
                                        </label>
                                        <button type="button" onClick={() => setCameraMode('kitchen')} className="btn" style={{ padding: "10px", backgroundColor: "#f8fafc", color: "#334155", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "bold", textAlign: "center", border: "1px dashed #cbd5e1", flex: 1 }}>
                                            Take Photos
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ padding: "15px", border: "1px solid #cbd5e1", borderRadius: "8px", backgroundColor: "#f8fafc" }}>
                                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
                                            {kitchenImageFiles.map((file, idx) => (
                                                <div key={idx} style={{ position: "relative" }}>
                                                    <img src={URL.createObjectURL(file)} alt={`Kitchen ${idx}`} style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e2e8f0" }} />
                                                    <button type="button" onClick={() => setKitchenImageFiles(prev => prev.filter((_, i) => i !== idx))} title="Remove image" style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '14px', lineHeight: '1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyItems: 'center', padding: "0 0 2px 0", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>&times;</button>
                                                </div>
                                            ))}
                                        </div>
                                        {kitchenImageFiles.length !== 3 && <span style={{ fontSize: "0.8rem", color: "#ef4444", display: "block", marginBottom: "10px" }}>You MUST select exactly 3 images.</span>}
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            {kitchenImageFiles.length < 3 && (
                                                <>
                                                    <label style={{ display: "none" }}>
                                                        Upload Image
                                                        <input type="file" accept="image/*" multiple onChange={(e) => {
                                                            if (e.target.files) {
                                                                const newFiles = Array.from(e.target.files);
                                                                setKitchenImageFiles(prev => [...prev, ...newFiles].slice(0, 3));
                                                            }
                                                        }} style={{ display: 'none' }} />
                                                    </label>
                                                    <button type="button" onClick={() => setCameraMode('kitchen')} style={{ padding: "8px 16px", backgroundColor: "#e2e8f0", color: "#334155", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold", border: "none" }}>
                                                        Take Photo
                                                    </button>
                                                </>
                                            )}
                                            <button type="button" onClick={() => setKitchenImageFiles([])} style={{ padding: "8px 16px", backgroundColor: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}>Clear All</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {needsCuisine && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
                                <label style={{ fontWeight: "600", color: "#334155", display: "flex", justifyContent: "space-between" }}>
                                    <span>Cuisine / Food Images Update</span>
                                    <span style={{ fontSize: "0.8rem", fontWeight: "normal", color: "#64748b" }}>{cuisineImageFiles.length} / 3 selected</span>
                                </label>
                                {cuisineImageFiles.length === 0 ? (
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                        <label className="btn" style={{ display: "none" }}>
                                            Upload Images
                                            <input type="file" onChange={(e) => handleMultiFileChange(e, setCuisineImageFiles)} style={{ display: 'none' }} accept="image/*" multiple />
                                        </label>
                                        <button type="button" onClick={() => setCameraMode('cuisine')} className="btn" style={{ padding: "10px", backgroundColor: "#f8fafc", color: "#334155", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "bold", textAlign: "center", border: "1px dashed #cbd5e1", flex: 1 }}>
                                            Take Photos
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ padding: "15px", border: "1px solid #cbd5e1", borderRadius: "8px", backgroundColor: "#f8fafc" }}>
                                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
                                            {cuisineImageFiles.map((file, idx) => (
                                                <div key={idx} style={{ position: "relative" }}>
                                                    <img src={URL.createObjectURL(file)} alt={`Cuisine ${idx}`} style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e2e8f0" }} />
                                                    <button type="button" onClick={() => setCuisineImageFiles(prev => prev.filter((_, i) => i !== idx))} title="Remove image" style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '14px', lineHeight: '1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyItems: 'center', padding: "0 0 2px 0", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>&times;</button>
                                                </div>
                                            ))}
                                        </div>
                                        {cuisineImageFiles.length !== 3 && <span style={{ fontSize: "0.8rem", color: "#ef4444", display: "block", marginBottom: "10px" }}>You MUST select exactly 3 images.</span>}
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            {cuisineImageFiles.length < 3 && (
                                                <>
                                                    <label style={{ display: "none" }}>
                                                        Upload Image
                                                        <input type="file" accept="image/*" multiple onChange={(e) => {
                                                            if (e.target.files) {
                                                                const newFiles = Array.from(e.target.files);
                                                                setCuisineImageFiles(prev => [...prev, ...newFiles].slice(0, 3));
                                                            }
                                                        }} style={{ display: 'none' }} />
                                                    </label>
                                                    <button type="button" onClick={() => setCameraMode('cuisine')} style={{ padding: "8px 16px", backgroundColor: "#e2e8f0", color: "#334155", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold", border: "none" }}>
                                                        Take Photo
                                                    </button>
                                                </>
                                            )}
                                            <button type="button" onClick={() => setCuisineImageFiles([])} style={{ padding: "8px 16px", backgroundColor: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}>Clear All</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {needsRooms && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
                        <label style={{ fontWeight: "600", color: "#334155", display: "flex", justifyContent: "space-between" }}>
                            <span>Room Photos Update</span>
                            <span style={{ fontSize: "0.8rem", fontWeight: "normal", color: "#64748b" }}>{roomImageFiles.length} / 3 selected</span>
                        </label>
                        {roomImageFiles.length === 0 ? (
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <button type="button" onClick={() => setCameraMode('room')} className="btn" style={{ padding: "10px", backgroundColor: "#f8fafc", color: "#334155", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "bold", textAlign: "center", border: "1px dashed #cbd5e1", flex: 1 }}>
                                    Take Photos
                                </button>
                            </div>
                        ) : (
                            <div style={{ padding: "15px", border: "1px solid #cbd5e1", borderRadius: "8px", backgroundColor: "#f8fafc" }}>
                                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
                                    {roomImageFiles.map((file, idx) => (
                                        <div key={idx} style={{ position: "relative" }}>
                                            <img src={URL.createObjectURL(file)} alt={`Room ${idx}`} style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e2e8f0" }} />
                                            <button type="button" onClick={() => setRoomImageFiles(prev => prev.filter((_, i) => i !== idx))} title="Remove image" style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '14px', lineHeight: '1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyItems: 'center', padding: "0 0 2px 0", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>&times;</button>
                                        </div>
                                    ))}
                                </div>
                                {roomImageFiles.length !== 3 && <span style={{ fontSize: "0.8rem", color: "#ef4444", display: "block", marginBottom: "10px" }}>You MUST select exactly 3 images.</span>}
                                <div style={{ display: "flex", gap: "10px" }}>
                                    {roomImageFiles.length < 3 && (
                                        <button type="button" onClick={() => setCameraMode('room')} style={{ padding: "8px 16px", backgroundColor: "#e2e8f0", color: "#334155", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold", border: "none" }}>
                                            Take Photo
                                        </button>
                                    )}
                                    <button type="button" onClick={() => setRoomImageFiles([])} style={{ padding: "8px 16px", backgroundColor: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}>Clear All</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <hr style={{ border: "none", borderTop: "1px solid #f1f5f9", margin: "1rem 0" }} />

                <button
                    type="submit"
                    disabled={submitting}
                    style={{
                        padding: "14px",
                        backgroundColor: "#d97706",
                        color: "white",
                        fontWeight: "bold",
                        fontSize: "1rem",
                        borderRadius: "8px",
                        border: "none",
                        cursor: submitting ? "not-allowed" : "pointer",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "10px",
                        transition: "all 0.2s",
                        opacity: submitting ? 0.7 : 1,
                        boxShadow: "0 4px 10px rgba(217, 119, 6, 0.2)"
                    }}
                >
                    {submitting ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
                    Submit Documents for Review
                </button>
            </form>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
            {submitting && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(15, 23, 42, 0.7)",
                    backdropFilter: "blur(8px)",
                    zIndex: 9999,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "white",
                    fontFamily: "var(--font-sans, sans-serif)",
                }}>
                    <div style={{
                        backgroundColor: "white",
                        padding: "2.5rem",
                        borderRadius: "24px",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        maxWidth: "400px",
                        width: "90%",
                        textAlign: "center",
                        color: "#1e293b"
                    }}>
                        <div style={{
                            position: "relative",
                            width: "80px",
                            height: "80px",
                            marginBottom: "1.5rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
                            <div style={{
                                boxSizing: "border-box",
                                display: "block",
                                position: "absolute",
                                width: "64px",
                                height: "64px",
                                margin: "8px",
                                border: "8px solid #F16F68",
                                borderRadius: "50%",
                                animation: "lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite",
                                borderColor: "#F16F68 transparent transparent transparent"
                            }}></div>
                            <div style={{
                                boxSizing: "border-box",
                                display: "block",
                                position: "absolute",
                                width: "64px",
                                height: "64px",
                                margin: "8px",
                                border: "8px solid #F16F68",
                                borderRadius: "50%",
                                animation: "lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite",
                                borderColor: "transparent #F16F68 transparent transparent",
                                animationDelay: "-0.3s"
                            }}></div>
                            <div style={{
                                boxSizing: "border-box",
                                display: "block",
                                position: "absolute",
                                width: "64px",
                                height: "64px",
                                margin: "8px",
                                border: "8px solid #F16F68",
                                borderRadius: "50%",
                                animation: "lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite",
                                borderColor: "transparent transparent #F16F68 transparent",
                                animationDelay: "-0.15s"
                            }}></div>
                        </div>

                        <h3 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#0f172a", marginBottom: "0.5rem" }}>
                            {uploadProgress === 100 ? "Processing Revision..." : "Submitting Revision Documents"}
                        </h3>
                        <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1.5rem" }}>
                            {uploadProgress === 100 
                                ? "Corrected files uploaded successfully! The server is now verifying and updating your application. Please wait..." 
                                : "Uploading corrected files. Please do not close or refresh this page."}
                        </p>

                        <div style={{ width: "100%", backgroundColor: "#e2e8f0", borderRadius: "9999px", height: "8px", overflow: "hidden", marginBottom: "0.5rem" }}>
                            <div style={{
                                height: "100%",
                                width: `${uploadProgress}%`,
                                background: "linear-gradient(90deg, #F16F68 0%, #ff8a84 100%)",
                                borderRadius: "9999px",
                                transition: "width 0.2s ease-out"
                            }}></div>
                        </div>
                        
                        <span style={{ fontSize: "0.875rem", fontWeight: "700", color: "#F16F68" }}>
                            {uploadProgress === 100 ? "100% (Verifying & processing...)" : `${uploadProgress}%`}
                        </span>
                    </div>
                </div>
            )}
            {cameraMode && (
                <CameraCaptureModal 
                    onCapture={handleCameraCapture} 
                    onClose={() => setCameraMode(null)} 
                    skipWatermark={['adhaarFront', 'adhaarBack', 'pan', 'fssai', 'lightBill', 'passbook'].includes(cameraMode)}
                />
            )}
        </div>
    );
}
