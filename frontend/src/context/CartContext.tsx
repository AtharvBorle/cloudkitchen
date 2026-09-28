"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, AlertCircle, CheckCircle2, Info, X } from "lucide-react";

export type AddonItem = {
    id?: string;
    name: string;
    price: number;
};

export type CartItem = {
    id: string; // The food item ID or composite key
    foodItemId?: string; // The base food item ID
    name: string;
    variantName?: string;
    basePrice?: number;
    price: number; // Unit price including selected addons
    selectedAddons?: AddonItem[];
    addonsTotal?: number;
    addons?: AddonItem[]; // Available add-ons for customization
    quantity: number;
    sellerId: string;
    sellerName: string;
    image?: string;
    imageUrl?: string;
    stockQuantity?: number;
    maxStock?: number;
    itemType?: string;
};

export type ToastType = "warning" | "error" | "info" | "success";

export type ToastState = {
    message: string;
    type: ToastType;
};

type CartContextType = {
    cartItems: CartItem[];
    addToCart: (item: CartItem) => void;
    addMultipleToCart: (items: CartItem[], clearExisting?: boolean) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    updateItemAddons: (itemId: string, selectedAddons: AddonItem[]) => void;
    decreaseQuantity: (itemId: string) => void;
    removeFromCart: (itemId: string) => void;
    clearCart: () => void;
    cartTotal: number;
    initiateRoomBooking: (room: any) => void; // Dedicated flow for rooms
    showToast: (message: string, type?: ToastType) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [toast, setToast] = useState<ToastState | null>(null);
    const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const router = useRouter();

    const showToast = (message: string, type: ToastType = "warning") => {
        setToast({ message, type });
        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
        }
        toastTimeoutRef.current = setTimeout(() => {
            setToast(null);
        }, 4000);
    };

    // Listen for custom toast events anywhere across the app
    useEffect(() => {
        const handleCustomToast = (e: any) => {
            if (e.detail && e.detail.message) {
                showToast(e.detail.message, e.detail.type || "warning");
            }
        };
        window.addEventListener("show-cart-toast", handleCustomToast);
        window.addEventListener("app-toast", handleCustomToast);
        return () => {
            window.removeEventListener("show-cart-toast", handleCustomToast);
            window.removeEventListener("app-toast", handleCustomToast);
            if (toastTimeoutRef.current) {
                clearTimeout(toastTimeoutRef.current);
            }
        };
    }, []);

    // Load from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem("kitchen_cart");
        if (saved) {
            try {
                setCartItems(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse cart");
            }
        }
    }, []);

    // Save to local storage on change
    useEffect(() => {
        localStorage.setItem("kitchen_cart", JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (item: CartItem) => {
        setCartItems(prev => {
            // Prevent mixing items from different sellers in one order
            if (prev.length > 0 && prev[0].sellerId && item.sellerId && prev[0].sellerId !== item.sellerId) {
                showToast("You can only order from one kitchen at a time. Please clear your cart first.", "warning");
                return prev;
            }

            const addons = item.selectedAddons || [];
            const addonsSum = addons.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
            const basePrice = item.basePrice !== undefined ? Number(item.basePrice) : (item.price !== undefined ? Number(item.price) : 0);
            const finalUnitPrice = basePrice + addonsSum;

            const normalizedItem: CartItem = {
                ...item,
                basePrice,
                addonsTotal: addonsSum,
                price: finalUnitPrice,
                selectedAddons: addons,
            };

            const existing = prev.find(i => i.id === item.id);
            const rawStock = item.maxStock !== undefined ? item.maxStock : (item.stockQuantity !== undefined ? item.stockQuantity : (existing?.maxStock !== undefined ? existing.maxStock : existing?.stockQuantity));
            const stockLimit = rawStock !== undefined && rawStock !== null && !isNaN(Number(rawStock)) ? Number(rawStock) : -1;
            const itemImage = item.imageUrl || item.image || existing?.imageUrl || existing?.image;

            if (stockLimit === 0) {
                showToast(`Sorry, "${item.name}" is currently out of stock.`, "warning");
                return prev;
            }

            if (existing) {
                const addQty = item.quantity !== undefined ? item.quantity : 1;
                const newQty = existing.quantity + addQty;

                if (stockLimit !== -1 && (existing.quantity >= stockLimit || newQty > stockLimit)) {
                    showToast(`Cannot add more. Only ${stockLimit} item${stockLimit === 1 ? "" : "s"} available in stock for ${item.name}.`, "warning");
                    return prev.map(i => i.id === item.id ? {
                        ...i,
                        ...normalizedItem,
                        quantity: Math.min(stockLimit, existing.quantity),
                        maxStock: stockLimit,
                        stockQuantity: stockLimit,
                        image: itemImage,
                        imageUrl: itemImage,
                    } : i);
                }

                return prev.map(i => i.id === item.id ? {
                    ...i,
                    ...normalizedItem,
                    quantity: newQty,
                    maxStock: stockLimit,
                    stockQuantity: stockLimit,
                    image: itemImage,
                    imageUrl: itemImage,
                } : i);
            }

            const initialQty = item.quantity !== undefined && item.quantity > 0 ? item.quantity : 1;
            if (stockLimit !== -1 && initialQty > stockLimit) {
                showToast(`Cannot add more. Only ${stockLimit} item${stockLimit === 1 ? "" : "s"} available in stock for ${item.name}.`, "warning");
                return [...prev, {
                    ...normalizedItem,
                    quantity: stockLimit,
                    maxStock: stockLimit,
                    stockQuantity: stockLimit,
                    image: itemImage,
                    imageUrl: itemImage,
                }];
            }

            return [...prev, {
                ...normalizedItem,
                quantity: initialQty,
                maxStock: stockLimit,
                stockQuantity: stockLimit,
                image: itemImage,
                imageUrl: itemImage,
            }];
        });
    };

    const addMultipleToCart = (items: CartItem[], clearExisting = false) => {
        if (!items || items.length === 0) return;

        setCartItems(prev => {
            let baseList = clearExisting ? [] : [...prev];
            const targetSellerId = items[0]?.sellerId;

            if (baseList.length > 0 && baseList[0].sellerId && targetSellerId && baseList[0].sellerId !== targetSellerId) {
                if (!clearExisting) {
                    showToast("You can only order from one kitchen at a time. Please clear your cart first.", "warning");
                    return prev;
                }
                baseList = [];
            }

            let updatedList = [...baseList];

            for (const item of items) {
                const addons = item.selectedAddons || [];
                const addonsSum = addons.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
                const basePrice = item.basePrice !== undefined ? Number(item.basePrice) : (item.price !== undefined ? Number(item.price) : 0);
                const finalUnitPrice = basePrice + addonsSum;

                const normalizedItem: CartItem = {
                    ...item,
                    basePrice,
                    addonsTotal: addonsSum,
                    price: finalUnitPrice,
                    selectedAddons: addons,
                };

                const existingIndex = updatedList.findIndex(i => i.id === item.id);
                const existing = existingIndex !== -1 ? updatedList[existingIndex] : null;
                const rawStock = item.maxStock !== undefined ? item.maxStock : (item.stockQuantity !== undefined ? item.stockQuantity : (existing?.maxStock !== undefined ? existing.maxStock : existing?.stockQuantity));
                const stockLimit = rawStock !== undefined && rawStock !== null && !isNaN(Number(rawStock)) ? Number(rawStock) : -1;
                const itemImage = item.imageUrl || item.image || (existing ? (existing.imageUrl || existing.image) : undefined);

                if (existingIndex !== -1 && existing) {
                    const addQty = item.quantity !== undefined ? item.quantity : 1;
                    const newQty = existing.quantity + addQty;
                    const finalQty = stockLimit !== -1 ? Math.min(stockLimit, newQty) : newQty;

                    updatedList[existingIndex] = {
                        ...existing,
                        ...normalizedItem,
                        quantity: Math.max(1, finalQty),
                        maxStock: stockLimit,
                        stockQuantity: stockLimit,
                        image: itemImage,
                        imageUrl: itemImage,
                    };
                } else {
                    const initialQty = item.quantity !== undefined && item.quantity > 0 ? item.quantity : 1;
                    const finalQty = stockLimit !== -1 ? Math.min(stockLimit, initialQty) : initialQty;

                    updatedList.push({
                        ...normalizedItem,
                        quantity: Math.max(1, finalQty),
                        maxStock: stockLimit,
                        stockQuantity: stockLimit,
                        image: itemImage,
                        imageUrl: itemImage,
                    });
                }
            }

            return updatedList;
        });
    };

    const updateQuantity = (itemId: string, newQuantity: number) => {
        setCartItems(prev => {
            const existing = prev.find(i => i.id === itemId);
            if (!existing) return prev;
            if (newQuantity <= 0) {
                return prev.filter(i => i.id !== itemId);
            }

            const rawStock = existing.maxStock !== undefined ? existing.maxStock : existing.stockQuantity;
            const stockLimit = rawStock !== undefined && rawStock !== null && !isNaN(Number(rawStock)) ? Number(rawStock) : -1;

            if (stockLimit !== -1 && newQuantity > stockLimit) {
                showToast(`Cannot add more. Only ${stockLimit} item${stockLimit === 1 ? "" : "s"} available in stock for ${existing.name}.`, "warning");
                return prev.map(i => i.id === itemId ? { ...i, quantity: stockLimit } : i);
            }

            return prev.map(i => i.id === itemId ? { ...i, quantity: newQuantity } : i);
        });
    };

    const decreaseQuantity = (itemId: string) => {
        setCartItems(prev => {
            const existing = prev.find(i => i.id === itemId);
            if (!existing) return prev;
            if (existing.quantity > 1) {
                return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
            } else {
                return prev.filter(i => i.id !== itemId);
            }
        });
    };

    const updateItemAddons = (itemId: string, selectedAddons: AddonItem[]) => {
        setCartItems(prev => {
            return prev.map(i => {
                if (i.id === itemId) {
                    const addonsSum = selectedAddons.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
                    const basePrice = i.basePrice !== undefined ? Number(i.basePrice) : Number(i.price) || 0;
                    return {
                        ...i,
                        basePrice,
                        selectedAddons,
                        addonsTotal: addonsSum,
                        price: basePrice + addonsSum,
                    };
                }
                return i;
            });
        });
    };

    const removeFromCart = (itemId: string) => {
        setCartItems(prev => prev.filter(i => i.id !== itemId));
    };

    const clearCart = () => setCartItems([]);

    const cartTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    // Direct room booking bypasses the persistent cart
    const initiateRoomBooking = (room: any) => {
        // Store the active room intent in session storage and jump to checkout
        sessionStorage.setItem("active_room_booking", JSON.stringify(room));
        router.push("/dashboard/user/checkout?type=room");
    };

    return (
        <CartContext.Provider value={{ cartItems, addToCart, addMultipleToCart, updateQuantity, updateItemAddons, decreaseQuantity, removeFromCart, clearCart, cartTotal, initiateRoomBooking, showToast }}>
            {children}
            {/* Global Application Toast Notification */}
            {toast && (
                <div
                    role="status"
                    aria-live="polite"
                    style={{
                        position: "fixed",
                        bottom: "32px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        zIndex: 99999,
                        backgroundColor: toast.type === "error" ? "#FEF2F2" : toast.type === "warning" ? "#FFFBEB" : toast.type === "success" ? "#ECFDF5" : "#EFF6FF",
                        border: `1.5px solid ${toast.type === "error" ? "#FCA5A5" : toast.type === "warning" ? "#FCD34D" : toast.type === "success" ? "#6EE7B7" : "#93C5FD"}`,
                        color: toast.type === "error" ? "#991B1B" : toast.type === "warning" ? "#92400E" : toast.type === "success" ? "#065F46" : "#1E40AF",
                        padding: "12px 20px",
                        borderRadius: "14px",
                        boxShadow: "0 10px 28px rgba(0,0,0,0.14), 0 4px 10px rgba(0,0,0,0.06)",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        maxWidth: "92vw",
                        fontSize: "0.88rem",
                        fontWeight: 600,
                        fontFamily: "Poppins, sans-serif",
                    }}
                >
                    {toast.type === "error" && <AlertCircle size={18} color="#EF4444" style={{ flexShrink: 0 }} />}
                    {toast.type === "warning" && <AlertTriangle size={18} color="#F59E0B" style={{ flexShrink: 0 }} />}
                    {toast.type === "success" && <CheckCircle2 size={18} color="#10B981" style={{ flexShrink: 0 }} />}
                    {toast.type === "info" && <Info size={18} color="#3B82F6" style={{ flexShrink: 0 }} />}
                    <span>{toast.message}</span>
                    <button
                        type="button"
                        onClick={() => setToast(null)}
                        style={{
                            background: "none",
                            border: "none",
                            padding: "2px",
                            cursor: "pointer",
                            color: "inherit",
                            opacity: 0.7,
                            marginLeft: "6px",
                            display: "flex",
                            alignItems: "center",
                        }}
                        aria-label="Close notification"
                    >
                        <X size={15} />
                    </button>
                </div>
            )}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart must be used within a CartProvider");
    return context;
}

