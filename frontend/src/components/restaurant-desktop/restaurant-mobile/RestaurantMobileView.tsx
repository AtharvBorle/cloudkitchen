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
  ShoppingCart,
  Shield,
  Check,
  ChevronRight,
} from "lucide-react";
import styles from "./RestaurantMobileView.module.css";
import heroPhoto from "../foodherobanner/FoodHeroPhoto.jpg";
import chefProfileImg from "../foodherobanner/chef-anjali-profile.png";
import img1 from "../popularfood/pizza-margherita-classic.jpg";
import img2 from "../popularfood/pizza-bbq-paneer.jpg";
import img3 from "../popularfood/pizza-gourmet-table.jpg";
import img4 from "../popularfood/pizza-rustic-slices.jpg";
import img5 from "../popularfood/pizza-slice-popart.jpg";
import img6 from "../popularfood/pizza-spinach-ricotta.jpg";
import lavaCakeImg from "../../explore-desktop/featured-collections/collection-molten-lava-cake.jpg";
import pancakeImg from "../../explore-desktop/featured-collections/collection-fluffy-pancakes.jpg";
import streetFoodImg from "../../explore-desktop/curated-dining-collections/dining-street-food.jpg";
import comfortFoodImg from "../../explore-desktop/curated-dining-collections/dining-comfort-food.jpg";
import saladImg from "../../explore-desktop/curated-dining-collections/dining-fresh-salads.jpg";
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
  const { cartItems, addToCart, decreaseQuantity, removeFromCart, cartTotal } = useCart();
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("premium");
  const [showAllPlans, setShowAllPlans] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>("Pizza");
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
      } catch (err) {
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

  const categories = ["Popular", "Pizza", "Sides", "Drinks", "Desserts"];

  // Default menu items across Popular, Pizza, Sides, Drinks, and Desserts
  const defaultMenuItems: FoodCardItem[] = [
    // 1. Pizza
    {
      id: "pizza-1",
      title: "Margherita Pizza",
      description: "Fresh mozzarella, classic tomato sauce, fresh basil, and extra virgin olive oil.",
      rating: "4.8",
      price: "₹289",
      image: img1,
      isVeg: true,
      category: "Pizza",
    },
    {
      id: "pizza-2",
      title: "Pepperoni & Cheese Pizza",
      description: "Thick cut pepperoni slices, mozzarella cheese, and rich marinara sauce with oregano.",
      rating: "4.8",
      price: "₹349",
      image: img2,
      isVeg: false,
      category: "Pizza",
    },
    {
      id: "pizza-3",
      title: "Smoky BBQ Paneer Woodfire",
      description: "Charred marinated paneer cubes, crisp red onions, bell peppers and smokey chipotle drizzle.",
      rating: "4.8",
      price: "₹329",
      image: img4,
      isVeg: true,
      category: "Pizza",
    },
    {
      id: "pizza-4",
      title: "Rustic Farmhouse Gourmet Pizza",
      description: "Wild mushrooms, baby spinach, roasted garlic, black olives and sun-dried tomatoes.",
      rating: "4.7",
      price: "₹369",
      image: img5,
      isVeg: true,
      category: "Pizza",
    },
    {
      id: "pizza-5",
      title: "Spinach & Ricotta Artisan Pizza",
      description: "Creamy ricotta florets, wilted baby spinach, garlic confit on a sourdough base.",
      rating: "4.9",
      price: "₹359",
      image: img6,
      isVeg: true,
      category: "Pizza",
    },

    // 2. Sides
    {
      id: "side-1",
      title: "Garlic Herb Cheesy Breadsticks",
      description: "Fresh dough baked with parmesan crust and melted mozzarella center with garlic dip.",
      rating: "4.8",
      price: "₹159",
      image: img3,
      isVeg: true,
      category: "Sides",
    },
    {
      id: "side-2",
      title: "Crispy Mozzarella Bites",
      description: "Golden fried Italian mozzarella balls served with warm marinara dipping sauce.",
      rating: "4.7",
      price: "₹179",
      image: streetFoodImg,
      isVeg: true,
      category: "Sides",
    },
    {
      id: "side-3",
      title: "Loaded Herb Potato Wedges",
      description: "Crispy seasoned golden potato wedges with smoked paprika and sour cream garlic dip.",
      rating: "4.6",
      price: "₹139",
      image: comfortFoodImg,
      isVeg: true,
      category: "Sides",
    },

    // 3. Drinks
    {
      id: "drink-1",
      title: "Classic Cold Coffee",
      description: "Freshly brewed espresso whipped with creamy chilled milk and Belgian cocoa dust.",
      rating: "4.9",
      price: "₹119",
      image: comfortFoodImg,
      isVeg: true,
      category: "Drinks",
    },
    {
      id: "drink-2",
      title: "Fresh Mint Mojito Fizz",
      description: "Crushed fresh mint leaves, lime wedges, cane sugar syrup and chilled sparkling soda.",
      rating: "4.8",
      price: "₹99",
      image: saladImg,
      isVeg: true,
      category: "Drinks",
    },
    {
      id: "drink-3",
      title: "Iced Lemon & Berry Tea",
      description: "Chilled black tea with fresh lemon slices, sweet berry infusion and crushed ice.",
      rating: "4.7",
      price: "₹89",
      image: streetFoodImg,
      isVeg: true,
      category: "Drinks",
    },

    // 4. Desserts
    {
      id: "dessert-1",
      title: "Belgian Molten Lava Cake",
      description: "Warm chocolate sponge with a rich, oozing liquid dark chocolate center.",
      rating: "4.9",
      price: "₹179",
      image: lavaCakeImg,
      isVeg: true,
      category: "Desserts",
    },
    {
      id: "dessert-2",
      title: "Classic Italian Tiramisu Jar",
      description: "Espresso-soaked ladyfinger cookies layered with velvety mascarpone cheese.",
      rating: "4.8",
      price: "₹199",
      image: pancakeImg,
      isVeg: true,
      category: "Desserts",
    },
    {
      id: "dessert-3",
      title: "Warm Fudgy Walnut Brownie",
      description: "Decadent dark chocolate fudge brownie topped with hot Belgian chocolate sauce.",
      rating: "4.8",
      price: "₹149",
      image: lavaCakeImg,
      isVeg: true,
      category: "Desserts",
    },
  ];

  // Base items from kitchenData or default menu
  const baseItems: FoodCardItem[] =
    kitchenData.items && kitchenData.items.length > 0 && kitchenData.items[0]?.category !== "Thali"
      ? kitchenData.items
      : defaultMenuItems;

  // Filter items by category (if "Popular", show top items from each category or all items) and isVegOnly
  const itemsToDisplay = baseItems.filter((item) => {
    const matchesVeg = !isVegOnly || item.isVeg !== false;
    const matchesCategory =
      activeCategory === "Popular" ||
      (item.category && item.category.toLowerCase() === activeCategory.toLowerCase());
    return matchesVeg && matchesCategory;
  });

  // Fallback if category has no items after filtering
  const finalDisplayItems = itemsToDisplay.length > 0
    ? itemsToDisplay
    : baseItems.filter((item) => !isVegOnly || item.isVeg !== false);

  const getSectionTitle = () => {
    switch (activeCategory) {
      case "Popular":
        return "Popular Pizzas & Sides";
      case "Pizza":
        return "Pizzas";
      case "Sides":
        return "Sides & Appetizers";
      case "Drinks":
        return "Beverages & Drinks";
      case "Desserts":
        return "Desserts & Sweets";
      default:
        return activeCategory;
    }
  };


  const plans = [
    {
      id: "basic",
      name: "Basic",
      meals: "(3 meals/wk • Lunch)",
      price: "₹299",
      period: "/week",
      features: [
        { label: "3 meals/week", icon: "shield" },
        { label: "Lunch only delivery", icon: "check" },
        { label: "Standard dispatch timings", icon: "check" },
      ],
    },
    {
      id: "silver",
      name: "Silver",
      meals: "(5 meals/wk • Lunch/Dinner)",
      price: "₹499",
      period: "/week",
      features: [
        { label: "5 meals/week", icon: "shield" },
        { label: "Lunch & Dinner delivery choices", icon: "check" },
        { label: "Priority dispatch timings", icon: "check" },
      ],
    },
    {
      id: "premium",
      name: "Premium Plan",
      badge: "BEST",
      meals: "(7 meals/wk • Customised)",
      price: "₹759",
      period: "/week",
      features: [
        { label: "7 meals/week", icon: "shield" },
        { label: "All meals included (Lunch & Dinner)", icon: "check" },
        { label: "Diet customization & weekly chef consults", icon: "check" },
      ],
    },
  ];

  const totalCartCount = cartItems.reduce((acc, ci) => acc + ci.quantity, 0);
  const totalCartPrice = cartTotal;

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
          <div
            className={styles.couponPill}
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.clipboard) {
                navigator.clipboard.writeText("CRUST30");
              }
              setCouponCopied(true);
              setTimeout(() => setCouponCopied(false), 2500);
            }}
            title="Click to copy coupon code"
            style={{ cursor: "pointer" }}
          >
            <Tag size={13} className={styles.couponIcon} />
            <span>
              {couponCopied ? "✓ Code CRUST30 Applied! (30% OFF)" : "30% OFF up to ₹150 • Code: CRUST30"}
            </span>
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

          {/* Flexible Plans Notice Banner */}
          <div className={styles.flexiblePlansBanner}>
            <strong>Flexible Plans</strong> - Pause or cancel anytime. Choose to pause for 1 or 2 weeks. No cancellation fees.
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
                  onClick={() => setSelectedPlanId(isSelected ? "" : plan.id)}
                >
                  <div className={styles.planHeaderRow}>
                    <div className={styles.planLeft}>
                      <span className={styles.planName}>{plan.name}</span>
                      {plan.badge && (
                        <span className={styles.planBestBadge}>{plan.badge}</span>
                      )}
                      {!isSelected && (
                        <span className={styles.planMeals}>{plan.meals}</span>
                      )}
                    </div>
                    <div className={styles.planRight}>
                      <span className={styles.planPrice}>{plan.price}</span>
                      <span className={styles.planPeriod}>{plan.period}</span>
                      {isSelected ? (
                        <ChevronUp size={16} className={styles.planChevron} />
                      ) : (
                        <ChevronDown size={16} className={styles.planChevron} />
                      )}
                    </div>
                  </div>

                  {/* Expanded Plan Details when selected */}
                  {isSelected && (
                    <div className={styles.planDetailsBody}>
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className={styles.planFeatureItem}>
                          {feat.icon === "shield" ? (
                            <Shield size={13} className={styles.planFeatureIcon} />
                          ) : (
                            <Check size={13} className={styles.planFeatureIcon} />
                          )}
                          <span>{feat.label}</span>
                        </div>
                      ))}

                      <button
                        type="button"
                        className={styles.planSubscribeBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push("/dashboard/user/checkout");
                        }}
                      >
                        Subscribe Now
                      </button>
                    </div>
                  )}
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

        {/* 5. Food Items List */}
        <div className={styles.foodSection}>
          <h2 className={styles.foodSectionTitle}>{getSectionTitle()}</h2>

          <div className={styles.foodList}>
            {finalDisplayItems.map((item) => {
              const quantity = getItemQuantity(item.id);
              const hasQuantity = quantity > 0;

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
        </div>
      </div>

      {/* 6. Floating Cart & Checkout Bar */}
      {totalCartCount > 0 && (
        <div className={styles.floatingCartBar}>
          <div className={styles.cartIndicatorHandle} />
          <div className={styles.cartLeftSection}>
            <div className={styles.cartThumbnailsGroup}>
              <Image src={img1} alt="Food item" width={32} height={32} className={styles.cartMiniThumb} />
              <Image src={img2} alt="Food item" width={32} height={32} className={styles.cartMiniThumb} />
              <Image src={img3} alt="Food item" width={32} height={32} className={styles.cartMiniThumb} />
            </div>
            <div className={styles.cartTrolleyWrapper}>
              <ShoppingCart size={20} />
              <span className={styles.cartCountPill}>{totalCartCount}</span>
            </div>
          </div>
          <button
            type="button"
            className={styles.cartPayBtn}
            onClick={() => router.push("/dashboard/user/checkout")}
          >
            <span>Pay ₹{totalCartPrice || 547}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default RestaurantMobileView;
