"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquare, X, Send, User, ChevronRight, Loader2, Sparkles, ShoppingBag, BedDouble } from "lucide-react";
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
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [history, setHistory] = useState<Message[][]>([]);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    // Active Ticket Form states inside Chatbot (for pre-filled or custom ticket)
    const [ticketCategory, setTicketCategory] = useState("FOOD");
    const [ticketTitle, setTicketTitle] = useState("");
    const [ticketDesc, setTicketDesc] = useState("");
    const [submittingTicket, setSubmittingTicket] = useState(false);

    // Category Request states for chatbot widget
    const [reqCategoryType, setReqCategoryType] = useState("FOOD"); // "FOOD" or "ROOM"
    const [reqCategoryName, setReqCategoryName] = useState("");

    // Draggable chatbot widget states
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number; moved: boolean }>({
        startX: 0,
        startY: 0,
        posX: 0,
        posY: 0,
        moved: false
    });

    const toggleOpen = (open: boolean) => {
        if (open) {
            setPosition(prev => {
                if (!prev) return null;
                const openWidth = Math.min(400, window.innerWidth * 0.9);
                const openHeight = Math.min(600, window.innerHeight - 100);
                const dx = openWidth - 60;
                const dy = openHeight - 60;
                return {
                    x: Math.max(0, prev.x - dx),
                    y: Math.max(0, prev.y - dy)
                };
            });
            setIsOpen(true);
        } else {
            setPosition(prev => {
                if (!prev) return null;
                const openWidth = containerRef.current ? containerRef.current.getBoundingClientRect().width : Math.min(400, window.innerWidth * 0.9);
                const openHeight = containerRef.current ? containerRef.current.getBoundingClientRect().height : Math.min(600, window.innerHeight - 100);
                const dx = openWidth - 60;
                const dy = openHeight - 60;
                return {
                    x: prev.x + dx,
                    y: prev.y + dy
                };
            });
            setIsOpen(false);
        }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) => {
        const target = e.target as HTMLElement;
        if (target.closest('input') || target.closest('textarea') || target.closest('select') || target.closest('a')) {
            return;
        }
        if (target.closest('button') && !target.closest('.drag-handle-btn') && !target.closest('.drag-handle-header')) {
            return;
        }
        
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        setIsDragging(true);
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            posX: rect.left,
            posY: rect.top,
            moved: false
        };
        
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            dragRef.current.moved = true;
        }
        
        let newX = dragRef.current.posX + dx;
        let newY = dragRef.current.posY + dy;
        
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
            const maxX = window.innerWidth - rect.width;
            const maxY = window.innerHeight - rect.height;
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));
        }
        
        setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement | HTMLButtonElement>) => {
        const target = e.target as HTMLElement;
        if (target.closest('input') || target.closest('textarea') || target.closest('select') || target.closest('a')) {
            return;
        }
        if (target.closest('button') && !target.closest('.drag-handle-btn') && !target.closest('.drag-handle-header')) {
            return;
        }
        
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const touch = e.touches[0];
        setIsDragging(true);
        dragRef.current = {
            startX: touch.clientX,
            startY: touch.clientY,
            posX: rect.left,
            posY: rect.top,
            moved: false
        };
        
        document.addEventListener("touchmove", handleTouchMove, { passive: false });
        document.addEventListener("touchend", handleTouchEnd);
    };

    const handleTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0];
        const dx = touch.clientX - dragRef.current.startX;
        const dy = touch.clientY - dragRef.current.startY;
        
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            dragRef.current.moved = true;
        }
        
        let newX = dragRef.current.posX + dx;
        let newY = dragRef.current.posY + dy;
        
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
            const maxX = window.innerWidth - rect.width;
            const maxY = window.innerHeight - rect.height;
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));
        }
        
        setPosition({ x: newX, y: newY });
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
    };

    useEffect(() => {
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("touchend", handleTouchEnd);
        };
    }, []);

    const messageEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen, isTyping]);

    // Keep chatbot window within viewport boundaries when opened or resized
    useEffect(() => {
        if (!isOpen) return;

        const adjustPosition = () => {
            const container = containerRef.current;
            if (!container) return;
            
            const rect = container.getBoundingClientRect();
            if (position) {
                const maxX = window.innerWidth - rect.width;
                const maxY = window.innerHeight - rect.height;
                const newX = Math.max(0, Math.min(position.x, maxX));
                const newY = Math.max(0, Math.min(position.y, maxY));
                if (newX !== position.x || newY !== position.y) {
                    setPosition({ x: newX, y: newY });
                }
            }
        };

        const handle = requestAnimationFrame(adjustPosition);
        window.addEventListener("resize", adjustPosition);
        
        return () => {
            cancelAnimationFrame(handle);
            window.removeEventListener("resize", adjustPosition);
        };
    }, [isOpen, position]);

    // Initial greeting on mount / reset
    const loadGreeting = () => {
        setHistory([]);
        const isSeller = session?.user?.role === "SELLER";
        const isDelivery = session?.user?.role === "DELIVERY";
        if (isSeller) {
            setMessages([
                {
                    id: "welcome",
                    sender: "bot",
                    text: "Hello! I am Mansi, your seller assistant. How can I assist you with your business today? Please select an option:",
                    timestamp: new Date(),
                    options: [
                        { label: "📈 Received Orders & Sales", action: () => handleSelectOption("seller_orders") },
                        { label: "🍱 Menu & Listings Query", action: () => handleSelectOption("seller_listings") },
                        { label: "💰 Payouts & Subscriptions", action: () => handleSelectOption("seller_payouts") },
                        { label: "🎟️ Raise a custom support ticket", action: () => handleSelectOption("custom_ticket") }
                    ]
                }
            ]);
        } else if (isDelivery) {
            setMessages([
                {
                    id: "welcome",
                    sender: "bot",
                    text: "Hello! I am Mansi, your delivery assistant. How can I help you with your deliveries or wallet today? Please select an option:",
                    timestamp: new Date(),
                    options: [
                        { label: "🛵 My Assigned Orders", action: () => handleSelectOption("delivery_orders") },
                        { label: "💰 Wallet & Earnings", action: () => handleSelectOption("delivery_wallet") },
                        { label: "🎟️ Raise a custom support ticket", action: () => handleSelectOption("custom_ticket") }
                    ]
                }
            ]);
        } else {
            setMessages([
                {
                    id: "welcome",
                    sender: "bot",
                    text: "Hello! I am Mansi, your support assistant. What can I help you with today? Please select an option below:",
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
        }
    };

    useEffect(() => {
        loadGreeting();
    }, [status, session?.user?.role]);

    const handleGoBack = () => {
        if (history.length === 0) return;
        const previousState = history[history.length - 1];
        setMessages(previousState);
        setHistory(prev => prev.slice(0, prev.length - 1));
    };

    useEffect(() => {
        const handleOpenChatbot = () => {
            toggleOpen(true);
            setMessages(prev => {
                if (prev.length > 0 && prev[prev.length - 1].text.includes("resolve your issue here first")) {
                    return prev;
                }
                const isSeller = session?.user?.role === "SELLER";
                const isDelivery = session?.user?.role === "DELIVERY";
                let supportOptions = [];
                if (isSeller) {
                    supportOptions = [
                        { label: "📈 Received Orders & Sales", action: () => handleSelectOption("seller_orders") },
                        { label: "🍱 Menu & Listings Query", action: () => handleSelectOption("seller_listings") },
                        { label: "💰 Payouts & Subscriptions", action: () => handleSelectOption("seller_payouts") },
                        { label: "🎟️ Raise a custom support ticket", action: () => handleSelectOption("custom_ticket") }
                    ];
                } else if (isDelivery) {
                    supportOptions = [
                        { label: "🛵 My Assigned Orders", action: () => handleSelectOption("delivery_orders") },
                        { label: "💰 Wallet, Cash Owed & Earnings", action: () => handleSelectOption("delivery_wallet") },
                        { label: "🎟️ Raise a custom support ticket", action: () => handleSelectOption("custom_ticket") }
                    ];
                } else {
                    supportOptions = [
                        { label: "📦 Issues with an Order", action: () => handleSelectOption("orders") },
                        { label: "🛌 Issues with a Room Booking", action: () => handleSelectOption("bookings") },
                        { label: "🚀 Register as a Seller", action: () => handleSelectOption("seller_info") },
                        { label: "💳 Payment & Refund policy", action: () => handleSelectOption("payments_info") },
                        { label: "🎟️ Raise a custom support ticket", action: () => handleSelectOption("custom_ticket") }
                    ];
                }

                return [
                    ...prev,
                    {
                        id: `support_prompt_${Date.now()}`,
                        sender: "bot",
                        text: "Let's see if we can resolve your issue here first! Please select a relevant option below. If you don't find the answer, click 'Raise a custom support ticket' to submit a ticket directly to support.",
                        timestamp: new Date(),
                        options: supportOptions
                    }
                ];
            });
        };
        window.addEventListener("open-chatbot", handleOpenChatbot);
        return () => {
            window.removeEventListener("open-chatbot", handleOpenChatbot);
        };
    }, [status, session]);

    // Hide chatbot on Superadmin, Admin, Support, and Seller pages
    if (pathname?.startsWith("/dashboard/superadmin") || pathname?.startsWith("/dashboard/admin") || pathname?.startsWith("/admin") || pathname?.startsWith("/dashboard/support") || pathname?.startsWith("/seller")) {
        return null;
    }

    const showTypingIndicator = (callback: () => void, delay = 800) => {
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            callback();
        }, delay);
    };

    const handleSelectOption = async (optionType: string, payload?: any) => {
        // Save current messages to history before making choice
        setHistory(prev => [...prev, messages]);
        // Append User selection message
        let userText = "";
        switch (optionType) {
            case "orders": userText = "📦 Issues with an Order"; break;
            case "seller_orders": userText = "📈 Received Orders & Sales"; break;
            case "seller_listings": userText = "🍱 Menu & Listings Query"; break;
            case "seller_payouts": userText = "💰 Payouts & Subscriptions"; break;
            case "delivery_orders": userText = "🛵 My Assigned Orders"; break;
            case "delivery_wallet": userText = "💰 Wallet & Earnings"; break;
            case "delivery_duty": userText = "⚙️ Shift Duty & Profile Status"; break;
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

            if (optionType === "delivery_orders") {
                if (status !== "authenticated") {
                    setMessages(prev => [...prev, {
                        id: `b_${Date.now()}`,
                        sender: "bot",
                        text: "To view your assigned orders, you need to be logged in first.",
                        timestamp: new Date(),
                        options: [
                            { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                        ]
                    }]);
                    return;
                }

                try {
                    const res = await fetchApi("/api/delivery/orders");
                    const data = await res.json();
                    const orders = (data.orders || []).slice(0, 4); // top 4 recent orders

                    if (orders.length === 0) {
                        setMessages(prev => [...prev, {
                            id: `b_${Date.now()}`,
                            sender: "bot",
                            text: "I couldn't find any recent assigned orders for you. Would you like to raise a support ticket?",
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
                            text: "Please select the assigned order you are experiencing issues with:",
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
                        text: "An error occurred while fetching your assigned orders.",
                        timestamp: new Date(),
                        options: [
                            { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                        ]
                    }]);
                }
            }

            else if (optionType === "delivery_wallet") {
                setMessages(prev => [...prev, {
                    id: `b_${Date.now()}`,
                    sender: "bot",
                    text: "You can track your Cash Owed to Seller and view full transaction logs in the **Wallet & Transactions** tab of your Delivery Dashboard.\n\nWhat is the nature of your concern?",
                    timestamp: new Date(),
                    options: [
                        { label: "🎟️ Cash settlement discrepancy ticket", action: () => handleSelectOption("custom_ticket_prefilled", { category: "PAYMENT", title: "Cash Settlement Discrepancy", desc: "I am raising a query regarding my cash settlement logs or outstanding balance." }) },
                        { label: "🎟️ Manual Adjustment request ticket", action: () => handleSelectOption("custom_ticket_prefilled", { category: "PAYMENT", title: "Manual Adjustment Request", desc: "I need to request a manual adjustment to my delivery wallet balance." }) },
                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                    ]
                }]);
            }

            else if (optionType === "delivery_duty") {
                setMessages(prev => [...prev, {
                    id: `b_${Date.now()}`,
                    sender: "bot",
                    text: "Your active duty status determines if you receive new orders. To toggle your status, update your profile options in the **My Profile** tab.\n\nNeed to report a shift timing or profile configuration issue?",
                    timestamp: new Date(),
                    options: [
                        { label: "🎟️ Profile / Duty timing support ticket", action: () => handleSelectOption("custom_ticket_prefilled", { category: "OTHER", title: "Shift Duty / Profile Issue", desc: "I need help with my duty timing, active status toggle, or contact information." }) },
                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                    ]
                }]);
            }

            else if (optionType === "orders") {
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
                    const orders = (data.data || data || []).slice(0, 4); // top 4 recent orders

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

            else if (optionType === "seller_orders") {
                if (status !== "authenticated") {
                    setMessages(prev => [...prev, {
                        id: `b_${Date.now()}`,
                        sender: "bot",
                        text: "To view your kitchen's received orders, you need to be logged in first.",
                        timestamp: new Date(),
                        options: [
                            { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                        ]
                    }]);
                    return;
                }

                try {
                    const res = await fetchApi("/api/seller/orders");
                    const data = await res.json();
                    const orders = (data.orders || data.data?.orders || data.data || data || []).slice(0, 4); // top 4 recent orders

                    if (orders.length === 0) {
                        setMessages(prev => [...prev, {
                            id: `b_${Date.now()}`,
                            sender: "bot",
                            text: "I couldn't find any recent received orders for your kitchen. Would you like to raise a support ticket?",
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
                            text: "Please select the received order you are experiencing issues with:",
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
                        text: "An error occurred while fetching your kitchen orders.",
                        timestamp: new Date(),
                        options: [
                            { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                        ]
                    }]);
                }
            }

            else if (optionType === "show_order_options") {
                const order = payload;
                const isSeller = session?.user?.role === "SELLER";
                const isDelivery = session?.user?.role === "DELIVERY";
                if (isSeller) {
                    setMessages(prev => [...prev, {
                        id: `b_${Date.now()}`,
                        sender: "bot",
                        text: `Received Order #${order.id.slice(0, 8)} details:\n- Total Sales: ₹${order.totalAmount}\n- Status: ${order.status}\n- Customer Name: ${order.user?.name || "Customer"}\n\nWhat is the nature of your concern?`,
                        timestamp: new Date(),
                        options: [
                            { label: "🛵 Issue with Delivery Boy / Assignment", action: () => handleSelectOption("select_order_issue", { order, issueLabel: "🛵 Delivery Boy issue", issueType: "DELIVERY_ISSUE" }) },
                            { label: "🍕 Food preparation / stock issue", action: () => handleSelectOption("select_order_issue", { order, issueLabel: "🍕 Prep / stock issue", issueType: "PREP_ISSUE" }) },
                            { label: "❌ Request cancellation of this order", action: () => handleSelectOption("select_order_issue", { order, issueLabel: "❌ Request cancellation", issueType: "CANCEL_REQUEST" }) },
                            { label: "🎟️ Other issues (talk to customer care)", action: () => handleSelectOption("select_order_issue", { order, issueLabel: "🎟️ Other issues", issueType: "OTHER_ORDER_ISSUE" }) },
                            { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                        ]
                    }]);
                } else if (isDelivery) {
                    setMessages(prev => [...prev, {
                        id: `b_${Date.now()}`,
                        sender: "bot",
                        text: `Assigned Order #${order.id.slice(0, 8)} details:\n- Total Price: ₹${order.totalAmount}\n- Status: ${order.status}\n- Address: ${order.deliveryAddress ? order.deliveryAddress.split(" | Loc:")[0] : ""}\n\nWhat is the nature of your concern?`,
                        timestamp: new Date(),
                        options: [
                            { label: "📍 Customer address incorrect / unreachable", action: () => handleSelectOption("select_order_issue", { order, issueLabel: "📍 Unreachable customer / bad address", issueType: "ADDRESS_ISSUE" }) },
                            { label: "🍕 Food item damaged / spilled during transit", action: () => handleSelectOption("select_order_issue", { order, issueLabel: "🍕 Damaged food transit", issueType: "DAMAGE_ISSUE" }) },
                            { label: "💵 COD Cash Collection issues", action: () => handleSelectOption("select_order_issue", { order, issueLabel: "💵 Cash Collection issue", issueType: "CASH_ISSUE" }) },
                            { label: "🎟️ Other issues", action: () => handleSelectOption("select_order_issue", { order, issueLabel: "🎟️ Other delivery issues", issueType: "OTHER_DELIVERY_ISSUE" }) },
                            { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                        ]
                    }]);
                } else {
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
                            { label: "🎟️ Other issues (talk to customer care)", action: () => handleSelectOption("select_order_issue", { order, issueLabel: "🎟️ Other issues", issueType: "OTHER_ORDER_ISSUE" }) },
                            { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                        ]
                    }]);
                }
            }

            else if (optionType === "select_order_issue") {
                const { order, issueLabel } = payload;
                const generatedTitle = `Order Issue: ${issueLabel} (#${order.id.slice(0, 8)})`;
                const generatedDesc = `Order Reference: #${order.id}\nIssue Type: ${issueLabel}\nOrder Date: ${new Date(order.createdAt).toLocaleDateString()}\nTotal Amount: ₹${order.totalAmount}\nStatus: ${order.status}\n\nPlease describe the details or submit directly.`;

                setTicketCategory("FOOD");
                setTicketTitle(generatedTitle);
                setTicketDesc(generatedDesc);

                setMessages(prev => [...prev, {
                    id: `b_${Date.now()}`,
                    sender: "bot",
                    text: "I have prepared a support ticket based on the order details. Customize details below and submit to log with customer care:",
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
                    const bookings = (data.data || data || []).slice(0, 4); // top 4 recent bookings

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
                    text: "Want to partner with us as a Seller? You can register directly by clicking the button below. Please prepare your business details, Aadhaar card front/back, and FSSAI certificate. If you have registration issues, raise a ticket below:",
                    timestamp: new Date(),
                    options: [
                        { label: "🤝 Become a Seller", action: () => { window.open("/seller/registration", "_blank"); } },
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

            else if (optionType === "seller_listings") {
                setMessages(prev => [...prev, {
                    id: `b_${Date.now()}`,
                    sender: "bot",
                    text: "To manage your food menu items, kitchen settings, or room stay listings, please navigate to the respective tabs in your Seller Dashboard:\n- 'Manage Menu': Update availability/prices/add items.\n- 'Manage Rooms': Add rooms, check bookings.\n\nIf you want to request a new item/room category or need general support, select an option below:",
                    timestamp: new Date(),
                    options: [
                        { label: "🎟️ Raise ticket for Listings support", action: () => handleSelectOption("custom_ticket_prefilled", { category: "OTHER", title: "Menu/Room listing assistance request", desc: "I need help with configuring my menu items or room stay details." }) },
                        { label: "➕ Request New Item Category", action: () => handleSelectOption("custom_ticket_prefilled", { category: "NEW_CATEGORY_REQUEST", title: "Request New Item Category", desc: "--- Category Request Metadata ---\nRequest Type: Food Category\nRequested Name: [Enter Name]\nParent Category ID: [Enter Parent Category ID]\nParent Category Name: [Enter Parent Category Name]\n\nDetails: Please add more description here..." }) },
                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                    ]
                }]);
            }

            else if (optionType === "seller_payouts") {
                setMessages(prev => [...prev, {
                    id: `b_${Date.now()}`,
                    sender: "bot",
                    text: "Payout details are processed weekly. You can track your subscription plan validity, payouts, and billing cycles in the 'Subscriptions' section of your Seller Dashboard.\n\nIf you missed a payout or have pricing inquiries, raise a ticket:",
                    timestamp: new Date(),
                    options: [
                        { label: "🎟️ Raise ticket for Payout issue", action: () => handleSelectOption("custom_ticket_prefilled", { category: "PAYMENT", title: "Seller payout query", desc: "I am raising a query regarding my recent payout cycle or active subscription plan." }) },
                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                    ]
                }]);
            }

            else if (optionType === "custom_ticket_prefilled") {
                const { category, title, desc } = payload;
                setTicketCategory(category);
                setTicketTitle(title);
                setTicketDesc(desc);

                if (category === "NEW_CATEGORY_REQUEST") {
                    setReqCategoryType("FOOD");
                    setReqCategoryName("");
                }

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
                setReqCategoryType("FOOD");
                setReqCategoryName("");

                setMessages(prev => [...prev, {
                    id: `b_${Date.now()}`,
                    sender: "bot",
                    text: "Please fill out the ticket form below to log your inquiry directly with customer care:",
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

            const isSeller = session?.user?.role === "SELLER";
            const isDelivery = session?.user?.role === "DELIVERY";
            if (isDelivery) {
                // Delivery Query Routing
                if (normalizedText.includes("hello") || normalizedText.includes("hi") || normalizedText.includes("hey") || normalizedText.includes("greetings")) {
                    replyText = "Hello! I am Mansi, your delivery assistant. How can I help you with your deliveries or wallet today?";
                    generatedOptions = [
                        { label: "🛵 My Assigned Orders", action: () => handleSelectOption("delivery_orders") },
                        { label: "💰 Wallet & Earnings", action: () => handleSelectOption("delivery_wallet") },
                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                    ];
                }
                else if (normalizedText.includes("order") || normalizedText.includes("assign") || normalizedText.includes("deliver") || normalizedText.includes("customer") || normalizedText.includes("address") || normalizedText.includes("client")) {
                    replyText = "You can view your active delivery tasks, mark orders as picked up, or confirm cash collection directly in your Delivery Dashboard.\n\nNeed assistance with a specific assigned order?";
                    generatedOptions = [
                        { label: "🛵 View Assigned Orders", action: () => handleSelectOption("delivery_orders") },
                        { label: "🎟️ Raise delivery support ticket", action: () => handleSelectOption("custom_ticket_prefilled", { category: "OTHER", title: "Delivery Order Assistance", desc: "I need help with an order delivery details or status update." }) },
                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                    ];
                }
                else if (normalizedText.includes("wallet") || normalizedText.includes("earning") || normalizedText.includes("cash") || normalizedText.includes("cod") || normalizedText.includes("owe") || normalizedText.includes("settle") || normalizedText.includes("pay") || normalizedText.includes("money") || normalizedText.includes("balance") || normalizedText.includes("adjustment")) {
                    replyText = "Your wallet logs display Cash Owed to Seller and transaction histories (COD Collections, Settlements, and Adjustments). Settle your outstanding COD balance directly with your seller partner.\n\nDo you have a balance query?";
                    generatedOptions = [
                        { label: "💰 View Wallet Options", action: () => handleSelectOption("delivery_wallet") },
                        { label: "🎟️ Settle balance ticket", action: () => handleSelectOption("custom_ticket_prefilled", { category: "PAYMENT", title: "Wallet Balance Discrepancy", desc: "I have a discrepancy in my outstanding balance or settlement history." }) },
                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                    ];
                }
                else {
                    replyText = "I couldn't match that query directly. Would you like to raise a support ticket to speak with our support team?";
                    generatedOptions = [
                        { label: "🎟️ Raise a support ticket", action: () => handleSelectOption("custom_ticket") },
                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                    ];
                }
            } else if (isSeller) {
                // Seller Query Routing
                if (normalizedText.includes("hello") || normalizedText.includes("hi") || normalizedText.includes("hey") || normalizedText.includes("greetings")) {
                    replyText = "Hello! I am Mansi, your seller assistant. How can I assist you with your business today?";
                    generatedOptions = [
                        { label: "📈 Received Orders & Sales", action: () => handleSelectOption("seller_orders") },
                        { label: "🍱 Menu & Listings", action: () => handleSelectOption("seller_listings") },
                        { label: "💰 Payouts & Subscriptions", action: () => handleSelectOption("seller_payouts") },
                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                    ];
                }
                else if (normalizedText.includes("order") || normalizedText.includes("sale") || normalizedText.includes("customer") || normalizedText.includes("earning") || normalizedText.includes("revenue")) {
                    replyText = "You can view your received kitchen orders, manage delivery status, or cancel/process orders directly in the [Received Orders](/seller/orders) section of your Seller Dashboard.\n\nNeed assistance with a specific order?";
                    generatedOptions = [
                        { label: "📈 Select recent order", action: () => handleSelectOption("seller_orders") },
                        { label: "🎟️ Raise order support ticket", action: () => handleSelectOption("custom_ticket_prefilled", { category: "FOOD", title: "Seller Order Support", desc: "I need help with a customer order on my kitchen." }) },
                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                    ];
                }
                else if (normalizedText.includes("menu") || normalizedText.includes("listing") || normalizedText.includes("food") || normalizedText.includes("room") || normalizedText.includes("dish") || normalizedText.includes("price") || normalizedText.includes("add") || normalizedText.includes("modify") || normalizedText.includes("create") || normalizedText.includes("category")) {
                    replyText = "To manage your products:\n- **Food Menu**: Go to the 'Manage Menu' section of your Seller Dashboard to add food items, set prices, and update availability.\n- **Room Stays**: Go to the 'Manage Rooms' section to add room types, set prices, and check bookings.\n\nIf the category you need is not listed, you can request a new item/room category or raise a listing ticket:";
                    generatedOptions = [
                        { label: "🎟️ Raise listing ticket", action: () => handleSelectOption("custom_ticket_prefilled", { category: "OTHER", title: "Listing configuration support", desc: "I need help configuring my kitchen food menu or room booking listings." }) },
                        { label: "➕ Request New Item Category", action: () => handleSelectOption("custom_ticket_prefilled", { category: "NEW_CATEGORY_REQUEST", title: "Request New Item Category", desc: "--- Category Request Metadata ---\nRequest Type: Food Category\nRequested Name: [Enter Name]\nParent Category ID: [Enter Parent Category ID]\nParent Category Name: [Enter Parent Category Name]\n\nDetails: Please add more description here..." }) },
                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                    ];
                }
                else if (normalizedText.includes("pay") || normalizedText.includes("payout") || normalizedText.includes("money") || normalizedText.includes("billing") || normalizedText.includes("subscription") || normalizedText.includes("plan") || normalizedText.includes("fee") || normalizedText.includes("commission")) {
                    replyText = "Seller payouts are processed weekly. You can track your active subscription plan validity, billing history, and payout logs in the **Subscriptions** section of your Seller Dashboard.\n\nIf you have a payout discrepancy, raise a support ticket below:";
                    generatedOptions = [
                        { label: "🎟️ Payout support ticket", action: () => handleSelectOption("custom_ticket_prefilled", { category: "PAYMENT", title: "Seller Payout Inquiry", desc: "I have questions about my weekly payout cycle or subscription plan details." }) },
                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                    ];
                }
                else if (normalizedText.includes("profile") || normalizedText.includes("account") || normalizedText.includes("business") || normalizedText.includes("address") || normalizedText.includes("phone") || normalizedText.includes("email") || normalizedText.includes("password")) {
                    replyText = "You can update your personal contact info, business location, and account password in the profile section.\n\nFor major modifications (like shop name, GSTIN, FSSAI certificate updates, or bank info details), raise a verification ticket:";
                    generatedOptions = [
                        { label: "🎟️ Update account details ticket", action: () => handleSelectOption("custom_ticket_prefilled", { category: "OTHER", title: "Seller Account Details Modification", desc: "I need to request manual verification to update my official FSSAI / Aadhaar / business details." }) },
                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                    ];
                }
                else if (normalizedText.includes("pending") || normalizedText.includes("approve") || normalizedText.includes("verify") || normalizedText.includes("document") || normalizedText.includes("aadhaar") || normalizedText.includes("fssai") || normalizedText.includes("register")) {
                    replyText = "Superadmins manually verify all registered sellers. Please check that you uploaded a clear front/back of your Aadhaar card and a valid FSSAI certificate. Verification takes 24-48 business hours.\n\nIf you are stuck pending approval, raise a ticket:";
                    generatedOptions = [
                        { label: "🎟️ Registration support ticket", action: () => handleSelectOption("custom_ticket_prefilled", { category: "OTHER", title: "Seller Registration Pending Approval", desc: "My seller account is still pending verification. Please review my uploaded documents." }) },
                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                    ];
                }
                else {
                    replyText = "I couldn't match that query directly. Would you like to raise a support ticket to speak with superadmin support directly?";
                    generatedOptions = [
                        { label: "🎟️ Raise a support ticket", action: () => handleSelectOption("custom_ticket") },
                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                    ];
                }
            } else {
                // User / Customer Query Routing
                if (normalizedText.includes("hello") || normalizedText.includes("hi") || normalizedText.includes("hey") || normalizedText.includes("greetings")) {
                    replyText = "Hello! I am Mansi, your support assistant. How can I help you today? Please choose an issue area or type your question:";
                    generatedOptions = [
                        { label: "📦 Issues with an Order", action: () => handleSelectOption("orders") },
                        { label: "🛌 Issues with a Room Booking", action: () => handleSelectOption("bookings") },
                        { label: "🤝 Become a Seller", action: () => handleSelectOption("seller_info") },
                        { label: "💳 Payment & Refund policy", action: () => handleSelectOption("payments_info") },
                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                    ];
                }
                else if (normalizedText.includes("food") || normalizedText.includes("order") || normalizedText.includes("item") || normalizedText.includes("dish") || normalizedText.includes("delivery") || normalizedText.includes("menu") || normalizedText.includes("buy")) {
                    replyText = "To order delicious food, browse our active cloud kitchens at our [Explore Food](/explore-desktop) page. You can add items to your cart, set your delivery address, and proceed to checkout.\n\nIf you want to track a recent order or report missing/incorrect food items, select below:";
                    generatedOptions = [
                        { label: "📦 Select recent order", action: () => handleSelectOption("orders") },
                        { label: "🎟️ Raise order support ticket", action: () => handleSelectOption("custom_ticket_prefilled", { category: "FOOD", title: "Food order assistance request", desc: "I need help with my food order delivery or quality." }) },
                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                    ];
                }
                else if (normalizedText.includes("room") || normalizedText.includes("book") || normalizedText.includes("stay") || normalizedText.includes("hotel") || normalizedText.includes("check-in") || normalizedText.includes("checkin") || normalizedText.includes("check-out") || normalizedText.includes("checkout") || normalizedText.includes("time") || normalizedText.includes("date")) {
                    replyText = "You can book comfortable stays on our [Book a Room](/room-booking) page. Note these rules:\n- **Check-in time**: 12:00 PM\n- **Check-out time**: 11:00 AM\n- **Overlapping dates**: Check-in on day X is allowed if the previous booking checkout was on day X at 11:00 AM.\n- **Calendar status**: Available dates are colored **green**, booked dates are **red**.\n\nTo view or manage bookings, select below:";
                    generatedOptions = [
                        { label: "🛌 View Stay Bookings", action: () => handleSelectOption("bookings") },
                        { label: "🎟️ Stay support ticket", action: () => handleSelectOption("custom_ticket_prefilled", { category: "ROOM", title: "Room stay assistance request", desc: "I have inquiries or issues with my room booking/dates." }) },
                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                    ];
                }
                else if (normalizedText.includes("cancel") || normalizedText.includes("refund") || normalizedText.includes("money") || normalizedText.includes("deduct") || normalizedText.includes("failed") || normalizedText.includes("pay") || normalizedText.includes("payment")) {
                    replyText = "We support Cash on Delivery (COD) and secure online payment via Razorpay. \n- **Cancellations**: Refunds for cancellations are initiated immediately and reflect in 24-48 business hours.\n- **Payment deductions**: If money was deducted but booking/order failed, raise a ticket below for immediate refund processing.";
                    generatedOptions = [
                        { label: "💳 View Payment Policies", action: () => handleSelectOption("payments_info") },
                        { label: "🎟️ Payment support ticket", action: () => handleSelectOption("custom_ticket_prefilled", { category: "PAYMENT", title: "Payment deduction failure", desc: "Money was deducted from my account but booking/order failed. Please verify." }) },
                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                    ];
                }
                else if (normalizedText.includes("seller") || normalizedText.includes("partner") || normalizedText.includes("register") || normalizedText.includes("shop") || normalizedText.includes("business")) {
                    replyText = "Want to partner with us as a Seller? You can register directly by clicking the button below. Please prepare your business details, Aadhaar card front/back, and FSSAI certificate. If you have registration issues, raise a ticket below:";
                    generatedOptions = [
                        { label: "🤝 Become a Seller", action: () => { window.open("/seller/registration", "_blank"); } },
                        { label: "🎟️ Raise ticket for Seller support", action: () => handleSelectOption("custom_ticket_prefilled", { category: "OTHER", title: "Seller Registration Inquiry", desc: "I have inquiries about registering as a seller on the platform." }) },
                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                    ];
                }
                else if (normalizedText.includes("profile") || normalizedText.includes("account") || normalizedText.includes("password") || normalizedText.includes("details") || normalizedText.includes("change") || normalizedText.includes("edit") || normalizedText.includes("address")) {
                    replyText = "You can manage your saved addresses, default delivery coordinates, profile name, and password in your [User Profile](/dashboard/user/profile).\n\nMake sure to set a default location pin to display kitchens delivering to your zone!";
                    generatedOptions = [
                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                    ];
                }
                else {
                    replyText = "I couldn't match that query directly. Would you like to raise a support ticket to speak with customer care directly?";
                    generatedOptions = [
                        { label: "🎟️ Raise a support ticket", action: () => handleSelectOption("custom_ticket") },
                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                    ];
                }
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
        // Save current messages to history before submitting ticket
        setHistory(prev => [...prev, messages]);
        if (status !== "authenticated") {
            alert("Please log in to raise a support ticket.");
            return;
        }

        let finalTitle = ticketTitle.trim();
        let finalDescription = ticketDesc.trim();

        if (ticketCategory === "NEW_CATEGORY_REQUEST") {
            if (!reqCategoryName.trim()) {
                alert("Please enter the requested category name.");
                return;
            }
            finalTitle = `Request Category: ${reqCategoryName.trim()} (${reqCategoryType})`;
            finalDescription = `--- Category Request Metadata ---
Request Type: ${reqCategoryType === "FOOD" ? "Food Category" : "Room Category"}
Requested Name: ${reqCategoryName.trim()}

Details: Category request submitted via chatbot assistant.`;
        } else {
            if (!finalTitle || !finalDescription) {
                alert("Please provide both a title and description.");
                return;
            }
        }

        setSubmittingTicket(true);
        try {
            const res = await fetchApi("/api/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: finalTitle,
                    description: finalDescription,
                    category: ticketCategory
                })
            });
            const data = await res.json();
            if (res.ok) {
                // Clear inputs
                setTicketTitle("");
                setTicketDesc("");
                setReqCategoryName("");
                
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

    const renderMessageText = (text: string) => {
        const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const parts: (string | React.ReactNode)[] = [];
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text)) !== null) {
            const [fullMatch, linkText, linkUrl] = match;
            const index = match.index;

            if (index > lastIndex) {
                parts.push(text.substring(lastIndex, index));
            }

            const isExternal = linkUrl.startsWith("http");
            if (isExternal) {
                parts.push(
                    <a
                        key={index}
                        href={linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#10B981", fontWeight: "700", textDecoration: "underline" }}
                    >
                        {linkText}
                    </a>
                );
            } else {
                parts.push(
                    <Link
                        key={index}
                        href={linkUrl}
                        style={{ color: "#10B981", fontWeight: "700", textDecoration: "underline" }}
                        onClick={() => toggleOpen(false)}
                    >
                        {linkText}
                    </Link>
                );
            }

            lastIndex = regex.lastIndex;
        }

        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }

        return parts.length > 0 ? parts : text;
    };

    const currentStyle: React.CSSProperties = position 
        ? {
            position: "fixed",
            left: `${position.x}px`,
            top: `${position.y}px`,
            zIndex: 9999,
          }
        : {
            position: "fixed",
            bottom: "30px",
            right: "30px",
            zIndex: 9999,
          };

    return (
        <div ref={containerRef} style={currentStyle}>
            
            {/* Chatbot Toggle Button */}
            {!isOpen && (
                <button
                    className="drag-handle-btn"
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    onClick={(e) => {
                        if (dragRef.current.moved) {
                            e.preventDefault();
                            return;
                        }
                        toggleOpen(true);
                    }}
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
                        cursor: isDragging ? "grabbing" : "grab",
                        transition: isDragging ? "none" : "all 0.3s ease",
                        position: "relative"
                    }}
                    onMouseEnter={(e) => {
                        if (!isDragging) e.currentTarget.style.transform = "scale(1.1)";
                    }}
                    onMouseLeave={(e) => {
                        if (!isDragging) e.currentTarget.style.transform = "scale(1)";
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
                    transition: isDragging ? "none" : "all 0.3s ease"
                }}>
                    
                    {/* Header */}
                    <div 
                        className="drag-handle-header"
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleTouchStart}
                        style={{
                            background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
                            padding: "20px",
                            color: "white",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            cursor: isDragging ? "grabbing" : "grab",
                            userSelect: "none"
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {history.length > 0 && (
                                <button
                                    onClick={handleGoBack}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "white",
                                        opacity: 0.8,
                                        cursor: "pointer",
                                        padding: "4px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginRight: "4px",
                                        transition: "transform 0.2s"
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.15)"}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                                    title="Go back"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <line x1="19" y1="12" x2="5" y2="12"></line>
                                        <polyline points="12 19 5 12 12 5"></polyline>
                                    </svg>
                                </button>
                            )}
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
                            onClick={() => toggleOpen(false)}
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
                                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center", padding: "10px 0" }}>
                                                <div style={{ fontSize: "0.8rem", color: "#EF4444", fontWeight: "600", textAlign: "center" }}>
                                                    Please log in to submit support tickets.
                                                </div>
                                                <Link
                                                    href="/login"
                                                    style={{
                                                        backgroundColor: "#1E293B",
                                                        color: "white",
                                                        padding: "8px 20px",
                                                        borderRadius: "8px",
                                                        fontSize: "0.8rem",
                                                        fontWeight: "700",
                                                        textDecoration: "none",
                                                        textAlign: "center",
                                                        transition: "all 0.2s ease",
                                                        cursor: "pointer",
                                                        boxShadow: "0 4px 12px rgba(30, 41, 59, 0.15)",
                                                        display: "inline-block"
                                                    }}
                                                    onMouseOver={(e) => {
                                                        e.currentTarget.style.backgroundColor = "#0F172A";
                                                        e.currentTarget.style.transform = "translateY(-1px)";
                                                    }}
                                                    onMouseOut={(e) => {
                                                        e.currentTarget.style.backgroundColor = "#1E293B";
                                                        e.currentTarget.style.transform = "translateY(0)";
                                                    }}
                                                >
                                                    🔑 Log In
                                                </Link>
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
                                                        <option value="FOOD">{session?.user?.role === "DELIVERY" ? "Delivery / Order Issue" : "Food Delivery"}</option>
                                                        {session?.user?.role !== "DELIVERY" && <option value="ROOM">Room Stay</option>}
                                                        <option value="PAYMENT">{session?.user?.role === "DELIVERY" ? "COD / Wallet / Payment" : "Payment & Refund"}</option>
                                                        <option value="OTHER">{session?.user?.role === "DELIVERY" ? "Other Delivery Query" : "Other Query"}</option>
                                                        {session?.user?.role === "SELLER" && (
                                                            <option value="NEW_CATEGORY_REQUEST">Request New Item Category</option>
                                                        )}
                                                    </select>
                                                </div>
                                                {ticketCategory === "NEW_CATEGORY_REQUEST" ? (
                                                    <>
                                                        <div>
                                                            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: "700", color: "#64748B", marginBottom: "4px" }}>REQUESTED CATEGORY TYPE</label>
                                                            <select
                                                                value={reqCategoryType}
                                                                onChange={(e) => setReqCategoryType(e.target.value)}
                                                                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8rem" }}
                                                            >
                                                                <option value="FOOD">Food Category</option>
                                                                {session?.user?.role !== "DELIVERY" && <option value="ROOM">Room Category</option>}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: "700", color: "#64748B", marginBottom: "4px" }}>REQUESTED CATEGORY NAME</label>
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. Mocktails, Milkshakes, Suites..."
                                                                value={reqCategoryName}
                                                                onChange={(e) => setReqCategoryName(e.target.value)}
                                                                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8rem" }}
                                                                required
                                                            />
                                                        </div>

                                                    </>
                                                ) : (
                                                    <>
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
                                                    </>
                                                )}
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
                                        {renderMessageText(msg.text)}
                                        {msg.isTicketSuccess && msg.ticketId && (
                                            <div style={{ marginTop: "10px", borderTop: "1px solid #E2E8F0", paddingTop: "8px" }}>
                                                <Link
                                                    href={session?.user.role === "SELLER" ? "/seller/support" : session?.user.role === "DELIVERY" ? "/dashboard/delivery" : "/dashboard/user/support"}
                                                    style={{ color: "#10B981", fontWeight: "700", textDecoration: "underline", fontSize: "0.8rem", display: "inline-flex", alignItems: "center" }}
                                                    onClick={() => toggleOpen(false)}
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
