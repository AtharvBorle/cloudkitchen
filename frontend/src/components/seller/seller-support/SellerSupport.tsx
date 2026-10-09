"use client";

import React, { useState, useEffect, useRef } from "react";
import ConsoleSidebar from "../sidebar/Sidebar";
import Topbar from "../nav/Topbar";
import {
  Search,
  Paperclip,
  Send,
  Menu,
  Plus,
  PlusCircle,
  ArrowLeft,
  X,
  Loader2,
  Headphones,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import styles from "./SellerSupport.module.css";
import { fetchApi } from "@/lib/fetch-api";
import { useSellerProfile } from "@/hooks/useSellerProfile";

export interface TicketMessage {
  id: string;
  sender: string;
  role: "customer" | "support";
  initials: string;
  timestamp: string;
  text: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  category: "Technical" | "Billing" | "Feature Request" | "Operations" | string;
  title: string;
  preview: string;
  customerName: string;
  customerInitials: string;
  customerEmail?: string;
  time: string;
  status: "Open" | "In Progress" | "Closed" | "Resolved";
  priority?: "High" | "Medium" | "Low" | null;
  messages: TicketMessage[];
}

export interface SellerSupportProps {
  ownerName?: string;
  partnerRole?: string;
  avatarInitials?: string;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
}

const FILTER_PILLS = ["All", "Open", "In Progress", "Closed"];

const TICKET_CATEGORIES = [
  "Operations",
  "Billing & Payouts",
  "Technical",
  "Meal Subscriptions",
  "Feature Request",
  "General",
];

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "Recently";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 172800) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

function formatMessageTime(dateStr?: string): string {
  if (!dateStr) return "Just now";
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  } catch {
    return "Just now";
  }
}

function getInitials(name?: string): string {
  if (!name || name === "ME") return "US";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return parts[0] ? parts[0][0].toUpperCase() : "US";
}

function mapRawMessage(m: any, ticketUser?: any): TicketMessage {
  const isMe = m.sender?.role === "SELLER" || m.sender?.role === "OWNER" || m.sender?.role === "USER";
  const senderName = m.sender?.name || (isMe ? (ticketUser?.name || "Seller") : "Support Team");
  const role: "customer" | "support" = isMe ? "customer" : "support";
  const initials = getInitials(senderName);

  return {
    id: m.id || `m_${Date.now()}`,
    sender: senderName,
    role,
    initials,
    timestamp: formatMessageTime(m.createdAt),
    text: m.message || "",
  };
}

function cleanTicketText(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(/\[Priority:\s*(High|Medium|Low)\]\s*\n?/gi, "").trim();
}

export function resolveTicketPriority(t: any): "High" | "Medium" | "Low" | null {
  if (!t) return null;
  const rawStatus = String(t.status || "").toUpperCase();
  if (rawStatus === "CLOSED") return null;

  if (t.priority && typeof t.priority === "string") {
    const p = t.priority.trim().toUpperCase();
    if (p === "HIGH" || p === "URGENT" || p === "CRITICAL") return "High";
    if (p === "LOW") return "Low";
    if (p === "MEDIUM") return "Medium";
  }

  const desc = String(t.description || t.preview || "");
  const tagMatch = desc.match(/\[Priority:\s*(High|Medium|Low)\]/i);
  if (tagMatch) {
    const val = tagMatch[1].toLowerCase();
    if (val === "high") return "High";
    if (val === "low") return "Low";
    return "Medium";
  }

  if (Array.isArray(t.messages)) {
    for (let i = t.messages.length - 1; i >= 0; i--) {
      const msg = String(t.messages[i]?.text || t.messages[i]?.message || "");
      const msgMatch = msg.match(/Priority\s+(?:is\s+|updated\s+to\s+|set\s+to\s+)?(High|Medium|Low)/i);
      if (msgMatch) {
        const val = msgMatch[1].toLowerCase();
        if (val === "high") return "High";
        if (val === "low") return "Low";
        return "Medium";
      }
    }
  }

  const allText = `${t.title || ""} ${desc} ${t.category || ""}`.toLowerCase();

  if (
    /\b(cancel|cancellation|request cancellation|out_for_delivery|out for delivery|not answering|delayed|delay|emergency|urgent|critical|refund|deduction|missing|wrong item|spoiled|contaminated)\b/i.test(
      allText
    )
  ) {
    return "High";
  }

  if (
    /\b(faq|general query|inquiry|feedback|suggestion|feature request|menu info|profile info)\b/i.test(
      allText
    )
  ) {
    return "Low";
  }

  return "Medium";
}

