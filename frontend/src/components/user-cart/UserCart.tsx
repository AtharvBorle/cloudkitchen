"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Tag,
  ArrowRight,
  CheckCircle2,
  X,
  Plus,
  Minus,
  ShoppingBag,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Navbar } from "@/components/navbar";
import styles from "./UserCart.module.css";

export interface UserCartItem {
  id: string;
  name: string;
  description: string;
  price: number;
  qty: number;
  image: string;
}

export interface UserCartProps {
  initialItems?: UserCartItem[];
  defaultLocation?: string;
  defaultAddress?: string;
  onProceedToCheckout?: () => void;
}

const DEFAULT_CART_ITEMS: UserCartItem[] = [
  {
    id: "item-1",
    name: "Gourmet Brick-Oven Margherita Pizza",
    description: "Medium • Fresh Basil & Extra Mozzarella",
    price: 449,
    qty: 1,
    image: "/images/places/place-pizza.png",
  },
  {
    id: "item-2",
    name: "Avocado & Quinoa Power Bowl",
    description: "Organic • Tahini Lime Dressing",
    price: 556,
    qty: 1,
    image: "/images/auth/salad-bowl.jpg",
  },
  {
    id: "item-3",
    name: "Classic Garlic Bread",
    description: "Crispy • Herbs & Mozzarella",
    price: 199,
    qty: 1,
    image: "/images/places/place-pizza.png",
  },
  {
    id: "item-4",
    name: "Classic Garlic Bread",
    description: "Crispy • Herbs & Mozzarella",
    price: 199,
    qty: 1,
    image: "/images/places/place-pizza.png",
  },
];

const AVAILABLE_ADDRESSES = [
  {
    id: "addr-1",
    label: "Home",
    address: "Flat 402, Golden Crest Apartments, Kothrud, Pune - 411038",
  },
  {
    id: "addr-2",
    label: "Work / Office",
    address: "Tech Center 5, Level 3, Hinjawadi Phase 2, Pune - 411057",
  },
  {
    id: "addr-3",
    label: "Parents' Home",
    address: "Bungalow 12, Mayur Colony, Kothrud, Pune - 411038",
  },
];

