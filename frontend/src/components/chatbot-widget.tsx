"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { MessageSquare, X, Send, User, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";

interface Message {
    id: string;
    sender: "bot" | "user";
    text: string;
    timestamp: Date;
    isTicketForm?: boolean;
    isTicketSuccess?: boolean;
    ticketId?: string;
}

const FAQS = [
    { id: "faq_food", question: "🍔 How to order food?", answer: "To order homely food, click 'Explore Food' on the home page, select a kitchen from the list, add delicious items to your cart, and complete checkout using COD or ONLINE payment." },
    { id: "faq_room", question: "🛌 How to book rooms?", answer: "To book a cozy room, click 'Explore Rooms' on the home page, select your preferred stay, choose your check-in/check-out dates, and confirm the booking." },
    { id: "faq_seller", question: "🚀 Register as seller?", answer: "Partner with us! Go to the home page and click 'Become a Seller'. Provide your business details, upload Aadhaar card images (Front & Back) and optional FSSAI license. Superadmin will verify and approve your registration." },
    { id: "faq_payment", question: "💳 Payment & Refunds?", answer: "We support Cash on Delivery (COD) and secure Online Payments via Razorpay. For payment failures or refunds, please raise a support ticket, and our team will resolve it within 24-48 hours." },
    { id: "faq_ticket", question: "🎟️ Raise support ticket", answer: "You can raise a support ticket directly from this chat to connect with our support agents. Click the 'Raise Support Ticket' form below to submit your concern." }
];

