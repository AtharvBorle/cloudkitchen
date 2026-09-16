"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import styles from "./FloatingCartBar.module.css";

export default function FloatingCartBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { cartItems, cartTotal } = useCart();

  // Total items and price
  const totalCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const totalPrice = cartTotal || cartItems.reduce((acc, item) => acc + item.price * (item.quantity || 1), 0);
  const sellerName = cartItems[0]?.sellerName || "Verified Cloud Kitchen";

  // Filter out items with images for stacked display
  const itemsWithImages = cartItems
    .filter((item) => Boolean(item.image))
    .slice(0, 3);

  // Hidden on specific pages where user is already viewing cart or checking out
  const isHiddenPage =
    !pathname ||
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
    pathname.startsWith("/seller") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard/admin") ||
    pathname.startsWith("/dashboard/seller") ||
    pathname.startsWith("/dashboard/superadmin") ||
    pathname.startsWith("/dashboard/delivery");

  if (totalCount === 0 || isHiddenPage) {
    return null;
  }

  const handleBarClick = () => {
    router.push("/user/cart");
  };

  return (
    <aside
      className={styles.floatingBarContainer}
      aria-label="Floating cart summary"
    >
      <div
        className={styles.floatingBar}
        onClick={handleBarClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleBarClick();
          }
        }}
      >
        {/* Left Section: Thumbnails Stack or Icon + Summary */}
        <div className={styles.leftSection}>
          {itemsWithImages.length > 0 ? (
            <div className={styles.thumbsStack}>
              {itemsWithImages.map((it, idx) => (
                <div
                  key={it.id || idx}
                  className={styles.cartMiniThumb}
                  style={{ zIndex: 3 - idx, position: "relative" }}
                >
                  <Image
                    src={it.image || "/images/places/place-biryani.png"}
                    alt={it.name || "Food item"}
                    fill
                    sizes="44px"
                    style={{ objectFit: "cover", borderRadius: "10px" }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.iconBoxFallback}>
              <ShoppingBag size={20} strokeWidth={2.4} />
            </div>
          )}

          <div className={styles.infoCol}>
            <div className={styles.topRow}>
              <span className={styles.itemCountBadge}>
                {totalCount} {totalCount === 1 ? "ITEM" : "ITEMS"}
              </span>
              <span className={styles.priceDivider}>•</span>
              <span className={styles.priceText}>
                ₹{totalPrice.toLocaleString("en-IN")}
              </span>
            </div>
            <div className={styles.bottomRow}>
              <p className={styles.sellerSubtitle} title={`From ${sellerName}`}>
                From {sellerName}
              </p>
              <span className={styles.perkDot}>●</span>
              <span className={styles.perkText}>Freshly Prepared</span>
            </div>
          </div>
        </div>

        {/* Right Section: View Cart Action */}
        <div className={styles.rightSection}>
          <button
            type="button"
            className={styles.viewCartBtn}
            onClick={handleBarClick}
            aria-label="View Cart and Proceed to Order"
          >
            <span>View Cart</span>
            <span className={styles.arrowIconWrapper}>
              <ArrowRight size={17} strokeWidth={2.6} />
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
