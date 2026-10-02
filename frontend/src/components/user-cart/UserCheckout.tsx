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
  Check,
  Sparkles,
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
  sellerId?: string;
  selectedAddons?: Array<{ id?: string; name: string; price: number }>;
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
    calculatedDiscount?: number;
  } | null>(null);
  const appliedCouponData = appliedCoupon;
  const [isValidatingPromo, setIsValidatingPromo] = useState<boolean>(false);
  const [availableOffers, setAvailableOffers] = useState<any[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState<boolean>(false);

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

  // Fetch available public coupons
  React.useEffect(() => {
    let isMounted = true;
    async function fetchOffers() {
      const sellerId = cartItems.find((ci) => ci.sellerId)?.sellerId;
      try {
        setIsLoadingOffers(true);
        const url = sellerId ? `/api/public/coupons?sellerId=${encodeURIComponent(sellerId)}` : "/api/public/coupons";
        const res = await fetchApi(url);
        if (res.ok && isMounted) {
          const json = await res.json();
          const serverCoupons = json.data || [];
          if (Array.isArray(serverCoupons)) {
            setAvailableOffers(serverCoupons);
          } else {
            setAvailableOffers([]);
          }
        }
      } catch {
        if (isMounted) setAvailableOffers([]);
      } finally {
        if (isMounted) setIsLoadingOffers(false);
      }
    }
    fetchOffers();
    return () => {
      isMounted = false;
    };
  }, [cartItems]);

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setAppliedCoupon(null);
    setDiscountPercent(0);
    setPromoCode("");
    showToast("Promo code removed");
  };

  // Promo Code Apply (supports typing or clicking from Best Offers)
  const handleApplyPromo = async (codeOverride?: string) => {
    const targetCode = (codeOverride || promoCode).trim().toUpperCase();

    if (appliedPromo && appliedPromo === targetCode) {
      handleRemovePromo();
      return;
    }

    if (!targetCode) {
      showToast("Please enter or select a promo code");
      return;
    }

    if (targetCode.length > 20) {
      showToast("Coupon code cannot exceed 20 characters");
      return;
    }

    if (!/^[A-Z0-9_-]+$/.test(targetCode)) {
      showToast("Coupon code can only contain letters, numbers, hyphens, and underscores");
      return;
    }

    setPromoCode(targetCode);
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
          code: targetCode,
          subtotal: currentSubtotal,
          items: cartItems.map((it) => ({
            id: it.id,
            price: it.price,
            quantity: it.qty,
          })),
        }),
      });

      const json = await res.json();
      const cData = json.data?.coupon || json.data || json;
      if (res.ok && cData && (cData.code || cData.id)) {
        const pct = cData.discountPercentage || 0;
        const savedAmt = cData.calculatedDiscount || (pct > 0 ? Math.round((currentSubtotal * pct) / 100) : (cData.discountAmount || 0));
        setAppliedCoupon(cData);
        setAppliedPromo(cData.code);
        setDiscountPercent(pct);
        showToast(cData.message || json?.message || `Coupon "${cData.code}" applied! Saved ₹${savedAmt}`);
      } else {
        const errorMsg = json?.message || json?.error || (typeof json === "string" ? json : `Coupon "${targetCode}" is invalid or requirements not met.`);
        setAppliedCoupon(null);
        setAppliedPromo(null);
        setDiscountPercent(0);
        showToast(errorMsg);
      }
    } catch (e) {
      console.error("Coupon validation error:", e);
      setAppliedCoupon(null);
      setAppliedPromo(null);
      setDiscountPercent(0);
      showToast(`Failed to validate coupon "${targetCode}".`);
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
    if (cartItems.length === 0 || subtotal <= 0) {
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
                      {item.selectedAddons && item.selectedAddons.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", margin: "4px 0" }}>
                          {item.selectedAddons.map((addon, idx) => (
                            <span
                              key={addon.id || `${addon.name}-${idx}`}
                              style={{
                                fontSize: "0.74rem",
                                fontWeight: "600",
                                color: "#C2410C",
                                backgroundColor: "#FFF7ED",
                                border: "1px solid #FFEDD5",
                                padding: "2px 8px",
                                borderRadius: "6px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <span>+ {addon.name}</span>
                              <strong style={{ color: "#EA580C" }}>(₹{addon.price})</strong>
                            </span>
                          ))}
                        </div>
                      )}
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
            {/* 1. Promo Code & Best Offers Section */}
            <div className={styles.promoSectionWrapper}>
              {appliedPromo ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "#F0FDF4",
                    border: "1.5px solid #86EFAC",
                    borderRadius: "14px",
                    padding: "12px 16px",
                    gap: "10px",
                    boxShadow: "0 2px 8px rgba(22, 163, 74, 0.08)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1, overflow: "hidden" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        backgroundColor: "#DCFCE7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#16A34A",
                        flexShrink: 0,
                      }}
                    >
                      <Check size={16} strokeWidth={3} />
                    </div>
                    <div style={{ minWidth: 0, overflow: "hidden", flex: 1 }}>
                      <div 
                        title={appliedCouponData?.code || appliedPromo}
                        style={{ 
                          fontSize: "0.88rem", 
                          fontWeight: "800", 
                          color: "#15803D", 
                          letterSpacing: "0.5px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {appliedCouponData?.code || appliedPromo}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#166534", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        -₹{discountAmount} discount applied {discountPercent > 0 ? `(${discountPercent}%)` : ""}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      backgroundColor: "#DC2626",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "6px",
                      padding: "6px 10px",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      flexShrink: 0,
                      transition: "all 0.15s ease",
                    }}
                    title="Remove applied coupon"
                  >
                    <X size={13} strokeWidth={2.5} />
                    <span>Remove</span>
                  </button>
                </div>
              ) : (
                <div className={styles.promoCard}>
                  <div className={styles.promoInputBox}>
                    <Tag size={18} className={styles.promoTagIcon} />
                    <input
                      type="text"
                      maxLength={20}
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleApplyPromo();
                        }
                      }}
                      disabled={isValidatingPromo}
                      className={styles.promoInput}
                    />
                  </div>
                  <button
                    type="button"
                    className={styles.applyButton}
                    onClick={() => handleApplyPromo()}
                    disabled={!promoCode.trim() || isValidatingPromo}
                  >
                    {isValidatingPromo ? "..." : "Apply"}
                  </button>
                </div>
              )}

              {/* Best Offers & Available Coupons Section */}
              {availableOffers.length > 0 && (
                <div className={styles.bestOffersContainer}>
                  <div className={styles.bestOffersHeader}>
                    <Sparkles size={16} className={styles.bestOffersIcon} />
                    <span className={styles.bestOffersTitle}>Best Offers & Available Coupons</span>
                  </div>
                  <div className={styles.bestOffersList}>
                    {availableOffers.map((offer) => {
                      const isCurrentApplied = (appliedCouponData?.code || appliedPromo) === offer.code;
                      const minMet = !offer.minimumCartValue || subtotal >= offer.minimumCartValue;

                      return (
                        <div
                          key={offer.id || offer.code}
                          className={`${styles.offerCard} ${isCurrentApplied ? styles.offerCardApplied : ""}`}
                          onClick={() => {
                            if (!isCurrentApplied) {
                              handleApplyPromo(offer.code);
                            }
                          }}
                        >
                          <div className={styles.offerCardLeft}>
                            <div className={styles.offerCodeRow}>
                              <span className={styles.offerCodeBadge}>{offer.code}</span>
                              {offer.discountPercentage ? (
                                <span className={styles.offerSaveBadge}>{offer.discountPercentage}% OFF</span>
                              ) : offer.discountAmount ? (
                                <span className={styles.offerSaveBadge}>FLAT ₹{offer.discountAmount} OFF</span>
                              ) : null}
                            </div>
                            <p className={styles.offerDescription}>
                              {offer.description || (offer.discountPercentage ? `Get ${offer.discountPercentage}% off` : `Get ₹${offer.discountAmount} flat off`)}
                            </p>
                            {offer.minimumCartValue > 0 && (
                              <span className={`${styles.offerMinCart} ${!minMet ? styles.offerMinCartWarning : ""}`}>
                                {minMet ? `Min cart ₹${offer.minimumCartValue}` : `Add ₹${offer.minimumCartValue - subtotal} more to unlock`}
                              </span>
                            )}
                          </div>

                          <div className={styles.offerCardRight}>
                            {isCurrentApplied ? (
                              <button
                                type="button"
                                className={styles.offerAppliedBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemovePromo();
                                }}
                              >
                                <Check size={13} strokeWidth={3} />
                                <span>Applied</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className={styles.offerApplyBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApplyPromo(offer.code);
                                }}
                                disabled={isValidatingPromo}
                              >
                                Apply
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
                disabled={cartItems.length === 0 || subtotal <= 0}
                style={{
                  opacity: cartItems.length === 0 || subtotal <= 0 ? 0.6 : 1,
                  cursor: cartItems.length === 0 || subtotal <= 0 ? "not-allowed" : "pointer",
                  backgroundColor: cartItems.length === 0 || subtotal <= 0 ? "#94A3B8" : undefined,
                }}
              >
                <span>
                  {cartItems.length === 0 || subtotal <= 0
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
