"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/fetch-api";
import Link from "next/link";
import { MessageSquare, RefreshCw, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";

export default function SupportOverviewPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [refunds, setRefunds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const [ticketsRes, refundsRes] = await Promise.all([
                    fetchApi("/api/tickets"),
                    fetchApi("/api/refunds")
                ]);

                if (ticketsRes.ok) {
                    const ticketsData = await ticketsRes.json();
                    setTickets(ticketsData.data || ticketsData);
                }
                if (refundsRes.ok) {
                    const refundsData = await refundsRes.json();
                    setRefunds(refundsData.data || refundsData);
                }
            } catch (err) {
                console.error("Failed to load support stats:", err);
            } finally {
                setLoading(false);
            }
        };

        loadStats();
    }, []);

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
                <span style={{ color: "#64748b" }}>Loading Overview Dashboard...</span>
            </div>
        );
    }

    const openTickets = tickets.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS");
    const pendingRefunds = refunds.filter(r => r.status === "PENDING");
    const closedTickets = tickets.filter(t => t.status === "CLOSED");

    const stats = [
        {
            title: "Open Support Tickets",
            count: openTickets.length,
            icon: <MessageSquare size={24} color="#10b981" />,
            bgColor: "#ecfdf5",
            textColor: "#065f46",
            link: "/dashboard/support/tickets"
        },
        {
            title: "Pending Refunds",
            count: pendingRefunds.length,
            icon: <RefreshCw size={24} color="#f59e0b" />,
            bgColor: "#fef3c7",
            textColor: "#92400e",
            link: "/dashboard/support/refunds"
        },
        {
            title: "Resolved Tickets",
            count: closedTickets.length,
            icon: <CheckCircle size={24} color="#3b82f6" />,
            bgColor: "#eff6ff",
            textColor: "#1e40af",
            link: "/dashboard/support/tickets"
        },
        {
            title: "Total Tickets Handled",
            count: tickets.length,
            icon: <AlertCircle size={24} color="#6366f1" />,
            bgColor: "#e0e7ff",
            textColor: "#3730a3",
            link: "/dashboard/support/tickets"
        }
    ];

    // Recent 5 open/in-progress tickets
    const recentTickets = openTickets.slice(0, 5);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Header section */}
            <div>
                <h2 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#0f172a", marginBottom: "0.25rem" }}>Support Dashboard</h2>
                <p style={{ color: "#64748b", fontSize: "0.95rem" }}>Monitor customer tickets, chat queries, and process refund transactions.</p>
            </div>

            {/* Stats Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>
                {stats.map((stat, idx) => (
                    <div
                        key={idx}
                        style={{
                            backgroundColor: "white",
                            borderRadius: "16px",
                            padding: "1.5rem",
                            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)",
                            border: "1px solid #f1f5f9",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            height: "150px"
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                                <span style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: "500" }}>{stat.title}</span>
                                <h3 style={{ fontSize: "2rem", fontWeight: "700", color: "#0f172a", marginTop: "0.25rem" }}>{stat.count}</h3>
                            </div>
                            <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: stat.bgColor, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
                                {stat.icon}
                            </div>
                        </div>

                        <Link
                            href={stat.link}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                fontSize: "0.85rem",
                                color: stat.textColor,
                                fontWeight: "600",
                                textDecoration: "none",
                                width: "fit-content"
                            }}
                        >
                            Manage Panel <ArrowRight size={14} />
                        </Link>
                    </div>
                ))}
            </div>

            {/* Layout split: Recent Tickets & Guidance */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "2rem" }}>
                {/* Recent Open Tickets */}
                <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "1.5rem", border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,0.01)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                        <h4 style={{ fontSize: "1.1rem", fontWeight: "600", color: "#0f172a" }}>Recent Pending Tickets</h4>
                        <Link href="/dashboard/support/tickets" style={{ fontSize: "0.85rem", color: "#10b981", fontWeight: "600", textDecoration: "none" }}>View All</Link>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {recentTickets.map((ticket) => (
                            <div
                                key={ticket.id}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "1rem",
                                    backgroundColor: "#f8fafc",
                                    borderRadius: "12px",
                                    border: "1px solid #e2e8f0"
                                }}
                            >
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#1e293b" }}>{ticket.title}</span>
                                        <span
                                            style={{
                                                fontSize: "0.7rem",
                                                padding: "2px 6px",
                                                borderRadius: "4px",
                                                backgroundColor: ticket.status === "OPEN" ? "#fee2e2" : "#fef3c7",
                                                color: ticket.status === "OPEN" ? "#991b1b" : "#92400e",
                                                fontWeight: "bold"
                                            }}
                                        >
                                            {ticket.status}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.25rem" }}>
                                        Category: <strong>{ticket.category}</strong> | Raised by {ticket.user?.name || "Customer"}
                                    </p>
                                </div>
                                <Link
                                    href={`/dashboard/support/tickets?id=${ticket.id}`}
                                    style={{
                                        padding: "6px 12px",
                                        backgroundColor: "white",
                                        border: "1px solid #cbd5e1",
                                        borderRadius: "6px",
                                        fontSize: "0.8rem",
                                        color: "#1e293b",
                                        fontWeight: "600",
                                        textDecoration: "none"
                                    }}
                                >
                                    Reply
                                </Link>
                            </div>
                        ))}

                        {recentTickets.length === 0 && (
                            <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
                                <CheckCircle size={36} color="#cbd5e1" style={{ margin: "0 auto 10px" }} />
                                <p style={{ fontSize: "0.9rem" }}>No pending support tickets found. Great job!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Support admin guidance card */}
                <div style={{ backgroundColor: "#1e293b", borderRadius: "16px", padding: "2rem", color: "#f8fafc", display: "flex", flexDirection: "column", gap: "1rem", justifyContent: "center" }}>
                    <h4 style={{ fontSize: "1.25rem", fontWeight: "700", color: "white" }}>Support Admin Portal Policy</h4>
                    <p style={{ fontSize: "0.9rem", color: "#94a3b8", lineHeight: "1.6" }}>
                        As a Customer Care Support Admin, you are responsible for monitoring and responding to support tickets logged by users and sellers.
                    </p>
                    <ul style={{ fontSize: "0.9rem", color: "#cbd5e1", paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <li>Reply to open tickets in a timely manner.</li>
                        <li>Update ticket statuses to <strong>IN PROGRESS</strong> while investigating, and <strong>CLOSED</strong> when resolved.</li>
                        <li>Review Refund Requests carefully, matching transaction data and reasons before approving or rejecting.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
