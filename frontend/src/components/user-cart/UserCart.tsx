"use client";

import React, { useState, useEffect } from "react";
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
  AlertCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import { useLocation } from "@/components/location-provider";
import { calculateDistanceKm, getPincodeCoordinates, MAX_DELIVERY_RADIUS_KM } from "@/lib/geo-distance";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/explore-desktop/footer";
import { AddonCustomizationModal } from "@/components/cart/AddonCustomizationModal";
import { fetchApi } from "@/lib/fetch-api";
import styles from "./UserCart.module.css";

export interface UserCartItem {
  id: string;
  foodItemId?: string;
  name: string;
  description: string;
  price: number;
  basePrice?: number;
  addonsTotal?: number;
  selectedAddons?: Array<{ id?: string; name: string; price: number }>;
  addons?: Array<{ id?: string; name: string; price: number }>;
  qty: number;
  image: string;
  maxStock?: number;
  itemType?: string;
  sellerId?: string;
  sellerName?: string;
}

export interface UserCartProps {
  initialItems?: UserCartItem[];
  defaultLocation?: string;
  defaultAddress?: string;
  onProceedToCheckout?: () => void;
}

const DEFAULT_BEST_OFFERS = [
  {
    id: "neo50-offer",
    code: "NEO50",
    description: "50% Instant Discount on orders above ₹149",
    discountPercentage: 50,
    maxDiscountAmount: 120,
    minimumCartValue: 149,
    discountType: "PERCENTAGE",
  },
  {
    id: "welcome50-offer",
    code: "WELCOME50",
    description: "Get 50% OFF on your first order",
    discountPercentage: 50,
    maxDiscountAmount: 150,
    minimumCartValue: 199,
    discountType: "PERCENTAGE",
  },
  {
    id: "flat100-offer",
    code: "FLAT100",
    description: "Flat ₹100 OFF on orders above ₹399",
    discountAmount: 100,
    minimumCartValue: 399,
    discountType: "FLAT",
  },
  {
    id: "neobite20-offer",
    code: "NEOBITE20",
    description: "Flat 20% OFF on all cloud kitchen specials",
    discountPercentage: 20,
    maxDiscountAmount: 80,
    minimumCartValue: 99,
    discountType: "PERCENTAGE",
  },
];

