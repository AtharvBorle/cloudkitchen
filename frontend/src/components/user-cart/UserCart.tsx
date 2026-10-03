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
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import { useLocation } from "@/components/location-provider";
import { calculateDistanceKm, getPincodeCoordinates, MAX_DELIVERY_RADIUS_KM } from "@/lib/geo-distance";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/explore-desktop/footer";
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

const ScrollableAvailableAddonsRow: React.FC<{
  addons: Array<{ id?: string; name: string; price: number }>;
  onAdd: (addon: { id?: string; name: string; price: number }) => void;
}> = ({ addons, onAdd }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = React.useRef(0);
  const scrollLeftRef = React.useRef(0);
  const hasDraggedRef = React.useRef(false);

  const checkScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollWidth > clientWidth && scrollLeft < scrollWidth - clientWidth - 2);
  }, []);

  useEffect(() => {
    checkScroll();
    const raf = requestAnimationFrame(checkScroll);
    const t1 = setTimeout(checkScroll, 50);
    const t2 = setTimeout(checkScroll, 200);
    const handleResize = () => checkScroll();
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", handleResize);
    };
  }, [addons, checkScroll]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    setIsDragging(true);
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const el = scrollRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    if (Math.abs(walk) > 4) {
      hasDraggedRef.current = true;
    }
    el.scrollLeft = scrollLeftRef.current - walk;
    checkScroll();
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && el.scrollWidth > el.clientWidth) {
      el.scrollLeft += e.deltaY;
      checkScroll();
    }
  };

  return (
    <div className={styles.availableAddonsScrollWrapper}>
      <div
        className={`${styles.permanentScrollShadowLeft} ${
          addons.length >= 3 ? styles.visibleShadow : styles.hiddenShadow
        }`}
        aria-hidden="true"
      />
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onWheel={handleWheel}
        className={`${styles.availableAddonsList} ${isDragging ? styles.isDragging : ""}`}
      >
        {addons.map((addon, idx) => (
          <button
            key={addon.id ? `addon-btn-${addon.id}` : `addon-btn-${addon.name}-${idx}`}
            type="button"
            onClick={(e) => {
              if (hasDraggedRef.current) {
                e.preventDefault();
                return;
              }
              onAdd(addon);
            }}
            className={styles.availableAddonBtn}
            title={`Add ${addon.name} (+₹${addon.price})`}
          >
            <span>{addon.name}</span>
            <span className={styles.availableAddonPrice}>+₹{addon.price}</span>
            <span className={styles.availableAddonAddTag}>
              <Plus size={11} strokeWidth={3} />
              <span>Add</span>
            </span>
          </button>
        ))}
      </div>
      <div
        className={`${styles.permanentScrollShadowRight} ${
          addons.length >= 3 ? styles.visibleShadow : styles.hiddenShadow
        }`}
        aria-hidden="true"
      />
    </div>
  );
};

