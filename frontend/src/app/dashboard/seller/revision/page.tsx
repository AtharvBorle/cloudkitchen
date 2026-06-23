"use client";
import { fetchApi } from "@/lib/fetch-api";


import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UploadCloud, AlertTriangle } from "lucide-react";
import CameraCaptureModal from '@/app/components/CameraCaptureModal';

export default function RevisionPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [note, setNote] = useState("");
    const [type, setType] = useState("FOOD");

    const [adhaarFrontFile, setAdhaarFrontFile] = useState<File | null>(null);
    const [adhaarBackFile, setAdhaarBackFile] = useState<File | null>(null);
    const [fssaiFile, setFssaiFile] = useState<File | null>(null);
    const [kitchenImageFiles, setKitchenImageFiles] = useState<File[]>([]);
    const [cuisineImageFiles, setCuisineImageFiles] = useState<File[]>([]);
    const [roomImageFiles, setRoomImageFiles] = useState<File[]>([]);
    const [cameraMode, setCameraMode] = useState<'adhaarFront' | 'adhaarBack' | 'fssai' | 'kitchen' | 'cuisine' | 'room' | null>(null);

    const handleCameraCapture = (file: File) => {
        if (cameraMode === 'adhaarFront') setAdhaarFrontFile(file);
        else if (cameraMode === 'adhaarBack') setAdhaarBackFile(file);
        else if (cameraMode === 'fssai') setFssaiFile(file);
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
        if (needsAadhaar && (!adhaarFrontFile || !adhaarBackFile)) {
            alert("Please upload both front and back photos of your Aadhaar Card.");
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
            if (adhaarFrontFile) formData.append("adhaarFrontFile", adhaarFrontFile);
            if (adhaarBackFile) formData.append("adhaarBackFile", adhaarBackFile);
            if (fssaiFile) formData.append("fssaiFile", fssaiFile);

            kitchenImageFiles.forEach((file, index) => {
                formData.append(`kitchenImage_${index}`, file);
            });
            cuisineImageFiles.forEach((file, index) => {
                formData.append(`cuisineImage_${index}`, file);
            });
            roomImageFiles.forEach((file, index) => {
                formData.append(`roomImage_${index}`, file);
            });

            const res = await fetchApi("/api/seller/revision", {
                method: "POST",
                body: formData,
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

                {needsAadhaar && (
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
            {cameraMode && <CameraCaptureModal onCapture={handleCameraCapture} onClose={() => setCameraMode(null)} />}
        </div>
    );
}
