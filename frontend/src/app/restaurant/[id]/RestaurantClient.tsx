"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import { FoodHeroBanner } from "@/components/restaurant-desktop/foodherobanner";
import { PopularFood } from "@/components/restaurant-desktop/popularfood";
import { SubscriptionPlans, PlanItem, SubscribeModal, SubscribeModalPlan } from "@/components/restaurant-desktop/subscriptionplans";
import { RestaurantMobileView } from "@/components/restaurant-desktop/restaurant-mobile";
import { getKitchenById, isStaticKitchen, KitchenData, FoodCardItem } from "@/components/restaurant-desktop/restaurant-data";
import { useCart, generateCartItemId } from "@/context/CartContext";
import { fetchApi } from "@/lib/fetch-api";
import { Footer } from "@/components/explore-desktop/footer";
import { AddonCustomizationModal } from "@/components/cart/AddonCustomizationModal";
import styles from "../restaurant.module.css";

interface RestaurantClientProps {
  kitchenId: string;
}

export default function RestaurantClient({ kitchenId }: RestaurantClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isVegParam = searchParams?.get("vegOnly") === "true" || searchParams?.get("veg") === "true" || searchParams?.get("diet") === "veg";
  const { data: session } = useSession();
  const { addToCart, decreaseQuantity } = useCart();
  const isStatic = isStaticKitchen(kitchenId);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [kitchenData, setKitchenData] = useState<KitchenData>(() => getKitchenById(kitchenId));
  const [isVegOnly, setIsVegOnly] = useState<boolean>(() => {
    if (isVegParam) return true;
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("cloudkitchen_veg_preference");
        if (stored !== null) {
          return stored === "true";
        }
      } catch {}
    }
    return false;
  });
  const [addonModalItem, setAddonModalItem] = useState<FoodCardItem | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<PlanItem[]>([]);
  const [rawMealPlans, setRawMealPlans] = useState<any[]>([]);
  const [selectedModalPlan, setSelectedModalPlan] = useState<SubscribeModalPlan | null>(null);
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);

  interface PriceFilterState {
    minPrice?: number;
    maxPrice?: number;
    preset?: string;
  }

  const [priceFilter, setPriceFilter] = useState<PriceFilterState | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const params = new URLSearchParams(window.location.search);
      const pParam = params.get("price");
      const minParam = params.get("minPrice");
      const maxParam = params.get("maxPrice");

      if (pParam || minParam || maxParam) {
        let min = minParam ? Number(minParam) : undefined;
        let max = maxParam ? Number(maxParam) : undefined;
        if (pParam === "under-150") {
          max = 150;
        } else if (pParam === "150-300") {
          min = 150;
          max = 300;
        } else if (pParam === "150-400") {
          min = 150;
          max = 400;
        } else if (pParam === "300-plus") {
          min = 300;
        } else if (pParam === "400-plus") {
          min = 400;
        } else if (pParam === "under-300") {
          max = 300;
        }
        return {
          minPrice: min,
          maxPrice: max,
          preset: pParam || undefined,
        };
      }

      const stored = localStorage.getItem("cloudkitchen_price_filter");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.preset !== "all" || (parsed.maxPrice && parsed.maxPrice < 2500) || parsed.minPrice)) {
          return {
            minPrice: parsed.minPrice,
            maxPrice: parsed.maxPrice,
            preset: parsed.preset,
          };
        }
      }
    } catch {}
    return null;
  });

  // Sync veg filter preference with localStorage and across tabs/components
  useEffect(() => {
    const syncVeg = (e: any) => {
      if (e?.detail !== undefined) {
        setIsVegOnly(Boolean(e.detail));
      } else if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("cloudkitchen_veg_preference");
          if (stored !== null) {
            setIsVegOnly(stored === "true");
          }
        } catch {}
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("cloudkitchen_veg_preference_changed", syncVeg);
      window.addEventListener("storage", syncVeg);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("cloudkitchen_veg_preference_changed", syncVeg);
        window.removeEventListener("storage", syncVeg);
      }
    };
  }, []);

  // Sync price filter preference with localStorage and across tabs/components
  useEffect(() => {
    const syncPrice = (e: any) => {
      if (e?.detail !== undefined) {
        setPriceFilter(e.detail);
      } else if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("cloudkitchen_price_filter");
          if (stored) {
            setPriceFilter(JSON.parse(stored));
          } else {
            setPriceFilter(null);
          }
        } catch {}
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("cloudkitchen_price_filter_changed", syncPrice);
      window.addEventListener("storage", syncPrice);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("cloudkitchen_price_filter_changed", syncPrice);
        window.removeEventListener("storage", syncPrice);
      }
    };
  }, []);

  const handleClearPriceFilter = () => {
    setPriceFilter(null);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("cloudkitchen_price_filter");
        window.dispatchEvent(
          new CustomEvent("cloudkitchen_price_filter_changed", { detail: null })
        );
        const url = new URL(window.location.href);
        url.searchParams.delete("price");
        url.searchParams.delete("minPrice");
        url.searchParams.delete("maxPrice");
        window.history.replaceState({}, "", url.pathname + (url.search || ""));
      } catch {}
    }
  };

  const handleVegToggle = (veg: boolean) => {
    setIsVegOnly(veg);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("cloudkitchen_veg_preference", String(veg));
        window.dispatchEvent(
          new CustomEvent("cloudkitchen_veg_preference_changed", { detail: veg })
        );
      } catch {}
    }
  };

  useEffect(() => {
    let isMounted = true;
    const isCurrentStatic = isStaticKitchen(kitchenId);

    setIsLoaded(false);
    setIsNotFound(false);
    if (isCurrentStatic) {
      setKitchenData(getKitchenById(kitchenId));
    }

    async function loadLiveSeller(isSilent: boolean = false) {
      try {
        const res = await fetchApi(`/api/public/shop/${encodeURIComponent(kitchenId)}`);
        if (res.ok) {
          const resData = await res.json();
          const liveData = resData?.data || resData;
          if (liveData && (liveData.id || liveData.trackingId || liveData.businessName) && isMounted) {
            let mealPlansData: any[] = liveData.mealPlans || [];
            if ((!mealPlansData || mealPlansData.length === 0) && (liveData.id || liveData.trackingId || kitchenId)) {
              try {
                const targetSellerParam = encodeURIComponent(liveData.id || liveData.trackingId || kitchenId);
                const plansRes = await fetchApi(`/api/public/meal-plans?sellerId=${targetSellerParam}`);
                if (plansRes.ok) {
                  const plansJson = await plansRes.json();
                  mealPlansData = plansJson.data || plansJson;
                }
              } catch (err) {
                console.error("Failed to load seller meal plans:", err);
              }
            }

            if (Array.isArray(mealPlansData) && mealPlansData.length > 0 && isMounted) {
              setRawMealPlans(mealPlansData);
              const formatted: PlanItem[] = mealPlansData.map((plan: any) => {
                let features: string[] = [];
                if (Array.isArray(plan.features)) {
                  features = plan.features;
                } else if (typeof plan.features === "string") {
                  try {
                    features = JSON.parse(plan.features);
                  } catch {
                    features = [];
                  }
                }
                if (features.length === 0) {
                  features = [
                    "Fresh & hot home-style delivery",
                    plan.mealTimings && plan.mealTimings.length
                      ? `Served for ${Array.isArray(plan.mealTimings) ? plan.mealTimings.join(", ") : plan.mealTimings}`
                      : "Daily breakfast, lunch or dinner",
                    "Direct doorstep delivery",
                    "Pause anytime when away",
                  ];
                }

                const rawPrice = plan.price !== undefined && plan.price !== null
                  ? (typeof plan.price === "number" ? plan.price : parseFloat(String(plan.price).replace(/[^\d.]/g, "")) || 499)
                  : (typeof plan.weeklyPrice === "number" ? plan.weeklyPrice : parseFloat(String(plan.weeklyPrice || "0").replace(/[^\d.]/g, "")) || 499);

                const getDurationPeriod = (dur?: string): string => {
                  const d = (dur || "1 Week").toLowerCase();
                  if (d.includes("2 week")) return "/2 weeks";
                  if (d.includes("week")) return "/week";
                  if (d.includes("6 month")) return "/6 months";
                  if (d.includes("month")) return "/month";
                  if (d.includes("year")) return "/year";
                  return `/${dur || "week"}`;
                };

                return {
                  id: plan.id,
                  name: plan.name,
                  subtitle: plan.description || `${plan.tier || "Standard"} meal plan curated daily by ${liveData.businessName || liveData.user?.name || "our chef"}.`,
                  price: `₹${rawPrice.toFixed(0)}`,
                  period: getDurationPeriod(plan.duration),
                  badge: plan.tier?.toUpperCase() === "GOLD" ? "Best Value" : (plan.tier?.toUpperCase() === "SILVER" ? "Popular" : undefined),
                  features: features,
                  buttonText: "Subscribe Now",
                  isPremium: plan.tier?.toUpperCase() === "GOLD",
                };
              });
              setSubscriptionPlans(formatted);
            }

            const rawFoodItems = liveData.foodItems || [];
            const liveItems: FoodCardItem[] = rawFoodItems.map((item: any) => {
              let parsedAddons: Array<{ id: string; name: string; price: number }> = [];
              const rawAddons = item.addons || item.variants;
              if (rawAddons) {
                try {
                  const parsed = typeof rawAddons === "string" ? JSON.parse(rawAddons) : rawAddons;
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    parsedAddons = parsed
                      .filter((a: any) => a && (a.name || "").trim())
                      .map((a: any, idx: number) => ({
                        id: String(a.id || idx + 1),
                        name: String(a.name || ""),
                        price: Number(a.price) || 0,
                      }));
                  }
                } catch {}
              }

              const itemRatingsList = Array.isArray(item.itemRatings) ? item.itemRatings : [];
              const rawItemRating =
                typeof item.averageRating === "number" && item.averageRating > 0
                  ? item.averageRating
                  : typeof item.rating === "number" && item.rating > 0
                  ? item.rating
                  : itemRatingsList.length > 0
                  ? itemRatingsList.reduce((sum: number, r: any) => sum + (Number(r?.rating) || 0), 0) / itemRatingsList.length
                  : (item.rating && !isNaN(parseFloat(String(item.rating))) && parseFloat(String(item.rating)) > 0 ? parseFloat(String(item.rating)) : 0);

              const itemRatingDisplay = rawItemRating > 0 ? Number(rawItemRating).toFixed(1) : "New";

              return {
                id: item.id,
                foodItemId: item.id,
                title: item.name,
                description: item.description || "Freshly cooked gourmet preparation.",
                rating: itemRatingDisplay,
                price: `₹${item.price}`,
                image: item.imageUrl || "/images/places/place-pizza.png",
                isVeg: item.itemType ? !item.itemType.toUpperCase().includes("NON_VEG") : item.isVeg !== false,
                category: item.foodCategory?.name || "Popular",
                addons: parsedAddons,
                stockQuantity: item.stockQuantity !== undefined ? item.stockQuantity : -1,
                maxStock: item.stockQuantity !== undefined ? item.stockQuantity : -1,
                isAvailable: item.isAvailable !== false,
                itemType: item.itemType,
                sellerId: liveData.id || liveData.trackingId,
                sellerName: liveData.businessName || liveData.user?.name,
              };
            });

            const uniqueCats = Array.from(
              new Set(
                (rawFoodItems)
                  .map((it: any) => it.foodCategory?.name)
                  .filter(Boolean)
              )
            ) as string[];

            const reviewsList = Array.isArray(liveData.reviews) ? liveData.reviews : [];
            const computedReviewsCount = typeof liveData.totalReviews === "number"
              ? liveData.totalReviews
              : (typeof liveData.reviewsCount === "number" ? liveData.reviewsCount : reviewsList.length);

            let computedSellerRating = 0;
            if (typeof liveData.averageRating === "number" && liveData.averageRating > 0) {
              computedSellerRating = liveData.averageRating;
            } else if (typeof liveData.rating === "number" && liveData.rating > 0) {
              computedSellerRating = liveData.rating;
            } else if (reviewsList.length > 0) {
              const sum = reviewsList.reduce((acc: number, r: any) => acc + (Number(r?.rating) || 0), 0);
              computedSellerRating = parseFloat((sum / reviewsList.length).toFixed(1));
            } else if (liveData.rating && !isNaN(parseFloat(String(liveData.rating))) && parseFloat(String(liveData.rating)) > 0) {
              computedSellerRating = parseFloat(String(liveData.rating));
            }

            const computedReviewsText = computedReviewsCount > 0
              ? `(${computedReviewsCount} review${computedReviewsCount > 1 ? "s" : ""})`
              : "(No ratings yet)";

            const rawFoodType = String(liveData.foodType || "").toUpperCase().replace(/[\s-]/g, "_").trim();
            const hasNonVegItems = (rawFoodItems || []).some((it: any) => {
              const itType = String(it.itemType || "").toUpperCase();
              return itType.includes("NON_VEG") || it.isVeg === false;
            });
            const hasVegItems = (rawFoodItems || []).some((it: any) => {
              const itType = String(it.itemType || "VEG").toUpperCase();
              return !itType.includes("NON_VEG") && it.isVeg !== false;
            });

            const isPureVegKitchen =
              rawFoodType === "PURE_VEG" ||
              rawFoodType === "VEG" ||
              rawFoodType === "VEG_ONLY" ||
              rawFoodType === "PUREVEG" ||
              (!hasNonVegItems && (rawFoodItems || []).length > 0);

            let computedDietType = "Veg & Non-Veg 🍱";
            if (isPureVegKitchen) {
              computedDietType = "Pure Veg 🥦";
              setIsVegOnly(true);
            } else if (rawFoodType === "NON_VEG" && !hasVegItems) {
              computedDietType = "Non-Veg 🍗";
            } else {
              computedDietType = "Veg & Non-Veg 🍱";
            }

            setKitchenData((prev: any) => ({
              ...prev,
              id: liveData.id || liveData.trackingId || prev.id || kitchenId,
              sellerId: liveData.id || liveData.trackingId || prev.sellerId,
              trackingId: liveData.trackingId || prev.trackingId || kitchenId,
              restaurantName:
                liveData.businessName || liveData.user?.name || prev.restaurantName || "Cloud Kitchen",
              location:
                liveData.addressLocality ||
                liveData.addressCity ||
                (liveData.user?.addressLocality ? `${liveData.user.addressLocality}, ${liveData.user.addressCity || "Pune"}` : prev.location || "Pune, Maharashtra"),
              rating: computedSellerRating,
              reviewsCount: computedReviewsText,
              deliveryTime: liveData.deliveryTime || prev.deliveryTime || "25-35 min",
              deliveryFeeText: liveData.deliveryFeeText || prev.deliveryFeeText || "Free Delivery",
              dietType: computedDietType,
              offerText: liveData.offerText || "",
              chefName: liveData.chefName || liveData.businessName || prev.chefName || "Executive Chef",
              chefDetails: liveData.chefDetails || prev.chefDetails || "Specialty cloud kitchen dishes",
              isOnline: liveData.isOnline !== false,
              bannerImageUrl: liveData.bannerImageUrl || (Array.isArray(liveData.kitchenImages) ? liveData.kitchenImages[0] : "") || prev.bannerImageUrl || "",
              categories:
                uniqueCats.length > 0 ? ["All", ...uniqueCats] : (prev.categories?.length ? prev.categories : ["Popular"]),
              defaultActiveCategory: "All",
              items: liveItems,
            }));
            setIsLoaded(true);
            setIsNotFound(false);
          } else if (isMounted && !isCurrentStatic && !isSilent) {
            setIsNotFound(true);
            setIsLoaded(true);
          }
        } else if (isMounted && !isCurrentStatic && !isSilent) {
          setIsNotFound(true);
          setIsLoaded(true);
        }
      } catch (err) {
        console.error("Failed to load live seller data:", err);
        if (isMounted && !isCurrentStatic && !isSilent) {
          setIsNotFound(true);
          setIsLoaded(true);
        }
      }
    }

    loadLiveSeller(false);

    // Periodic live sync (every 4 seconds)
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadLiveSeller(true);
      }
    }, 4000);

    const handleSync = () => {
      loadLiveSeller(true);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadLiveSeller(true);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleSync);
      window.addEventListener("seller-status-updated", handleSync);
      window.addEventListener("cloudkitchen-new-notification", handleSync);
      window.addEventListener("storage", handleSync);
      document.addEventListener("visibilitychange", handleVisibility);
    }

    let bcStatus: BroadcastChannel | null = null;
    let bcNotif: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        bcStatus = new BroadcastChannel("cloudkitchen_seller_status_bc");
        bcStatus.onmessage = () => handleSync();
        bcNotif = new BroadcastChannel("cloudkitchen_seller_notifications_bc");
        bcNotif.onmessage = () => handleSync();
      } catch {}
    }

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", handleSync);
        window.removeEventListener("seller-status-updated", handleSync);
        window.removeEventListener("cloudkitchen-new-notification", handleSync);
        window.removeEventListener("storage", handleSync);
        document.removeEventListener("visibilitychange", handleVisibility);
      }
      if (bcStatus) {
        try { bcStatus.close(); } catch {}
      }
      if (bcNotif) {
        try { bcNotif.close(); } catch {}
      }
    };
  }, [kitchenId]);

  const handleAddItem = (item: FoodCardItem) => {
    if (kitchenData.isOnline === false) {
      alert("This kitchen is currently closed and not accepting orders.");
      return;
    }

    if (item.isAvailable === false || item.stockQuantity === 0) {
      alert("This item is currently unavailable or out of stock.");
      return;
    }

    if (item.addons && item.addons.length > 0) {
      setAddonModalItem(item);
      return;
    }

    const rawPrice = parseInt(item.price.replace(/[^\d]/g, ""), 10) || 0;
    const rawStock = (item as any).maxStock !== undefined ? (item as any).maxStock : (item as any).stockQuantity;
    const stockLimit = rawStock !== undefined && rawStock !== null && !isNaN(Number(rawStock)) ? Number(rawStock) : -1;

    addToCart({
      id: item.id,
      foodItemId: (item as any).foodItemId || item.id,
      name: item.title,
      price: rawPrice,
      quantity: 1,
      sellerId: (kitchenData as any).sellerId || kitchenData.trackingId || kitchenId,
      sellerName: kitchenData.restaurantName,
      image: item.image,
      imageUrl: typeof item.image === "string" ? item.image : (item.image as any)?.src || "",
      stockQuantity: stockLimit,
      maxStock: stockLimit,
      itemType: (item as any).itemType,
      categoryId: (item as any).categoryId,
      foodCategoryId: (item as any).foodCategoryId,
      category: (item as any).category,
      foodCategory: (item as any).foodCategory,
      categoryName: (item as any).categoryName || (item as any).category?.name || (item as any).foodCategory?.name,
      addons: item.addons,
    });
  };

  const handleDecreaseItem = (itemId: string) => {
    decreaseQuantity(itemId);
  };

  const handleSelectPlan = (plan: PlanItem) => {
    if (!session) {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : `/restaurant/${kitchenId}`)}`);
      return;
    }

    const raw = rawMealPlans.find((p) => p.id === plan.id);
    const planPrice = raw?.price !== undefined && raw?.price !== null
      ? (typeof raw.price === "number" ? raw.price : parseFloat(String(raw.price).replace(/[^\d.]/g, "")) || 499)
      : (typeof raw?.weeklyPrice === "number" ? raw.weeklyPrice : parseFloat(plan.price.replace(/[^\d.]/g, "")) || 499);

    setSelectedModalPlan({
      id: plan.id,
      name: plan.name,
      tier: raw?.tier || (plan.isPremium ? "Gold" : "Bronze"),
      price: planPrice,
      duration: raw?.duration || "1 Week",
      period: plan.period,
      weeklyPrice: planPrice,
      monthlyPrice: raw?.monthlyPrice || (raw?.duration && !raw.duration.toLowerCase().includes("week") ? planPrice : undefined),
      description: plan.subtitle,
      features: plan.features,
      mealTimings: raw?.mealTimings || [],
      sellerName: kitchenData.restaurantName,
    });
    setIsSubscribeModalOpen(true);
  };

  const isItemMatchingPrice = (item: FoodCardItem): boolean => {
    if (!priceFilter) return true;
    const { minPrice, maxPrice, preset } = priceFilter;
    if (preset === "all" && (!maxPrice || maxPrice >= 2500) && !minPrice) {
      return true;
    }

    const rawNum = parseFloat(String(item.price).replace(/[^0-9.]/g, ""));
    const price = isNaN(rawNum) ? 0 : rawNum;

    if (preset === "under-150" || (maxPrice === 150 && !minPrice)) {
      return price <= 150;
    }
    if (preset === "150-300" || (minPrice === 150 && maxPrice === 300)) {
      return price >= 150 && price <= 300;
    }
    if (preset === "150-400" || (minPrice === 150 && maxPrice === 400)) {
      return price >= 150 && price <= 400;
    }
    if (preset === "300-plus" || (minPrice === 300 && (!maxPrice || maxPrice >= 2500))) {
      return price >= 300;
    }
    if (preset === "400-plus" || (minPrice === 400 && (!maxPrice || maxPrice >= 2500))) {
      return price >= 400;
    }
    if (minPrice !== undefined && minPrice !== null && price < minPrice) {
      return false;
    }
    if (maxPrice !== undefined && maxPrice !== null && maxPrice < 2500 && price > maxPrice) {
      return false;
    }
    return true;
  };

  const displayedItems = kitchenData.items.filter((item) => {
    if (isVegOnly && !item.isVeg) return false;
    if (!isItemMatchingPrice(item)) return false;
    return true;
  });

  const getPriceFilterBadgeText = () => {
    if (!priceFilter) return "";
    const { preset, minPrice, maxPrice } = priceFilter;
    if (preset === "all" && (!maxPrice || maxPrice >= 2500) && !minPrice) return "";
    if (preset === "150-300" || (minPrice === 150 && maxPrice === 300)) return "₹150 – ₹300";
    if (preset === "under-150" || (maxPrice === 150 && !minPrice)) return "Under ₹150";
    if (preset === "150-400" || (minPrice === 150 && maxPrice === 400)) return "₹150 – ₹400";
    if (preset === "300-plus" || (minPrice === 300 && (!maxPrice || maxPrice >= 2500))) return "₹300+";
    if (preset === "400-plus" || (minPrice === 400 && (!maxPrice || maxPrice >= 2500))) return "₹400+";
    if (minPrice && maxPrice) return `₹${minPrice} – ₹${maxPrice}`;
    if (maxPrice && maxPrice < 2500) return `Up to ₹${maxPrice}`;
    if (minPrice) return `From ₹${minPrice}`;
    return "";
  };

  const priceFilterBadgeText = getPriceFilterBadgeText();

  if (isNotFound) {
    return (
      <div className={styles.pageContainer}>
        <Navbar
          initialActiveItem="Food"
          isVegOnly={isVegOnly}
          onVegToggle={handleVegToggle}
        />
        <main className={styles.mainContent} style={{ textAlign: "center", padding: "80px 20px" }}>
          <div style={{ maxWidth: "480px", margin: "0 auto", backgroundColor: "#FFFFFF", padding: "40px 24px", borderRadius: "24px", border: "1px solid #FED7AA", boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: "50px", marginBottom: "16px" }}>🏪</div>
            <h2 style={{ fontSize: "1.45rem", fontWeight: "800", color: "#0F172A", marginBottom: "10px" }}>
              Kitchen Not Found
            </h2>
            <p style={{ fontSize: "0.92rem", color: "#64748B", lineHeight: "1.6", marginBottom: "24px" }}>
              This cloud kitchen is currently unavailable or may not be active yet.
            </p>
            <button
              type="button"
              onClick={() => router.push("/explore-desktop")}
              style={{
                backgroundColor: "#FE5000",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "12px",
                padding: "12px 28px",
                fontWeight: "700",
                fontSize: "0.95rem",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(254, 80, 0, 0.25)",
              }}
            >
              Explore Other Kitchens
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={styles.pageContainer}>
        {/* 1. DESKTOP SKELETON (>768px) */}
        <div className={styles.desktopOnly}>
          <Navbar
            initialActiveItem="Food"
            isVegOnly={isVegOnly}
            onVegToggle={handleVegToggle}
          />
          <main className={styles.mainContent}>
            <div className={`${styles.skeletonBanner} ${styles.skeletonPulse}`}>
              <div className={styles.skeletonBannerCard}>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div className={styles.skeletonPulse} style={{ width: "280px", height: "32px", borderRadius: "8px" }} />
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div className={styles.skeletonPulse} style={{ width: "70px", height: "24px", borderRadius: "8px" }} />
                    <div className={styles.skeletonPulse} style={{ width: "180px", height: "20px", borderRadius: "6px" }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <div className={styles.skeletonPulse} style={{ width: "110px", height: "36px", borderRadius: "10px" }} />
                  <div className={styles.skeletonPulse} style={{ width: "120px", height: "36px", borderRadius: "10px" }} />
                </div>
              </div>
            </div>

            <div className={styles.skeletonTabsRow}>
              {[90, 110, 85, 120, 95].map((w, i) => (
                <div key={i} className={`${styles.skeletonTab} ${styles.skeletonPulse}`} style={{ width: `${w}px` }} />
              ))}
            </div>

            <div className={styles.skeletonGrid}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className={styles.skeletonFoodCard}>
                  <div className={`${styles.skeletonFoodImg} ${styles.skeletonPulse}`} />
                  <div className={styles.skeletonFoodInfo}>
                    <div>
                      <div className={styles.skeletonPulse} style={{ width: "65%", height: "20px", borderRadius: "6px", marginBottom: "8px" }} />
                      <div className={styles.skeletonPulse} style={{ width: "90%", height: "14px", borderRadius: "4px", marginBottom: "6px" }} />
                      <div className={styles.skeletonPulse} style={{ width: "50%", height: "14px", borderRadius: "4px" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px" }}>
                      <div className={styles.skeletonPulse} style={{ width: "70px", height: "22px", borderRadius: "6px" }} />
                      <div className={styles.skeletonPulse} style={{ width: "84px", height: "34px", borderRadius: "10px" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>
          <Footer />
        </div>

        {/* 2. MOBILE SKELETON (<=768px) */}
        <div className={styles.mobileOnly}>
          <div className={`${styles.skeletonMobileHero} ${styles.skeletonPulse}`} />
          <div className={styles.skeletonMobileCard}>
            <div className={styles.skeletonPulse} style={{ width: "60%", height: "24px", borderRadius: "8px" }} />
            <div style={{ display: "flex", gap: "8px" }}>
              <div className={styles.skeletonPulse} style={{ width: "55px", height: "20px", borderRadius: "6px" }} />
              <div className={styles.skeletonPulse} style={{ width: "120px", height: "20px", borderRadius: "6px" }} />
            </div>
            <div className={styles.skeletonPulse} style={{ width: "85%", height: "16px", borderRadius: "4px" }} />
          </div>
          <div className={styles.skeletonMobileTabs}>
            {[75, 95, 80, 110].map((w, i) => (
              <div key={i} className={`${styles.skeletonTab} ${styles.skeletonPulse}`} style={{ width: `${w}px`, height: "34px", flexShrink: 0 }} />
            ))}
          </div>
          <div className={styles.skeletonMobileList}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={styles.skeletonFoodCard}>
                <div className={`${styles.skeletonFoodImg} ${styles.skeletonPulse}`} />
                <div className={styles.skeletonFoodInfo}>
                  <div>
                    <div className={styles.skeletonPulse} style={{ width: "70%", height: "18px", borderRadius: "6px", marginBottom: "6px" }} />
                    <div className={styles.skeletonPulse} style={{ width: "95%", height: "12px", borderRadius: "4px", marginBottom: "4px" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                    <div className={styles.skeletonPulse} style={{ width: "60px", height: "18px", borderRadius: "4px" }} />
                    <div className={styles.skeletonPulse} style={{ width: "70px", height: "28px", borderRadius: "8px" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* 1. DESKTOP & TABLET VIEW (>768px) */}
      <div className={styles.desktopOnly}>
        <Navbar
          initialActiveItem="Food"
          isVegOnly={isVegOnly}
          onVegToggle={handleVegToggle}
        />

        <main className={styles.mainContent}>
          <FoodHeroBanner
            restaurantName={kitchenData.restaurantName}
            location={kitchenData.location}
            rating={kitchenData.rating}
            reviewsCount={kitchenData.reviewsCount}
            deliveryTime={kitchenData.deliveryTime}
            deliveryFeeText={kitchenData.deliveryFeeText}
            dietType={kitchenData.dietType}
            offerText={kitchenData.offerText}
            isVegOnly={isVegOnly}
            initialVegOnly={isVegOnly}
            onVegToggle={handleVegToggle}
            isOnline={kitchenData.isOnline !== false}
            bannerImageUrl={kitchenData.bannerImageUrl}
          />

          {subscriptionPlans.length > 0 && (
            <SubscriptionPlans
              plans={subscriptionPlans}
              onSelectPlan={handleSelectPlan}
            />
          )}

          {priceFilterBadgeText && (
            <div
              style={{
                maxWidth: "1280px",
                margin: "0 auto 24px auto",
                padding: "12px 20px",
                backgroundColor: "#FFF7ED",
                border: "1.5px solid #FFEDD5",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                fontFamily: "var(--font-poppins), sans-serif",
                boxShadow: "0 2px 8px rgba(255, 107, 0, 0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "16px" }}>🏷️</span>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#C2410C" }}>
                  Price filter applied:{" "}
                  <strong style={{ color: "#9A3412" }}>{priceFilterBadgeText}</strong>
                  {" "}• Showing {displayedItems.length} eligible dish{displayedItems.length === 1 ? "" : "es"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearPriceFilter}
                style={{
                  background: "none",
                  border: "1px solid #FDBA74",
                  backgroundColor: "#FFFFFF",
                  color: "#EA580C",
                  fontWeight: "600",
                  fontSize: "12px",
                  borderRadius: "8px",
                  padding: "5px 12px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#FFF7ED";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#FFFFFF";
                }}
              >
                Show All Dishes ✕
              </button>
            </div>
          )}

          <PopularFood
            heading={`Popular at ${kitchenData.restaurantName}`}
            categories={kitchenData.categories}
            defaultActiveCategory={kitchenData.defaultActiveCategory}
            items={displayedItems}
            isOnline={kitchenData.isOnline !== false}
            isLoading={!isLoaded}
            onAddItem={handleAddItem}
            onDecreaseItem={handleDecreaseItem}
            onResetFilters={handleClearPriceFilter}
          />
        </main>
        <Footer />
      </div>

      {/* 2. MOBILE / ANDROID RESPONSIVE VIEW */}
      <div className={styles.mobileOnly}>
        <RestaurantMobileView
          kitchenData={{
            ...kitchenData,
            items: displayedItems,
          }}
          isVegOnly={isVegOnly}
          isLoading={!isLoaded}
          onVegToggle={handleVegToggle}
          onAddItem={handleAddItem}
          onDecreaseItem={handleDecreaseItem}
          subscriptionPlans={subscriptionPlans}
          onSelectPlan={handleSelectPlan}
          priceFilterText={priceFilterBadgeText}
          onClearPriceFilter={handleClearPriceFilter}
        />
        <Footer />
      </div>

      {addonModalItem && (
        <AddonCustomizationModal
          isOpen={!!addonModalItem}
          onClose={() => setAddonModalItem(null)}
          item={{
            id: addonModalItem.id,
            name: addonModalItem.title,
            price: parseInt(addonModalItem.price.replace(/[^\d]/g, ""), 10) || 0,
            description: addonModalItem.description,
            imageUrl: typeof addonModalItem.image === "string" ? addonModalItem.image : (addonModalItem.image as any)?.src || "",
            itemType: (addonModalItem as any).itemType,
            isVeg: addonModalItem.isVeg,
            addons: addonModalItem.addons || [],
          }}
          onAddToCart={(selectedAddons, quantity) => {
            const base = parseInt(addonModalItem.price.replace(/[^\d]/g, ""), 10) || 0;
            const addonsTotal = selectedAddons.reduce((sum, a) => sum + (a.price || 0), 0);
            const unitPrice = base + addonsTotal;
            const rawStock = (addonModalItem as any).maxStock !== undefined ? (addonModalItem as any).maxStock : (addonModalItem as any).stockQuantity;
            const stockLimit = rawStock !== undefined && rawStock !== null && !isNaN(Number(rawStock)) ? Number(rawStock) : -1;
            const itemImg = typeof addonModalItem.image === "string" ? addonModalItem.image : (addonModalItem.image as any)?.src || "";
            const baseFoodId = (addonModalItem as any).foodItemId || addonModalItem.id;
            const cartItemId = generateCartItemId(baseFoodId, selectedAddons);

            addToCart({
              id: cartItemId,
              foodItemId: baseFoodId,
              name: addonModalItem.title,
              price: unitPrice,
              basePrice: base,
              addonsTotal: addonsTotal,
              selectedAddons: selectedAddons,
              quantity: quantity || 1,
              sellerId: (kitchenData as any).sellerId || kitchenData.trackingId || kitchenId,
              sellerName: kitchenData.restaurantName,
              image: itemImg,
              imageUrl: itemImg,
              stockQuantity: stockLimit,
              maxStock: stockLimit,
              itemType: (addonModalItem as any).itemType,
              categoryId: (addonModalItem as any).categoryId,
              foodCategoryId: (addonModalItem as any).foodCategoryId,
              category: (addonModalItem as any).category,
              foodCategory: (addonModalItem as any).foodCategory,
              categoryName: (addonModalItem as any).categoryName || (addonModalItem as any).category?.name || (addonModalItem as any).foodCategory?.name,
              addons: addonModalItem.addons,
            });
            setAddonModalItem(null);
          }}
        />
      )}

      {isSubscribeModalOpen && selectedModalPlan && (
        <SubscribeModal
          isOpen={isSubscribeModalOpen}
          onClose={() => {
            setIsSubscribeModalOpen(false);
            setSelectedModalPlan(null);
          }}
          plan={selectedModalPlan}
          onSubscribed={(_newSub) => {
            setIsSubscribeModalOpen(false);
            setSelectedModalPlan(null);
            router.push("/my-subscription");
          }}
        />
      )}
    </div>
  );
}
