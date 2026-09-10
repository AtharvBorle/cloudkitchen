"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  Globe,
  ShoppingBag,
  ShoppingCart,
  User,
  Menu,
  X,
  Search,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLocation } from "@/components/location-provider";
import { useSession } from "next-auth/react";
import { MobileSidebar } from "@/components/mobile-sidebar";
import styles from "./Navbar.module.css";
import logoImg from "./logo-nav.png";
import profilePic from "./Rectangle.jpg";

const FILTER_CUISINES = [
  { id: "italian", label: "Italian", count: 12 },
  { id: "american", label: "American", count: 18 },
  { id: "healthy", label: "Healthy / Bowls", count: 8 },
  { id: "japanese", label: "Japanese", count: 6 },
  { id: "indian", label: "Indian / Mughlai", count: 24 },
  { id: "mexican", label: "Mexican", count: 10 },
];

const FILTER_DIETARY = [
  { id: "veg", label: "Vegetarian", count: 15 },
  { id: "vegan", label: "Vegan", count: 4 },
  { id: "gluten-free", label: "Gluten-Free", count: 6 },
  { id: "halal", label: "Halal Certified", count: 11 },
];

const PRICE_TIERS = ["$", "$$", "$$$"];

const DIET_OPTIONS = [
  { id: "all", label: "All" },
  { id: "veg", label: "Veg" },
  { id: "non-veg", label: "Non-Veg" },
  { id: "vegan", label: "Vegan" },
  { id: "jain", label: "Jain" },
];

const LANG_OPTIONS = [
  { id: "hi", label: "Hindi", code: "HI" },
  { id: "mr", label: "Marathi", code: "MR" },
  { id: "en", label: "English", code: "EN" },
];

export const DEFAULT_NAV_ITEMS = [
  "Home",
  "Explore",
  "Orders",
  "Rooms",
  "Settings",
] as const;

export const NAV_ITEM_ROUTES: Record<string, string> = {
  Home: "/",
  Explore: "/explore-desktop",
  Food: "/explore-desktop",
  Orders: "/orders-desktop",
  Rooms: "/room-booking",
  Settings: "/settings-desktop",
  Furniture: "/explore/furniture",
  "Mess/Tiffin": "/explore-desktop",
};

export interface NavbarProps {
  navItems?: readonly string[];
  activeItem?: string;
  initialActiveItem?: string;
  onNavItemClick?: (item: string) => void;
  location?: string;
  cartCount?: number;
  isVegOnly?: boolean;
  onVegToggle?: (isVeg: boolean) => void;
  onCartClick?: () => void;
  onProfileClick?: () => void;
  onLocationClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  navItems = DEFAULT_NAV_ITEMS,
  activeItem: controlledActiveItem,
  initialActiveItem = "Home",
  onNavItemClick,
  location: controlledLocation,
  cartCount: controlledCartCount,
  isVegOnly: controlledVegOnly,
  onVegToggle,
  onCartClick,
  onProfileClick,
  onLocationClick,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { cartItems } = useCart();
  const { defaultAddress } = useLocation();
  const { data: session } = useSession();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [internalActiveItem, setInternalActiveItem] = useState<string>(initialActiveItem);
  const [internalVegOnly, setInternalVegOnly] = useState<boolean>(false);
  const [selectedDiet, setSelectedDiet] = useState<string>("veg");
  const [isDietDropdownOpen, setIsDietDropdownOpen] = useState<boolean>(false);
  const [selectedLang, setSelectedLang] = useState<string>("en");
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState<boolean>(false);

