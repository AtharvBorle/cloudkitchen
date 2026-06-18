"use client";

import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/fetch-api";
import { MessageSquare, Clock, CheckCircle2, User, Send, Loader2, RefreshCw, AlertCircle, Filter } from "lucide-react";

export default function SuperAdminSupportPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
    const [loadingTickets, setLoadingTickets] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);
    
    // Filter State
    const [statusFilter, setStatusFilter] = useState<string>("ALL");

    // Chat reply state
    const [replyText, setReplyText] = useState("");
    const [submittingReply, setSubmittingReply] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const fetchTickets = async () => {
        try {
            setLoadingTickets(true);
            const res = await fetchApi("/api/tickets");
            const data = await res.json();
            if (res.ok) {
                setTickets(data.data || data);
            }
        } catch (error) {
            console.error("Failed to load tickets for admin", error);
        } finally {
            setLoadingTickets(false);
        }
    };

    const fetchTicketDetails = async (ticketId: string) => {
        try {
            setLoadingDetails(true);
            const res = await fetchApi(`/api/tickets/${ticketId}`);
            const data = await res.json();
            if (res.ok) {
                setSelectedTicket(data.data || data);
            }
        } catch (error) {
            console.error("Failed to load ticket details", error);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleRefresh = async () => {
        await fetchTickets();
        if (selectedTicket) {
            await fetchTicketDetails(selectedTicket.id);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedTicket) return;

        setSubmittingReply(true);
        try {
            const res = await fetchApi(`/api/tickets/${selectedTicket.id}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: replyText.trim() })
            });
            if (res.ok) {
                setReplyText("");
                // Refresh details
                await fetchTicketDetails(selectedTicket.id);
            }
        } catch (error) {
            console.error("Error sending admin reply:", error);
        } finally {
            setSubmittingReply(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!selectedTicket || updatingStatus) return;

        setUpdatingStatus(true);
        try {
            const res = await fetchApi(`/api/tickets/${selectedTicket.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                // Update in local tickets list
                setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: newStatus } : t));
                // Update selected ticket details
                setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
            } else {
                alert("Failed to update status.");
            }
        } catch (error) {
            console.error("Error updating ticket status:", error);
        } finally {
            setUpdatingStatus(false);
        }
    };

    const filteredTickets = tickets.filter(t => {
        if (statusFilter === "ALL") return true;
        return t.status === statusFilter;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case "OPEN": return { bg: "#DCFCE7", text: "#166534" };
            case "IN_PROGRESS": return { bg: "#DBEAFE", text: "#1E40AF" };
            case "CLOSED": return { bg: "#F1F5F9", text: "#475569" };
            default: return { bg: "#E2E8F0", text: "#1E293B" };
        }
    };

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                <div>
                    <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "#1E293B", marginBottom: "4px" }}>Support & Tickets Admin</h1>
                    <p style={{ color: "#64748B", fontSize: "0.9rem" }}>Manage, review, and solve customer and seller support inquiries</p>
                </div>
                <button
                    onClick={handleRefresh}
                    style={{
                        backgroundColor: "#F1F5F9",
                        border: "1px solid #CBD5E1",
                        color: "#475569",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "700",
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                    }}
                >
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            {/* Split Screen Container */}
            <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "30px", minHeight: "550px" }}>
                
                {/* Left side: Filters and Tickets List */}
                <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #E2E8F0", padding: "20px", display: "flex", flexDirection: "column", gap: "15px" }}>
                    
                    {/* Status Filter Tab Group */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#64748B", display: "flex", alignItems: "center", gap: "5px" }}>
                            <Filter size={14} /> FILTER BY STATUS
                        </span>
                        <div style={{ display: "flex", gap: "5px", backgroundColor: "#F1F5F9", padding: "4px", borderRadius: "8px" }}>
                            {["ALL", "OPEN", "IN_PROGRESS", "CLOSED"].map(filter => (
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
                                    {filter.replace("_", " ")}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ borderBottom: "1px solid #F1F5F9", paddingBottom: "4px" }} />

                    {/* Ticket List Body */}
                    {loadingTickets ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                            <Loader2 className="animate-spin" color="var(--primary)" />
                        </div>
                    ) : filteredTickets.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px 20px", color: "#94A3B8" }}>
                            <AlertCircle size={32} style={{ margin: "0 auto 10px" }} />
                            <p style={{ fontSize: "0.85rem" }}>No tickets found matching status.</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", maxHeight: "600px" }}>
                            {filteredTickets.map(t => {
                                const colors = getStatusColor(t.status);
                                return (
                                    <div
                                        key={t.id}
                                        onClick={() => fetchTicketDetails(t.id)}
                                        style={{
                                            padding: "16px",
                                            borderRadius: "12px",
                                            border: `1px solid ${selectedTicket?.id === t.id ? "var(--coral, #F16F68)" : "#E2E8F0"}`,
                                            backgroundColor: selectedTicket?.id === t.id ? "#FFF8F7" : "white",
                                            cursor: "pointer",
                                            transition: "all 0.2s"
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                            <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#94A3B8" }}>{t.category}</span>
                                            <span style={{ backgroundColor: colors.bg, color: colors.text, padding: "4px 8px", borderRadius: "10px", fontSize: "0.7rem", fontWeight: "bold" }}>
                                                {t.status.replace("_", " ")}
                                            </span>
                                        </div>
                                        <div style={{ fontWeight: "700", fontSize: "0.9rem", color: "#1E293B", marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {t.title}
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                                            <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: "600" }}>{t.user?.name} ({t.user?.role})</span>
                                            <span style={{ fontSize: "0.7rem", color: "#94A3B8" }}>{new Date(t.updatedAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right side: Chat & Solving panel */}
                <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #E2E8F0", display: "flex", flexDirection: "column" }}>
                    {loadingDetails ? (
                        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center" }}>
                            <Loader2 className="animate-spin" color="var(--primary)" size={32} />
                        </div>
                    ) : !selectedTicket ? (
                        <div style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px", color: "#94A3B8", textAlign: "center" }}>
                            <MessageSquare size={48} style={{ marginBottom: "12px" }} />
                            <h3 style={{ color: "#334155", fontWeight: "700", marginBottom: "4px" }}>No Ticket Selected</h3>
                            <p style={{ fontSize: "0.85rem" }}>Select a ticket from the left panel to review thread, reply to users, and update solving status.</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%" }}>
                            
                            {/* Header Panel with Action Controls */}
                            <div style={{ padding: "20px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                                        <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#1E293B" }}>{selectedTicket.title}</h3>
                                        <span style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: "700" }}>({selectedTicket.category})</span>
                                    </div>
                                    <div style={{ fontSize: "0.8rem", color: "#64748B", display: "flex", gap: "10px" }}>
                                        <span>Ref: #{selectedTicket.id.slice(0, 8)}</span>
                                        <span>• Raised by: <strong>{selectedTicket.user?.name}</strong> ({selectedTicket.user?.email})</span>
                                    </div>
                                </div>

                                {/* Status Switcher Dropdown */}
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#64748B" }}>TICKET STATUS:</span>
                                    <select
                                        value={selectedTicket.status}
                                        onChange={(e) => handleStatusChange(e.target.value)}
                                        disabled={updatingStatus}
                                        style={{
                                            padding: "6px 12px",
                                            borderRadius: "8px",
                                            border: "1px solid #CBD5E1",
                                            fontSize: "0.8rem",
                                            fontWeight: "700",
                                            backgroundColor: getStatusColor(selectedTicket.status).bg,
                                            color: getStatusColor(selectedTicket.status).text,
                                            cursor: "pointer"
                                        }}
                                    >
                                        <option value="OPEN">OPEN</option>
                                        <option value="IN_PROGRESS">IN PROGRESS</option>
                                        <option value="CLOSED">CLOSED</option>
                                    </select>
                                </div>
                            </div>

                            {/* Conversation Thread */}
                            <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "15px", maxHeight: "400px", minHeight: "300px", backgroundColor: "#F8FAFC" }}>
                                {selectedTicket.messages?.map((msg: any) => {
                                    const isAdmin = msg.sender.role === "SUPERADMIN" || msg.sender.role === "ADMIN";
                                    return (
                                        <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignSelf: isAdmin ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                                            <div style={{
                                                padding: "12px 16px",
                                                borderRadius: "14px",
                                                fontSize: "0.85rem",
                                                lineHeight: "1.4",
                                                backgroundColor: isAdmin ? "#1E293B" : "white",
                                                color: isAdmin ? "white" : "#334155",
                                                border: isAdmin ? "none" : "1px solid #E2E8F0",
                                                boxShadow: isAdmin ? "none" : "0 2px 6px rgba(0,0,0,0.02)"
                                            }}>
                                                {msg.message}
                                            </div>
                                            <span style={{ fontSize: "0.65rem", color: "#94A3B8", marginTop: "4px", alignSelf: isAdmin ? "flex-end" : "flex-start" }}>
                                                {isAdmin ? "You" : `${selectedTicket.user?.name} (${selectedTicket.user?.role})`} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Reply Input Section */}
                            <div style={{ padding: "20px", borderTop: "1px solid #E2E8F0" }}>
                                <form onSubmit={handleSendReply} style={{ display: "flex", gap: "10px" }}>
                                    <input
                                        type="text"
                                        placeholder="Type reply to customer/seller..."
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        style={{
                                            flex: 1,
                                            padding: "12px 16px",
                                            borderRadius: "10px",
                                            border: "1px solid #CBD5E1",
                                            outline: "none",
                                            fontSize: "0.9rem"
                                        }}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={submittingReply || !replyText.trim()}
                                        style={{
                                            backgroundColor: "var(--primary, #10B981)",
                                            color: "white",
                                            border: "none",
                                            padding: "0 20px",
                                            borderRadius: "10px",
                                            cursor: "pointer",
                                            fontWeight: "700",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "6px"
                                        }}
                                    >
                                        {submittingReply ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                                    </button>
                                </form>
                            </div>

                        </div>
                    )}
                </div>

            </div>

        </div>
    );
}