function mapRawTicket(t: any): Ticket {
  const rawStatus = (t.status || "OPEN").toUpperCase();
  const status: Ticket["status"] =
    rawStatus === "OPEN"
      ? "Open"
      : rawStatus === "IN_PROGRESS"
      ? "In Progress"
      : rawStatus === "RESOLVED"
      ? "Resolved"
      : "Closed";

  const name = t.user?.name || "Seller";
  const initials = getInitials(name);

  const isClosed = status === "Closed";
  const rawMessages = Array.isArray(t.messages) && t.messages.length > 0 ? t.messages : [];
  const messages: TicketMessage[] = rawMessages
    .filter((m: any) => {
      if (isClosed) {
        const msgText = String(m.message || m.text || "").trim();
        if (/^Priority\s+(?:is\s+|updated\s+to\s+|set\s+to\s+)?(High|Medium|Low)$/i.test(msgText)) {
          return false;
        }
      }
      return true;
    })
    .map((m: any) => {
      const mapped = mapRawMessage(m, t.user);
      return {
        ...mapped,
        text: cleanTicketText(mapped.text),
      };
    });

  if (messages.length === 0 && t.description) {
    messages.push({
      id: `init_${t.id}`,
      sender: name,
      role: "customer",
      initials,
      timestamp: formatMessageTime(t.createdAt),
      text: cleanTicketText(t.description),
    });
  }

  return {
    id: t.id,
    ticketNumber: `#TKT-${t.id.slice(-4).toUpperCase()}`,
    category: t.category || "Operations",
    title: t.title || "Support Request",
    preview: cleanTicketText(t.description),
    customerName: name,
    customerInitials: initials,
    customerEmail: t.user?.email || "",
    time: formatRelativeTime(t.createdAt),
    status,
    priority: resolveTicketPriority(t),
    messages,
  };
}

