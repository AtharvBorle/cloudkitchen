"use client";

import React, { useState } from "react";
import ConsoleSidebar from "../sidebar/Sidebar";
import Topbar from "../nav/Topbar";
import {
  Search,
  Paperclip,
  Send,
  Menu,
  Plus,
  ArrowLeft,
} from "lucide-react";
import styles from "./SellerSupport.module.css";

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
  category: "Technical" | "Billing" | "Feature Request" | "Operations";
  title: string;
  preview: string;
  customerName: string;
  customerInitials: string;
  time: string;
  status: "Open" | "In Progress" | "Closed" | "Resolved";
  priority: "High" | "Medium" | "Low";
  messages: TicketMessage[];
}

const INITIAL_TICKETS: Ticket[] = [
  {
    id: "1",
    ticketNumber: "#0824",
    category: "Technical",
    title: "Login issue on mobile app",
    preview: "I cannot log into my account on the mobile app. It keeps showing an error after entering my credentials.",
    customerName: "Sarah Johnson",
    customerInitials: "SJ",
    time: "10:30 AM",
    status: "Open",
    priority: "High",
    messages: [
      {
        id: "m1",
        sender: "Sarah Johnson",
        role: "customer",
        initials: "SJ",
        timestamp: "Jun 15, 2024 10:30 AM",
        text: "I cannot log into my account on the mobile app. It keeps showing an error after entering my credentials.",
      },
      {
        id: "m2",
        sender: "You (Support)",
        role: "support",
        initials: "ME",
        timestamp: "Jun 15, 2024 10:45 AM",
        text: "Hi Sarah, I apologize for the inconvenience. Could you please tell me which device and OS version you are using?",
      },
      {
        id: "m3",
        sender: "Sarah Johnson",
        role: "customer",
        initials: "SJ",
        timestamp: "Jun 15, 2024 11:00 AM",
        text: "I am using an iPhone 14 Pro with iOS 17.2.",
      },
    ],
  },
  {
    id: "2",
    ticketNumber: "#0823",
    category: "Billing",
    title: "Payment not processed",
    preview: "My payment for order #1209 failed but the money was debited from my bank account.",
    customerName: "Mike Chen",
    customerInitials: "MC",
    time: "Yesterday",
    status: "In Progress",
    priority: "High",
    messages: [
      {
        id: "m2-1",
        sender: "Mike Chen",
        role: "customer",
        initials: "MC",
        timestamp: "Jun 14, 2024 04:12 PM",
        text: "My payment for order #1209 failed but the money was debited from my bank account.",
      },
      {
        id: "m2-2",
        sender: "You (Support)",
        role: "support",
        initials: "ME",
        timestamp: "Jun 14, 2024 04:25 PM",
        text: "Hi Mike, we are checking with the payment gateway. If debited, it will auto-refund in 2-3 business days or settle to your order.",
      },
    ],
  },
  {
    id: "3",
    ticketNumber: "#0820",
    category: "Feature Request",
    title: "Feature request: Dark mode",
    preview: "The interface is very bright at night, having dark mode would be awesome!",
    customerName: "Emma Wilson",
    customerInitials: "EW",
    time: "Mar 10",
    status: "Closed",
    priority: "Low",
    messages: [
      {
        id: "m3-1",
        sender: "Emma Wilson",
        role: "customer",
        initials: "EW",
        timestamp: "Mar 10, 2024 09:15 AM",
        text: "The interface is very bright at night, having dark mode would be awesome!",
      },
      {
        id: "m3-2",
        sender: "You (Support)",
        role: "support",
        initials: "ME",
        timestamp: "Mar 10, 2024 10:00 AM",
        text: "Thanks for the suggestion Emma! We have logged this with our product design team.",
      },
    ],
  },
  {
    id: "4",
    ticketNumber: "#0819",
    category: "Technical",
    title: "Cannot export reports",
    preview: "When clicking the export CSV button nothing happens on the reports screen.",
    customerName: "David Brown",
    customerInitials: "DB",
    time: "Apr 2",
    status: "Open",
    priority: "Medium",
    messages: [
      {
        id: "m4-1",
        sender: "David Brown",
        role: "customer",
        initials: "DB",
        timestamp: "Apr 2, 2024 02:40 PM",
        text: "When clicking the export CSV button nothing happens on the reports screen.",
      },
    ],
  },
];

