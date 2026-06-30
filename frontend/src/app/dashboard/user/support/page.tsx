"use client";

import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/fetch-api";
import { MessageSquare, Plus, Clock, CheckCircle2, User, Send, Loader2, RefreshCw } from "lucide-react";

export default function UserSupportPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
    const [loadingTickets, setLoadingTickets] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);
    
    // New Ticket Form State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newCategory, setNewCategory] = useState("FOOD");
    const [newDescription, setNewDescription] = useState("");
    const [submittingTicket, setSubmittingTicket] = useState(false);

    // Chat reply state
    const [replyText, setReplyText] = useState("");
    const [submittingReply, setSubmittingReply] = useState(false);

    // Search, filter, and pagination states
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, categoryFilter]);

    const fetchTickets = async (selectFirst = false) => {
        try {
            setLoadingTickets(true);
            const res = await fetchApi("/api/tickets");
            const data = await res.json();
            if (res.ok) {
                const fetchedTickets = data.data || data;
                setTickets(fetchedTickets);
                if (selectFirst && fetchedTickets.length > 0) {
                    fetchTicketDetails(fetchedTickets[0].id);
                }
            }
        } catch (error) {
            console.error("Failed to load tickets", error);
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

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !newDescription.trim()) return;

        setSubmittingTicket(true);
        try {
            const res = await fetchApi("/api/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: newTitle.trim(),
                    description: newDescription.trim(),
                    category: newCategory
                })
            });
            if (res.ok) {
                setNewTitle("");
                setNewDescription("");
                setIsCreateModalOpen(false);
                await fetchTickets(true); // reload and select the raised ticket
            } else {
                alert("Failed to raise ticket.");
            }
        } catch (error) {
            console.error("Error creating ticket:", error);
        } finally {
            setSubmittingTicket(false);
        }
    };

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
                // Refresh details to show new message
                await fetchTicketDetails(selectedTicket.id);
            }
        } catch (error) {
            console.error("Error sending reply:", error);
        } finally {
            setSubmittingReply(false);
        }
    };

    const filteredTickets = tickets.filter(t => {
        const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
        const matchesCategory = categoryFilter === "ALL" || t.category === categoryFilter;
        return matchesStatus && matchesCategory;
    });

    const totalPages = Math.ceil(filteredTickets.length / pageSize);
    const paginatedTickets = filteredTickets.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "OPEN":
                return <span style={{ backgroundColor: "#DCFCE7", color: "#166534", padding: "4px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "bold" }}>OPEN</span>;
            case "IN_PROGRESS":
                return <span style={{ backgroundColor: "#DBEAFE", color: "#1E40AF", padding: "4px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "bold" }}>IN PROGRESS</span>;
            case "CLOSED":
                return <span style={{ backgroundColor: "#F1F5F9", color: "#475569", padding: "4px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "bold" }}>CLOSED</span>;
            default:
                return status;
        }
    };

    return (
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                <div>
                    <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "#1E293B", marginBottom: "4px" }}>Support & Tickets</h1>
                    <p style={{ color: "#64748B", fontSize: "0.9rem" }}>Raise queries and connect with Cloud Rooms & Kitchen support</p>
                </div>
                <button
                    onClick={() => window.dispatchEvent(new Event("open-chatbot"))}
                    style={{
                        backgroundColor: "var(--coral, #F16F68)",
                        color: "white",
                        padding: "10px 20px",
                        borderRadius: "10px",
                        border: "none",
                        fontWeight: "700",
                        fontSize: "0.9rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        boxShadow: "0 4px 12px rgba(241, 111, 104, 0.2)"
                    }}
                >
                    <Plus size={18} /> Raise Ticket
                </button>
            </div>

            {/* Content Section */}
            <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: "30px", minHeight: "500px" }}>
                
                {/* Left side: Tickets List */}
                <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #E2E8F0", padding: "20px", display: "flex", flexDirection: "column", gap: "15px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F1F5F9", paddingBottom: "12px" }}>
                        <span style={{ fontWeight: "700", color: "#334155", fontSize: "0.95rem" }}>My Tickets</span>
                        <button onClick={handleRefresh} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", display: "flex", alignItems: "center" }}>
                            <RefreshCw size={16} />
                        </button>
                    </div>

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "5px" }}>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "0.8rem", fontWeight: "600", outline: "none", backgroundColor: "#F8FAFC" }}
                        >
                            <option value="ALL">All Status</option>
                            <option value="OPEN">Open</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "0.8rem", fontWeight: "600", outline: "none", backgroundColor: "#F8FAFC" }}
                        >
                            <option value="ALL">All Categories</option>
                            <option value="FOOD">Food</option>
                            <option value="ROOM">Room</option>
                            <option value="PAYMENT">Payment</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>

                    {loadingTickets ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                            <Loader2 className="animate-spin" color="var(--primary)" />
                        </div>
                    ) : tickets.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px 20px", color: "#94A3B8" }}>
                            <MessageSquare size={36} style={{ margin: "0 auto 10px" }} />
                            <p style={{ fontSize: "0.85rem" }}>No tickets raised yet.</p>
                        </div>
                    ) : filteredTickets.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px 20px", color: "#94A3B8" }}>
                            <MessageSquare size={36} style={{ margin: "0 auto 10px" }} />
                            <p style={{ fontSize: "0.85rem" }}>No matching tickets found.</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", maxHeight: "450px" }}>
                                {paginatedTickets.map(t => (
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
                                            {getStatusBadge(t.status)}
                                        </div>
                                        <div style={{ fontWeight: "700", fontSize: "0.9rem", color: "#1E293B", marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {t.title}
                                        </div>
                                        <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                                            Last update: {new Date(t.updatedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Pagination Controls */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #F1F5F9" }}>
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((prev: number) => Math.max(prev - 1, 1))}
                                    style={{
                                        padding: "6px 12px",
                                        borderRadius: "6px",
                                        border: "1px solid #E2E8F0",
                                        backgroundColor: currentPage === 1 ? "#F1F5F9" : "white",
                                        color: currentPage === 1 ? "#94A3B8" : "#475569",
                                        fontSize: "0.75rem",
                                        fontWeight: "700",
                                        cursor: currentPage === 1 ? "not-allowed" : "pointer"
                                    }}
                                >
                                    Prev
                                </button>
                                <span style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: "600" }}>
                                    Page {currentPage} of {Math.max(totalPages, 1)}
                                </span>
                                <button
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    onClick={() => setCurrentPage((prev: number) => Math.min(prev + 1, totalPages))}
                                    style={{
                                        padding: "6px 12px",
                                        borderRadius: "6px",
                                        border: "1px solid #E2E8F0",
                                        backgroundColor: (currentPage === totalPages || totalPages === 0) ? "#F1F5F9" : "white",
                                        color: (currentPage === totalPages || totalPages === 0) ? "#94A3B8" : "#475569",
                                        fontSize: "0.75rem",
                                        fontWeight: "700",
                                        cursor: (currentPage === totalPages || totalPages === 0) ? "not-allowed" : "pointer"
                                    }}
                                >
                                    Next
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Right side: Active Chat Viewer */}
                <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #E2E8F0", display: "flex", flexDirection: "column" }}>
                    {loadingDetails ? (
                        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center" }}>
                            <Loader2 className="animate-spin" color="var(--primary)" size={32} />
                        </div>
                    ) : !selectedTicket ? (
                        <div style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px", color: "#94A3B8", textAlign: "center" }}>
                            <MessageSquare size={48} style={{ marginBottom: "12px" }} />
                            <h3 style={{ color: "#334155", fontWeight: "700", marginBottom: "4px" }}>No Ticket Selected</h3>
                            <p style={{ fontSize: "0.85rem" }}>Select a ticket from the left column to view message thread or reply.</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%" }}>
                            
                            {/* Chat Header */}
                            <div style={{ padding: "20px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                                        <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#1E293B" }}>{selectedTicket.title}</h3>
                                        <span style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: "700" }}>({selectedTicket.category})</span>
                                    </div>
                                    <span style={{ fontSize: "0.8rem", color: "#94A3B8" }}>Ref: #{selectedTicket.id.slice(0, 8)}</span>
                                </div>
                                {getStatusBadge(selectedTicket.status)}
                            </div>

                            {/* Thread Body */}
                            <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "15px", maxHeight: "400px", minHeight: "300px", backgroundColor: "#F8FAFC" }}>
                                {selectedTicket.messages?.map((msg: any) => {
                                    const isAdmin = msg.sender.role === "SUPERADMIN" || msg.sender.role === "ADMIN";
                                    return (
                                        <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignSelf: isAdmin ? "flex-start" : "flex-end", maxWidth: "80%" }}>
                                            <div style={{
                                                padding: "12px 16px",
                                                borderRadius: "14px",
                                                fontSize: "0.85rem",
                                                lineHeight: "1.4",
                                                backgroundColor: isAdmin ? "white" : "#1E293B",
                                                color: isAdmin ? "#334155" : "white",
                                                border: isAdmin ? "1px solid #E2E8F0" : "none",
                                                boxShadow: isAdmin ? "0 2px 6px rgba(0,0,0,0.02)" : "none"
                                            }}>
                                                {msg.message}
                                            </div>
                                            <span style={{ fontSize: "0.65rem", color: "#94A3B8", marginTop: "4px", alignSelf: isAdmin ? "flex-start" : "flex-end", display: "flex", alignItems: "center", gap: "4px" }}>
                                                {isAdmin ? "Admin Reply" : "You"} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Reply Footer */}
                            <div style={{ padding: "20px", borderTop: "1px solid #E2E8F0" }}>
                                {selectedTicket.status === "CLOSED" ? (
                                    <div style={{ textAlign: "center", padding: "10px", backgroundColor: "#F1F5F9", color: "#475569", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "600" }}>
                                        This ticket has been marked resolved and closed.
                                    </div>
                                ) : (
                                    <form onSubmit={handleSendReply} style={{ display: "flex", gap: "10px" }}>
                                        <input
                                            type="text"
                                            placeholder="Type message to support..."
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
                                )}
                            </div>

                        </div>
                    )}
                </div>

            </div>

            {/* Create Ticket Modal Backdrop */}
            {isCreateModalOpen && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "16px", width: "100%", maxWidth: "500px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
                        <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#1E293B", marginBottom: "20px" }}>Raise Support Ticket</h2>
                        
                        <form onSubmit={handleCreateTicket} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>CATEGORY</label>
                                <select
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "0.9rem" }}
                                >
                                    <option value="FOOD">Food / Order Query</option>
                                    <option value="ROOM">Room Stay / Booking Query</option>
                                    <option value="PAYMENT">Payment & Pricing Query</option>
                                    <option value="OTHER">Other Issue</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>TITLE</label>
                                <input
                                    type="text"
                                    placeholder="Enter a brief title for your query"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "0.9rem" }}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>DESCRIPTION</label>
                                <textarea
                                    placeholder="Describe your issue in detail..."
                                    rows={4}
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "0.9rem", resize: "none" }}
                                    required
                                />
                            </div>

                            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    style={{ flex: 1, padding: "12px", border: "1px solid #CBD5E1", backgroundColor: "white", color: "#475569", fontWeight: "700", borderRadius: "8px", cursor: "pointer" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingTicket}
                                    style={{ flex: 1, padding: "12px", border: "none", backgroundColor: "var(--coral, #F16F68)", color: "white", fontWeight: "700", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                                >
                                    {submittingTicket ? <Loader2 className="animate-spin" size={16} /> : "Submit Ticket"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
