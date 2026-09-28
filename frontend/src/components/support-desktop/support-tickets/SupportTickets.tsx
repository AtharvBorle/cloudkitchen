"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { fetchApi } from "@/lib/fetch-api";
import {
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  Loader2,
  CheckCircle2,
  Clock,
  User,
  ShieldCheck,
  AlertCircle,
  X,
  ArrowLeft,
  Headphones,
} from "lucide-react";
import styles from "./SupportTickets.module.css";

interface TicketMessage {
  id: string;
  senderId: string;
  senderRole?: string;
  senderName?: string;
  message: string;
  createdAt: string;
  sender?: {
    name?: string;
    role?: string;
  };
}

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  createdAt: string;
  updatedAt: string;
  messages?: TicketMessage[];
}

export const SupportTickets: React.FC = () => {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const initialTicketId = searchParams?.get("id") || searchParams?.get("ticketId");

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [loadingTickets, setLoadingTickets] = useState<boolean>(true);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Chat Reply State
  const [replyText, setReplyText] = useState<string>("");
  const [submittingReply, setSubmittingReply] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newCategory, setNewCategory] = useState<string>("FOOD");
  const [newTitle, setNewTitle] = useState<string>("");
  const [newDescription, setNewDescription] = useState<string>("");
  const [submittingTicket, setSubmittingTicket] = useState<boolean>(false);

  const fetchTickets = async (autoSelectId?: string) => {
    try {
      setLoadingTickets(true);
      const res = await fetchApi("/api/tickets");
      const data = await res.json();
      if (res.ok) {
        const fetched: SupportTicket[] = data.data || data || [];
        setTickets(fetched);

        const targetId = autoSelectId || initialTicketId;
        if (targetId) {
          const found = fetched.find((t) => t.id === targetId);
          if (found) {
            fetchTicketDetails(found.id);
          } else if (fetched.length > 0) {
            fetchTicketDetails(fetched[0].id);
          }
        } else if (fetched.length > 0 && !selectedTicket) {
          fetchTicketDetails(fetched[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load tickets:", err);
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
    } catch (err) {
      console.error("Failed to load ticket details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [initialTicketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedTicket?.messages]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    if (replyText.trim().length < 2) {
      alert("Reply message must be at least 2 characters long.");
      return;
    }

    setSubmittingReply(true);
    try {
      const res = await fetchApi(`/api/tickets/${selectedTicket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText.trim() }),
      });
      if (res.ok) {
        setReplyText("");
        await fetchTicketDetails(selectedTicket.id);
        await fetchTickets(selectedTicket.id);
      } else {
        const data = await res.json();
        alert(data.message || "Failed to send message.");
      }
    } catch (err) {
      console.error("Failed to send reply:", err);
      alert("An error occurred. Please try again.");
    } finally {
      setSubmittingReply(false);
    }
  };

  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [isReopening, setIsReopening] = useState<boolean>(false);

  const handleMarkResolved = async (ticketId: string) => {
    if (!confirm("Are you sure your issue is resolved and you want to mark this ticket as resolved?")) {
      return;
    }
    try {
      setIsResolving(true);
      // Optimistic update
      setSelectedTicket((prev) => prev ? { ...prev, status: "RESOLVED", updatedAt: new Date().toISOString() } : null);
      setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, status: "RESOLVED", updatedAt: new Date().toISOString() } : t));

      const res = await fetchApi(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RESOLVED" }),
      });
      if (res.ok) {
        await fetchTickets(ticketId);
        await fetchTicketDetails(ticketId);
      } else {
        alert("Failed to resolve ticket.");
        await fetchTicketDetails(ticketId);
      }
    } catch (err) {
      console.error("Error resolving ticket:", err);
    } finally {
      setIsResolving(false);
    }
  };

  const handleReopenTicket = async (ticketId: string) => {
    try {
      setIsReopening(true);
      // Optimistic update
      setSelectedTicket((prev) => prev ? { ...prev, status: "OPEN", updatedAt: new Date().toISOString() } : null);
      setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, status: "OPEN", updatedAt: new Date().toISOString() } : t));

      const res = await fetchApi(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "OPEN" }),
      });
      if (res.ok) {
        await fetchTickets(ticketId);
        await fetchTicketDetails(ticketId);
      } else {
        alert("Failed to reopen ticket.");
        await fetchTicketDetails(ticketId);
      }
    } catch (err) {
      console.error("Error reopening ticket:", err);
    } finally {
      setIsReopening(false);
    }
  };

  const checkUserHasOrders = async (): Promise<boolean> => {
    try {
      const res = await fetchApi("/api/user/orders");
      if (res.ok) {
        const data = await res.json();
        const orders = data.data || data || [];
        return Array.isArray(orders) && orders.length > 0;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleOpenRaiseModal = async () => {
    if (status !== "authenticated") {
      alert("Please log in to raise a support ticket.");
      return;
    }

    const hasOrders = await checkUserHasOrders();
    if (!hasOrders) {
      alert("Support tickets are restricted to users who have placed an order. Please place an order first before raising a support ticket.");
      return;
    }

    setIsCreateModalOpen(true);
  };

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) {
      alert("Please provide both a title and description.");
      return;
    }
    if (newTitle.trim().length < 5) {
      alert("Title must be at least 5 characters long.");
      return;
    }

    setSubmittingTicket(true);
    try {
      const res = await fetchApi("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
          category: newCategory,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewTitle("");
        setNewDescription("");
        setIsCreateModalOpen(false);
        const createdId = data.id || data.data?.id;
        await fetchTickets(createdId);
      } else {
        alert(data.message || "Failed to raise support ticket.");
      }
    } catch (err) {
      console.error("Failed to submit ticket:", err);
      alert("An error occurred. Please try again.");
    } finally {
      setSubmittingTicket(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q);

    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchesCategory = categoryFilter === "ALL" || t.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getCategoryClass = (cat: string) => {
    switch (cat) {
      case "FOOD":
        return styles.categoryFood;
      case "ROOM":
        return styles.categoryRoom;
      case "PAYMENT":
        return styles.categoryPayment;
      default:
        return styles.categoryOther;
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "OPEN":
        return (
          <span
            style={{
              backgroundColor: "#DCFCE7",
              color: "#15803D",
              padding: "3px 9px",
              borderRadius: "12px",
              fontSize: "0.72rem",
              fontWeight: 800,
              border: "1px solid #BBF7D0",
            }}
          >
            OPEN
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span
            style={{
              backgroundColor: "#DBEAFE",
              color: "#1D4ED8",
              padding: "3px 9px",
              borderRadius: "12px",
              fontSize: "0.72rem",
              fontWeight: 800,
              border: "1px solid #BFDBFE",
            }}
          >
            IN PROGRESS
          </span>
        );
      case "RESOLVED":
        return (
          <span
            style={{
              backgroundColor: "#D1FAE5",
              color: "#047857",
              padding: "3px 9px",
              borderRadius: "12px",
              fontSize: "0.72rem",
              fontWeight: 800,
              border: "1px solid #A7F3D0",
            }}
          >
            RESOLVED
          </span>
        );
      case "CLOSED":
        return (
          <span
            style={{
              backgroundColor: "#F1F5F9",
              color: "#64748B",
              padding: "3px 9px",
              borderRadius: "12px",
              fontSize: "0.72rem",
              fontWeight: 800,
              border: "1px solid #E2E8F0",
            }}
          >
            CLOSED
          </span>
        );
      default:
        return <span>{st}</span>;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={styles.container}>
      {/* 1. Page Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.headerLeft}>
          <div className={styles.titleRow}>
            <h1 className={styles.mainTitle}>Support & Tickets</h1>
            <span className={styles.countBadge}>
              {tickets.length} {tickets.length === 1 ? "Ticket" : "Tickets"}
            </span>
          </div>
          <p className={styles.subtitle}>
            Track your inquiries, communicate directly with support agents, and monitor resolution status.
          </p>
        </div>

        <div className={styles.headerRight}>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={() => fetchTickets(selectedTicket?.id)}
            title="Refresh Tickets"
          >
            <RefreshCw size={17} className={loadingTickets ? "animate-spin" : ""} />
          </button>

          <button
            type="button"
            className={styles.raiseBtn}
            onClick={handleOpenRaiseModal}
          >
            <Plus size={18} />
            <span>Raise Ticket</span>
          </button>
        </div>
      </div>

      {/* 2. Workspace 2-Column Grid */}
      <div className={styles.workspaceGrid}>
        {/* Left Column: Tickets List Panel */}
        <div className={styles.listPanel}>
          <div className={styles.filterControls}>
            <div className={styles.searchBox}>
              <Search size={15} color="#94A3B8" />
              <input
                type="text"
                placeholder="Search tickets by title or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.dropdownRow}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="ALL">All Status</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="ALL">All Categories</option>
                <option value="FOOD">Food Delivery</option>
                <option value="ROOM">Room Stay</option>
                <option value="PAYMENT">Payment & Refund</option>
                <option value="OTHER">General Support</option>
              </select>
            </div>
          </div>

          {/* Tickets Scroll List */}
          <div className={styles.ticketsScroll}>
            {loadingTickets ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
                <Loader2 className="animate-spin" color="#FF5500" size={28} />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIconWrapper}>
                  <MessageSquare size={28} />
                </div>
                <h4 className={styles.emptyTitle}>No Tickets Found</h4>
                <p className={styles.emptySubtitle}>
                  {tickets.length === 0
                    ? "You have not raised any support tickets yet. Click 'Raise Ticket' or use Bitey Bot to start an inquiry."
                    : "No tickets match your active search or filters."}
                </p>
              </div>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`${styles.ticketCard} ${isSelected ? styles.ticketCardActive : ""}`}
                    onClick={() => fetchTicketDetails(t.id)}
                  >
                    <div className={styles.cardTopRow}>
                      <span className={`${styles.categoryPill} ${getCategoryClass(t.category)}`}>
                        {t.category}
                      </span>
                      {getStatusBadge(t.status)}
                    </div>

                    <h3 className={styles.ticketTitle} title={t.title}>
                      {t.title}
                    </h3>

                    <div className={styles.cardBottomRow}>
                      <span>#{t.id.slice(0, 8)}</span>
                      <span>{formatDate(t.createdAt)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Ticket Conversation Panel */}
        <div className={styles.detailPanel}>
          {loadingDetails ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
              <Loader2 className="animate-spin" color="#FF5500" size={32} />
            </div>
          ) : selectedTicket ? (
            <>
              {/* Detail Header */}
              <div className={styles.detailHeader}>
                <div className={styles.detailHeaderInfo}>
                  <h2 className={styles.detailTitle} title={selectedTicket.title}>
                    {selectedTicket.title}
                  </h2>
                  <div className={styles.detailMeta}>
                    <span>Ref: #{selectedTicket.id.slice(0, 8)}</span>
                    <span>•</span>
                    <span className={`${styles.categoryPill} ${getCategoryClass(selectedTicket.category)}`}>
                      {selectedTicket.category}
                    </span>
                    <span>•</span>
                    <span>{formatDate(selectedTicket.createdAt)}</span>
                  </div>
                </div>

                <div className={styles.detailActions}>
                  {getStatusBadge(selectedTicket.status)}
                  {selectedTicket.status !== "RESOLVED" && selectedTicket.status !== "CLOSED" ? (
                    <button
                      type="button"
                      className={styles.resolveBtn}
                      onClick={() => handleMarkResolved(selectedTicket.id)}
                      disabled={isResolving}
                    >
                      {isResolving ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={14} />
                      )}
                      <span>Mark Resolved</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.reopenBtn}
                      onClick={() => handleReopenTicket(selectedTicket.id)}
                      disabled={isReopening}
                      title="Reopen ticket if issue persists"
                    >
                      {isReopening ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <RefreshCw size={14} />
                      )}
                      <span>Reopen Ticket</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Messages Stream */}
              <div className={styles.messagesStream}>
                {/* Initial Ticket Description Card */}
                <div className={styles.initialIssueCard}>
                  <div className={styles.issueHeader}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, color: "#1E293B" }}>
                      <User size={14} color="#FF5500" />
                      <span>{session?.user?.name || "Customer"} (Original Request)</span>
                    </div>
                    <span>{formatDate(selectedTicket.createdAt)}</span>
                  </div>
                  <p className={styles.issueDesc}>{selectedTicket.description}</p>
                </div>

                {/* Follow-up Message Thread */}
                {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages.map((m) => {
                    const isUserMessage =
                      m.senderId === session?.user?.id ||
                      m.senderRole === "USER" ||
                      m.sender?.role === "USER";

                    return isUserMessage ? (
                      <div key={m.id} className={styles.userBubble}>
                        <p className={styles.userBubbleText}>{m.message}</p>
                        <span className={styles.userBubbleTime}>{formatDate(m.createdAt)}</span>
                      </div>
                    ) : (
                      <div key={m.id} className={styles.agentBubble}>
                        <div className={styles.agentHeader}>
                          <ShieldCheck size={14} />
                          <span>{m.senderName || m.sender?.name || "Support Team Specialist"}</span>
                        </div>
                        <p className={styles.agentBubbleText}>{m.message}</p>
                        <span className={styles.agentBubbleTime}>{formatDate(m.createdAt)}</span>
                      </div>
                    );
                  })
                ) : null}

                {/* Resolution Milestone Indicator in Chat Stream */}
                {(selectedTicket.status === "RESOLVED" || selectedTicket.status === "CLOSED") && (
                  <div className={styles.resolutionMilestone}>
                    <div className={styles.resolutionMilestoneBadge}>
                      <CheckCircle2 size={15} color="#059669" />
                      <span>Issue Marked as {selectedTicket.status === "RESOLVED" ? "Resolved" : "Closed"}</span>
                    </div>
                    <p className={styles.resolutionMilestoneText}>
                      This ticket was marked as resolved on {formatDate(selectedTicket.updatedAt || selectedTicket.createdAt)}.
                    </p>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Reply Box / Resolved State Card */}
              {selectedTicket.status === "OPEN" || selectedTicket.status === "IN_PROGRESS" ? (
                <form onSubmit={handleSendReply} className={styles.replyBar}>
                  <textarea
                    rows={1}
                    placeholder="Type your reply to the support team..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply(e);
                      }
                    }}
                    className={styles.replyInput}
                  />
                  <button
                    type="submit"
                    disabled={submittingReply || !replyText.trim()}
                    className={styles.sendBtn}
                    title="Send Message"
                  >
                    {submittingReply ? (
                      <Loader2 className="animate-spin" size={17} />
                    ) : (
                      <Send size={17} />
                    )}
                  </button>
                </form>
              ) : (
                <div className={styles.resolvedCardFooter}>
                  <div className={styles.resolvedCardTop}>
                    <div className={styles.resolvedCardIcon}>
                      <CheckCircle2 size={20} color="#059669" />
                    </div>
                    <div className={styles.resolvedCardInfo}>
                      <div className={styles.resolvedCardTitle}>
                        This support ticket is marked as {selectedTicket.status === "RESOLVED" ? "Resolved" : "Closed"}
                      </div>
                      <div className={styles.resolvedCardDesc}>
                        The conversation has been concluded. If you still need help with this specific request, you can reopen it anytime.
                      </div>
                    </div>
                  </div>
                  <div className={styles.resolvedCardActions}>
                    <button
                      type="button"
                      className={styles.reopenActionBtn}
                      onClick={() => handleReopenTicket(selectedTicket.id)}
                      disabled={isReopening}
                    >
                      {isReopening ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <RefreshCw size={14} />
                      )}
                      <span>Reopen Ticket</span>
                    </button>
                    <button
                      type="button"
                      className={styles.newTicketActionBtn}
                      onClick={handleOpenRaiseModal}
                    >
                      <Plus size={14} />
                      <span>Raise New Ticket</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconWrapper}>
                <Headphones size={30} />
              </div>
              <h3 className={styles.emptyTitle}>No Ticket Selected</h3>
              <p className={styles.emptySubtitle}>
                Select a ticket from the left panel to inspect the message conversation thread or communicate with our support specialists.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Raise Support Ticket Modal */}
      {isCreateModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsCreateModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Raise a Support Ticket</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsCreateModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>ISSUE CATEGORY</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className={styles.formSelect}
                >
                  <option value="FOOD">Food Delivery / Order Issue</option>
                  <option value="ROOM">Room Booking / Stay Query</option>
                  <option value="PAYMENT">Payment, Billing & Refunds</option>
                  <option value="OTHER">Other / General Support</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>TICKET TITLE / SUBJECT</label>
                <input
                  type="text"
                  placeholder="e.g., Delay in order delivery or incorrect items"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>DETAILED DESCRIPTION</label>
                <textarea
                  rows={4}
                  placeholder="Please describe your query or issue with as much detail as possible..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className={styles.formTextarea}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTicket}
                  className={styles.submitBtn}
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
};

export default SupportTickets;
