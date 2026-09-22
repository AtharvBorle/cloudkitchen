"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { FoodHeroBanner } from "@/components/restaurant-desktop/foodherobanner";
import { PopularFood } from "@/components/restaurant-desktop/popularfood";
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
  const { addToCart, decreaseQuantity } = useCart();
  const [kitchenData, setKitchenData] = useState<KitchenData>(() => getKitchenById(kitchenId));
  const [isVegOnly, setIsVegOnly] = useState<boolean>(false);
  const [addonModalItem, setAddonModalItem] = useState<FoodCardItem | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLiveSeller() {
      try {
        const res = await fetchApi(`/api/public/shop/${kitchenId}`);
        if (res.ok) {
          const resData = await res.json();
          const liveData = resData?.data || resData;
          if (liveData && isMounted) {
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
    if (kitchenData.isOnline === false) {
      alert("This kitchen is currently closed and not accepting orders.");
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
    </div>
  );
}