export default function ChatbotWidget() {
    const { data: session, status } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            sender: "bot",
            text: "Hello! I am Mansi, your smart support assistant. How can I help you today? You can select a quick question below or ask me anything directly!",
            timestamp: new Date()
        }
    ]);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showFAQs, setShowFAQs] = useState(true);

    // Ticket Form States
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

    const handleSendMessage = (text: string) => {
        if (!text.trim()) return;

        // User Message
        const userMsg: Message = {
            id: `msg_${Date.now()}`,
            sender: "user",
            text,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputText("");
        setIsTyping(true);
        setShowFAQs(false);

        // Simulate human response delay
        setTimeout(() => {
            setIsTyping(false);
            const normalizedText = text.toLowerCase();
            let replyText = "";

            if (normalizedText.includes("hello") || normalizedText.includes("hi") || normalizedText.includes("hey")) {
                replyText = "Hello! I'm Mansi. Hope you are having a wonderful day! What can I help you with?";
            } else if (normalizedText.includes("food") || normalizedText.includes("order") || normalizedText.includes("eat") || normalizedText.includes("lunch") || normalizedText.includes("menu")) {
                replyText = FAQS[0].answer;
            } else if (normalizedText.includes("room") || normalizedText.includes("book") || normalizedText.includes("stay") || normalizedText.includes("hostel") || normalizedText.includes("pg")) {
                replyText = FAQS[1].answer;
            } else if (normalizedText.includes("seller") || normalizedText.includes("partner") || normalizedText.includes("kitchen") || normalizedText.includes("register") || normalizedText.includes("join")) {
                replyText = FAQS[2].answer;
            } else if (normalizedText.includes("pay") || normalizedText.includes("refund") || normalizedText.includes("money") || normalizedText.includes("razorpay") || normalizedText.includes("upi")) {
                replyText = FAQS[3].answer;
            } else if (normalizedText.includes("ticket") || normalizedText.includes("support") || normalizedText.includes("human") || normalizedText.includes("complain") || normalizedText.includes("agent")) {
                replyText = "Sure! You can raise a support ticket directly from this chat panel so our super admin can assist you directly.";
                setMessages(prev => [
                    ...prev,
                    { id: `bot_${Date.now()}`, sender: "bot", text: replyText, timestamp: new Date() },
                    { id: `form_${Date.now()}`, sender: "bot", text: "Ticket Form", timestamp: new Date(), isTicketForm: true }
                ]);
                return;
            } else {
                replyText = "I couldn't quite find an answer for that. Would you like to raise a support ticket to connect with our human support team?";
                setMessages(prev => [
                    ...prev,
                    { id: `bot_${Date.now()}`, sender: "bot", text: replyText, timestamp: new Date() },
                    { id: `form_${Date.now()}`, sender: "bot", text: "Ticket Form", timestamp: new Date(), isTicketForm: true }
                ]);
                return;
            }

            setMessages(prev => [
                ...prev,
                { id: `bot_${Date.now()}`, sender: "bot", text: replyText, timestamp: new Date() }
            ]);
        }, 1000);
    };

    const handleFAQClick = (faq: typeof FAQS[0]) => {
        // Render user clicking
        const userMsg: Message = {
            id: `faq_u_${Date.now()}`,
            sender: "user",
            text: faq.question,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);
        setShowFAQs(false);

        setTimeout(() => {
            setIsTyping(false);
            if (faq.id === "faq_ticket") {
                setMessages(prev => [
                    ...prev,
                    { id: `faq_b_${Date.now()}`, sender: "bot", text: faq.answer, timestamp: new Date() },
                    { id: `form_${Date.now()}`, sender: "bot", text: "Ticket Form", timestamp: new Date(), isTicketForm: true }
                ]);
            } else {
                setMessages(prev => [
                    ...prev,
                    { id: `faq_b_${Date.now()}`, sender: "bot", text: faq.answer, timestamp: new Date() }
                ]);
            }
        }, 800);
    };

    const handleTicketSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (status !== "authenticated") {
            alert("Please log in to raise a support ticket.");
            return;
        }
        if (!ticketTitle.trim() || !ticketDesc.trim()) {
            alert("Please fill out both the title and description.");
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
                // Append success message to thread
                setMessages(prev => {
                    // Filter out the active ticket form from this chat
                    const cleaned = prev.map(m => m.isTicketForm ? { ...m, isTicketForm: false, text: "Support Ticket Request Sent" } : m);
                    return [
                        ...cleaned,
                        {
                            id: `success_${Date.now()}`,
                            sender: "bot",
                            text: `Successfully raised ticket! Status is OPEN. Ticket Reference ID: ${data.id || data.data?.id || 'Ref'}`,
                            timestamp: new Date(),
                            isTicketSuccess: true,
                            ticketId: data.id || data.data?.id
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
                    width: "380px",
                    height: "550px",
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
                                <span style={{ fontSize: "0.75rem", color: "#10B981", fontWeight: "600" }}>● Support Agent (Online)</span>
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

                    {/* Messages Body */}
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
                                    <div style={{
                                        backgroundColor: "white",
                                        padding: "16px",
                                        borderRadius: "14px",
                                        border: "1px solid #E2E8F0",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                                        maxWidth: "90%",
                                        alignSelf: "flex-start",
                                        marginTop: "5px"
                                    }}>
                                        <div style={{ fontWeight: "700", fontSize: "0.85rem", color: "#1E293B", marginBottom: "12px", borderBottom: "1px solid #F1F5F9", paddingBottom: "6px" }}>
                                            📝 Raise Support Ticket
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
                                                        placeholder="Quick summary..."
                                                        value={ticketTitle}
                                                        onChange={(e) => setTicketTitle(e.target.value)}
                                                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8rem" }}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ display: "block", fontSize: "0.7rem", fontWeight: "700", color: "#64748B", marginBottom: "4px" }}>DESCRIPTION</label>
                                                    <textarea
                                                        placeholder="Explain your problem..."
                                                        rows={2}
                                                        value={ticketDesc}
                                                        onChange={(e) => setTicketDesc(e.target.value)}
                                                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8rem", resize: "none" }}
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
                                    <div style={{
                                        maxWidth: "80%",
                                        padding: "12px 16px",
                                        borderRadius: "14px",
                                        fontSize: "0.85rem",
                                        lineHeight: "1.4",
                                        alignSelf: msg.sender === "bot" ? "flex-start" : "flex-end",
                                        backgroundColor: msg.sender === "bot" ? "white" : "#1E293B",
                                        color: msg.sender === "bot" ? "#334155" : "white",
                                        boxShadow: msg.sender === "bot" ? "0 2px 8px rgba(0,0,0,0.03)" : "none",
                                        border: msg.sender === "bot" ? "1px solid #E2E8F0" : "none"
                                    }}>
                                        {msg.text}
                                        {msg.isTicketSuccess && msg.ticketId && (
                                            <div style={{ marginTop: "10px", borderTop: "1px solid #E2E8F0", paddingTop: "8px" }}>
                                                <Link
                                                    href={session?.user.role === "SELLER" ? "/dashboard/seller/support" : "/dashboard/user/support"}
                                                    style={{ color: "#10B981", fontWeight: "700", textDecoration: "underline", fontSize: "0.8rem", display: "inline-flex", alignItems: "center" }}
                                                    onClick={() => setIsOpen(false)}
                                                >
                                                    View in Dashboard <ChevronRight size={14} />
                                                </Link>
                                            </div>
                                        )}
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

                    {/* FAQ Buttons Bar (Static / Collapsible) */}
                    {showFAQs && (
                        <div style={{
                            padding: "10px 15px",
                            backgroundColor: "white",
                            borderTop: "1px solid #F1F5F9",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px"
                        }}>
                            <span style={{ fontSize: "0.7rem", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Quick FAQs:</span>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                {FAQS.map(faq => (
                                    <button
                                        key={faq.id}
                                        onClick={() => handleFAQClick(faq)}
                                        style={{
                                            padding: "6px 12px",
                                            borderRadius: "16px",
                                            border: "1px solid #CBD5E1",
                                            backgroundColor: "#F8FAFC",
                                            fontSize: "0.75rem",
                                            fontWeight: "600",
                                            color: "#475569",
                                            cursor: "pointer",
                                            transition: "all 0.2s"
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = "#E2E8F0";
                                            e.currentTarget.style.borderColor = "#94A3B8";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = "#F8FAFC";
                                            e.currentTarget.style.borderColor = "#CBD5E1";
                                        }}
                                    >
                                        {faq.question}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input Bar */}
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
                            placeholder="Type a message..."
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
