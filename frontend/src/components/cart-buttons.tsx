"use client";

import { useCart } from "@/context/CartContext";
import { ShoppingCart, Check } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

export function AddToCartButton({ item, fullWidth = true, disabled = false }: { item: any, fullWidth?: boolean, disabled?: boolean }) {
    const { addToCart, cartItems, decreaseQuantity } = useCart();
    const { data: session } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [showSuccess, setShowSuccess] = useState(false);

    const cartItem = cartItems.find((i: any) => i.id === item.id);

    const handleAction = () => {

        // Validate stock quantity limits
        if (item.stockQuantity !== undefined && item.stockQuantity !== -1) {
            const currentQty = cartItem ? cartItem.quantity : 0;
            if (currentQty >= item.stockQuantity) {
                alert(`Cannot add more. Only ${item.stockQuantity} items in stock.`);
                return;
            }
        }

        addToCart({ id: item.id, name: item.name, price: item.price, quantity: 1, sellerId: item.sellerId, sellerName: item.sellerName });

        if (!cartItem) {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        }
    };

    if (cartItem) {
        return (
            <div
                style={{
                    width: fullWidth ? '100%' : 'auto',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#FFF7ED',
                    border: '1.5px solid #EA580C',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(234, 88, 12, 0.12)',
                    boxSizing: 'border-box'
                }}
            >
                <button
                    onClick={() => decreaseQuantity(item.id)}
                    style={{
                        flex: 1,
                        padding: '8px 14px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '800',
                        fontSize: '1.1rem',
                        color: '#EA580C',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#EA580C';
                        e.currentTarget.style.color = '#FFFFFF';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#EA580C';
                    }}
                    aria-label="Decrease quantity"
                >
                    -
                </button>
                <div style={{
                    padding: '8px 16px',
                    fontWeight: '800',
                    fontSize: '0.95rem',
                    color: '#EA580C',
                    backgroundColor: '#FFFFFF',
                    borderLeft: '1.5px solid #EA580C',
                    borderRight: '1.5px solid #EA580C',
                    minWidth: '24px',
                    textAlign: 'center'
                }}>
                    {cartItem.quantity}
                </div>
                <button
                    onClick={handleAction}
                    style={{
                        flex: 1,
                        padding: '8px 14px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '800',
                        fontSize: '1.1rem',
                        color: '#EA580C',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#EA580C';
                        e.currentTarget.style.color = '#FFFFFF';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#EA580C';
                    }}
                    aria-label="Increase quantity"
                >
                    +
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={handleAction}
            className="btn btn-coral"
            style={{
                width: fullWidth ? '100%' : 'auto',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                padding: '10px',
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
                backgroundColor: showSuccess ? '#48BB78' : undefined,
                transition: 'all 0.3s ease'
            }}
            disabled={disabled}
        >
            {showSuccess ? <Check size={18} color="white" /> : <ShoppingCart size={18} />}
            {disabled ? "Unavailable" : showSuccess ? "Added to Cart" : "Add to Cart"}
        </button>
    );
}

export function BookRoomButton({ room, fullWidth = true, disabled = false }: { room: any, fullWidth?: boolean, disabled?: boolean }) {
    const { initiateRoomBooking } = useCart();
    const { data: session } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    const handleAction = () => {
        initiateRoomBooking(room);
    };

    return (
        <button
            onClick={handleAction}
            className="btn btn-primary"
            style={{ flex: fullWidth ? 1 : 'none', width: fullWidth ? '100%' : 'auto', padding: '10px', opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
            disabled={disabled}
        >
            {disabled ? "Unavailable" : "Book Now"}
        </button>
    );
}
