"use client";

import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/fetch-api";
import { MessageSquare, Clock, CheckCircle2, User, Send, Loader2, RefreshCw, AlertCircle, Filter } from "lucide-react";

export default function SupportTicketsPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
    const [loadingTickets, setLoadingTickets] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);
    

    const [replyText, setReplyText] = useState("");
    const [submittingReply, setSubmittingReply] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // User Activity for refunding
    const [userActivity, setUserActivity] = useState<any | null>(null);
    const [loadingActivity, setLoadingActivity] = useState(false);
    const [targetRefund, setTargetRefund] = useState<{ type: 'ORDER' | 'BOOKING'; id: string; amount: number } | null>(null);
    const [refundReason, setRefundReason] = useState("");
    const [submittingRefund, setSubmittingRefund] = useState(false);

    // Order Action States (Cancellation)
    const [actionOrderId, setActionOrderId] = useState("");
    const [actionOrder, setActionOrder] = useState<any | null>(null);
    const [loadingActionOrder, setLoadingActionOrder] = useState(false);
    const [cancellingOrder, setCancellingOrder] = useState(false);

    // Search, filter, and pagination states
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, categoryFilter]);

    const handleSearchActionOrder = async (orderIdToSearch?: string) => {
        const idToSearch = orderIdToSearch || actionOrderId;
        if (!idToSearch.trim()) return;
        setLoadingActionOrder(true);
        setActionOrder(null);
        try {
            const res = await fetchApi(`/api/user/orders/${idToSearch.trim()}`);
            if (res.ok) {
                const data = await res.json();
                setActionOrder(data.data || data);
            } else {
                alert("Order not found or invalid Order ID.");
            }
        } catch (error) {
            console.error("Error searching action order:", error);
            alert("Error fetching order details.");
        } finally {
            setLoadingActionOrder(false);
        }
    };

    const handleCancelActionOrder = async () => {
        if (!actionOrder) return;
        if (actionOrder.status !== "PENDING") {
            alert("Only pending orders can be cancelled.");
            return;
        }
        if (!window.confirm(`Are you sure you want to cancel order #${actionOrder.id.slice(0, 8)}?`)) {
            return;
        }

        setCancellingOrder(true);
        try {
            const res = await fetchApi(`/api/user/orders/${actionOrder.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" }
            });
            if (res.ok) {
                alert("Order cancelled successfully.");
                // Re-fetch order details
                await handleSearchActionOrder(actionOrder.id);
                // Also update userActivity in case it was showing in the refund panel
                if (selectedTicket?.userId) {
                    fetchUserActivity(selectedTicket.userId);
                }
            } else {
                const err = await res.json();
                alert(err.message || "Failed to cancel order.");
            }
        } catch (error) {
            console.error("Cancel order error:", error);
            alert("An error occurred while cancelling the order.");
        } finally {
            setCancellingOrder(false);
        }
    };

    useEffect(() => {
        if (selectedTicket) {
            setActionOrder(null);
            setActionOrderId("");
            
            // Search for potential 8-character hex order IDs in title and description
            const textToSearch = `${selectedTicket.title} ${selectedTicket.description}`;
            const potentialIds = textToSearch.match(/\b[0-9a-fA-F]{8}\b/g);
            const ticketIdFirstPart = selectedTicket.id.split('-')[0];
            
            if (potentialIds) {
                const validId = potentialIds.find(id => id.toLowerCase() !== ticketIdFirstPart.toLowerCase());
                if (validId) {
                    setActionOrderId(validId);
                    const autoFetch = async () => {
                        setLoadingActionOrder(true);
                        try {
                            const res = await fetchApi(`/api/user/orders/${validId.trim()}`);
                            if (res.ok) {
                                const data = await res.json();
                                setActionOrder(data.data || data);
                            }
                        } catch (error) {
                            console.error("Error auto-searching action order:", error);
                        } finally {
                            setLoadingActionOrder(false);
                        }
                    };
                    autoFetch();
                }
            }
        }
    }, [selectedTicket]);

    // Raise Ticket Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [systemUsers, setSystemUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Form states
    const [newTicketUserId, setNewTicketUserId] = useState("");
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [showUserSuggestions, setShowUserSuggestions] = useState(false);

    // Modal activity states
    const [modalUserActivity, setModalUserActivity] = useState<any | null>(null);
    const [loadingModalActivity, setLoadingModalActivity] = useState(false);

    // Order lookup states
    const [enteredOrderId, setEnteredOrderId] = useState("");
    const [retrievedOrder, setRetrievedOrder] = useState<any | null>(null);
    const [loadingRetrievedOrder, setLoadingRetrievedOrder] = useState(false);

    const [newTicketTitle, setNewTicketTitle] = useState("");
    const [newTicketDescription, setNewTicketDescription] = useState("");
    const [newTicketCategory, setNewTicketCategory] = useState("FOOD");
    const [submittingNewTicket, setSubmittingNewTicket] = useState(false);

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

    const fetchUserActivity = async (userId: string) => {
        setLoadingActivity(true);
        try {
            const res = await fetchApi(`/api/superadmin/users/${userId}/activity`);
            if (res.ok) {
                const data = await res.json();
                setUserActivity(data.data || data);
            }
        } catch (error) {
            console.error("Error fetching user activity:", error);
        } finally {
            setLoadingActivity(false);
        }
    };

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const res = await fetchApi("/api/superadmin/users");
            if (res.ok) {
                const data = await res.json();
                setSystemUsers(data.data || data);
            }
        } catch (error) {
            console.error("Error fetching system users:", error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchUserActivityForModal = async (userId: string) => {
        setLoadingModalActivity(true);
        try {
            const res = await fetchApi(`/api/superadmin/users/${userId}/activity`);
            if (res.ok) {
                const data = await res.json();
                setModalUserActivity(data.data || data);
            }
        } catch (error) {
            console.error("Error fetching modal user activity:", error);
        } finally {
            setLoadingModalActivity(false);
        }
    };

    const retrieveOrderDetails = async (orderId: string) => {
        if (!orderId.trim()) return;
        setLoadingRetrievedOrder(true);
        setRetrievedOrder(null);
        try {
            const res = await fetchApi(`/api/user/orders/${orderId.trim()}`);
            if (res.ok) {
                const data = await res.json();
                setRetrievedOrder(data.data || data);
            } else {
                alert("Order not found or invalid Order ID.");
            }
        } catch (error) {
            console.error("Error retrieving order:", error);
            alert("Error fetching order details.");
        } finally {
            setLoadingRetrievedOrder(false);
        }
    };

    const handleRaiseTicketSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTicketUserId || !newTicketTitle.trim() || !newTicketDescription.trim() || !newTicketCategory) {
            alert("Please fill in all fields.");
            return;
        }

        setSubmittingNewTicket(true);
        try {
            let finalDescription = newTicketDescription.trim();
            if (retrievedOrder) {
                finalDescription += `\n\n--- Associated Order Details ---\nOrder ID: ${retrievedOrder.id}\nKitchen: ${retrievedOrder.seller?.businessName || "Unknown"}\nTotal Amount: ₹${retrievedOrder.totalAmount}\nStatus: ${retrievedOrder.status}\nPaid: ${retrievedOrder.isPaid ? "YES" : "NO"}`;
            } else if (enteredOrderId && newTicketCategory === 'ROOM') {
                const matchedBooking = modalUserActivity?.bookings?.find((b: any) => b.id === enteredOrderId);
                if (matchedBooking) {
                    const start = new Date(matchedBooking.startDate).toLocaleDateString();
                    const end = new Date(matchedBooking.endDate).toLocaleDateString();
                    finalDescription += `\n\n--- Associated Booking Details ---\nBooking ID: ${matchedBooking.id}\nRoom: ${matchedBooking.room?.title || "Stay"}\nDates: ${start} to ${end}\nStatus: ${matchedBooking.status}`;
                } else {
                    finalDescription += `\n\n--- Associated Booking ID ---\nBooking ID: ${enteredOrderId}`;
                }
            } else if (enteredOrderId) {
                finalDescription += `\n\n--- Associated ID ---\nID: ${enteredOrderId}`;
            }

            const res = await fetchApi("/api/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: newTicketUserId,
                    title: newTicketTitle.trim(),
                    description: finalDescription,
                    category: newTicketCategory
                })
            });

            if (res.ok) {
                alert("Ticket successfully raised!");
                setShowCreateModal(false);
                // Reset form fields
                setNewTicketUserId("");
                setSelectedUser(null);
                setUserSearchQuery("");
                setModalUserActivity(null);
                setEnteredOrderId("");
                setRetrievedOrder(null);
                setNewTicketTitle("");
                setNewTicketDescription("");
                setNewTicketCategory("FOOD");
                // Refresh ticket list
                fetchTickets();
            } else {
                const err = await res.json();
                alert(err.message || "Failed to raise ticket.");
            }
        } catch (error) {
            console.error("Raise ticket error:", error);
            alert("An error occurred. Please try again.");
        } finally {
            setSubmittingNewTicket(false);
        }
    };

    const fetchTicketDetails = async (ticketId: string) => {
        try {
            setLoadingDetails(true);
            const res = await fetchApi(`/api/tickets/${ticketId}`);
            const data = await res.json();
            if (res.ok) {
                const ticketData = data.data || data;
                setSelectedTicket(ticketData);
                if (ticketData.userId) {
                    fetchUserActivity(ticketData.userId);
                }
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
                setSelectedTicket((prev: any) => prev ? { ...prev, status: newStatus } : null);
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
        const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
        const matchesCategory = categoryFilter === "ALL" || t.category === categoryFilter;
        
        const searchLower = searchQuery.toLowerCase().trim();
        const matchesSearch = !searchLower || 
            (t.title && t.title.toLowerCase().includes(searchLower)) ||
            (t.category && t.category.toLowerCase().includes(searchLower)) ||
            (t.description && t.description.toLowerCase().includes(searchLower)) ||
            (t.user?.name && t.user.name.toLowerCase().includes(searchLower)) ||
            (t.user?.email && t.user.email.toLowerCase().includes(searchLower)) ||
            (t.id && t.id.toLowerCase().includes(searchLower));

        return matchesStatus && matchesCategory && matchesSearch;
    });

    const totalPages = Math.ceil(filteredTickets.length / pageSize);
    const paginatedTickets = filteredTickets.slice((currentPage - 1) * pageSize, currentPage * pageSize);


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
                <div style={{ display: "flex", gap: "10px" }}>
                    <button
                        onClick={() => {
                            setShowCreateModal(true);
                            fetchUsers();
                        }}
                        style={{
                            backgroundColor: "var(--primary, #10B981)",
                            color: "white",
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: "700",
                            fontSize: "0.85rem",
                            display: "flex",
                            alignItems: "center",
                            boxShadow: "0 4px 10px rgba(16, 185, 129, 0.2)"
                        }}
                    >
                        Raise Ticket
                    </button>
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
            </div>

            {/* Split Screen Container */}
            <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "30px", minHeight: "550px" }}>
                
                {/* Left side: Filters and Tickets List */}
                <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #E2E8F0", padding: "20px", display: "flex", flexDirection: "column", gap: "15px" }}>
                    
                    {/* Search Input */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#64748B" }}>
                            SEARCH TICKETS
                        </span>
                        <input
                            type="text"
                            placeholder="Search by title, user, email or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px 12px",
                                borderRadius: "8px",
                                border: "1px solid #CBD5E1",
                                fontSize: "0.85rem",
                                outline: "none",
                                backgroundColor: "#F8FAFC"
                            }}
                        />
                    </div>

                    {/* Category Filter */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#64748B" }}>
                            FILTER BY CATEGORY
                        </span>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px 12px",
                                borderRadius: "8px",
                                border: "1px solid #CBD5E1",
                                fontSize: "0.85rem",
                                fontWeight: "600",
                                outline: "none",
                                backgroundColor: "#F8FAFC",
                                color: "#1E293B"
                            }}
                        >
                            <option value="ALL">All Categories</option>
                            <option value="FOOD">Food</option>
                            <option value="ROOM">Room</option>
                            <option value="PAYMENT">Payment</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>

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
                            <p style={{ fontSize: "0.85rem" }}>No matching tickets found.</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", maxHeight: "400px" }}>
                                {paginatedTickets.map(t => {
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

                            {/* Split Layout: Chat on Left, User activity & refunds on Right */}
                            <div style={{ display: "flex", flex: 1, minHeight: "450px" }}>
                                {/* Left Side: Conversation Thread */}
                                <div style={{ display: "flex", flexDirection: "column", flex: 1, borderRight: "1px solid #E2E8F0" }}>
                                    <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "15px", maxHeight: "400px", minHeight: "300px", backgroundColor: "#F8FAFC" }}>
                                        {selectedTicket.messages?.map((msg: any) => {
                                            const isAdmin = msg.sender.role === "SUPERADMIN" || msg.sender.role === "ADMIN" || msg.sender.role === "SUPPORT";
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

                                {/* Right Side: User Activities & Refund Trigger */}
                                <div style={{ width: "320px", backgroundColor: "#F8FAFC", display: "flex", flexDirection: "column", padding: "15px", overflowY: "auto", maxHeight: "550px", borderBottomRightRadius: "16px" }}>
                                    <h4 style={{ fontSize: "0.75rem", fontWeight: "800", color: "#475569", marginBottom: "12px", borderBottom: "2px solid #E2E8F0", paddingBottom: "5px", letterSpacing: "0.05em" }}>
                                        ORDER & REFUND PANEL
                                    </h4>

                                    {/* Order Cancellation Control Section */}
                                    <div style={{ marginBottom: "20px", borderBottom: "1px dashed #E2E8F0", paddingBottom: "15px" }}>
                                        <h5 style={{ fontSize: "0.75rem", fontWeight: "700", color: "#1E293B", marginBottom: "8px" }}>
                                            Order Cancel Control
                                        </h5>
                                        <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
                                            <input
                                                type="text"
                                                placeholder="Search Order ID..."
                                                value={actionOrderId}
                                                onChange={(e) => setActionOrderId(e.target.value)}
                                                style={{
                                                    flex: 1,
                                                    padding: "8px 10px",
                                                    borderRadius: "6px",
                                                    border: "1px solid #CBD5E1",
                                                    fontSize: "0.8rem",
                                                    outline: "none"
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleSearchActionOrder()}
                                                disabled={loadingActionOrder || !actionOrderId.trim()}
                                                style={{
                                                    backgroundColor: "#1E293B",
                                                    color: "white",
                                                    border: "none",
                                                    padding: "0 12px",
                                                    borderRadius: "6px",
                                                    cursor: "pointer",
                                                    fontWeight: "600",
                                                    fontSize: "0.75rem",
                                                    opacity: (!actionOrderId.trim()) ? 0.6 : 1
                                                }}
                                            >
                                                {loadingActionOrder ? "..." : "Search"}
                                            </button>
                                        </div>

                                        {actionOrder && (
                                            <div style={{ backgroundColor: "white", padding: "10px", borderRadius: "8px", border: "1px solid #E2E8F0", fontSize: "0.75rem" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "700", marginBottom: "4px" }}>
                                                    <span>Order #{actionOrder.id.slice(0, 8)}</span>
                                                    <span style={{ color: "#F16F68" }}>₹{actionOrder.totalAmount}</span>
                                                </div>
                                                <div style={{ color: "#475569", marginBottom: "8px", lineHeight: "1.4" }}>
                                                    <strong>Kitchen:</strong> {actionOrder.seller?.businessName || "Unknown"}<br/>
                                                    <strong>Customer:</strong> {actionOrder.user?.name || "Unknown"}<br/>
                                                    <strong>Status:</strong> <span style={{ 
                                                        fontWeight: "700",
                                                        color: actionOrder.status === 'PENDING' ? '#B45309' : actionOrder.status === 'CANCELLED' ? '#991B1B' : '#1E40AF'
                                                    }}>{actionOrder.status}</span>
                                                </div>

                                                {actionOrder.status === "PENDING" ? (
                                                    <button
                                                        type="button"
                                                        onClick={handleCancelActionOrder}
                                                        disabled={cancellingOrder}
                                                        style={{
                                                            width: "100%",
                                                            padding: "8px",
                                                            backgroundColor: "#EF4444",
                                                            color: "white",
                                                            border: "none",
                                                            borderRadius: "6px",
                                                            fontWeight: "700",
                                                            cursor: "pointer",
                                                            fontSize: "0.75rem",
                                                            transition: "background 0.2s"
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EF4444'}
                                                    >
                                                        {cancellingOrder ? "Cancelling..." : "Cancel Order"}
                                                    </button>
                                                ) : (
                                                    <div style={{ 
                                                        textAlign: "center", 
                                                        padding: "6px", 
                                                        backgroundColor: "#F1F5F9", 
                                                        color: "#64748B", 
                                                        borderRadius: "4px",
                                                        fontSize: "0.7rem",
                                                        fontWeight: "600"
                                                    }}>
                                                        {actionOrder.status === "CANCELLED" ? "Already Cancelled" : "Cannot cancel (Preparing/Delivered)"}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <h4 style={{ fontSize: "0.75rem", fontWeight: "800", color: "#475569", marginBottom: "12px", borderBottom: "2px solid #E2E8F0", paddingBottom: "5px", letterSpacing: "0.05em", marginTop: "10px" }}>
                                        REFUND CONTROL PANEL
                                    </h4>

                                    {loadingActivity ? (
                                        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", padding: "30px" }}>
                                            <Loader2 className="animate-spin" color="var(--primary)" size={20} />
                                        </div>
                                    ) : !userActivity ? (
                                        <p style={{ fontSize: "0.75rem", color: "#64748B" }}>No user activity retrieved.</p>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                                            
                                            {/* Paid Food Orders */}
                                            <div>
                                                <h5 style={{ fontSize: "0.75rem", fontWeight: "700", color: "#1E293B", marginBottom: "8px" }}>
                                                    Paid Food Orders ({userActivity.orders?.filter((o: any) => o.isPaid).length || 0})
                                                </h5>
                                                {userActivity.orders?.filter((o: any) => o.isPaid).length === 0 ? (
                                                    <p style={{ fontSize: "0.7rem", color: "#94A3B8", fontStyle: "italic" }}>No paid food orders.</p>
                                                ) : (
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                                        {userActivity.orders?.filter((o: any) => o.isPaid).map((order: any) => (
                                                            <div key={order.id} style={{ backgroundColor: "white", padding: "8px", borderRadius: "6px", border: "1px solid #E2E8F0", fontSize: "0.75rem" }}>
                                                                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "700", marginBottom: "2px" }}>
                                                                    <span>Order #{order.id.slice(0, 8)}</span>
                                                                    <span style={{ color: "var(--primary)" }}>₹{order.totalAmount}</span>
                                                                </div>
                                                                <div style={{ fontSize: "0.7rem", color: "#64748B", marginBottom: "6px" }}>
                                                                    Kitchen: {order.seller?.businessName || "Unknown"}<br/>
                                                                    Status: {order.status}
                                                                </div>
                                                                {order.refund ? (
                                                                    <div style={{
                                                                        fontSize: "0.7rem",
                                                                        fontWeight: "700",
                                                                        padding: "3px 6px",
                                                                        borderRadius: "4px",
                                                                        backgroundColor: order.refund.status === 'APPROVED' ? '#D1FAE5' : order.refund.status === 'REJECTED' ? '#FEE2E2' : '#FEF3C7',
                                                                        color: order.refund.status === 'APPROVED' ? '#065F46' : order.refund.status === 'REJECTED' ? '#991B1B' : '#92400E',
                                                                        textAlign: "center"
                                                                    }}>
                                                                        Refund: {order.refund.status}
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => {
                                                                            setTargetRefund({ type: 'ORDER', id: order.id, amount: order.totalAmount });
                                                                            setRefundReason("");
                                                                        }}
                                                                        style={{
                                                                            width: "100%",
                                                                            padding: "5px",
                                                                            backgroundColor: "var(--coral, #F16F68)",
                                                                            color: "white",
                                                                            border: "none",
                                                                            borderRadius: "4px",
                                                                            fontWeight: "700",
                                                                            cursor: "pointer",
                                                                            fontSize: "0.7rem"
                                                                        }}
                                                                    >
                                                                        Initiate Refund Request
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Confirmed Stay Bookings */}
                                            <div>
                                                <h5 style={{ fontSize: "0.75rem", fontWeight: "700", color: "#1E293B", marginBottom: "8px" }}>
                                                    Confirmed Room Bookings ({userActivity.bookings?.filter((b: any) => b.status === 'CONFIRMED').length || 0})
                                                </h5>
                                                {userActivity.bookings?.filter((b: any) => b.status === 'CONFIRMED').length === 0 ? (
                                                    <p style={{ fontSize: "0.7rem", color: "#94A3B8", fontStyle: "italic" }}>No confirmed bookings.</p>
                                                ) : (
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                                        {userActivity.bookings?.filter((b: any) => b.status === 'CONFIRMED').map((booking: any) => {
                                                            const start = new Date(booking.startDate);
                                                            const end = new Date(booking.endDate);
                                                            const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                                                            const bookingAmount = nights * booking.room.price;

                                                            return (
                                                                <div key={booking.id} style={{ backgroundColor: "white", padding: "8px", borderRadius: "6px", border: "1px solid #E2E8F0", fontSize: "0.75rem" }}>
                                                                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "700", marginBottom: "2px" }}>
                                                                        <span style={{ maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{booking.room.title}</span>
                                                                        <span style={{ color: "var(--primary)" }}>₹{bookingAmount}</span>
                                                                    </div>
                                                                    <div style={{ fontSize: "0.7rem", color: "#64748B", marginBottom: "6px" }}>
                                                                        Nights: {nights} ({start.toLocaleDateString()} - {end.toLocaleDateString()})
                                                                    </div>
                                                                    {booking.refund ? (
                                                                        <div style={{
                                                                            fontSize: "0.7rem",
                                                                            fontWeight: "700",
                                                                            padding: "3px 6px",
                                                                            borderRadius: "4px",
                                                                            backgroundColor: booking.refund.status === 'APPROVED' ? '#D1FAE5' : booking.refund.status === 'REJECTED' ? '#FEE2E2' : '#FEF3C7',
                                                                            color: booking.refund.status === 'APPROVED' ? '#065F46' : booking.refund.status === 'REJECTED' ? '#991B1B' : '#92400E',
                                                                            textAlign: "center"
                                                                        }}>
                                                                            Refund: {booking.refund.status}
                                                                        </div>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => {
                                                                                setTargetRefund({ type: 'BOOKING', id: booking.id, amount: bookingAmount });
                                                                                setRefundReason("");
                                                                            }}
                                                                            style={{
                                                                                width: "100%",
                                                                                padding: "5px",
                                                                                backgroundColor: "var(--coral, #F16F68)",
                                                                                color: "white",
                                                                                border: "none",
                                                                                borderRadius: "4px",
                                                                                fontWeight: "700",
                                                                                cursor: "pointer",
                                                                                fontSize: "0.7rem"
                                                                            }}
                                                                        >
                                                                            Initiate Refund Request
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    )}
                </div>

            </div>

            {/* Admin Refund Trigger Modal */}
            {targetRefund && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    backdropFilter: 'blur(5px)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 99999,
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '20px',
                        width: '100%',
                        maxWidth: '500px',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{
                            padding: '20px 25px',
                            borderBottom: '1px solid #F1F5F9',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1E293B', margin: 0 }}>
                                Create Refund Request
                            </h3>
                            <button
                                onClick={() => setTargetRefund(null)}
                                style={{
                                    border: 'none',
                                    background: 'none',
                                    fontSize: '1.5rem',
                                    fontWeight: 'bold',
                                    color: '#64748B',
                                    cursor: 'pointer'
                                }}
                            >
                                &times;
                            </button>
                        </div>

                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                if (!targetRefund || !refundReason.trim() || !selectedTicket) return;

                                setSubmittingRefund(true);
                                try {
                                    const bodyData: any = {
                                        reason: `[Ticket Ref: #${selectedTicket.id}] ${refundReason.trim()}`,
                                        amount: targetRefund.amount
                                    };
                                    if (targetRefund.type === 'ORDER') {
                                        bodyData.orderId = targetRefund.id;
                                    } else {
                                        bodyData.bookingId = targetRefund.id;
                                    }

                                    const res = await fetchApi("/api/refunds", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify(bodyData)
                                    });

                                    if (res.ok) {
                                        alert("Refund request successfully created! It will show up in the Refunds section.");
                                        setTargetRefund(null);
                                        setRefundReason("");
                                        if (selectedTicket.userId) {
                                            fetchUserActivity(selectedTicket.userId);
                                        }
                                    } else {
                                        const err = await res.json();
                                        alert(err.message || "Failed to create refund request.");
                                    }
                                } catch (error) {
                                    console.error("Initiate refund error:", error);
                                    alert("An error occurred. Please try again.");
                                } finally {
                                    setSubmittingRefund(false);
                                }
                            }}
                            style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}
                        >
                            <div style={{ backgroundColor: "#FFF8F7", padding: "12px 15px", borderRadius: "8px", border: "1px solid #FEE2E2" }}>
                                <span style={{ display: "block", fontSize: "0.8rem", color: "#64748B", fontWeight: "600" }}>REFUNDABLE AMOUNT</span>
                                <strong style={{ fontSize: "1.4rem", color: "var(--coral, #F16F68)" }}>₹{targetRefund.amount}</strong>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontWeight: '700', fontSize: '0.95rem', color: '#334155' }}>
                                    Reason for Refund (Internal Note)
                                </label>
                                <textarea
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    placeholder="Provide context on why this refund is being requested (from customer ticket details)..."
                                    required
                                    style={{
                                        width: '100%',
                                        minHeight: '100px',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #CBD5E1',
                                        fontSize: '0.9rem',
                                        fontFamily: 'inherit',
                                        resize: 'vertical',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                borderTop: '1px solid #F1F5F9',
                                paddingTop: '20px'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => setTargetRefund(null)}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        backgroundColor: 'white',
                                        border: '1px solid #CBD5E1',
                                        borderRadius: '10px',
                                        fontWeight: '600',
                                        color: '#475569',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingRefund || !refundReason.trim()}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        backgroundColor: 'var(--coral, #F16F68)',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontWeight: '700',
                                        color: 'white',
                                        cursor: 'pointer',
                                        opacity: submittingRefund ? 0.7 : 1
                                    }}
                                >
                                    {submittingRefund ? "Creating..." : "Confirm & Send"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Raise Ticket Modal */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    backdropFilter: 'blur(5px)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 99999,
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '20px',
                        width: '100%',
                        maxWidth: '550px',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        flexDirection: 'column',
                        maxHeight: '90vh',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            padding: '20px 25px',
                            borderBottom: '1px solid #F1F5F9',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1E293B', margin: 0 }}>
                                Raise Support Ticket
                            </h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                style={{
                                    border: 'none',
                                    background: 'none',
                                    fontSize: '1.5rem',
                                    fontWeight: 'bold',
                                    color: '#64748B',
                                    cursor: 'pointer'
                                }}
                            >
                                &times;
                            </button>
                        </div>

                        <form
                            onSubmit={handleRaiseTicketSubmit}
                            style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto' }}
                        >
                            {/* 1. Select User */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', flexShrink: 0 }}>
                                <label style={{ fontWeight: '700', fontSize: '0.9rem', color: '#334155' }}>
                                    Select User / Customer / Seller
                                </label>
                                {loadingUsers ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#64748B' }}>
                                        <Loader2 className="animate-spin" size={16} /> Loading users...
                                    </div>
                                ) : (
                                    <>
                                        <input
                                            type="text"
                                            placeholder="Type to search user (name, email, role)..."
                                            value={userSearchQuery}
                                            onChange={(e) => {
                                                setUserSearchQuery(e.target.value);
                                                setShowUserSuggestions(true);
                                                if (selectedUser) {
                                                    setSelectedUser(null);
                                                    setNewTicketUserId("");
                                                    setModalUserActivity(null);
                                                    setEnteredOrderId("");
                                                    setRetrievedOrder(null);
                                                }
                                            }}
                                            onFocus={() => setShowUserSuggestions(true)}
                                            style={{
                                                padding: '10px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid #CBD5E1',
                                                fontSize: '0.9rem',
                                                outline: 'none',
                                                width: '100%'
                                            }}
                                        />

                                        {showUserSuggestions && userSearchQuery && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: 0,
                                                right: 0,
                                                backgroundColor: 'white',
                                                border: '1px solid #E2E8F0',
                                                borderRadius: '8px',
                                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                                maxHeight: '180px',
                                                overflowY: 'auto',
                                                zIndex: 10,
                                                marginTop: '4px'
                                            }}>
                                                {systemUsers.filter(u => 
                                                    u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                                                    u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                                                    u.role.toLowerCase().includes(userSearchQuery.toLowerCase())
                                                ).length === 0 ? (
                                                    <div style={{ padding: '10px', fontSize: '0.85rem', color: '#64748B', textAlign: 'center' }}>
                                                        No users found
                                                    </div>
                                                ) : (
                                                    systemUsers.filter(u => 
                                                        u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                                                        u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                                                        u.role.toLowerCase().includes(userSearchQuery.toLowerCase())
                                                    ).map((u: any) => (
                                                        <div
                                                            key={u.id}
                                                            onClick={() => {
                                                                setSelectedUser(u);
                                                                setNewTicketUserId(u.id);
                                                                setUserSearchQuery(`${u.name} (${u.email}) - ${u.role}`);
                                                                setShowUserSuggestions(false);
                                                                fetchUserActivityForModal(u.id);
                                                            }}
                                                            style={{
                                                                padding: '10px 12px',
                                                                fontSize: '0.85rem',
                                                                color: '#334155',
                                                                cursor: 'pointer',
                                                                borderBottom: '1px solid #F1F5F9',
                                                                transition: 'background 0.15s'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        >
                                                            <strong>{u.name}</strong> <span style={{ color: '#64748B' }}>({u.email})</span> • <span style={{ textTransform: 'lowercase', fontSize: '0.75rem', backgroundColor: '#E2E8F0', padding: '2px 6px', borderRadius: '4px' }}>{u.role}</span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* 2. Category Selection */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                                <label style={{ fontWeight: '700', fontSize: '0.9rem', color: '#334155' }}>
                                    Category
                                </label>
                                <select
                                    value={newTicketCategory}
                                    onChange={(e) => {
                                        setNewTicketCategory(e.target.value);
                                        setEnteredOrderId("");
                                        setRetrievedOrder(null);
                                    }}
                                    required
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid #CBD5E1',
                                        fontSize: '0.9rem',
                                        outline: 'none',
                                        backgroundColor: 'white'
                                    }}
                                >
                                    <option value="FOOD">FOOD</option>
                                    <option value="ROOM">ROOM</option>
                                    <option value="PAYMENT">PAYMENT</option>
                                    <option value="REFUND">REFUND</option>
                                    <option value="OTHER">OTHER</option>
                                </select>
                            </div>

                            {/* 3. Recent Activity (Filtered by Category!) */}
                            {selectedUser && (
                                <div style={{
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '12px',
                                    padding: '15px',
                                    backgroundColor: '#F8FAFC',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    flexShrink: 0
                                }}>
                                    <h4 style={{ fontSize: '0.75rem', fontWeight: '800', color: '#475569', margin: 0, borderBottom: '1px solid #E2E8F0', paddingBottom: '4px' }}>
                                        {newTicketCategory === 'ROOM' ? 'RECENT STAY BOOKINGS' : newTicketCategory === 'FOOD' || newTicketCategory === 'REFUND' ? 'RECENT FOOD ORDERS' : 'RECENT USER ACTIVITY'}
                                    </h4>

                                    {loadingModalActivity ? (
                                        <div style={{ display: 'flex', justifyContent: 'center', padding: '15px' }}>
                                            <Loader2 className="animate-spin" size={18} color="var(--primary)" />
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {/* Recent Orders - Visible for non-ROOM categories */}
                                            {newTicketCategory !== 'ROOM' && (
                                                <div>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#1E293B', marginBottom: '6px' }}>
                                                        Recent Orders (Select to fill Order ID)
                                                    </div>
                                                    {(!modalUserActivity || !modalUserActivity.orders || modalUserActivity.orders.length === 0) ? (
                                                        <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontStyle: 'italic' }}>No orders found.</span>
                                                    ) : (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            {modalUserActivity.orders.slice(0, 5).map((ord: any) => (
                                                                <div
                                                                    key={ord.id}
                                                                    onClick={() => {
                                                                        setEnteredOrderId(ord.id);
                                                                        retrieveOrderDetails(ord.id);
                                                                    }}
                                                                    style={{
                                                                        backgroundColor: 'white',
                                                                        padding: '8px',
                                                                        borderRadius: '6px',
                                                                        border: enteredOrderId === ord.id ? '2px solid var(--primary, #10B981)' : '1px solid #E2E8F0',
                                                                        cursor: 'pointer',
                                                                        fontSize: '0.75rem',
                                                                        display: 'flex',
                                                                        justifyContent: 'space-between',
                                                                        alignItems: 'center'
                                                                    }}
                                                                >
                                                                    <div>
                                                                        <span style={{ fontWeight: '700' }}>#{ord.id.slice(0, 8)}</span>
                                                                        <div style={{ fontSize: '0.65rem', color: '#64748B' }}>
                                                                            {ord.seller?.businessName || "Kitchen"} • {ord.status}
                                                                        </div>
                                                                    </div>
                                                                    <strong style={{ color: '#10B981' }}>₹{ord.totalAmount}</strong>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Recent Bookings - Visible for ROOM, PAYMENT, OTHER categories */}
                                            {(newTicketCategory === 'ROOM' || newTicketCategory === 'PAYMENT' || newTicketCategory === 'OTHER') && (
                                                <div>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#1E293B', marginBottom: '6px' }}>
                                                        Room Bookings (Select to fill Booking ID)
                                                    </div>
                                                    {(!modalUserActivity || !modalUserActivity.bookings || modalUserActivity.bookings.length === 0) ? (
                                                        <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontStyle: 'italic' }}>No bookings found.</span>
                                                    ) : (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            {modalUserActivity.bookings.slice(0, 5).map((bk: any) => {
                                                                const start = new Date(bk.startDate);
                                                                const end = new Date(bk.endDate);
                                                                const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                                                                const amount = nights * bk.room.price;
                                                                return (
                                                                    <div
                                                                        key={bk.id}
                                                                        onClick={() => {
                                                                            setEnteredOrderId(bk.id);
                                                                        }}
                                                                        style={{
                                                                            backgroundColor: 'white',
                                                                            padding: '8px',
                                                                            borderRadius: '6px',
                                                                            border: enteredOrderId === bk.id ? '2px solid var(--primary, #10B981)' : '1px solid #E2E8F0',
                                                                            cursor: 'pointer',
                                                                            fontSize: '0.75rem',
                                                                            display: 'flex',
                                                                            justifyContent: 'space-between',
                                                                            alignItems: 'center'
                                                                        }}
                                                                    >
                                                                        <div>
                                                                            <span style={{ fontWeight: '700' }}>{bk.room.title}</span>
                                                                            <div style={{ fontSize: '0.65rem', color: '#64748B' }}>
                                                                                {start.toLocaleDateString()} to {end.toLocaleDateString()} • {bk.status}
                                                                            </div>
                                                                        </div>
                                                                        <strong style={{ color: '#10B981' }}>₹{amount}</strong>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 4. Associate ID field */}
                            {selectedUser && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                                    <label style={{ fontWeight: '700', fontSize: '0.9rem', color: '#334155' }}>
                                        {newTicketCategory === 'ROOM' ? 'Associate Booking ID (Optional)' : 'Associate Order ID (Optional)'}
                                    </label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            type="text"
                                            value={enteredOrderId}
                                            onChange={(e) => setEnteredOrderId(e.target.value)}
                                            placeholder={newTicketCategory === 'ROOM' ? 'Enter Booking ID or select booking from list...' : 'Enter Order ID or select from recent orders...'}
                                            style={{
                                                flex: 1,
                                                padding: '10px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid #CBD5E1',
                                                fontSize: '0.9rem',
                                                outline: 'none'
                                            }}
                                        />
                                        {newTicketCategory !== 'ROOM' && (
                                            <button
                                                type="button"
                                                onClick={() => retrieveOrderDetails(enteredOrderId)}
                                                disabled={loadingRetrievedOrder || !enteredOrderId.trim()}
                                                style={{
                                                    backgroundColor: '#1E293B',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '0 15px',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontWeight: '600',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                {loadingRetrievedOrder ? 'Fetching...' : 'Get Order'}
                                            </button>
                                        )}
                                    </div>

                                    {retrievedOrder && newTicketCategory !== 'ROOM' && (
                                        <div style={{
                                            backgroundColor: '#E0F2FE',
                                            border: '1px solid #BAE6FD',
                                            borderRadius: '8px',
                                            padding: '10px 12px',
                                            fontSize: '0.8rem',
                                            color: '#0369A1'
                                        }}>
                                            <div style={{ fontWeight: '700', marginBottom: '2px' }}>
                                                Order ID Found & Verified:
                                            </div>
                                            <div>Kitchen: {retrievedOrder.seller?.businessName || "Unknown"}</div>
                                            <div>Total amount: ₹{retrievedOrder.totalAmount} • Status: {retrievedOrder.status}</div>
                                            <div>Paid: {retrievedOrder.isPaid ? 'YES' : 'NO'}</div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 5. Ticket Title */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                                <label style={{ fontWeight: '700', fontSize: '0.9rem', color: '#334155' }}>
                                    Ticket Title
                                </label>
                                <input
                                    type="text"
                                    value={newTicketTitle}
                                    onChange={(e) => setNewTicketTitle(e.target.value)}
                                    placeholder="Brief subject of the inquiry..."
                                    required
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid #CBD5E1',
                                        fontSize: '0.9rem',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            {/* 6. Description */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                                <label style={{ fontWeight: '700', fontSize: '0.9rem', color: '#334155' }}>
                                    Description / Details
                                </label>
                                <textarea
                                    value={newTicketDescription}
                                    onChange={(e) => setNewTicketDescription(e.target.value)}
                                    placeholder="Enter full details about this support request..."
                                    required
                                    style={{
                                        width: '100%',
                                        minHeight: '100px',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #CBD5E1',
                                        fontSize: '0.9rem',
                                        fontFamily: 'inherit',
                                        resize: 'vertical',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                borderTop: '1px solid #F1F5F9',
                                paddingTop: '20px',
                                marginTop: '10px',
                                flexShrink: 0
                            }}>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        backgroundColor: 'white',
                                        border: '1px solid #CBD5E1',
                                        borderRadius: '10px',
                                        fontWeight: '600',
                                        color: '#475569',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingNewTicket || !newTicketUserId}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        backgroundColor: 'var(--primary, #10B981)',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontWeight: '700',
                                        color: 'white',
                                        cursor: 'pointer',
                                        opacity: submittingNewTicket ? 0.7 : 1
                                    }}
                                >
                                    {submittingNewTicket ? "Raising..." : "Create Ticket"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
