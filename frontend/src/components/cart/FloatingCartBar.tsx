"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { ShoppingBag, ArrowRight, Sparkles, ChefHat } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function FloatingCartBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { cartItems, cartTotal } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Total items and price
  const totalCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const totalPrice = cartTotal || cartItems.reduce((acc, item) => acc + item.price * (item.quantity || 1), 0);
  const sellerName = cartItems[0]?.sellerName || "Verified Cloud Kitchen";

  // Filter out items with images for stacked display (up to 3)
  const itemsWithImages = cartItems
    .filter((item) => Boolean(item.image))
    .slice(0, 3);

  // Hidden on specific pages where user is already viewing cart, checking out, or on auth / portal pages
  const isHiddenPage =
    !pathname ||
    // Cart & Checkout routes
    pathname === "/cart" ||
    pathname.startsWith("/cart/") ||
    pathname === "/user/cart" ||
    pathname.startsWith("/user/cart/") ||
    pathname === "/user/user-cart" ||
    pathname.startsWith("/user/user-cart/") ||
    pathname === "/checkout" ||
    pathname.startsWith("/checkout/") ||
    pathname === "/user/checkout" ||
    pathname.startsWith("/user/checkout/") ||
    pathname === "/dashboard/user/checkout" ||
    pathname.startsWith("/dashboard/user/checkout/") ||
    pathname === "/user/user-checkout" ||
    pathname.startsWith("/user/user-checkout/") ||
    pathname.startsWith("/order-confirmation") ||
    pathname.startsWith("/invoice") ||
    // Auth & Login / Register routes
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/signup" ||
    pathname.startsWith("/signup/") ||
    pathname === "/auth" ||
    pathname.startsWith("/auth/") ||
    // Seller / Admin / Delivery / Dashboard portals
    pathname.startsWith("/seller") ||
    pathname.startsWith("/seller-onboarding") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/delivery") ||
    pathname.startsWith("/dashboard");

  if (!mounted || totalCount === 0 || isHiddenPage) {
    return null;
  }

  const handleBarClick = () => {
    router.push("/user/cart");
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "22px",
        left: "0",
        right: "0",
        margin: "0 auto",
        width: "100%",
        maxWidth: "880px",
        padding: "0 16px",
        zIndex: 999999,
        pointerEvents: "none",
        boxSizing: "border-box",
        animation: "cartPopUp 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      }}
    >
      <div
        onClick={handleBarClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleBarClick();
          }
        }}
        className="floating-cart-strip-inner"
        style={{
          pointerEvents: "auto",
          width: "100%",
          background: "linear-gradient(135deg, #FF5500 0%, #FF6B00 45%, #EA580C 100%)",
          border: "1.5px solid rgba(255, 255, 255, 0.35)",
          borderRadius: "22px",
          padding: "12px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
          color: "#FFFFFF",
          boxShadow: "0 16px 40px -6px rgba(234, 88, 12, 0.55), 0 6px 18px rgba(0, 0, 0, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.4)",
          cursor: "pointer",
          userSelect: "none",
          position: "relative",
          overflow: "hidden",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          transition: "all 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
          boxSizing: "border-box",
        }}
      >
        {/* Animated Light Sweep Effect */}
        <div className="cart-shimmer-sweep" />

        {/* Left Section: Food Thumbnails or Icon + Item Count + Price + Kitchen */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0, flex: 1, zIndex: 2 }}>
          {itemsWithImages.length > 0 ? (
            <div style={{ display: "flex", alignItems: "center", position: "relative", flexShrink: 0 }}>
              {itemsWithImages.map((it, idx) => (
                <div
                  key={it.id || idx}
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    border: "2px solid #FFFFFF",
                    backgroundColor: "#FFEADB",
                    marginLeft: idx === 0 ? "0px" : "-14px",
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
                    zIndex: 3 - idx,
                    flexShrink: 0,
                  }}
                >
                  <Image
                    src={it.image || "/images/places/place-biryani.png"}
                    alt={it.name || "Food item"}
                    fill
                    sizes="44px"
                    style={{ objectFit: "cover" }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "14px",
                backgroundColor: "rgba(255, 255, 255, 0.22)",
                backdropFilter: "blur(8px)",
                border: "1.5px solid rgba(255, 255, 255, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                flexShrink: 0,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              }}
            >
              <ShoppingBag size={22} strokeWidth={2.4} />
            </div>
          )}

          {/* Texts info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  backgroundColor: "rgba(0, 0, 0, 0.22)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  color: "#FFFFFF",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  textTransform: "uppercase",
                }}
              >
                {totalCount} {totalCount === 1 ? "ITEM" : "ITEMS"}
              </span>
              <span style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.8rem" }}>•</span>
              <span
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: "#FFFFFF",
                  letterSpacing: "-0.02em",
                  textShadow: "0 2px 4px rgba(0, 0, 0, 0.15)",
                }}
              >
                ₹{totalPrice.toLocaleString("en-IN")}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
              <ChefHat size={13} color="#FFF1E6" />
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#FFF1E6",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  margin: 0,
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.12)",
                }}
                title={`From ${sellerName}`}
              >
                From {sellerName}
              </p>
              <span style={{ color: "#FEF08A", fontSize: "0.65rem" }}>●</span>
              <span
                style={{
                  fontSize: "0.74rem",
                  color: "#FEF08A",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
                className="cart-perk-text"
              >
                Freshly Prepared
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: View Cart Action Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, zIndex: 2 }}>
          <button
            type="button"
            className="cart-view-btn"
            onClick={handleBarClick}
            aria-label="View Cart and Proceed to Order"
            style={{
              backgroundColor: "#FFFFFF",
              color: "#EA580C",
              border: "none",
              padding: "11px 22px",
              borderRadius: "14px",
              fontSize: "0.95rem",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
              transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
              letterSpacing: "-0.01em",
            }}
          >
            <span>View Cart</span>
            <span className="cart-arrow-icon" style={{ display: "flex", alignItems: "center" }}>
              <ArrowRight size={17} strokeWidth={2.8} />
            </span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .floating-cart-strip-inner:hover {
          transform: translateY(-3px);
          box-shadow: 0 20px 48px -4px rgba(234, 88, 12, 0.65), 0 8px 22px rgba(0, 0, 0, 0.16), inset 0 1px 1px rgba(255, 255, 255, 0.5) !important;
        }
        .cart-view-btn:hover {
          background-color: #FFFBF7 !important;
          color: #FF5500 !important;
          transform: scale(1.04) !important;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.22) !important;
        }
        .cart-view-btn:hover .cart-arrow-icon {
          transform: translateX(4px);
        }
        .cart-arrow-icon {
          transition: transform 0.2s ease;
        }
        .cart-shimmer-sweep {
          position: absolute;
          top: 0;
          left: -120%;
          width: 60%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.22),
            transparent
          );
          transform: skewX(-25deg);
          animation: cartShimmer 4s infinite ease-in-out;
          pointer-events: none;
        }
        @keyframes cartPopUp {
          0% {
            opacity: 0;
            transform: translateY(40px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes cartShimmer {
          0% {
            left: -120%;
          }
          30% {
            left: 200%;
          }
          100% {
            left: 200%;
          }
        }
        @media (max-width: 640px) {
          .floating-cart-strip-inner {
            padding: 10px 14px !important;
            border-radius: 16px !important;
            gap: 10px !important;
          }
          .cart-perk-text {
            display: none !important;
          }
          .cart-view-btn {
            padding: 9px 14px !important;
            font-size: 0.85rem !important;
            border-radius: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
