"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Share2,
  Heart,
  Star,
  Clock,
  Bike,
  Tag,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Trash2,
} from "lucide-react";
import styles from "./RestaurantMobileView.module.css";
import heroPhoto from "../foodherobanner/FoodHeroPhoto.jpg";
import chefProfileImg from "../foodherobanner/chef-anjali-profile.png";
import img1 from "../popularfood/pizza-margherita-classic.jpg";
import img2 from "../popularfood/pizza-bbq-paneer.jpg";
import img3 from "../popularfood/pizza-gourmet-table.jpg";
import { KitchenData, FoodCardItem } from "../restaurant-data";

export interface RestaurantMobileViewProps {
  kitchenData: KitchenData;
  isVegOnly: boolean;
  onVegToggle: (veg: boolean) => void;
  onAddItem: (item: FoodCardItem) => void;
}

export const RestaurantMobileView: React.FC<RestaurantMobileViewProps> = ({
  kitchenData,
  isVegOnly,
  onVegToggle,
  onAddItem,
}) => {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("premium");
  const [showAllPlans, setShowAllPlans] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>("Pizza");

  // Local state for interactive item quantity & customization in mobile view
  const [itemQuantities, setItemQuantities] = useState<{ [id: string]: number }>({
    "item-2": 1,
  });
  const [itemSizes, setItemSizes] = useState<{ [id: string]: string }>({
    "item-2": "Medium",
  });

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: kitchenData.restaurantName,
          text: `Check out delicious food from ${kitchenData.restaurantName}!`,
          url: window.location.href,
        });
      } catch (err) {
        // Dismissed
      }
    } else if (typeof navigator !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const handleAdd = (item: FoodCardItem) => {
    setItemQuantities((prev) => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1,
    }));
    onAddItem(item);
  };

  const handleIncrement = (itemId: string) => {
    setItemQuantities((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
  };

  const handleDecrement = (itemId: string) => {
    setItemQuantities((prev) => {
      const current = prev[itemId] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: current - 1 };
    });
  };

  const handleRemove = (itemId: string) => {
    setItemQuantities((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const categories = kitchenData.categories && kitchenData.categories.length > 0
    ? kitchenData.categories
    : ["Popular", "Pizza", "Sides", "Drinks", "Desserts"];

  // Base items from kitchenData or default menu
  const baseItems: FoodCardItem[] = kitchenData.items && kitchenData.items.length > 0
    ? kitchenData.items
    : [
        {
          id: "item-1",
          title: "Margherita Pizza",
          description: "Fresh mozzarella, classic tomato sauce, fresh basil, and extra virgin olive oil.",
          rating: "4.8",
          price: "₹289",
          image: img1,
          isVeg: true,
          category: "Pizza",
        },
        {
          id: "item-2",
          title: "Pepperoni Pizza",
          description: "Thick cut pepperoni slices, mozzarella cheese, and rich marinara sauce with oregano.",
          rating: "4.8",
          price: "₹349",
          image: img2,
          isVeg: false,
          category: "Pizza",
        },
        {
          id: "item-3",
          title: "Margherita Pizza",
          description: "Fresh mozzarella, classic tomato sauce, fresh basil, and extra virgin olive oil.",
          rating: "4.8",
          price: "₹289",
          image: img3,
          isVeg: true,
          category: "Pizza",
        },
      ];

  // Filter items by category (if not "Popular") and isVegOnly
  const itemsToDisplay = baseItems.filter((item) => {
    const matchesVeg = !isVegOnly || item.isVeg !== false;
    const matchesCategory =
      activeCategory === "Popular" ||
      !item.category ||
      item.category.toLowerCase() === activeCategory.toLowerCase();
    return matchesVeg && matchesCategory;
  });

  // Fallback if category has no items after filtering
  const finalDisplayItems = itemsToDisplay.length > 0
    ? itemsToDisplay
    : baseItems.filter((item) => !isVegOnly || item.isVeg !== false);


  const plans = [
    {
      id: "basic",
      name: "Basic",
      meals: "(3 meals/wk • Lunch)",
      price: "₹299",
      period: "/week",
    },
    {
      id: "silver",
      name: "Silver",
      meals: "(5 meals/wk • Lunch/Dinner)",
      price: "₹499",
      period: "/week",
    },
    {
      id: "premium",
      name: "Premium",
      meals: "(7 meals/week)",
      price: "₹799",
      period: "/week",
    },
  ];

  return (
    <div className={styles.mobileContainer}>
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

        {/* Floating Top Header Buttons */}
        <header className={styles.floatingHeader}>
          <button
            type="button"
            className={styles.iconCircleBtn}
            onClick={() => router.back()}
            aria-label="Back"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>

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
            <span className={styles.ratingReviews}>[240+]</span>
          </div>
        </div>

        {/* Location Subtitle */}
        <p className={styles.locationText}>{kitchenData.location}</p>

        {/* Chef Profile Card */}
        <div className={styles.chefCard}>
          <Image
            src={chefProfileImg}
            alt={kitchenData.chefName || "Chef Anjali Sharma"}
            width={40}
            height={40}
            className={styles.chefAvatar}
          />
          <div className={styles.chefDetails}>
            <span className={styles.chefName}>{kitchenData.chefName || "Chef Anjali Sharma"}</span>
            <span className={styles.chefSubtitle}>
              {kitchenData.chefDetails || "5+ years serving home meals • Pune Cantonment"}
            </span>
          </div>
        </div>

        {/* Delivery Time & Free Delivery Info */}
        <div className={styles.deliveryRow}>
          <div className={styles.deliveryItem}>
            <Clock size={15} className={styles.clockIcon} />
            <span>{kitchenData.deliveryTime || "20 min"}</span>
          </div>
          <div className={`${styles.deliveryItem} ${styles.freeDeliveryItem}`}>
            <Bike size={16} />
            <span>{kitchenData.deliveryFeeText || "Free Delivery"}</span>
          </div>
        </div>

        {/* Coupon Offer Banner & Veg Switch */}
        <div className={styles.offerAndVegRow}>
          <div className={styles.couponPill}>
            <Tag size={13} className={styles.couponIcon} />
            <span>30% OFF up to ₹150 • Code: CRUST30</span>
          </div>

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

        {/* 3. Weekly Subscription Plans Section */}
        <div className={styles.plansSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Weekly Subscription Plans</h2>
            <span className={styles.plansCountBadge}>3</span>
          </div>

          <div className={styles.plansList}>
            {plans.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`${styles.planAccordionCard} ${
                    isSelected ? styles.planAccordionActive : ""
                  }`}
                  onClick={() => setSelectedPlanId(plan.id)}
                >
                  <div className={styles.planLeft}>
                    <span className={styles.planName}>{plan.name}</span>
                    <span className={styles.planMeals}>{plan.meals}</span>
                  </div>
                  <div className={styles.planRight}>
                    <span className={styles.planPrice}>{plan.price}</span>
                    <span className={styles.planPeriod}>{plan.period}</span>
                    <ChevronDown size={16} className={styles.planChevron} />
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className={styles.seeMorePlansBtn}
            onClick={() => setShowAllPlans((prev) => !prev)}
          >
            <span>{showAllPlans ? "Hide Plan Details" : "See More Plan Details"}</span>
            {showAllPlans ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>

        {/* 4. Category Filter Chips (Horizontal Scroll) */}
        <div className={styles.categoriesBar}>
          {categories.map((cat) => {
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

        {/* 5. Food Items List (Popular Pizzas & Sides) */}
        <div className={styles.foodSection}>
          <h2 className={styles.foodSectionTitle}>Popular Pizzas & Sides</h2>

          <div className={styles.foodList}>
            {finalDisplayItems.map((item) => {
              const quantity = itemQuantities[item.id] || 0;
              const hasQuantity = quantity > 0;
              const size = itemSizes[item.id] || "Medium";

              return (
                <div key={item.id} className={styles.foodCard}>
                  {/* Left Food Image */}
                  <div className={styles.foodImageWrapper}>
                    <Image
                      src={item.image}
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
                          {/* Size Pill */}
                          <button
                            type="button"
                            className={styles.sizeDropdownBtn}
                            onClick={() => {
                              const nextSize = size === "Medium" ? "Large" : "Medium";
                              setItemSizes((prev) => ({ ...prev, [item.id]: nextSize }));
                            }}
                          >
                            <span>{size}</span>
                            <ChevronDown size={12} />
                          </button>

                          {/* Stepper */}
                          <div className={styles.stepperPill}>
                            <button
                              type="button"
                              className={styles.stepperBtn}
                              onClick={() => handleDecrement(item.id)}
                            >
                              <Minus size={12} strokeWidth={2.5} />
                            </button>
                            <span className={styles.stepperVal}>{quantity}</span>
                            <button
                              type="button"
                              className={styles.stepperBtn}
                              onClick={() => handleIncrement(item.id)}
                            >
                              <Plus size={12} strokeWidth={2.5} />
                            </button>
                          </div>

                          {/* Trash Button */}
                          <button
                            type="button"
                            className={styles.trashBtn}
                            onClick={() => handleRemove(item.id)}
                            aria-label="Remove item"
                          >
                            <Trash2 size={13} color="#EF4444" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantMobileView;
