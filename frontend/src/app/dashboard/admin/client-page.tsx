"use client";

import { FileText, Utensils, Home, ChevronRight, Clock } from "lucide-react";
import Link from "next/link";

type VerificationType = {
    id: string;
    businessName: string;
    type: string;
    createdAt?: string | Date;
    status: string;
};

type ClientPageProps = {
    verifications: VerificationType[];
    stats: {
        pending: number;
        approved: number;
        rejected: number;
    }
};

export default function AdminDashboardClient({ verifications, stats }: ClientPageProps) {
    return (
        <div style={{ animation: "fadeIn 0.5s ease-out" }}>
            <div style={{
                backgroundColor: "white",
                padding: "2rem",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                border: "1px solid #f1f5f9",
                marginBottom: "2rem"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                    <div>
                        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
                            <FileText color="var(--primary)" size={24} />
                            Pending Verifications
                        </h2>
                        <p style={{ color: "#64748b", fontSize: "0.95rem" }}>{verifications.length} Sellers require document verification to activate their stores.</p>
                    </div>
                    <div style={{
                        backgroundColor: "#fff0f0",
                        color: "var(--primary)",
                        padding: "8px 16px",
                        borderRadius: "20px",
                        fontWeight: "600",
                        fontSize: "0.85rem"
                    }}>
                        {verifications.length} Pending Actions
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {verifications.length > 0 ? (
                        verifications.map((request, i) => (
                            <div key={request.id} style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "1.25rem 1.5rem",
                                backgroundColor: "white",
                                border: "1px solid #e2e8f0",
                                borderRadius: "12px",
                                transition: "all 0.2s ease",
                                cursor: "pointer",
                                position: "relative",
                                overflow: "hidden"
                            }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.borderColor = "var(--primary)";
                                    e.currentTarget.style.boxShadow = "0 8px 25px rgba(250, 109, 107, 0.15)";
                                    e.currentTarget.style.transform = "translateY(-2px)";
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.borderColor = "#e2e8f0";
                                    e.currentTarget.style.boxShadow = "none";
                                    e.currentTarget.style.transform = "translateY(0)";
                                }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                                    <div style={{
                                        backgroundColor: request.type.toLowerCase().includes("food") || request.type.toLowerCase().includes("mess") ? "#fef08a" : "#bae6fd",
                                        padding: "12px",
                                        borderRadius: "12px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: request.type.toLowerCase().includes("food") || request.type.toLowerCase().includes("mess") ? "#ca8a04" : "#0284c7"
                                    }}>
                                        {(request.type.toLowerCase().includes("food") || request.type.toLowerCase().includes("mess")) ? <Utensils size={24} /> : <Home size={24} />}
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                        <h4 style={{ fontWeight: "600", color: "#1e293b", fontSize: "1.1rem" }}>{request.businessName || "Unnamed Business"}</h4>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.85rem", color: "#64748b" }}>
                                            <span style={{
                                                backgroundColor: "#f1f5f9",
                                                padding: "2px 8px",
                                                borderRadius: "6px",
                                                fontWeight: "500",
                                                color: "#475569"
                                            }}>
                                                {request.type}
                                            </span>
                                            {request.status === "REVISION" && (
                                                <span style={{
                                                    backgroundColor: "#fef3c7",
                                                    padding: "2px 8px",
                                                    borderRadius: "6px",
                                                    fontWeight: "500",
                                                    color: "#d97706",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "4px"
                                                }}>
                                                    Reverted for Changes
                                                </span>
                                            )}
                                            {request.createdAt && (
                                                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                    <Clock size={14} />
                                                    {new Date(request.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Link href="/dashboard/admin/registrations" style={{ textDecoration: 'none' }}>
                                    <button style={{
                                        backgroundColor: "white",
                                        color: "var(--primary)",
                                        border: "1px solid var(--primary)",
                                        padding: "8px 20px",
                                        borderRadius: "8px",
                                        fontWeight: "600",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        transition: "all 0.2s ease",
                                        cursor: "pointer"
                                    }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.backgroundColor = "var(--primary)";
                                            e.currentTarget.style.color = "white";
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.backgroundColor = "white";
                                            e.currentTarget.style.color = "var(--primary)";
                                        }}>
                                        Review Docs
                                        <ChevronRight size={16} />
                                    </button>
                                </Link>
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                            No pending verifications at the moment. Good job!
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Stats Cards below pending verifications */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
                {[
                    { label: "Total Pending Verifications", value: stats.pending.toString(), color: "var(--primary)", bgColor: "#fff0f0" },
                    { label: "Total Approved Sellers", value: stats.approved.toString(), color: "var(--secondary)", bgColor: "#f0fdf4" },
                    { label: "Total Rejected Applications", value: stats.rejected.toString(), color: "#eab308", bgColor: "#fefce8" }
                ].map((stat, i) => (
                    <div key={i} style={{
                        backgroundColor: "white",
                        padding: "1.5rem",
                        borderRadius: "16px",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
                        border: "1px solid #f1f5f9",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        position: "relative",
                        overflow: "hidden"
                    }}>
                        <div style={{
                            position: "absolute",
                            left: 0, top: 0, bottom: 0, width: "4px",
                            backgroundColor: stat.color
                        }} />
                        <span style={{ color: "#64748b", fontSize: "0.9rem", fontWeight: "500", marginLeft: "10px" }}>{stat.label}</span>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginLeft: "10px" }}>
                            <span style={{ fontSize: "2rem", fontWeight: "700", color: "#0f172a" }}>{stat.value}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add fade in animation to page head */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
