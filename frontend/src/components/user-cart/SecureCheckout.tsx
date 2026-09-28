"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  MapPin,
  User,
  Phone,
  MessageSquare,
  CreditCard,
  Banknote,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  Clock,
  Home,
  Briefcase,
  Navigation,
  Check,
  Plus,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Navbar } from "@/components/navbar";
import { fetchApi } from "@/lib/fetch-api";
import { useLocation } from "@/components/location-provider";
import { Footer } from "@/components/explore-desktop/footer";
import { PhoneInput } from "@/components/common/PhoneInput/PhoneInput";
import { broadcastOrderToSellerNotifications } from "@/hooks/useSellerNotifications";
import { calculateDistanceKm, getPincodeCoordinates, MAX_DELIVERY_RADIUS_KM } from "@/lib/geo-distance";
import styles from "./SecureCheckout.module.css";

export interface SavedAddressItem {
  id: string;
  type: string;
  houseNumber: string;
  street: string;
  landmark?: string | null;
  pincode: string;
  city?: string | null;
  isDefault: boolean;
  recipientName?: string;
  recipientPhone?: string;
}

export interface CheckoutSummaryItem {
  id: string;
  foodItemId?: string;
  name: string;
  variant: string;
  selectedAddons?: Array<{ id?: string; name: string; price: number }>;
  basePrice?: number;
  addonsTotal?: number;
  qty: number;
  price: number;
  image: string;
}

export interface PendingOrderTransaction {
  id: string;
  status: "INITIATED" | "PAID_PENDING_CONFIRMATION" | "PAYMENT_FAILED" | "CONFIRMED";
  razorpayOrderId?: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  amount: number;
  sellerId: string;
  orderItems: any[];
  deliveryAddress: string;
  customerPhone: string;
  appliedCouponId?: string | null;
  checkoutItems: CheckoutSummaryItem[];
  fullName: string;
  streetAddress: string;
  city: string;
  postalCode: string;
  subtotal: number;
  discountAmount: number;
  grandTotal: number;
  failureReason?: string;
  timestamp: number;
}

export interface SecureCheckoutProps {
  defaultLocation?: string;
  initialName?: string;
  initialPhone?: string;
  initialAddress?: string;
  initialCity?: string;
  initialPincode?: string;
  items?: CheckoutSummaryItem[];
  onPlaceOrder?: () => void;
}

