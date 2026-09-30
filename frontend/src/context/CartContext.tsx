"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, AlertCircle, CheckCircle2, Info, X } from "lucide-react";

import { fetchApi } from "@/lib/fetch-api";

export type AddonItem = {
    id?: string;
    name: string;
    price: number;
};

export function generateCartItemId(foodItemId: string, selectedAddons?: AddonItem[]): string {
    const baseId = (foodItemId || "").trim();
    if (!selectedAddons || selectedAddons.length === 0) {
        return baseId;
    }
    const addonKey = selectedAddons
        .map(a => (a.id || a.name || "").trim().toLowerCase())
        .filter(Boolean)
        .sort()
        .join("_");
    return addonKey ? `${baseId}_${addonKey}` : baseId;
}

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
    syncCartWithLiveMenu: (customList?: CartItem[]) => Promise<void>;
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

    const syncCartWithLiveMenu = async (customList?: CartItem[]) => {
        const targetList = customList || cartItems;
        if (!targetList || targetList.length === 0) return;

        const sellerIds = Array.from(new Set(targetList.map(i => i.sellerId).filter(Boolean)));
        if (sellerIds.length === 0) return;

        let hasAnyUpdates = false;
        const updatesMap = new Map<string, Partial<CartItem>>();

        await Promise.all(
            sellerIds.map(async (sid) => {
                try {
                    const res = await fetchApi(`/api/public/shop/${encodeURIComponent(sid)}`);
                    if (res.ok) {
                        const json = await res.json();
                        const sellerObj = json.data || json;
                        const liveFoodItems: any[] = sellerObj?.foodItems || [];

                        for (const item of targetList) {
                            if (item.sellerId !== sid) continue;

                            const live = liveFoodItems.find(
                                (f: any) =>
                                    f.id === item.foodItemId ||
                                    f.id === item.id ||
                                    (f.name && item.name && f.name.toLowerCase().trim() === item.name.toLowerCase().trim())
                            );

                            if (live) {
                                const newBasePrice = Number(live.price);
                                const currentBasePrice = item.basePrice !== undefined ? Number(item.basePrice) : Number(item.price) || 0;
                                const addonsSum = (item.selectedAddons || []).reduce((sum, a) => sum + (Number(a.price) || 0), 0);
                                const newUnitPrice = newBasePrice + addonsSum;

                                const liveStock = live.stockQuantity !== undefined && live.stockQuantity !== null ? Number(live.stockQuantity) : -1;
                                const liveImage = live.imageUrl || item.imageUrl || item.image;

                                const priceChanged = currentBasePrice !== newBasePrice || item.price !== newUnitPrice;
                                const stockChanged = item.maxStock !== liveStock || item.stockQuantity !== liveStock;

                                if (priceChanged || stockChanged) {
                                    hasAnyUpdates = true;
                                    updatesMap.set(item.id, {
                                        basePrice: newBasePrice,
                                        price: newUnitPrice,
                                        addonsTotal: addonsSum,
                                        maxStock: liveStock,
                                        stockQuantity: liveStock,
                                        image: liveImage,
                                        imageUrl: liveImage,
                                    });
                                }
                            }
                        }
                    }
                } catch (err) {
                    console.error("Failed to sync cart prices with live menu:", err);
                }
            })
        );

        if (hasAnyUpdates && updatesMap.size > 0) {
            setCartItems(prev => {
                const updated = prev.map(item => {
                    const patch = updatesMap.get(item.id);
                    if (!patch) return item;
                    return {
                        ...item,
                        ...patch,
                    };
                });
                try {
                    localStorage.setItem("kitchen_cart", JSON.stringify(updated));
                } catch {}
                return updated;
            });
        }
    };

    // Load from local storage on mount and sync with live seller prices
    useEffect(() => {
        const saved = localStorage.getItem("kitchen_cart");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setCartItems(parsed);
                    syncCartWithLiveMenu(parsed);
                }
            } catch (e) {
                console.error("Failed to parse cart");
            }
        }
    }, []);

    // Sync prices on focus, visibility change, or storage update
    useEffect(() => {
        const handleSync = () => {
            syncCartWithLiveMenu();
        };

        if (typeof window !== "undefined") {
            window.addEventListener("focus", handleSync);
            window.addEventListener("seller-menu-updated", handleSync);
            window.addEventListener("cart-sync-requested", handleSync);
            document.addEventListener("visibilitychange", () => {
                if (document.visibilityState === "visible") {
                    handleSync();
                }
            });
        }

        return () => {
            if (typeof window !== "undefined") {
                window.removeEventListener("focus", handleSync);
                window.removeEventListener("seller-menu-updated", handleSync);
                window.removeEventListener("cart-sync-requested", handleSync);
            }
        };
    }, [cartItems]);

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
            const basePrice = item.basePrice !== undefined 
                ? Number(item.basePrice) 
                : (item.addonsTotal !== undefined ? (Number(item.price) - Number(item.addonsTotal)) : Number(item.price) || 0);
            const finalUnitPrice = basePrice + addonsSum;
            const baseFoodId = item.foodItemId || (item.id.includes("_") ? item.id.split("_")[0] : item.id);
            const finalCartId = item.id.includes("_") ? item.id : generateCartItemId(baseFoodId, addons);

            const normalizedItem: CartItem = {
                ...item,
                id: finalCartId,
                foodItemId: baseFoodId,
                basePrice,
                addonsTotal: addonsSum,
                price: finalUnitPrice,
                selectedAddons: addons,
            };

            const existing = prev.find(i => i.id === finalCartId);
            const rawStock = item.maxStock !== undefined ? item.maxStock : (item.stockQuantity !== undefined ? item.stockQuantity : (existing?.maxStock !== undefined ? existing.maxStock : existing?.stockQuantity));
            const stockLimit = rawStock !== undefined && rawStock !== null && !isNaN(Number(rawStock)) ? Number(rawStock) : -1;
            const itemImage = item.imageUrl || item.image || existing?.imageUrl || existing?.image;

            // Out-of-stock validation
            if (stockLimit === 0) {
                showToast(`Sorry, "${item.name}" is currently out of stock.`, "warning");
                return prev;
            }

            if (existing) {
                const addQty = item.quantity !== undefined ? item.quantity : 1;
                const newQty = existing.quantity + addQty;

                if (stockLimit !== -1 && (existing.quantity >= stockLimit || newQty > stockLimit)) {
                    showToast(`We have only ${stockLimit} left in stock.`, "warning");
                    return prev.map(i => i.id === finalCartId ? {
                        ...i,
                        ...normalizedItem,
                        quantity: Math.min(stockLimit, existing.quantity),
                        maxStock: stockLimit,
                        stockQuantity: stockLimit,
                        image: itemImage,
                        imageUrl: itemImage,
                    } : i);
                }

                return prev.map(i => i.id === finalCartId ? {
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
                showToast(`We have only ${stockLimit} left in stock.`, "warning");
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
                const basePrice = item.basePrice !== undefined 
                    ? Number(item.basePrice) 
                    : (item.addonsTotal !== undefined ? (Number(item.price) - Number(item.addonsTotal)) : Number(item.price) || 0);
                const finalUnitPrice = basePrice + addonsSum;
                const baseFoodId = item.foodItemId || (item.id.includes("_") ? item.id.split("_")[0] : item.id);
                const finalCartId = item.id.includes("_") ? item.id : generateCartItemId(baseFoodId, addons);

                const normalizedItem: CartItem = {
                    ...item,
                    id: finalCartId,
                    foodItemId: baseFoodId,
                    basePrice,
                    addonsTotal: addonsSum,
                    price: finalUnitPrice,
                    selectedAddons: addons,
                };

                const existingIndex = updatedList.findIndex(i => i.id === finalCartId);
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
                showToast(`We have only ${stockLimit} left in stock.`, "warning");
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
            const targetIndex = prev.findIndex(i => i.id === itemId);
            if (targetIndex === -1) return prev;

            const targetItem = prev[targetIndex];
            const baseFoodId = targetItem.foodItemId || (targetItem.id.includes("_") ? targetItem.id.split("_")[0] : targetItem.id);
            const newCartId = generateCartItemId(baseFoodId, selectedAddons);
            const addonsSum = selectedAddons.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
            const basePrice = targetItem.basePrice !== undefined 
                ? Number(targetItem.basePrice) 
                : Math.max(0, (Number(targetItem.price) || 0) - (Number(targetItem.addonsTotal) || 0));
            const newUnitPrice = basePrice + addonsSum;

            // Check if another item in the cart already has this customized ID
            const existingMergeIndex = prev.findIndex((i, idx) => idx !== targetIndex && i.id === newCartId);

            let updated: CartItem[];
            if (existingMergeIndex !== -1) {
                updated = prev.map((item, idx) => {
                    if (idx === existingMergeIndex) {
                        const rawStock = item.maxStock !== undefined ? item.maxStock : item.stockQuantity;
                        const stockLimit = rawStock !== undefined && rawStock !== null && !isNaN(Number(rawStock)) ? Number(rawStock) : -1;
                        const mergedQty = stockLimit !== -1 
                            ? Math.min(stockLimit, item.quantity + targetItem.quantity)
                            : item.quantity + targetItem.quantity;
                        return {
                            ...item,
                            quantity: mergedQty,
                            price: newUnitPrice,
                            basePrice,
                            addonsTotal: addonsSum,
                            selectedAddons,
                        };
                    }
                    return item;
                }).filter((_, idx) => idx !== targetIndex);
            } else {
                updated = prev.map((item, idx) => {
                    if (idx === targetIndex) {
                        return {
                            ...item,
                            id: newCartId,
                            foodItemId: baseFoodId,
                            basePrice,
                            selectedAddons,
                            addonsTotal: addonsSum,
                            price: newUnitPrice,
                        };
                    }
                    return item;
                });
            }

            try {
                localStorage.setItem("kitchen_cart", JSON.stringify(updated));
            } catch {}
            return updated;
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
        <CartContext.Provider value={{ cartItems, addToCart, addMultipleToCart, updateQuantity, updateItemAddons, decreaseQuantity, removeFromCart, clearCart, syncCartWithLiveMenu, cartTotal, initiateRoomBooking, showToast }}>
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