export const UserCart: React.FC<UserCartProps> = ({
  initialItems = [],
  defaultLocation = "Select Location",
  defaultAddress: defaultAddressProp = "",
  onProceedToCheckout,
}) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { cartItems: contextCartItems, addToCart, decreaseQuantity, removeFromCart, updateItemAddons, cartTotal, syncCartWithLiveMenu, clearCart } = useCart();
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
    appliesToProductId?: string | null;
    appliesToSellerId?: string | null;
    isAutoApply?: boolean;
  } | null>(null);
  const appliedCouponData = appliedCoupon;
  const [isValidatingPromo, setIsValidatingPromo] = useState<boolean>(false);
  const [availableOffers, setAvailableOffers] = useState<any[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState<boolean>(false);
  const [isCouponDropdownOpen, setIsCouponDropdownOpen] = useState<boolean>(false);
  const [couponSearchQuery, setCouponSearchQuery] = useState<string>("");
  const couponDropdownRef = React.useRef<HTMLDivElement>(null);

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
  const [isSellerClosed, setIsSellerClosed] = useState<boolean>(false);
  const [isSellerUnavailableDismissed, setIsSellerUnavailableDismissed] = useState<boolean>(false);
  const hasShownUnavailableToast = React.useRef<boolean>(false);
  const [sellerDetails, setSellerDetails] = useState<any>(null);

  // Sync with live seller prices on mount
  useEffect(() => {
    syncCartWithLiveMenu();
  }, [syncCartWithLiveMenu]);

  // Restore previously applied coupon from storage
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = sessionStorage.getItem("appliedCoupon") || localStorage.getItem("appliedCoupon");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.code || parsed.id)) {
            setAppliedCoupon(parsed);
            setAppliedPromo(parsed.code || "");
            setPromoCode(parsed.code || "");
            setDiscountPercent(parsed.discountPercentage || 0);
          }
        }
      }
    } catch (e) {
      console.error("Failed to restore applied coupon from storage:", e);
    }
  }, []);

  useEffect(() => {
    setCurrentAddress(formattedDefaultAddress);
  }, [formattedDefaultAddress]);

  // Active items derived from context if present (memoized to prevent re-render loops)
  const cartItems: UserCartItem[] = React.useMemo(() => {
    return contextCartItems.length > 0
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
  }, [contextCartItems, localCartItems]);

  const currentSellerId = React.useMemo(() => {
    return cartItems.find((ci) => ci.sellerId)?.sellerId || null;
  }, [cartItems]);

  React.useEffect(() => {
    if (!currentSellerId) {
      setSellerDetails(null);
      setIsSellerClosed(false);
      hasShownUnavailableToast.current = false;
      return;
    }

    let isMounted = true;
    async function checkSellerStatus() {
      try {
        const res = await fetchApi(`/api/public/shop/${encodeURIComponent(currentSellerId as string)}`);
        if (res.ok && isMounted) {
          const json = await res.json();
          const sellerObj = json.data || json;
          setSellerDetails(sellerObj);
          if (
            !sellerObj ||
            sellerObj.isOnline === false ||
            sellerObj.user?.isActive === false ||
            (sellerObj.verificationStatus && sellerObj.verificationStatus !== "APPROVED")
          ) {
            setIsSellerClosed(true);
            if (!hasShownUnavailableToast.current) {
              hasShownUnavailableToast.current = true;
              showToast("This kitchen is currently unavailable. Please try another kitchen.");
            }
          } else {
            setIsSellerClosed(false);
            hasShownUnavailableToast.current = false;
          }
        } else if (res.status === 404 || !res.ok) {
          if (isMounted) {
            setIsSellerClosed(true);
            setSellerDetails(null);
            if (!hasShownUnavailableToast.current) {
              hasShownUnavailableToast.current = true;
              showToast("This kitchen is currently unavailable. Please try another kitchen.");
            }
          }
        }
      } catch (e) {
        // Silently continue
      }
    }
    checkSellerStatus();

    // Real-time polling every 3 seconds to immediately detect superadmin disable/status changes without manual page reload
    const pollInterval = setInterval(checkSellerStatus, 3000);

    const handleFocus = () => {
      checkSellerStatus();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkSellerStatus();
      }
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentSellerId]);

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

  // Parse add-ons from string or array safely and deduplicate
  const parseItemAddons = (raw: any): Array<{ id?: string; name: string; price: number }> => {
    if (!raw) return [];
    try {
      const list = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (Array.isArray(list)) {
        const seenNames = new Set<string>();
        const result: Array<{ id?: string; name: string; price: number }> = [];
        list.forEach((a: any, idx: number) => {
          if (!a || !(a.name || "").trim()) return;
          const cleanName = String(a.name || "").trim();
          const lowerName = cleanName.toLowerCase();
          if (seenNames.has(lowerName)) return;
          seenNames.add(lowerName);

          const cleanId = a.id ? String(a.id) : `addon_${idx + 1}_${lowerName.replace(/\s+/g, "_")}`;
          const cleanPrice =
            typeof a.price === "number"
              ? a.price
              : parseFloat(String(a.price).replace(/[^0-9.]/g, "")) || 0;
          result.push({
            id: cleanId,
            name: cleanName,
            price: Math.max(0, cleanPrice),
          });
        });
        return result;
      }
    } catch {}
    return [];
  };

  // Get all configured add-ons available for this dish (either from cart item or live seller menu)
  const getDishAvailableAddons = (item: UserCartItem): Array<{ id?: string; name: string; price: number }> => {
    let raw: any = item.addons;
    if ((!raw || (Array.isArray(raw) && raw.length === 0)) && sellerDetails?.foodItems && Array.isArray(sellerDetails.foodItems)) {
      const baseId = item.foodItemId || (item.id.includes("_") ? item.id.split("_")[0] : item.id);
      const fi = sellerDetails.foodItems.find((f: any) => f.id === baseId || (f.name && item.name && f.name.toLowerCase().trim() === item.name.toLowerCase().trim()));
      if (fi) {
        raw = fi.addons || fi.variants;
      }
    }
    return parseItemAddons(raw);
  };

  const handleAddAddonToItem = (item: UserCartItem, addon: { id?: string; name: string; price: number }) => {
    const currentSelected = item.selectedAddons || [];
    const lowerName = (addon.name || "").toLowerCase().trim();
    if (currentSelected.some(a => (a.name || "").toLowerCase().trim() === lowerName || (addon.id && a.id === addon.id))) {
      showToast(`${addon.name} is already added to this item`);
      return;
    }
    const newSelected = [...currentSelected, addon];
    updateItemAddons(item.id, newSelected);
    showToast(`Added ${addon.name} (+₹${addon.price}) to ${item.name}`);
  };

  const handleRemoveAddonFromItem = (item: UserCartItem, addonIndex: number) => {
    const currentSelected = item.selectedAddons || [];
    const removed = currentSelected[addonIndex];
    const newSelected = currentSelected.filter((_, i) => i !== addonIndex);
    updateItemAddons(item.id, newSelected);
    if (removed) {
      showToast(`Removed ${removed.name} from ${item.name}`);
    }
  };

  // Quantity Handlers
  const handleQtyChange = (id: string, delta: number) => {
    const existing = contextCartItems.find((ci) => ci.id === id);
    if (existing) {
      if (delta > 0) {
        const rawStock = existing.maxStock !== undefined ? existing.maxStock : existing.stockQuantity;
        const stockLimit = rawStock !== undefined && rawStock !== null && !isNaN(Number(rawStock)) ? Number(rawStock) : -1;
        if (stockLimit !== -1 && existing.quantity >= stockLimit) {
          showToast(`We have only ${stockLimit} left in stock.`);
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
                showToast(`We have only ${item.maxStock} left in stock.`);
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

  // Pricing calculations (computed upfront for reactive hooks and offers)
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

  // Fetch available public coupons for the seller / platform
  const [userDismissedPromo, setUserDismissedPromo] = useState<boolean>(false);
  const activeSellerId = cartItems.find((ci) => ci.sellerId)?.sellerId || null;

  React.useEffect(() => {
    let isMounted = true;
    async function fetchOffers() {
      try {
        const targetSeller = currentSellerId || activeSellerId;
        const queryParams = new URLSearchParams();
        if (targetSeller) queryParams.set("sellerId", targetSeller);
        if (session?.user?.id) queryParams.set("userId", session.user.id);
        queryParams.set("_t", String(Date.now()));
        const url = `/api/public/coupons?${queryParams.toString()}`;
        const res = await fetchApi(url, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        });
        if (res.ok && isMounted) {
          const json = await res.json();
          const serverCoupons = Array.isArray(json)
            ? json
            : (json.data?.coupons || json.coupons || json.data || []);
          setAvailableOffers(Array.isArray(serverCoupons) ? serverCoupons : []);
        }
      } catch (err) {
        console.error("Failed to fetch available coupons:", err);
      } finally {
        if (isMounted) setIsLoadingOffers(false);
      }
    }

    setIsLoadingOffers(true);
    fetchOffers();

    // Real-time polling every 3 seconds for instant seller changes revalidation
    const pollInterval = setInterval(fetchOffers, 3000);

    const handleFocus = () => {
      fetchOffers();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchOffers();
      }
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentSellerId, activeSellerId, session?.user?.id]);

  // Live sync of applied coupon properties when seller changes them in real-time
  React.useEffect(() => {
    if (!appliedCoupon || availableOffers.length === 0) return;

    const matchedOffer = availableOffers.find(
      (o) =>
        (o.code && o.code.toUpperCase() === (appliedCoupon.code || "").toUpperCase()) ||
        (o.id && o.id === appliedCoupon.id)
    );

    if (!matchedOffer) {
      if ((appliedCoupon as any).isAutoApply) {
        setAppliedCoupon(null);
        setAppliedPromo(null);
        setDiscountPercent(0);
        setPromoCode("");
        lastAutoAppliedCodeRef.current = null;
        if (typeof window !== "undefined") {
          try {
            sessionStorage.removeItem("applied_cart_coupon");
            sessionStorage.removeItem("appliedCoupon");
            localStorage.removeItem("appliedCoupon");
          } catch (e) {}
        }
      }
      return;
    }

    const latestPct = Number(
      matchedOffer.discountPercentage ||
        (matchedOffer.discountType === "PERCENTAGE" ? matchedOffer.discountValue || 0 : 0)
    );
    const latestAmt =
      Number(matchedOffer.discountAmount || (matchedOffer.discountType === "FLAT" ? matchedOffer.discountValue || 0 : 0)) ||
      null;
    const latestMax = Number(matchedOffer.maxDiscountAmount) || null;
    const latestMinCart = Number(matchedOffer.minimumCartValue ?? matchedOffer.minOrderAmount ?? 0);
    const latestType = matchedOffer.discountType || (latestPct > 0 ? "PERCENTAGE" : "FLAT");

    const isPctChanged = Number(appliedCoupon.discountPercentage || 0) !== latestPct;
    const isAmtChanged = Number(appliedCoupon.discountAmount || 0) !== (latestAmt || 0);
    const isMaxChanged = Number(appliedCoupon.maxDiscountAmount || 0) !== (latestMax || 0);
    const isMinChanged = Number(appliedCoupon.minimumCartValue || 0) !== latestMinCart;
    const isTypeChanged = appliedCoupon.discountType !== latestType;

    if (isPctChanged || isAmtChanged || isMaxChanged || isMinChanged || isTypeChanged) {
      let recalculatedDiscount = 0;
      if (latestPct > 0) {
        recalculatedDiscount = Math.round((subtotal * latestPct) / 100);
        if (latestMax) recalculatedDiscount = Math.min(recalculatedDiscount, latestMax);
      } else if (latestAmt) {
        recalculatedDiscount = Math.min(latestAmt, subtotal);
      }

      const updatedCouponObj = {
        ...appliedCoupon,
        ...matchedOffer,
        discountType: latestType,
        discountPercentage: latestPct || null,
        discountAmount: latestAmt,
        maxDiscountAmount: latestMax,
        minimumCartValue: latestMinCart,
        calculatedDiscount: recalculatedDiscount,
      };

      setAppliedCoupon(updatedCouponObj);
      setDiscountPercent(latestPct);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("appliedCoupon", JSON.stringify(updatedCouponObj));
          sessionStorage.setItem("applied_cart_coupon", JSON.stringify(updatedCouponObj));
          localStorage.setItem("appliedCoupon", JSON.stringify(updatedCouponObj));
        } catch (e) {}
      }
    }
  }, [availableOffers, appliedCoupon, subtotal]);



  // Ref to track the last auto-applied coupon code (prevents re-apply loops)
  const lastAutoAppliedCodeRef = React.useRef<string | null>(null);

  // Auto-apply eligible coupon when conditions are met
  React.useEffect(() => {
    if (userDismissedPromo || isValidatingPromo || availableOffers.length === 0) {
      return;
    }

    if (subtotal <= 0) return;

    // Filter offers configured with isAutoApply that satisfy minimum cart & scope & eligibility
    const eligibleAutoOffers = availableOffers.filter((offer) => {
      if (offer.isEligible === false) return false;
      const isAuto = Boolean(offer.isAutoApply || offer.autoApply);
      if (!isAuto) return false;
      const minCart = Number(offer.minimumCartValue ?? offer.minOrderAmount ?? 0);
      if (subtotal < minCart) return false;

      // Check product scope if restricted
      if (offer.appliesToProductId) {
        const hasProduct = cartItems.some(
          (it) => it.id === offer.appliesToProductId || it.foodItemId === offer.appliesToProductId
        );
        if (!hasProduct) return false;
      }
      return true;
    });

    if (eligibleAutoOffers.length === 0) {
      // If currently applied was auto-applied and subtotal dropped below threshold, remove it
      if (appliedCoupon && (appliedCoupon as any).isAutoApply) {
        setAppliedCoupon(null);
        setAppliedPromo(null);
        setDiscountPercent(0);
        setPromoCode("");
        lastAutoAppliedCodeRef.current = null;
        if (typeof window !== "undefined") {
          try {
            sessionStorage.removeItem("applied_cart_coupon");
            sessionStorage.removeItem("appliedCoupon");
            localStorage.removeItem("appliedCoupon");
          } catch (e) {}
        }
      }
      return;
    }

    // Find the offer providing maximum discount
    let bestOffer = eligibleAutoOffers[0];
    let maxDiscount = 0;

    for (const offer of eligibleAutoOffers) {
      const pct = Number(offer.discountPercentage || (offer.discountType === "PERCENTAGE" ? (offer.discountValue || 0) : 0));
      let disc = 0;
      if (pct > 0) {
        disc = Math.round((subtotal * pct) / 100);
        if (offer.maxDiscountAmount) disc = Math.min(disc, Number(offer.maxDiscountAmount));
      } else {
        disc = Math.min(Number(offer.discountAmount || offer.discountValue || 0), subtotal);
      }
      if (disc >= maxDiscount) {
        maxDiscount = disc;
        bestOffer = offer;
      }
    }

    // If a manual coupon is applied and still valid, do not override
    if (appliedPromo && !(appliedCoupon as any)?.isAutoApply) {
      const manualMin = Number(appliedCoupon?.minimumCartValue ?? (appliedCoupon as any)?.minOrderAmount ?? 0);
      if (manualMin <= 0 || subtotal >= manualMin) {
        return;
      }
    }

    const pct = Number(bestOffer.discountPercentage || (bestOffer.discountType === "PERCENTAGE" ? (bestOffer.discountValue || 0) : 0));
    const amt = Number(bestOffer.discountAmount || bestOffer.discountValue || 0) || null;
    const maxAmt = Number(bestOffer.maxDiscountAmount) || null;
    const minCart = Number(bestOffer.minimumCartValue || bestOffer.minOrderAmount || 0);

    // Skip if we already auto-applied this exact code and active coupon properties are identical
    if (
      lastAutoAppliedCodeRef.current === bestOffer.code &&
      appliedPromo === bestOffer.code &&
      appliedCoupon &&
      Number(appliedCoupon.discountPercentage || 0) === pct &&
      Number(appliedCoupon.discountAmount || 0) === (amt || 0) &&
      Number(appliedCoupon.maxDiscountAmount || 0) === (maxAmt || 0) &&
      Number(appliedCoupon.minimumCartValue || 0) === minCart
    ) {
      return;
    }

    const bestCode = bestOffer.code;
    lastAutoAppliedCodeRef.current = bestCode;

    // Immediately apply locally so UI reflects it synchronously
    const localCouponObj = {
      id: bestOffer.id,
      code: bestOffer.code,
      description: bestOffer.description,
      discountType: bestOffer.discountType || (pct > 0 ? "PERCENTAGE" : "FLAT"),
      discountPercentage: pct || null,
      discountAmount: Number(bestOffer.discountAmount || bestOffer.discountValue || 0) || null,
      maxDiscountAmount: Number(bestOffer.maxDiscountAmount) || null,
      minimumCartValue: Number(bestOffer.minimumCartValue || bestOffer.minOrderAmount || 0),
      calculatedDiscount: maxDiscount,
      isAutoApply: true,
      message: `Coupon "${bestOffer.code}" auto-applied! Saved ₹${maxDiscount}`
    };

    setAppliedCoupon(localCouponObj as any);
    setAppliedPromo(bestOffer.code);
    setDiscountPercent(pct);
    setPromoCode(bestOffer.code);

    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("appliedCoupon", JSON.stringify(localCouponObj));
        sessionStorage.setItem("applied_cart_coupon", JSON.stringify(localCouponObj));
        localStorage.setItem("appliedCoupon", JSON.stringify(localCouponObj));
      } catch (e) {}
    }

    // Background validation with server to ensure eligibility and sync exact server calculated values
    (async () => {
      try {
        setIsValidatingPromo(true);
        const cartSellerId = cartItems.find((ci) => ci.sellerId)?.sellerId || cartItems[0]?.sellerId;
        const currentSubtotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
        const res = await fetchApi("/api/public/coupons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: bestCode,
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
          const validatedPct = Number(cData.discountPercentage || 0);
          const savedAmt = Number(cData.calculatedDiscount) || (validatedPct > 0 ? Math.round((currentSubtotal * validatedPct) / 100) : Number(cData.discountAmount || 0));
          const validatedObj = {
            ...cData,
            isAutoApply: true,
            calculatedDiscount: savedAmt,
          };
          setAppliedCoupon(validatedObj);
          setAppliedPromo(cData.code);
          setDiscountPercent(validatedPct);
          setPromoCode(cData.code);
          if (typeof window !== "undefined") {
            try {
              sessionStorage.setItem("appliedCoupon", JSON.stringify(validatedObj));
              sessionStorage.setItem("applied_cart_coupon", JSON.stringify(validatedObj));
              localStorage.setItem("appliedCoupon", JSON.stringify(validatedObj));
            } catch (e) {}
          }
          showToast(`Coupon "${cData.code}" auto-applied! Saved ₹${savedAmt}`);
        } else {
          // Server rejected — clear auto-applied coupon
          lastAutoAppliedCodeRef.current = null;
          setAppliedCoupon(null);
          setAppliedPromo(null);
          setDiscountPercent(0);
          setPromoCode("");
          if (typeof window !== "undefined") {
            try {
              sessionStorage.removeItem("applied_cart_coupon");
              sessionStorage.removeItem("appliedCoupon");
              localStorage.removeItem("appliedCoupon");
            } catch (e) {}
          }
        }
      } catch (e) {
        console.error("Auto-apply coupon validation error:", e);
      } finally {
        setIsValidatingPromo(false);
      }
    })();
  }, [availableOffers, subtotal, userDismissedPromo, appliedPromo, appliedCoupon, isValidatingPromo, activeSellerId, cartItems, session?.user?.id]);

  // Check if coupon item-level scope is satisfied by cart items
  const isCouponItemApplicable = (coupon: any, items: UserCartItem[]) => {
    if (!coupon || !coupon.appliesToProductId) return true;
    const allowedKeys = String(coupon.appliesToProductId)
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (allowedKeys.length === 0) return true;

    return items.some((it) => {
      const itemId = String(it.id || "").toLowerCase();
      const foodItemId = String(it.foodItemId || "").toLowerCase();
      const baseId = itemId.includes("_") ? itemId.split("_")[0] : itemId;
      const name = String(it.name || "").toLowerCase().trim();
      return allowedKeys.some((k) => k === itemId || k === foodItemId || k === baseId || k === name);
    });
  };

  // Auto-remove or invalidate applied coupon whenever subtotal drops below minimum cart value or required item is removed
  React.useEffect(() => {
    if (!appliedCoupon) return;
    const minCart = Number(appliedCoupon.minimumCartValue ?? (appliedCoupon as any).minOrderAmount ?? 0);
    if (minCart > 0 && subtotal < minCart) {
      const code = appliedCoupon.code || appliedPromo || "Applied";
      setAppliedCoupon(null);
      setAppliedPromo(null);
      setDiscountPercent(0);
      setPromoCode("");
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem("applied_cart_coupon");
          sessionStorage.removeItem("appliedCoupon");
          localStorage.removeItem("appliedCoupon");
        } catch (e) {}
      }
      showToast(`Coupon "${code}" removed. Minimum cart value of ₹${minCart} required.`);
      return;
    }

    if (appliedCoupon.appliesToProductId && cartItems.length > 0) {
      const isApplicable = isCouponItemApplicable(appliedCoupon, cartItems);
      if (!isApplicable) {
        const code = appliedCoupon.code || appliedPromo || "Applied";
        setAppliedCoupon(null);
        setAppliedPromo(null);
        setDiscountPercent(0);
        setPromoCode("");
        if (typeof window !== "undefined") {
          try {
            sessionStorage.removeItem("applied_cart_coupon");
            sessionStorage.removeItem("appliedCoupon");
            localStorage.removeItem("appliedCoupon");
          } catch (e) {}
        }
        showToast(`Coupon "${code}" is no longer applicable as the required item was removed from your cart.`);
        return;
      }
    } else if (appliedCoupon.appliesToProductId && cartItems.length === 0) {
      setAppliedCoupon(null);
      setAppliedPromo(null);
      setDiscountPercent(0);
      setPromoCode("");
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem("applied_cart_coupon");
          sessionStorage.removeItem("appliedCoupon");
          localStorage.removeItem("appliedCoupon");
        } catch (e) {}
      }
    }
  }, [subtotal, cartItems, appliedCoupon, appliedPromo]);

  // Handle click outside to close coupon dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (couponDropdownRef.current && !couponDropdownRef.current.contains(event.target as Node)) {
        setIsCouponDropdownOpen(false);
      }
    }
    if (isCouponDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCouponDropdownOpen]);

  // Filter coupons based on user search query in the interactive dropdown
  const filteredOffers = React.useMemo(() => {
    if (!couponSearchQuery.trim()) return availableOffers;
    const q = couponSearchQuery.trim().toLowerCase();
    return availableOffers.filter((offer) => {
      const codeMatch = (offer.code || "").toLowerCase().includes(q);
      const descMatch = (offer.description || "").toLowerCase().includes(q);
      const discMatch = (offer.discountPercentage ? `${offer.discountPercentage}%` : `₹${offer.discountAmount || ""}`).toLowerCase().includes(q);
      return codeMatch || descMatch || discMatch;
    });
  }, [availableOffers, couponSearchQuery]);

  const handleRemovePromo = () => {
    setUserDismissedPromo(true);
    lastAutoAppliedCodeRef.current = null;
    setAppliedCoupon(null);
    setAppliedPromo(null);
    setDiscountPercent(0);
    setPromoCode("");
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("applied_cart_coupon");
        sessionStorage.removeItem("appliedCoupon");
        localStorage.removeItem("appliedCoupon");
      } catch (e) {}
    }
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

    if (targetCode.length > 20) {
      showToast("Coupon code cannot exceed 20 characters");
      return;
    }

    if (!/^[A-Z0-9_-]+$/.test(targetCode)) {
      showToast("Coupon code can only contain letters, numbers, hyphens, and underscores");
      return;
    }

    setUserDismissedPromo(false);
    lastAutoAppliedCodeRef.current = null;
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
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem("appliedCoupon", JSON.stringify(cData));
            localStorage.setItem("appliedCoupon", JSON.stringify(cData));
          } catch (e) {}
        }
        showToast(cData.message || json?.message || `Coupon "${cData.code}" applied! Saved ₹${savedAmt}`);
      } else {
        const errorMsg = json?.message || json?.error || (typeof json === "string" ? json : `Coupon "${targetCode}" is invalid or requirements not met.`);
        setAppliedCoupon(null);
        setAppliedPromo(null);
        setDiscountPercent(0);
        if (typeof window !== "undefined") {
          try {
            sessionStorage.removeItem("appliedCoupon");
            localStorage.removeItem("appliedCoupon");
          } catch (e) {}
        }
        showToast(errorMsg);
      }
    } catch (e) {
      console.error("Coupon validation error:", e);
      setAppliedCoupon(null);
      setAppliedPromo(null);
      setDiscountPercent(0);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem("appliedCoupon");
          localStorage.removeItem("appliedCoupon");
        } catch (e) {}
      }
      showToast(`Failed to validate coupon "${targetCode}".`);
    } finally {
      setIsValidatingPromo(false);
    }
  };

  // Price Calculations
  const discountAmount = React.useMemo(() => {
    if (!appliedCoupon || subtotal <= 0 || cartItems.length === 0) return 0;
    if (appliedCoupon.minimumCartValue && subtotal < appliedCoupon.minimumCartValue) return 0;

    let targetSubtotal = subtotal;
    if (appliedCoupon.appliesToProductId) {
      const allowedKeys = String(appliedCoupon.appliesToProductId)
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      if (allowedKeys.length > 0) {
        const matchingItems = cartItems.filter((it) => {
          const itemId = String(it.id || "").toLowerCase();
          const foodItemId = String(it.foodItemId || "").toLowerCase();
          const baseId = itemId.includes("_") ? itemId.split("_")[0] : itemId;
          const name = String(it.name || "").toLowerCase().trim();
          return allowedKeys.some((k) => k === itemId || k === foodItemId || k === baseId || k === name);
        });
        if (matchingItems.length === 0) return 0;
        targetSubtotal = matchingItems.reduce((acc, it) => acc + it.price * it.qty, 0);
      }
    }

    if (appliedCoupon.discountType === "PERCENTAGE" || (appliedCoupon.discountPercentage && !appliedCoupon.discountAmount)) {
      const pct = appliedCoupon.discountPercentage || 0;
      const raw = Math.round((targetSubtotal * pct) / 100);
      return appliedCoupon.maxDiscountAmount ? Math.min(raw, appliedCoupon.maxDiscountAmount) : raw;
    }
    const flat = appliedCoupon.discountAmount || 0;
    return Math.min(flat, targetSubtotal);
  }, [appliedCoupon, subtotal, cartItems]);
  const deliveryFee = 0;
  const taxesAndCharges = 0;
  const grandTotal = Math.max(0, subtotal - discountAmount);

  // Suggest the closest unlockable coupon where minimumCartValue > subtotal
  const unlockableCouponSuggestion = React.useMemo(() => {
    if (subtotal <= 0 || !availableOffers || availableOffers.length === 0) return null;

    const lockedOffers = availableOffers
      .filter((offer) => {
        if (offer.isEligible === false) return false;
        const minVal = Number(offer.minimumCartValue) || 0;
        return minVal > subtotal;
      })
      .map((offer) => {
        const minVal = Number(offer.minimumCartValue) || 0;
        const diff = minVal - subtotal;
        return {
          ...offer,
          diff,
          minVal,
        };
      })
      .sort((a, b) => a.diff - b.diff);

    if (lockedOffers.length === 0) return null;

    const bestOffer = lockedOffers[0];
    const discountText = bestOffer.discountPercentage
      ? `${bestOffer.discountPercentage}% OFF`
      : bestOffer.discountAmount
      ? `₹${bestOffer.discountAmount} OFF`
      : "a discount";

    return {
      code: bestOffer.code,
      diff: bestOffer.diff,
      minVal: bestOffer.minVal,
      discountText,
      description: bestOffer.description,
    };
  }, [subtotal, availableOffers]);
  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.qty, 0);

  const handleCheckoutClick = () => {
    if (cartItems.length === 0 || subtotal <= 0) {
      showToast("Your cart is empty. Please add a product to the cart before placing an order.");
      return;
    }
    if (isSellerClosed) {
      showToast("This kitchen is currently unavailable. Please try another kitchen.");
      return;
    }
    if (isOutsideCoverage) {
      showToast(`This address is outside the delivery area. Your delivery location is ${shopDistanceKm ? `${shopDistanceKm} km away, ` : ""}which exceeds the maximum delivery radius of ${maxDeliveryRadius} km.`);
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
            {/* Closed / Unavailable Restaurant Alert Notice */}
            {isSellerClosed && !isSellerUnavailableDismissed && (
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
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: "260px" }}>
                  <span style={{ fontSize: "24px" }}>🔴</span>
                  <div>
                    <h3 style={{ margin: "0 0 2px 0", fontSize: "1rem", fontWeight: "800", color: "#991B1B" }}>
                      Kitchen Currently Unavailable
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#DC2626", lineHeight: 1.4 }}>
                      This kitchen is currently unavailable. Please try another kitchen.
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      clearCart();
                      setLocalCartItems([]);
                      showToast("Unavailable items removed from cart");
                    }}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "10px",
                      backgroundColor: "#FEE2E2",
                      color: "#991B1B",
                      fontWeight: "700",
                      fontSize: "0.82rem",
                      border: "1px solid #FCA5A5",
                      cursor: "pointer",
                    }}
                  >
                    Clear Cart
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/food-explore")}
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
                  <button
                    type="button"
                    onClick={() => setIsSellerUnavailableDismissed(true)}
                    title="Dismiss notification"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#991B1B",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "6px",
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            )}

            {cartItems.length > 0 ? (
              cartItems.map((item) => (
                <article
                  key={item.id}
                  className={`${styles.cartItemCard} ${isSellerClosed ? styles.cartItemCardUnavailable : ""}`}
                >
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
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        <h2 className={styles.itemTitle}>{item.name}</h2>
                        {isSellerClosed && (
                          <span className={styles.unavailableBadge}>Unavailable</span>
                        )}
                      </div>
                      <p className={styles.itemSubtitle}>{item.description}</p>
                      
                      {/* Selected Add-ons Badge List with Tiny Cross (X) */}
                      {item.selectedAddons && item.selectedAddons.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", margin: "6px 0 4px 0" }}>
                          {item.selectedAddons.map((addon, idx) => (
                            <span
                              key={addon.id ? `sel-${item.id}-${addon.id}-${idx}` : `sel-${item.id}-${addon.name}-${idx}`}
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
                                gap: "5px",
                                opacity: isSellerClosed ? 0.7 : 1,
                              }}
                            >
                              <span>+ {addon.name}</span>
                              <strong style={{ color: "#EA580C" }}>(₹{addon.price})</strong>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveAddonFromItem(item, idx);
                                }}
                                style={{
                                  background: "none",
                                  border: "none",
                                  padding: "0",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#9A3412",
                                  cursor: "pointer",
                                  borderRadius: "50%",
                                  marginLeft: "2px",
                                  opacity: 0.8,
                                  transition: "all 0.15s ease",
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.opacity = "1";
                                  e.currentTarget.style.color = "#DC2626";
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.opacity = "0.8";
                                  e.currentTarget.style.color = "#9A3412";
                                }}
                                title={`Remove ${addon.name}`}
                                aria-label={`Remove ${addon.name}`}
                              >
                                <X size={13} strokeWidth={2.5} />
                              </button>
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

                      {/* Available remaining add-ons for this specific dish */}
                      {!isSellerClosed && (() => {
                        const allAddons = getDishAvailableAddons(item);
                        const selectedNames = new Set((item.selectedAddons || []).map((a) => (a.name || "").toLowerCase().trim()));
                        const remainingAddons = allAddons.filter((a) => !selectedNames.has((a.name || "").toLowerCase().trim()));

                        if (remainingAddons.length === 0) return null;

                        return (
                          <div className={styles.availableAddonsSection}>
                            <div className={styles.availableAddonsHeader}>
                              <div className={styles.availableAddonsHeaderLeft}>
                                <Sparkles size={13} style={{ color: "#059669" }} />
                                <span>Available Add-ons</span>
                              </div>
                              {remainingAddons.length > 3 && (
                                <span className={styles.availableAddonsScrollHint}>Swipe or use arrows</span>
                              )}
                            </div>
                            <ScrollableAvailableAddonsRow
                              addons={remainingAddons}
                              onAdd={(addon) => handleAddAddonToItem(item, addon)}
                            />
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Right: Quantity Stepper & Remove */}
                  <div className={styles.itemRightActions}>
                    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
                      {!isSellerClosed && item.maxStock !== undefined && item.maxStock !== -1 && item.qty >= item.maxStock && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: "calc(100% + 4px)",
                            left: "0",
                            right: "0",
                            width: "100%",
                            backgroundColor: "#FFF7ED",
                            border: "1px solid #FFEDD5",
                            borderRadius: "6px",
                            padding: "2px 3px",
                            boxShadow: "0 2px 6px rgba(234, 88, 12, 0.12)",
                            zIndex: 10,
                            pointerEvents: "none",
                            boxSizing: "border-box",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.58rem",
                              color: "#EA580C",
                              fontWeight: "800",
                              lineHeight: "1.15",
                              display: "block",
                              textAlign: "center",
                              whiteSpace: "normal",
                              wordBreak: "break-word",
                            }}
                          >
                            We have only {item.maxStock} left in stock
                          </span>
                        </div>
                      )}
                      <div className={`${styles.qtyStepper} ${isSellerClosed ? styles.qtyStepperDisabled : ""}`}>
                        <button
                          type="button"
                          className={`${styles.qtyBtn} ${isSellerClosed ? styles.qtyBtnDisabled : ""}`}
                          onClick={() => !isSellerClosed && handleQtyChange(item.id, -1)}
                          disabled={isSellerClosed}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} strokeWidth={3} />
                        </button>
                        <span className={styles.qtyNumber}>{item.qty}</span>
                        <button
                          type="button"
                          className={`${styles.qtyBtn} ${isSellerClosed ? styles.qtyBtnDisabled : ""}`}
                          onClick={() => {
                            if (isSellerClosed) return;
                            if (item.maxStock !== undefined && item.maxStock !== -1 && item.qty >= item.maxStock) {
                              showToast(`We have only ${item.maxStock} left in stock.`);
                            } else {
                              handleQtyChange(item.id, 1);
                            }
                          }}
                          disabled={isSellerClosed || (item.maxStock !== undefined && item.maxStock !== -1 && item.qty >= item.maxStock)}
                          aria-label="Increase quantity"
                          style={{
                            opacity: isSellerClosed || (item.maxStock !== undefined && item.maxStock !== -1 && item.qty >= item.maxStock) ? 0.35 : 1,
                            cursor: isSellerClosed || (item.maxStock !== undefined && item.maxStock !== -1 && item.qty >= item.maxStock) ? "not-allowed" : "pointer",
                          }}
                        >
                          <Plus size={14} strokeWidth={3} />
                        </button>
                      </div>
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
            {/* 1. Promo Code & Interactive Coupon Selector */}
            <div className={styles.promoSectionWrapper} ref={couponDropdownRef}>
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
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                      >
                        <span>{appliedCouponData?.code || appliedPromo}</span>
                        {(appliedCouponData as any)?.isAutoApply && (
                          <span style={{ fontSize: "0.68rem", backgroundColor: "#BBF7D0", color: "#15803D", padding: "1px 6px", borderRadius: "4px", fontWeight: "700", flexShrink: 0 }}>
                            ⚡ AUTO-APPLIED
                          </span>
                        )}
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
                <div className={styles.promoCardWrapper}>
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

                      <button
                        type="button"
                        className={styles.couponDropdownToggle}
                        onClick={() => setIsCouponDropdownOpen((prev) => !prev)}
                        title={isCouponDropdownOpen ? "Hide offers" : "View available offers"}
                        aria-label="Toggle coupon offers dropdown"
                      >
                        <span className={styles.couponOffersBadge}>
                          <Sparkles size={13} />
                          <span>
                            {isLoadingOffers
                              ? "Offers"
                              : availableOffers.length > 0
                              ? `${availableOffers.length} ${availableOffers.length === 1 ? "Offer" : "Offers"}`
                              : "Offers"}
                          </span>
                        </span>
                        {isCouponDropdownOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
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

                  {/* Interactive Dropdown for Available Kitchen Coupons */}
                  {isCouponDropdownOpen && (
                    <div className={styles.couponDropdownMenu}>
                      <div className={styles.dropdownHeader}>
                        <div className={styles.dropdownHeaderTitle}>
                          <Sparkles size={15} color="#EA580C" />
                          <span>Available Offers {cartItems.find((ci) => ci.sellerName)?.sellerName ? `for ${cartItems.find((ci) => ci.sellerName)?.sellerName}` : ""}</span>
                        </div>
                        <button
                          type="button"
                          className={styles.dropdownCloseBtn}
                          onClick={() => setIsCouponDropdownOpen(false)}
                          aria-label="Close offers"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      {/* Search Input for filtering coupons */}
                      <div className={styles.couponSearchBox}>
                        <Search size={14} className={styles.couponSearchIcon} />
                        <input
                          type="text"
                          placeholder="Search coupon by code or description..."
                          value={couponSearchQuery}
                          onChange={(e) => setCouponSearchQuery(e.target.value)}
                          className={styles.couponSearchInput}
                        />
                        {couponSearchQuery && (
                          <button
                            type="button"
                            className={styles.couponSearchClearBtn}
                            onClick={() => setCouponSearchQuery("")}
                            aria-label="Clear search"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>

                      {/* Dropdown Offers List */}
                      <div className={styles.dropdownOffersList}>
                        {isLoadingOffers ? (
                          <div className={styles.dropdownEmpty}>Loading available offers...</div>
                        ) : filteredOffers.length > 0 ? (
                          filteredOffers.map((offer) => {
                            const isCurrentApplied = (appliedCouponData?.code || appliedPromo) === offer.code;
                            const minMet = !offer.minimumCartValue || subtotal >= offer.minimumCartValue;

                            return (
                              <div
                                key={offer.id || offer.code}
                                className={`${styles.offerCard} ${isCurrentApplied ? styles.offerCardApplied : ""}`}
                                onClick={() => {
                                  if (!isCurrentApplied) {
                                    handleApplyPromo(offer.code);
                                    setIsCouponDropdownOpen(false);
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
                                        setIsCouponDropdownOpen(false);
                                      }}
                                      disabled={isValidatingPromo}
                                    >
                                      Apply
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : couponSearchQuery ? (
                          <div className={styles.dropdownEmpty}>
                            <span>No coupons matching &quot;{couponSearchQuery}&quot;</span>
                            <button
                              type="button"
                              className={styles.resetSearchBtn}
                              onClick={() => setCouponSearchQuery("")}
                            >
                              Clear Search
                            </button>
                          </div>
                        ) : (
                          <div className={styles.dropdownEmpty}>
                            No coupons available for this kitchen right now.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Order Summary Card */}
            <div className={styles.summaryCard}>
              <h2 className={styles.summaryTitle}>Order Summary</h2>

              {/* Delivery Address Section */}
              <div
                className={styles.deliveryBlock}
                onClick={() => {
                  if (savedAddresses && savedAddresses.length > 0) {
                    setIsAddressModalOpen(true);
                  } else {
                    openLocationModal();
                  }
                }}
                style={{ cursor: "pointer" }}
              >
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
                  onClick={(e) => {
                    e.stopPropagation();
                    if (savedAddresses && savedAddresses.length > 0) {
                      setIsAddressModalOpen(true);
                    } else {
                      openLocationModal();
                    }
                  }}
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

              {/* Smart Coupon Unlock Recommendation Banner */}
              {unlockableCouponSuggestion && (
                <div
                  className={styles.couponSuggestionBanner}
                  onClick={() => setIsCouponDropdownOpen(true)}
                  title={`Click to view details for coupon ${unlockableCouponSuggestion.code}`}
                >
                  <div className={styles.suggestionIconWrapper}>
                    <Sparkles size={16} />
                  </div>
                  <div className={styles.suggestionContent}>
                    <p className={styles.suggestionText}>
                      Add items worth <strong>₹{unlockableCouponSuggestion.diff}</strong> more to apply{" "}
                      <span className={styles.suggestionCodeHighlight}>{unlockableCouponSuggestion.code}</span>{" "}
                      and get <strong>{unlockableCouponSuggestion.discountText}</strong>!
                    </p>
                    <Link
                      href="/food-explore"
                      className={styles.suggestionActionLink}
                      onClick={(e) => e.stopPropagation()}
                    >
                      + Add More Dishes
                    </Link>
                  </div>
                </div>
              )}

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
                        This address is outside the delivery area
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
                disabled={cartItems.length === 0 || subtotal <= 0 || isSellerClosed || isOutsideCoverage}
                style={{
                  backgroundColor: isSellerClosed || isOutsideCoverage || cartItems.length === 0 || subtotal <= 0 ? "#94A3B8" : undefined,
                  opacity: cartItems.length === 0 || subtotal <= 0 || isSellerClosed || isOutsideCoverage ? 0.6 : 1,
                  cursor: cartItems.length === 0 || subtotal <= 0 || isSellerClosed || isOutsideCoverage ? "not-allowed" : "pointer",
                }}
              >
                <span>
                  {isSellerClosed
                    ? "Kitchen Unavailable • Cannot Order"
                    : isOutsideCoverage
                    ? `Outside Coverage (${shopDistanceKm ? `${shopDistanceKm} km` : `> ${maxDeliveryRadius} km`})`
                    : cartItems.length === 0 || subtotal <= 0
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

      {/* Global Responsive Footer */}
      <Footer />
    </div>
  );
};

export default UserCart;