export const SecureCheckout: React.FC<SecureCheckoutProps> = ({
  defaultLocation = "Powai, Mumbai",
  initialName = "",
  initialPhone = "",
  initialAddress = "",
  initialCity = "",
  initialPincode = "",
  items = [],
  onPlaceOrder,
}) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { defaultAddress, openLocationModal } = useLocation();

  // Authentication redirect guard
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent("/checkout")}`);
    }
  }, [status, router]);

  // Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState<SavedAddressItem[]>([]);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState<boolean>(true);
  const [addressMode, setAddressMode] = useState<"saved" | "manual">("saved");

  // Form States
  const [fullName, setFullName] = useState<string>(initialName || session?.user?.name || "");
  const [phoneNumber, setPhoneNumber] = useState<string>(initialPhone);
  const [streetAddress, setStreetAddress] = useState<string>(initialAddress);
  const [city, setCity] = useState<string>(initialCity);
  const [postalCode, setPostalCode] = useState<string>(initialPincode);
  const [deliveryInstructions, setDeliveryInstructions] = useState<string>("");
  const [errors, setErrors] = useState<{
    fullName?: string;
    phoneNumber?: string;
    streetAddress?: string;
    city?: string;
    postalCode?: string;
  }>({});
  const [isSellerClosed, setIsSellerClosed] = useState<boolean>(false);
  const [sellerDetails, setSellerDetails] = useState<any>(null);

  // Fetch Saved Addresses from User Settings
  useEffect(() => {
    let isMounted = true;

    async function fetchUserAddresses() {
      if (status !== "authenticated") {
        setLoadingAddresses(false);
        return;
      }
      try {
        setLoadingAddresses(true);
        const res = await fetchApi("/api/user/addresses");
        if (res.ok && isMounted) {
          const data = await res.json();
          const list = data.data?.addresses || data.addresses || data.data || [];
          if (Array.isArray(list) && list.length > 0) {
            const mapped: SavedAddressItem[] = list.map((a: any) => ({
              id: a.id,
              type: a.type || "Home",
              houseNumber: a.houseNumber || "",
              street: a.street || "",
              landmark: a.landmark || "",
              pincode: a.pincode || "",
              city: a.city || "Pune",
              isDefault: Boolean(a.isDefault),
              recipientName: a.recipientName || session?.user?.name || "Registered User",
              recipientPhone: a.recipientPhone || (session?.user as any)?.phone || "",
            }));
            setSavedAddresses(mapped);
            setAddressMode("saved");

            // Auto-select default or first address
            const defaultItem = mapped.find((m) => m.isDefault) || mapped[0];
            if (defaultItem) {
              setSelectedSavedAddressId(defaultItem.id);
              const formatted = `${defaultItem.houseNumber ? defaultItem.houseNumber + ", " : ""}${defaultItem.street}${defaultItem.landmark ? ", Near " + defaultItem.landmark : ""}`;
              setStreetAddress((prev) => prev || formatted);
              setCity((prev) => prev || defaultItem.city || "Pune");
              setPostalCode((prev) => prev || defaultItem.pincode);
              if (defaultItem.recipientName) setFullName((prev) => prev || defaultItem.recipientName || "");
              if (defaultItem.recipientPhone) setPhoneNumber((prev) => prev || defaultItem.recipientPhone || "");
            }
          } else {
            setAddressMode("manual");
          }
        }
      } catch (err) {
        console.error("Failed to load user saved addresses for checkout:", err);
      } finally {
        if (isMounted) setLoadingAddresses(false);
      }
    }

    fetchUserAddresses();

    return () => {
      isMounted = false;
    };
  }, [status, session]);

  const selectSavedAddress = (addr: SavedAddressItem) => {
    setSelectedSavedAddressId(addr.id);
    const formatted = `${addr.houseNumber ? addr.houseNumber + ", " : ""}${addr.street}${addr.landmark ? ", Near " + addr.landmark : ""}`;
    setStreetAddress(formatted);
    setCity(addr.city || "Pune");
    setPostalCode(addr.pincode);
    if (addr.recipientName) setFullName(addr.recipientName);
    if (addr.recipientPhone) setPhoneNumber(addr.recipientPhone);

    setErrors((prev) => ({
      ...prev,
      streetAddress: undefined,
      city: undefined,
      postalCode: undefined,
    }));
  };

  useEffect(() => {
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
        }
      } catch (e) {
        // Silently continue
      }
    }
    checkSellerStatus();

    return () => {
      isMounted = false;
    };
  }, [cartItems]);

  // Delivery coverage & distance validation
  const { isOutsideCoverage, shopDistanceKm, maxDeliveryRadius } = React.useMemo(() => {
    if (!sellerDetails) {
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
      const activePin = postalCode.trim() || defaultAddress?.pincode || (typeof window !== "undefined" ? localStorage.getItem("active-selected-pincode") || localStorage.getItem("guest-pincode") : null);
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
    const userPin = postalCode.trim() || defaultAddress?.pincode || (typeof window !== "undefined" ? localStorage.getItem("active-selected-pincode") : "");
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
  }, [sellerDetails, defaultAddress, postalCode]);

  useEffect(() => {
    if (session?.user) {
      if (!fullName && session.user.name) setFullName(session.user.name);
    }
  }, [session, fullName]);

  useEffect(() => {
    if (defaultAddress) {
      const parts = [defaultAddress.houseNumber, defaultAddress.street, defaultAddress.locality, defaultAddress.landmark].filter(Boolean);
      const formattedStreet = parts.join(", ");
      if (formattedStreet) setStreetAddress(formattedStreet);
      if (defaultAddress.city) setCity(defaultAddress.city);
      if (defaultAddress.pincode) setPostalCode(defaultAddress.pincode);
    }
  }, [defaultAddress]);

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const res = await fetchApi("/api/user/profile");
        if (res.ok) {
          const json = await res.json();
          const user = json.data?.user || json.user || json.data || json;
          if (user) {
            if (user.name) setFullName((prev) => prev || user.name);
            if (user.phone) setPhoneNumber((prev) => prev || user.phone);
            if (user.city) setCity((prev) => prev || user.city);
            if (user.pincode) setPostalCode((prev) => prev || user.pincode);
          }
        }
      } catch (e) {
        // Silently continue
      }
    }

    if (status === "authenticated") {
      loadUserProfile();
    }
  }, [status]);

  const handleFieldChange = (
    field: "fullName" | "phoneNumber" | "streetAddress" | "city" | "postalCode",
    value: string,
    setter: (v: string) => void
  ) => {
    setter(value);
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateFields = () => {
    const newErrors: {
      fullName?: string;
      phoneNumber?: string;
      streetAddress?: string;
      city?: string;
      postalCode?: string;
    } = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Please enter your full name";
    }

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = "Please enter your 10-digit mobile number";
    } else if (!/^[0-9]{10}$/.test(phoneNumber.trim().replace(/\D/g, ""))) {
      newErrors.phoneNumber = "Please enter a valid 10-digit mobile number";
    }

    if (!streetAddress.trim()) {
      newErrors.streetAddress = "Please enter your complete street address";
    }

    if (!city.trim()) {
      newErrors.city = "Please enter your city";
    }

    if (!postalCode.trim()) {
      newErrors.postalCode = "Please enter your 6-digit postal code";
    } else if (!/^[0-9]{6}$/.test(postalCode.trim().replace(/\D/g, ""))) {
      newErrors.postalCode = "Please enter a valid 6-digit PIN code";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstKey = Object.keys(newErrors)[0];
      const element = document.getElementById(`${firstKey}Input`);
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return false;
    }

    return true;
  };

  // Payment Method Selection ('UPI' | 'COD')
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "COD">("UPI");

  // Navbar Controls
  const [isVegOnly, setIsVegOnly] = useState<boolean>(true);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("EN");

  // Promo Code State
  const [promoCode, setPromoCode] = useState<string>("");
  const [isPromoApplied, setIsPromoApplied] = useState<boolean>(false);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Order Placement States
  const [isOrderPlaced, setIsOrderPlaced] = useState<boolean>(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [pendingTx, setPendingTx] = useState<PendingOrderTransaction | null>(null);
  const [isRecoveringTx, setIsRecoveringTx] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);

  // Network Offline / Online Detection
  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOffline(!navigator.onLine);

    const handleOnline = () => {
      setIsOffline(false);
      showToast("Internet connection restored.", "info");
    };

    const handleOffline = () => {
      setIsOffline(true);
      showToast("Unable to place your order. Please check your internet connection and try again.", "error");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Check and reconcile pending transactions on mount (Browser Refresh Recovery)
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem("pending_order_transaction");
      if (stored) {
        const parsed: PendingOrderTransaction = JSON.parse(stored);
        const ageMs = Date.now() - (parsed.timestamp || 0);
        // If older than 2 hours, expire it
        if (ageMs > 2 * 60 * 60 * 1000) {
          localStorage.removeItem("pending_order_transaction");
        } else {
          setPendingTx(parsed);

          // If payment was already verified on gateway side, auto reconcile
          if (parsed.status === "PAID_PENDING_CONFIRMATION" && parsed.razorpay_payment_id) {
            autoFinalizePaidOrder(parsed);
          }
        }
      }
    } catch (e) {
      console.error("Failed to parse pending transaction from storage:", e);
    }
  }, []);

  const autoFinalizePaidOrder = async (tx: PendingOrderTransaction) => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      showToast("Unable to place your order. Please check your internet connection and try again.", "error");
      setIsRecoveringTx(false);
      return;
    }

    setIsRecoveringTx(true);
    try {
      const createRes = await fetchApi("/api/user/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: tx.sellerId || "seller",
          items: tx.orderItems,
          totalAmount: tx.grandTotal,
          deliveryAddress: tx.deliveryAddress,
          customerPhone: tx.customerPhone,
          paymentMethod: "ONLINE",
          appliedCouponId: tx.appliedCouponId || null,
          razorpay_payment_id: tx.razorpay_payment_id,
          razorpay_order_id: tx.razorpay_order_id,
          razorpay_signature: tx.razorpay_signature,
        }),
      });

      const createData = await createRes.json().catch(() => ({}));
      if (!createRes.ok) {
        const errorMsg = createData.message || createData.error || "Failed to finalize order after payment.";
        showToast(errorMsg, "error");
        setIsRecoveringTx(false);
        return;
      }

      const createdOrder = createData.data?.order || createData.order || createData.data;
      const finalOrderId = createdOrder?.id || ("NCR-" + Math.floor(100000 + Math.random() * 900000));
      setPlacedOrderNumber(finalOrderId);

      const confirmedOrderPayload = {
        orderId: finalOrderId,
        orderTime: "Just now",
        estimatedDelivery: "25-35 mins",
        deliveryAddress: {
          fullName: tx.fullName || fullName.trim(),
          phoneNumber: tx.customerPhone || phoneNumber.trim(),
          streetAddress: tx.streetAddress || streetAddress.trim(),
          city: tx.city || city.trim() || "Kothrud, Pune",
          pincode: tx.postalCode || postalCode.trim() || "411038",
        },
        paymentMethod: "Pay Online (Paid via Razorpay)",
        items: (tx.checkoutItems || checkoutItems).map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty,
          image: item.image,
          variant: item.variant,
          itemType: "VEG",
        })),
        subtotal: tx.subtotal || subtotal,
        discount: tx.discountAmount || discountAmount,
        deliveryFee: 0,
        taxes: 0,
        grandTotal: tx.grandTotal || grandTotal,
      };

      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("latestConfirmedOrder", JSON.stringify(confirmedOrderPayload));
          localStorage.setItem("latestConfirmedOrder", JSON.stringify(confirmedOrderPayload));
          localStorage.removeItem("pending_order_transaction");
        } catch (e) {
          console.error("Failed to save confirmed order to storage:", e);
        }
      }

      setPendingTx(null);
      setIsOrderPlaced(true);
      clearCart();
      showToast("Payment Verified! Order Placed Successfully!");

      setTimeout(() => {
        router.push(`/order-confirmation?orderId=${encodeURIComponent(finalOrderId)}`);
      }, 700);
    } catch (err: any) {
      console.error("Error finalizing recovered transaction:", err);
      const isNetErr =
        (typeof navigator !== "undefined" && !navigator.onLine) ||
        err?.name === "TypeError" ||
        err?.name === "NetworkError" ||
        String(err?.message || "").toLowerCase().includes("network") ||
        String(err?.message || "").toLowerCase().includes("fetch") ||
        String(err?.message || "").toLowerCase().includes("internet");

      if (isNetErr) {
        showToast("Unable to place your order. Please check your internet connection and try again.", "error");
      } else {
        showToast(err?.message || "Failed to finalize order after payment.", "error");
      }
    } finally {
      setIsRecoveringTx(false);
    }
  };

  // Toast Notification
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

const loadRazorpayScript = (): Promise<boolean> => {
  if (typeof window === "undefined") return Promise.resolve(false);
  if ((window as any).Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.getElementById("razorpay-checkout-script");
    if (existing) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.id = "razorpay-checkout-script";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

  // Cart Items derived from context with accurate price & selected add-ons
  const checkoutItems: CheckoutSummaryItem[] = cartItems.length > 0
    ? cartItems.map((ci) => ({
        id: ci.id,
        foodItemId: ci.foodItemId,
        name: ci.name,
        variant: ci.variantName || (ci.selectedAddons && ci.selectedAddons.length > 0 ? ci.selectedAddons.map(a => a.name).join(", ") : (ci.sellerName ? `From ${ci.sellerName}` : "")),
        selectedAddons: ci.selectedAddons,
        basePrice: ci.basePrice,
        addonsTotal: ci.addonsTotal,
        qty: ci.quantity,
        price: ci.price * ci.quantity,
        image: ci.imageUrl || ci.image || "/images/places/place-pizza.png",
      }))
    : items;

  // Pricing calculations: strictly only item prices and promo discounts
  const subtotal = checkoutItems.reduce((acc, item) => acc + item.price, 0);
  const discountAmount = isPromoApplied && subtotal > 0 ? Math.round((subtotal * discountPercent) / 100) : 0;
  const deliveryFee = 0;
  const taxesAndCharges = 0;
  const grandTotal = Math.max(0, subtotal - discountAmount);

  const handleApplyToggle = () => {
    if (isPromoApplied) {
      setIsPromoApplied(false);
      setDiscountPercent(0);
      showToast("Promo code removed", "info");
    } else {
      const clean = promoCode.trim().toUpperCase();
      if (!clean) {
        showToast("Please enter a promo code", "error");
        return;
      }
      if (clean === "NEO50") {
        setIsPromoApplied(true);
        setDiscountPercent(50);
        showToast(`Promo code "${clean}" applied! (50% Off)`, "success");
      } else if (clean === "WELCOME20" || clean === "NEO20" || clean === "DISCOUNT20" || clean === "NEOBITE20") {
        setIsPromoApplied(true);
        setDiscountPercent(20);
        showToast(`Promo code "${clean}" applied! (20% Off)`, "success");
      } else {
        setIsPromoApplied(true);
        setDiscountPercent(15);
        showToast(`Promo code "${clean}" applied! (15% Off)`, "success");
      }
    }
  };

  const handlePlaceOrderClick = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      showToast("Unable to place your order. Please check your internet connection and try again.", "error");
      setIsSubmitting(false);
      return;
    }

    if (checkoutItems.length === 0 || grandTotal <= 0 || subtotal <= 0) {
      showToast(
        "Your cart is empty. Please add a product to the cart before placing an order.",
        "error"
      );
      return;
    }

    if (isSellerClosed) {
      showToast("This cloud kitchen is currently closed and not accepting orders.", "error");
      return;
    }

    if (isOutsideCoverage) {
      showToast(
        `Your delivery address is ${shopDistanceKm ? `${shopDistanceKm} km away, ` : ""}outside this restaurant's ${maxDeliveryRadius} km coverage area. Please update your delivery address.`,
        "error"
      );
      return;
    }

    if (!validateFields()) {
      showToast("Please fill in all mandatory delivery address fields.", "error");
      return;
    }

    if (onPlaceOrder) {
      onPlaceOrder();
      return;
    }

    setIsSubmitting(true);
    try {
      let sellerId = cartItems.find((ci) => ci.sellerId)?.sellerId;

      // If sellerId is missing or default, resolve an active seller
      if (!sellerId) {
        try {
          const expRes = await fetchApi("/api/public/explore");
          if (expRes.ok) {
            const expData = await expRes.json();
            const sellers = expData.data?.sellers || expData.sellers || [];
            if (sellers.length > 0) {
              sellerId = sellers[0].id || sellers[0].trackingId;
            }
          }
        } catch {
          // Continue
        }
      }

      const rawItems = cartItems.length > 0 ? cartItems : items;
      const orderItems = rawItems.map((ci: any) => ({
        id: ci.foodItemId || ci.id,
        foodItemId: ci.foodItemId || ci.id,
        name: ci.name,
        price: ci.price,
        basePrice: ci.basePrice || ci.price,
        addonsTotal: ci.addonsTotal || 0,
        selectedAddons: ci.selectedAddons || [],
        quantity: ci.quantity || ci.qty || 1,
        image: ci.image || ci.imageUrl,
        variant: ci.variantName || (ci.selectedAddons && ci.selectedAddons.length > 0 ? ci.selectedAddons.map((a: any) => a.name).join(", ") : ""),
      }));

      const fullDeliveryAddress = `${streetAddress}, ${city} - ${postalCode}${
        deliveryInstructions ? ` (Note: ${deliveryInstructions})` : ""
      }`;

      // -------------------------------------------------------------
      // FLOW 1: ONLINE PAYMENT (Razorpay)
      // Initiate Razorpay checkout first -> Validate -> Place Order
      // -------------------------------------------------------------
      if (paymentMethod === "UPI") {
        const pendingData: PendingOrderTransaction = {
          id: `TX-${Date.now()}`,
          status: "INITIATED",
          amount: grandTotal,
          sellerId: sellerId || "seller",
          orderItems,
          deliveryAddress: fullDeliveryAddress,
          customerPhone: phoneNumber,
          appliedCouponId: isPromoApplied ? promoCode : null,
          checkoutItems,
          fullName: fullName.trim(),
          streetAddress: streetAddress.trim(),
          city: city.trim(),
          postalCode: postalCode.trim(),
          subtotal,
          discountAmount,
          grandTotal,
          timestamp: Date.now(),
        };

        if (typeof window !== "undefined") {
          localStorage.setItem("pending_order_transaction", JSON.stringify(pendingData));
        }
        setPendingTx(pendingData);

        const initRes = await fetchApi("/api/user/orders/initiate-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            totalAmount: grandTotal,
            sellerId: sellerId || "seller",
          }),
        });

        const initData = await initRes.json().catch(() => ({}));
        if (!initRes.ok) {
          let errMsg = initData.message || initData.error || "Failed to initialize online payment";
          if (
            errMsg.toLowerCase().includes("invalid total") ||
            errMsg.toLowerCase().includes("invalid amount") ||
            grandTotal <= 0
          ) {
            errMsg = "Your cart is empty. Please add a product to the cart before placing an order.";
          }
          showToast(errMsg, "error");
          setIsSubmitting(false);
          return;
        }

        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          showToast("Unable to place your order. Please check your internet connection and try again.", "error");
          setIsSubmitting(false);
          return;
        }

        const rzpData = initData.data || initData;
        pendingData.razorpayOrderId = rzpData.razorpayOrderId;
        if (typeof window !== "undefined") {
          localStorage.setItem("pending_order_transaction", JSON.stringify(pendingData));
        }

        const options = {
          key: rzpData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TX4MPQgJuetMFP",
          amount: rzpData.amount,
          currency: rzpData.currency || "INR",
          name: "Neo Cloud Kitchen",
          description: `Order Payment (${checkoutItems.length} items)`,
          order_id: rzpData.razorpayOrderId,
          handler: async function (response: any) {
            try {
              setIsSubmitting(true);
              const paidPendingData: PendingOrderTransaction = {
                ...pendingData,
                status: "PAID_PENDING_CONFIRMATION",
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                timestamp: Date.now(),
              };

              if (typeof window !== "undefined") {
                localStorage.setItem("pending_order_transaction", JSON.stringify(paidPendingData));
              }
              setPendingTx(paidPendingData);

              const createRes = await fetchApi("/api/user/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  sellerId: sellerId || "seller",
                  items: orderItems,
                  totalAmount: grandTotal,
                  deliveryAddress: fullDeliveryAddress,
                  customerPhone: phoneNumber,
                  paymentMethod: "ONLINE",
                  appliedCouponId: isPromoApplied ? promoCode : null,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              const createData = await createRes.json().catch(() => ({}));
              if (!createRes.ok) {
                const errorMsg = createData.message || createData.error || "Payment verification failed. Please contact support.";
                showToast(errorMsg, "error");
                setIsSubmitting(false);
                return;
              }

              const createdOrder = createData.data?.order || createData.order || createData.data;
              const finalOrderId = createdOrder?.id || ("NCR-" + Math.floor(100000 + Math.random() * 900000));
              setPlacedOrderNumber(finalOrderId);

              const confirmedOrderPayload = {
                orderId: finalOrderId,
                orderTime: "Just now",
                estimatedDelivery: "25-35 mins",
                deliveryAddress: {
                  fullName: fullName.trim(),
                  phoneNumber: phoneNumber.trim(),
                  streetAddress: streetAddress.trim(),
                  city: city.trim() || "Kothrud, Pune",
                  pincode: postalCode.trim() || "411038",
                },
                paymentMethod: "Pay Online (Paid via Razorpay)",
                items: checkoutItems.map((item) => ({
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  qty: item.qty,
                  image: item.image,
                  variant: item.variant,
                  itemType: "VEG",
                })),
                subtotal,
                discount: discountAmount,
                deliveryFee: 0,
                taxes: 0,
                grandTotal,
              };

              if (typeof window !== "undefined") {
                try {
                  sessionStorage.setItem("latestConfirmedOrder", JSON.stringify(confirmedOrderPayload));
                  localStorage.setItem("latestConfirmedOrder", JSON.stringify(confirmedOrderPayload));
                  localStorage.removeItem("pending_order_transaction");
                } catch (e) {
                  console.error("Failed to save confirmed order to session storage:", e);
                }
              }

              setPendingTx(null);

              // Real-time broadcast to Seller Operations Console & Bell Notification Counter
              try {
                broadcastOrderToSellerNotifications({
                  orderId: finalOrderId,
                  customerName: fullName.trim() || "Customer",
                  customerPhone: phoneNumber.trim(),
                  deliveryAddress: fullDeliveryAddress,
                  items: checkoutItems.map((ci) => ({ name: ci.name, qty: ci.qty, price: ci.price })),
                  totalAmount: grandTotal,
                  paymentMethod: "Online Payment (Paid)",
                  sellerId: sellerId || "seller",
                });
              } catch (bErr) {
                console.error("Failed to broadcast order to seller notifications:", bErr);
              }

              setIsOrderPlaced(true);
              clearCart();
              showToast("Payment Verified! Order Placed Successfully!");

              setTimeout(() => {
                router.push(`/order-confirmation?orderId=${encodeURIComponent(finalOrderId)}`);
              }, 700);
            } catch (err: any) {
              console.error("Error finalizing online order:", err);
              const isNetErr =
                (typeof navigator !== "undefined" && !navigator.onLine) ||
                err?.name === "TypeError" ||
                err?.name === "NetworkError" ||
                String(err?.message || "").toLowerCase().includes("network") ||
                String(err?.message || "").toLowerCase().includes("fetch") ||
                String(err?.message || "").toLowerCase().includes("internet");

              if (isNetErr) {
                showToast("Unable to place your order. Please check your internet connection and try again.", "error");
              } else {
                showToast(err?.message || "Failed to complete order after payment.", "error");
              }
              setIsSubmitting(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsSubmitting(false);
              if (typeof window !== "undefined") {
                localStorage.removeItem("pending_order_transaction");
              }
              setPendingTx(null);
              showToast("Payment cancelled. Order was not placed.", "info");
            },
          },
          prefill: {
            name: fullName.trim(),
            contact: phoneNumber.trim(),
          },
          theme: {
            color: "#FF6B00",
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
          setIsSubmitting(false);
          const failedTx: PendingOrderTransaction = {
            ...pendingData,
            status: "PAYMENT_FAILED",
            failureReason: response.error?.description || "Transaction declined",
            timestamp: Date.now(),
          };
          if (typeof window !== "undefined") {
            localStorage.setItem("pending_order_transaction", JSON.stringify(failedTx));
          }
          setPendingTx(failedTx);
          showToast("Payment failed: " + (response.error?.description || "Transaction declined"), "error");
        });
        rzp.open();
        return;
      }

      // -------------------------------------------------------------
      // FLOW 2: CASH ON DELIVERY (COD)
      // -------------------------------------------------------------
      const res = await fetchApi("/api/user/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: sellerId || "seller",
          items: orderItems,
          totalAmount: grandTotal,
          deliveryAddress: fullDeliveryAddress,
          customerPhone: phoneNumber,
          paymentMethod: "COD",
        }),
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        let errorMsg = resData.message || resData.error || "Failed to place order. Please try again.";
        if (
          errorMsg.toLowerCase().includes("invalid total") ||
          errorMsg.toLowerCase().includes("invalid amount") ||
          grandTotal <= 0
        ) {
          errorMsg = "Your cart is empty. Please add a product to the cart before placing an order.";
        }
        showToast(errorMsg, "error");
        setIsSubmitting(false);
        return;
      }

      const createdOrder = resData.data?.order || resData.order || resData.data;
      const finalOrderId = createdOrder?.id || resData.data?.id || resData.id || ("NCR-" + Math.floor(100000 + Math.random() * 900000));

      setPlacedOrderNumber(finalOrderId);

      const confirmedOrderPayload = {
        orderId: finalOrderId,
        orderTime: "Just now",
        estimatedDelivery: "25-35 mins",
        deliveryAddress: {
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          streetAddress: streetAddress.trim(),
          city: city.trim() || "Kothrud, Pune",
          pincode: postalCode.trim() || "411038",
        },
        paymentMethod: "Cash on Delivery",
        items: checkoutItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty,
          image: item.image,
          variant: item.variant,
          itemType: "VEG",
        })),
        subtotal,
        discount: discountAmount,
        deliveryFee: 0,
        taxes: 0,
        grandTotal,
      };

      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("latestConfirmedOrder", JSON.stringify(confirmedOrderPayload));
          localStorage.setItem("latestConfirmedOrder", JSON.stringify(confirmedOrderPayload));
          localStorage.removeItem("pending_order_transaction");
        } catch (e) {
          console.error("Failed to save confirmed order to session storage:", e);
        }
      }

      // Real-time broadcast to Seller Operations Console & Bell Notification Counter
      try {
        broadcastOrderToSellerNotifications({
          orderId: finalOrderId,
          customerName: fullName.trim() || "Customer",
          customerPhone: phoneNumber.trim(),
          deliveryAddress: fullDeliveryAddress,
          items: checkoutItems.map((ci) => ({ name: ci.name, qty: ci.qty, price: ci.price })),
          totalAmount: grandTotal,
          paymentMethod: "Cash on Delivery",
          sellerId: sellerId || "seller",
        });
      } catch (bErr) {
        console.error("Failed to broadcast COD order to seller notifications:", bErr);
      }

      setIsOrderPlaced(true);
      clearCart();
      showToast("Order Placed Successfully!");

      setTimeout(() => {
        router.push(`/order-confirmation?orderId=${encodeURIComponent(finalOrderId)}`);
      }, 700);
    } catch (err: any) {
      console.error("Error placing order:", err);
      const isNetErr =
        (typeof navigator !== "undefined" && !navigator.onLine) ||
        err?.name === "TypeError" ||
        err?.name === "NetworkError" ||
        String(err?.message || "").toLowerCase().includes("network") ||
        String(err?.message || "").toLowerCase().includes("fetch") ||
        String(err?.message || "").toLowerCase().includes("internet");

      if (isNetErr) {
        showToast("Unable to place your order. Please check your internet connection and try again.", "error");
      } else {
        showToast(err?.message || "Failed to place order. Please try again.", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.secureCheckoutWrapper}>
      {/* Shared Desktop Navbar */}
      <Navbar hideSearch={true} />

      {/* =========================================================
          CHECKOUT LAYOUT CONTAINER
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

          {/* Step 2: Checkout */}
          <div className={!isOrderPlaced ? styles.stepPillActive : styles.stepPillInactive}>
            <span className={!isOrderPlaced ? styles.activeDot : styles.inactiveDot} />
            <span>Checkout</span>
          </div>

          <div className={styles.stepperLine} />

          {/* Step 3: Confirmation (Direct click revoked until details valid & order placed) */}
          <div
            className={isOrderPlaced ? styles.stepPillActive : styles.stepPillInactive}
            style={{ cursor: isOrderPlaced ? "default" : "not-allowed", opacity: isOrderPlaced ? 1 : 0.6 }}
            title={isOrderPlaced ? "Order Confirmed" : "Fill required details and place order to proceed"}
          >
            <span className={isOrderPlaced ? styles.activeDot : styles.inactiveDot} />
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
            <Link href="/cart" className={styles.breadcrumbLink}>
              Cart
            </Link>
            <span>/</span>
            <span className={styles.breadcrumbCurrent}>Checkout</span>
          </div>
          <h1 className={styles.pageTitle}>
            {isOrderPlaced ? "Order Confirmed" : "Secure Checkout"}
          </h1>
          <p className={styles.pageSubtitle}>
            {isOrderPlaced
              ? "Your delicious meal has been ordered and is on its way!"
              : "Complete your gourmet order in just a few simple steps."}
          </p>
        </section>

        {/* Offline Banner */}
        {isOffline && (
          <div className={styles.offlineBanner}>
            <AlertCircle size={20} color="#DC2626" style={{ flexShrink: 0 }} />
            <div>
              <strong>Internet connection unavailable.</strong> Unable to place your order. Please check your internet connection and try again.
            </div>
          </div>
        )}

        {/* Transaction Recovery Banner for PAID_PENDING_CONFIRMATION */}
        {pendingTx && pendingTx.status === "PAID_PENDING_CONFIRMATION" && !isOrderPlaced && (
          <div className={styles.recoveryBanner}>
            <div className={styles.recoveryLeft}>
              <div className={styles.recoveryIconBox}>
                <CheckCircle2 size={24} color="#16A34A" />
              </div>
              <div>
                <h4 className={styles.recoveryTitle}>
                  Payment of ₹{pendingTx.grandTotal} Confirmed on Gateway — Order Finalization Pending
                </h4>
                <p className={styles.recoverySubtitle}>
                  We detected your recent payment (ID: <code>{pendingTx.razorpay_payment_id}</code>). Click below to complete your order confirmation without paying again.
                </p>
              </div>
            </div>
            <div className={styles.recoveryActions}>
              <button
                type="button"
                className={styles.recoveryPrimaryBtn}
                disabled={isRecoveringTx}
                onClick={() => autoFinalizePaidOrder(pendingTx)}
              >
                {isRecoveringTx ? "Finalizing Order..." : "Complete & Confirm Order"}
              </button>
              <button
                type="button"
                className={styles.recoverySecondaryBtn}
                onClick={() => {
                  if (typeof window !== "undefined") {
                    localStorage.removeItem("pending_order_transaction");
                  }
                  setPendingTx(null);
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Payment Failed Alert Banner */}
        {pendingTx && pendingTx.status === "PAYMENT_FAILED" && !isOrderPlaced && (
          <div className={styles.paymentFailedBanner}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <AlertCircle size={20} color="#DC2626" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: "0.88rem", color: "#991B1B", fontWeight: 600 }}>
                Previous Payment Failed: {pendingTx.failureReason || "Transaction was declined."} Your cart items and address are preserved so you can retry below.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.removeItem("pending_order_transaction");
                }
                setPendingTx(null);
              }}
              style={{
                background: "none",
                border: "none",
                color: "#DC2626",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "0.82rem",
                textDecoration: "underline",
                flexShrink: 0,
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {isOrderPlaced ? (
          /* Step 3: Order Confirmation Card */
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "20px",
              padding: "40px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 8px 28px rgba(0, 0, 0, 0.04)",
              textAlign: "center",
              maxWidth: "680px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                backgroundColor: "#ECFDF5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle2 size={40} color="#10B981" />
            </div>

            <div>
              <h2 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0" }}>
                Order Placed Successfully!
              </h2>
              <p style={{ color: "#64748B", fontSize: "0.95rem", margin: 0 }}>
                Thank you, <strong style={{ color: "#1E293B" }}>{fullName}</strong>. Your food order has been confirmed.
              </p>
            </div>

            <div
              style={{
                backgroundColor: "#F8FAFC",
                borderRadius: "14px",
                padding: "16px 24px",
                width: "100%",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                textAlign: "left",
                fontSize: "0.88rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Order Reference:</span>
                <strong style={{ color: "#0F172A" }}>#{placedOrderNumber}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Payment Method:</span>
                <strong style={{ color: "#0F172A" }}>{paymentMethod === "UPI" ? "Pay Now (UPI / Card)" : "Cash on Delivery (COD)"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Total Paid:</span>
                <strong style={{ color: "#FF6B00" }}>₹{grandTotal.toLocaleString("en-IN")}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Delivery Address:</span>
                <span style={{ color: "#0F172A", maxWidth: "60%", textAlign: "right" }}>{streetAddress}, {city}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#059669", fontWeight: "600", marginTop: "4px" }}>
                <Clock size={16} />
                <span>Estimated Delivery: 25 - 35 mins</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "14px", width: "100%", marginTop: "10px" }}>
              <button
                type="button"
                onClick={() => router.push("/orders-desktop")}
                style={{
                  flex: 1,
                  padding: "14px 20px",
                  borderRadius: "12px",
                  backgroundColor: "#FF6B00",
                  color: "#FFFFFF",
                  fontWeight: "700",
                  fontSize: "0.95rem",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 14px rgba(255, 107, 0, 0.3)",
                }}
              >
                <ShoppingBag size={18} />
                <span>View in My Orders</span>
              </button>

              <button
                type="button"
                onClick={() => router.push("/explore-desktop")}
                style={{
                  flex: 1,
                  padding: "14px 20px",
                  borderRadius: "12px",
                  backgroundColor: "#F1F5F9",
                  color: "#334155",
                  fontWeight: "700",
                  fontSize: "0.95rem",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Explore More Food
              </button>
            </div>
          </div>
        ) : (
          /* 2-Column Main Content */
          <div className={styles.mainContent}>
            {/* Left Column: Form Cards */}
            <div className={styles.leftFormsColumn}>
              {/* Closed Restaurant Alert Banner */}
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
                        Kitchen is Currently Closed
                      </h3>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "#DC2626" }}>
                        The restaurant for these items has turned off operations and cannot accept orders.
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

              {/* Card 1: Delivery Address */}
              <section className={styles.formCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "14px" }}>
                  <div className={styles.cardHeaderRow} style={{ margin: 0 }}>
                    <div className={styles.headerIconBox}>
                      <MapPin size={20} />
                    </div>
                    <div>
                      <h2 className={styles.cardTitle}>Delivery Address</h2>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={openLocationModal}
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: "700",
                      color: "#FF6B00",
                      backgroundColor: "#FFF3EB",
                      border: "1px solid #FED7AA",
                      borderRadius: "8px",
                      padding: "6px 14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "background-color 0.2s ease",
                    }}
                  >
                    <span>Change / Saved Addresses</span>
                  </button>
                </div>

                {/* Option Selector: Choose Saved Address OR Write New Address */}
                {savedAddresses.length > 0 && (
                  <div className={styles.addressModeTabs}>
                    <button
                      type="button"
                      className={`${styles.modeTabBtn} ${addressMode === "saved" ? styles.modeTabBtnActive : ""}`}
                      onClick={() => {
                        setAddressMode("saved");
                        const target = savedAddresses.find((a) => a.id === selectedSavedAddressId) || savedAddresses[0];
                        if (target) {
                          selectSavedAddress(target);
                        }
                      }}
                    >
                      <MapPin size={15} />
                      <span>Choose from Saved Addresses ({savedAddresses.length})</span>
                    </button>

                    <button
                      type="button"
                      className={`${styles.modeTabBtn} ${addressMode === "manual" ? styles.modeTabBtnActive : ""}`}
                      onClick={() => {
                        setAddressMode("manual");
                      }}
                    >
                      <Plus size={14} />
                      <span>Enter New / Custom Address</span>
                    </button>
                  </div>
                )}

                {/* MODE 1: CHOOSE FROM SAVED ADDRESSES */}
                {addressMode === "saved" && savedAddresses.length > 0 ? (
                  <div className={styles.savedAddressesSection}>
                    <div className={styles.savedAddressesGrid}>
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedSavedAddressId === addr.id;
                        const isHome = (addr.type || "").toUpperCase().includes("HOME");
                        const isWork =
                          (addr.type || "").toUpperCase().includes("WORK") ||
                          (addr.type || "").toUpperCase().includes("OFFICE");

                        return (
                          <div
                            key={addr.id}
                            className={`${styles.savedAddressCard} ${
                              isSelected ? styles.savedAddressCardSelected : ""
                            }`}
                            onClick={() => selectSavedAddress(addr)}
                            role="button"
                            tabIndex={0}
                            title="Click to select this delivery address"
                          >
                            <div className={styles.cardTopRow}>
                              <div className={styles.tagsGroup}>
                                <span
                                  className={
                                    isHome
                                      ? styles.typeBadgeHome
                                      : isWork
                                      ? styles.typeBadgeWork
                                      : styles.typeBadgeOther
                                  }
                                >
                                  {isHome ? (
                                    <Home size={12} />
                                  ) : isWork ? (
                                    <Briefcase size={12} />
                                  ) : (
                                    <Navigation size={12} />
                                  )}
                                  <span>{(addr.type || "Home").toUpperCase()}</span>
                                </span>
                                {addr.isDefault && (
                                  <span className={styles.defaultBadge}>DEFAULT</span>
                                )}
                              </div>

                              <div
                                className={`${styles.cardRadioCircle} ${
                                  isSelected ? styles.cardRadioCircleSelected : ""
                                }`}
                              >
                                {isSelected && (
                                  <Check size={12} color="#FFFFFF" strokeWidth={3} />
                                )}
                              </div>
                            </div>

                            <h4 className={styles.cardRecipient}>
                              {addr.recipientName || fullName || "Registered User"}
                            </h4>

                            <p className={styles.cardAddressText}>
                              {addr.houseNumber ? `${addr.houseNumber}, ` : ""}
                              {addr.street}
                              {addr.landmark ? `, Near ${addr.landmark}` : ""} - {addr.pincode}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Selected Address Confirmation Banner */}
                    <div className={styles.selectedAddressSummary}>
                      <div className={styles.selectedSummaryLeft}>
                        <CheckCircle2 size={20} color="#EA580C" />
                        <div>
                          <div className={styles.selectedSummaryTitle}>
                            Delivering to Selected Address
                          </div>
                          <div className={styles.selectedSummaryText}>
                            {streetAddress}, {city} - {postalCode}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact & Instructions fields for Saved Mode */}
                    <div className={styles.formFieldsStack}>
                      <div className={styles.formRowTwoCol}>
                        <div className={styles.fieldGroup}>
                          <label className={styles.fieldLabel} htmlFor="fullNameInput">
                            Recipient Name <span className={styles.requiredStar}>*</span>
                          </label>
                          <div
                            className={`${styles.inputWrapper} ${
                              errors.fullName ? styles.inputWrapperError : ""
                            }`}
                          >
                            <User size={18} className={styles.fieldIcon} />
                            <input
                              id="fullNameInput"
                              type="text"
                              value={fullName}
                              onChange={(e) =>
                                handleFieldChange("fullName", e.target.value, setFullName)
                              }
                              placeholder="e.g. Rahul Sharma"
                              className={`${styles.fieldInput} ${
                                errors.fullName ? styles.fieldInputError : ""
                              }`}
                            />
                          </div>
                        </div>

                        <div className={styles.fieldGroup}>
                          <PhoneInput
                            id="phoneNumberInput"
                            label="Contact Number"
                            required
                            placeholder="98765 43210"
                            value={phoneNumber}
                            onChange={(val) => {
                              setPhoneNumber(val);
                              if (errors.phoneNumber) {
                                setErrors((prev) => ({ ...prev, phoneNumber: undefined }));
                              }
                            }}
                          />
                        </div>
                      </div>

                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel} htmlFor="instructionsInput">
                          Delivery Instructions (Optional)
                        </label>
                        <div className={styles.inputWrapper}>
                          <MessageSquare size={18} className={styles.fieldIcon} />
                          <input
                            id="instructionsInput"
                            type="text"
                            value={deliveryInstructions}
                            onChange={(e) => setDeliveryInstructions(e.target.value)}
                            placeholder="Leave at door, ring bell, gate passcode..."
                            className={styles.fieldInput}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* MODE 2: WRITE NEW / MANUAL ADDRESS ENTRY */
                  <div className={styles.formFieldsStack}>
                    {/* Row 1: Full Name & Phone Number */}
                    <div className={styles.formRowTwoCol}>
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel} htmlFor="fullNameInput">
                          Full Name <span className={styles.requiredStar}>*</span>
                        </label>
                        <div
                          className={`${styles.inputWrapper} ${
                            errors.fullName ? styles.inputWrapperError : ""
                          }`}
                        >
                          <User size={18} className={styles.fieldIcon} />
                          <input
                            id="fullNameInput"
                            type="text"
                            value={fullName}
                            onChange={(e) =>
                              handleFieldChange("fullName", e.target.value, setFullName)
                            }
                            placeholder={
                              errors.fullName
                                ? "Please enter your full name"
                                : "e.g. Rahul Sharma"
                            }
                            className={`${styles.fieldInput} ${
                              errors.fullName ? styles.fieldInputError : ""
                            }`}
                          />
                        </div>
                      </div>

                      <div className={styles.fieldGroup}>
                        <PhoneInput
                          id="phoneNumberInput"
                          label="Phone Number"
                          required
                          placeholder="98765 43210"
                          value={phoneNumber}
                          onChange={(val) => {
                            setPhoneNumber(val);
                            if (errors.phoneNumber) {
                              setErrors((prev) => ({ ...prev, phoneNumber: undefined }));
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Row 2: Complete Street Address */}
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel} htmlFor="streetAddressInput">
                        Complete Street Address <span className={styles.requiredStar}>*</span>
                      </label>
                      <div
                        className={`${styles.inputWrapper} ${
                          errors.streetAddress ? styles.inputWrapperError : ""
                        }`}
                      >
                        <MapPin size={18} className={styles.fieldIcon} />
                        <input
                          id="streetAddressInput"
                          type="text"
                          value={streetAddress}
                          onChange={(e) =>
                            handleFieldChange("streetAddress", e.target.value, setStreetAddress)
                          }
                          placeholder={
                            errors.streetAddress
                              ? "Please enter complete street address"
                              : "Flat / House No., Building Name, Street / Locality"
                          }
                          className={`${styles.fieldInput} ${
                            errors.streetAddress ? styles.fieldInputError : ""
                          }`}
                        />
                      </div>
                    </div>

                    {/* Row 3: City & Postal Code */}
                    <div className={styles.formRowTwoCol}>
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel} htmlFor="cityInput">
                          City <span className={styles.requiredStar}>*</span>
                        </label>
                        <input
                          id="cityInput"
                          type="text"
                          value={city}
                          onChange={(e) =>
                            handleFieldChange("city", e.target.value, setCity)
                          }
                          placeholder={
                            errors.city ? "Please enter your city" : "e.g. Pune"
                          }
                          className={`${styles.fieldInputNoIcon} ${
                            errors.city ? styles.fieldInputNoIconError : ""
                          }`}
                        />
                      </div>

                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel} htmlFor="postalCodeInput">
                          Postal Code <span className={styles.requiredStar}>*</span>
                        </label>
                        <input
                          id="postalCodeInput"
                          type="text"
                          value={postalCode}
                          onChange={(e) =>
                            handleFieldChange("postalCode", e.target.value, setPostalCode)
                          }
                          placeholder={
                            errors.postalCode ? "Please enter 6-digit PIN" : "6-digit PIN"
                          }
                          className={`${styles.fieldInputNoIcon} ${
                            errors.postalCode ? styles.fieldInputNoIconError : ""
                          }`}
                        />
                      </div>
                    </div>

                    {/* Row 4: Delivery Instructions */}
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel} htmlFor="instructionsInput">
                        Delivery Instructions (Optional)
                      </label>
                      <div className={styles.inputWrapper}>
                        <MessageSquare size={18} className={styles.fieldIcon} />
                        <input
                          id="instructionsInput"
                          type="text"
                          value={deliveryInstructions}
                          onChange={(e) => setDeliveryInstructions(e.target.value)}
                          placeholder="Leave at door, ring bell, gate passcode..."
                          className={styles.fieldInput}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Card 2: Payment Method */}
              <section className={styles.formCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.headerIconBox}>
                    <CreditCard size={20} />
                  </div>
                  <h2 className={styles.cardTitle}>Payment Method</h2>
                </div>

                <div className={styles.paymentMethodsStack}>
                  {/* Option 1: UPI / Online Payment */}
                  <div
                    className={`${styles.paymentOptionCard} ${
                      paymentMethod === "UPI" ? styles.paymentOptionActive : ""
                    }`}
                    onClick={() => setPaymentMethod("UPI")}
                  >
                    <div className={styles.paymentRadioOuter}>
                      {paymentMethod === "UPI" && (
                        <div className={styles.paymentRadioInner} />
                      )}
                    </div>
                    <div className={styles.paymentIconBubble}>
                      <CreditCard size={20} />
                    </div>
                    <div className={styles.paymentOptionDetails}>
                      <div className={styles.paymentTitleRow}>
                        <span className={styles.paymentOptionTitle}>
                          Pay Now (Instant Delivery)
                        </span>
                        <span className={styles.recommendedBadge}>FASTEST</span>
                      </div>
                      <span className={styles.paymentOptionSubtitle}>
                        UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, Net Banking
                      </span>
                    </div>
                  </div>

                  {/* Option 2: Cash on Delivery */}
                  <div
                    className={`${styles.paymentOptionCard} ${
                      paymentMethod === "COD" ? styles.paymentOptionActive : ""
                    }`}
                    onClick={() => setPaymentMethod("COD")}
                  >
                    <div className={styles.paymentRadioOuter}>
                      {paymentMethod === "COD" && (
                        <div className={styles.paymentRadioInner} />
                      )}
                    </div>
                    <div className={styles.paymentIconBubble}>
                      <Banknote size={20} />
                    </div>
                    <div className={styles.paymentOptionDetails}>
                      <span className={styles.paymentOptionTitle}>
                        Cash on Delivery
                      </span>
                      <span className={styles.paymentOptionSubtitle}>
                        Pay with cash or scan delivery partner&apos;s QR code upon arrival
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Order Summary Card */}
            <aside className={styles.rightSummaryColumn}>
              <div className={styles.summaryCard}>
                <h3 className={styles.summaryTitle}>Order Summary</h3>

                {/* Items List */}
                <div className={styles.itemsList}>
                  {checkoutItems.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "28px 16px", backgroundColor: "#F8FAFC", borderRadius: "14px", border: "1px dashed #E2E8F0", margin: "8px 0 14px 0" }}>
                      <ShoppingBag size={32} color="#94A3B8" style={{ margin: "0 auto 8px", display: "block" }} />
                      <p style={{ margin: "0 0 4px", fontSize: "0.92rem", color: "#334155", fontWeight: "700" }}>
                        Your cart is empty
                      </p>
                      <p style={{ margin: "0 0 12px", fontSize: "0.82rem", color: "#64748B" }}>
                        Please add products to your cart before placing an order.
                      </p>
                      <Link
                        href="/food-explore"
                        style={{
                          display: "inline-block",
                          padding: "8px 18px",
                          backgroundColor: "#FE5000",
                          color: "#FFFFFF",
                          borderRadius: "8px",
                          fontSize: "0.82rem",
                          fontWeight: "700",
                          textDecoration: "none",
                        }}
                      >
                        Explore Food Menu
                      </Link>
                    </div>
                  ) : (
                    checkoutItems.map((item) => (
                      <div key={item.id} className={styles.summaryItemRow}>
                        <div className={styles.itemImageWrapper}>
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="60px"
                            className={styles.itemImg}
                          />
                        </div>
                        <div className={styles.itemInfoCol}>
                          <span className={styles.itemName}>{item.name}</span>
                          {item.selectedAddons && item.selectedAddons.length > 0 ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", margin: "3px 0" }}>
                              {item.selectedAddons.map((a, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    fontSize: "0.72rem",
                                    color: "#C2410C",
                                    backgroundColor: "#FFF7ED",
                                    border: "1px solid #FFEDD5",
                                    padding: "1px 6px",
                                    borderRadius: "4px",
                                    fontWeight: "600",
                                  }}
                                >
                                  + {a.name} (₹{a.price})
                                </span>
                              ))}
                            </div>
                          ) : item.variant ? (
                            <span className={styles.itemVariant}>{item.variant}</span>
                          ) : null}
                          <span className={styles.itemQtyPrice}>
                            Qty: {item.qty} × ₹
                            {Math.round(item.price / (item.qty || 1)).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className={styles.itemPriceCol}>
                          <span className={styles.itemTotalPrice}>
                            ₹{item.price.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className={styles.divider} />

                {/* Promo Code Input Row */}
                <div className={styles.promoGroup}>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter Coupon Code"
                    className={styles.promoInput}
                    disabled={checkoutItems.length === 0}
                  />
                  <button
                    type="button"
                    className={
                      isPromoApplied
                        ? styles.promoBtnApplied
                        : styles.promoBtnApply
                    }
                    onClick={handleApplyToggle}
                    disabled={checkoutItems.length === 0}
                  >
                    {isPromoApplied ? "Remove" : "Apply"}
                  </button>
                </div>

                <div className={styles.divider} />

                {/* Pricing Breakdown */}
                <div className={styles.pricingBreakdown}>
                  <div className={styles.pricingRow}>
                    <span className={styles.pricingLabel}>Subtotal</span>
                    <span className={styles.pricingValue}>
                      ₹{subtotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {isPromoApplied && discountAmount > 0 && (
                    <div className={styles.pricingRowDiscount}>
                      <span className={styles.discountLabel}>Promo Discount ({discountPercent}%)</span>
                      <span className={styles.discountValue}>
                        -₹{discountAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  <div className={styles.divider} />

                  {/* Grand Total */}
                  <div className={styles.grandTotalRow}>
                    <span className={styles.grandTotalLabel}>Grand Total</span>
                    <span className={styles.grandTotalAmount}>
                      ₹{grandTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Coverage Alert Banner if Outside Coverage */}
                {isOutsideCoverage && (
                  <div
                    style={{
                      backgroundColor: "#FEF2F2",
                      border: "1.5px solid #FCA5A5",
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
                          Outside Delivery Coverage
                        </h4>
                        <p style={{ margin: "3px 0 0 0", fontSize: "0.8rem", color: "#B91C1C", lineHeight: 1.4 }}>
                          Your selected delivery address is <strong>{shopDistanceKm} km</strong> away from this restaurant. Maximum delivery distance is <strong>{maxDeliveryRadius} km</strong>.
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
                      Change Delivery Address
                    </button>
                  </div>
                )}

                {(() => {
                  const isCartEmpty = checkoutItems.length === 0 || grandTotal <= 0;
                  const isButtonDisabled = isSubmitting || isSellerClosed || isOutsideCoverage || isCartEmpty;

                  return (
                    <button
                      type="button"
                      disabled={isButtonDisabled}
                      className={styles.placeOrderButton}
                      onClick={handlePlaceOrderClick}
                      style={{
                        backgroundColor: isSellerClosed || isOutsideCoverage || isCartEmpty ? "#94A3B8" : undefined,
                        cursor: isButtonDisabled ? "not-allowed" : "pointer",
                        opacity: isButtonDisabled ? 0.65 : 1,
                      }}
                    >
                      <span>
                        {isSellerClosed
                          ? "Kitchen Closed • Cannot Place Order"
                          : isOutsideCoverage
                          ? `Outside 5 km Coverage (${shopDistanceKm ? `${shopDistanceKm} km` : "> 5 km"})`
                          : isCartEmpty
                          ? "Your Cart is Empty • Add Products"
                          : isSubmitting
                          ? "Placing Order..."
                          : `Place Order • ₹${grandTotal.toLocaleString("en-IN")}`}
                      </span>
                      <ArrowRight size={18} />
                    </button>
                  );
                })()}
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* Toast Feedback */}
      {toast && (
        <div
          className={`${styles.toastMessage} ${
            toast.type === "error"
              ? styles.toastError
              : toast.type === "success"
              ? styles.toastSuccess
              : ""
          }`}
          role="alert"
        >
          <div className={styles.toastIconWrapper}>
            {toast.type === "error" ? (
              <XCircle size={18} color="#EF4444" strokeWidth={2.5} />
            ) : toast.type === "info" ? (
              <AlertCircle size={18} color="#3B82F6" strokeWidth={2.5} />
            ) : (
              <CheckCircle2 size={18} color="#10B981" strokeWidth={2.5} />
            )}
          </div>
          <span className={styles.toastText}>{toast.message}</span>
        </div>
      )}

      {/* Global Responsive Footer */}
      <Footer />
    </div>
  );
};

export default SecureCheckout;