  // Derive active item from current route if not explicitly controlled
  const getActiveItemFromPath = (): string => {
    if (controlledActiveItem !== undefined) return controlledActiveItem;
    if (pathname === "/") return "Home";
    if (pathname.startsWith("/explore-desktop")) {
      return navItems.includes("Food") ? "Food" : "Explore";
    }
    if (pathname.startsWith("/room-booking")) {
      return "Rooms";
    }
    if (pathname.startsWith("/explore/furniture")) {
      return "Furniture";
    }
    if (pathname.startsWith("/orders-desktop") || pathname.startsWith("/order-history") || pathname.startsWith("/dashboard/user/orders")) {
      return "Orders";
    }
    if (
      pathname.startsWith("/settings-desktop") ||
      pathname.startsWith("/my-subscription") ||
      pathname.startsWith("/notifications-desktop") ||
      pathname.startsWith("/payment-methods-desktop") ||
      pathname.startsWith("/delivery-addresses-desktop")
    ) {
      return "Settings";
    }
    if (pathname.startsWith("/dashboard")) {
      return "Orders";
    }
    return internalActiveItem;
  };

  const currentActiveItem = getActiveItemFromPath();

  // Cart count: use controlled count if provided, otherwise compute from live cartItems
  const liveCartCount = cartItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;
  const currentCartCount = controlledCartCount !== undefined ? controlledCartCount : liveCartCount;

  // Location string: use controlled prop if provided, otherwise use LocationProvider
  const displayLocation = controlledLocation || (
    defaultAddress?.locality || defaultAddress?.city
      ? `${defaultAddress.locality ? defaultAddress.locality + ", " : ""}${defaultAddress.city || defaultAddress.pincode}`
      : defaultAddress?.pincode
        ? `PIN: ${defaultAddress.pincode}`
        : "Kothrud, Pune"
  );

  const currentVegOnly = controlledVegOnly !== undefined ? controlledVegOnly : internalVegOnly;

  const handleNavClick = (item: string) => {
    setInternalActiveItem(item);
    setIsMobileMenuOpen(false);
    if (onNavItemClick) {
      onNavItemClick(item);
    } else {
      const targetRoute = NAV_ITEM_ROUTES[item] || `/${item.toLowerCase()}`;
      router.push(targetRoute);
    }
  };

  const toggleVegOnly = () => {
    const nextState = !currentVegOnly;
    setInternalVegOnly(nextState);
    if (onVegToggle) {
      onVegToggle(nextState);
    }
  };