import { useSellerProfile } from "@/hooks/useSellerProfile";

export interface SellerSupportProps {
  ownerName?: string;
  partnerRole?: string;
  avatarInitials?: string;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
}

const FILTER_PILLS = ["All", "Open", "In Progress", "Closed"];

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
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [selectedTicketId, setSelectedTicketId] = useState<string>("1");
  const [activeMobileView, setActiveMobileView] = useState<"list" | "chat">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Open");
  const [inputMessage, setInputMessage] = useState("");

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || ticket.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const handleSelectTicket = (id: string) => {
    setSelectedTicketId(id);
    setActiveMobileView("chat");
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedTicket) return;

    const newMessage: TicketMessage = {
      id: `m_${Date.now()}`,
      sender: "You (Support)",
      role: "support",
      initials: "ME",
      timestamp: "Just now",
      text: inputMessage.trim(),
    };

    setTickets((prev) =>
      prev.map((t) =>
        t.id === selectedTicket.id
          ? { ...t, messages: [...t.messages, newMessage] }
          : t
      )
    );

    setInputMessage("");
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

  const getPriorityBadgeStyle = (priority: Ticket["priority"]) => {
    switch (priority) {
      case "High":
        return styles.priorityHigh;
      case "Medium":
        return styles.priorityMedium;
      case "Low":
        return styles.priorityLow;
      default:
        return styles.priorityMedium;
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
            onSearch={onSearch}
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
                    {selectedTicket?.title}
                  </h1>
                  <span className={styles.mobileChatSubtitle}>
                    {selectedTicket?.customerName}
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

              {/* Mobile Chat Priority Row */}
              <div className={styles.mobileChatPriorityBar}>
                <span className={styles.priorityLabel}>Priority</span>
                <span
                  className={`${styles.priorityBadge} ${getPriorityBadgeStyle(
                    selectedTicket?.priority || "High"
                  )}`}
                >
                  {selectedTicket?.priority || "High"}
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
                aria-label="Create new ticket"
                onClick={() => alert("Raise ticket dialog")}
              >
                <Plus size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <main className={styles.mainCanvas}>
          <div className={styles.ticketLayout}>
            {/* Left Column: Filter & Tickets List */}
            <section
              className={`${styles.leftPane} ${
                activeMobileView === "chat" ? styles.leftPaneHideMobile : ""
              }`}
            >
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
                {filteredTickets.map((ticket) => {
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
                            {ticket.customerName}
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
                })}

                {filteredTickets.length === 0 && (
                  <div className={styles.emptyListState}>
                    <p>No tickets found under &quot;{statusFilter}&quot;</p>
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
                    </div>
                    <h2 className={styles.selectedTicketHeading}>
                      {selectedTicket.title}
                    </h2>
                  </div>

                  <div className={styles.chatHeaderBadges}>
                    <span
                      className={`${styles.priorityBadge} ${getPriorityBadgeStyle(
                        selectedTicket.priority
                      )}`}
                    >
                      {selectedTicket.priority}
                    </span>
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
                          <div className={styles.avatarCustomer}>
                            {msg.initials}
                          </div>
                        )}

                        <div
                          className={`${styles.messageBubbleContainer} ${
                            isSupport ? styles.bubbleSupportAlign : styles.bubbleCustomerAlign
                          }`}
                        >
                          <div
                            className={`${styles.messageBubble} ${
                              isSupport ? styles.messageBubbleSupport : styles.messageBubbleCustomer
                            }`}
                          >
                            {msg.text}
                          </div>

                          <span className={styles.messageTimestamp}>
                            {msg.timestamp.split(" ").slice(-2).join(" ") || msg.timestamp}
                          </span>
                        </div>

                        {isSupport && (
                          <div className={styles.avatarSupport}>
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
                      placeholder="Type a message..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      className={styles.messageTextInput}
                    />
                    <button
                      type="button"
                      className={styles.attachmentBtn}
                      title="Attach file"
                    >
                      <Paperclip size={18} />
                    </button>
                    <button
                      type="submit"
                      disabled={!inputMessage.trim()}
                      className={styles.sendBtn}
                      title="Send message"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </form>
              </section>
            ) : (
              <div className={styles.emptyPane}>
                <p>Select a ticket to view conversation</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SellerSupport;
