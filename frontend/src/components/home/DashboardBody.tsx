"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Star, Minus, Plus, Check } from "lucide-react";
import { DietaryTag } from "@/components/common/DietaryTag";
import { useCart, generateCartItemId, AddonItem } from "@/context/CartContext";
import { AddonCustomizationModal } from "@/components/cart/AddonCustomizationModal";

export interface TopRatedItem {
  id: string;
  foodItemId?: string;
  name: string;
  rating: number;
  category: string;
  price: number;
  time: string;
  imageUrl: string;
  link?: string;
  itemType?: string;
  distanceText?: string;
  sellerId?: string;
  sellerName?: string;
  sellerIsOnline?: boolean;
  isAvailable?: boolean;
  stockQuantity?: number;
  maxStock?: number;
  description?: string;
  addons?: any;
  variants?: any;
}

interface DashboardBodyProps {
  title?: string;
  seeAllLink?: string;
  items?: TopRatedItem[];
}

export default function DashboardBody({
  title = "Top Rated",
  seeAllLink = "/food-explore?sort=rating",
  items,
}: DashboardBodyProps) {
  const { addToCart, cartItems, updateQuantity, removeFromCart, showToast } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);
  const [customizingItem, setCustomizingItem] = useState<TopRatedItem | null>(null);

  if (!items || items.length === 0) {
    return null;
  }

  const parseItemAddons = (item: TopRatedItem): AddonItem[] => {
    const raw = item.addons || item.variants;
    if (!raw) return [];
    try {
      const list = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (Array.isArray(list)) {
        return list
          .filter((a: any) => a && (a.name || "").trim())
          .map((a: any, idx: number) => ({
            id: String(a.id || `addon_${idx + 1}`),
            name: String(a.name || "").trim(),
            price: Math.max(0, typeof a.price === "number" ? a.price : parseFloat(a.price) || 0),
          }));
      }
    } catch {}
    return [];
  };

  const getCartQuantityForDish = (item: TopRatedItem) => {
    const baseId = item.foodItemId || item.id;
    return cartItems
      .filter((ci) => ci.id === item.id || ci.foodItemId === baseId || ci.id === baseId || ci.id.startsWith(baseId + "_"))
      .reduce((sum, ci) => sum + (ci.quantity || 0), 0);
  };

  const getPrimaryCartItemForDish = (item: TopRatedItem) => {
    const baseId = item.foodItemId || item.id;
    return cartItems.find((ci) => ci.id === item.id || ci.foodItemId === baseId || ci.id === baseId || ci.id.startsWith(baseId + "_"));
  };

  const handleOrderClick = (item: TopRatedItem) => {
    if (item.sellerIsOnline === false) {
      showToast(`Sorry, "${item.sellerName || "This kitchen"}" is currently closed and not accepting orders.`, "warning");
      return;
    }
    if (item.isAvailable === false) {
      showToast(`Sorry, "${item.name}" is currently unavailable.`, "warning");
      return;
    }

    const rawStock = item.maxStock !== undefined ? item.maxStock : item.stockQuantity;
    const stockLimit = rawStock !== undefined && rawStock !== null && !isNaN(Number(rawStock)) ? Number(rawStock) : -1;

    if (stockLimit === 0) {
      showToast(`Sorry, "${item.name}" is currently out of stock.`, "warning");
      return;
    }

    const currentQty = getCartQuantityForDish(item);
    if (stockLimit !== -1 && currentQty >= stockLimit) {
      showToast(`We have only ${stockLimit} left in stock.`, "warning");
      return;
    }

    const parsedAddons = parseItemAddons(item);
    if (parsedAddons.length > 0) {
      setCustomizingItem(item);
      return;
    }

    const baseFoodId = item.foodItemId || item.id;
    addToCart({
      id: baseFoodId,
      foodItemId: baseFoodId,
      name: item.name,
      price: item.price || 0,
      basePrice: item.price || 0,
      quantity: 1,
      sellerId: item.sellerId || "k-1",
      sellerName: item.sellerName || "Verified Cloud Kitchen",
      image: item.imageUrl,
      imageUrl: item.imageUrl,
      stockQuantity: stockLimit,
      maxStock: stockLimit,
      itemType: item.itemType,
      addons: item.addons,
    }, false, () => {
      setAddedId(item.id);
      setTimeout(() => {
        setAddedId(null);
      }, 1200);
    });
  };

  const handleIncrement = (item: TopRatedItem) => {
    if (item.sellerIsOnline === false) {
      showToast(`Sorry, "${item.sellerName || "This kitchen"}" is currently closed and not accepting orders.`, "warning");
      return;
    }
    const rawStock = item.maxStock !== undefined ? item.maxStock : item.stockQuantity;
    const stockLimit = rawStock !== undefined && rawStock !== null && !isNaN(Number(rawStock)) ? Number(rawStock) : -1;
    const currentQty = getCartQuantityForDish(item);

    if (stockLimit !== -1 && currentQty >= stockLimit) {
      showToast(`We have only ${stockLimit} left in stock.`, "warning");
      return;
    }

    const parsedAddons = parseItemAddons(item);
    if (parsedAddons.length > 0) {
      setCustomizingItem(item);
      return;
    }

    const baseFoodId = item.foodItemId || item.id;
    const matchingCartItem = getPrimaryCartItemForDish(item);
    if (matchingCartItem) {
      updateQuantity(matchingCartItem.id, matchingCartItem.quantity + 1);
    } else {
      addToCart({
        id: baseFoodId,
        foodItemId: baseFoodId,
        name: item.name,
        price: item.price || 0,
        basePrice: item.price || 0,
        quantity: 1,
        sellerId: item.sellerId || "k-1",
        sellerName: item.sellerName || "Verified Cloud Kitchen",
        image: item.imageUrl,
        imageUrl: item.imageUrl,
        stockQuantity: stockLimit,
        maxStock: stockLimit,
        itemType: item.itemType,
        addons: item.addons,
      }, false, () => {
        setAddedId(item.id);
        setTimeout(() => {
          setAddedId(null);
        }, 1200);
      });
    }
  };

  const handleDecrement = (item: TopRatedItem) => {
    const baseId = item.foodItemId || item.id;
    const matchingItems = cartItems.filter((ci) => ci.id === item.id || ci.foodItemId === baseId || ci.id === baseId || ci.id.startsWith(baseId + "_"));
    if (matchingItems.length === 0) return;

    const target = matchingItems[matchingItems.length - 1];
    if (target.quantity > 1) {
      updateQuantity(target.id, target.quantity - 1);
    } else {
      removeFromCart(target.id);
    }
  };

  const handleCustomizationConfirm = (selectedAddons: AddonItem[], quantity: number = 1) => {
    if (!customizingItem) return;
    const item = customizingItem;
    const base = Number(item.price) || 0;
    const addonsTotal = selectedAddons.reduce((sum, a) => sum + (a.price || 0), 0);
    const unitPrice = base + addonsTotal;
    const rawStock = item.maxStock !== undefined ? item.maxStock : item.stockQuantity;
    const stockLimit = rawStock !== undefined && rawStock !== null && !isNaN(Number(rawStock)) ? Number(rawStock) : -1;
    const baseFoodId = item.foodItemId || item.id;
    const cartItemId = generateCartItemId(baseFoodId, selectedAddons);
    const savedItemId = item.id;

    setCustomizingItem(null);

    addToCart({
      id: cartItemId,
      foodItemId: baseFoodId,
      name: item.name,
      price: unitPrice,
      basePrice: base,
      addonsTotal: addonsTotal,
      selectedAddons: selectedAddons,
      quantity: quantity || 1,
      sellerId: item.sellerId || "k-1",
      sellerName: item.sellerName || "Verified Cloud Kitchen",
      image: item.imageUrl,
      imageUrl: item.imageUrl,
      stockQuantity: stockLimit,
      maxStock: stockLimit,
      itemType: item.itemType,
      addons: item.addons,
    }, false, () => {
      setAddedId(savedItemId);
      setTimeout(() => {
        setAddedId(null);
      }, 1200);
    });
  };

  const displayItems = items;

  return (
    <section
      style={{
        width: "100%",
        background: "transparent",
        padding: "0",
        boxSizing: "border-box",
        marginBottom: "24px",
      }}
      aria-label={title}
    >
      {/* Outer Card Wrapper */}
      <div
        style={{
          width: "100%",
          backgroundColor: "#FDFDFD",
          borderRadius: "24px",
          border: "1px solid #EFEFEF",
          boxShadow: "0 6px 24px rgba(0, 0, 0, 0.03)",
          padding: "24px 28px",
          boxSizing: "border-box",
        }}
        className="top-rated-container-card"
      >
        {/* Section Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              fontSize: "1.45rem",
              fontWeight: "800",
              color: "#18181B",
              margin: 0,
            }}
            className="top-rated-title"
          >
            {title}
          </h2>

          <Link
            href={seeAllLink}
            style={{
              color: "#FF6B00",
              fontSize: "0.95rem",
              fontWeight: "700",
              textDecoration: "none",
              transition: "color 0.2s ease",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            See all
          </Link>
        </div>

        {/* 2x3 Grid Layout (Desktop) / 1-col (Mobile) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            columnGap: "24px",
            rowGap: "16px",
            width: "100%",
          }}
          className="top-rated-grid"
        >
          {displayItems.slice(0, 6).map((item) => {
            const isSellerClosed = item.sellerIsOnline === false;
            const isOutOfStock = item.stockQuantity === 0 || item.maxStock === 0 || item.isAvailable === false;
            const isClosed = isSellerClosed || isOutOfStock;
            const currentInCartQty = getCartQuantityForDish(item);
            const rawStock = item.maxStock !== undefined ? item.maxStock : item.stockQuantity;
            const stockLimit = rawStock !== undefined && rawStock !== null && !isNaN(Number(rawStock)) ? Number(rawStock) : -1;
            const isMaxStockInCart = !isClosed && stockLimit !== -1 && currentInCartQty >= stockLimit;

            return (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: isClosed ? "#F8FAFC" : "#FFFFFF",
                borderRadius: "16px",
                padding: "12px 16px",
                border: isClosed ? "1.5px solid #E2E8F0" : "1px solid #F1F5F9",
                boxShadow: isClosed ? "0 2px 6px rgba(0, 0, 0, 0.02)" : "0 2px 8px rgba(0, 0, 0, 0.02)",
                boxSizing: "border-box",
                transition: "all 0.2s ease",
                gap: "12px",
                opacity: isClosed ? 0.75 : 1,
              }}
              className="top-rated-card"
            >
              {/* Left Column: Image + Info */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  minWidth: 0,
                  flex: 1,
                }}
              >
                {/* Food Image */}
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "14px",
                    overflow: "hidden",
                    flexShrink: 0,
                    backgroundColor: "#F8FAFC",
                    position: "relative",
                  }}
                  className="top-rated-thumb"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      filter: isClosed ? "grayscale(80%)" : "none",
                    }}
                  />
                </div>

                {/* Name, Rating & Subtitle */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    minWidth: 0,
                  }}
                >
                  {/* Name + Star Rating Row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: "700",
                        color: isClosed ? "#64748B" : "#18181B",
                        margin: 0,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      className="top-rated-name"
                    >
                      {item.name}
                    </h3>
                    <DietaryTag
                      itemType={
                        item.itemType ||
                        (item.name.toLowerCase().includes("chicken") ||
                        (item.name.toLowerCase().includes("burger") &&
                          !item.name.toLowerCase().includes("veg"))
                          ? "NON_VEG"
                          : "VEG")
                      }
                      size="xs"
                    />
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                      }}
                    >
                      <Star size={13} fill={isClosed ? "#94A3B8" : "#F59E0B"} color={isClosed ? "#94A3B8" : "#F59E0B"} />
                      <span
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: "700",
                          color: isClosed ? "#94A3B8" : "#18181B",
                        }}
                      >
                        {item.rating}
                      </span>
                    </div>
                  </div>

                  {/* Category • Price • Time Subtitle */}
                  <span
                    style={{
                      fontSize: "0.78rem",
                      color: "#64748B",
                      fontWeight: "500",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.category} • ₹{item.price} {item.distanceText ? `• 📍 ${item.distanceText}` : ""} • {item.time}
                  </span>

                  {/* Stock Notice */}
                  {isOutOfStock ? (
                    <span style={{ fontSize: "0.75rem", color: "#DC2626", fontWeight: "700" }}>
                      Out of stock
                    </span>
                  ) : isMaxStockInCart ? (
                    <span style={{ fontSize: "0.74rem", color: "#EA580C", fontWeight: "700" }}>
                      We have only {stockLimit} left in stock
                    </span>
                  ) : stockLimit > 0 && stockLimit <= 5 ? (
                    <span style={{ fontSize: "0.74rem", color: "#EA580C", fontWeight: "700" }}>
                      Only {stockLimit} left
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Right Column: Order / Added / Stepper Button */}
              {(() => {
                if (isClosed) {
                  return (
                    <button
                      type="button"
                      disabled
                      style={{
                        backgroundColor: "#F1F5F9",
                        color: "#94A3B8",
                        fontSize: "0.82rem",
                        fontWeight: "700",
                        padding: "6px 14px",
                        borderRadius: "9999px",
                        border: "1px solid #CBD5E1",
                        cursor: "not-allowed",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                      className="top-rated-order-btn-closed"
                      title={isSellerClosed ? "Kitchen closed" : isOutOfStock ? "Out of stock" : "Unavailable"}
                    >
                      {isSellerClosed ? "Closed" : isOutOfStock ? "Out of Stock" : "Unavailable"}
                    </button>
                  );
                }

                if (addedId === item.id) {
                  return (
                    <button
                      type="button"
                      style={{
                        backgroundColor: "#10B981",
                        color: "#FFFFFF",
                        fontSize: "0.82rem",
                        fontWeight: "700",
                        padding: "6px 16px",
                        borderRadius: "9999px",
                        border: "none",
                        cursor: "default",
                        boxShadow: "0 3px 10px rgba(16, 185, 129, 0.28)",
                        transition: "all 0.2s ease",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Check size={13} strokeWidth={3} />
                      Added!
                    </button>
                  );
                }

                if (currentInCartQty > 0) {
                  return (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        backgroundColor: "#FFF7ED",
                        border: "1.5px solid #FF6B00",
                        borderRadius: "9999px",
                        overflow: "hidden",
                        boxShadow: "0 2px 8px rgba(255, 107, 0, 0.15)",
                        flexShrink: 0,
                        height: "32px",
                        boxSizing: "border-box",
                      }}
                      role="group"
                      aria-label={`Quantity controls for ${item.name}`}
                    >
                      <button
                        type="button"
                        onClick={() => handleDecrement(item)}
                        aria-label="Decrease quantity"
                        style={{
                          width: "28px",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "transparent",
                          border: "none",
                          color: "#FF6B00",
                          cursor: "pointer",
                          fontWeight: "800",
                          padding: 0,
                          transition: "all 0.15s ease",
                        }}
                        className="top-rated-stepper-btn"
                      >
                        <Minus size={13} strokeWidth={3} />
                      </button>

                      <span
                        style={{
                          minWidth: "20px",
                          padding: "0 4px",
                          textAlign: "center",
                          fontSize: "0.85rem",
                          fontWeight: "800",
                          color: "#FF6B00",
                          userSelect: "none",
                        }}
                      >
                        {currentInCartQty}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleIncrement(item)}
                        aria-label="Increase quantity"
                        disabled={isMaxStockInCart}
                        style={{
                          width: "28px",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "transparent",
                          border: "none",
                          color: isMaxStockInCart ? "#CBD5E1" : "#FF6B00",
                          cursor: isMaxStockInCart ? "not-allowed" : "pointer",
                          fontWeight: "800",
                          padding: 0,
                          transition: "all 0.15s ease",
                          opacity: isMaxStockInCart ? 0.4 : 1,
                        }}
                        className="top-rated-stepper-btn"
                      >
                        <Plus size={13} strokeWidth={3} />
                      </button>
                    </div>
                  );
                }

                return (
                  <button
                    type="button"
                    onClick={() => handleOrderClick(item)}
                    style={{
                      backgroundColor: "#FF6B00",
                      color: "#FFFFFF",
                      fontSize: "0.82rem",
                      fontWeight: "700",
                      padding: "6px 18px",
                      borderRadius: "9999px",
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 3px 10px rgba(255, 107, 0, 0.25)",
                      transition: "all 0.2s ease",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                    className="top-rated-order-btn"
                  >
                    Order
                  </button>
                );
              })()}
            </div>
            );
          })}
        </div>
      </div>

      {/* Add-on Customization Modal */}
      {customizingItem && (
        <AddonCustomizationModal
          isOpen={!!customizingItem}
          onClose={() => setCustomizingItem(null)}
          item={{
            id: customizingItem.id,
            name: customizingItem.name,
            price: customizingItem.price,
            basePrice: customizingItem.price,
            description: customizingItem.description,
            imageUrl: customizingItem.imageUrl,
            itemType: customizingItem.itemType,
            isVeg: customizingItem.itemType === "VEG" || !customizingItem.name.toLowerCase().includes("chicken"),
            addons: parseItemAddons(customizingItem),
          }}
          onAddToCart={handleCustomizationConfirm}
        />
      )}

      <style jsx>{`
        .top-rated-card:hover {
          border-color: #CBD5E1;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
          transform: translateY(-2px);
        }
        .top-rated-order-btn:hover {
          background-color: #E65F00;
          transform: scale(1.03);
        }
        .top-rated-stepper-btn:hover:not(:disabled) {
          background-color: #FF6B00 !important;
          color: #FFFFFF !important;
        }
        @media (max-width: 1024px) {
          .top-rated-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 768px) {
          .top-rated-card:nth-child(n+3) {
            display: none !important;
          }
        }
        @media (max-width: 640px) {
          .top-rated-card {
            padding: 8px 10px !important;
            gap: 8px !important;
            min-height: 74px !important;
          }
          .top-rated-thumb {
            width: 52px !important;
            height: 52px !important;
            min-width: 52px !important;
          }
          .top-rated-name {
            font-size: 0.86rem !important;
          }
          .top-rated-order-btn {
            padding: 5px 12px !important;
            font-size: 0.76rem !important;
          }
        }
      `}</style>
    </section>
  );
}