export const UserCart: React.FC<UserCartProps> = ({
  initialItems = [],
  defaultLocation = "Select Location",
  defaultAddress: defaultAddressProp = "",
  onProceedToCheckout,
}) => {
  const router = useRouter();
  const { cartItems: contextCartItems, addToCart, decreaseQuantity, removeFromCart, updateItemAddons, cartTotal, syncCartWithLiveMenu } = useCart();
  const { defaultAddress, savedAddresses, openLocationModal, selectAddress } = useLocation();

  // State Management
  const [localCartItems, setLocalCartItems] = useState<UserCartItem[]>(initialItems);
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
    calculatedDiscount?: number;
  } | null>(null);
  const appliedCouponData = appliedCoupon;
  const [isValidatingPromo, setIsValidatingPromo] = useState<boolean>(false);
  const [availableOffers, setAvailableOffers] = useState<any[]>(DEFAULT_BEST_OFFERS);
  const [isLoadingOffers, setIsLoadingOffers] = useState<boolean>(false);

  // Sync formatted current address from LocationProvider's defaultAddress or savedAddresses
  const formattedDefaultAddress = React.useMemo(() => {
    if (defaultAddress) {
      const parts = [defaultAddress.houseNumber, defaultAddress.street, defaultAddress.locality, defaultAddress.landmark].filter(Boolean);
      const line = parts.join(", ");
      return defaultAddress.pincode ? `${line} - ${defaultAddress.pincode}` : line;
    }
    if (savedAddresses && savedAddresses.length > 0) {
      const def = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
      const parts = [def.houseNumber, def.street, def.locality, def.landmark].filter(Boolean);
      const line = parts.join(", ");
      return def.pincode ? `${line} - ${def.pincode}` : line;
    }
    return defaultAddressProp || "No address selected";
  }, [defaultAddress, defaultAddressProp, savedAddresses]);

  const [currentAddress, setCurrentAddress] = useState<string>(formattedDefaultAddress);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [customizingItem, setCustomizingItem] = useState<UserCartItem | null>(null);
  const [isSellerClosed, setIsSellerClosed] = useState<boolean>(false);
  const [sellerDetails, setSellerDetails] = useState<any>(null);

  // Sync with live seller prices on mount
  useEffect(() => {
    syncCartWithLiveMenu();
  }, [syncCartWithLiveMenu]);

  useEffect(() => {
    setCurrentAddress(formattedDefaultAddress);
  }, [formattedDefaultAddress]);

  // Active items derived from context if present
  const cartItems: UserCartItem[] = contextCartItems.length > 0
    ? contextCartItems.map((ci) => ({
        id: ci.id,
        foodItemId: ci.foodItemId,
        name: ci.name,
        description: ci.sellerName ? `From ${ci.sellerName}` : "Fresh gourmet preparation",
        price: ci.price,
        basePrice: ci.basePrice,
        addonsTotal: ci.addonsTotal,
        selectedAddons: ci.selectedAddons,
        addons: ci.addons,
        qty: ci.quantity,
        image: ci.imageUrl || ci.image || "/images/places/place-pizza.png",
        maxStock: ci.maxStock !== undefined ? ci.maxStock : (ci.stockQuantity !== undefined ? ci.stockQuantity : -1),
        itemType: ci.itemType,
        sellerId: ci.sellerId,
        sellerName: ci.sellerName,
      }))
    : localCartItems;

  React.useEffect(() => {
    const sellerId = cartItems.find((ci) => ci.sellerId)?.sellerId;
    if (!sellerId) {
      setSellerDetails(null);
      return;
    }

    let isMounted = true;
    async function checkSellerStatus() {
      try {
        const res = await fetchApi(`/api/public/shop/${encodeURIComponent(sellerId as string)}`);
        if (res.ok && isMounted) {
          const json = await res.json();
          const sellerObj = json.data || json;
          setSellerDetails(sellerObj);
          if (sellerObj && sellerObj.isOnline === false) {
            setIsSellerClosed(true);
          } else {
            setIsSellerClosed(false);
          }
          // Automatically sync live item prices & stock from sellerObj.foodItems
          if (Array.isArray(sellerObj?.foodItems) && sellerObj.foodItems.length > 0) {
            syncCartWithLiveMenu();
          }
        }
      } catch (e) {
        // Silently continue
      }
    }
    checkSellerStatus();

    return () => {
      isMounted = false;
    };
  }, [cartItems, syncCartWithLiveMenu]);

  // Coverage calculation
  const { isOutsideCoverage, shopDistanceKm, maxDeliveryRadius } = React.useMemo(() => {
    if (!sellerDetails || cartItems.length === 0) {
      return { isOutsideCoverage: false, shopDistanceKm: null, maxDeliveryRadius: MAX_DELIVERY_RADIUS_KM };
    }

    const sellerCoords = (sellerDetails.latitude && sellerDetails.longitude)
      ? { lat: Number(sellerDetails.latitude), lng: Number(sellerDetails.longitude) }
      : getPincodeCoordinates(sellerDetails.user?.pincode);
    
    const sellerLat = sellerCoords?.lat ?? null;
    const sellerLng = sellerCoords?.lng ?? null;

    let userLat: number | null = null;
    let userLng: number | null = null;

    if (defaultAddress?.latitude && defaultAddress?.longitude) {
      userLat = Number(defaultAddress.latitude);
      userLng = Number(defaultAddress.longitude);
    } else {
      const activePin = defaultAddress?.pincode || (typeof window !== "undefined" ? localStorage.getItem("active-selected-pincode") || localStorage.getItem("guest-pincode") : null);
      const userCoords = getPincodeCoordinates(activePin);
      if (userCoords) {
        userLat = userCoords.lat;
        userLng = userCoords.lng;
      }
    }

    const maxRadius = sellerDetails.deliveryRadiusKm || MAX_DELIVERY_RADIUS_KM; // 5.0 km

    if (userLat !== null && userLng !== null && sellerLat !== null && sellerLng !== null) {
      const distance = calculateDistanceKm(userLat, userLng, sellerLat, sellerLng);
      return {
        isOutsideCoverage: distance > maxRadius,
        shopDistanceKm: distance,
        maxDeliveryRadius: maxRadius,
      };
    }

    // Pincode fallback
    const userPin = defaultAddress?.pincode || (typeof window !== "undefined" ? localStorage.getItem("active-selected-pincode") : "");
    if (userPin && sellerDetails.user?.pincode) {
      const userPinCoords = getPincodeCoordinates(userPin);
      const sellerPinCoords = getPincodeCoordinates(sellerDetails.user.pincode);
      if (userPinCoords && sellerPinCoords) {
        const pinDistance = calculateDistanceKm(userPinCoords.lat, userPinCoords.lng, sellerPinCoords.lat, sellerPinCoords.lng);
        return {
          isOutsideCoverage: pinDistance > maxRadius,
          shopDistanceKm: pinDistance,
          maxDeliveryRadius: maxRadius,
        };
      }
    }

    return { isOutsideCoverage: false, shopDistanceKm: null, maxDeliveryRadius: maxRadius };
  }, [sellerDetails, cartItems, defaultAddress]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Recommendations for add-ons not yet chosen across cart items
  const availableAddonRecommendations = React.useMemo(() => {
    const list: Array<{ item: UserCartItem; addon: { id?: string; name: string; price: number } }> = [];
    cartItems.forEach((item) => {
      if (item.addons && Array.isArray(item.addons)) {
        const selectedNames = new Set((item.selectedAddons || []).map((a) => (a.name || "").toLowerCase()));
        item.addons.forEach((addon) => {
          if (!selectedNames.has((addon.name || "").toLowerCase())) {
            list.push({ item, addon });
          }
        });
      }
    });
    return list;
  }, [cartItems]);

  const handleQuickAddAddon = (item: UserCartItem, addon: { id?: string; name: string; price: number }) => {
    const newSelected = [...(item.selectedAddons || []), addon];
    updateItemAddons(item.id, newSelected);
    showToast(`Added ${addon.name} (+₹${addon.price}) to ${item.name}`);
  };

  // Quantity Handlers
  const handleQtyChange = (id: string, delta: number) => {
    const existing = contextCartItems.find((ci) => ci.id === id);
    if (existing) {
      if (delta > 0) {
        const rawStock = existing.maxStock !== undefined ? existing.maxStock : existing.stockQuantity;
        const stockLimit = rawStock !== undefined && rawStock !== null && !isNaN(Number(rawStock)) ? Number(rawStock) : -1;
        if (stockLimit !== -1 && existing.quantity >= stockLimit) {
          showToast("Maximum available quantity reached.");
          return;
        }
        addToCart({
          id: existing.id,
          foodItemId: existing.foodItemId || existing.id,
          name: existing.name,
          variantName: existing.variantName,
          price: existing.price,
          basePrice: existing.basePrice,
          addonsTotal: existing.addonsTotal,
          selectedAddons: existing.selectedAddons,
          addons: existing.addons,
          quantity: 1,
          sellerId: existing.sellerId,
          sellerName: existing.sellerName,
          image: existing.imageUrl || existing.image,
          imageUrl: existing.imageUrl || existing.image,
          maxStock: existing.maxStock,
          stockQuantity: existing.stockQuantity,
          itemType: existing.itemType,
        });
      } else {
        decreaseQuantity(id);
      }
    } else {
      setLocalCartItems((prev) =>
        prev
          .map((item) => {
            if (item.id === id) {
              if (delta > 0 && item.maxStock !== undefined && item.maxStock !== -1 && item.qty >= item.maxStock) {
                showToast("Maximum available quantity reached.");
                return item;
              }
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

  // Fetch available public coupons for the seller / platform
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
          if (Array.isArray(serverCoupons) && serverCoupons.length > 0) {
            const map = new Map();
            serverCoupons.forEach((c: any) => map.set(c.code.toUpperCase(), c));
            DEFAULT_BEST_OFFERS.forEach((c) => {
              if (!map.has(c.code.toUpperCase())) {
                map.set(c.code.toUpperCase(), c);
              }
            });
            setAvailableOffers(Array.from(map.values()));
          } else {
            setAvailableOffers(DEFAULT_BEST_OFFERS);
          }
        }
      } catch {
        if (isMounted) setAvailableOffers(DEFAULT_BEST_OFFERS);
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
    setAppliedCoupon(null);
    setAppliedPromo(null);
    setDiscountPercent(0);
    setPromoCode("");
    showToast("Coupon removed");
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

    // Auto-populate input field when clicked from offers list
    setPromoCode(targetCode);

    const currentSubtotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
    const cartSellerId = cartItems.find((ci) => ci.sellerId)?.sellerId || cartItems[0]?.sellerId;

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
          sellerId: cartSellerId,
          subtotal: currentSubtotal,
          items: cartItems.map((it) => ({
            id: it.id,
            foodItemId: it.foodItemId,
            price: it.price,
            quantity: it.qty,
          })),
          userId: session?.user?.id,
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
        // Match against available offers list or fallback rules
        const matchedOffer = availableOffers.find((c) => c.code.toUpperCase() === targetCode) ||
          DEFAULT_BEST_OFFERS.find((c) => c.code.toUpperCase() === targetCode);

        if (matchedOffer) {
          const minCart = matchedOffer.minimumCartValue || 0;
          if (currentSubtotal < minCart) {
            showToast(`Add ₹${minCart - currentSubtotal} more to apply "${targetCode}" (Min cart ₹${minCart})`);
            return;
          }

          let discount = 0;
          if (matchedOffer.discountType === "PERCENTAGE" || matchedOffer.discountPercentage) {
            const pct = matchedOffer.discountPercentage || 0;
            discount = Math.round((currentSubtotal * pct) / 100);
            if (matchedOffer.maxDiscountAmount && discount > matchedOffer.maxDiscountAmount) {
              discount = matchedOffer.maxDiscountAmount;
            }
            setDiscountPercent(pct);
          } else {
            discount = Math.min(matchedOffer.discountAmount || 0, currentSubtotal);
            setDiscountPercent(0);
          }

          setAppliedCoupon({
            id: matchedOffer.id || matchedOffer.code,
            code: matchedOffer.code,
            discountType: matchedOffer.discountType || "PERCENTAGE",
            discountPercentage: matchedOffer.discountPercentage,
            discountAmount: matchedOffer.discountAmount,
            maxDiscountAmount: matchedOffer.maxDiscountAmount,
            minimumCartValue: matchedOffer.minimumCartValue,
            calculatedDiscount: discount,
          });
          setAppliedPromo(matchedOffer.code);
          showToast(`Offer "${matchedOffer.code}" applied! Saved ₹${discount}`);
        } else if (targetCode === "NEO50" && currentSubtotal >= 100) {
          const discount = Math.min(Math.round((currentSubtotal * 50) / 100), 120);
          setAppliedCoupon({
            id: "mock-neo50",
            code: "NEO50",
            discountType: "PERCENTAGE",
            discountPercentage: 50,
            discountLabel: "50% OFF",
            calculatedDiscount: discount,
          });
          setAppliedPromo(targetCode);
          setDiscountPercent(50);
          showToast(`Super offer "${targetCode}" applied! 50% discount`);
        } else if ((targetCode === "WELCOME20" || targetCode === "WELCOME50" || targetCode === "NEO20" || targetCode === "DISCOUNT20" || targetCode === "NEOBITE20") && currentSubtotal >= 99) {
          const discount = Math.round((currentSubtotal * 20) / 100);
          setAppliedCoupon({
            id: `mock-${targetCode.toLowerCase()}`,
            code: targetCode,
            discountType: "PERCENTAGE",
            discountPercentage: 20,
            discountLabel: "20% OFF",
            calculatedDiscount: discount,
          });
          setAppliedPromo(targetCode);
          setDiscountPercent(20);
          showToast(`Coupon "${targetCode}" applied! Saved ₹${discount}`);
        } else {
          setAppliedCoupon(null);
          setAppliedPromo(null);
          setDiscountPercent(0);
          showToast(errorMsg);
        }
      }
    } catch (e) {
      console.error("Coupon validation error:", e);
      if (targetCode === "NEO50") {
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
      } else if (targetCode === "NEO20" || targetCode === "WELCOME20" || targetCode === "DISCOUNT20" || targetCode === "NEOBITE20") {
        setAppliedCoupon({
          id: `mock-${targetCode.toLowerCase()}`,
          code: targetCode,
          discountType: "PERCENTAGE",
          discountPercentage: 20,
          discountLabel: "20% OFF",
        });
        setAppliedPromo(targetCode);
        setDiscountPercent(20);
        showToast(`Promo code "${targetCode}" applied! 20% discount`);
      } else {
        setAppliedCoupon(null);
        setAppliedPromo(null);
        setDiscountPercent(0);
        showToast(`Failed to validate coupon "${targetCode}".`);
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

  const { data: session, status } = useSession();
  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.qty, 0);

  const handleCheckoutClick = () => {
    if (cartItems.length === 0 || grandTotal <= 0 || subtotal <= 0) {
      showToast("Your cart is empty. Please add a product to the cart before placing an order.");
      return;
    }
    if (isSellerClosed) {
      showToast("This kitchen is currently closed and not accepting orders.");
      return;
    }
    if (isOutsideCoverage) {
      showToast(`Your delivery location is ${shopDistanceKm ? `${shopDistanceKm} km away, ` : ""}outside this kitchen's ${maxDeliveryRadius} km coverage area.`);
      openLocationModal();
      return;
    }
    if (onProceedToCheckout) {
      onProceedToCheckout();
    } else if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent("/checkout")}`);
    } else {
      router.push("/checkout");
    }
  };

  return (
    <div className={styles.userCartWrapper}>
      {/* Shared Desktop Navbar (matching Home page navbar) */}
      <Navbar hideSearch={true} />

      {/* =========================================================
          2. CHECKOUT LAYOUT CONTAINER (1440px x 974px)
          ========================================================= */}
      <main className={styles.checkoutLayoutContainer}>
        {/* Stepper Progress Bar */}
        <section className={styles.stepperRow} aria-label="Checkout Progress">
          {/* Step 1: Cart (Active) */}
          <Link href="/cart" style={{ textDecoration: "none" }}>
            <div className={styles.stepPillActive} title="Cart">
              <span className={styles.activeDot} />
              <span>Cart</span>
            </div>
          </Link>

          <div className={styles.stepperLine} />

          {/* Step 2: Checkout (Inactive) */}
          <Link href="/checkout" style={{ textDecoration: "none" }}>
            <div
              className={styles.stepPillInactive}
              title="Go to Checkout"
            >
              <span className={styles.inactiveDot} />
              <span>Checkout</span>
            </div>
          </Link>

          <div className={styles.stepperLine} />

          {/* Step 3: Confirmation (Direct click revoked) */}
          <div
            className={styles.stepPillInactive}
            style={{ cursor: "not-allowed", opacity: 0.6 }}
            title="Complete required details and place order to access confirmation"
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
            {/* Closed Restaurant Alert Notice */}
            {isSellerClosed && (
              <div
                style={{
                  backgroundColor: "#FEF2F2",
                  border: "1.5px solid #FECACA",
                  borderRadius: "16px",
                  padding: "16px 20px",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                  boxShadow: "0 4px 14px rgba(239, 68, 68, 0.08)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px" }}>🔴</span>
                  <div>
                    <h3 style={{ margin: "0 0 2px 0", fontSize: "1rem", fontWeight: "800", color: "#991B1B" }}>
                      Cloud Kitchen is Currently Closed
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#DC2626" }}>
                      The kitchen for these items has turned off operations and is not accepting orders.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/explore-desktop")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "10px",
                    backgroundColor: "#DC2626",
                    color: "#FFFFFF",
                    fontWeight: "700",
                    fontSize: "0.82rem",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Explore Other Kitchens
                </button>
              </div>
            )}

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
                      
                      {/* Selected Add-ons Badge List */}
                      {item.selectedAddons && item.selectedAddons.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", margin: "6px 0 4px 0" }}>
                          {item.selectedAddons.map((addon, idx) => (
                            <span
                              key={addon.id || `${addon.name}-${idx}`}
                              style={{
                                fontSize: "0.76rem",
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

                      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "10px", marginTop: "4px" }}>
                        <span className={styles.itemPrice}>
                          ₹{item.price.toLocaleString("en-IN")}
                        </span>
                        {item.addonsTotal !== undefined && item.addonsTotal > 0 && item.basePrice !== undefined && (
                          <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: "500" }}>
                            (₹{item.basePrice} base + ₹{item.addonsTotal} add-ons)
                          </span>
                        )}
                      </div>

                      {/* Customize Button if Item has Add-ons available */}
                      {item.addons && item.addons.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setCustomizingItem(item)}
                          style={{
                            background: "none",
                            border: "none",
                            padding: "4px 0",
                            marginTop: "4px",
                            color: "#EA580C",
                            fontSize: "0.78rem",
                            fontWeight: "700",
                            cursor: "pointer",
                            textDecoration: "underline",
                            textAlign: "left",
                            width: "fit-content",
                          }}
                        >
                          ⚙️ Customize Add-ons
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right: Quantity Stepper & Remove */}
                  <div className={styles.itemRightActions}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
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
                          disabled={item.maxStock !== undefined && item.maxStock !== -1 && item.qty >= item.maxStock}
                          style={{
                            opacity: item.maxStock !== undefined && item.maxStock !== -1 && item.qty >= item.maxStock ? 0.35 : 1,
                            cursor: item.maxStock !== undefined && item.maxStock !== -1 && item.qty >= item.maxStock ? "not-allowed" : "pointer",
                          }}
                        >
                          <Plus size={14} strokeWidth={3} />
                        </button>
                      </div>
                      {(item.maxStock === 0) ? (
                        <span style={{ fontSize: "0.68rem", color: "#DC2626", fontWeight: "700", textAlign: "center", whiteSpace: "nowrap" }}>
                          Out of stock
                        </span>
                      ) : (item.maxStock !== undefined && item.maxStock !== -1 && item.qty >= item.maxStock) ? (
                        <span style={{ fontSize: "0.68rem", color: "#DC2626", fontWeight: "700", textAlign: "center", whiteSpace: "nowrap" }}>
                          Out of stock
                        </span>
                      ) : null}
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

            {/* Zomato-style Add-on Recommendation Strip */}
            {cartItems.length > 0 && availableAddonRecommendations.length > 0 && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "16px 20px",
                  backgroundColor: "#FFFBF7",
                  border: "1px dashed #FDBA74",
                  borderRadius: "14px",
                }}
              >
                <div style={{ marginBottom: "12px" }}>
                  <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "700", color: "#9A3412" }}>
                    🍛 Complete Your Meal with Add-ons
                  </h4>
                  <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "#C2410C" }}>
                    Add extra accompaniments to your dishes in one tap
                  </p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "10px" }}>
                  {availableAddonRecommendations.map(({ item, addon }) => (
                    <div
                      key={`${item.id}-${addon.id || addon.name}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #FED7AA",
                        borderRadius: "10px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                      }}
                    >
                      <div style={{ overflow: "hidden", marginRight: "8px" }}>
                        <div style={{ fontSize: "0.86rem", fontWeight: "700", color: "#1E293B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {addon.name}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                          for {item.name} • <strong style={{ color: "#EA580C" }}>+₹{addon.price}</strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleQuickAddAddon(item, addon)}
                        style={{
                          padding: "5px 12px",
                          backgroundColor: "#FFF7ED",
                          border: "1px solid #EA580C",
                          borderRadius: "6px",
                          color: "#EA580C",
                          fontWeight: "700",
                          fontSize: "0.78rem",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
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
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
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
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "0.88rem", fontWeight: "800", color: "#15803D", letterSpacing: "0.5px" }}>
                        {appliedCouponData?.code || appliedPromo}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#166534", fontWeight: "600" }}>
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
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
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
                            {offer.description || (offer.discountPercentage ? `Get ${offer.discountPercentage}% off on your meal` : `Get ₹${offer.discountAmount} flat off`)}
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

              {/* Coverage Warning Banner in Cart Summary if outside delivery coverage */}
              {isOutsideCoverage && (
                <div
                  style={{
                    backgroundColor: "#FEF2F2",
                    border: "1px solid #FCA5A5",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    marginBottom: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                    <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: "2px" }} />
                    <div>
                      <h4 style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700, color: "#991B1B" }}>
                        Outside Delivery Coverage Area
                      </h4>
                      <p style={{ margin: "3px 0 0 0", fontSize: "0.8rem", color: "#B91C1C", lineHeight: 1.4 }}>
                        Your current delivery location is <strong>{shopDistanceKm} km</strong> away from this restaurant. Maximum delivery coverage is <strong>{maxDeliveryRadius} km</strong>.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={openLocationModal}
                    style={{
                      alignSelf: "flex-start",
                      padding: "5px 12px",
                      borderRadius: "6px",
                      backgroundColor: "#DC2626",
                      color: "#FFFFFF",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Change Delivery Location
                  </button>
                </div>
              )}

              {/* Proceed to Checkout Button */}
              <button
                type="button"
                className={styles.checkoutButton}
                onClick={handleCheckoutClick}
                disabled={cartItems.length === 0 || grandTotal <= 0 || isSellerClosed || isOutsideCoverage}
                style={{
                  backgroundColor: isSellerClosed || isOutsideCoverage || cartItems.length === 0 || grandTotal <= 0 ? "#94A3B8" : undefined,
                  opacity: cartItems.length === 0 || grandTotal <= 0 || isSellerClosed || isOutsideCoverage ? 0.6 : 1,
                  cursor: cartItems.length === 0 || grandTotal <= 0 || isSellerClosed || isOutsideCoverage ? "not-allowed" : "pointer",
                }}
              >
                <span>
                  {isSellerClosed
                    ? "Kitchen Closed • Cannot Order"
                    : isOutsideCoverage
                    ? `Outside Coverage (${shopDistanceKm ? `${shopDistanceKm} km` : "> 5 km"})`
                    : cartItems.length === 0 || grandTotal <= 0
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
                [...savedAddresses]
                  .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0))
                  .map((addr) => {
                    const parts = [addr.houseNumber, addr.street, addr.locality, addr.landmark].filter(Boolean);
                    const fullAddr = `${parts.join(", ")} - ${addr.pincode}`;
                    const isSelected = defaultAddress?.id === addr.id || (defaultAddress?.pincode === addr.pincode && addr.isDefault);
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

      {/* Addon Customization Modal for Cart Item */}
      {customizingItem && (
        <AddonCustomizationModal
          isOpen={!!customizingItem}
          onClose={() => setCustomizingItem(null)}
          isEditMode={true}
          submitButtonText="Update Item"
          item={{
            id: customizingItem.id,
            name: customizingItem.name,
            basePrice: customizingItem.basePrice !== undefined ? customizingItem.basePrice : customizingItem.price,
            price: customizingItem.basePrice !== undefined ? customizingItem.basePrice : customizingItem.price,
            description: customizingItem.description,
            imageUrl: customizingItem.image,
            itemType: customizingItem.itemType,
            addons: customizingItem.addons || [],
          }}
          initialSelectedAddons={customizingItem.selectedAddons || []}
          onConfirm={(selectedAddons) => {
            updateItemAddons(customizingItem.id, selectedAddons);
            setCustomizingItem(null);
            showToast(`Updated add-ons for "${customizingItem.name}"`);
          }}
          onAddToCart={(selectedAddons) => {
            updateItemAddons(customizingItem.id, selectedAddons);
            setCustomizingItem(null);
            showToast(`Updated add-ons for "${customizingItem.name}"`);
          }}
        />
      )}

      {/* Global Responsive Footer */}
      <Footer />
    </div>
  );
};

export default UserCart;
