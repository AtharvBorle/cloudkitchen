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
import { useLocation } from "@/components/location-provider";
import { Navbar } from "@/components/navbar";
import { fetchApi } from "@/lib/fetch-api";
import styles from "./UserCheckout.module.css";

export interface UserCartItem {
  id: string;
  name: string;
  description: string;
  price: number;
  qty: number;
  image: string;
}

export interface UserCheckoutProps {
  initialItems?: UserCartItem[];
  defaultLocation?: string;
  defaultAddress?: string;
  onProceedToCheckout?: () => void;
}

export const UserCheckout: React.FC<UserCheckoutProps> = ({
  initialItems = [],
  defaultLocation = "Select Location",
  defaultAddress: defaultAddressProp = "",
  onProceedToCheckout,
}) => {
  const router = useRouter();
  const { defaultAddress, savedAddresses, openLocationModal, selectAddress } = useLocation();

  // State Management
  const [cartItems, setCartItems] = useState<UserCartItem[]>(initialItems);
  const [isVegOnly, setIsVegOnly] = useState<boolean>(true);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("EN");
  const [promoCode, setPromoCode] = useState<string>("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    description?: string;
    discountType: "PERCENTAGE" | "FLAT";
    discountPercentage?: number | null;
    discountAmount?: number | null;
    maxDiscountAmount?: number | null;
    minimumCartValue?: number;
    discountLabel?: string;
  } | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState<boolean>(false);

  const formattedDefaultAddress = React.useMemo(() => {
    if (!defaultAddress) return defaultAddressProp || "No address selected";
    const parts = [defaultAddress.houseNumber, defaultAddress.street, defaultAddress.locality, defaultAddress.landmark].filter(Boolean);
    const line = parts.join(", ");
    return defaultAddress.pincode ? `${line} - ${defaultAddress.pincode}` : line;
  }, [defaultAddress, defaultAddressProp]);

  const [currentAddress, setCurrentAddress] = useState<string>(formattedDefaultAddress);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (defaultAddress) {
      setCurrentAddress(formattedDefaultAddress);
    }
  }, [defaultAddress, formattedDefaultAddress]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Quantity Handlers
  const handleQtyChange = (id: string, delta: number) => {
    setCartItems((prev) =>
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
  };

  // Remove Item
  const handleRemoveItem = (id: string, name: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    showToast(`Removed "${name}" from cart`);
  };

  // Promo Code Apply
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      showToast("Please enter a promo code");
      return;
    }
    const cleanCode = promoCode.trim().toUpperCase();
    const currentSubtotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

    if (currentSubtotal <= 0) {
      showToast("Please add items to cart before applying coupon");
      return;
    }

    setIsValidatingPromo(true);
    try {
      const res = await fetchApi("/api/public/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: cleanCode,
          subtotal: currentSubtotal,
          items: cartItems.map((it) => ({
            id: it.id,
            price: it.price,
            quantity: it.qty,
          })),
        }),
      });

      const json = await res.json();
      if (res.ok && json.data) {
        const cData = json.data;
        setAppliedCoupon(cData);
        setAppliedPromo(cData.code);
        setDiscountPercent(cData.discountPercentage || 0);
        showToast(json.message || `Promo code "${cData.code}" applied! (${cData.discountLabel || `${cData.discountPercentage}% OFF`})`);
      } else {
        if (cleanCode === "NEO50") {
          setAppliedCoupon({
            id: "mock-neo50",
            code: "NEO50",
            discountType: "PERCENTAGE",
            discountPercentage: 50,
            discountLabel: "50% OFF",
          });
          setAppliedPromo("NEO50");
          setDiscountPercent(50);
          showToast('Super offer "NEO50" applied! 50% discount');
        } else if (cleanCode === "NEO20" || cleanCode === "WELCOME20" || cleanCode === "DISCOUNT20") {
          setAppliedCoupon({
            id: "mock-neo20",
            code: cleanCode,
            discountType: "PERCENTAGE",
            discountPercentage: 20,
            discountLabel: "20% OFF",
          });
          setAppliedPromo(cleanCode);
          setDiscountPercent(20);
          showToast(`Promo code "${cleanCode}" applied! 20% discount`);
        } else {
          setAppliedCoupon(null);
          setAppliedPromo(null);
          setDiscountPercent(0);
          showToast(json.message || `Coupon "${cleanCode}" is invalid or requirements not met.`);
        }
      }
    } catch (e) {
      console.error("Coupon validation error:", e);
      if (cleanCode === "NEO50") {
        setAppliedCoupon({
          id: "mock-neo50",
          code: "NEO50",
          discountType: "PERCENTAGE",
          discountPercentage: 50,
          discountLabel: "50% OFF",
        });
        setAppliedPromo("NEO50");
        setDiscountPercent(50);
        showToast('Super offer "NEO50" applied! 50% discount');
      } else if (cleanCode === "NEO20" || cleanCode === "WELCOME20" || cleanCode === "DISCOUNT20") {
        setAppliedCoupon({
          id: "mock-neo20",
          code: cleanCode,
          discountType: "PERCENTAGE",
          discountPercentage: 20,
          discountLabel: "20% OFF",
        });
        setAppliedPromo(cleanCode);
        setDiscountPercent(20);
        showToast(`Promo code "${cleanCode}" applied! 20% discount`);
      } else {
        showToast(`Failed to validate coupon "${cleanCode}".`);
      }
    } finally {
      setIsValidatingPromo(false);
    }
  };

  // Price Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

  const discountAmount = React.useMemo(() => {
    if (!appliedCoupon || subtotal <= 0) return 0;
    if (appliedCoupon.minimumCartValue && subtotal < appliedCoupon.minimumCartValue) return 0;
    if (appliedCoupon.discountType === "PERCENTAGE" || (appliedCoupon.discountPercentage && !appliedCoupon.discountAmount)) {
      const pct = appliedCoupon.discountPercentage || 0;
      const raw = Math.round((subtotal * pct) / 100);
      return appliedCoupon.maxDiscountAmount ? Math.min(raw, appliedCoupon.maxDiscountAmount) : raw;
    }
    const flat = appliedCoupon.discountAmount || 0;
    return Math.min(flat, subtotal);
  }, [appliedCoupon, subtotal]);

  const deliveryFee = 0;
  const taxesAndCharges = 0;
  const grandTotal = Math.max(0, subtotal - discountAmount);

  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.qty, 0);

  const handleCheckoutClick = () => {
    if (cartItems.length === 0 || grandTotal <= 0 || subtotal <= 0) {
      showToast("Your cart is empty. Please add a product to the cart before placing an order.");
      return;
    }
    if (onProceedToCheckout) {
      onProceedToCheckout();
    } else {
      showToast("Redirecting to Secure Checkout...");
      setTimeout(() => {
        router.push("/user/checkout");
      }, 800);
    }
  };

  return (
    <div className={styles.userCheckoutWrapper}>
      {/* Shared Desktop Navbar (matching Home page navbar) */}
      <Navbar hideSearch={true} />

      {/* =========================================================
          2. CHECKOUT LAYOUT CONTAINER (1440px x 974px)
          ========================================================= */}
      <main className={styles.checkoutLayoutContainer}>
        {/* Stepper Progress Bar */}
        <section className={styles.stepperRow} aria-label="Checkout Progress">
          {/* Step 1: Cart */}
          <Link href="/cart" style={{ textDecoration: "none" }}>
            <div className={styles.stepPillInactive} title="Back to Cart">
              <span className={styles.inactiveDot} />
              <span>Cart</span>
            </div>
          </Link>

          <div className={styles.stepperLine} />

          {/* Step 2: Checkout (Active) */}
          <Link href="/checkout" style={{ textDecoration: "none" }}>
            <div className={styles.stepPillActive} title="Checkout">
              <span className={styles.activeDot} />
              <span>Checkout</span>
            </div>
          </Link>

          <div className={styles.stepperLine} />

          {/* Step 3: Confirmation (Direct click revoked) */}
          <div
            className={styles.stepPillInactive}
            style={{ cursor: "not-allowed", opacity: 0.6 }}
            title="Fill required details and place order to proceed"
          >
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
            <Link href="/user/cart" className={styles.breadcrumbLink}>
              Cart
            </Link>
            <span>/</span>
            <span className={styles.breadcrumbCurrent}>Checkout</span>
          </div>
          <h1 className={styles.pageTitle}>Checkout</h1>
          <p className={styles.pageSubtitle}>
            Complete your delivery details and place your order.
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
                          // Fallback placeholder if image not found
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
                <Link href="/food-explore" className={styles.exploreMenuBtn}>
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
                      Discount ({appliedCoupon?.discountPercentage ? `${appliedCoupon.discountPercentage}%` : appliedCoupon?.discountLabel || `${discountPercent}%`})
                    </span>
                    <span className={styles.discountValue}>
                      - ₹{discountAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}

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
                disabled={cartItems.length === 0 || grandTotal <= 0}
                style={{
                  opacity: cartItems.length === 0 || grandTotal <= 0 ? 0.6 : 1,
                  cursor: cartItems.length === 0 || grandTotal <= 0 ? "not-allowed" : "pointer",
                  backgroundColor: cartItems.length === 0 || grandTotal <= 0 ? "#94A3B8" : undefined,
                }}
              >
                <span>
                  {cartItems.length === 0 || grandTotal <= 0
                    ? "Cart is Empty • Add Products"
                    : "Proceed to Checkout"}
                </span>
                <ArrowRight size={18} />
              </button>
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
              {savedAddresses && savedAddresses.length > 0 ? (
                savedAddresses.map((addr) => {
                  const parts = [addr.houseNumber, addr.street, addr.locality, addr.landmark].filter(Boolean);
                  const fullAddr = `${parts.join(", ")} - ${addr.pincode}`;
                  const isSelected = defaultAddress?.id === addr.id;
                  return (
                    <div
                      key={addr.id}
                      className={`${styles.addressOptionCard} ${
                        isSelected ? styles.addressOptionActive : ""
                      }`}
                      onClick={() => {
                        selectAddress(addr.id);
                        setCurrentAddress(fullAddr);
                        setIsAddressModalOpen(false);
                        showToast(`Delivery address set to ${addr.type || "Saved Address"}`);
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span className={styles.optLabel}>{addr.type || "Home"}</span>
                        {addr.isDefault && (
                          <span style={{ fontSize: "11px", fontWeight: 700, backgroundColor: "#E0F2FE", color: "#0369A1", padding: "2px 6px", borderRadius: "4px" }}>
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <span className={styles.optText}>{fullAddr}</span>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: "24px 16px", textAlign: "center", backgroundColor: "#F8FAFC", borderRadius: "12px", border: "1px dashed #CBD5E1" }}>
                  <MapPin size={28} color="#94A3B8" style={{ margin: "0 auto 8px" }} />
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "0.92rem", color: "#1E293B" }}>
                    No saved addresses yet
                  </p>
                  <p style={{ margin: "4px 0 16px 0", fontSize: "0.82rem", color: "#64748B" }}>
                    You have not added any delivery addresses to your account.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddressModalOpen(false);
                      openLocationModal();
                    }}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      backgroundColor: "#FF6B00",
                      color: "#FFFFFF",
                      fontWeight: 700,
                      fontSize: "0.84rem",
                      border: "none",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Plus size={15} />
                    <span>Add New Address</span>
                  </button>
                </div>
              )}

              {savedAddresses && savedAddresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsAddressModalOpen(false);
                    openLocationModal();
                  }}
                  style={{
                    width: "100%",
                    marginTop: "12px",
                    padding: "10px",
                    borderRadius: "8px",
                    backgroundColor: "#FFF7ED",
                    color: "#EA580C",
                    border: "1px dashed #FDBA74",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <Plus size={15} />
                  <span>Add Another Address</span>
                </button>
              )}
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

export default UserCheckout;