export const SellerSupport: React.FC<SellerSupportProps> = ({
  ownerName,
  partnerRole,
  avatarInitials,
  onSearch,
  onNotificationClick,
}) => {
  const seller = useSellerProfile();
  const effectiveOwnerName =
    ownerName &&
    ownerName !== "Rahul Sharma" &&
    ownerName !== "Rahul" &&
    ownerName !== "John Doe" &&
    ownerName !== "Kitchen Owner"
      ? ownerName
      : seller.ownerName;
  const effectivePartnerRole = partnerRole || seller.partnerRole;
  const effectiveAvatarInitials =
    avatarInitials && avatarInitials !== "JD" && avatarInitials !== "KP"
      ? avatarInitials
      : seller.avatarInitials;

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string>("");
  const [activeMobileView, setActiveMobileView] = useState<"list" | "chat">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Raise Ticket Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Operations");
  const [newDescription, setNewDescription] = useState("");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fetchTickets = async (selectId?: string) => {
    try {
      setLoading(true);
      const res = await fetchApi("/api/tickets");
      if (res.ok) {
        const rawData = await res.json();
        const list = Array.isArray(rawData) ? rawData : Array.isArray(rawData?.data) ? rawData.data : [];
        const mapped = list.map(mapRawTicket);
        setTickets(mapped);

        if (selectId) {
          setSelectedTicketId(selectId);
          loadTicketDetails(selectId);
        } else if (mapped.length > 0 && !selectedTicketId) {
          setSelectedTicketId(mapped[0].id);
          loadTicketDetails(mapped[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load seller tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetails = async (id: string) => {
    try {
      const res = await fetchApi(`/api/tickets/${id}`);
      if (res.ok) {
        const rawData = await res.json();
        const data = rawData.data || rawData;
        if (data && data.id) {
          const updated = mapRawTicket(data);
          setTickets((prev) =>
            prev.map((t) => (t.id === id ? updated : t))
          );
        }
      }
    } catch (err) {
      console.error("Failed to load ticket details:", err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0] || null;

  const filteredTickets = tickets.filter((ticket) => {
    const q = searchQuery.toLowerCase().trim().replace(/\s+/g, " ");
    const queryWords = q.split(" ").filter(Boolean);
    const fullText = `${ticket.title} ${ticket.customerName} ${ticket.customerEmail || ""} ${ticket.ticketNumber} ${ticket.category} ${ticket.preview}`.toLowerCase();
    const matchesSearch =
      !q ||
      fullText.includes(q) ||
      ticket.customerName.toLowerCase().includes(q) ||
      (ticket.customerEmail && ticket.customerEmail.toLowerCase().includes(q)) ||
      (queryWords.length > 1 && queryWords.every((w) => fullText.includes(w)));

    const matchesStatus =
      statusFilter === "All" || ticket.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const handleSelectTicket = (id: string) => {
    setSelectedTicketId(id);
    setActiveMobileView("chat");
    loadTicketDetails(id);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast("Please enter a ticket subject / title", "error");
      return;
    }
    if (!newDescription.trim()) {
      showToast("Please enter a description for your ticket", "error");
      return;
    }

    setIsSubmittingTicket(true);
    try {
      const res = await fetchApi("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          description: newDescription.trim(),
          priority: "Medium",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Support ticket raised successfully!", "success");
        setIsCreateModalOpen(false);
        setNewTitle("");
        setNewDescription("");
        setNewCategory("Operations");
        const createdId = data.id || data.data?.id;
        await fetchTickets(createdId);
        if (createdId) {
          setSelectedTicketId(createdId);
          setActiveMobileView("chat");
        }
      } else {
        showToast(data.message || "Failed to raise support ticket", "error");
      }
    } catch (err: any) {
      showToast(err.message || "An unexpected error occurred", "error");
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedTicket) return;

    const msgText = inputMessage.trim();
    setInputMessage("");
    setIsSendingMessage(true);

    // Optimistic message update
    const senderName = effectiveOwnerName || selectedTicket.customerName || "Seller";
    const optimisticMsg: TicketMessage = {
      id: `opt_${Date.now()}`,
      sender: senderName,
      role: "customer",
      initials: getInitials(senderName),
      timestamp: "Just now",
      text: msgText,
    };

    setTickets((prev) =>
      prev.map((t) =>
        t.id === selectedTicket.id
          ? { ...t, messages: [...t.messages, optimisticMsg] }
          : t
      )
    );

    try {
      const res = await fetchApi(`/api/tickets/${selectedTicket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msgText }),
      });

      if (res.ok) {
        await loadTicketDetails(selectedTicket.id);
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to send message", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to send message", "error");
    } finally {
      setIsSendingMessage(false);
    }
  };

  const getStatusBadgeStyle = (status: Ticket["status"]) => {
    switch (status) {
      case "Open":
        return styles.statusOpen;
      case "In Progress":
        return styles.statusInProgress;
      case "Closed":
      case "Resolved":
        return styles.statusClosed;
      default:
        return styles.statusOpen;
    }
  };

  return (
    <div className={styles.container}>
      {/* 1. Left Sidebar (Drawer on mobile triggered via hamburger) */}
      <ConsoleSidebar
        activeItemId="support"
        isMobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        ownerName={effectiveOwnerName}
        partnerRole={effectivePartnerRole}
        avatarInitials={effectiveAvatarInitials}
      />

      {/* 2. Main Content Column */}
      <div className={styles.rightSection}>
        {/* Desktop Topbar */}
        <div className={styles.desktopTopbarWrapper}>
          <Topbar
            title="Owner Operations Console"
            ownerName={effectiveOwnerName}
            partnerRole={effectivePartnerRole}
            avatarInitials={effectiveAvatarInitials}
            hideSearch={true}
            showSearch={false}
            onNotificationClick={onNotificationClick}
            onMenuToggle={() => setIsMobileOpen(true)}
          />
        </div>

        {/* Mobile Header Bar (support-tickets-list-mobile & support-ticket-chat-mobile) */}
        <div className={styles.mobileHeader}>
          {activeMobileView === "chat" ? (
            <div className={styles.mobileChatNavHeaderWrapper}>
              <div className={styles.mobileChatNavHeader}>
                <button
                  type="button"
                  onClick={() => setActiveMobileView("list")}
                  className={styles.mobileBackBtn}
                  aria-label="Back to ticket list"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className={styles.mobileChatTitleGroup}>
                  <h1 className={styles.mobileHeaderTitle}>
                    {selectedTicket?.title || "Ticket"}
                  </h1>
                  <span className={styles.mobileChatSubtitle}>
                    {selectedTicket?.customerName || ""}
                  </span>
                </div>
                <span
                  className={`${styles.statusBadge} ${getStatusBadgeStyle(
                    selectedTicket?.status || "Open"
                  )}`}
                  style={{ marginLeft: "auto" }}
                >
                  {selectedTicket?.status || "Open"}
                </span>
              </div>
            </div>
          ) : (
            <div className={styles.mobileListNavHeader}>
              <button
                type="button"
                onClick={() => setIsMobileOpen(true)}
                className={styles.mobileHamburgerBtn}
                aria-label="Open sidebar"
              >
                <Menu size={22} />
              </button>
              <h1 className={styles.mobileHeaderTitle}>Support Tickets</h1>
              <button
                type="button"
                className={styles.mobileAddBtn}
                aria-label="Raise new ticket"
                onClick={() => setIsCreateModalOpen(true)}
                title="Raise New Ticket"
              >
                <PlusCircle size={22} strokeWidth={2.4} />
              </button>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <main className={styles.mainCanvas}>
          <div className={styles.ticketLayout}>
            {/* Left Column: Header, Filter & Tickets List */}
            <section
              className={`${styles.leftPane} ${
                activeMobileView === "chat" ? styles.leftPaneHideMobile : ""
              }`}
            >
              {/* Desktop Left Pane Header with Raise Ticket CTA */}
              <div className={styles.leftPaneHeader}>
                <h2 className={styles.leftPaneTitle}>Support Tickets</h2>
                <button
                  type="button"
                  className={styles.raiseTicketBtn}
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus size={15} strokeWidth={2.5} />
                  <span>Raise Ticket</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className={styles.searchBox}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              {/* Status Filter Pills */}
              <div className={styles.filterPillsRow}>
                {FILTER_PILLS.map((pill) => {
                  const isActive = statusFilter.toLowerCase() === pill.toLowerCase();
                  return (
                    <button
                      key={pill}
                      type="button"
                      onClick={() => setStatusFilter(pill)}
                      className={`${styles.filterPill} ${
                        isActive ? styles.filterPillActive : ""
                      }`}
                    >
                      {pill}
                    </button>
                  );
                })}
              </div>

              {/* Tickets List */}
              <div className={styles.ticketList}>
                {loading ? (
                  <div className={styles.emptyListState}>
                    <Loader2 size={24} className="animate-spin" color="#FF5500" />
                    <p className={styles.emptyListText}>Loading tickets...</p>
                  </div>
                ) : filteredTickets.length > 0 ? (
                  filteredTickets.map((ticket) => {
                    const isSelected = ticket.id === selectedTicket?.id;
                    return (
                      <div
                        key={ticket.id}
                        onClick={() => handleSelectTicket(ticket.id)}
                        className={`${styles.ticketCard} ${
                          isSelected ? styles.ticketCardSelected : ""
                        }`}
                      >
                        <div className={styles.ticketCardHeader}>
                          <span className={styles.ticketCategory}>{ticket.category}</span>
                          <span className={styles.ticketTime}>{ticket.time}</span>
                        </div>

                        <h4 className={styles.ticketTitle}>{ticket.title}</h4>

                        <div className={styles.ticketCardFooter}>
                          <div className={styles.customerInfo}>
                            <span className={styles.customerDot} />
                            <span className={styles.customerName}>
                              {ticket.ticketNumber}
                            </span>
                          </div>
                          <span
                            className={`${styles.statusBadge} ${getStatusBadgeStyle(
                              ticket.status
                            )}`}
                          >
                            {ticket.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className={styles.emptyListState}>
                    <Headphones size={32} color="#94A3B8" />
                    <p className={styles.emptyListText}>
                      {tickets.length === 0
                        ? "No support tickets yet. Click '+ Raise Ticket' to submit your request."
                        : `No tickets found under "${statusFilter}"`}
                    </p>
                    <button
                      type="button"
                      className={styles.raiseTicketEmptyBtn}
                      onClick={() => setIsCreateModalOpen(true)}
                    >
                      <Plus size={15} />
                      <span>Raise New Ticket</span>
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Right Column: Chat/Thread View */}
            {selectedTicket ? (
              <section
                className={`${styles.rightPane} ${
                  activeMobileView === "list" ? styles.rightPaneHideMobile : ""
                }`}
              >
                {/* Chat Header */}
                <div className={styles.chatHeader}>
                  <div className={styles.chatHeaderLeft}>
                    <div className={styles.breadcrumb}>
                      <span>Tickets</span>
                      <span className={styles.breadcrumbSeparator}>&gt;</span>
                      <span className={styles.ticketNumberText}>
                        {selectedTicket.ticketNumber}
                      </span>
                      <span className={styles.breadcrumbSeparator}>•</span>
                      <span style={{ fontSize: "0.78rem", color: "#64748B", fontWeight: "600" }}>
                        {selectedTicket.customerName}
                      </span>
                    </div>
                    <h2 className={styles.selectedTicketHeading}>
                      {selectedTicket.title}
                    </h2>
                  </div>

                  <div className={styles.chatHeaderBadges}>
                    <span
                      className={`${styles.statusBadge} ${getStatusBadgeStyle(
                        selectedTicket.status
                      )}`}
                    >
                      {selectedTicket.status}
                    </span>
                  </div>
                </div>

                {/* Messages Body */}
                <div className={styles.chatMessagesArea}>
                  {selectedTicket.messages.map((msg) => {
                    const isSupport = msg.role === "support";
                    return (
                      <div
                        key={msg.id}
                        className={`${styles.messageRow} ${
                          isSupport ? styles.messageRowSupport : styles.messageRowCustomer
                        }`}
                      >
                        {!isSupport && (
                          <div className={styles.avatarCustomer} title={msg.sender}>
                            {msg.initials}
                          </div>
                        )}

                        <div
                          className={`${styles.messageBubbleContainer} ${
                            isSupport ? styles.bubbleSupportAlign : styles.bubbleCustomerAlign
                          }`}
                        >
                          <div className={styles.messageMeta}>
                            <span className={styles.messageSenderName}>{msg.sender}</span>
                            <span className={styles.messageTimestamp}>{msg.timestamp}</span>
                          </div>

                          <div
                            className={`${styles.messageBubble} ${
                              isSupport ? styles.messageBubbleSupport : styles.messageBubbleCustomer
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>

                        {isSupport && (
                          <div className={styles.avatarSupport} title={msg.sender}>
                            {msg.initials}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Chat Message Input */}
                <form onSubmit={handleSendMessage} className={styles.chatInputFooter}>
                  <div className={styles.inputWrapper}>
                    <input
                      type="text"
                      placeholder="Type a reply to support..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      className={styles.messageTextInput}
                      disabled={selectedTicket.status === "Closed"}
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || isSendingMessage || selectedTicket.status === "Closed"}
                      className={styles.sendBtn}
                      title="Send reply"
                    >
                      {isSendingMessage ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                    </button>
                  </div>
                </form>
              </section>
            ) : (
              <div className={styles.emptyPane}>
                <div className={styles.emptyPaneContent}>
                  <MessageSquare size={44} color="#CBD5E1" />
                  <h3>{tickets.length === 0 ? "No Active Support Tickets" : "Select a Ticket"}</h3>
                  <p>
                    {tickets.length === 0
                      ? "Have questions about subscriptions, payouts, or menu operations? Our support team is here to assist you."
                      : "Choose a ticket from the left panel to inspect details and send responses."}
                  </p>
                  {tickets.length === 0 && (
                    <button
                      type="button"
                      className={styles.raiseTicketBtnLarge}
                      onClick={() => setIsCreateModalOpen(true)}
                    >
                      <Plus size={18} />
                      <span>Raise a Support Ticket</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 3. Raise Ticket Modal Dialog */}
      {isCreateModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsCreateModalOpen(false)}>
          <div
            className={styles.modalContainer}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <h3 className={styles.modalTitle}>Raise Support Ticket</h3>
                <p className={styles.modalSubtitle}>
                  Submit an inquiry or issue to our operations and technical team.
                </p>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsCreateModalOpen(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Category <span className={styles.formLabelRequired}>*</span>
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className={styles.formSelect}
                  >
                    {TICKET_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Subject / Title <span className={styles.formLabelRequired}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Question regarding weekly payout deduction"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className={styles.formInput}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Description / Details <span className={styles.formLabelRequired}>*</span>
                  </label>
                  <textarea
                    placeholder="Explain the issue or question in detail. Mention order IDs, subscriber names, or error messages if applicable..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className={styles.formTextarea}
                    rows={4}
                    required
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmittingTicket}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnSubmit}
                  disabled={isSubmittingTicket}
                >
                  {isSubmittingTicket ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>Submit Ticket</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Toast Notification */}
      {toastMessage && (
        <div
          className={`${styles.toast} ${
            toastType === "error" ? styles.toastError : styles.toastSuccess
          }`}
        >
          {toastType === "error" ? (
            <AlertCircle size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default SellerSupport;
