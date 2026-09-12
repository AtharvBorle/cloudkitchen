"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export type CartItem = {
    id: string; // The food item ID or variant composite ID
    foodItemId?: string; // The base food item ID
    name: string;
    variantName?: string;
    price: number;
    quantity: number;
    sellerId: string;
    sellerName: string;
    image?: string;
};

type CartContextType = {
    cartItems: CartItem[];
    addToCart: (item: CartItem) => void;
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
            if (prev.length > 0 && prev[0].sellerId !== item.sellerId) {
                alert("You can only order from one kitchen at a time. Please clear your cart first.");
                return prev;
            }

            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i);
            }
            return [...prev, item];
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
        <CartContext.Provider value={{ cartItems, addToCart, decreaseQuantity, removeFromCart, clearCart, cartTotal, initiateRoomBooking }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart must be used within a CartProvider");
    return context;
}
