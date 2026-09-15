"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { FoodHeroBanner } from "@/components/restaurant-desktop/foodherobanner";
import { SubscriptionPlans } from "@/components/restaurant-desktop/subscriptionplans";
import { PopularFood } from "@/components/restaurant-desktop/popularfood";
import { RestaurantMobileView } from "@/components/restaurant-desktop/restaurant-mobile";
import { getKitchenById, KitchenData, FoodCardItem } from "@/components/restaurant-desktop/restaurant-data";
import { useCart } from "@/context/CartContext";
import { fetchApi } from "@/lib/fetch-api";
import { Footer } from "@/components/explore-desktop/footer";
import styles from "../restaurant.module.css";

interface RestaurantClientProps {
  kitchenId: string;
}

export default function RestaurantClient({ kitchenId }: RestaurantClientProps) {
  const { addToCart, decreaseQuantity } = useCart();
  const [kitchenData, setKitchenData] = useState<KitchenData>(() => getKitchenById(kitchenId));
  const [isVegOnly, setIsVegOnly] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function loadLiveSeller() {
      try {
        const res = await fetchApi(`/api/public/shop/${kitchenId}`);
        if (res.ok) {
          const liveData = await res.json();
          if (liveData && isMounted) {
            const liveItems: FoodCardItem[] = (liveData.foodItems || []).map((item: any) => ({
              id: item.id,
              title: item.name,
              description: item.description || "Freshly cooked gourmet preparation.",
              rating: item.averageRating
                ? Number(item.averageRating).toFixed(1)
                : item.rating
                ? Number(item.rating).toFixed(1)
                : "4.8",
              price: `₹${item.price}`,
              image: item.imageUrl || kitchenData.items[0]?.image,
              isVeg: item.itemType ? !item.itemType.toUpperCase().includes("NON_VEG") : item.isVeg !== false,
              category: item.foodCategory?.name || "Popular",
            }));

            const uniqueCats = Array.from(
              new Set(
                (liveData.foodItems || [])
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
              offerText: liveData.offerText || prev.offerText,
              categories:
                uniqueCats.length > 0 ? ["All", ...uniqueCats] : prev.categories,
              items: liveItems.length > 0 ? liveItems : prev.items,
            }));
          }
        }
      } catch (err) {
        console.error("Failed to load live seller data:", err);
      }
    }

    loadLiveSeller();

    return () => {
      isMounted = false;
    };
  }, [kitchenId]);

  const handleAddItem = (item: FoodCardItem) => {
    const rawPrice = parseInt(item.price.replace(/[^\d]/g, ""), 10) || 0;
    addToCart({
      id: item.id,
      name: item.title,
      price: rawPrice,
      quantity: 1,
      sellerId: (kitchenData as any).sellerId || kitchenData.trackingId || kitchenId,
      sellerName: kitchenData.restaurantName,
    });
  };

  const handleDecreaseItem = (itemId: string) => {
    decreaseQuantity(itemId);
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
            chefName={kitchenData.chefName}
            chefDetails={kitchenData.chefDetails}
            initialVegOnly={isVegOnly}
            onVegToggle={(veg) => setIsVegOnly(veg)}
          />

          <SubscriptionPlans />

          <PopularFood
            heading={`Popular at ${kitchenData.restaurantName}`}
            categories={kitchenData.categories}
            defaultActiveCategory={kitchenData.defaultActiveCategory}
            items={displayedItems}
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
        />
        <Footer />
      </div>
    </div>
  );
}
