"use client";

import { useCart, AddonItem } from "@/context/CartContext";
import { ShoppingCart, Check } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { AddonCustomizationModal } from "@/components/cart/AddonCustomizationModal";

export function AddToCartButton({ item, fullWidth = true, disabled = false }: { item: any, fullWidth?: boolean, disabled?: boolean }) {
    const { addToCart, cartItems, decreaseQuantity } = useCart();
    const { data: session } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [showSuccess, setShowSuccess] = useState(false);
    const [isCustomizing, setIsCustomizing] = useState(false);

    // Parse available addons
    let parsedAddons: AddonItem[] = [];
    const rawAddons = item.addons || item.variants;
    if (rawAddons) {
        try {
            const p = typeof rawAddons === "string" ? JSON.parse(rawAddons) : rawAddons;
            if (Array.isArray(p)) {
                parsedAddons = p
                    .filter((a: any) => a && (a.name || "").trim())
                    .map((a: any, idx: number) => ({
                        id: String(a.id || `addon_${idx + 1}`),
                        name: String(a.name || "").trim(),
                        price: Math.max(0, parseFloat(a.price) || 0)
                    }));
            }
        } catch {}
    }

    const cartItem = cartItems.find((i: any) => i.id === item.id || i.foodItemId === item.id);

    const rawStock = item.maxStock !== undefined ? item.maxStock : item.stockQuantity;
    const stockLimit = rawStock !== undefined && rawStock !== null && !isNaN(Number(rawStock)) ? Number(rawStock) : -1;
    const isAtMaxStock = stockLimit !== -1 && (cartItem ? cartItem.quantity >= stockLimit : false);
    const isOutOfStock = stockLimit === 0 || item.stockQuantity === 0 || disabled;

    const handleAction = () => {
        // If dish has add-ons and is being newly added, open customization modal
        if (parsedAddons.length > 0 && !cartItem) {
            setIsCustomizing(true);
            return;
        }

        // Validate stock quantity limits
        if (stockLimit !== -1) {
            const currentQty = cartItem ? cartItem.quantity : 0;
            if (currentQty >= stockLimit) {
                alert(`Cannot add more. Only ${stockLimit} items available in stock for ${item.name}.`);
                return;
            }
        }

        addToCart({
            id: item.id,
            foodItemId: item.foodItemId || item.id,
            name: item.name,
            variantName: item.variantName,
            basePrice: item.price,
            price: item.price,
            quantity: 1,
            sellerId: item.sellerId,
            sellerName: item.sellerName,
            image: item.imageUrl || item.image,
            imageUrl: item.imageUrl || item.image,
            stockQuantity: stockLimit,
            maxStock: stockLimit,
            itemType: item.itemType,
        });

        if (!cartItem) {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        }
    };

    const handleCustomizationConfirm = (selectedAddons: AddonItem[], totalUnitPrice: number) => {
        const addonKey = selectedAddons.length > 0 ? selectedAddons.map(a => a.id).sort().join("_") : "";
        const cartItemId = addonKey ? `${item.id}_${addonKey}` : item.id;

        addToCart({
            id: cartItemId,
            foodItemId: item.foodItemId || item.id,
            name: item.name,
            basePrice: item.price,
            selectedAddons,
            addonsTotal: selectedAddons.reduce((sum, a) => sum + a.price, 0),
            price: totalUnitPrice,
            quantity: 1,
            sellerId: item.sellerId,
            sellerName: item.sellerName,
            image: item.imageUrl || item.image,
            imageUrl: item.imageUrl || item.image,
            stockQuantity: stockLimit,
            maxStock: stockLimit,
            itemType: item.itemType,
        });

        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
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
                    disabled={isAtMaxStock}
                    style={{
                        flex: 1,
                        padding: '8px 14px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: isAtMaxStock ? 'not-allowed' : 'pointer',
                        opacity: isAtMaxStock ? 0.35 : 1,
                        fontWeight: '800',
                        fontSize: '1.1rem',
                        color: '#EA580C',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onMouseOver={(e) => {
                        if (!isAtMaxStock) {
                            e.currentTarget.style.backgroundColor = '#EA580C';
                            e.currentTarget.style.color = '#FFFFFF';
                        }
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
        <>
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
                    opacity: isOutOfStock ? 0.5 : 1,
                    cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                    backgroundColor: showSuccess ? '#48BB78' : undefined,
                    transition: 'all 0.3s ease'
                }}
                disabled={isOutOfStock}
            >
                {showSuccess ? <Check size={18} color="white" /> : <ShoppingCart size={18} />}
                {isOutOfStock ? (stockLimit === 0 ? "Out of Stock" : "Unavailable") : showSuccess ? "Added to Cart" : (parsedAddons.length > 0 ? "Add Item" : "Add to Cart")}
            </button>

            {parsedAddons.length > 0 && (
                <AddonCustomizationModal
                    isOpen={isCustomizing}
                    onClose={() => setIsCustomizing(false)}
                    dishName={item.name}
                    basePrice={Number(item.price) || 0}
                    description={item.description}
                    imageUrl={item.imageUrl || item.image}
                    itemType={item.itemType}
                    addons={parsedAddons}
                    onConfirm={handleCustomizationConfirm}
                />
            )}
        </>
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