  const handleCartClick = () => {
    if (onCartClick) {
      onCartClick();
    } else {
      router.push("/user/cart");
    }
  };

  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick();
    } else if (session?.user) {
      const role = (session.user as any)?.role;
      if (role === "SELLER") {
        router.push("/dashboard/seller");
      } else if (role === "ADMIN" || role === "SUPERADMIN") {
        router.push("/dashboard/admin");
      } else {
        router.push("/settings-desktop");
      }
    } else {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname || "/")}`);
    }
  };

  const handleLocationClick = () => {
    if (onLocationClick) {
      onLocationClick();
    }
  };

  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<"cuisines" | "dietary" | "price">("cuisines");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([
    "italian",
    "american",
    "healthy",
  ]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<string>("$");

  const toggleCuisine = (id: string) => {
    setSelectedCuisines((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleDietary = (id: string) => {
    setSelectedDietary((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePriceSelect = (tier: string) => {
    setSelectedPrice((prev) => (prev === tier ? "" : tier));
  };

  const handleClearFilters = () => {
    setSelectedCuisines([]);
    setSelectedDietary([]);
    setSelectedPrice("");
  };

  const handleApplyFilters = () => {
    setIsFilterModalOpen(false);
    const params = new URLSearchParams();
    if (selectedCuisines.length > 0) params.set("cuisines", selectedCuisines.join(","));
    if (selectedDietary.length > 0) params.set("dietary", selectedDietary.join(","));
    if (selectedPrice) params.set("price", selectedPrice);
    if (mobileSearchQuery.trim()) params.set("query", mobileSearchQuery.trim());
    router.push(`/explore-desktop?${params.toString()}`);
  };

  const activeFiltersCount =
    selectedCuisines.length +
    selectedDietary.length +
    (selectedPrice ? 1 : 0);

  const handleMobileSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileSearchQuery.trim()) {
      router.push(`/explore-desktop?query=${encodeURIComponent(mobileSearchQuery.trim())}`);
    } else {
      router.push("/explore-desktop");
    }
  };

  const handleDietSelect = (id: string) => {
    setSelectedDiet(id);
    setIsDietDropdownOpen(false);
    const isVeg = id === "veg" || id === "vegan" || id === "jain";
    setInternalVegOnly(isVeg);
    if (onVegToggle) {
      onVegToggle(isVeg);
    }
  };

  const renderDietSymbol = (id: string) => {
    switch (id) {
      case "all":
        return (
          <div className={styles.allIconGrid}>
            <span className={styles.allDot} style={{ backgroundColor: "#16A34A" }} />
            <span className={styles.allDot} style={{ backgroundColor: "#DC2626" }} />
            <span className={styles.allDot} style={{ backgroundColor: "#16A34A" }} />
            <span className={styles.allDot} style={{ backgroundColor: "#EA580C" }} />
          </div>
        );
      case "veg":
        return (
          <div className={styles.symbolSquare} style={{ border: "1.5px solid #16A34A" }}>
            <span className={styles.symbolDot} style={{ backgroundColor: "#16A34A" }} />
          </div>
        );
      case "non-veg":
        return (
          <div className={styles.symbolSquare} style={{ border: "1.5px solid #DC2626" }}>
            <span className={styles.symbolDot} style={{ backgroundColor: "#DC2626" }} />
          </div>
        );
      case "vegan":
        return (
          <div className={styles.symbolSquare} style={{ border: "1.5px solid #15803D" }}>
            <span className={styles.symbolDot} style={{ backgroundColor: "#15803D" }} />
          </div>
        );
      case "jain":
        return (
          <div className={styles.symbolSquare} style={{ border: "1.5px solid #EA580C" }}>
            <span className={styles.symbolDot} style={{ backgroundColor: "#EA580C" }} />
          </div>
        );
      default:
        return null;
    }
  };

  const getDietPillLabel = () => {
    const found = DIET_OPTIONS.find((d) => d.id === selectedDiet);
    return found ? found.label : "Veg";
  };

  const getDietPillDotColor = () => {
    switch (selectedDiet) {
      case "non-veg":
        return "#EF4444";
      case "vegan":
        return "#15803D";
      case "jain":
        return "#F97316";
      default:
        return "#10B981";
    }
  };

  const handleLangSelect = (id: string) => {
    setSelectedLang(id);
    setIsLangDropdownOpen(false);
  };

  const getSelectedLangCode = () => {
    const found = LANG_OPTIONS.find((l) => l.id === selectedLang);
    return found ? found.code : "EN";
  };

  return (
    <header className={styles.navbarHeader}>
      <div className={styles.navbarContainer}>
        {/* Top Row: Left Group, Center Desktop Nav, Right Group */}
        <div className={styles.topRow}>
          {/* 1. LEFT SECTION */}
          <div className={styles.leftGroup}>
            <button
              type="button"
              className={styles.mobileHamburgerBtn}
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open Navigation Menu"
            >
              <Menu size={24} strokeWidth={2.2} />
            </button>

            <Link href="/" className={styles.leftSection}>
              <div className={styles.logoWrapper}>
                <Image
                  src={logoImg}
                  alt="Neo Cloud Bites Logo"
                  width={58}
                  height={58}
                  className={styles.logoImage}
                  priority
                />
              </div>
              <div className={styles.brandInfo}>
                <span className={styles.desktopBrandTitle}>NEO CLOUD BITES</span>
                <span className={styles.mobileBrandTitle}>Cloud Kitchen</span>
                <div
                  className={styles.locationContainer}
                  title="Location"
                  onClick={(e) => {
                    if (onLocationClick) {
                      e.preventDefault();
                      e.stopPropagation();
                      handleLocationClick();
                    }
                  }}
                >
                  <span>{displayLocation}</span>
                  <ChevronDown size={14} className={styles.locationIcon} />
                </div>
              </div>
            </Link>
          </div>

          {/* 2. CENTER SECTION (Desktop Only) */}
          <nav className={styles.centerSection} aria-label="Desktop Navigation">
            {navItems.map((item) => {
              const isActive = currentActiveItem === item;
              return (
                <button
                  key={item}
                  type="button"
                  className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                  onClick={() => handleNavClick(item)}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item}
                </button>
              );
            })}
          </nav>

          {/* 3. RIGHT SECTION */}
          <div className={styles.rightSection}>
            {/* Desktop Veg Only Toggle */}
            <div
              className={styles.vegToggleWrapper}
              onClick={toggleVegOnly}
              role="switch"
              aria-checked={currentVegOnly}
              tabIndex={0}
              onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleVegOnly();
                }
              }}
            >
              <span className={styles.vegLabel}>VEG ONLY</span>
              <div
                className={`${styles.toggleTrack} ${
                  currentVegOnly ? styles.toggleTrackActive : ""
                }`}
              >
                <div
                  className={`${styles.toggleThumb} ${
                    currentVegOnly ? styles.toggleThumbActive : ""
                  }`}
                />
              </div>
            </div>

            {/* Language Selector Pill + Dropdown Popover */}
            <div className={styles.langWrapper}>
              <button
                type="button"
                className={styles.langSelector}
                onClick={() => setIsLangDropdownOpen((prev) => !prev)}
                title="Select Language"
                aria-label={`Language: ${getSelectedLangCode()}`}
                aria-expanded={isLangDropdownOpen}
              >
                <Globe size={18} strokeWidth={2.2} />
                <span className={styles.langText}>{getSelectedLangCode()}</span>
                <ChevronDown
                  size={14}
                  strokeWidth={2.8}
                  style={{
                    transform: isLangDropdownOpen ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s ease",
                  }}
                />
              </button>

              {/* Language Dropdown Popover */}
              {isLangDropdownOpen && (
                <>
                  <div
                    className={styles.langBackdrop}
                    onClick={() => setIsLangDropdownOpen(false)}
                  />
                  <div
                    className={styles.langDropdown}
                    role="menu"
                    aria-orientation="vertical"
                  >
                    {LANG_OPTIONS.map((option) => {
                      const isSelected = selectedLang === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          className={`${styles.langItem} ${
                            isSelected ? styles.langItemActive : ""
                          }`}
                          onClick={() => handleLangSelect(option.id)}
                          role="menuitem"
                        >
                          <span className={styles.langLabel}>{option.label}</span>
                          {isSelected && (
                            <Check size={18} color="#16A34A" strokeWidth={2.8} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Desktop Food Delivery Bag */}
            <button
              type="button"
              className={styles.cartButton}
              onClick={handleCartClick}
              aria-label={`Shopping Bag (${currentCartCount} items)`}
            >
              <ShoppingBag size={22} strokeWidth={2.2} />
              {currentCartCount > 0 && (
                <span className={styles.cartBadge}>{currentCartCount}</span>
              )}
            </button>

            {/* Mobile Shopping Cart Button */}
            <button
              type="button"
              className={styles.mobileCartBtn}
              onClick={handleCartClick}
              aria-label={`Shopping Cart (${currentCartCount} items)`}
            >
              <ShoppingCart size={20} strokeWidth={2} />
              {currentCartCount > 0 && (
                <span className={styles.cartBadge}>{currentCartCount}</span>
              )}
            </button>

            {/* Profile Avatar (Desktop Only) */}
            <button
              type="button"
              className={styles.profileAvatar}
              onClick={handleProfileClick}
              aria-label={session?.user ? (session.user.name || "User Profile") : "Sign In"}
              title={session?.user ? `${session.user.name || "User"} (${session.user.email || ""})` : "Sign In / Register"}
            >
              {session?.user?.name ? (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    backgroundColor: "#FF5500",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "15px",
                    userSelect: "none",
                  }}
                >
                  {session.user.name.trim().charAt(0).toUpperCase()}
                </div>
              ) : (
                <Image
                  src={profilePic}
                  alt="Sign In"
                  width={38}
                  height={38}
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                />
              )}
            </button>
          </div>
        </div>

        {/* Second Row: Mobile Search Bar + Veg Filter Pill (Mobile Only) */}
        <div className={styles.mobileSecondRow}>
          <form onSubmit={handleMobileSearch} className={styles.mobileSearchBar}>
            <Search size={18} color="#FF5500" strokeWidth={2.5} />
            <input
              type="text"
              placeholder="near by home meals..."
              value={mobileSearchQuery}
              onChange={(e) => setMobileSearchQuery(e.target.value)}
              className={styles.mobileSearchInput}
            />
            <button
              type="button"
              className={styles.mobileFilterBtn}
              onClick={() => setIsFilterModalOpen(true)}
              aria-label="Open filter options"
            >
              <SlidersHorizontal size={18} color="#FF5500" strokeWidth={2.2} />
              {activeFiltersCount > 0 && (
                <span className={styles.filterDotBadge} />
              )}
            </button>
          </form>

          {/* Veg / Diet Selector Pill + Dropdown Popover */}
          <div className={styles.vegWrapper}>
            <button
              type="button"
              className={`${styles.mobileVegPill} ${
                selectedDiet !== "all" ? styles.mobileVegPillActive : ""
              }`}
              onClick={() => setIsDietDropdownOpen((prev) => !prev)}
              aria-label="Diet Filter Options"
              aria-expanded={isDietDropdownOpen}
            >
              <span
                className={styles.mobileVegDot}
                style={{ backgroundColor: getDietPillDotColor() }}
              />
              <span className={styles.mobileVegText}>{getDietPillLabel()}</span>
              <ChevronDown
                size={15}
                color="#18181B"
                strokeWidth={2.5}
                style={{
                  transform: isDietDropdownOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s ease",
                }}
              />
            </button>

            {/* Diet Dropdown Popover Menu */}
            {isDietDropdownOpen && (
              <>
                <div
                  className={styles.dietBackdrop}
                  onClick={() => setIsDietDropdownOpen(false)}
                />
                <div
                  className={styles.dietDropdown}
                  role="menu"
                  aria-orientation="vertical"
                >
                  {DIET_OPTIONS.map((option) => {
                    const isSelected = selectedDiet === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        className={`${styles.dietItem} ${
                          isSelected ? styles.dietItemActive : ""
                        }`}
                        onClick={() => handleDietSelect(option.id)}
                        role="menuitem"
                      >
                        <div className={styles.dietItemLeft}>
                          {renderDietSymbol(option.id)}
                          <span className={styles.dietLabel}>{option.label}</span>
                        </div>

                        {isSelected && (
                          <Check size={16} color="#16A34A" strokeWidth={2.8} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* FILTER FORM MODAL (Cuisines, Dietary Preferences, Price Range) */}
      {isFilterModalOpen && (
        <div
          className={styles.filterModalOverlay}
          onClick={() => setIsFilterModalOpen(false)}
        >
          <div
            className={styles.filterModalContent}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className={styles.filterModalHeader}>
              <h3 className={styles.filterModalTitle}>Filters</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className={styles.clearAllBtn}
                >
                  Clear All
                </button>
                <button
                  type="button"
                  className={styles.filterCloseBtn}
                  onClick={() => setIsFilterModalOpen(false)}
                  aria-label="Close filters"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* 3 Column Tabs Navigation */}
            <div className={styles.filterTabColumns}>
              <button
                type="button"
                className={`${styles.filterTabBtn} ${
                  activeFilterTab === "cuisines" ? styles.filterTabBtnActive : ""
                }`}
                onClick={() => setActiveFilterTab("cuisines")}
              >
                <span>Cuisines</span>
                {selectedCuisines.length > 0 && (
                  <span className={styles.tabBadge}>{selectedCuisines.length}</span>
                )}
              </button>

              <button
                type="button"
                className={`${styles.filterTabBtn} ${
                  activeFilterTab === "dietary" ? styles.filterTabBtnActive : ""
                }`}
                onClick={() => setActiveFilterTab("dietary")}
              >
                <span>Dietary</span>
                {selectedDietary.length > 0 && (
                  <span className={styles.tabBadge}>{selectedDietary.length}</span>
                )}
              </button>

              <button
                type="button"
                className={`${styles.filterTabBtn} ${
                  activeFilterTab === "price" ? styles.filterTabBtnActive : ""
                }`}
                onClick={() => setActiveFilterTab("price")}
              >
                <span>Price</span>
                {selectedPrice && (
                  <span className={styles.tabBadge}>1</span>
                )}
              </button>
            </div>

            {/* Modal Body: Displays Information Based on Selected Column Tab */}
            <div className={styles.filterModalBody}>
              {/* 1. Cuisines Tab Content */}
              {activeFilterTab === "cuisines" && (
                <div className={styles.filterSection}>
                  <div className={styles.checkboxList}>
                    {FILTER_CUISINES.map((item) => {
                      const isChecked = selectedCuisines.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          className={styles.checkboxRow}
                          onClick={() => toggleCuisine(item.id)}
                        >
                          <div className={styles.checkboxRowLeft}>
                            <div
                              className={`${styles.customCheckbox} ${
                                isChecked ? styles.customCheckboxChecked : ""
                              }`}
                            >
                              {isChecked && (
                                <Check size={12} color="#FFFFFF" strokeWidth={3.5} />
                              )}
                            </div>
                            <span
                              className={`${styles.checkboxLabel} ${
                                isChecked ? styles.checkboxLabelActive : ""
                              }`}
                            >
                              {item.label}
                            </span>
                          </div>
                          <span className={styles.checkboxCount}>{item.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Dietary Preferences Tab Content */}
              {activeFilterTab === "dietary" && (
                <div className={styles.filterSection}>
                  <div className={styles.checkboxList}>
                    {FILTER_DIETARY.map((item) => {
                      const isChecked = selectedDietary.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          className={styles.checkboxRow}
                          onClick={() => toggleDietary(item.id)}
                        >
                          <div className={styles.checkboxRowLeft}>
                            <div
                              className={`${styles.customCheckbox} ${
                                isChecked ? styles.customCheckboxChecked : ""
                              }`}
                            >
                              {isChecked && (
                                <Check size={12} color="#FFFFFF" strokeWidth={3.5} />
                              )}
                            </div>
                            <span
                              className={`${styles.checkboxLabel} ${
                                isChecked ? styles.checkboxLabelActive : ""
                              }`}
                            >
                              {item.label}
                            </span>
                          </div>
                          <span className={styles.checkboxCount}>{item.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Price Range Tab Content */}
              {activeFilterTab === "price" && (
                <div className={styles.filterSection}>
                  <div className={styles.priceTiersRow}>
                    {PRICE_TIERS.map((tier) => {
                      const isSelected = selectedPrice === tier;
                      return (
                        <button
                          key={tier}
                          type="button"
                          className={`${styles.priceTierBtn} ${
                            isSelected ? styles.priceTierBtnActive : ""
                          }`}
                          onClick={() => handlePriceSelect(tier)}
                        >
                          {tier}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer: Cancel and Apply Buttons */}
            <div className={styles.filterModalFooter}>
              <button
                type="button"
                className={styles.filterCancelBtn}
                onClick={() => setIsFilterModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.filterApplyBtn}
                onClick={handleApplyFilters}
              >
                Apply {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-out Mobile Sidebar Drawer */}
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeItem={
          pathname === "/"
            ? "Home"
            : currentActiveItem === "Orders"
            ? "My Orders"
            : currentActiveItem
        }
        userName={session?.user?.name || "Siddharth Sharma"}
        isGoldMember={true}
      />
    </header>
  );
};

export default Navbar;
