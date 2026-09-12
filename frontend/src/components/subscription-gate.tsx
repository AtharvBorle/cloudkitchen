"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { performLogout } from "@/lib/logout";

interface SubscriptionGateProps {
    children: ReactNode;
    verificationStatus: string;
    hasActiveSub: boolean;
}

export default function SubscriptionGate({ children, verificationStatus, hasActiveSub }: SubscriptionGateProps) {
    const pathname = usePathname();

    const isRevisionPage = pathname && pathname.includes("/revision");
    const isPaymentPage = pathname && pathname.includes("/payment");

    // 1. Pending Gate
    if (verificationStatus === "PENDING") {
        return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "#f8fafc", padding: "2rem", textAlign: "center" }}>
                <div style={{ backgroundColor: "white", padding: "3rem", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", maxWidth: "500px" }}>
                    <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#0f172a", marginBottom: "1rem" }}>Awaiting Admin Approval</h1>
                    <p style={{ color: "#64748b", marginBottom: "2rem", lineHeight: "1.6" }}>
                        Your seller profile is currently under review. Our admins will verify your FSSAI and Adhaar documents shortly.
                        Once approved, you will be able to access your dashboard and start receiving orders.
                    </p>
                    <button onClick={() => performLogout({ role: "SELLER" })} style={{ padding: "12px 24px", backgroundColor: "#f1f5f9", color: "#475569", borderRadius: "8px", border: "none", fontFamily: "inherit", fontWeight: "600", cursor: "pointer", display: "inline-block" }}>
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

    // 2. Revision Gate
    if (verificationStatus === "REVISION" && !isRevisionPage) {
        return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "#f8fafc", padding: "2rem", textAlign: "center" }}>
                <div style={{ backgroundColor: "white", padding: "3rem", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", maxWidth: "500px" }}>
                    <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#0f172a", marginBottom: "1rem" }}>Action Required</h1>
                    <p style={{ color: "#64748b", marginBottom: "2rem", lineHeight: "1.6" }}>
                        Our admins have reviewed your application and requested some changes to your documents. Please review their notes and re-upload the requested items.
                    </p>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                        <button onClick={() => performLogout({ role: "SELLER" })} style={{ padding: "12px 24px", backgroundColor: "#f1f5f9", color: "#475569", borderRadius: "8px", border: "none", fontFamily: "inherit", fontWeight: "600", cursor: "pointer", display: "inline-block" }}>
                            Sign Out
                        </button>
                        <Link href="/dashboard/seller/revision" style={{ padding: "12px 24px", backgroundColor: "#d97706", color: "white", borderRadius: "8px", textDecoration: "none", fontWeight: "600", display: "inline-block" }}>
                            Update Documents
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // 3. Rejected Gate
    if (verificationStatus === "REJECTED") {
        return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "#f8fafc", padding: "2rem", textAlign: "center" }}>
                <div style={{ backgroundColor: "white", padding: "3rem", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", maxWidth: "500px" }}>
                    <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                    </div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#0f172a", marginBottom: "1rem" }}>Verification Failed</h1>
                    <p style={{ color: "#64748b", marginBottom: "2rem", lineHeight: "1.6" }}>
                        Unfortunately, your seller application has been rejected by our admins based on the provided documents. Please reach out to support for more information or to re-apply.
                    </p>
                    <button onClick={() => performLogout({ role: "SELLER" })} style={{ padding: "12px 24px", backgroundColor: "#f1f5f9", color: "#475569", borderRadius: "8px", border: "none", fontFamily: "inherit", fontWeight: "600", cursor: "pointer", display: "inline-block" }}>
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

    // 4. Subscription Gate (Bypass if already on the payment or revision page)

    if (!hasActiveSub && !isPaymentPage && !isRevisionPage) {
        return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "#f8fafc", padding: "1.25rem", textAlign: "center" }}>
                <div style={{ backgroundColor: "white", padding: "2.5rem 1.5rem", borderRadius: "24px", boxShadow: "0 20px 50px rgba(0,0,0,0.05)", maxWidth: "480px", width: "100%", border: "1px solid #F1F5F9" }}>
                    <div style={{ width: "72px", height: "72px", borderRadius: "50%", backgroundColor: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                        <ShieldCheck size={36} color="#3b82f6" />
                    </div>
                    <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0f172a", marginBottom: "0.75rem", letterSpacing: "-0.5px" }}>Subscription Required</h1>
                    <p style={{ color: "#64748b", marginBottom: "2.5rem", lineHeight: "1.6", fontSize: "1rem" }}>
                        Your profile is approved! Just one last step: activate your subscription to unlock your professional kitchen dashboard.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <Link href="/dashboard/seller/payment" className="btn btn-coral" style={{ padding: "14px", borderRadius: "12px", textDecoration: "none", fontWeight: "700", fontSize: "1.05rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                            Pay Subscription & Finish
                        </Link>
                        <button onClick={() => performLogout({ role: "SELLER" })} style={{ padding: "12px", color: "#94a3b8", backgroundColor: "transparent", border: "none", fontFamily: "inherit", cursor: "pointer", fontSize: "0.9rem", fontWeight: "600" }}>
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Pass through
    return <>{children}</>;
}
