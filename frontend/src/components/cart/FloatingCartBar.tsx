"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingBag, ChevronRight, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import styles from "./FloatingCartBar.module.css";

export default function FloatingCartBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { cartItems, cartTotal } = useCart();
  const [isDismissed, setIsDismissed] = useState(false);
  const [prevCount, setPrevCount] = useState(0);

  // Total item count in cart
  const totalCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const totalPrice = cartTotal || cartItems.reduce((acc, item) => acc + item.price * (item.quantity || 1), 0);
  const sellerName = cartItems[0]?.sellerName || "Verified Cloud Kitchen";

  // Re-open if user adds more items
  useEffect(() => {
    if (totalCount > prevCount) {
      setIsDismissed(false);
    }
    setPrevCount(totalCount);
  }, [totalCount, prevCount]);

  // Determine if on checkout/cart/admin pages where the floating bar should not appear
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

  if (totalCount === 0 || isDismissed || isHiddenPage) {
    return null;
  }

  const handleBarClick = () => {
    router.push("/user/cart");
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
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
        {/* Left Section: Icon + Items Count + Price + Kitchen Name */}
        <div className={styles.leftSection}>
          <div className={styles.iconWrapper}>
            <ShoppingBag size={22} strokeWidth={2.4} />
          </div>

          <div className={styles.infoCol}>
            <div className={styles.topRow}>
              <span className={styles.itemCountBadge}>
                {totalCount} {totalCount === 1 ? "ITEM" : "ITEMS"}
              </span>
              <span className={styles.priceText}>
                ₹{totalPrice.toLocaleString("en-IN")}
              </span>
            </div>
            <p className={styles.sellerSubtitle} title={`From ${sellerName}`}>
              From {sellerName}
            </p>
          </div>
        </div>

        {/* Right Section: "View Cart" CTA + Dismiss button */}
        <div className={styles.rightSection}>
          <button
            type="button"
            className={styles.viewCartBtn}
            onClick={handleBarClick}
            aria-label="View Cart and Proceed"
          >
            <span>View Cart</span>
            <ChevronRight size={17} strokeWidth={2.8} />
          </button>

          <button
            type="button"
            className={styles.dismissBtn}
            onClick={handleDismiss}
            aria-label="Dismiss cart bar"
            title="Dismiss"
          >
            <X size={14} strokeWidth={2.6} />
          </button>
        </div>
      </div>
    </aside>
  );
}
