"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Navbar } from "@/components/navbar";
import { SettingsSidebar } from "@/components/settings-desktop/settings-sidebar";
import { SubscriptionHeader } from "@/components/my-subscription/subscription-header";
import { SubscriptionPlanCard } from "@/components/my-subscription/subscription-plan-card";
import { PauseSubscription } from "@/components/my-subscription/pause-subscription";
import { DeliveryTimes, DeliverySlot } from "@/components/my-subscription/delivery-times";
import { SubscriptionBenefits } from "@/components/my-subscription/subscription-benefits";
import { SubscriptionActions } from "@/components/my-subscription/subscription-actions";
import { ChangePlanModal } from "@/components/my-subscription/change-plan-modal";
import { Footer } from "@/components/explore-desktop/footer";
import { useLocation } from "@/components/location-provider";
import {
  fetchUserMealSubscriptions,
  togglePauseUserSubscription,
  subscribeToMealPlan,
  loadRazorpayScript,
  initiateMealSubscriptionPayment,
  verifyAndActivateMealSubscription,
  getTierColors,
  UserActiveMealSubscription,
} from "@/lib/meal-subscriptions";
import { fetchApi } from "@/lib/fetch-api";
import {
  Utensils,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  Calendar,
  Sparkles,
  ShieldCheck,
  PauseCircle,
  Search,
  Star,
  MapPin,
  Clock,
  ArrowRight,
  Phone,
  Loader2,
  Award,
  Layers,
  Navigation,
  Home,
  Briefcase,
} from "lucide-react";
import styles from "./MySubscriptionPage.module.css";

const PUNE_LOCALITY_SUGGESTIONS = [
  { name: "Kothrud, Pune", pincode: "411038" },
  { name: "Baner, Pune", pincode: "411045" },
  { name: "Aundh, Pune", pincode: "411007" },
  { name: "Hinjawadi, Pune", pincode: "411057" },
  { name: "Deccan Gymkhana, Pune", pincode: "411004" },
  { name: "Viman Nagar, Pune", pincode: "411014" },
  { name: "Kalyani Nagar, Pune", pincode: "411006" },
  { name: "Shivajinagar, Pune", pincode: "411005" },
  { name: "Wakad, Pune", pincode: "411057" },
  { name: "Koregaon Park, Pune", pincode: "411001" },
  { name: "Magarpatta City, Hadapsar, Pune", pincode: "411028" },
  { name: "Pimple Saudagar, Pune", pincode: "411027" },
  { name: "Senapati Bapat Road, Pune", pincode: "411016" },
  { name: "Swargate / Dattawadi, Pune", pincode: "411030" },
  { name: "Karve Nagar, Pune", pincode: "411052" },
  { name: "Bavdhan, Pune", pincode: "411021" },
];

interface PublicMealPlan {
  id: string;
  sellerId: string;
  sellerName?: string;
  sellerLocality?: string;
  foodType?: string;
  name: string;
  tier: string;
  description?: string;
  weeklyPrice: number;
  monthlyPrice: number;
  quarterlyPrice: number;
  yearlyPrice: number;
  duration?: string;
  features?: string[];
  mealTimings?: string[];
  allowCancel?: boolean;
  pauseBillingPeriod?: string;
}

interface SellerInfo {
  id: string;
  name: string;
  trackingId?: string;
  locality?: string;
  rating?: number;
  reviewsCount?: number;
  imageUrl?: string | null;
  foodType?: string;
  plansCount: number;
}

type BillingCycle = "all" | "weekly" | "biweekly" | "monthly";

function MySubscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { defaultAddress } = useLocation();

  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"active" | "plans">(
    tabParam === "plans" || tabParam === "all" ? "plans" : "active"
  );

  // Active Subscription State
  const [subscription, setSubscription] = useState<UserActiveMealSubscription | null>(null);
  const [isLoadingActive, setIsLoadingActive] = useState<boolean>(true);
  const [isChangingPlan, setIsChangingPlan] = useState<boolean>(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // All Subscription Plans Explorer State
  const [allPlans, setAllPlans] = useState<PublicMealPlan[]>([]);
  const [allKitchens, setAllKitchens] = useState<any[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState<boolean>(false);
  const [selectedSellerId, setSelectedSellerId] = useState<string | "all">("all");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Subscribe Modal State
  const [selectedPlanForSub, setSelectedPlanForSub] = useState<PublicMealPlan | null>(null);
  const [deliveryAddressInput, setDeliveryAddressInput] = useState<string>("");
  const [contactPhoneInput, setContactPhoneInput] = useState<string>("");
  const [startDatePreference, setStartDatePreference] = useState<string>("Tomorrow");
  const [isSubmittingSub, setIsSubmittingSub] = useState<boolean>(false);
  const [subSuccessMsg, setSubSuccessMsg] = useState<string | null>(null);
  const [subErrorMsg, setSubErrorMsg] = useState<string | null>(null);

  // Address intelligence & selection states
  const [userSavedAddresses, setUserSavedAddresses] = useState<any[]>([]);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string | null>(null);
  const [isChangingAddress, setIsChangingAddress] = useState<boolean>(false);
  const [isEditingPhone, setIsEditingPhone] = useState<boolean>(false);
  const [showManualAddressInput, setShowManualAddressInput] = useState<boolean>(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState<boolean>(false);
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);
  const addressSuggestionsRef = useRef<HTMLDivElement>(null);

  // Click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (addressSuggestionsRef.current && !addressSuggestionsRef.current.contains(e.target as Node)) {
        setShowAddressSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync tab with URL
  useEffect(() => {
    if (tabParam === "plans" || tabParam === "all") {
      setActiveTab("plans");
    } else if (tabParam === "active") {
      setActiveTab("active");
    }
  }, [tabParam]);

  // Load User Active Subscription
  useEffect(() => {
    let isMounted = true;

    async function loadUserSubs() {
      try {
        setIsLoadingActive(true);
        const subs = await fetchUserMealSubscriptions();
        if (isMounted && subs.length > 0) {
          const active = subs.find((s) => s.status === "ACTIVE") || subs[0];
          setSubscription(active);
        } else if (isMounted) {
          setSubscription(null);
        }
      } catch (err) {
        console.error("Error loading user subscriptions:", err);
      } finally {
        if (isMounted) setIsLoadingActive(false);
      }
    }

    loadUserSubs();

    return () => {
      isMounted = false;
    };
  }, [session]);

  // Load All Public Meal Plans & Kitchens from API
  useEffect(() => {
    let isMounted = true;

    async function loadPlansData() {
      try {
        setIsLoadingPlans(true);
        const [plansRes, exploreRes] = await Promise.all([
          fetchApi("/api/public/meal-plans").catch(() => null),
          fetchApi("/api/public/explore").catch(() => null),
        ]);

        let plansData: PublicMealPlan[] = [];
        let kitchensData: any[] = [];

        if (plansRes && plansRes.ok) {
          const plansJson = await plansRes.json();
          plansData = plansJson.data || plansJson || [];
        }

        if (exploreRes && exploreRes.ok) {
          const exploreJson = await exploreRes.json();
          kitchensData = exploreJson.data?.kitchens || exploreJson.kitchens || [];
        }

        if (isMounted) {
          setAllPlans(plansData);
          setAllKitchens(kitchensData);

          if (plansData.length > 0 && selectedSellerId === "all") {
            // Default to first seller with plans
            setSelectedSellerId(plansData[0].sellerId);
          }
        }
      } catch (err) {
        console.error("Failed to load public meal plans:", err);
      } finally {
        if (isMounted) setIsLoadingPlans(false);
      }
    }

    loadPlansData();

    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (type: "success" | "error" | "info", text: string) => {
    setToast({ type, text });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Derive unique sellers who have meal plans
  const sellersList = useMemo<SellerInfo[]>(() => {
    const sellerMap = new Map<string, SellerInfo>();

    allPlans.forEach((plan) => {
      if (!sellerMap.has(plan.sellerId)) {
        const kitchenMeta = allKitchens.find((k) => k.id === plan.sellerId);
        sellerMap.set(plan.sellerId, {
          id: plan.sellerId,
          name: plan.sellerName || kitchenMeta?.name || "Kitchen Partner",
          trackingId: kitchenMeta?.trackingId,
          locality: plan.sellerLocality || kitchenMeta?.locality || kitchenMeta?.city || "Pune",
          rating: kitchenMeta?.rating || 4.8,
          reviewsCount: kitchenMeta?.reviewsCount || 0,
          imageUrl: kitchenMeta?.imageUrl || null,
          foodType: plan.foodType || kitchenMeta?.foodType || "BOTH",
          plansCount: 1,
        });
      } else {
        const existing = sellerMap.get(plan.sellerId)!;
        existing.plansCount += 1;
      }
    });

    return Array.from(sellerMap.values());
  }, [allPlans, allKitchens]);

  // Selected Seller Object
  const currentSeller = useMemo(() => {
    if (selectedSellerId === "all") return null;
    return sellersList.find((s) => s.id === selectedSellerId) || null;
  }, [selectedSellerId, sellersList]);

  // Filter plans based on selected seller, billing cycle, and search query
  const filteredPlans = useMemo(() => {
    let list = allPlans;

    if (selectedSellerId !== "all") {
      list = list.filter((p) => p.sellerId === selectedSellerId);
    }

    if (billingCycle !== "all") {
      list = list.filter((p) => {
        const dur = (p.duration || "1 Week").toLowerCase().trim();
        if (billingCycle === "weekly") {
          return dur.includes("1 week") || (dur.includes("week") && !dur.includes("2 week") && !dur.includes("bi") && !dur.includes("by"));
        }
        if (billingCycle === "biweekly") {
          return dur.includes("2 week") || dur.includes("bi") || dur.includes("by");
        }
        if (billingCycle === "monthly") {
          return dur.includes("month");
        }
        return true;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(q);
        const sellerMatch = (p.sellerName || "").toLowerCase().includes(q);
        const featuresMatch = (p.features || []).some((f) => f.toLowerCase().includes(q));
        const tierMatch = (p.tier || "").toLowerCase().includes(q);
        return nameMatch || sellerMatch || featuresMatch || tierMatch;
      });
    }

    return list;
  }, [allPlans, selectedSellerId, billingCycle, searchQuery]);

  const getPlanPrice = (plan: PublicMealPlan) => {
    const dur = (plan.duration || "1 Week").toLowerCase();
    if (dur.includes("week")) {
      return plan.weeklyPrice || plan.monthlyPrice || 0;
    }
    if (dur.includes("month") && !dur.includes("quarter") && !dur.includes("3 month")) {
      return plan.monthlyPrice || plan.weeklyPrice || 0;
    }
    if (dur.includes("quarter") || dur.includes("3 month")) {
      return plan.quarterlyPrice || plan.monthlyPrice || plan.weeklyPrice || 0;
    }
    if (dur.includes("year")) {
      return plan.yearlyPrice || plan.monthlyPrice || plan.weeklyPrice || 0;
    }
    return plan.weeklyPrice || plan.monthlyPrice || 0;
  };

  const getPlanDurationLabel = (plan: PublicMealPlan) => {
    const dur = (plan.duration || "1 Week").toLowerCase();
    if (dur.includes("2 week") || dur.includes("bi") || dur.includes("by")) return "/ 2 weeks";
    if (dur.includes("week")) return "/ week";
    if (dur.includes("6 month")) return "/ 6 months";
    if (dur.includes("month")) return "/ month";
    if (dur.includes("year")) return "/ year";
    return `/${plan.duration || "cycle"}`;
  };

  const handleTogglePause = async (nextPaused: boolean) => {
    if (!subscription) return;
    try {
      if (subscription.id && !subscription.id.startsWith("sub-demo")) {
        await togglePauseUserSubscription(subscription.id, nextPaused);
      }
      setSubscription((prev) =>
        prev
          ? {
              ...prev,
              isPaused: nextPaused,
              status: nextPaused ? "PAUSED" : "ACTIVE",
            }
          : null
      );
      showToast(
        "success",
        nextPaused
          ? "Meal subscription paused. Billing and scheduled meals frozen."
          : "Meal subscription resumed! Scheduled meals will resume tomorrow."
      );
    } catch (err: any) {
      showToast("error", err.message || "Failed to update pause status.");
    }
  };

  const handlePlanChanged = (updatedData: any) => {
    if (!subscription) return;
    if (updatedData.plan) {
      setSubscription((prev) =>
        prev
          ? {
              ...prev,
              planId: updatedData.planId || updatedData.plan.id,
              tier: updatedData.tier || updatedData.plan.tier,
              status: updatedData.status || "ACTIVE",
              pricePaid: updatedData.pricePaid || updatedData.plan.weeklyPrice,
              plan: {
                ...prev.plan,
                ...updatedData.plan,
              },
            }
          : null
      );
    }
    showToast(
      "success",
      `Meal plan successfully changed to ${updatedData.name || updatedData.tier || "new tier"}!`
    );
  };

  // Open Subscribe Modal
  const handleOpenSubscribeModal = (plan: PublicMealPlan) => {
    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent("/my-subscriptions-desktop?tab=plans")}`);
      return;
    }
    setSelectedPlanForSub(plan);
    const initialAddr = defaultAddress?.address || defaultAddress?.label || (typeof window !== "undefined" ? localStorage.getItem("active-selected-address") || "" : "");
    setDeliveryAddressInput(initialAddr);
    setContactPhoneInput((session.user as any)?.phone || "");
    setSubErrorMsg(null);
    setSubSuccessMsg(null);
    setIsChangingAddress(false);
    setIsEditingPhone(false);
    setShowManualAddressInput(false);
    setShowAddressSuggestions(false);

    // Fetch user saved addresses
    fetchApi("/api/user/addresses")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          const list = data.data?.addresses || data.addresses || data.data || [];
          if (Array.isArray(list) && list.length > 0) {
            setUserSavedAddresses(list);

            // Pre-fill with default address or first saved address
            const defaultSaved = list.find((a: any) => a.isDefault) || list.find((a: any) => (a.type || "").toLowerCase() === "home") || list[0];
            if (defaultSaved) {
              setSelectedSavedAddressId(defaultSaved.id);
              const parts = [
                defaultSaved.houseNumber,
                defaultSaved.street,
                defaultSaved.landmark ? `Near ${defaultSaved.landmark}` : null,
                defaultSaved.city || "Pune",
                defaultSaved.pincode,
              ].filter(Boolean);
              const line = parts.join(", ");
              setDeliveryAddressInput(line || defaultSaved.address || defaultSaved.label || initialAddr);
              if (defaultSaved.recipientPhone && !(session.user as any)?.phone) {
                setContactPhoneInput(defaultSaved.recipientPhone);
              }
            }
          }
        }
      })
      .catch(() => {});
  };

  // Handle GPS Location Detection with Nominatim Reverse Geocoding
  const handleDetectGpsLocation = () => {
    if (!navigator.geolocation) {
      setSubErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    setIsDetectingGps(true);
    setSubErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const road = addr.road || addr.street || addr.neighbourhood || addr.suburb || addr.residential || "";
            const suburb = addr.suburb || addr.neighbourhood || addr.city_district || "";
            const city = addr.city || addr.town || addr.municipality || "Pune";
            const pincode = (addr.postcode || "").replace(/\D/g, "").slice(0, 6) || "411038";

            const parts = [road, suburb && suburb !== road ? suburb : "", city, `Maharashtra - ${pincode}`].filter(Boolean);
            const fullAddr = parts.join(", ") || data.display_name?.split(",").slice(0, 3).join(",") || "Kothrud, Pune - 411038";
            setDeliveryAddressInput(fullAddr);
            setSelectedSavedAddressId(null);
            setIsChangingAddress(false);
            setShowAddressSuggestions(false);
          } else {
            setDeliveryAddressInput(defaultAddress?.address || "Kothrud, Pune - 411038");
            setIsChangingAddress(false);
          }
        } catch (e) {
          setDeliveryAddressInput(defaultAddress?.address || "Kothrud, Pune - 411038");
          setIsChangingAddress(false);
        } finally {
          setIsDetectingGps(false);
        }
      },
      () => {
        setIsDetectingGps(false);
        const fallback = defaultAddress?.address || "Kothrud, Pune - 411038";
        setDeliveryAddressInput(fallback);
        setIsChangingAddress(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleSelectSavedAddress = (addr: any) => {
    const parts = [
      addr.houseNumber,
      addr.street,
      addr.landmark ? `Near ${addr.landmark}` : null,
      addr.city || "Pune",
      addr.pincode,
    ].filter(Boolean);
    const line = parts.join(", ");
    setDeliveryAddressInput(line || addr.address || addr.label || "");
    setSelectedSavedAddressId(addr.id);
    setIsChangingAddress(false);
    if (addr.recipientPhone && !contactPhoneInput) {
      setContactPhoneInput(addr.recipientPhone);
    }
    setShowAddressSuggestions(false);
  };

  const handleSelectLocality = (loc: { name: string; pincode: string }) => {
    const trimmed = deliveryAddressInput.trim();
    if (trimmed && !trimmed.toLowerCase().includes(loc.name.toLowerCase().split(",")[0])) {
      setDeliveryAddressInput(`${trimmed}, ${loc.name} - ${loc.pincode}`);
    } else {
      setDeliveryAddressInput(`${loc.name} - ${loc.pincode}`);
    }
    setShowAddressSuggestions(false);
  };

  const filteredLocalities = PUNE_LOCALITY_SUGGESTIONS.filter((loc) => {
    if (!deliveryAddressInput.trim()) return true;
    const q = deliveryAddressInput.toLowerCase();
    return loc.name.toLowerCase().includes(q) || loc.pincode.includes(q);
  });

  // Submit Subscription with Online Payment Flow
  const handleConfirmSubscription = async () => {
    if (!selectedPlanForSub) return;
    const trimmedAddress = deliveryAddressInput.trim();
    if (!trimmedAddress) {
      setSubErrorMsg("Please provide your delivery address or room number.");
      return;
    }
    if (trimmedAddress.length < 5) {
      setSubErrorMsg("Delivery address must be at least 5 characters long.");
      return;
    }
    if (trimmedAddress.length > 120) {
      setSubErrorMsg("Delivery address cannot exceed 120 characters.");
      return;
    }

    const cleanPhone = contactPhoneInput.replace(/\D/g, "");
    if (!cleanPhone) {
      setSubErrorMsg("Please enter your 10-digit contact phone number.");
      return;
    }
    if (cleanPhone.length !== 10) {
      setSubErrorMsg("Contact phone number must be exactly 10 digits.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setSubErrorMsg("Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.");
      return;
    }

    setIsSubmittingSub(true);
    setSubErrorMsg(null);

    try {
      // 1. Initiate online payment order on backend
      const planCycle = selectedPlanForSub.duration || "1 Week";
      const initData = await initiateMealSubscriptionPayment(
        selectedPlanForSub.id,
        planCycle
      );

      // 2. Load Razorpay Checkout SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setSubErrorMsg("Failed to load Razorpay payment SDK. Please check your internet connection.");
        setIsSubmittingSub(false);
        return;
      }

      // 3. Open Razorpay Checkout Modal
      const options = {
        key: initData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TX4MPQgJuetMFP",
        amount: initData.amount,
        currency: initData.currency || "INR",
        name: "Neo Cloud Kitchen",
        description: `Subscription: ${selectedPlanForSub.name} (${initData.subscriptionCycle || planCycle})`,
        order_id: initData.razorpayOrderId,
        handler: async function (response: any) {
          try {
            setIsSubmittingSub(true);
            const verified = await verifyAndActivateMealSubscription({
              planId: selectedPlanForSub.id,
              cycle: initData.subscriptionCycle || planCycle,
              deliveryAddress: deliveryAddressInput.trim(),
              contactPhone: contactPhoneInput.trim(),
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            setSubSuccessMsg(verified.message || "Payment verified! Subscription activated successfully!");

            // Reload active subscriptions and switch tab
            const subs = await fetchUserMealSubscriptions();
            if (subs && subs.length > 0) {
              const active = subs.find((s) => s.status === "ACTIVE") || subs[0];
              setSubscription(active);
            }

            setTimeout(() => {
              setSelectedPlanForSub(null);
              setActiveTab("active");
              showToast("success", "Welcome to your new meal subscription!");
            }, 1200);
          } catch (vErr: any) {
            console.error("Verification error:", vErr);
            setSubErrorMsg(vErr.message || "Payment verification failed. Please contact support.");
            setIsSubmittingSub(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsSubmittingSub(false);
            setSubErrorMsg("Payment was cancelled. Subscription was not activated.");
            showToast("info", "Payment was cancelled. Subscription was not activated.");
          },
        },
        prefill: {
          name: session?.user?.name || "",
          contact: contactPhoneInput.trim() || (session?.user as any)?.phone || "",
        },
        theme: {
          color: "#FF6B00",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setIsSubmittingSub(false);
        setSubErrorMsg("Payment failed: " + (response.error?.description || "Transaction declined. Subscription was not activated."));
      });
      rzp.open();
    } catch (err: any) {
      setSubErrorMsg(err.message || "Failed to initiate payment. Please try again.");
      setIsSubmittingSub(false);
    }
  };

  // Custom Slots for active plan
  const customSlots: DeliverySlot[] =
    subscription?.plan?.mealTimings && subscription.plan.mealTimings.length > 0
      ? subscription.plan.mealTimings.map((t, idx) => {
          let name = "Meal Delivery";
          let timeRange = t;
          let icon = "🍱";

          if (t.toLowerCase().includes("breakfast")) {
            name = "Breakfast Delivery";
            icon = "🍳";
          } else if (t.toLowerCase().includes("lunch")) {
            name = "Lunch Delivery";
            icon = "🍲";
          } else if (t.toLowerCase().includes("dinner")) {
            name = "Dinner Delivery";
            icon = "🍱";
          }

          if (t.includes("(") && t.includes(")")) {
            timeRange = t.substring(t.indexOf("(") + 1, t.indexOf(")"));
          }

          return {
            id: `slot-${idx}`,
            name,
            timeRange,
            icon,
          };
        })
      : [
          { id: "breakfast", name: "Breakfast Delivery", timeRange: "8:00 AM – 9:30 AM", icon: "🍳" },
          { id: "lunch", name: "Lunch Delivery", timeRange: "1:00 PM – 2:30 PM", icon: "🍲" },
          { id: "dinner", name: "Dinner Delivery", timeRange: "8:00 PM – 9:30 PM", icon: "🍱" },
        ];

  const customBenefits =
    subscription?.plan?.features && subscription.plan.features.length > 0
      ? subscription.plan.features
      : undefined;

  const formattedStartedOn = subscription?.startDate
    ? new Date(subscription.startDate).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  const formattedRenewalDate = subscription?.endDate
    ? new Date(subscription.endDate).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Auto-renew";

  const getCycleSuffix = (cycle?: string, duration?: string) => {
    const c = (cycle || duration || "1 Week").toLowerCase();
    if (c.includes("2 week")) return "2 weeks";
    if (c.includes("week")) return "week";
    if (c.includes("6 month")) return "6 months";
    if (c.includes("month")) return "month";
    if (c.includes("year")) return "year";
    return cycle || "period";
  };

  const formattedPrice = subscription
    ? `₹${(subscription.pricePaid || subscription.plan?.weeklyPrice || 0).toLocaleString("en-IN")}/${getCycleSuffix(subscription.cycle, subscription.plan?.duration)}`
    : "";

  return (
    <div className={styles.pageWrapper}>
      <Navbar initialActiveItem="Settings" />

      <main className={styles.mainContainer}>
        <div className={styles.layoutRow}>
          {/* Left Column: Shared Settings Sidebar */}
          <div className={styles.sidebarWrapper}>
            <SettingsSidebar activeTabId="my-subscriptions" />
          </div>

          {/* Right Column: Subscriptions Hub */}
          <div className={styles.contentWrapper}>
            {/* Page Header */}
            <SubscriptionHeader
              title="Meal Subscriptions Hub"
              subtitle="Manage your active daily meals or explore live subscription plans from verified cloud kitchens."
            />

            {/* Notification Toast */}
            {toast && (
              <div
                className={`${styles.toast} ${
                  toast.type === "success"
                    ? styles.toastSuccess
                    : toast.type === "error"
                    ? styles.toastError
                    : styles.toastInfo
                }`}
              >
                <div className={styles.toastContent}>
                  {toast.type === "success" && <CheckCircle2 size={18} className={styles.toastIcon} />}
                  {toast.type === "error" && <AlertCircle size={18} className={styles.toastIcon} />}
                  {toast.type === "info" && <Info size={18} className={styles.toastIcon} />}
                  <span>{toast.text}</span>
                </div>
                <button
                  type="button"
                  className={styles.toastClose}
                  onClick={() => setToast(null)}
                  aria-label="Dismiss message"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Top Tabs Switcher */}
            <div className={styles.mainTabsRow} role="tablist" aria-label="Subscriptions Navigation">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "active"}
                className={`${styles.mainTabBtn} ${
                  activeTab === "active" ? styles.mainTabBtnActive : ""
                }`}
                onClick={() => {
                  setActiveTab("active");
                  router.replace("/my-subscriptions-desktop?tab=active", { scroll: false });
                }}
              >
                <Calendar size={17} />
                <span>My Active Subscription</span>
                {subscription && (
                  <span
                    className={
                      activeTab === "active"
                        ? styles.tabCountBadge
                        : `${styles.tabCountBadge} ${styles.tabCountBadgeInactive}`
                    }
                  >
                    {subscription.status}
                  </span>
                )}
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "plans"}
                className={`${styles.mainTabBtn} ${
                  activeTab === "plans" ? styles.mainTabBtnActive : ""
                }`}
                onClick={() => {
                  setActiveTab("plans");
                  router.replace("/my-subscriptions-desktop?tab=plans", { scroll: false });
                }}
              >
                <Utensils size={17} />
                <span>All Subscription Plans</span>
                <span
                  className={
                    activeTab === "plans"
                      ? styles.tabCountBadge
                      : `${styles.tabCountBadge} ${styles.tabCountBadgeInactive}`
                  }
                >
                  {allPlans.length} Plans
                </span>
              </button>
            </div>

            {/* TAB 1: MY ACTIVE SUBSCRIPTION */}
            {activeTab === "active" && (
              <div>
                {isLoadingActive ? (
                  <div style={{ textAlign: "center", padding: "64px 20px", color: "#64748B" }}>
                    <Loader2 size={32} className="animate-spin" color="#FF5500" style={{ margin: "0 auto 12px" }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>Loading active subscription details...</p>
                  </div>
                ) : !subscription ? (
                  <div
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "20px",
                      padding: "60px 24px",
                      textAlign: "center",
                      border: "1px dashed #CBD5E1",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "14px",
                      marginTop: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        backgroundColor: "#FFF4E6",
                        color: "#FF6B00",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "28px",
                      }}
                    >
                      🍱
                    </div>
                    <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "700", color: "#1E293B" }}>
                      No Active Meal Subscriptions
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.92rem", color: "#64748B", maxWidth: "440px", lineHeight: "1.5" }}>
                      You do not currently have an active daily meal plan. Browse verified kitchens like Radha&apos;s Kitchen &amp; Yewale&apos;s Kitchens to subscribe.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("plans");
                        router.replace("/my-subscriptions-desktop?tab=plans", { scroll: false });
                      }}
                      style={{
                        marginTop: "8px",
                        padding: "11px 26px",
                        borderRadius: "12px",
                        backgroundColor: "#FF5500",
                        color: "#FFFFFF",
                        fontWeight: "700",
                        fontSize: "0.9rem",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0 4px 14px rgba(255, 85, 0, 0.28)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span>Explore All Subscription Plans</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Active Plan Card */}
                    <SubscriptionPlanCard
                      title={subscription.plan?.name || "Daily Meal Plan"}
                      subtitle={
                        subscription.seller?.businessName
                          ? `Kitchen: ${subscription.seller.businessName}`
                          : "Standard Gourmet Kitchen"
                      }
                      tier={subscription.tier || subscription.plan?.tier || "Bronze"}
                      statusText={subscription.status}
                      isPaused={subscription.isPaused}
                      startedOn={formattedStartedOn}
                      renewalDate={formattedRenewalDate}
                      planPrice={formattedPrice}
                    />

                    {/* Pause Subscription Section */}
                    <PauseSubscription
                      isPaused={subscription.isPaused}
                      disabled={subscription.status?.toUpperCase() === "CANCELLED"}
                      onTogglePause={handleTogglePause}
                    />

                    {/* Delivery Times & Benefits Grid */}
                    <div className={styles.detailsGrid}>
                      <DeliveryTimes slots={customSlots} />
                      <SubscriptionBenefits benefits={customBenefits} />
                    </div>

                    {/* Subscription Actions */}
                    <SubscriptionActions
                      onChangePlan={() => setIsChangingPlan(true)}
                      status={subscription.status}
                    />
                  </>
                )}
              </div>
            )}

            {/* TAB 2: ALL SUBSCRIPTION PLANS (BROWSE KITCHENS & PLANS) */}
            {activeTab === "plans" && (
              <div className={styles.plansExplorerWrapper}>
                {/* Kitchen / Seller Switcher & Filters */}
                <section className={styles.controlsSection} aria-label="Kitchen & Plan Filters">
                  {/* Seller Switcher */}
                  <div>
                    <div className={styles.sellerTabsHeader}>
                      <h3 className={styles.sellerTabsTitle}>
                        <Utensils size={17} color="#FF5500" />
                        <span>Select Kitchen Partner</span>
                        <span className={styles.sellerTabsCount}>{sellersList.length} Kitchens</span>
                      </h3>

                      {selectedSellerId !== "all" && (
                        <button
                          type="button"
                          onClick={() => setSelectedSellerId("all")}
                          style={{
                            padding: "6px 14px",
                            borderRadius: "8px",
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #CBD5E1",
                            color: "#475569",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          View All Kitchen Plans
                        </button>
                      )}
                    </div>

                    <div className={styles.sellerScrollContainer}>
                      {/* All Kitchens Pill */}
                      <div
                        className={`${styles.sellerTabItem} ${
                          selectedSellerId === "all" ? styles.sellerTabActive : ""
                        }`}
                        onClick={() => setSelectedSellerId("all")}
                        role="button"
                        tabIndex={0}
                      >
                        <div className={styles.sellerAvatar}>
                          <Layers size={17} />
                        </div>
                        <div className={styles.sellerTabMeta}>
                          <span className={styles.sellerTabName}>All Cloud Kitchens</span>
                          <span className={styles.sellerTabSub}>{allPlans.length} Total Plans</span>
                        </div>
                      </div>

                      {/* Individual Seller Tabs */}
                      {sellersList.map((seller) => (
                        <div
                          key={seller.id}
                          className={`${styles.sellerTabItem} ${
                            selectedSellerId === seller.id ? styles.sellerTabActive : ""
                          }`}
                          onClick={() => setSelectedSellerId(seller.id)}
                          role="button"
                          tabIndex={0}
                        >
                          <div className={styles.sellerAvatar}>
                            {seller.imageUrl ? (
                              <Image
                                src={seller.imageUrl}
                                alt={seller.name}
                                fill
                                sizes="36px"
                                style={{ objectFit: "cover" }}
                              />
                            ) : (
                              seller.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className={styles.sellerTabMeta}>
                            <span className={styles.sellerTabName}>{seller.name}</span>
                            <span className={styles.sellerTabSub}>
                              <span className={styles.sellerTabRating}>
                                <Star size={11} fill="#D97706" color="#D97706" />
                                {seller.rating?.toFixed(1) || "4.8"}
                              </span>
                              <span>•</span>
                              <span>{seller.plansCount} {seller.plansCount === 1 ? "Plan" : "Plans"}</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Secondary Filters: Dietary, Search & Billing Cycle */}
                  <div className={styles.filterRow}>
                    {/* Search Input */}
                    <div className={styles.searchBox}>
                      <Search size={15} className={styles.searchIcon} />
                      <input
                        type="text"
                        placeholder="Search plan, dish, dal..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                      />
                    </div>

                    {/* Billing Cycle Switcher */}
                    <div className={styles.cycleSwitcher}>
                      <button
                        type="button"
                        className={`${styles.cycleBtn} ${
                          billingCycle === "all" ? styles.cycleBtnActive : ""
                        }`}
                        onClick={() => setBillingCycle("all")}
                      >
                        <span>All</span>
                      </button>
                      <button
                        type="button"
                        className={`${styles.cycleBtn} ${
                          billingCycle === "weekly" ? styles.cycleBtnActive : ""
                        }`}
                        onClick={() => setBillingCycle("weekly")}
                      >
                        <span>Weekly</span>
                      </button>
                      <button
                        type="button"
                        className={`${styles.cycleBtn} ${
                          billingCycle === "biweekly" ? styles.cycleBtnActive : ""
                        }`}
                        onClick={() => setBillingCycle("biweekly")}
                      >
                        <span>Bi-weekly</span>
                      </button>
                      <button
                        type="button"
                        className={`${styles.cycleBtn} ${
                          billingCycle === "monthly" ? styles.cycleBtnActive : ""
                        }`}
                        onClick={() => setBillingCycle("monthly")}
                      >
                        <span>Monthly</span>
                      </button>
                    </div>
                  </div>
                </section>

                {/* Selected Kitchen Highlight Card */}
                {currentSeller && (
                  <section className={styles.sellerHighlightCard}>
                    <div className={styles.sellerHighlightLeft}>
                      <div className={styles.sellerHighlightAvatar}>
                        {currentSeller.imageUrl ? (
                          <Image
                            src={currentSeller.imageUrl}
                            alt={currentSeller.name}
                            fill
                            sizes="52px"
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          currentSeller.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h2 className={styles.sellerHighlightName}>
                          <span>{currentSeller.name}</span>
                          <span className={styles.sellerVerifiedBadge}>
                            <ShieldCheck size={11} />
                            Verified Kitchen
                          </span>
                        </h2>
                        <div className={styles.sellerHighlightMeta}>
                          <span className={styles.sellerRatingBadge}>
                            <Star size={11} fill="#B45309" color="#B45309" />
                            {currentSeller.rating?.toFixed(1) || "4.8"} ({currentSeller.reviewsCount || 10}+ reviews)
                          </span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <MapPin size={13} color="#64748B" />
                            {currentSeller.locality}
                          </span>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* Plans Grid */}
                {isLoadingPlans ? (
                  <div className={styles.emptyState}>
                    <Loader2 size={32} className="animate-spin" color="#FF5500" style={{ margin: "0 auto 12px" }} />
                    <h3 className={styles.emptyTitle}>Loading Available Plans...</h3>
                    <p className={styles.emptyText}>Fetching verified kitchen meal subscriptions from database.</p>
                  </div>
                ) : filteredPlans.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                      <Utensils size={24} />
                    </div>
                    <h3 className={styles.emptyTitle}>No Matching Meal Plans Found</h3>
                    <p className={styles.emptyText}>
                      Try resetting your search or selecting all kitchens to view all options.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSellerId("all");
                        setBillingCycle("all");
                        setSearchQuery("");
                      }}
                      className={styles.resetBtn}
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  <div className={styles.plansGrid}>
                    {filteredPlans.map((plan, idx) => {
                      const tierColors = getTierColors(plan.tier);
                      const price = getPlanPrice(plan);
                      const cycleLabel = getPlanDurationLabel(plan);
                      const isPopular = idx === 0 || plan.tier?.toLowerCase() === "gold";

                      return (
                        <article
                          key={plan.id}
                          className={`${styles.planCard} ${isPopular ? styles.popularCard : ""}`}
                        >
                          {isPopular && (
                            <div className={styles.popularRibbon}>Popular</div>
                          )}

                          {/* Card Header: Tier Badge + Kitchen Name */}
                          <div className={styles.cardHeader}>
                            <span
                              className={styles.tierPill}
                              style={{
                                color: tierColors.tierColor,
                                backgroundColor: tierColors.tierBg,
                              }}
                            >
                              <Award size={12} />
                              {plan.tier || "Bronze"} Tier
                            </span>

                            <span className={styles.planSellerTag}>
                              <MapPin size={11} />
                              {plan.sellerName || "Local Kitchen"}
                            </span>
                          </div>

                          {/* Plan Title & Description */}
                          <h3 className={styles.planTitle}>{plan.name}</h3>
                          <p className={styles.planDescription}>
                            {plan.description ||
                              "Wholesome home-style nutritious cooking with fresh seasonal ingredients and daily variety."}
                          </p>

                          {/* Pricing Block */}
                          <div className={styles.pricingBlock}>
                            <div>
                              <div className={styles.priceMain}>
                                <span className={styles.currencySymbol}>₹</span>
                                <span className={styles.priceAmount}>{price.toLocaleString("en-IN")}</span>
                                <span className={styles.priceCycle}>{cycleLabel}</span>
                              </div>
                            </div>
                          </div>

                          {/* Meal Timings Section */}
                          {plan.mealTimings && plan.mealTimings.length > 0 && (
                            <div className={styles.timingsSection}>
                              <div className={styles.timingsTitle}>
                                <Clock size={11} />
                                <span>Daily Serving Schedule</span>
                              </div>
                              <div className={styles.timingsGrid}>
                                {plan.mealTimings.map((timing, tIdx) => (
                                  <span key={tIdx} className={styles.timingPill}>
                                    {timing}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Features List */}
                          <div className={styles.featuresSection}>
                            <div className={styles.featuresTitle}>Included In This Plan:</div>
                            <ul className={styles.featuresList}>
                              {plan.features && plan.features.length > 0 ? (
                                plan.features.map((feature, fIdx) => (
                                  <li key={fIdx} className={styles.featureItem}>
                                    <CheckCircle2 size={14} className={styles.featureIcon} />
                                    <span>{feature}</span>
                                  </li>
                                ))
                              ) : (
                                <>
                                  <li className={styles.featureItem}>
                                    <CheckCircle2 size={14} className={styles.featureIcon} />
                                    <span>Daily Freshly Cooked Home Meals</span>
                                  </li>
                                  <li className={styles.featureItem}>
                                    <CheckCircle2 size={14} className={styles.featureIcon} />
                                    <span>1 Dal + 1 Seasonal Sabzi + Chapatis + Rice</span>
                                  </li>
                                </>
                              )}
                              <li className={styles.featureItem}>
                                <CheckCircle2 size={14} className={styles.featureIcon} />
                                <span>100% Free Doorstep Delivery</span>
                              </li>
                            </ul>
                          </div>

                          {/* Policy Row */}
                          <div className={styles.policyRow}>
                            <span className={styles.policyItem}>
                              <PauseCircle size={12} color="#FF5500" />
                              <span>Pause: {plan.pauseBillingPeriod || "30 Days"}</span>
                            </span>
                            <span className={styles.policyItem}>
                              <ShieldCheck size={12} color="#059669" />
                              <span>Cancel Anytime</span>
                            </span>
                          </div>

                          {/* Subscribe CTA Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenSubscribeModal(plan)}
                            className={styles.subscribeBtn}
                          >
                            <span>Subscribe to {plan.name}</span>
                            <ArrowRight size={15} />
                          </button>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Change Plan Modal */}
      {subscription && isChangingPlan && (
        <ChangePlanModal
          isOpen={isChangingPlan}
          onClose={() => setIsChangingPlan(false)}
          subscriptionId={subscription.id}
          sellerId={subscription.sellerId}
          sellerName={subscription.seller?.businessName}
          currentPlanId={subscription.planId}
          onPlanChanged={handlePlanChanged}
        />
      )}

      {/* Subscribe Confirmation Modal */}
      {selectedPlanForSub && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedPlanForSub(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <div>
                <h2 style={{ margin: "0 0 4px 0", fontSize: "1.2rem", fontWeight: 800, color: "#0F172A" }}>
                  Confirm Meal Subscription
                </h2>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748B" }}>
                  Subscribing to <strong>{selectedPlanForSub.sellerName || "Kitchen Partner"}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlanForSub(null)}
                className={styles.modalCloseBtn}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className={styles.modalBody}>
              {/* Summary */}
              <div className={styles.modalPlanSummary}>
                <div>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "#FF5500",
                      textTransform: "uppercase",
                    }}
                  >
                    {selectedPlanForSub.tier} Tier Plan
                  </span>
                  <h3 style={{ margin: "2px 0 0 0", fontSize: "1.05rem", fontWeight: 800, color: "#0F172A" }}>
                    {selectedPlanForSub.name}
                  </h3>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#FF5500" }}>
                    ₹{getPlanPrice(selectedPlanForSub).toLocaleString("en-IN")}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 600 }}>
                    {(selectedPlanForSub.duration || "1 Week").toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className={styles.formGroup} ref={addressSuggestionsRef}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                  <label className={styles.formLabel}>
                    <MapPin size={13} color="#FF5500" />
                    <span>Delivery Address *</span>
                  </label>
                </div>

                {!isChangingAddress && deliveryAddressInput ? (
                  /* Selected Address Display Card */
                  <div className={styles.selectedAddressCard}>
                    <div className={styles.addressCardHeader}>
                      <div className={styles.addressCardType}>
                        {(() => {
                          const selected = userSavedAddresses.find((a) => a.id === selectedSavedAddressId);
                          const type = (selected?.type || "Home").toLowerCase();
                          return type === "work" ? <Briefcase size={14} color="#FF5500" /> : <Home size={14} color="#FF5500" />;
                        })()}
                        <span>
                          {(() => {
                            const selected = userSavedAddresses.find((a) => a.id === selectedSavedAddressId);
                            return selected?.type || "Delivery Address";
                          })()}
                        </span>
                        {userSavedAddresses.find((a) => a.id === selectedSavedAddressId)?.isDefault && (
                          <span className={styles.defaultBadge}>Default</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsChangingAddress(true)}
                        className={styles.changeAddressBtn}
                      >
                        Change Address
                      </button>
                    </div>
                    <div className={styles.addressCardDetails}>
                      {deliveryAddressInput}
                    </div>
                  </div>
                ) : (
                  /* Address Picker / Selection Mode */
                  <div className={styles.addressPickerContainer}>
                    <div className={styles.addressPickerHeader}>
                      <span className={styles.addressPickerTitle}>Choose Saved Delivery Address</span>
                      {deliveryAddressInput && (
                        <button
                          type="button"
                          onClick={() => setIsChangingAddress(false)}
                          className={styles.addressPickerCloseBtn}
                        >
                          Keep Current
                        </button>
                      )}
                    </div>

                    {userSavedAddresses.length > 0 && (
                      <div className={styles.savedAddressesList}>
                        {userSavedAddresses.map((addr) => {
                          const isSelected = selectedSavedAddressId === addr.id;
                          return (
                            <button
                              key={addr.id}
                              type="button"
                              className={`${styles.savedAddressItem} ${isSelected ? styles.savedAddressItemSelected : ""}`}
                              onClick={() => handleSelectSavedAddress(addr)}
                            >
                              <div className={styles.savedAddressRadio}>
                                {isSelected ? (
                                  <CheckCircle2 size={16} color="#FF5500" />
                                ) : (
                                  <div style={{ width: 14, height: 14, borderRadius: "50%", border: "1.5px solid #CBD5E1" }} />
                                )}
                              </div>
                              <div className={styles.savedAddressInfo}>
                                <div className={styles.savedAddressTypeRow}>
                                  {addr.type?.toLowerCase() === "work" ? <Briefcase size={12} /> : <Home size={12} />}
                                  <span>{addr.type || "Home"}</span>
                                  {addr.isDefault && <span className={styles.defaultBadge}>Default</span>}
                                </div>
                                <div className={styles.savedAddressLines}>
                                  <div style={{ fontWeight: 600, color: "#1E293B" }}>
                                    {addr.houseNumber ? `${addr.houseNumber}, ` : ""}{addr.street}
                                  </div>
                                  <div>
                                    {addr.landmark ? `Landmark: ${addr.landmark}, ` : ""}{addr.city || "Pune"} - {addr.pincode}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Picker Action Buttons */}
                    <div className={styles.addressPickerActions}>
                      <button
                        type="button"
                        onClick={handleDetectGpsLocation}
                        disabled={isDetectingGps}
                        className={styles.gpsDetectBtn}
                        title="Detect current location via GPS"
                      >
                        {isDetectingGps ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                        <span>{isDetectingGps ? "Detecting GPS..." : "Use Current GPS"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowManualAddressInput((prev) => !prev)}
                        className={styles.customAddrBtn}
                      >
                        {showManualAddressInput ? "Hide Custom Input" : "Type Custom Address"}
                      </button>
                    </div>

                    {/* Manual Input / Suggestions */}
                    {(showManualAddressInput || userSavedAddresses.length === 0) && (
                      <div style={{ position: "relative", marginTop: "4px" }}>
                        <input
                          type="text"
                          maxLength={120}
                          placeholder="Type flat/room number, building, street (max 120 chars)..."
                          value={deliveryAddressInput}
                          onChange={(e) => {
                            setDeliveryAddressInput(e.target.value.slice(0, 120));
                            setSelectedSavedAddressId(null);
                            setShowAddressSuggestions(true);
                          }}
                          onFocus={() => setShowAddressSuggestions(true)}
                          className={styles.formInput}
                          style={{ width: "100%", boxSizing: "border-box" }}
                        />
                        <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8", pointerEvents: "none" }}>
                          <MapPin size={16} />
                        </div>

                        {showAddressSuggestions && filteredLocalities.length > 0 && (
                          <div className={styles.suggestionsDropdown}>
                            <div className={styles.suggestionsHeader}>
                              <Search size={12} />
                              <span>Suggested Localities in Pune</span>
                            </div>
                            <div className={styles.suggestionsList}>
                              {filteredLocalities.slice(0, 6).map((loc, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  className={styles.suggestionItem}
                                  onClick={() => handleSelectLocality(loc)}
                                >
                                  <MapPin size={14} className={styles.suggestionPin} />
                                  <div className={styles.suggestionText}>
                                    <span className={styles.suggestionName}>{loc.name}</span>
                                    <span className={styles.suggestionPinCode}>PIN: {loc.pincode}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Contact Phone */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <Phone size={13} color="#FF5500" />
                  <span>Contact Phone Number</span>
                </label>

                {!isEditingPhone && contactPhoneInput ? (
                  <div className={styles.phoneCard}>
                    <div className={styles.phoneCardLeft}>
                      <div className={styles.phoneCardIcon}>
                        <Phone size={14} />
                      </div>
                      <div>
                        <div className={styles.phoneCardNumber}>+91 {contactPhoneInput}</div>
                        <div className={styles.phoneCardLabel}>Account Registered Phone (Used for delivery &amp; OTP)</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingPhone(true)}
                      className={styles.editPhoneBtn}
                    >
                      Edit Number
                    </button>
                  </div>
                ) : (
                  <div className={styles.phoneEditRow}>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      placeholder="e.g. 9876543210"
                      value={contactPhoneInput}
                      onChange={(e) => setContactPhoneInput(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className={styles.formInput}
                      style={{ flex: 1 }}
                    />
                    {contactPhoneInput.length === 10 && (
                      <button
                        type="button"
                        onClick={() => setIsEditingPhone(false)}
                        className={styles.phoneDoneBtn}
                      >
                        Done
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Start Date Preference */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <Calendar size={13} color="#FF5500" />
                  <span>Subscription Start Date</span>
                </label>
                <select
                  value={startDatePreference}
                  onChange={(e) => setStartDatePreference(e.target.value)}
                  className={styles.formInput}
                >
                  <option value="Tomorrow">Starts Tomorrow (Next Delivery Slot)</option>
                  <option value="Monday">Starts Coming Monday</option>
                  <option value="1st">Starts 1st of Next Month</option>
                </select>
              </div>

              {/* Breakdown */}
              <div className={styles.priceBreakdown}>
                <div className={styles.breakdownRow}>
                  <span>Base Plan ({selectedPlanForSub.duration || "1 Week"})</span>
                  <span>₹{getPlanPrice(selectedPlanForSub).toLocaleString("en-IN")}</span>
                </div>
                <div className={styles.breakdownRow}>
                  <span>Doorstep Delivery (All Meals)</span>
                  <span style={{ color: "#059669", fontWeight: 700 }}>FREE</span>
                </div>
                <div className={styles.breakdownTotal}>
                  <span>Total Amount Due</span>
                  <span>₹{getPlanPrice(selectedPlanForSub).toLocaleString("en-IN")}</span>
                </div>
              </div>

              {subErrorMsg && (
                <div
                  style={{
                    backgroundColor: "#FEF2F2",
                    border: "1px solid #FECACA",
                    color: "#991B1B",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                  }}
                >
                  {subErrorMsg}
                </div>
              )}

              {subSuccessMsg && (
                <div
                  style={{
                    backgroundColor: "#ECFDF5",
                    border: "1px solid #A7F3D0",
                    color: "#065F46",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <CheckCircle2 size={15} />
                  <span>{subSuccessMsg} Activating subscription...</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setSelectedPlanForSub(null)}
                className={styles.modalCancelBtn}
                disabled={isSubmittingSub}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubscription}
                className={styles.modalConfirmBtn}
                disabled={isSubmittingSub}
              >
                {isSubmittingSub ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Pay Online &amp; Subscribe (₹{getPlanPrice(selectedPlanForSub).toLocaleString("en-IN")})</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function MySubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#FFF4E6",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <Loader2 size={36} className="animate-spin" color="#FF5500" style={{ margin: "0 auto 12px" }} />
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0F172A" }}>
              Loading Meal Subscriptions...
            </div>
          </div>
        </div>
      }
    >
      <MySubscriptionContent />
    </Suspense>
  );
}
