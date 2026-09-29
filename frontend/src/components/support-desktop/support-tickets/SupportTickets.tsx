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
  Paperclip,
} from "lucide-react";
import { TicketAttachmentRenderer } from "@/components/common/TicketAttachmentRenderer";
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
  const replyFileInputRef = useRef<HTMLInputElement>(null);
  const createFileInputRef = useRef<HTMLInputElement>(null);

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newCategory, setNewCategory] = useState<string>("FOOD");
  const [newTitle, setNewTitle] = useState<string>("");
  const [newDescription, setNewDescription] = useState<string>("");
  const [submittingTicket, setSubmittingTicket] = useState<boolean>(false);

  // Resolve Confirmation Modal State
  const [isResolveModalOpen, setIsResolveModalOpen] = useState<boolean>(false);
  const [ticketToResolve, setTicketToResolve] = useState<SupportTicket | null>(null);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" | "warning" } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" | "warning" = "info") => {
    setToast({ message, type });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4000);
  };

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
      showToast("Reply message must be at least 2 characters long.", "warning");
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
        const data = await res.json().catch(() => ({}));
        showToast(data.message || "Failed to send message.", "error");
      }
    } catch (err) {
      console.error("Failed to send reply:", err);
      showToast("An error occurred. Please try again.", "error");
    } finally {
      setSubmittingReply(false);
    }
  };

  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [isReopening, setIsReopening] = useState<boolean>(false);

  const handleOpenResolveModal = (ticket: SupportTicket) => {
    setTicketToResolve(ticket);
    setIsResolveModalOpen(true);
  };

  const executeMarkResolved = async (ticketId: string) => {
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
        setIsResolveModalOpen(false);
        setTicketToResolve(null);
        showToast("Support ticket marked as resolved successfully.", "success");
        await fetchTickets(ticketId);
        await fetchTicketDetails(ticketId);
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.message || "Failed to resolve ticket.", "error");
        await fetchTicketDetails(ticketId);
      }
    } catch (err) {
      console.error("Error resolving ticket:", err);
      showToast("An error occurred while resolving ticket.", "error");
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
        showToast("Ticket reopened successfully.", "info");
        await fetchTickets(ticketId);
        await fetchTicketDetails(ticketId);
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.message || "Failed to reopen ticket.", "error");
        await fetchTicketDetails(ticketId);
      }
    } catch (err) {
      console.error("Error reopening ticket:", err);
      showToast("An error occurred while reopening ticket.", "error");
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
      showToast("Please log in to raise a support ticket.", "warning");
      return;
    }

    const hasOrders = await checkUserHasOrders();
    if (!hasOrders) {
      showToast("Support tickets are restricted to users who have placed an order. Please place an order first before raising a ticket.", "warning");
      return;
    }

    setIsCreateModalOpen(true);
  };

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) {
      showToast("Please provide both a title and description.", "warning");
      return;
    }
    if (newTitle.trim().length < 5) {
      showToast("Title must be at least 5 characters long.", "warning");
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
        showToast("Support ticket raised successfully!", "success");
        const createdId = data.id || data.data?.id;
        await fetchTickets(createdId);
      } else {
        showToast(data.message || "Failed to raise support ticket.", "error");
      }
    } catch (err) {
      console.error("Failed to submit ticket:", err);
      showToast("An error occurred. Please try again.", "error");
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
                      onClick={() => handleOpenResolveModal(selectedTicket)}
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
                  <div className={styles.issueDesc}>
                    <TicketAttachmentRenderer content={selectedTicket.description} isCurrentUser={false} />
                  </div>
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
                        <div className={styles.userBubbleText}>
                          <TicketAttachmentRenderer content={m.message} isCurrentUser={true} />
                        </div>
                        <span className={styles.userBubbleTime}>{formatDate(m.createdAt)}</span>
                      </div>
                    ) : (
                      <div key={m.id} className={styles.agentBubble}>
                        <div className={styles.agentHeader}>
                          <ShieldCheck size={14} />
                          <span>{m.senderName || m.sender?.name || "Support Team Specialist"}</span>
                        </div>
                        <div className={styles.agentBubbleText}>
                          <TicketAttachmentRenderer content={m.message} isCurrentUser={false} />
                        </div>
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
                  <input
                    type="file"
                    ref={replyFileInputRef}
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.onload = () => {
                          const dataUrl = reader.result as string;
                          setReplyText(prev => (prev ? `${prev}\n\n![${file.name}](${dataUrl})` : `![${file.name}](${dataUrl})`));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => replyFileInputRef.current?.click()}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#64748B",
                      cursor: "pointer",
                      padding: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "8px",
                      transition: "all 0.15s ease",
                    }}
                    title="Attach screenshot/image"
                  >
                    <Paperclip size={18} />
                  </button>
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label className={styles.formLabel}>DETAILED DESCRIPTION</label>
                  <input
                    type="file"
                    ref={createFileInputRef}
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.onload = () => {
                          const dataUrl = reader.result as string;
                          setNewDescription(prev => (prev ? `${prev}\n\n![${file.name}](${dataUrl})` : `![${file.name}](${dataUrl})`));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => createFileInputRef.current?.click()}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#FF5500",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Paperclip size={13} />
                    <span>Attach Image</span>
                  </button>
                </div>
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

      {/* 4. Resolve Ticket Confirmation Modal */}
      {isResolveModalOpen && ticketToResolve && (
        <div
          className={styles.modalBackdrop}
          onClick={() => !isResolving && setIsResolveModalOpen(false)}
        >
          <div
            className={styles.modalCard}
            style={{ maxWidth: "460px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "#ECFDF5",
                    color: "#10B981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircle2 size={20} />
                </div>
                <h3 className={styles.modalTitle}>Mark Ticket as Resolved?</h3>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => !isResolving && setIsResolveModalOpen(false)}
                disabled={isResolving}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "4px" }}>
              <p style={{ margin: 0, fontSize: "0.88rem", color: "#475569", lineHeight: 1.5 }}>
                Are you sure your issue has been resolved? This will update the ticket status to <strong>Resolved</strong>.
              </p>

              <div
                style={{
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#64748B" }}>
                  <span>Ticket Ref: #{ticketToResolve.id.slice(0, 8)}</span>
                  <span className={`${styles.categoryPill} ${getCategoryClass(ticketToResolve.category)}`}>
                    {ticketToResolve.category}
                  </span>
                </div>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1E293B" }}>
                  {ticketToResolve.title}
                </span>
              </div>

              <p style={{ margin: 0, fontSize: "0.8rem", color: "#94A3B8" }}>
                Tip: You can reopen this ticket at any time if you ever require further assistance.
              </p>
            </div>

            <div className={styles.modalActions} style={{ marginTop: "12px" }}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setIsResolveModalOpen(false)}
                disabled={isResolving}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.resolveConfirmBtn}
                onClick={() => executeMarkResolved(ticketToResolve.id)}
                disabled={isResolving}
              >
                {isResolving ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Resolving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Yes, Mark Resolved</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Support Toast Feedback */}
      {toast && (
        <div
          className={`${styles.toastWrapper} ${
            toast.type === "success"
              ? styles.toastSuccess
              : toast.type === "error"
              ? styles.toastError
              : toast.type === "warning"
              ? styles.toastWarning
              : styles.toastInfo
          }`}
          role="status"
          aria-live="polite"
        >
          {toast.type === "success" && <CheckCircle2 size={18} color="#10B981" />}
          {toast.type === "error" && <AlertCircle size={18} color="#EF4444" />}
          {toast.type === "warning" && <AlertCircle size={18} color="#F59E0B" />}
          {toast.type === "info" && <Headphones size={18} color="#3B82F6" />}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "inherit",
              opacity: 0.7,
              display: "flex",
              alignItems: "center",
              marginLeft: "4px",
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default SupportTickets;
