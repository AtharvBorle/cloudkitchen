"use client";
import { fetchApi } from "@/lib/fetch-api";


import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CameraCaptureModal from '@/app/components/CameraCaptureModal';

export default function SellerRegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetchApi("/api/public/categories");
                if (res.ok) {
                    const data = await res.json();
                    setCategories(data.categories || []);
                }
            } catch (err) {
                console.error("Failed to load categories.");
            }
        };
        fetchCategories();
    }, []);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "SELLER",
        businessName: "",
        sellerType: "",
        addressFlat: "",
        addressArea: "",
        addressLandmark: "",
        city: "",
        pincode: "",
        businessCategory: "FOOD"
    });

    const [adhaarFrontFile, setAdhaarFrontFile] = useState<File | null>(null);
    const [adhaarBackFile, setAdhaarBackFile] = useState<File | null>(null);
    const [fssaiFile, setFssaiFile] = useState<File | null>(null);
    const [kitchenImageFiles, setKitchenImageFiles] = useState<File[]>([]);
    const [cuisineImageFiles, setCuisineImageFiles] = useState<File[]>([]);
    const [cameraMode, setCameraMode] = useState<'adhaarFront' | 'adhaarBack' | 'fssai' | 'kitchen' | 'cuisine' | null>(null);

    const handleCameraCapture = (file: File) => {
        if (cameraMode === 'adhaarFront') setAdhaarFrontFile(file);
        else if (cameraMode === 'adhaarBack') setAdhaarBackFile(file);
        else if (cameraMode === 'fssai') setFssaiFile(file);
        else if (cameraMode === 'kitchen') setKitchenImageFiles(prev => [...prev, file].slice(0, 3));
        else if (cameraMode === 'cuisine') setCuisineImageFiles(prev => [...prev, file].slice(0, 3));
        setCameraMode(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        let value = e.target.value;
        if (e.target.name === 'phone' || e.target.name === 'pincode') {
            value = value.replace(/\D/g, '');
        }
        setFormData({ ...formData, [e.target.name]: value });
    }

    const handleMultiFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File[]>>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files).slice(0, 3); // Max 3 images
            setter(files);
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
        if (e.target.files && e.target.files.length > 0) {
            setter(e.target.files[0]);
        }
    }

    const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step < 3) {
            nextStep();
            return;
        }

        if (!adhaarFrontFile || !adhaarBackFile) {
            setError("Both front and back photos of your Aadhaar Card are required.");
            return;
        }
        if (categories.find(c => c.name === formData.sellerType)?.type === 'FOOD') {
            if (kitchenImageFiles.length !== 3) {
                setError("Exactly 3 Kitchen images are required.");
                return;
            }
            if (cuisineImageFiles.length !== 3) {
                setError("Exactly 3 Cuisine images are required.");
                return;
            }
        }

        setLoading(true);
        setError("");

        try {
            const submitData = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                submitData.append(key, value);
            });

            if (adhaarFrontFile) submitData.append("adhaarFrontFile", adhaarFrontFile);
            if (adhaarBackFile) submitData.append("adhaarBackFile", adhaarBackFile);
            if (fssaiFile) submitData.append("fssaiFile", fssaiFile);
            kitchenImageFiles.forEach((file, index) => {
                submitData.append(`kitchenImage_${index}`, file);
            });
            cuisineImageFiles.forEach((file, index) => {
                submitData.append(`cuisineImage_${index}`, file);
            });

            const res = await fetchApi("/api/auth/register", {
                method: "POST",
                body: submitData
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Registration failed");

            setSuccess(true);
            setTimeout(() => router.push("/auth/login"), 2000);
        } catch (err: any) {
            setError(err.message);
            setStep(1); // Jump back to show errors if needed
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card" style={{ maxWidth: "550px" }}>
                <h2 className="auth-title coral">Partner with Us</h2>
                <p style={{ color: "var(--text-main)", marginBottom: "30px", fontSize: "0.95rem" }}>
                    Join thousands of home chefs and earn from your passion.
                </p>

                {/* Step Indicators */}
                <div style={{ display: "flex", gap: "10px", marginBottom: "30px" }}>
                    <div style={{ flex: 1, padding: "10px", textAlign: "center", backgroundColor: step === 1 ? "var(--secondary)" : "#EAEAEA", color: step === 1 ? "white" : "#888", borderRadius: "4px", fontSize: "0.85rem", fontWeight: "bold" }}>1. Basic Info</div>
                    <div style={{ flex: 1, padding: "10px", textAlign: "center", backgroundColor: step === 2 ? "var(--secondary)" : "#EAEAEA", color: step === 2 ? "white" : "#888", borderRadius: "4px", fontSize: "0.85rem", fontWeight: "bold" }}>2. Business Details</div>
                    <div style={{ flex: 1, padding: "10px", textAlign: "center", backgroundColor: step === 3 ? "var(--secondary)" : "#EAEAEA", color: step === 3 ? "white" : "#888", borderRadius: "4px", fontSize: "0.85rem", fontWeight: "bold" }}>3. Documents</div>
                </div>

                {error && <div className="badge badge-danger">{error}</div>}
                {success && <div className="badge badge-success">Application Submitted! Redirecting...</div>}

                <form onSubmit={handleSubmit}>

                    {step === 1 && (
                        <div className="animate-fade-in">
                            <div className="input-group">
                                <input name="name" type="text" value={formData.name} onChange={handleChange} className="input-field" placeholder="Owner Full Name" required />
                            </div>
                            <div className="input-group">
                                <input name="email" type="email" value={formData.email} onChange={handleChange} className="input-field" placeholder="Email Address" required />
                            </div>
                            <div className="input-group">
                                <input name="phone" type="text" inputMode="numeric" value={formData.phone} onChange={handleChange} className="input-field" placeholder="Mobile Number" required />
                            </div>
                            <div className="input-group">
                                <input name="password" type="password" value={formData.password} onChange={handleChange} className="input-field" placeholder="Create Password" required minLength={6} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
                                <button type="button" onClick={nextStep} className="btn btn-teal" style={{ width: '120px' }}>Next</button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-fade-in">
                            <div className="input-group">
                                <input name="businessName" type="text" value={formData.businessName} onChange={handleChange} className="input-field" placeholder="Business Name (e.g., Mom's Kitchen)" required />
                            </div>

                            <div className="input-group">
                                <select name="sellerType" value={formData.sellerType} onChange={handleChange} className="input-field" required style={{ appearance: "auto" }}>
                                    <option value="" disabled>Select Business Type</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                    {categories.length === 0 && (
                                        <option value="HOMELY_FOOD" disabled>Loading categories...</option>
                                    )}
                                </select>
                            </div>

                            <div className="input-group">
                                <select name="businessCategory" value={formData.businessCategory} onChange={handleChange} className="input-field" required style={{ appearance: "auto" }}>
                                    <option value="FOOD">Food Focus (Homely Food / Mess)</option>
                                    <option value="PROPERTY">Property Focus (Rooms / Homestays)</option>
                                    <option value="BOTH">Both Food and Property</option>
                                </select>
                            </div>

                            <div className="input-group">
                                <input name="addressFlat" type="text" value={formData.addressFlat} onChange={handleChange} className="input-field" placeholder="Flat no/Floor no/House" required />
                            </div>

                            <div className="input-group">
                                <input name="addressArea" type="text" value={formData.addressArea} onChange={handleChange} className="input-field" placeholder="Area/Locality" required />
                            </div>

                            <div className="input-group">
                                <input name="addressLandmark" type="text" value={formData.addressLandmark} onChange={handleChange} className="input-field" placeholder="Area landmark (optional)" />
                            </div>

                            <div style={{ display: "flex", gap: "10px" }}>
                                <div className="input-group" style={{ flex: 1 }}>
                                    <input name="city" type="text" value={formData.city} onChange={handleChange} className="input-field" placeholder="City" required />
                                </div>
                                <div className="input-group" style={{ flex: 1 }}>
                                    <input name="pincode" type="text" inputMode="numeric" value={formData.pincode} onChange={handleChange} className="input-field" placeholder="Pincode" required />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                                <button type="button" onClick={prevStep} className="btn" style={{ backgroundColor: '#CCC', width: '100px', color: '#333' }}>Back</button>
                                <button type="button" onClick={nextStep} className="btn btn-teal" style={{ width: '100px' }}>Next</button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-fade-in">

                             <div className="input-group">
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>Aadhaar Card Front Side</label>
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
                                            <img src={URL.createObjectURL(adhaarFrontFile)} alt="Aadhaar Front" style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e2e8f0" }} />
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

                            <div className="input-group" style={{ marginTop: '20px' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>Aadhaar Card Back Side</label>
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
                                            <img src={URL.createObjectURL(adhaarBackFile)} alt="Aadhaar Back" style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e2e8f0" }} />
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

                            <div className="input-group" style={{ marginTop: '20px' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>FSSAI License (Optional)</label>
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
                                            <img src={URL.createObjectURL(fssaiFile)} alt="FSSAI" style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e2e8f0" }} />
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

                            {/* Conditionally show Kitchen and Cuisine images only if the selected category is FOOD related */}
                            {categories.find(c => c.name === formData.sellerType)?.type === 'FOOD' && (
                                <>
                                    <div className="input-group" style={{ marginTop: '20px' }}>
                                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>Kitchen Images (Exactly 3 Required)</label>
                                        {kitchenImageFiles.length === 0 ? (
                                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                                <label className="btn" style={{ padding: "10px", backgroundColor: "#f8fafc", color: "#334155", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "bold", textAlign: "center", border: "1px dashed #cbd5e1", flex: 1 }}>
                                                    Upload Images
                                                    <input type="file" onChange={(e) => handleMultiFileChange(e, setKitchenImageFiles)} style={{ display: 'none' }} accept="image/*" multiple />
                                                </label>
                                                <button type="button" onClick={() => setCameraMode('kitchen')} className="btn" style={{ padding: "10px", backgroundColor: "#f8fafc", color: "#334155", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "bold", textAlign: "center", border: "1px dashed #cbd5e1", flex: 1 }}>
                                                    Take Photos
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ padding: "15px", border: "1px solid #cbd5e1", borderRadius: "8px", backgroundColor: "#f8fafc" }}>
                                                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center", marginBottom: "12px" }}>
                                                    {kitchenImageFiles.map((file, idx) => (
                                                        <div key={idx} style={{ position: "relative" }}>
                                                            <img src={URL.createObjectURL(file)} alt={`Kitchen ${idx}`} style={{ width: "70px", height: "70px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e2e8f0" }} />
                                                            <button type="button" onClick={() => setKitchenImageFiles(prev => prev.filter((_, i) => i !== idx))} title="Remove image" style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '14px', lineHeight: '1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyItems: 'center', padding: "0 0 2px 0", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>&times;</button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <span style={{ fontSize: "0.8rem", color: kitchenImageFiles.length !== 3 ? "#ef4444" : "#64748b" }}>
                                                        {kitchenImageFiles.length} / 3 selected
                                                    </span>
                                                    <div style={{ display: "flex", gap: "10px" }}>
                                                        {kitchenImageFiles.length < 3 && (
                                                            <>
                                                                <label style={{ padding: "6px 12px", backgroundColor: "#e2e8f0", color: "#334155", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}>
                                                                    Upload Image
                                                                    <input type="file" accept="image/*" multiple onChange={(e) => {
                                                                        if (e.target.files) {
                                                                            const newFiles = Array.from(e.target.files);
                                                                            setKitchenImageFiles(prev => [...prev, ...newFiles].slice(0, 3));
                                                                        }
                                                                    }} style={{ display: 'none' }} />
                                                                </label>
                                                                <button type="button" onClick={() => setCameraMode('kitchen')} style={{ padding: "6px 12px", backgroundColor: "#e2e8f0", color: "#334155", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold", border: "none" }}>
                                                                    Take Photo
                                                                </button>
                                                            </>
                                                        )}
                                                        <button type="button" onClick={() => setKitchenImageFiles([])} style={{ padding: "6px 12px", backgroundColor: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}>Clear All</button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="input-group" style={{ marginTop: '20px' }}>
                                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>Cuisine / Food Images (Exactly 3 Required)</label>
                                        {cuisineImageFiles.length === 0 ? (
                                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                                <label className="btn" style={{ padding: "10px", backgroundColor: "#f8fafc", color: "#334155", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "bold", textAlign: "center", border: "1px dashed #cbd5e1", flex: 1 }}>
                                                    Upload Images
                                                    <input type="file" onChange={(e) => handleMultiFileChange(e, setCuisineImageFiles)} style={{ display: 'none' }} accept="image/*" multiple />
                                                </label>
                                                <button type="button" onClick={() => setCameraMode('cuisine')} className="btn" style={{ padding: "10px", backgroundColor: "#f8fafc", color: "#334155", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "bold", textAlign: "center", border: "1px dashed #cbd5e1", flex: 1 }}>
                                                    Take Photos
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ padding: "15px", border: "1px solid #cbd5e1", borderRadius: "8px", backgroundColor: "#f8fafc" }}>
                                                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center", marginBottom: "12px" }}>
                                                    {cuisineImageFiles.map((file, idx) => (
                                                        <div key={idx} style={{ position: "relative" }}>
                                                            <img src={URL.createObjectURL(file)} alt={`Cuisine ${idx}`} style={{ width: "70px", height: "70px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e2e8f0" }} />
                                                            <button type="button" onClick={() => setCuisineImageFiles(prev => prev.filter((_, i) => i !== idx))} title="Remove image" style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '14px', lineHeight: '1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyItems: 'center', padding: "0 0 2px 0", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>&times;</button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <span style={{ fontSize: "0.8rem", color: cuisineImageFiles.length !== 3 ? "#ef4444" : "#64748b" }}>
                                                        {cuisineImageFiles.length} / 3 selected
                                                    </span>
                                                    <div style={{ display: "flex", gap: "10px" }}>
                                                        {cuisineImageFiles.length < 3 && (
                                                            <>
                                                                <label style={{ padding: "6px 12px", backgroundColor: "#e2e8f0", color: "#334155", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}>
                                                                    Upload Image
                                                                    <input type="file" accept="image/*" multiple onChange={(e) => {
                                                                        if (e.target.files) {
                                                                            const newFiles = Array.from(e.target.files);
                                                                            setCuisineImageFiles(prev => [...prev, ...newFiles].slice(0, 3));
                                                                        }
                                                                    }} style={{ display: 'none' }} />
                                                                </label>
                                                                <button type="button" onClick={() => setCameraMode('cuisine')} style={{ padding: "6px 12px", backgroundColor: "#e2e8f0", color: "#334155", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold", border: "none" }}>
                                                                    Take Photo
                                                                </button>
                                                            </>
                                                        )}
                                                        <button type="button" onClick={() => setCuisineImageFiles([])} style={{ padding: "6px 12px", backgroundColor: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}>Clear All</button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '30px' }}>
                                <button type="button" onClick={prevStep} className="btn" style={{ backgroundColor: '#CCC', width: '100px', color: '#333' }} disabled={loading}>Back</button>
                                <button type="submit" className="btn btn-coral" style={{ width: 'auto' }} disabled={loading || success}>
                                    {loading ? "Submitting..." : "Submit Application"}
                                </button>
                            </div>
                        </div>
                    )}
                </form>

            </div>
            {cameraMode && <CameraCaptureModal onCapture={handleCameraCapture} onClose={() => setCameraMode(null)} />}
        </div>
    );
}