export const UserCart: React.FC<UserCartProps> = ({
  initialItems = DEFAULT_CART_ITEMS,
  defaultLocation = "Kothrud, Pune",
  defaultAddress = "Flat 402, Golden Crest Apartments, Kothrud",
  onProceedToCheckout,
}) => {
  const router = useRouter();
  const { cartItems: contextCartItems, addToCart, decreaseQuantity, removeFromCart, cartTotal } = useCart();

  // State Management
  const [localCartItems, setLocalCartItems] = useState<UserCartItem[]>(initialItems);
  const [isVegOnly, setIsVegOnly] = useState<boolean>(true);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("EN");
  const [promoCode, setPromoCode] = useState<string>("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>("WELCOME20");
  const [discountPercent, setDiscountPercent] = useState<number>(20);
  const [currentAddress, setCurrentAddress] = useState<string>(defaultAddress);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active items derived from context if present
  const cartItems: UserCartItem[] = contextCartItems.length > 0
    ? contextCartItems.map((ci) => ({
        id: ci.id,
        name: ci.name,
        description: ci.sellerName ? `From ${ci.sellerName}` : "Fresh gourmet preparation",
        price: ci.price,
        qty: ci.quantity,
        image: "/images/places/place-pizza.png",
      }))
    : localCartItems;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Quantity Handlers
  const handleQtyChange = (id: string, delta: number) => {
    const existing = contextCartItems.find((ci) => ci.id === id);
    if (existing) {
      if (delta > 0) {
        addToCart({
          id: existing.id,
          name: existing.name,
          price: existing.price,
          quantity: 1,
          sellerId: existing.sellerId,
          sellerName: existing.sellerName,
        });
      } else {
        decreaseQuantity(id);
      }
    } else {
      setLocalCartItems((prev) =>
        prev
          .map((item) => {
            if (item.id === id) {
              const newQty = item.qty + delta;
              return newQty > 0 ? { ...item, qty: newQty } : item;
            }
            return item;
          })
          .filter((item) => item.qty > 0)
      );
    }
  };

  // Remove Item
  const handleRemoveItem = (id: string, name: string) => {
    const existing = contextCartItems.find((ci) => ci.id === id);
    if (existing) {
      removeFromCart(id);
    } else {
      setLocalCartItems((prev) => prev.filter((item) => item.id !== id));
    }
    showToast(`Removed "${name}" from cart`);
  };

  // Promo Code Apply
  const handleApplyPromo = () => {
    if (!promoCode.trim()) {
      showToast("Please enter a promo code");
      return;
    }
    const cleanCode = promoCode.trim().toUpperCase();
    if (cleanCode === "NEO20" || cleanCode === "WELCOME20" || cleanCode === "DISCOUNT20" || cleanCode === "NEOBITE20") {
      setAppliedPromo(cleanCode);
      setDiscountPercent(20);
      showToast(`Promo code "${cleanCode}" applied! 20% discount`);
    } else if (cleanCode === "NEO50") {
      setAppliedPromo(cleanCode);
      setDiscountPercent(50);
      showToast(`Super offer "${cleanCode}" applied! 50% discount`);
    } else {
      setAppliedPromo(cleanCode);
      setDiscountPercent(15);
      showToast(`Promo code "${cleanCode}" applied! 15% discount`);
    }
  };

  // Price Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const discountAmount = appliedPromo && subtotal > 0 ? Math.round((subtotal * discountPercent) / 100) : 0;
  const deliveryFee = subtotal > 0 ? 49 : 0;
  const taxesAndCharges = subtotal > 0 ? 38 : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount + deliveryFee + taxesAndCharges);

  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.qty, 0);

  const handleCheckoutClick = () => {
    if (onProceedToCheckout) {
      onProceedToCheckout();
    } else {
      router.push("/user/checkout");
    }
  };

  return (
    <div className={styles.userCartWrapper}>
      {/* Shared Desktop Navbar (matching Home page navbar) */}
      <Navbar />

      {/* =========================================================
          2. CHECKOUT LAYOUT CONTAINER (1440px x 974px)
          ========================================================= */}
      <main className={styles.checkoutLayoutContainer}>
        {/* Stepper Progress Bar */}
        <section className={styles.stepperRow} aria-label="Checkout Progress">
          {/* Step 1: Cart (Active) */}
          <div className={styles.stepPillActive}>
            <span className={styles.activeDot} />
            <span>Cart</span>
          </div>

          <div className={styles.stepperLine} />

          {/* Step 2: Checkout (Inactive) */}
          <div
            className={styles.stepPillInactive}
            onClick={handleCheckoutClick}
            title="Go to Checkout"
          >
            <span className={styles.inactiveDot} />
            <span>Checkout</span>
          </div>

          <div className={styles.stepperLine} />

          {/* Step 3: Confirmation (Inactive) */}
          <div className={styles.stepPillInactive}>
            <span className={styles.inactiveDot} />
            <span>Confirmation</span>
          </div>
        </section>

        {/* Page Header & Breadcrumbs */}
        <section className={styles.pageHeaderGroup}>
          <div className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>
              Home
            </Link>
            <span>/</span>
            <span className={styles.breadcrumbCurrent}>Cart</span>
          </div>
          <h1 className={styles.pageTitle}>Your Cart</h1>
          <p className={styles.pageSubtitle}>
            Review your items, apply a promo, and proceed to checkout.
          </p>
        </section>

        {/* =========================================================
            3. MAIN CONTENT (1312px Grid: Cart Items & Order Summary)
            ========================================================= */}
        <div className={styles.mainContent}>
          {/* Left Column: Cart Items List */}
          <div className={styles.cartItemsList}>
            {cartItems.length > 0 ? (
              cartItems.map((item) => (
                <article key={item.id} className={styles.cartItemCard}>
                  {/* Left: Thumbnail & Details */}
                  <div className={styles.itemLeft}>
                    <div className={styles.itemImageWrapper}>
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={82}
                        height={82}
                        className={styles.itemImage}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/images/places/place-pizza.png";
                        }}
                      />
                    </div>

                    <div className={styles.itemInfo}>
                      <h2 className={styles.itemTitle}>{item.name}</h2>
                      <p className={styles.itemSubtitle}>{item.description}</p>
                      <span className={styles.itemPrice}>
                        ₹{item.price.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Right: Quantity Stepper & Remove */}
                  <div className={styles.itemRightActions}>
                    <div className={styles.qtyStepper}>
                      <button
                        type="button"
                        className={styles.qtyBtn}
                        onClick={() => handleQtyChange(item.id, -1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} strokeWidth={3} />
                      </button>
                      <span className={styles.qtyNumber}>{item.qty}</span>
                      <button
                        type="button"
                        className={styles.qtyBtn}
                        onClick={() => handleQtyChange(item.id, 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} strokeWidth={3} />
                      </button>
                    </div>

                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => handleRemoveItem(item.id, item.name)}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className={styles.emptyCartState}>
                <ShoppingBag size={48} color="#EA580C" />
                <h3 className={styles.emptyTitle}>Your cart is empty</h3>
                <p className={styles.emptySubtitle}>
                  Looks like you haven&apos;t added any delicious dishes yet.
                </p>
                <Link href="/explore-desktop" className={styles.exploreMenuBtn}>
                  Explore Menu
                </Link>
              </div>
            )}
          </div>

          {/* Right Column: Promo Code & Order Summary */}
          <aside className={styles.sidebarRight}>
            {/* 1. Promo Code Box */}
            <div className={styles.promoCard}>
              <div className={styles.promoInputBox}>
                <Tag size={18} className={styles.promoTagIcon} />
                <input
                  type="text"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleApplyPromo();
                    }
                  }}
                  className={styles.promoInput}
                />
              </div>
              <button
                type="button"
                className={styles.applyButton}
                onClick={handleApplyPromo}
              >
                Apply
              </button>
            </div>

            {/* 2. Order Summary Card */}
            <div className={styles.summaryCard}>
              <h2 className={styles.summaryTitle}>Order Summary</h2>

              {/* Delivery Address Section */}
              <div className={styles.deliveryBlock}>
                <div className={styles.addressHeaderRow}>
                  <div className={styles.addressPinBox}>
                    <MapPin size={20} />
                  </div>
                  <div className={styles.addressDetails}>
                    <span className={styles.addressLabel}>Delivery Address</span>
                    <p className={styles.addressText}>{currentAddress}</p>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.changeAddressBtn}
                  onClick={() => setIsAddressModalOpen(true)}
                >
                  <span>Change</span>
                  <span aria-hidden="true">&gt;</span>
                </button>
              </div>

              {/* Price Breakdown Table */}
              <div className={styles.pricingTable}>
                <div className={styles.pricingRow}>
                  <span className={styles.pricingLabel}>Subtotal</span>
                  <span className={styles.pricingValue}>
                    ₹{subtotal.toLocaleString("en-IN")}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className={styles.pricingRow}>
                    <span className={styles.discountValue}>
                      Discount ({discountPercent}%)
                    </span>
                    <span className={styles.discountValue}>
                      - ₹{discountAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}

                <div className={styles.pricingRow}>
                  <span className={styles.pricingLabel}>Delivery Fee</span>
                  <span className={styles.pricingValue}>
                    ₹{deliveryFee.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className={styles.pricingRow}>
                  <span className={styles.pricingLabel}>Taxes &amp; charges</span>
                  <span className={styles.pricingValue}>
                    ₹{taxesAndCharges.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className={styles.divider} />

                {/* Grand Total Row */}
                <div className={styles.grandTotalRow}>
                  <span className={styles.grandTotalLabel}>Grand Total</span>
                  <span className={styles.grandTotalAmount}>
                    ₹{grandTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Proceed to Checkout Button */}
              <button
                type="button"
                className={styles.checkoutButton}
                onClick={handleCheckoutClick}
                disabled={cartItems.length === 0}
                style={{
                  opacity: cartItems.length === 0 ? 0.6 : 1,
                  cursor: cartItems.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={18} />
              </button>

              <p className={styles.securityNote}>
                Secure 256-bit SSL encrypted connection
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* Address Selection Modal */}
      {isAddressModalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setIsAddressModalOpen(false)}
        >
          <div
            className={styles.modalBox}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Select Delivery Address</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsAddressModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.addressOptionList}>
              {AVAILABLE_ADDRESSES.map((addr) => {
                const isSelected = currentAddress.includes(addr.address.slice(0, 15));
                return (
                  <div
                    key={addr.id}
                    className={`${styles.addressOptionCard} ${
                      isSelected ? styles.addressOptionActive : ""
                    }`}
                    onClick={() => {
                      setCurrentAddress(addr.address);
                      setIsAddressModalOpen(false);
                      showToast(`Delivery address updated to ${addr.label}`);
                    }}
                  >
                    <span className={styles.optLabel}>{addr.label}</span>
                    <span className={styles.optText}>{addr.address}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className={styles.toastMessage}>
          <CheckCircle2 size={18} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default UserCart;
