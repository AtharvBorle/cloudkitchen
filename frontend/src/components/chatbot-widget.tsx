"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { MessageSquare, X, Send, User, ChevronRight, Loader2, Sparkles, ChevronLeft, ShoppingBag, BedDouble, HelpCircle } from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";

interface Message {
    id: string;
    sender: "bot" | "user";
    text: string;
    timestamp: Date;
    options?: { label: string; action: () => void }[];
    isTicketForm?: boolean;
    ticketData?: {
        title: string;
        category: string;
        description: string;
    };
    isTicketSuccess?: boolean;
    ticketId?: string;
    ordersList?: any[];
    bookingsList?: any[];
}

export default function ChatbotWidget() {
    const { data: session, status } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    // Active Ticket Form states inside Chatbot (for pre-filled or custom ticket)
    const [ticketCategory, setTicketCategory] = useState("FOOD");
    const [ticketTitle, setTicketTitle] = useState("");
    const [ticketDesc, setTicketDesc] = useState("");
    const [submittingTicket, setSubmittingTicket] = useState(false);

    const messageEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen, isTyping]);

    // Initial greeting on mount / reset
    const loadGreeting = () => {
        setMessages([
            {
                id: "welcome",
                sender: "bot",
                text: "Hello! I am Mansi, your automated helper assistant. What can I help you with today? Please select an option below:",
                timestamp: new Date(),
                options: [
                    { label: "📦 Issues with an Order", action: () => handleSelectOption("orders") },
                    { label: "🛌 Issues with a Room Booking", action: () => handleSelectOption("bookings") },
                    { label: "🚀 Register as a Seller", action: () => handleSelectOption("seller_info") },
                    { label: "💳 Payment & Refund policy", action: () => handleSelectOption("payments_info") },
                    { label: "🎟️ Raise a custom support ticket", action: () => handleSelectOption("custom_ticket") }
                ]
            }
        ]);
    };

    useEffect(() => {
        loadGreeting();
    }, [status]);

    const showTypingIndicator = (callback: () => void, delay = 800) => {
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            callback();
        }, delay);
    };

    const handleSelectOption = async (optionType: string, payload?: any) => {
        // Append User selection message
        let userText = "";
        switch (optionType) {
            case "orders": userText = "📦 Issues with an Order"; break;
            case "bookings": userText = "🛌 Issues with a Room Booking"; break;
            case "seller_info": userText = "🚀 Register as a Seller"; break;
            case "payments_info": userText = "💳 Payment & Refund policy"; break;
            case "custom_ticket": userText = "🎟️ Raise a custom support ticket"; break;
            case "show_order_options": userText = `Order Details #${payload.id.slice(0, 8)}`; break;
            case "show_booking_options": userText = `Booking Details #${payload.id.slice(0, 8)}`; break;
            case "select_order_issue": userText = payload.issueLabel; break;
            case "select_booking_issue": userText = payload.issueLabel; break;
            case "back_to_menu": userText = "🏠 Back to main menu"; break;
            default: userText = optionType;
        }

        setMessages(prev => [...prev, {
            id: `u_${Date.now()}`,
            sender: "user",
            text: userText,
            timestamp: new Date()
        }]);

        // Bot responds
        showTypingIndicator(async () => {
            if (optionType === "back_to_menu") {
                loadGreeting();
                return;
            }

            if (optionType === "orders") {
                if (status !== "authenticated") {
                    setMessages(prev => [...prev, {
                        id: `b_${Date.now()}`,
                        sender: "bot",
                        text: "To view your orders and get order-specific support, you need to be logged in first.",
                        timestamp: new Date(),
                        options: [
                            { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                        ]
                    }]);
                    return;
                }

                try {
                    const res = await fetchApi("/api/user/orders");
                    const data = await res.json();
                    const orders = (data.data || data || []).slice(0, 5); // top 5 recent orders

                    if (orders.length === 0) {
                        setMessages(prev => [...prev, {
                            id: `b_${Date.now()}`,
                            sender: "bot",
                            text: "I couldn't find any recent orders associated with your account. Would you like to raise a general support ticket?",
                            timestamp: new Date(),
                            options: [
                                { label: "🎟️ Yes, raise custom ticket", action: () => handleSelectOption("custom_ticket") },
                                { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                            ]
                        }]);
                    } else {
                        setMessages(prev => [...prev, {
                            id: `b_${Date.now()}`,
                            sender: "bot",
                            text: "Please select the order you are experiencing issues with:",
                            timestamp: new Date(),
                            ordersList: orders,
                            options: [
                                { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                            ]
                        }]);
                    }
                } catch (error) {
                    setMessages(prev => [...prev, {
                        id: `b_${Date.now()}`,
                        sender: "bot",
                        text: "An error occurred while fetching your orders. Please raise a general support ticket.",
                        timestamp: new Date(),
                        options: [
                            { label: "🎟️ Raise ticket", action: () => handleSelectOption("custom_ticket") },
                            { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                        ]
                    }]);
                }
            }

            else if (optionType === "show_order_options") {
                const order = payload;
                setMessages(prev => [...prev, {
                    id: `b_${Date.now()}`,
                    sender: "bot",
                    text: `Order #${order.id.slice(0, 8)} details:\n- Total: ₹${order.totalAmount}\n- Status: ${order.status}\n- Kitchen: ${order.seller?.businessName || "Partner Seller"}\n\nWhat is the nature of your concern?`,
                    timestamp: new Date(),
                    options: [
                        { label: "🍕 Problem with items (missing/spoiled)", action: () => handleSelectOption("select_order_issue", { order, issueLabel: "🍕 Problem with items", issueType: "ITEM_ISSUE" }) },
                        { label: "🛵 Delivery delayed / didn't arrive", action: () => handleSelectOption("select_order_issue", { order, issueLabel: "🛵 Delivery delayed", issueType: "DELAYED" }) },
                        { label: "❌ Request to Cancel this order", action: () => handleSelectOption("select_order_issue", { order, issueLabel: "❌ Request cancellation", issueType: "CANCEL_REQUEST" }) },
                        { label: "💰 Charged incorrect amount", action: () => handleSelectOption("select_order_issue", { order, issueLabel: "💰 Charged incorrect amount", issueType: "CHARGE_ISSUE" }) },
                        { label: "🎟️ Other issues (talk to admin)", action: () => handleSelectOption("select_order_issue", { order, issueLabel: "🎟️ Other issues", issueType: "OTHER_ORDER_ISSUE" }) },
                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                    ]
                }]);
            }

            else if (optionType === "select_order_issue") {
                const { order, issueLabel, issueType } = payload;
                const generatedTitle = `Order Issue: ${issueLabel} (#${order.id.slice(0, 8)})`;
                const generatedDesc = `Order Reference: #${order.id}\nIssue Type: ${issueLabel}\nOrder Date: ${new Date(order.createdAt).toLocaleDateString()}\nTotal Amount: ₹${order.totalAmount}\nKitchen Business: ${order.seller?.businessName || "Unknown"}\nStatus: ${order.status}\n\nPlease describe the issue below or submit this ticket directly to support.`;

                setTicketCategory("FOOD");
                setTicketTitle(generatedTitle);
                setTicketDesc(generatedDesc);

                setMessages(prev => [...prev, {
                    id: `b_${Date.now()}`,
                    sender: "bot",
                    text: "I have prepared a support ticket request based on your order. You can customize the details below and click Submit to log this with our support team:",
                    timestamp: new Date(),
                    isTicketForm: true,
                    ticketData: {
                        title: generatedTitle,
                        category: "FOOD",
                        description: generatedDesc
                    }
                }]);
            }

            else if (optionType === "bookings") {
                if (status !== "authenticated") {
                    setMessages(prev => [...prev, {
                        id: `b_${Date.now()}`,
                        sender: "bot",
                        text: "To view your bookings and raise stay-specific queries, you need to sign in.",
                        timestamp: new Date(),
                        options: [
                            { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                        ]
                    }]);
                    return;
                }

                try {
                    const res = await fetchApi("/api/user/bookings");
                    const data = await res.json();
                    const bookings = (data.data || data || []).slice(0, 5); // top 5 recent bookings

                    if (bookings.length === 0) {
                        setMessages(prev => [...prev, {
                            id: `b_${Date.now()}`,
                            sender: "bot",
                            text: "I couldn't find any recent stays or bookings. Would you like to raise a custom support ticket?",
                            timestamp: new Date(),
                            options: [
                                { label: "🎟️ Raise ticket", action: () => handleSelectOption("custom_ticket") },
                                { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                            ]
                        }]);
                    } else {
                        setMessages(prev => [...prev, {
                            id: `b_${Date.now()}`,
                            sender: "bot",
                            text: "Please select the stay/room booking you are experiencing issues with:",
                            timestamp: new Date(),
                            bookingsList: bookings,
                            options: [
                                { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                            ]
                        }]);
                    }
                } catch (error) {
                    setMessages(prev => [...prev, {
                        id: `b_${Date.now()}`,
                        sender: "bot",
                        text: "An error occurred while fetching your bookings.",
                        timestamp: new Date(),
                        options: [
                            { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                        ]
                    }]);
                }
            }

            else if (optionType === "show_booking_options") {
                const booking = payload;
                setMessages(prev => [...prev, {
                    id: `b_${Date.now()}`,
                    sender: "bot",
                    text: `Booking Stay Details:\n- Room: ${booking.room?.title || "Property Room"}\n- Price: ₹${booking.totalPrice}\n- Check-In: ${new Date(booking.checkIn).toLocaleDateString()}\n- Check-Out: ${new Date(booking.checkOut).toLocaleDateString()}\n- Status: ${booking.status}\n\nWhat concern do you have?`,
                    timestamp: new Date(),
                    options: [
                        { label: "❌ Request Stay Cancellation", action: () => handleSelectOption("select_booking_issue", { booking, issueLabel: "❌ Request Stay Cancellation", issueType: "CANCEL" }) },
                        { label: "🔑 Check-In / Check-Out issues", action: () => handleSelectOption("select_booking_issue", { booking, issueLabel: "🔑 Check-in/out issues", issueType: "CHECKIN" }) },
                        { label: "🏡 Bad room condition / lack of services", action: () => handleSelectOption("select_booking_issue", { booking, issueLabel: "🏡 Bad room condition", issueType: "CONDITION" }) },
                        { label: "🎟️ Other room support", action: () => handleSelectOption("select_booking_issue", { booking, issueLabel: "🎟️ Other room support", issueType: "OTHER" }) },
                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                    ]
                }]);
            }

            else if (optionType === "select_booking_issue") {
                const { booking, issueLabel } = payload;
                const generatedTitle = `Stay Issue: ${issueLabel} (#${booking.id.slice(0, 8)})`;
                const generatedDesc = `Booking Reference: #${booking.id}\nRoom Title: ${booking.room?.title || "Stay"}\nCheck-in: ${new Date(booking.checkIn).toLocaleDateString()}\nCheck-out: ${new Date(booking.checkOut).toLocaleDateString()}\nTotal Paid: ₹${booking.totalPrice}\nStatus: ${booking.status}\n\nProblem details: [${issueLabel}]`;

                setTicketCategory("ROOM");
                setTicketTitle(generatedTitle);
                setTicketDesc(generatedDesc);

                setMessages(prev => [...prev, {
                    id: `b_${Date.now()}`,
                    sender: "bot",
                    text: "I have compiled stay details for your support ticket. Please customize below and submit:",
                    timestamp: new Date(),
                    isTicketForm: true,
                    ticketData: {
                        title: generatedTitle,
                        category: "ROOM",
                        description: generatedDesc
                    }
                }]);
            }

            else if (optionType === "seller_info") {
                setMessages(prev => [...prev, {
                    id: `b_${Date.now()}`,
                    sender: "bot",
                    text: "Want to partner with us as a Seller? You can register by clicking 'Become a Seller' on the homepage. Provide business details, Aadhaar card front/back, and FSSAI certificate. If you have registration issues, raise a ticket below:",
                    timestamp: new Date(),
                    options: [
                        { label: "🎟️ Raise ticket for Seller support", action: () => handleSelectOption("custom_ticket_prefilled", { category: "OTHER", title: "Seller Registration Inquiry", desc: "I have inquiries about registering as a seller on the platform." }) },
                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                    ]
                }]);
            }

            else if (optionType === "payments_info") {
                setMessages(prev => [...prev, {
                    id: `b_${Date.now()}`,
                    sender: "bot",
                    text: "We support Cash on Delivery (COD) and Online Payments via secure Razorpay interface. Refunds for cancellations are initiated immediately and reflected within 24-48 business hours. If you faced payment deduction without booking, please submit details:",
                    timestamp: new Date(),
                    options: [
                        { label: "🎟️ Raise ticket for Payment deduction", action: () => handleSelectOption("custom_ticket_prefilled", { category: "PAYMENT", title: "Payment deduction failure", desc: "Money was deducted from my account but booking/order failed. Please verify." }) },
                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                    ]
                }]);
            }

            else if (optionType === "custom_ticket_prefilled") {
                const { category, title, desc } = payload;
                setTicketCategory(category);
                setTicketTitle(title);
                setTicketDesc(desc);

                setMessages(prev => [...prev, {
                    id: `b_${Date.now()}`,
                    sender: "bot",
                    text: "Please verify and submit your support ticket details:",
                    timestamp: new Date(),
                    isTicketForm: true,
                    ticketData: {
                        title,
                        category,
                        description: desc
                    }
                }]);
            }

            else if (optionType === "custom_ticket") {
                setTicketCategory("FOOD");
                setTicketTitle("");
                setTicketDesc("");

                setMessages(prev => [...prev, {
                    id: `b_${Date.now()}`,
                    sender: "bot",
                    text: "Please fill out the ticket form below to log your inquiry directly with the super admin:",
                    timestamp: new Date(),
                    isTicketForm: true
                }]);
            }
        });
    };

    const handleSendMessage = (text: string) => {
        if (!text.trim()) return;

        // Add user text
        setMessages(prev => [...prev, {
            id: `msg_u_${Date.now()}`,
            sender: "user",
            text,
            timestamp: new Date()
        }]);
        setInputText("");

        showTypingIndicator(() => {
            const normalizedText = text.toLowerCase();
            let replyText = "";
            let generatedOptions: { label: string; action: () => void }[] = [];

            if (normalizedText.includes("hello") || normalizedText.includes("hi") || normalizedText.includes("hey")) {
                replyText = "Hello! I am Mansi, your support helper. How can I help you today? Please choose an issue area:";
                generatedOptions = [
                    { label: "📦 Issues with an Order", action: () => handleSelectOption("orders") },
                    { label: "🛌 Issues with a Room Booking", action: () => handleSelectOption("bookings") },
                    { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                ];
            } else if (normalizedText.includes("food") || normalizedText.includes("order") || normalizedText.includes("item")) {
                replyText = "It looks like you have issues or queries related to food orders. Would you like to select a recent order to get help?";
                generatedOptions = [
                    { label: "📦 Select an Order", action: () => handleSelectOption("orders") },
                    { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                ];
            } else if (normalizedText.includes("room") || normalizedText.includes("book") || normalizedText.includes("stay")) {
                replyText = "It looks like you have stay or room booking queries. Would you like to view your bookings?";
                generatedOptions = [
                    { label: "🛌 View Stay Bookings", action: () => handleSelectOption("bookings") },
                    { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                ];
            } else if (normalizedText.includes("refund") || normalizedText.includes("pay") || normalizedText.includes("money") || normalizedText.includes("failed")) {
                replyText = "For payment and refund concerns, check out our support guidelines or raise a payment ticket:";
                generatedOptions = [
                    { label: "💳 View Payment Policies", action: () => handleSelectOption("payments_info") },
                    { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                ];
            } else {
                replyText = "I couldn't quite analyze that message. Would you like to raise a support ticket to speak with a human support agent directly?";
                generatedOptions = [
                    { label: "🎟️ Raise a support ticket", action: () => handleSelectOption("custom_ticket") },
                    { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                ];
            }

            setMessages(prev => [...prev, {
                id: `msg_b_${Date.now()}`,
                sender: "bot",
                text: replyText,
                timestamp: new Date(),
                options: generatedOptions
            }]);
        });
    };

    const handleTicketSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (status !== "authenticated") {
            alert("Please log in to raise a support ticket.");
            return;
        }
        if (!ticketTitle.trim() || !ticketDesc.trim()) {
            alert("Please provide both a title and description.");
            return;
        }

        setSubmittingTicket(true);
        try {
            const res = await fetchApi("/api/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: ticketTitle.trim(),
                    description: ticketDesc.trim(),
                    category: ticketCategory
                })
            });
            const data = await res.json();
            if (res.ok) {
                // Clear inputs
                setTicketTitle("");
                setTicketDesc("");
                
                // Clear active forms and show ticket creation success message
                setMessages(prev => {
                    const cleaned = prev.map(m => m.isTicketForm ? { ...m, isTicketForm: false, text: "Support Ticket request submitted." } : m);
                    return [
                        ...cleaned,
                        {
                            id: `success_${Date.now()}`,
                            sender: "bot",
                            text: `Successfully raised your support ticket! Ticket status is OPEN. Reference ID: ${data.id || data.data?.id || 'Ref'}`,
                            timestamp: new Date(),
                            isTicketSuccess: true,
                            ticketId: data.id || data.data?.id,
                            options: [
                                { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                            ]
                        }
                    ];
                });
            } else {
                alert(data.message || "Failed to submit ticket.");
            }
        } catch (error) {
            console.error("Error raising ticket in chatbot:", error);
            alert("An error occurred. Please try again.");
        } finally {
            setSubmittingTicket(false);
        }
    };

    return (
        <div style={{ position: "fixed", bottom: "30px", right: "30px", zIndex: 9999 }}>
            
            {/* Chatbot Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        backgroundColor: "#1E293B",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                        border: "none",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        position: "relative"
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.1)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                    }}
                >
                    <MessageSquare size={28} />
                    <span style={{
                        position: "absolute",
                        top: "-5px",
                        right: "-5px",
                        backgroundColor: "#F16F68",
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        border: "2px solid white"
                    }} />
                </button>
            )}

            {/* Chatbot Window */}
            {isOpen && (
                <div style={{
                    width: "min(400px, 90vw)",
                    height: "min(600px, calc(100vh - 100px))",
                    backgroundColor: "white",
                    borderRadius: "20px",
                    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.15)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    border: "1px solid #E2E8F0",
                    transition: "all 0.3s ease"
                }}>
                    
                    {/* Header */}
                    <div style={{
                        background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
                        padding: "20px",
                        color: "white",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                backgroundColor: "#334155",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: "2px solid #10B981"
                            }}>
                                <User size={20} color="#10B981" />
                            </div>
                            <div>
                                <div style={{ fontWeight: "700", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "5px" }}>
                                    Mansi <Sparkles size={14} color="#10B981" fill="#10B981" />
                                </div>
                                <span style={{ fontSize: "0.75rem", color: "#10B981", fontWeight: "600" }}>● Support Assistant (Online)</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{
                                background: "none",
                                border: "none",
                                color: "white",
                                opacity: 0.7,
                                cursor: "pointer",
                                padding: "4px"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = "0.7"}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Chat Messages Body */}
                    <div style={{
                        flex: 1,
                        padding: "20px",
                        overflowY: "auto",
                        backgroundColor: "#F8FAFC",
                        display: "flex",
                        flexDirection: "column",
                        gap: "15px"
                    }}>
                        {messages.map((msg) => (
                            <div key={msg.id} style={{ display: "flex", flexDirection: "column" }}>
                                
                                {msg.isTicketForm ? (
                                    /* Support Ticket Form */
                                    <div style={{
                                        backgroundColor: "white",
                                        padding: "16px",
                                        borderRadius: "14px",
                                        border: "1px solid #E2E8F0",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                                        maxWidth: "92%",
                                        alignSelf: "flex-start",
                                        marginTop: "5px"
                                    }}>
                                        <div style={{ fontWeight: "700", fontSize: "0.85rem", color: "#1E293B", marginBottom: "12px", borderBottom: "1px solid #F1F5F9", paddingBottom: "6px" }}>
                                            📝 Submit Support Ticket
                                        </div>
                                        {status !== "authenticated" ? (
                                            <div style={{ fontSize: "0.8rem", color: "#EF4444", fontWeight: "600", textAlign: "center" }}>
                                                Please log in to submit support tickets.
                                            </div>
                                        ) : (
                                            <form onSubmit={handleTicketSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                                <div>
                                                    <label style={{ display: "block", fontSize: "0.7rem", fontWeight: "700", color: "#64748B", marginBottom: "4px" }}>CATEGORY</label>
                                                    <select
                                                        value={ticketCategory}
                                                        onChange={(e) => setTicketCategory(e.target.value)}
                                                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8rem" }}
                                                    >
                                                        <option value="FOOD">Food Delivery</option>
                                                        <option value="ROOM">Room Stay</option>
                                                        <option value="PAYMENT">Payment & Refund</option>
                                                        <option value="OTHER">Other Query</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label style={{ display: "block", fontSize: "0.7rem", fontWeight: "700", color: "#64748B", marginBottom: "4px" }}>TITLE / SUBJECT</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Title Summary..."
                                                        value={ticketTitle}
                                                        onChange={(e) => setTicketTitle(e.target.value)}
                                                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8rem" }}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ display: "block", fontSize: "0.7rem", fontWeight: "700", color: "#64748B", marginBottom: "4px" }}>DESCRIPTION</label>
                                                    <textarea
                                                        placeholder="Explain the problem..."
                                                        rows={3}
                                                        value={ticketDesc}
                                                        onChange={(e) => setTicketDesc(e.target.value)}
                                                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.85rem", resize: "none" }}
                                                        required
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={submittingTicket}
                                                    style={{
                                                        width: "100%",
                                                        padding: "10px",
                                                        borderRadius: "8px",
                                                        backgroundColor: "#10B981",
                                                        color: "white",
                                                        fontWeight: "700",
                                                        fontSize: "0.8rem",
                                                        border: "none",
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: "6px",
                                                        boxShadow: "0 2px 6px rgba(16, 185, 129, 0.2)"
                                                    }}
                                                >
                                                    {submittingTicket ? <Loader2 className="animate-spin" size={14} /> : "Submit Ticket"}
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                ) : (
                                    /* Normal Text Bubble */
                                    <div style={{
                                        maxWidth: "85%",
                                        padding: "12px 16px",
                                        borderRadius: "14px",
                                        fontSize: "0.85rem",
                                        lineHeight: "1.4",
                                        alignSelf: msg.sender === "bot" ? "flex-start" : "flex-end",
                                        backgroundColor: msg.sender === "bot" ? "white" : "#1E293B",
                                        color: msg.sender === "bot" ? "#334155" : "white",
                                        boxShadow: msg.sender === "bot" ? "0 2px 8px rgba(0,0,0,0.03)" : "none",
                                        border: msg.sender === "bot" ? "1px solid #E2E8F0" : "none",
                                        whiteSpace: "pre-line"
                                    }}>
                                        {msg.text}
                                        {msg.isTicketSuccess && msg.ticketId && (
                                            <div style={{ marginTop: "10px", borderTop: "1px solid #E2E8F0", paddingTop: "8px" }}>
                                                <Link
                                                    href={session?.user.role === "SELLER" ? "/dashboard/seller/support" : "/dashboard/user/support"}
                                                    style={{ color: "#10B981", fontWeight: "700", textDecoration: "underline", fontSize: "0.8rem", display: "inline-flex", alignItems: "center" }}
                                                    onClick={() => setIsOpen(false)}
                                                >
                                                    View Ticket Status <ChevronRight size={14} />
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Render Interactive Order Selection Cards */}
                                {msg.ordersList && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px", maxWidth: "90%", alignSelf: "flex-start" }}>
                                        {msg.ordersList.map(order => (
                                            <button
                                                key={order.id}
                                                onClick={() => handleSelectOption("show_order_options", order)}
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "flex-start",
                                                    backgroundColor: "white",
                                                    border: "1px solid #CBD5E1",
                                                    padding: "12px",
                                                    borderRadius: "10px",
                                                    cursor: "pointer",
                                                    textAlign: "left",
                                                    width: "100%",
                                                    transition: "transform 0.15s, border-color 0.15s"
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.borderColor = "var(--coral, #F16F68)";
                                                    e.currentTarget.style.transform = "scale(1.02)";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.borderColor = "#CBD5E1";
                                                    e.currentTarget.style.transform = "scale(1)";
                                                }}
                                            >
                                                <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#64748B", display: "flex", alignItems: "center", gap: "4px" }}>
                                                    <ShoppingBag size={12} /> ORDER #{order.id.slice(0, 8)}
                                                </span>
                                                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#1E293B", marginTop: "4px" }}>
                                                    ₹{order.totalAmount} • {new Date(order.createdAt).toLocaleDateString()}
                                                </span>
                                                <span style={{ fontSize: "0.75rem", color: "#10B981", fontWeight: "600", marginTop: "2px" }}>
                                                    Status: {order.status}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Render Interactive Booking Selection Cards */}
                                {msg.bookingsList && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px", maxWidth: "90%", alignSelf: "flex-start" }}>
                                        {msg.bookingsList.map(booking => (
                                            <button
                                                key={booking.id}
                                                onClick={() => handleSelectOption("show_booking_options", booking)}
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "flex-start",
                                                    backgroundColor: "white",
                                                    border: "1px solid #CBD5E1",
                                                    padding: "12px",
                                                    borderRadius: "10px",
                                                    cursor: "pointer",
                                                    textAlign: "left",
                                                    width: "100%",
                                                    transition: "transform 0.15s, border-color 0.15s"
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.borderColor = "var(--coral, #F16F68)";
                                                    e.currentTarget.style.transform = "scale(1.02)";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.borderColor = "#CBD5E1";
                                                    e.currentTarget.style.transform = "scale(1)";
                                                }}
                                            >
                                                <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#64748B", display: "flex", alignItems: "center", gap: "4px" }}>
                                                    <BedDouble size={12} /> STAY #{booking.id.slice(0, 8)}
                                                </span>
                                                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#1E293B", marginTop: "4px" }}>
                                                    {booking.room?.title || "Cozy Room"}
                                                </span>
                                                <span style={{ fontSize: "0.75rem", color: "#475569", marginTop: "2px" }}>
                                                    Check-In: {new Date(booking.checkIn).toLocaleDateString()}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Interactive Quick Action Buttons/Chips */}
                                {msg.options && msg.options.length > 0 && (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px", maxWidth: "95%", alignSelf: "flex-start" }}>
                                        {msg.options.map((opt, i) => (
                                            <button
                                                key={i}
                                                onClick={opt.action}
                                                style={{
                                                    padding: "6px 12px",
                                                    borderRadius: "16px",
                                                    border: "1px solid #CBD5E1",
                                                    backgroundColor: "white",
                                                    fontSize: "0.75rem",
                                                    fontWeight: "600",
                                                    color: "#475569",
                                                    cursor: "pointer",
                                                    transition: "all 0.15s"
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = "#F1F5F9";
                                                    e.currentTarget.style.borderColor = "#94A3B8";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = "white";
                                                    e.currentTarget.style.borderColor = "#CBD5E1";
                                                }}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <span style={{
                                    fontSize: "0.65rem",
                                    color: "#94A3B8",
                                    alignSelf: msg.sender === "bot" ? "flex-start" : "flex-end",
                                    marginTop: "4px",
                                    padding: "0 4px"
                                }}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}

                        {/* Typing indicator */}
                        {isTyping && (
                            <div style={{ display: "flex", gap: "6px", alignSelf: "flex-start", backgroundColor: "white", padding: "12px 18px", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                                <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#94A3B8", animation: "bounce 1.4s infinite ease-in-out both" }} />
                                <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#94A3B8", animation: "bounce 1.4s infinite ease-in-out both 0.2s" }} />
                                <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#94A3B8", animation: "bounce 1.4s infinite ease-in-out both 0.4s" }} />
                                <style jsx>{`
                                    @keyframes bounce {
                                        0%, 80%, 100% { transform: scale(0); }
                                        40% { transform: scale(1.0); }
                                    }
                                `}</style>
                            </div>
                        )}

                        <div ref={messageEndRef} />
                    </div>

                    {/* Bottom Input bar */}
                    <div style={{
                        padding: "15px",
                        borderTop: "1px solid #E2E8F0",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        backgroundColor: "white"
                    }}>
                        <input
                            type="text"
                            placeholder="Type details or query..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputText)}
                            style={{
                                flex: 1,
                                padding: "10px 14px",
                                borderRadius: "24px",
                                border: "1px solid #CBD5E1",
                                fontSize: "0.85rem",
                                outline: "none"
                            }}
                        />
                        <button
                            onClick={() => handleSendMessage(inputText)}
                            style={{
                                width: "38px",
                                height: "38px",
                                borderRadius: "50%",
                                backgroundColor: "#1E293B",
                                color: "white",
                                border: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyCenter: "center",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                padding: "0",
                                alignSelf: "center",
                                justifyContent: "center"
                            }}
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
