"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import { FoodHeroBanner } from "@/components/restaurant-desktop/foodherobanner";
import { PopularFood } from "@/components/restaurant-desktop/popularfood";
import { SubscriptionPlans, PlanItem, SubscribeModal, SubscribeModalPlan } from "@/components/restaurant-desktop/subscriptionplans";
import { RestaurantMobileView } from "@/components/restaurant-desktop/restaurant-mobile";
import { getKitchenById, KitchenData, FoodCardItem } from "@/components/restaurant-desktop/restaurant-data";
import { useCart } from "@/context/CartContext";
import { fetchApi } from "@/lib/fetch-api";
import { Footer } from "@/components/explore-desktop/footer";
import { AddonCustomizationModal } from "@/components/cart/AddonCustomizationModal";
import styles from "../restaurant.module.css";

interface RestaurantClientProps {
  kitchenId: string;
}

export default function RestaurantClient({ kitchenId }: RestaurantClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { addToCart, decreaseQuantity } = useCart();
  const [kitchenData, setKitchenData] = useState<KitchenData>(() => getKitchenById(kitchenId));
  const [isVegOnly, setIsVegOnly] = useState<boolean>(false);
  const [addonModalItem, setAddonModalItem] = useState<FoodCardItem | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<PlanItem[]>([]);
  const [rawMealPlans, setRawMealPlans] = useState<any[]>([]);
  const [selectedModalPlan, setSelectedModalPlan] = useState<SubscribeModalPlan | null>(null);
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadLiveSeller() {
      try {
        const res = await fetchApi(`/api/public/shop/${encodeURIComponent(kitchenId)}`);
        if (res.ok) {
          const resData = await res.json();
          const liveData = resData?.data || resData;
          if (liveData && isMounted) {
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
                    "Zero delivery fee on subscription",
                    "Pause or cancel anytime",
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

              return {
                id: item.id,
                foodItemId: item.id,
                title: item.name,
                description: item.description || "Freshly cooked gourmet preparation.",
                rating: item.averageRating
                  ? Number(item.averageRating).toFixed(1)
                  : item.rating
                  ? Number(item.rating).toFixed(1)
                  : "4.8",
                price: `₹${item.price}`,
                image: item.imageUrl || kitchenData.items[0]?.image || "/images/places/place-pizza.png",
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

            setKitchenData((prev: any) => ({
              ...prev,
              sellerId: liveData.id || liveData.trackingId || prev.sellerId,
              trackingId: liveData.trackingId || prev.trackingId,
              restaurantName:
                liveData.businessName || liveData.user?.name || prev.restaurantName,
              location:
                liveData.addressLocality ||
                liveData.addressCity ||
                prev.location,
              rating: liveData.rating
                ? Number(liveData.rating).toFixed(1)
                : prev.rating,
              deliveryTime: liveData.deliveryTime || prev.deliveryTime,
              deliveryFeeText: liveData.deliveryFeeText || prev.deliveryFeeText,
              dietType:
                liveData.foodType === "VEG"
                  ? "Pure Veg 🥦"
                  : liveData.foodType === "NON_VEG"
                  ? "Non-Veg 🍗"
                  : "Veg & Non-Veg 🍱",
              offerText: liveData.offerText || "",
              isOnline: liveData.isOnline !== false,
              bannerImageUrl: liveData.bannerImageUrl || (Array.isArray(liveData.kitchenImages) ? liveData.kitchenImages[0] : "") || prev.bannerImageUrl || "",
              categories:
                uniqueCats.length > 0 ? ["All", ...uniqueCats] : [],
              items: liveItems,
            }));
          }
        }
      } catch (err) {
        console.error("Failed to load live seller data:", err);
      }
    }

    loadLiveSeller();

    // Periodic live sync (every 4 seconds)
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadLiveSeller();
      }
    }, 4000);

    const handleSync = () => {
      loadLiveSeller();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadLiveSeller();
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
      monthlyPrice: raw?.monthlyPrice || (planPrice * 4),
      description: plan.subtitle,
      features: plan.features,
      mealTimings: raw?.mealTimings || [],
      sellerName: kitchenData.restaurantName,
    });
    setIsSubscribeModalOpen(true);
  };

  const displayedItems = isVegOnly
    ? kitchenData.items.filter((item) => item.isVeg)
    : kitchenData.items;

  return (
    <div className={styles.pageContainer}>
      {/* 1. DESKTOP & TABLET VIEW (>768px) */}
      <div className={styles.desktopOnly}>
        <Navbar
          initialActiveItem="Food"
          isVegOnly={isVegOnly}
          onVegToggle={(veg) => setIsVegOnly(veg)}
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
            initialVegOnly={isVegOnly}
            onVegToggle={(veg) => setIsVegOnly(veg)}
            isOnline={kitchenData.isOnline !== false}
            bannerImageUrl={kitchenData.bannerImageUrl}
          />

          {subscriptionPlans.length > 0 && (
            <SubscriptionPlans
              plans={subscriptionPlans}
              onSelectPlan={handleSelectPlan}
            />
          )}

          <PopularFood
            heading={`Popular at ${kitchenData.restaurantName}`}
            categories={kitchenData.categories}
            defaultActiveCategory={kitchenData.defaultActiveCategory}
            items={displayedItems}
            isOnline={kitchenData.isOnline !== false}
            onAddItem={handleAddItem}
            onDecreaseItem={handleDecreaseItem}
          />
        </main>
        <Footer />
      </div>

      {/* 2. MOBILE / ANDROID RESPONSIVE VIEW */}
      <div className={styles.mobileOnly}>
        <RestaurantMobileView
          kitchenData={kitchenData}
          isVegOnly={isVegOnly}
          onVegToggle={(veg) => setIsVegOnly(veg)}
          onAddItem={handleAddItem}
          onDecreaseItem={handleDecreaseItem}
          subscriptionPlans={subscriptionPlans}
          onSelectPlan={handleSelectPlan}
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

            addToCart({
              id: addonModalItem.id,
              foodItemId: (addonModalItem as any).foodItemId || addonModalItem.id,
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
