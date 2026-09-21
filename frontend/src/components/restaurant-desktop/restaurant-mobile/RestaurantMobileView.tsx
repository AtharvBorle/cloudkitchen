"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Share2,
  Heart,
  Star,
  Clock,
  Bike,
  Tag,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  ChevronRight,
  Menu,
} from "lucide-react";
import styles from "./RestaurantMobileView.module.css";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { DietaryTag } from "@/components/common/DietaryTag";
import heroPhoto from "../foodherobanner/FoodHeroPhoto.jpg";
import { KitchenData, FoodCardItem } from "../restaurant-data";
import { useCart } from "@/context/CartContext";

export interface RestaurantMobileViewProps {
  kitchenData: KitchenData;
  isVegOnly: boolean;
  onVegToggle: (veg: boolean) => void;
  onAddItem: (item: FoodCardItem) => void;
  onDecreaseItem?: (itemId: string) => void;
  onRemoveItem?: (itemId: string) => void;
}

export const RestaurantMobileView: React.FC<RestaurantMobileViewProps> = ({
  kitchenData,
  isVegOnly,
  onVegToggle,
  onAddItem,
  onDecreaseItem,
  onRemoveItem,
}) => {
  const router = useRouter();
  const { cartItems, decreaseQuantity, removeFromCart, cartTotal } = useCart();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [couponCopied, setCouponCopied] = useState<boolean>(false);

  const getItemQuantity = (itemId: string) => {
    const found = cartItems.find((ci) => ci.id === itemId);
    return found ? found.quantity : 0;
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: kitchenData.restaurantName,
          text: `Check out delicious food from ${kitchenData.restaurantName}!`,
          url: window.location.href,
        });
      } catch {
        // Dismissed
      }
    } else if (typeof navigator !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const handleAdd = (item: FoodCardItem) => {
    onAddItem(item);
  };

  const handleIncrement = (item: FoodCardItem) => {
    onAddItem(item);
  };

  const handleDecrement = (itemId: string) => {
    if (onDecreaseItem) {
      onDecreaseItem(itemId);
    } else {
      decreaseQuantity(itemId);
    }
  };

  const handleRemove = (itemId: string) => {
    if (onRemoveItem) {
      onRemoveItem(itemId);
    } else {
      removeFromCart(itemId);
    }
  };

  // Base items strictly from kitchenData
  const baseItems: FoodCardItem[] = kitchenData.items || [];

  const dynamicCategories = React.useMemo(() => {
    const rawCategories = Array.from(
      new Set(baseItems.map((item) => item.category).filter(Boolean))
    ) as string[];
    if (rawCategories.length === 0) return [];
    return ["All", ...rawCategories];
  }, [baseItems]);

  // Filter items by category and isVegOnly
  const itemsToDisplay = baseItems.filter((item) => {
    const matchesVeg = !isVegOnly || item.isVeg !== false;
    const matchesCategory =
      activeCategory === "All" ||
      (item.category && item.category.toLowerCase() === activeCategory.toLowerCase());
    return matchesVeg && matchesCategory;
  });

  const finalDisplayItems = itemsToDisplay;

  const getSectionTitle = () => {
    if (activeCategory === "All") return "All Menu Items";
    return activeCategory;
  };

  const totalCartCount = cartItems.reduce((acc, ci) => acc + ci.quantity, 0);
  const totalCartPrice = cartTotal;

  return (
    <div className={styles.mobileContainer}>
      {/* Slide-out Mobile Sidebar Drawer for Website Navigation */}
      <MobileSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeItem="Explore"
      />

      {/* 1. Hero Food Spread Cover Image */}
      <div className={styles.heroWrapper}>
        <Image
          src={heroPhoto}
          alt={kitchenData.restaurantName}
          fill
          priority
          sizes="100vw"
          className={styles.heroImg}
        />
        <div className={styles.heroOverlay} />

        {/* Floating Top Header Buttons matching the website header */}
        <header className={styles.floatingHeader}>
          <div className={styles.floatingLeftBtns}>
            <button
              type="button"
              className={styles.iconCircleBtn}
              onClick={() => router.back()}
              aria-label="Back"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              className={styles.iconCircleBtn}
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={19} strokeWidth={2.4} />
            </button>
          </div>

          <div className={styles.floatingRightBtns}>
            <button
              type="button"
              className={styles.iconCircleBtn}
              onClick={handleShare}
              aria-label="Share restaurant"
            >
              <Share2 size={17} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              className={styles.iconCircleBtn}
              onClick={() => setIsFavorite((prev) => !prev)}
              aria-label="Favorite"
            >
              <Heart
                size={18}
                strokeWidth={2.2}
                fill={isFavorite ? "#EF4444" : "none"}
                color={isFavorite ? "#EF4444" : "#0F172A"}
              />
            </button>
          </div>
        </header>
      </div>

      {/* 2. Restaurant Information Body */}
      <div className={styles.contentBody}>
        {/* Title & Rating */}
        <div className={styles.titleRow}>
          <h1 className={styles.restaurantName}>{kitchenData.restaurantName}</h1>
          <div className={styles.ratingBadge}>
            <Star size={13} fill="#F59E0B" color="#F59E0B" />
            <span className={styles.ratingScore}>{kitchenData.rating}</span>
            {kitchenData.reviewsCount && (
              <span className={styles.ratingReviews}>{kitchenData.reviewsCount}</span>
            )}
          </div>
        </div>

        {/* Location Subtitle */}
        {kitchenData.location && <p className={styles.locationText}>{kitchenData.location}</p>}

        {/* Delivery Time & Free Delivery Info */}
        {(kitchenData.deliveryTime || kitchenData.deliveryFeeText) && (
          <div className={styles.deliveryRow}>
            {kitchenData.deliveryTime && (
              <div className={styles.deliveryItem}>
                <Clock size={15} className={styles.clockIcon} />
                <span>{kitchenData.deliveryTime}</span>
              </div>
            )}
            {kitchenData.deliveryFeeText && (
              <div className={`${styles.deliveryItem} ${styles.freeDeliveryItem}`}>
                <Bike size={16} />
                <span>{kitchenData.deliveryFeeText}</span>
              </div>
            )}
          </div>
        )}

        {/* Coupon Offer Banner & Veg Switch */}
        <div className={styles.offerAndVegRow}>
          {kitchenData.offerText ? (
            <div
              className={styles.couponPill}
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.clipboard && kitchenData.offerText) {
                  navigator.clipboard.writeText(kitchenData.offerText);
                }
                setCouponCopied(true);
                setTimeout(() => setCouponCopied(false), 2500);
              }}
              title="Click to copy coupon code"
              style={{ cursor: "pointer" }}
            >
              <Tag size={13} className={styles.couponIcon} />
              <span>
                {couponCopied ? "✓ Offer Copied!" : kitchenData.offerText}
              </span>
            </div>
          ) : (
            <div />
          )}

          <div
            className={styles.vegToggle}
            onClick={() => onVegToggle(!isVegOnly)}
            role="switch"
            aria-checked={isVegOnly}
          >
            <span className={styles.vegLabel}>Veg</span>
            <div className={`${styles.toggleTrack} ${isVegOnly ? styles.toggleTrackActive : ""}`}>
              <div className={`${styles.toggleThumb} ${isVegOnly ? styles.toggleThumbActive : ""}`} />
            </div>
          </div>
        </div>

        {/* 3. Category Filter Chips (Horizontal Scroll) */}
        {dynamicCategories.length > 1 && (
          <div className={styles.categoriesBar}>
            {dynamicCategories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  className={`${styles.catChip} ${isActive ? styles.catChipActive : ""}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}

        {/* 5. Food Items List */}
        <div className={styles.foodSection}>
          <h2 className={styles.foodSectionTitle}>{getSectionTitle()}</h2>

          {finalDisplayItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 16px", color: "#64748B", fontSize: "0.95rem" }}>
              No items available in this category.
            </div>
          ) : (
            <div className={styles.foodList}>
              {finalDisplayItems.map((item) => {
                const quantity = getItemQuantity(item.id);
                const hasQuantity = quantity > 0;

                return (
                  <div key={item.id} className={styles.foodCard}>
                    {/* Left Food Image */}
                    <div className={styles.foodImageWrapper}>
                      <div style={{ position: "absolute", top: "4px", left: "4px", zIndex: 2 }}>
                        <DietaryTag isVeg={item.isVeg !== false} size="xs" />
                      </div>
                      <Image
                        src={item.image || "/images/places/place-pizza.png"}
                        alt={item.title}
                        fill
                        sizes="96px"
                        className={styles.foodThumbnail}
                      />
                    </div>

                    {/* Right Content */}
                    <div className={styles.foodInfo}>
                      <h3 className={styles.foodTitle}>{item.title}</h3>
                      <p className={styles.foodDesc}>{item.description}</p>

                      {item.addons && item.addons.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", margin: "2px 0 6px 0" }}>
                          <span style={{ fontSize: "0.68rem", fontWeight: "700", color: "#EA580C", backgroundColor: "#FFF7ED", border: "1px solid #FFEDD5", padding: "1px 5px", borderRadius: "4px" }}>
                            ✨ {item.addons.length} Add-on{item.addons.length > 1 ? "s" : ""} Available
                          </span>
                        </div>
                      )}

                      {/* Bottom Action Row */}
                      <div className={styles.foodBottomRow}>
                        <span className={styles.foodPrice}>{item.price}</span>

                        {!hasQuantity ? (
                          <button
                            type="button"
                            className={styles.addBtn}
                            onClick={() => handleAdd(item)}
                          >
                            <Plus size={13} strokeWidth={2.5} />
                            <span>Add</span>
                          </button>
                        ) : (
                          <div className={styles.quantityControlsRow}>
                            {/* Stepper */}
                            <div className={styles.stepperPill}>
                              <button
                                type="button"
                                className={styles.stepperBtn}
                                onClick={() => handleDecrement(item.id)}
                                aria-label="Decrease quantity"
                              >
                                <Minus size={12} strokeWidth={2.5} />
                              </button>
                              <span className={styles.stepperVal}>{quantity}</span>
                              <button
                                type="button"
                                className={styles.stepperBtn}
                                onClick={() => handleIncrement(item)}
                                aria-label="Increase quantity"
                              >
                                <Plus size={12} strokeWidth={2.5} />
                              </button>
                            </div>

                            {/* Remove Pill */}
                            <button
                              type="button"
                              className={styles.trashBtn}
                              onClick={() => handleRemove(item.id)}
                              aria-label="Remove item"
                            >
                              <Trash2 size={12} color="#EF4444" />
                              <span>Remove</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 6. Floating Cart & Checkout Bar */}
      {totalCartCount > 0 && (
        <div className={styles.floatingCartBar}>
          <div className={styles.cartIndicatorHandle} />
          <div className={styles.cartLeftSection}>
            <div className={styles.cartThumbnailsGroup}>
              {cartItems.slice(0, 3).map((ci) => (
                <Image
                  key={ci.id}
                  src={ci.image || "/images/places/place-pizza.png"}
                  alt={ci.name}
                  width={32}
                  height={32}
                  className={styles.cartMiniThumb}
                />
              ))}
            </div>
            <div className={styles.cartTrolleyWrapper}>
              <ShoppingCart size={20} />
              <span className={styles.cartCountPill}>{totalCartCount}</span>
            </div>
          </div>
          <button
            type="button"
            className={styles.cartPayBtn}
            onClick={() => router.push("/user/cart")}
          >
            <span>View Cart • ₹{totalCartPrice.toFixed(2)}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default RestaurantMobileView;
