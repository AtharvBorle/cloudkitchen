"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { FoodHeroBanner } from "@/components/restaurant-desktop/foodherobanner";
import { SubscriptionPlans } from "@/components/restaurant-desktop/subscriptionplans";
import { PopularFood } from "@/components/restaurant-desktop/popularfood";
import { getKitchenById, KitchenData, FoodCardItem } from "@/components/restaurant-desktop/restaurant-data";
import { useCart } from "@/context/CartContext";
import { fetchApi } from "@/lib/fetch-api";
import styles from "../restaurant.module.css";

interface RestaurantClientProps {
  kitchenId: string;
}

export default function RestaurantClient({ kitchenId }: RestaurantClientProps) {
  const { addToCart } = useCart();
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
              rating: item.rating ? Number(item.rating).toFixed(1) : "4.8",
              price: `₹${item.price}`,
              image: item.imageUrl || kitchenData.items[0]?.image,
              isVeg: item.isVeg ?? true,
              category: item.foodCategory?.name || "Popular",
            }));

            setKitchenData((prev) => ({
              ...prev,
              restaurantName: liveData.businessName || prev.restaurantName,
              location: `${liveData.addressLocality || ""} ${liveData.addressLandmark || ""} ${liveData.user?.city || ""}`.trim() || prev.location,
              dietType: liveData.foodType === "VEG" ? "Pure Veg" : "Veg & Non-Veg",
              items: liveItems.length > 0 ? liveItems : prev.items,
            }));
          }
        }
      } catch (err) {
        // Fallback to rich registry data is automatic
      }
    }

    loadLiveSeller();

    return () => {
      isMounted = false;
    };
  }, [kitchenId]);

  const handleAddItem = (item: FoodCardItem) => {
    addToCart({
      id: item.id,
      name: item.title,
      price: parseFloat(item.price.replace(/[^0-9.]/g, "")) || 199,
      quantity: 1,
      sellerId: kitchenData.trackingId || kitchenId,
      sellerName: kitchenData.restaurantName,
    });
  };

  const displayedItems = isVegOnly
    ? kitchenData.items.filter((item) => item.isVeg !== false)
    : kitchenData.items;

  return (
    <div className={styles.container}>
      {/* 1. Shared Desktop Navbar with Food Active */}
      <Navbar
        navItems={["Food", "Mess/Tiffin", "Rooms", "Settings"]}
        initialActiveItem="Food"
      />

      <main className={styles.mainContent}>
        {/* 2. Dynamic Food Hero Banner Component */}
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

        {/* 3. Weekly Subscription Plans Section */}
        <SubscriptionPlans />

        {/* 4. Popular Foods & Categories for this Restaurant */}
        <PopularFood
          heading={`Popular at ${kitchenData.restaurantName}`}
          categories={kitchenData.categories}
          defaultActiveCategory={kitchenData.defaultActiveCategory}
          items={displayedItems}
          onAddItem={handleAddItem}
        />
      </main>
    </div>
  );
}
