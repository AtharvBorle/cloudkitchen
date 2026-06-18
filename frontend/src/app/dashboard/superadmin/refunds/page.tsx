"use client";

import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/fetch-api";
import { CreditCard, Loader2, Search, Filter, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

export default function SuperAdminRefundsPage() {
    const [refunds, setRefunds] = useState<any[]>([]);
    const [selectedRefund, setSelectedRefund] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    // Process state
    const [adminNote, setAdminNote] = useState("");
    const [transactionId, setTransactionId] = useState("");
    const [processing, setProcessing] = useState(false);

    const fetchRefunds = async () => {
        try {
            setLoading(true);
            const res = await fetchApi("/api/refunds");
            const data = await res.json();
            if (res.ok) {
                setRefunds(data.data || data);
            }
        } catch (error) {
            console.error("Failed to load refunds", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRefunds();
    }, []);

    const handleProcessRefund = async (status: "APPROVED" | "REJECTED") => {
        if (!selectedRefund || processing) return;

        if (status === "APPROVED" && !transactionId.trim()) {
            alert("Transaction/Reference ID is required to approve a refund.");
            return;
        }

        setProcessing(true);
        try {
            const res = await fetchApi(`/api/refunds/${selectedRefund.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status,
                    transactionId: transactionId.trim(),
                    adminNote: adminNote.trim()
                })
            });

            if (res.ok) {
                const data = await res.json();
                const updated = data.data || data;
                
                // Update local list
                setRefunds(prev => prev.map(r => r.id === selectedRefund.id ? { ...r, ...updated } : r));
                setSelectedRefund(prev => prev ? { ...prev, ...updated } : null);
                
                // Reset form inputs
                setAdminNote("");
                setTransactionId("");
                
                alert(`Refund successfully marked ${status.toLowerCase()}!`);
            } else {
                const err = await res.json();
                alert(err.message || "Failed to update refund status.");
            }
        } catch (error) {
            console.error("Error processing refund:", error);
            alert("An error occurred. Please try again.");
        } finally {
            setProcessing(false);
        }
    };

    const filteredRefunds = refunds.filter(r => {
        const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
        
        const customerName = r.user?.name?.toLowerCase() || "";
        const customerEmail = r.user?.email?.toLowerCase() || "";
        const reason = r.reason?.toLowerCase() || "";
        const refId = r.id?.toLowerCase() || "";
        const query = searchQuery.toLowerCase();
        
        const matchesSearch = customerName.includes(query) || 
                              customerEmail.includes(query) || 
                              reason.includes(query) || 
                              refId.includes(query);

        return matchesStatus && matchesSearch;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return (
                    <span style={{ backgroundColor: "#FEF3C7", color: "#D97706", padding: "6px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={12} /> PENDING
                    </span>
                );
            case "APPROVED":
                return (
                    <span style={{ backgroundColor: "#DCFCE7", color: "#166534", padding: "6px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <CheckCircle2 size={12} /> APPROVED
                    </span>
                );
            case "REJECTED":
                return (
                    <span style={{ backgroundColor: "#FEE2E2", color: "#991B1B", padding: "6px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <XCircle size={12} /> REJECTED
                    </span>
                );
            default:
                return <span>{status}</span>;
        }
    };

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                <div>
                    <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "#1E293B", marginBottom: "4px" }}>Manage Refunds</h1>
                    <p style={{ color: "#64748B", fontSize: "0.9rem" }}>Process and fulfill refund requests for food orders and room stays</p>
                </div>
                <button
                    onClick={fetchRefunds}
                    style={{
                        backgroundColor: "#F1F5F9",
                        border: "1px solid #CBD5E1",
                        color: "#475569",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "700",
                        fontSize: "0.85rem"
                    }}
                >
                    Refresh
                </button>
            </div>

            {/* Split Screen Container */}
            <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: "30px", minHeight: "550px" }}>
                
                {/* Left side: Search, Filters & Requests List */}
                <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #E2E8F0", padding: "20px", display: "flex", flexDirection: "column", gap: "15px" }}>
                    
                    {/* Search Input */}
                    <div style={{ position: "relative" }}>
                        <Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} size={16} />
                        <input
                            type="text"
                            placeholder="Search name, email, reason..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px 12px 10px 38px",
                                borderRadius: "8px",
                                border: "1px solid #CBD5E1",
                                outline: "none",
                                fontSize: "0.85rem"
                            }}
                        />
                    </div>

                    {/* Status Filter Tab Group */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: "800", color: "#64748B", display: "flex", alignItems: "center", gap: "5px" }}>
                            <Filter size={12} /> FILTER BY STATUS
                        </span>
                        <div style={{ display: "flex", gap: "5px", backgroundColor: "#F1F5F9", padding: "4px", borderRadius: "8px" }}>
                            {["ALL", "PENDING", "APPROVED", "REJECTED"].map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setStatusFilter(filter)}
                                    style={{
                                        flex: 1,
                                        padding: "6px 0",
                                        borderRadius: "6px",
                                        border: "none",
                                        backgroundColor: statusFilter === filter ? "white" : "transparent",
                                        color: statusFilter === filter ? "#1E293B" : "#64748B",
                                        fontWeight: "700",
                                        fontSize: "0.75rem",
                                        cursor: "pointer",
                                        transition: "all 0.15s",
                                        boxShadow: statusFilter === filter ? "0 1px 3px rgba(0,0,0,0.05)" : "none"
                                    }}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ borderBottom: "1px solid #F1F5F9" }} />

                    {/* List Body */}
                    {loading ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                            <Loader2 className="animate-spin" color="var(--primary)" />
                        </div>
                    ) : filteredRefunds.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px 20px", color: "#94A3B8" }}>
                            <AlertCircle size={32} style={{ margin: "0 auto 10px" }} />
                            <p style={{ fontSize: "0.85rem" }}>No refund requests found.</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", maxHeight: "550px" }}>
                            {filteredRefunds.map(r => (
                                <div
                                    key={r.id}
                                    onClick={() => {
                                        setSelectedRefund(r);
                                        setAdminNote("");
                                        setTransactionId("");
                                    }}
                                    style={{
                                        padding: "16px",
                                        borderRadius: "12px",
                                        border: `1px solid ${selectedRefund?.id === r.id ? "var(--coral, #F16F68)" : "#E2E8F0"}`,
                                        backgroundColor: selectedRefund?.id === r.id ? "#FFF8F7" : "white",
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                        <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#64748B" }}>
                                            {r.orderId ? "🍕 FOOD ORDER" : "🛌 STAY BOOKING"}
                                        </span>
                                        {getStatusBadge(r.status)}
                                    </div>
                                    <div style={{ fontWeight: "800", fontSize: "1.05rem", color: "#1E293B", marginBottom: "4px" }}>
                                        ₹{r.amount}
                                    </div>
                                    <div style={{ fontSize: "0.8rem", color: "#334155", marginBottom: "6px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        Reason: {r.reason}
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#94A3B8" }}>
                                        <span>By: {r.user?.name}</span>
                                        <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right side: Detailed processing Panel */}
                <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #E2E8F0", display: "flex", flexDirection: "column" }}>
                    {!selectedRefund ? (
                        <div style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px", color: "#94A3B8", textAlign: "center" }}>
                            <CreditCard size={48} style={{ marginBottom: "12px" }} />
                            <h3 style={{ color: "#334155", fontWeight: "700", marginBottom: "4px" }}>No Request Selected</h3>
                            <p style={{ fontSize: "0.85rem" }}>Select a refund request from the left panel to review its details and fulfill or reject it.</p>
                        </div>
                    ) : (
                        <div style={{ padding: "30px", display: "flex", flexDirection: "column", gap: "25px" }}>
                            
                            {/* Header details */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #F1F5F9", paddingBottom: "20px" }}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                                        <h2 style={{ fontSize: "1.4rem", fontWeight: "800", color: "#1E293B" }}>Refund Request Details</h2>
                                        {getStatusBadge(selectedRefund.status)}
                                    </div>
                                    <span style={{ fontSize: "0.8rem", color: "#64748B" }}>Reference ID: #{selectedRefund.id}</span>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <span style={{ display: "block", fontSize: "0.8rem", color: "#94A3B8", fontWeight: "600" }}>REFUND AMOUNT</span>
                                    <strong style={{ fontSize: "1.8rem", color: "var(--coral, #F16F68)", fontWeight: "800" }}>₹{selectedRefund.amount}</strong>
                                </div>
                            </div>

                            {/* Section: Customer & Request metadata */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                <div style={{ backgroundColor: "#F8FAFC", padding: "16px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                                    <span style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#64748B", marginBottom: "8px" }}>CUSTOMER PROFILE</span>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                        <span style={{ fontSize: "0.9rem", fontWeight: "700", color: "#1E293B" }}>{selectedRefund.user?.name}</span>
                                        <span style={{ fontSize: "0.8rem", color: "#475569" }}>{selectedRefund.user?.email}</span>
                                        <span style={{ fontSize: "0.8rem", color: "#64748B" }}>Role: {selectedRefund.user?.role}</span>
                                    </div>
                                </div>

                                <div style={{ backgroundColor: "#F8FAFC", padding: "16px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                                    <span style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#64748B", marginBottom: "8px" }}>ASSOCIATED TRANSACTION</span>
                                    {selectedRefund.orderId ? (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                            <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#1E293B" }}>🍔 Food Order</span>
                                            <span style={{ fontSize: "0.8rem", color: "#475569" }}>Order ID: {selectedRefund.orderId}</span>
                                            <span style={{ fontSize: "0.8rem", color: "#64748B" }}>Kitchen: {selectedRefund.order?.seller?.businessName || "Partner Seller"}</span>
                                            <span style={{ fontSize: "0.8rem", color: "#64748B" }}>Payment Paid Status: {selectedRefund.order?.isPaid ? "✅ Paid" : "❌ Unpaid"}</span>
                                        </div>
                                    ) : selectedRefund.bookingId ? (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                            <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#1E293B" }}>🛌 Stay Booking</span>
                                            <span style={{ fontSize: "0.8rem", color: "#475569" }}>Booking ID: {selectedRefund.bookingId}</span>
                                            <span style={{ fontSize: "0.8rem", color: "#64748B" }}>Room: {selectedRefund.booking?.room?.title || "Property Stay"}</span>
                                            <span style={{ fontSize: "0.8rem", color: "#64748B" }}>Booking Status: {selectedRefund.booking?.status}</span>
                                        </div>
                                    ) : (
                                        <span style={{ fontSize: "0.8rem", color: "#94A3B8" }}>General Request</span>
                                    )}
                                </div>
                            </div>

                            {/* Section: Reason */}
                            <div style={{ backgroundColor: "#FFF8F7", border: "1px solid #FEE2E2", padding: "16px", borderRadius: "12px" }}>
                                <span style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#B91C1C", marginBottom: "6px" }}>REASON FOR REFUND REQUEST</span>
                                <p style={{ fontSize: "0.9rem", color: "#475569", lineHeight: "1.4", margin: 0 }}>
                                    {selectedRefund.reason}
                                </p>
                            </div>

                            {/* Fulfill / Action inputs */}
                            {selectedRefund.status === "PENDING" ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "15px", borderTop: "1px solid #F1F5F9", paddingTop: "20px" }}>
                                    <span style={{ fontSize: "0.85rem", fontWeight: "800", color: "#1E293B" }}>🔑 Fulfill Refund Request</span>
                                    
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#64748B", marginBottom: "6px" }}>
                                                TRANSACTION / REFERENCE ID <span style={{ color: "#EF4444" }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. pay_N1J7s82Jskw..."
                                                value={transactionId}
                                                onChange={(e) => setTransactionId(e.target.value)}
                                                style={{
                                                    width: "100%",
                                                    padding: "10px",
                                                    borderRadius: "8px",
                                                    border: "1px solid #CBD5E1",
                                                    fontSize: "0.85rem"
                                                }}
                                            />
                                            <span style={{ fontSize: "0.7rem", color: "#94A3B8", marginTop: "4px", display: "block" }}>Required only for Approval</span>
                                        </div>

                                        <div>
                                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#64748B", marginBottom: "6px" }}>ADMIN NOTE</label>
                                            <input
                                                type="text"
                                                placeholder="Remarks or reject reasons..."
                                                value={adminNote}
                                                onChange={(e) => setAdminNote(e.target.value)}
                                                style={{
                                                    width: "100%",
                                                    padding: "10px",
                                                    borderRadius: "8px",
                                                    border: "1px solid #CBD5E1",
                                                    fontSize: "0.85rem"
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                                        <button
                                            disabled={processing}
                                            onClick={() => handleProcessRefund("REJECTED")}
                                            style={{
                                                flex: 1,
                                                padding: "12px",
                                                borderRadius: "10px",
                                                backgroundColor: "#EF4444",
                                                color: "white",
                                                border: "none",
                                                fontWeight: "700",
                                                cursor: "pointer",
                                                transition: "background 0.2s"
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#DC2626"}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#EF4444"}
                                        >
                                            Reject Request
                                        </button>
                                        <button
                                            disabled={processing}
                                            onClick={() => handleProcessRefund("APPROVED")}
                                            style={{
                                                flex: 2,
                                                padding: "12px",
                                                borderRadius: "10px",
                                                backgroundColor: "#10B981",
                                                color: "white",
                                                border: "none",
                                                fontWeight: "700",
                                                cursor: "pointer",
                                                transition: "background 0.2s"
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#059669"}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#10B981"}
                                        >
                                            {processing ? "Processing..." : "Approve & Mark Refunded"}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: "20px" }}>
                                    <span style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#64748B", marginBottom: "8px" }}>FULFILLMENT REPORT</span>
                                    <div style={{ backgroundColor: "#F1F5F9", padding: "16px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                                        {selectedRefund.transactionId && (
                                            <span style={{ fontSize: "0.85rem", color: "#334155" }}>
                                                <strong>Transaction ID:</strong> {selectedRefund.transactionId}
                                            </span>
                                        )}
                                        {selectedRefund.adminNote && (
                                            <span style={{ fontSize: "0.85rem", color: "#334155" }}>
                                                <strong>Admin Note:</strong> {selectedRefund.adminNote}
                                            </span>
                                        )}
                                        <span style={{ fontSize: "0.8rem", color: "#94A3B8" }}>
                                            Processed on: {new Date(selectedRefund.updatedAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </div>

            </div>
            
        </div>
    );
}
