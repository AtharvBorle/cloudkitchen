"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
    MessageSquare,
    X,
    Send,
    User,
    ChevronRight,
    Loader2,
    Sparkles,
    ShoppingBag,
    BedDouble,
    Paperclip,
    Smile,
    Menu,
    Phone,
    Zap,
    Utensils,
    ArrowLeft
} from "lucide-react";
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

const parseOption = (label: string) => {
    const match = label.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|[\uD83C-\uD83E][\uDC00-\uDFFF]|[\uE000-\uF8FF]|\p{Extended_Pictographic}|\p{Emoji})\s*(.*)$/u);
    if (match) {
        return {
            icon: match[1],
            text: match[2]
        };
    }
    return {
        icon: null,
        text: label
    };
};

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

    // Hidden file input ref for attachment
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                const openWidth = Math.min(420, window.innerWidth * 0.92);
                const openHeight = Math.min(640, window.innerHeight - 80);
                const dx = openWidth - 62;
                const dy = openHeight - 62;
                return {
                    x: Math.max(0, prev.x - dx),
                    y: Math.max(0, prev.y - dy)
                };
            });
            setIsOpen(true);
        } else {
            setPosition(prev => {
                if (!prev) return null;
                const openWidth = containerRef.current ? containerRef.current.getBoundingClientRect().width : Math.min(420, window.innerWidth * 0.92);
                const openHeight = containerRef.current ? containerRef.current.getBoundingClientRect().height : Math.min(640, window.innerHeight - 80);
                const dx = openWidth - 62;
                const dy = openHeight - 62;
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
                    text: "Hello! I am Bitey, your seller assistant.\nHow can I assist you with your business today? Please select an option below:",
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
                    text: "Hello! I am Bitey, your delivery assistant.\nHow can I help you with your deliveries or wallet today? Please select an option below:",
                    timestamp: new Date(),
                    options: [
                        { label: "🛵 My Assigned Orders", action: () => handleSelectOption("delivery_orders") },
                        { label: "💰 Wallet & Earnings", action: () => handleSelectOption("delivery_wallet") },
                        { label: "⚙️ Shift Duty & Profile Status", action: () => handleSelectOption("delivery_duty") },
                        { label: "🎟️ Raise a custom support ticket", action: () => handleSelectOption("custom_ticket") }
                    ]
                }
            ]);
        } else {
            setMessages([
                {
                    id: "welcome",
                    sender: "bot",
                    text: "Hello! I am Bitey, your virtual kitchen assistant.\nHow can I satisfy your support cravings today? Please choose one of the options below:",
                    timestamp: new Date(),
                    options: [
                        { label: "📦 Issues with an Order", action: () => handleSelectOption("orders") },
                        { label: "🛵 Track Delivery Courier", action: () => handleSelectOption("track_delivery") },
                        { label: "💳 Payment & Refund Policy", action: () => handleSelectOption("payments_info") },
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
                if (prev.length > 0 && prev[prev.length - 1].text.includes("satisfy your support cravings")) {
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
                        { label: "⚙️ Shift Duty & Profile Status", action: () => handleSelectOption("delivery_duty") },
                        { label: "🎟️ Raise a custom support ticket", action: () => handleSelectOption("custom_ticket") }
                    ];
                } else {
                    supportOptions = [
                        { label: "📦 Issues with an Order", action: () => handleSelectOption("orders") },
                        { label: "🛵 Track Delivery Courier", action: () => handleSelectOption("track_delivery") },
                        { label: "💳 Payment & Refund Policy", action: () => handleSelectOption("payments_info") },
                        { label: "🎟️ Raise a custom support ticket", action: () => handleSelectOption("custom_ticket") }
                    ];
                }

                return [
                    ...prev,
                    {
                        id: `support_prompt_${Date.now()}`,
                        sender: "bot",
                        text: "Hello! I am Bitey, your virtual kitchen assistant.\nHow can I satisfy your support cravings today? Please choose one of the options below:",
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
            case "track_delivery": userText = "🛵 Track Delivery Courier"; break;
            case "seller_orders": userText = "📈 Received Orders & Sales"; break;
            case "seller_listings": userText = "🍱 Menu & Listings Query"; break;
            case "seller_payouts": userText = "💰 Payouts & Subscriptions"; break;
            case "delivery_orders": userText = "🛵 My Assigned Orders"; break;
            case "delivery_wallet": userText = "💰 Wallet & Earnings"; break;
            case "delivery_duty": userText = "⚙️ Shift Duty & Profile Status"; break;
            case "bookings": userText = "🛌 Issues with a Room Booking"; break;
            case "seller_info": userText = "🚀 Register as a Seller"; break;
            case "payments_info": userText = "💳 Payment & Refund Policy"; break;
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

            if (optionType === "track_delivery") {
                if (status !== "authenticated") {
                    setMessages(prev => [...prev, {
                        id: `b_${Date.now()}`,
                        sender: "bot",
                        text: "To track your live delivery courier and active orders, please log in first.",
                        timestamp: new Date(),
                        options: [
                            { label: "🔑 Log In", action: () => router.push("/login") },
                            { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                        ]
                    }]);
                    return;
                }

                try {
                    const res = await fetchApi("/api/user/orders");
                    const data = await res.json();
                    const orders = (data.data || data || []).slice(0, 4);

                    if (orders.length === 0) {
                        setMessages(prev => [...prev, {
                            id: `b_${Date.now()}`,
                            sender: "bot",
                            text: "You don't have any active delivery orders right now. Once you place an order, live tracking details will appear here!",
                            timestamp: new Date(),
                            options: [
                                { label: "🍕 Browse Food Menu", action: () => { toggleOpen(false); router.push("/explore-desktop"); } },
                                { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                            ]
                        }]);
                    } else {
                        setMessages(prev => [...prev, {
                            id: `b_${Date.now()}`,
                            sender: "bot",
                            text: "Here are your recent orders. Select an order to track delivery status or report courier delays:",
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
                        text: "Unable to retrieve courier status right now. Please raise a support ticket below.",
                        timestamp: new Date(),
                        options: [
                            { label: "🎟️ Raise a support ticket", action: () => handleSelectOption("custom_ticket") },
                            { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                        ]
                    }]);
                }
            }

            else if (optionType === "delivery_orders") {
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
                    const orders = (data.orders || []).slice(0, 4);

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
                    const orders = (data.data || data || []).slice(0, 4);

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
                    const orders = (data.orders || data.data?.orders || data.data || data || []).slice(0, 4);

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

            else if (optionType === "seller_listings") {
                setMessages(prev => [...prev, {
                    id: `b_${Date.now()}`,
                    sender: "bot",
                    text: "You can manage your Food Menu and Room Listings in the **Manage Listings** section of your Seller Dashboard.\n\nWhat would you like assistance with?",
                    timestamp: new Date(),
                    options: [
                        { label: "➕ Request New Item Category", action: () => handleSelectOption("custom_ticket_prefilled", { category: "NEW_CATEGORY_REQUEST", title: "Request New Item Category", desc: "--- Category Request Metadata ---\nRequest Type: Food Category\nRequested Name: [Enter Name]\n\nDetails: Category request submitted via assistant." }) },
                        { label: "🎟️ Raise listing configuration ticket", action: () => handleSelectOption("custom_ticket_prefilled", { category: "OTHER", title: "Seller Listing Issue", desc: "I am experiencing an issue updating or publishing my menu/room items." }) },
                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                    ]
                }]);
            }

            else if (optionType === "seller_payouts") {
                setMessages(prev => [...prev, {
                    id: `b_${Date.now()}`,
                    sender: "bot",
                    text: "Seller payouts are processed on a weekly schedule. Track your active subscription plans and billing receipts in the **Subscriptions** tab.\n\nNeed to raise a payout discrepancy?",
                    timestamp: new Date(),
                    options: [
                        { label: "🎟️ Payout discrepancy ticket", action: () => handleSelectOption("custom_ticket_prefilled", { category: "PAYMENT", title: "Seller Payout Discrepancy", desc: "I have a question or discrepancy regarding my weekly payout settlement or plan deduction." }) },
                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                    ]
                }]);
            }

            else if (optionType === "bookings") {
                if (status !== "authenticated") {
                    setMessages(prev => [...prev, {
                        id: `b_${Date.now()}`,
                        sender: "bot",
                        text: "To view your room bookings, please log in first.",
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
                    const bookings = (data.data || data || []).slice(0, 4);

                    if (bookings.length === 0) {
                        setMessages(prev => [...prev, {
                            id: `b_${Date.now()}`,
                            sender: "bot",
                            text: "I couldn't find any recent bookings under your account. Would you like to raise a general support ticket?",
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
                            text: "Please select the stay booking you need help with:",
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
                        text: "An error occurred while fetching your bookings. Please raise a general support ticket.",
                        timestamp: new Date(),
                        options: [
                            { label: "🎟️ Raise ticket", action: () => handleSelectOption("custom_ticket") },
                            { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                        ]
                    }]);
                }
            }

            else if (optionType === "show_order_options") {
                setMessages(prev => [...prev, {
                    id: `b_${Date.now()}`,
                    sender: "bot",
                    text: `Support for Order #${payload.id.slice(0, 8)} (Status: ${payload.status}):\nWhat issue are you experiencing?`,
                    timestamp: new Date(),
                    options: [
                        { label: "🛵 Delivery Delay / Not Received", action: () => handleSelectOption("select_order_issue", { orderId: payload.id, issueLabel: "Delivery Delay / Not Received", defaultDesc: `Order #${payload.id} is delayed or has not been delivered on time.` }) },
                        { label: "🍲 Missing / Wrong Food Item", action: () => handleSelectOption("select_order_issue", { orderId: payload.id, issueLabel: "Missing / Wrong Food Item", defaultDesc: `Items were missing or incorrect in Order #${payload.id}.` }) },
                        { label: "💸 Refund / Cancellation Request", action: () => handleSelectOption("select_order_issue", { orderId: payload.id, issueLabel: "Refund / Cancellation Request", defaultDesc: `I would like to request a cancellation/refund for Order #${payload.id}.` }) },
                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                    ]
                }]);
            }

            else if (optionType === "show_booking_options") {
                setMessages(prev => [...prev, {
                    id: `b_${Date.now()}`,
                    sender: "bot",
                    text: `Support for Booking #${payload.id.slice(0, 8)}:\nWhat issue are you experiencing?`,
                    timestamp: new Date(),
                    options: [
                        { label: "📅 Reschedule / Modify Dates", action: () => handleSelectOption("select_booking_issue", { bookingId: payload.id, issueLabel: "Reschedule / Modify Dates", defaultDesc: `I would like to request modifying the dates for Booking #${payload.id}.` }) },
                        { label: "❌ Cancellation & Refund", action: () => handleSelectOption("select_booking_issue", { bookingId: payload.id, issueLabel: "Cancellation & Refund", defaultDesc: `I would like to cancel Booking #${payload.id} and receive a refund.` }) },
                        { label: "🏨 Amenities / Check-in Problem", action: () => handleSelectOption("select_booking_issue", { bookingId: payload.id, issueLabel: "Amenities / Check-in Problem", defaultDesc: `I encountered an issue with room amenities or check-in for Booking #${payload.id}.` }) },
                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                    ]
                }]);
            }

            else if (optionType === "select_order_issue") {
                setTicketCategory("FOOD");
                setTicketTitle(`Order Issue: ${payload.issueLabel} (#${payload.orderId.slice(0, 8)})`);
                setTicketDesc(payload.defaultDesc);
                setMessages(prev => [...prev, {
                    id: `b_${Date.now()}`,
                    sender: "bot",
                    text: `I have pre-filled a support ticket for your order issue. You can review or edit the details below and submit:`,
                    timestamp: new Date(),
                    isTicketForm: true
                }]);
            }

            else if (optionType === "select_booking_issue") {
                setTicketCategory("ROOM");
                setTicketTitle(`Booking Issue: ${payload.issueLabel} (#${payload.bookingId.slice(0, 8)})`);
                setTicketDesc(payload.defaultDesc);
                setMessages(prev => [...prev, {
                    id: `b_${Date.now()}`,
                    sender: "bot",
                    text: `I have pre-filled a support ticket for your booking issue. You can review or edit the details below and submit:`,
                    timestamp: new Date(),
                    isTicketForm: true
                }]);
            }

            else if (optionType === "seller_info") {
                setMessages(prev => [...prev, {
                    id: `b_${Date.now()}`,
                    sender: "bot",
                    text: "To partner with us as a Seller, prepare your Aadhaar front/back and FSSAI certificate, then complete our easy registration form!\n\nClick below to open the registration portal:",
                    timestamp: new Date(),
                    options: [
                        { label: "🚀 Register as a Seller", action: () => { window.open("/seller/registration", "_blank"); } },
                        { label: "🎟️ Seller Registration Inquiry", action: () => handleSelectOption("custom_ticket_prefilled", { category: "OTHER", title: "Seller Registration Question", desc: "I have questions regarding registering as a Cloud Kitchen seller." }) },
                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                    ]
                }]);
            }

            else if (optionType === "payments_info") {
                setMessages(prev => [...prev, {
                    id: `b_${Date.now()}`,
                    sender: "bot",
                    text: "💳 **Payment & Refund Policy**\n\n• **Online Payments**: Processed securely via Razorpay.\n• **Cash on Delivery (COD)**: Available for supported zones.\n• **Refunds**: Automatically initiated upon cancellation and processed back to your original payment method in 24-48 business hours.\n• **Payment Deducted but Order Failed?** Submit a ticket below for immediate reversal.",
                    timestamp: new Date(),
                    options: [
                        { label: "🎟️ Payment / Deduction Issue Ticket", action: () => handleSelectOption("custom_ticket_prefilled", { category: "PAYMENT", title: "Payment Failure / Deduction Query", desc: "Money was deducted from my account but the order or booking was not confirmed." }) },
                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                    ]
                }]);
            }

            else if (optionType === "custom_ticket_prefilled") {
                const category = payload?.category || "FOOD";
                const title = payload?.title || "Support Request";
                const desc = payload?.desc || "";

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
                    text: "I've drafted a ticket based on your selection. Review or add additional details below and click Submit Ticket:",
                    timestamp: new Date(),
                    isTicketForm: true,
                    ticketData: {
                        category,
                        title,
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
                if (normalizedText.includes("hello") || normalizedText.includes("hi") || normalizedText.includes("hey") || normalizedText.includes("greetings")) {
                    replyText = "Hello! I am Bitey, your delivery assistant. How can I help you with your deliveries or wallet today?";
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
                if (normalizedText.includes("hello") || normalizedText.includes("hi") || normalizedText.includes("hey") || normalizedText.includes("greetings")) {
                    replyText = "Hello! I am Bitey, your seller assistant. How can I assist you with your business today?";
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
                        { label: "➕ Request New Item Category", action: () => handleSelectOption("custom_ticket_prefilled", { category: "NEW_CATEGORY_REQUEST", title: "Request New Item Category", desc: "--- Category Request Metadata ---\nRequest Type: Food Category\nRequested Name: [Enter Name]\n\nDetails: Category request submitted via assistant." }) },
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
                    replyText = "Hello! I am Bitey, your virtual kitchen assistant. How can I satisfy your support cravings today? Please choose an option or ask a question:";
                    generatedOptions = [
                        { label: "📦 Issues with an Order", action: () => handleSelectOption("orders") },
                        { label: "🛵 Track Delivery Courier", action: () => handleSelectOption("track_delivery") },
                        { label: "💳 Payment & Refund Policy", action: () => handleSelectOption("payments_info") },
                        { label: "🎟️ Raise a custom support ticket", action: () => handleSelectOption("custom_ticket") }
                    ];
                }
                else if (normalizedText.includes("track") || normalizedText.includes("courier") || normalizedText.includes("where") || normalizedText.includes("status")) {
                    replyText = "You can track your live orders and courier location right here. Select your recent order below to view the latest delivery progress:";
                    generatedOptions = [
                        { label: "🛵 Track Delivery Courier", action: () => handleSelectOption("track_delivery") },
                        { label: "📦 Issues with an Order", action: () => handleSelectOption("orders") },
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
                    replyText = "You can book comfortable stays on our [Book a Room](/room-booking) page. Note these rules:\n- **Check-in time**: 12:00 PM\n- **Check-out time**: 11:00 AM\n- **Overlapping dates**: Check-in on day X is allowed if the previous booking checkout was on day X at 11:00 AM.\n- **Calendar status**: Available dates are colored green, booked dates are red.\n\nTo view or manage bookings, select below:";
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
                        { label: "🚀 Register as a Seller", action: () => { window.open("/seller/registration", "_blank"); } },
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
                setTicketTitle("");
                setTicketDesc("");
                setReqCategoryName("");
                
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
                        style={{ color: "#EF4444", fontWeight: "700", textDecoration: "underline" }}
                    >
                        {linkText}
                    </a>
                );
            } else {
                parts.push(
                    <Link
                        key={index}
                        href={linkUrl}
                        style={{ color: "#EF4444", fontWeight: "700", textDecoration: "underline" }}
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
            
            {/* Chatbot Toggle Button (When Closed) */}
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
                        width: "62px",
                        height: "62px",
                        borderRadius: "50%",
                        backgroundColor: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 10px 30px rgba(239, 68, 68, 0.25), 0 4px 12px rgba(0,0,0,0.1)",
                        border: "2.5px solid #FFFFFF",
                        cursor: isDragging ? "grabbing" : "grab",
                        transition: isDragging ? "none" : "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                        position: "relative",
                        overflow: "visible",
                        padding: 0
                    }}
                    onMouseEnter={(e) => {
                        if (!isDragging) e.currentTarget.style.transform = "scale(1.1) translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                        if (!isDragging) e.currentTarget.style.transform = "scale(1) translateY(0)";
                    }}
                    title="Chat with Bitey"
                >
                    <div style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        overflow: "hidden",
                        backgroundColor: "#FFF5F1"
                    }}>
                        <img
                            src="/images/bitey-mascot.png"
                            alt="Bitey Mascot"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                    </div>
                    <span style={{
                        position: "absolute",
                        top: "-2px",
                        right: "-2px",
                        backgroundColor: "#10B981",
                        width: "15px",
                        height: "15px",
                        borderRadius: "50%",
                        border: "2.5px solid white",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
                    }} />
                </button>
            )}
 
            {/* Chatbot Window */}
            {isOpen && (
                <div style={{
                    width: "min(420px, 92vw)",
                    height: "min(640px, calc(100vh - 80px))",
                    backgroundColor: "#FFFDFB",
                    borderRadius: "24px",
                    boxShadow: "0 20px 50px rgba(15, 23, 42, 0.18), 0 6px 20px rgba(239, 68, 68, 0.08)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    border: "1.5px solid #FDE8E1",
                    transition: isDragging ? "none" : "all 0.3s ease"
                }}>
                    
                    {/* Header */}
                    <div 
                        className="drag-handle-header"
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleTouchStart}
                        style={{
                            backgroundColor: "#FFF9F6",
                            padding: "16px 20px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            cursor: isDragging ? "grabbing" : "grab",
                            userSelect: "none",
                            borderBottom: "1.5px solid #FDE8E1"
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{
                                width: "46px",
                                height: "46px",
                                borderRadius: "50%",
                                overflow: "hidden",
                                border: "2px solid #FFFFFF",
                                boxShadow: "0 2px 8px rgba(239, 68, 68, 0.15)",
                                flexShrink: 0,
                                backgroundColor: "#FFEAE4"
                            }}>
                                <img
                                    src="/images/bitey-mascot.png"
                                    alt="Bitey Mascot"
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span style={{ fontWeight: "800", fontSize: "1.05rem", color: "#1E293B", letterSpacing: "-0.2px" }}>
                                        Bitey
                                    </span>
                                    <span style={{
                                        backgroundColor: "#EF4444",
                                        color: "white",
                                        fontSize: "9.5px",
                                        fontWeight: "800",
                                        padding: "2px 6px",
                                        borderRadius: "5px",
                                        letterSpacing: "0.5px",
                                        lineHeight: 1
                                    }}>
                                        BOT
                                    </span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
                                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#10B981" }} />
                                    <span style={{ fontSize: "0.72rem", color: "#10B981", fontWeight: "700" }}>
                                        Support Assistant (Online)
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {history.length > 0 && (
                                <button
                                    onClick={handleGoBack}
                                    style={{
                                        width: "32px",
                                        height: "32px",
                                        borderRadius: "50%",
                                        backgroundColor: "#FFFFFF",
                                        border: "1px solid #FCDCD2",
                                        color: "#64748B",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = "#FEECE5";
                                        e.currentTarget.style.color = "#EF4444";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = "#FFFFFF";
                                        e.currentTarget.style.color = "#64748B";
                                    }}
                                    title="Go back"
                                >
                                    <ArrowLeft size={16} />
                                </button>
                            )}
                            <button
                                onClick={() => loadGreeting()}
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    backgroundColor: "#FFFFFF",
                                    border: "1px solid #FCDCD2",
                                    color: "#EF4444",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    transition: "all 0.2s"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "#FEECE5";
                                    e.currentTarget.style.transform = "scale(1.05)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "#FFFFFF";
                                    e.currentTarget.style.transform = "scale(1)";
                                }}
                                title="Menu / Reset"
                            >
                                <Menu size={16} />
                            </button>
                            <button
                                onClick={() => toggleOpen(false)}
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    backgroundColor: "#FFFFFF",
                                    border: "1px solid #FCDCD2",
                                    color: "#EF4444",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    transition: "all 0.2s"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "#FEECE5";
                                    e.currentTarget.style.transform = "scale(1.05)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "#FFFFFF";
                                    e.currentTarget.style.transform = "scale(1)";
                                }}
                                title="Close"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Chat Messages Body */}
                    <div style={{
                        flex: 1,
                        padding: "16px 18px",
                        overflowY: "auto",
                        backgroundColor: "#FFFDFB",
                        display: "flex",
                        flexDirection: "column",
                        gap: "14px"
                    }}>
                        {/* Centered Date Header */}
                        <div style={{
                            textAlign: "center",
                            margin: "4px 0 6px 0",
                            color: "#94A3B8",
                            fontSize: "0.7rem",
                            fontWeight: "700",
                            letterSpacing: "0.8px",
                            textTransform: "uppercase"
                        }}>
                            TODAY · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>

                        {messages.map((msg) => (
                            <div key={msg.id} style={{ display: "flex", flexDirection: "column" }}>
                                
                                {msg.isTicketForm ? (
                                    /* Support Ticket Form */
                                    <div style={{
                                        backgroundColor: "white",
                                        padding: "18px",
                                        borderRadius: "18px",
                                        border: "1.5px solid #FDE8E1",
                                        boxShadow: "0 4px 16px rgba(239, 68, 68, 0.05)",
                                        maxWidth: "96%",
                                        alignSelf: "flex-start",
                                        marginTop: "4px"
                                    }}>
                                        <div style={{ fontWeight: "800", fontSize: "0.88rem", color: "#1E293B", marginBottom: "12px", borderBottom: "1.5px solid #FEEFEA", paddingBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
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
                                                        backgroundColor: "#EF4444",
                                                        color: "white",
                                                        padding: "8px 20px",
                                                        borderRadius: "10px",
                                                        fontSize: "0.82rem",
                                                        fontWeight: "700",
                                                        textDecoration: "none",
                                                        textAlign: "center",
                                                        transition: "all 0.2s ease",
                                                        cursor: "pointer",
                                                        boxShadow: "0 4px 12px rgba(239, 68, 68, 0.25)",
                                                        display: "inline-block"
                                                    }}
                                                >
                                                    🔑 Log In
                                                </Link>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleTicketSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                                <div>
                                                    <label style={{ display: "block", fontSize: "0.7rem", fontWeight: "800", color: "#64748B", marginBottom: "4px", letterSpacing: "0.5px" }}>CATEGORY</label>
                                                    <select
                                                        value={ticketCategory}
                                                        onChange={(e) => setTicketCategory(e.target.value)}
                                                        style={{ width: "100%", padding: "8px 10px", borderRadius: "10px", border: "1.5px solid #CBD5E1", fontSize: "0.82rem", outline: "none", backgroundColor: "#F8FAFC" }}
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
                                                            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: "800", color: "#64748B", marginBottom: "4px", letterSpacing: "0.5px" }}>REQUESTED CATEGORY TYPE</label>
                                                            <select
                                                                value={reqCategoryType}
                                                                onChange={(e) => setReqCategoryType(e.target.value)}
                                                                style={{ width: "100%", padding: "8px 10px", borderRadius: "10px", border: "1.5px solid #CBD5E1", fontSize: "0.82rem", outline: "none", backgroundColor: "#F8FAFC" }}
                                                            >
                                                                <option value="FOOD">Food Category</option>
                                                                {session?.user?.role !== "DELIVERY" && <option value="ROOM">Room Category</option>}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: "800", color: "#64748B", marginBottom: "4px", letterSpacing: "0.5px" }}>REQUESTED CATEGORY NAME</label>
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. Mocktails, Milkshakes, Suites..."
                                                                value={reqCategoryName}
                                                                onChange={(e) => setReqCategoryName(e.target.value)}
                                                                style={{ width: "100%", padding: "8px 10px", borderRadius: "10px", border: "1.5px solid #CBD5E1", fontSize: "0.82rem", outline: "none" }}
                                                                required
                                                            />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div>
                                                            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: "800", color: "#64748B", marginBottom: "4px", letterSpacing: "0.5px" }}>TITLE / SUBJECT</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Title Summary..."
                                                                value={ticketTitle}
                                                                onChange={(e) => setTicketTitle(e.target.value)}
                                                                style={{ width: "100%", padding: "8px 10px", borderRadius: "10px", border: "1.5px solid #CBD5E1", fontSize: "0.82rem", outline: "none" }}
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: "800", color: "#64748B", marginBottom: "4px", letterSpacing: "0.5px" }}>DESCRIPTION</label>
                                                            <textarea
                                                                placeholder="Explain the problem..."
                                                                rows={3}
                                                                value={ticketDesc}
                                                                onChange={(e) => setTicketDesc(e.target.value)}
                                                                style={{ width: "100%", padding: "8px 10px", borderRadius: "10px", border: "1.5px solid #CBD5E1", fontSize: "0.82rem", resize: "none", outline: "none" }}
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
                                                        borderRadius: "10px",
                                                        backgroundColor: "#EF4444",
                                                        color: "white",
                                                        fontWeight: "800",
                                                        fontSize: "0.82rem",
                                                        border: "none",
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: "6px",
                                                        boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)"
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
                                        maxWidth: "86%",
                                        padding: "13px 16px",
                                        borderRadius: msg.sender === "bot" ? "18px 18px 18px 4px" : "18px 18px 4px 18px",
                                        fontSize: "0.85rem",
                                        lineHeight: "1.45",
                                        alignSelf: msg.sender === "bot" ? "flex-start" : "flex-end",
                                        backgroundColor: msg.sender === "bot" ? "#FFFFFF" : "#EF4444",
                                        color: msg.sender === "bot" ? "#334155" : "#FFFFFF",
                                        boxShadow: msg.sender === "bot" ? "0 2px 10px rgba(0,0,0,0.02)" : "0 4px 12px rgba(239, 68, 68, 0.25)",
                                        border: msg.sender === "bot" ? "1.5px solid #FDE8E1" : "none",
                                        whiteSpace: "pre-line"
                                    }}>
                                        {renderMessageText(msg.text)}
                                        {msg.isTicketSuccess && msg.ticketId && (
                                            <div style={{ marginTop: "10px", borderTop: "1.5px solid #FDE8E1", paddingTop: "8px" }}>
                                                <Link
                                                    href={session?.user?.role === "SELLER" ? "/seller/support" : session?.user?.role === "DELIVERY" ? "/dashboard/delivery" : "/dashboard/user/support"}
                                                    style={{ color: "#EF4444", fontWeight: "700", textDecoration: "underline", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "2px" }}
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
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px", maxWidth: "92%", alignSelf: "flex-start" }}>
                                        {msg.ordersList.map(order => (
                                            <button
                                                key={order.id}
                                                onClick={() => handleSelectOption("show_order_options", order)}
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "flex-start",
                                                    backgroundColor: "white",
                                                    border: "1.5px solid #FEEFEA",
                                                    padding: "12px",
                                                    borderRadius: "14px",
                                                    cursor: "pointer",
                                                    textAlign: "left",
                                                    width: "100%",
                                                    boxShadow: "0 2px 8px rgba(239, 68, 68, 0.04)",
                                                    transition: "all 0.2s ease"
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.borderColor = "#FCA5A5";
                                                    e.currentTarget.style.transform = "translateY(-1px)";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.borderColor = "#FEEFEA";
                                                    e.currentTarget.style.transform = "translateY(0)";
                                                }}
                                            >
                                                <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#64748B", display: "flex", alignItems: "center", gap: "4px" }}>
                                                    <ShoppingBag size={12} /> ORDER #{order.id.slice(0, 8)}
                                                </span>
                                                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#1E293B", marginTop: "4px" }}>
                                                    ₹{order.totalAmount} • {new Date(order.createdAt).toLocaleDateString()}
                                                </span>
                                                <span style={{ fontSize: "0.75rem", color: "#10B981", fontWeight: "700", marginTop: "2px" }}>
                                                    Status: {order.status}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Render Interactive Booking Selection Cards */}
                                {msg.bookingsList && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px", maxWidth: "92%", alignSelf: "flex-start" }}>
                                        {msg.bookingsList.map(booking => (
                                            <button
                                                key={booking.id}
                                                onClick={() => handleSelectOption("show_booking_options", booking)}
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "flex-start",
                                                    backgroundColor: "white",
                                                    border: "1.5px solid #FEEFEA",
                                                    padding: "12px",
                                                    borderRadius: "14px",
                                                    cursor: "pointer",
                                                    textAlign: "left",
                                                    width: "100%",
                                                    boxShadow: "0 2px 8px rgba(239, 68, 68, 0.04)",
                                                    transition: "all 0.2s ease"
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.borderColor = "#FCA5A5";
                                                    e.currentTarget.style.transform = "translateY(-1px)";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.borderColor = "#FEEFEA";
                                                    e.currentTarget.style.transform = "translateY(0)";
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

                                {/* Interactive Quick Action Buttons/Cards */}
                                {msg.options && msg.options.length > 0 && (
                                    (() => {
                                        const gridOptions = msg.options.filter(opt => !opt.label.toLowerCase().includes("back to menu") && !opt.label.toLowerCase().includes("back to main"));
                                        const backOptions = msg.options.filter(opt => opt.label.toLowerCase().includes("back to menu") || opt.label.toLowerCase().includes("back to main"));
                                        const isGrid = gridOptions.length >= 2;

                                        return (
                                            <div style={{ marginTop: "10px", width: "100%", maxWidth: "100%" }}>
                                                {isGrid ? (
                                                    <div style={{
                                                        display: "grid",
                                                        gridTemplateColumns: "1fr 1fr",
                                                        gap: "10px",
                                                        width: "100%"
                                                    }}>
                                                        {gridOptions.map((opt, i) => {
                                                            const parsed = parseOption(opt.label);
                                                            return (
                                                                <button
                                                                    key={i}
                                                                    onClick={opt.action}
                                                                    style={{
                                                                        backgroundColor: "#FFFFFF",
                                                                        border: "1.5px solid #FEEFEA",
                                                                        borderRadius: "16px",
                                                                        padding: "14px 12px",
                                                                        display: "flex",
                                                                        flexDirection: "column",
                                                                        justifyContent: "space-between",
                                                                        minHeight: "105px",
                                                                        cursor: "pointer",
                                                                        textAlign: "left",
                                                                        boxShadow: "0 3px 10px rgba(239, 68, 68, 0.03)",
                                                                        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        e.currentTarget.style.borderColor = "#FCA5A5";
                                                                        e.currentTarget.style.transform = "translateY(-2px)";
                                                                        e.currentTarget.style.boxShadow = "0 8px 18px rgba(239, 68, 68, 0.1)";
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        e.currentTarget.style.borderColor = "#FEEFEA";
                                                                        e.currentTarget.style.transform = "translateY(0)";
                                                                        e.currentTarget.style.boxShadow = "0 3px 10px rgba(239, 68, 68, 0.03)";
                                                                    }}
                                                                >
                                                                    <div style={{
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        justifyContent: "center",
                                                                        fontSize: "30px",
                                                                        lineHeight: 1,
                                                                        marginBottom: "8px",
                                                                        width: "100%"
                                                                    }}>
                                                                        {parsed.icon || "💬"}
                                                                    </div>
                                                                    <div style={{
                                                                        display: "flex",
                                                                        alignItems: "flex-end",
                                                                        justifyContent: "space-between",
                                                                        width: "100%",
                                                                        gap: "4px"
                                                                    }}>
                                                                        <span style={{
                                                                            fontSize: "0.78rem",
                                                                            fontWeight: "700",
                                                                            color: "#334155",
                                                                            lineHeight: "1.25"
                                                                        }}>
                                                                            {parsed.text}
                                                                        </span>
                                                                        <ChevronRight size={15} color="#EF4444" style={{ flexShrink: 0, marginBottom: "1px" }} />
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                                        {gridOptions.map((opt, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={opt.action}
                                                                style={{
                                                                    padding: "8px 14px",
                                                                    borderRadius: "16px",
                                                                    border: "1.5px solid #FEEFEA",
                                                                    backgroundColor: "white",
                                                                    fontSize: "0.8rem",
                                                                    fontWeight: "700",
                                                                    color: "#334155",
                                                                    cursor: "pointer",
                                                                    boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                                                                    transition: "all 0.15s"
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.backgroundColor = "#FFF7F4";
                                                                    e.currentTarget.style.borderColor = "#FCA5A5";
                                                                    e.currentTarget.style.color = "#EF4444";
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.backgroundColor = "white";
                                                                    e.currentTarget.style.borderColor = "#FEEFEA";
                                                                    e.currentTarget.style.color = "#334155";
                                                                }}
                                                            >
                                                                {opt.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Back button(s) */}
                                                {backOptions.length > 0 && (
                                                    <div style={{ marginTop: "8px", display: "flex", gap: "6px" }}>
                                                        {backOptions.map((opt, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={opt.action}
                                                                style={{
                                                                    padding: "6px 12px",
                                                                    borderRadius: "14px",
                                                                    border: "1px solid #E2E8F0",
                                                                    backgroundColor: "#F8FAFC",
                                                                    fontSize: "0.75rem",
                                                                    fontWeight: "600",
                                                                    color: "#64748B",
                                                                    cursor: "pointer",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: "4px",
                                                                    transition: "all 0.15s"
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.backgroundColor = "#F1F5F9";
                                                                    e.currentTarget.style.color = "#1E293B";
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.backgroundColor = "#F8FAFC";
                                                                    e.currentTarget.style.color = "#64748B";
                                                                }}
                                                            >
                                                                {opt.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()
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
                            <div style={{ display: "flex", gap: "6px", alignSelf: "flex-start", backgroundColor: "white", padding: "12px 18px", borderRadius: "14px", border: "1.5px solid #FDE8E1" }}>
                                <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#EF4444", animation: "bounce 1.4s infinite ease-in-out both" }} />
                                <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#EF4444", animation: "bounce 1.4s infinite ease-in-out both 0.2s" }} />
                                <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#EF4444", animation: "bounce 1.4s infinite ease-in-out both 0.4s" }} />
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

                    {/* Quick Action Chips */}
                    <div style={{
                        padding: "6px 14px 8px 14px",
                        display: "flex",
                        gap: "8px",
                        overflowX: "auto",
                        backgroundColor: "#FFFFFF",
                        borderTop: "1px solid #FDF2ED",
                        scrollbarWidth: "none"
                    }}>
                        <button
                            onClick={() => handleSelectOption("orders")}
                            style={{
                                padding: "5px 12px",
                                borderRadius: "9999px",
                                backgroundColor: "#FFF7F4",
                                border: "1px solid #FEE0D5",
                                color: "#475569",
                                fontSize: "0.72rem",
                                fontWeight: "700",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                                whiteSpace: "nowrap",
                                transition: "all 0.15s ease"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#FEECE5";
                                e.currentTarget.style.color = "#EF4444";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "#FFF7F4";
                                e.currentTarget.style.color = "#475569";
                            }}
                        >
                            <Zap size={12} color="#F59E0B" fill="#F59E0B" /> Quick Status
                        </button>
                        <button
                            onClick={() => {
                                setMessages(prev => [...prev, {
                                    id: `b_${Date.now()}`,
                                    sender: "bot",
                                    text: "📞 Customer Support Helpline\n\nNeed immediate phone assistance? You can reach our 24/7 priority desk at:\n+91 98765 43210\n\nOr click below to raise a priority support ticket for an agent callback:",
                                    timestamp: new Date(),
                                    options: [
                                        { label: "🎟️ Request Agent Callback Ticket", action: () => handleSelectOption("custom_ticket_prefilled", { category: "OTHER", title: "Customer Care Call Request", desc: "I am requesting a phone callback from a customer support representative." }) },
                                        { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                                    ]
                                }]);
                            }}
                            style={{
                                padding: "5px 12px",
                                borderRadius: "9999px",
                                backgroundColor: "#FFF7F4",
                                border: "1px solid #FEE0D5",
                                color: "#475569",
                                fontSize: "0.72rem",
                                fontWeight: "700",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                                whiteSpace: "nowrap",
                                transition: "all 0.15s ease"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#FEECE5";
                                e.currentTarget.style.color = "#EF4444";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "#FFF7F4";
                                e.currentTarget.style.color = "#475569";
                            }}
                        >
                            <Phone size={12} color="#10B981" /> Call Agent
                        </button>
                        <button
                            onClick={() => {
                                toggleOpen(false);
                                router.push("/explore-desktop");
                            }}
                            style={{
                                padding: "5px 12px",
                                borderRadius: "9999px",
                                backgroundColor: "#FFF7F4",
                                border: "1px solid #FEE0D5",
                                color: "#475569",
                                fontSize: "0.72rem",
                                fontWeight: "700",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                                whiteSpace: "nowrap",
                                transition: "all 0.15s ease"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#FEECE5";
                                e.currentTarget.style.color = "#EF4444";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "#FFF7F4";
                                e.currentTarget.style.color = "#475569";
                            }}
                        >
                            <Utensils size={12} color="#EF4444" /> Menu list
                        </button>
                    </div>

                    {/* Bottom Input bar */}
                    <div style={{
                        padding: "10px 14px 12px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        backgroundColor: "white",
                        borderTop: "1px solid #F3E8E2"
                    }}>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: "none" }}
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    setMessages(prev => [...prev, {
                                        id: `u_${Date.now()}`,
                                        sender: "user",
                                        text: `📎 Attached file: ${file.name}`,
                                        timestamp: new Date()
                                    }]);
                                    showTypingIndicator(() => {
                                        setMessages(prev => [...prev, {
                                            id: `b_${Date.now()}`,
                                            sender: "bot",
                                            text: `Received file "${file.name}". Would you like to log this file with a support ticket?`,
                                            timestamp: new Date(),
                                            options: [
                                                { label: "🎟️ Submit Ticket with Attachment", action: () => handleSelectOption("custom_ticket_prefilled", { category: "OTHER", title: `Attachment Query: ${file.name}`, desc: `User attached file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)` }) },
                                                { label: "🏠 Back to Menu", action: () => handleSelectOption("back_to_menu") }
                                            ]
                                        }]);
                                    });
                                }
                            }}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                width: "38px",
                                height: "38px",
                                borderRadius: "50%",
                                backgroundColor: "#F1F5F9",
                                color: "#64748B",
                                border: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                flexShrink: 0,
                                transition: "all 0.2s"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#E2E8F0";
                                e.currentTarget.style.color = "#1E293B";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "#F1F5F9";
                                e.currentTarget.style.color = "#64748B";
                            }}
                            title="Attach file / screenshot"
                        >
                            <Paperclip size={18} />
                        </button>

                        <div style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            backgroundColor: "#F1F3F6",
                            borderRadius: "24px",
                            padding: "0 12px",
                            height: "40px"
                        }}>
                            <input
                                type="text"
                                placeholder="Type details or query..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputText)}
                                style={{
                                    flex: 1,
                                    border: "none",
                                    outline: "none",
                                    backgroundColor: "transparent",
                                    fontSize: "0.85rem",
                                    color: "#1E293B"
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setInputText(prev => prev + " 😊")}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "#64748B",
                                    cursor: "pointer",
                                    padding: "4px",
                                    display: "flex",
                                    alignItems: "center"
                                }}
                                title="Emoji"
                            >
                                <Smile size={18} />
                            </button>
                        </div>

                        <button
                            onClick={() => handleSendMessage(inputText)}
                            style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                backgroundColor: "#EF4444",
                                color: "white",
                                border: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                flexShrink: 0,
                                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.35)",
                                transition: "all 0.2s"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#DC2626";
                                e.currentTarget.style.transform = "scale(1.05)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "#EF4444";
                                e.currentTarget.style.transform = "scale(1)";
                            }}
                            title="Send message"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
