"use client";
import { fetchApi } from "@/lib/fetch-api";


import { useState } from "react";
import { CheckCircle, XCircle, FileText, ExternalLink, Loader2, User, Phone, Mail, MapPin, AlertCircle, ZoomIn, ZoomOut } from "lucide-react";
import Image from "next/image";

type ApplicationType = {
    id: string;
    businessName: string;
    type: string;
    ownerName: string;
    email: string;
    phone: string;
    kitchenAddress: string;
    adhaarUrl: string;
    fssaiUrl: string | null;
    lightBillUrl: string | null;
    passbookUrl: string | null;
    kitchenImages: string[];
    cuisineImages: string[];
    roomImages?: string[];
    createdAt: string;
    verificationStatus?: string;
};

export default function RegistrationsClient({ initialApplications }: { initialApplications: ApplicationType[] }) {
    const [applications, setApplications] = useState<ApplicationType[]>(initialApplications);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Revision State
    const [revisionAppId, setRevisionAppId] = useState<string | null>(null);
    const [revisionNote, setRevisionNote] = useState("");
    const [revisionChecks, setRevisionChecks] = useState({
        adhaar: false,
        fssai: false,
        lightBill: false,
        passbook: false,
        kitchenImages: false,
        cuisineImages: false,
        roomImages: false,
    });

    // Image Modal State
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);

    const openImage = (e: React.MouseEvent, url: string) => {
        e.preventDefault();
        setSelectedImage(url);
        setZoomLevel(1);
    };

    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.5, 3));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
    const closeImage = () => setSelectedImage(null);

    const handleAction = async (sellerId: string, action: "APPROVE" | "REJECT" | "REVISION") => {
        setProcessingId(sellerId);
        try {
            const bodyData: any = { sellerId, action };
            if (action === "REVISION") {
                let generatedNote = "Please re-upload the following documents:\n";
                if (revisionChecks.adhaar) generatedNote += "- Aadhaar Card\n";
                if (revisionChecks.fssai) generatedNote += "- FSSAI Certificate\n";
                if (revisionChecks.lightBill) generatedNote += "- Electricity Bill (Light Bill)\n";
                if (revisionChecks.passbook) generatedNote += "- Bank Passbook\n";
                if (revisionChecks.kitchenImages) generatedNote += "- Kitchen Images\n";
                if (revisionChecks.cuisineImages) generatedNote += "- Cuisine / Food Images\n";
                if (revisionChecks.roomImages) generatedNote += "- Room Photos\n";

                if (revisionNote.trim() !== "") {
                    generatedNote += `\nAdditional Notes from Admin:\n${revisionNote}`;
                }
                bodyData.verificationNote = generatedNote;
            }

            const res = await fetchApi("/api/admin/registrations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bodyData),
            });

            if (res.ok) {
                // Remove the application from the list
                setApplications(prev => prev.filter(app => app.id !== sellerId));
            } else {
                alert(`Failed to ${action.toLowerCase()} application. Please try again.`);
            }
        } catch (error) {
            console.error("Action error:", error);
            alert("An error occurred.");
        } finally {
            setProcessingId(null);
            if (action === "REVISION") {
                setRevisionAppId(null);
                setRevisionNote("");
                setRevisionChecks({ adhaar: false, fssai: false, lightBill: false, passbook: false, kitchenImages: false, cuisineImages: false, roomImages: false });
            }
        }
    };

    return (
        <div style={{ animation: "fadeIn 0.5s ease-out" }}>
            <div style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", marginBottom: "0.5rem" }}>
                    Seller Applications
                </h2>
                <p style={{ color: "#64748b" }}>Review and verify documentation for new seller registrations.</p>
            </div>

            {applications.length === 0 ? (
                <div style={{
                    backgroundColor: "white",
                    padding: "4rem 2rem",
                    borderRadius: "16px",
                    textAlign: "center",
                    border: "1px dashed #cbd5e1",
                    color: "#64748b"
                }}>
                    <CheckCircle size={48} color="var(--secondary)" style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
                    <h3 style={{ fontSize: "1.25rem", color: "#334155", marginBottom: "0.5rem" }}>All caught up!</h3>
                    <p>There are no pending applications to review right now.</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {applications.map((app) => (
                        <div key={app.id} style={{
                            backgroundColor: "white",
                            borderRadius: "16px",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                            border: "1px solid #f1f5f9",
                            overflow: "hidden"
                        }}>
                            {/* Header */}
                            <div style={{
                                padding: "1.5rem",
                                alignItems: "center",
                                backgroundColor: "#fafbfc"
                            }}>
                                <div>
                                    <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                                        {app.businessName}
                                        <span style={{
                                            fontSize: "0.75rem",
                                            padding: "4px 10px",
                                            backgroundColor: app.type.toLowerCase().includes("food") ? "#fef08a" : "#bae6fd",
                                            color: app.type.toLowerCase().includes("food") ? "#ca8a04" : "#0284c7",
                                            borderRadius: "20px",
                                            fontWeight: "600"
                                        }}>
                                            {app.type.toUpperCase()}
                                        </span>
                                        {app.verificationStatus === "REVISION" && (
                                            <span style={{
                                                fontSize: "0.75rem",
                                                padding: "4px 10px",
                                                backgroundColor: "#fef3c7",
                                                color: "#d97706",
                                                borderRadius: "20px",
                                                fontWeight: "600",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "4px"
                                            }}>
                                                Reverted for Changes
                                            </span>
                                        )}
                                    </h3>
                                    <p suppressHydrationWarning style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "4px" }}>
                                        Applied on {new Date(app.createdAt).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <button
                                        onClick={() => handleAction(app.id, "REJECT")}
                                        disabled={processingId === app.id}
                                        style={{
                                            padding: "10px 20px",
                                            borderRadius: "8px",
                                            fontWeight: "600",
                                            backgroundColor: "white",
                                            color: "var(--primary)",
                                            border: "1px solid var(--primary)",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            transition: "all 0.2s",
                                            cursor: processingId === app.id ? "not-allowed" : "pointer",
                                            opacity: processingId === app.id ? 0.7 : 1
                                        }}
                                        onMouseOver={(e) => !processingId && (e.currentTarget.style.backgroundColor = "#fff0f0")}
                                        onMouseOut={(e) => !processingId && (e.currentTarget.style.backgroundColor = "white")}
                                    >
                                        <XCircle size={18} />
                                        Reject
                                    </button>

                                    <button
                                        onClick={() => setRevisionAppId(app.id)}
                                        disabled={processingId === app.id}
                                        style={{
                                            padding: "10px 20px",
                                            borderRadius: "8px",
                                            fontWeight: "600",
                                            backgroundColor: "white",
                                            color: "#d97706",
                                            border: "1px solid #d97706",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            transition: "all 0.2s",
                                            cursor: processingId === app.id ? "not-allowed" : "pointer",
                                            opacity: processingId === app.id ? 0.7 : 1
                                        }}
                                        onMouseOver={(e) => !processingId && (e.currentTarget.style.backgroundColor = "#fffbeb")}
                                        onMouseOut={(e) => !processingId && (e.currentTarget.style.backgroundColor = "white")}
                                    >
                                        <AlertCircle size={18} />
                                        Request Revision
                                    </button>

                                    <button
                                        onClick={() => handleAction(app.id, "APPROVE")}
                                        disabled={processingId === app.id}
                                        style={{
                                            padding: "10px 24px",
                                            borderRadius: "8px",
                                            fontWeight: "600",
                                            backgroundColor: "var(--secondary)",
                                            color: "white",
                                            border: "1px solid var(--secondary)",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            transition: "all 0.2s",
                                            cursor: processingId === app.id ? "not-allowed" : "pointer",
                                            opacity: processingId === app.id ? 0.7 : 1,
                                            boxShadow: "0 4px 10px rgba(72, 201, 176, 0.2)"
                                        }}
                                        onMouseOver={(e) => !processingId && (e.currentTarget.style.backgroundColor = "var(--secondary-hover)")}
                                        onMouseOut={(e) => !processingId && (e.currentTarget.style.backgroundColor = "var(--secondary)")}
                                    >
                                        {processingId === app.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                        Approve Seller
                                    </button>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", padding: "1.5rem" }}>
                                {/* Personal Info */}
                                <div>
                                    <h4 style={{ fontSize: "0.9rem", textTransform: "uppercase", color: "#94a3b8", fontWeight: "700", marginBottom: "1rem", letterSpacing: "0.5px" }}>Owner Details</h4>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <User size={18} color="#64748b" />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>Full Name</p>
                                                <p style={{ fontWeight: "600", color: "#334155", margin: 0 }}>{app.ownerName}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <Phone size={18} color="#64748b" />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>Phone Number</p>
                                                <p style={{ fontWeight: "600", color: "#334155", margin: 0 }}>{app.phone}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <Mail size={18} color="#64748b" />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>Email Address</p>
                                                <p style={{ fontWeight: "600", color: "#334155", margin: 0 }}>{app.email}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <MapPin size={18} color="#64748b" />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>Kitchen Address</p>
                                                <p style={{ fontWeight: "600", color: "#334155", margin: 0 }}>{app.kitchenAddress}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Documents */}
                                <div>
                                    <h4 style={{ fontSize: "0.9rem", textTransform: "uppercase", color: "#94a3b8", fontWeight: "700", marginBottom: "1rem", letterSpacing: "0.5px" }}>Verification Documents</h4>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                        {/* Adhaar */}
                                        {(() => {
                                            let adhaarUrls: string[] = [];
                                            try {
                                                if (app.adhaarUrl.startsWith("[")) {
                                                    adhaarUrls = JSON.parse(app.adhaarUrl);
                                                } else {
                                                    adhaarUrls = [app.adhaarUrl];
                                                }
                                            } catch {
                                                adhaarUrls = [app.adhaarUrl];
                                            }

                                            return adhaarUrls.map((url, idx) => (
                                                <div key={idx} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                        <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                            <FileText size={20} color="#3b82f6" />
                                                        </div>
                                                        <div>
                                                            <p style={{ fontWeight: "600", color: "#334155", margin: 0 }}>
                                                                Aadhaar Card {adhaarUrls.length > 1 ? (idx === 0 ? "(Front)" : "(Back)") : ""}
                                                            </p>
                                                            <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>Identity Proof</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => openImage(e, url)}
                                                        style={{
                                                            padding: "8px 16px", backgroundColor: "#f8fafc", color: "#334155", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px", border: "1px solid #e2e8f0", cursor: "pointer"
                                                        }}
                                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                                                    >
                                                        View <ExternalLink size={14} />
                                                    </button>
                                                </div>
                                            ));
                                        })()}

                                         {/* FSSAI */}
                                         <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                             <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                 <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                     <FileText size={20} color="#22c55e" />
                                                 </div>
                                                 <div>
                                                     <p style={{ fontWeight: "600", color: "#334155", margin: 0 }}>FSSAI Certificate</p>
                                                     <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>Food Safety License</p>
                                                 </div>
                                             </div>
                                             {app.fssaiUrl ? (
                                                 <button
                                                     onClick={(e) => app.fssaiUrl && openImage(e, app.fssaiUrl)}
                                                     style={{
                                                         padding: "8px 16px", backgroundColor: "#f8fafc", color: "#334155", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px", border: "1px solid #e2e8f0", cursor: "pointer"
                                                     }}
                                                     onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                                                     onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                                                 >
                                                     View <ExternalLink size={14} />
                                                 </button>
                                             ) : (
                                                 <span style={{ fontSize: "0.85rem", color: "#94a3b8", fontStyle: "italic", padding: "8px 16px" }}>Not provided</span>
                                             )}
                                         </div>

                                         {/* Light Bill */}
                                         <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                             <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                 <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                     <FileText size={20} color="#f97316" />
                                                 </div>
                                                 <div>
                                                     <p style={{ fontWeight: "600", color: "#334155", margin: 0 }}>Electricity Bill (Light Bill)</p>
                                                     <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>Address Proof</p>
                                                 </div>
                                             </div>
                                             {app.lightBillUrl ? (
                                                 <button
                                                     onClick={(e) => app.lightBillUrl && openImage(e, app.lightBillUrl)}
                                                     style={{
                                                         padding: "8px 16px", backgroundColor: "#f8fafc", color: "#334155", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px", border: "1px solid #e2e8f0", cursor: "pointer"
                                                     }}
                                                     onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                                                     onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                                                 >
                                                     View <ExternalLink size={14} />
                                                 </button>
                                             ) : (
                                                 <span style={{ fontSize: "0.85rem", color: "#94a3b8", fontStyle: "italic", padding: "8px 16px" }}>Not provided</span>
                                             )}
                                         </div>

                                         {/* Bank Passbook */}
                                         <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                             <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                 <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "#faf5ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                     <FileText size={20} color="#a855f7" />
                                                 </div>
                                                 <div>
                                                     <p style={{ fontWeight: "600", color: "#334155", margin: 0 }}>Bank Passbook</p>
                                                     <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>Bank Account Proof</p>
                                                 </div>
                                             </div>
                                             {app.passbookUrl ? (
                                                 <button
                                                     onClick={(e) => app.passbookUrl && openImage(e, app.passbookUrl)}
                                                     style={{
                                                         padding: "8px 16px", backgroundColor: "#f8fafc", color: "#334155", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px", border: "1px solid #e2e8f0", cursor: "pointer"
                                                     }}
                                                     onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                                                     onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                                                 >
                                                     View <ExternalLink size={14} />
                                                 </button>
                                             ) : (
                                                 <span style={{ fontSize: "0.85rem", color: "#94a3b8", fontStyle: "italic", padding: "8px 16px" }}>Not provided</span>
                                             )}
                                         </div>

                                        {/* Kitchen Images Gallery */}
                                        {app.kitchenImages && app.kitchenImages.length > 0 && (
                                            <div style={{ marginTop: "1rem" }}>
                                                <h5 style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.5rem", fontWeight: "600" }}>Kitchen Photos ({app.kitchenImages.length})</h5>
                                                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                                    {app.kitchenImages.map((img, i) => (
                                                        <div key={i} onClick={(e) => openImage(e, img)} style={{ cursor: "pointer", transition: "transform 0.2s" }} onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"} onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}>
                                                            <div style={{ width: "80px", height: "80px", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                                                                <img src={img} alt={`Kitchen ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Cuisine/Food Images Gallery */}
                                        {app.cuisineImages && app.cuisineImages.length > 0 && (
                                            <div style={{ marginTop: "1rem" }}>
                                                <h5 style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.5rem", fontWeight: "600" }}>Food & Cuisine Photos ({app.cuisineImages.length})</h5>
                                                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                                    {app.cuisineImages.map((img, i) => (
                                                        <div key={i} onClick={(e) => openImage(e, img)} style={{ cursor: "pointer", transition: "transform 0.2s" }} onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"} onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}>
                                                            <div style={{ width: "80px", height: "80px", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                                                                <img src={img} alt={`Food item ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Room Photos Gallery */}
                                        {app.roomImages && app.roomImages.length > 0 && (
                                            <div style={{ marginTop: "1rem" }}>
                                                <h5 style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.5rem", fontWeight: "600" }}>Room Photos ({app.roomImages.length})</h5>
                                                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                                    {app.roomImages.map((img, i) => (
                                                        <div key={i} onClick={(e) => openImage(e, img)} style={{ cursor: "pointer", transition: "transform 0.2s" }} onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"} onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}>
                                                            <div style={{ width: "80px", height: "80px", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                                                                <img src={img} alt={`Room Photo ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                    }
                </div >
            )}

            {/* Revision Modal */}
            {
                revisionAppId && (
                    <div style={{
                        position: "fixed",
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                        padding: "1rem"
                    }}>
                        <div style={{
                            backgroundColor: "white",
                            borderRadius: "16px",
                            padding: "2rem",
                            width: "100%",
                            maxWidth: "500px",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                        }}>
                            <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#0f172a", marginBottom: "0.5rem" }}>Request Document Revision</h3>
                            <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                                Select the documents that need to be re-uploaded by the seller.
                            </p>

                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "1.5rem" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#334155" }}>
                                    <input type="checkbox" checked={revisionChecks.adhaar} onChange={(e) => setRevisionChecks(prev => ({ ...prev, adhaar: e.target.checked }))} />
                                    Aadhaar Card
                                </label>
                                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#334155" }}>
                                    <input type="checkbox" checked={revisionChecks.fssai} onChange={(e) => setRevisionChecks(prev => ({ ...prev, fssai: e.target.checked }))} />
                                    FSSAI Certificate
                                </label>
                                 <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#334155" }}>
                                     <input type="checkbox" checked={revisionChecks.lightBill} onChange={(e) => setRevisionChecks(prev => ({ ...prev, lightBill: e.target.checked }))} />
                                     Electricity Bill (Light Bill)
                                 </label>
                                 <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#334155" }}>
                                     <input type="checkbox" checked={revisionChecks.passbook} onChange={(e) => setRevisionChecks(prev => ({ ...prev, passbook: e.target.checked }))} />
                                     Bank Passbook
                                 </label>
                                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#334155" }}>
                                    <input type="checkbox" checked={revisionChecks.kitchenImages} onChange={(e) => setRevisionChecks(prev => ({ ...prev, kitchenImages: e.target.checked }))} />
                                    Kitchen Images
                                </label>
                                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#334155" }}>
                                    <input type="checkbox" checked={revisionChecks.cuisineImages} onChange={(e) => setRevisionChecks(prev => ({ ...prev, cuisineImages: e.target.checked }))} />
                                    Cuisine / Food Images
                                </label>
                                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#334155" }}>
                                    <input type="checkbox" checked={revisionChecks.roomImages} onChange={(e) => setRevisionChecks(prev => ({ ...prev, roomImages: e.target.checked }))} />
                                    Room Photos
                                </label>
                            </div>

                            <div style={{ marginBottom: "2rem" }}>
                                <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "600", color: "#334155", marginBottom: "8px" }}>Additional Notes</label>
                                <textarea
                                    value={revisionNote}
                                    onChange={(e) => setRevisionNote(e.target.value)}
                                    placeholder="E.g. The Aadhaar card image is too blurry to read."
                                    style={{
                                        width: "100%",
                                        minHeight: "100px",
                                        padding: "12px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        resize: "vertical",
                                        fontFamily: "inherit"
                                    }}
                                />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                                <button
                                    onClick={() => {
                                        setRevisionAppId(null);
                                        setRevisionNote("");
                                        setRevisionChecks({ adhaar: false, fssai: false, lightBill: false, passbook: false, kitchenImages: false, cuisineImages: false, roomImages: false });
                                    }}
                                    style={{ padding: "10px 16px", borderRadius: "8px", backgroundColor: "#f1f5f9", color: "#475569", fontWeight: "600", border: "none", cursor: "pointer" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleAction(revisionAppId, "REVISION")}
                                    disabled={processingId !== null}
                                    style={{ padding: "10px 16px", borderRadius: "8px", backgroundColor: "#d97706", color: "white", fontWeight: "600", border: "none", cursor: processingId ? "not-allowed" : "pointer", opacity: processingId ? 0.7 : 1, display: "flex", alignItems: "center", gap: "8px" }}
                                >
                                    {processingId ? <Loader2 size={16} className="animate-spin" /> : <AlertCircle size={16} />}
                                    Send Request
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Image Viewer Modal */}
            {
                selectedImage && (
                    <div style={{
                        position: "fixed",
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.85)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 2000,
                    }}>
                        {/* Toolbar */}
                        <div style={{ position: "absolute", top: "20px", right: "20px", display: "flex", gap: "15px", zIndex: 2010 }}>
                            {!selectedImage.toLowerCase().endsWith(".pdf") && (
                                <>
                                    <button onClick={handleZoomIn} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", padding: "10px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.4)"} onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"} title="Zoom In">
                                        <ZoomIn size={24} />
                                    </button>
                                    <button onClick={handleZoomOut} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", padding: "10px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.4)"} onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"} title="Zoom Out">
                                        <ZoomOut size={24} />
                                    </button>
                                </>
                            )}
                            <button onClick={closeImage} style={{ background: "var(--primary)", border: "none", color: "white", padding: "10px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "#b51a2d"} onMouseOut={(e) => e.currentTarget.style.background = "var(--primary)"} title="Close">
                                <XCircle size={24} />
                            </button>
                        </div>

                        {/* Image Container */}
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                overflow: "auto",
                                display: "flex",
                                alignItems: zoomLevel > 1 && !selectedImage.toLowerCase().endsWith(".pdf") ? "flex-start" : "center",
                                justifyContent: zoomLevel > 1 && !selectedImage.toLowerCase().endsWith(".pdf") ? "flex-start" : "center",
                                padding: selectedImage.toLowerCase().endsWith(".pdf") ? "80px 40px" : "40px"
                            }}
                            onClick={(e) => {
                                if (e.target === e.currentTarget) closeImage();
                            }}
                        >
                            {selectedImage.toLowerCase().endsWith(".pdf") ? (
                                <iframe
                                    src={selectedImage}
                                    title="Document Viewer"
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        maxWidth: "900px",
                                        border: "none",
                                        borderRadius: "8px",
                                        backgroundColor: "white"
                                    }}
                                />
                            ) : (
                                <img
                                    src={selectedImage}
                                    alt="Expanded View"
                                    style={{
                                        transform: `scale(${zoomLevel})`,
                                        transformOrigin: "top left",
                                        transition: "transform 0.2s ease-out",
                                        maxWidth: zoomLevel > 1 ? "none" : "100%",
                                        maxHeight: zoomLevel > 1 ? "none" : "100%",
                                        objectFit: "contain",
                                        borderRadius: "8px",
                                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                                        margin: zoomLevel > 1 ? "auto" : "0"
                                    }}
                                />
                            )}
                        </div>
                    </div>
                )
            }

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
        </div >
    );
}
