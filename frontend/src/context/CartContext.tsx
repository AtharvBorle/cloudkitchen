"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

type CartContextType = {
    cartItems: CartItem[];
    addToCart: (item: CartItem) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    updateItemAddons: (itemId: string, selectedAddons: AddonItem[]) => void;
    decreaseQuantity: (itemId: string) => void;
    removeFromCart: (itemId: string) => void;
    clearCart: () => void;
    cartTotal: number;
    initiateRoomBooking: (room: any) => void; // Dedicated flow for rooms
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const router = useRouter();

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
                alert("You can only order from one kitchen at a time. Please clear your cart first.");
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

            if (existing) {
                const addQty = item.quantity !== undefined ? item.quantity : 1;
                const newQty = existing.quantity + addQty;

                if (stockLimit !== -1 && newQty > stockLimit) {
                    alert(`Cannot add more. Only ${stockLimit} items available in stock for ${item.name}.`);
                    return prev.map(i => i.id === item.id ? {
                        ...i,
                        ...normalizedItem,
                        quantity: Math.min(stockLimit, Math.max(existing.quantity, 1)),
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
                alert(`Cannot add more. Only ${stockLimit} items available in stock for ${item.name}.`);
                return [...prev, {
                    ...normalizedItem,
                    quantity: Math.max(1, stockLimit),
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
                alert(`Cannot add more. Only ${stockLimit} items available in stock for ${existing.name}.`);
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
        <CartContext.Provider value={{ cartItems, addToCart, updateQuantity, updateItemAddons, decreaseQuantity, removeFromCart, clearCart, cartTotal, initiateRoomBooking }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart must be used within a CartProvider");
    return context;
}
