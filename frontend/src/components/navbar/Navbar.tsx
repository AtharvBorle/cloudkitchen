"use client";

import React, { useState, useEffect, useRef } from "react";
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
  LogIn,
  LogOut,
  Settings,
  Package,
  Calendar,
  MapPin,
  Store,
  Bike,
  HelpCircle,
  Shield,
  Sparkles,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLocation } from "@/components/location-provider";
import { useSession } from "next-auth/react";
import { performLogout } from "@/lib/logout";
import { MobileSidebar } from "@/components/mobile-sidebar";
import styles from "./Navbar.module.css";
import logoImg from "./logo-nav.png";
import profilePic from "./Rectangle.jpg";

const FILTER_CUISINES = [
  { id: "biryani", label: "Biryani & Mughlai", count: 24 },
  { id: "homemeals", label: "Homely Meals / Thali", count: 18 },
  { id: "italian", label: "Pizzas & Italian", count: 16 },
  { id: "healthy", label: "Healthy Bowls & Salads", count: 12 },
  { id: "bakery", label: "Bakery & Desserts", count: 14 },
  { id: "fastfood", label: "Burgers & Fast Food", count: 20 },
  { id: "chinese", label: "Chinese & Asian", count: 10 },
  { id: "south-indian", label: "South Indian", count: 8 },
];

const FILTER_DIETARY = [
  { id: "veg", label: "Pure Veg 🥦", count: 22 },
  { id: "non-veg", label: "Non-Veg 🍗", count: 18 },
  { id: "vegan", label: "Vegan (Plant-Based 🌱)", count: 6 },
  { id: "jain", label: "Jain / Satvik 🌿", count: 8 },
];

const PRICE_TIERS = [
  { id: "under-150", label: "Under ₹150" },
  { id: "150-400", label: "₹150 – ₹400" },
  { id: "400-plus", label: "₹400+" },
];

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
  selectedDiet?: string;
  onDietChange?: (diet: string) => void;
  onCartClick?: () => void;
  onProfileClick?: () => void;
  onLocationClick?: () => void;
  hideSearch?: boolean;
  hideVegToggle?: boolean;
  onSearch?: (query: string) => void;
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
  selectedDiet: controlledDiet,
  onDietChange,
  onCartClick,
  onProfileClick,
  onLocationClick,
  hideSearch,
  hideVegToggle,
  onSearch,
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
      pathname.startsWith("/my-subscriptions-desktop") ||
      pathname.startsWith("/notifications-desktop") ||
      pathname.startsWith("/payment-methods-desktop") ||
      pathname.startsWith("/delivery-addresses-desktop") ||
      pathname.startsWith("/order-history-desktop") ||
      pathname.startsWith("/support") ||
      pathname.startsWith("/terms") ||
      pathname.startsWith("/privacy") ||
      pathname.startsWith("/rate")
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

  const isSettingsPage = Boolean(
    pathname?.startsWith("/settings") ||
    pathname?.startsWith("/notifications") ||
    pathname?.startsWith("/payment-methods") ||
    pathname?.startsWith("/delivery-addresses") ||
    pathname?.startsWith("/order-history") ||
    pathname?.startsWith("/my-subscriptions") ||
    pathname?.startsWith("/my-subscription") ||
    pathname?.startsWith("/support") ||
    pathname?.startsWith("/terms") ||
    pathname?.startsWith("/privacy") ||
    pathname?.startsWith("/rate") ||
    currentActiveItem === "Settings"
  );

  const [isProfileHoverOpen, setIsProfileHoverOpen] = useState<boolean>(false);
  const profileTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleProfileMouseEnter = () => {
    if (profileTimeoutRef.current) {
      clearTimeout(profileTimeoutRef.current);
      profileTimeoutRef.current = null;
    }
    setIsProfileHoverOpen(true);
  };

  const handleProfileMouseLeave = () => {
    profileTimeoutRef.current = setTimeout(() => {
      setIsProfileHoverOpen(false);
    }, 180);
  };

  const closeProfileMenu = () => {
    if (profileTimeoutRef.current) {
      clearTimeout(profileTimeoutRef.current);
      profileTimeoutRef.current = null;
    }
    setIsProfileHoverOpen(false);
  };

  const shouldHideSearch = hideSearch !== undefined ? hideSearch : false;
  const shouldHideVegToggle = hideVegToggle !== undefined ? hideVegToggle : false;

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
      router.push("/login");
    }
    closeProfileMenu();
  };

  const handleLocationClick = () => {
    if (onLocationClick) {
      onLocationClick();
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<"cuisines" | "dietary" | "price">("cuisines");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<string>("");

  // Section-aware search target, placeholder, and label
  const getSectionSearchConfig = () => {
    if (pathname.startsWith("/room-booking") || currentActiveItem === "Rooms") {
      return {
        section: "Rooms",
        placeholder: "Search rooms, stays, coliving...",
        targetRoute: "/room-booking",
      };
    }
    if (pathname.startsWith("/explore/furniture") || currentActiveItem === "Furniture") {
      return {
        section: "Furniture",
        placeholder: "Search furniture, chairs, tables, beds...",
        targetRoute: "/explore/furniture",
      };
    }
    if (
      pathname.startsWith("/orders-desktop") ||
      pathname.startsWith("/order-history") ||
      pathname.startsWith("/dashboard/user/orders") ||
      currentActiveItem === "Orders"
    ) {
      return {
        section: "Orders",
        placeholder: "Search orders by ID, dish, kitchen...",
        targetRoute: "/orders-desktop",
      };
    }
    // Default to Food / Explore
    return {
      section: "Food",
      placeholder: "Search home meals, cuisines, kitchens...",
      targetRoute: "/explore-desktop",
    };
  };

  // Sync search input with URL search parameters on mount or navigation
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("query");
      if (q) {
        setSearchQuery(q);
        setMobileSearchQuery(q);
      }
    }
  }, [pathname]);

  const toggleCuisine = (id: string) => {
    setSelectedCuisines((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleDietary = (id: string) => {
    setSelectedDietary((prev) => {
      const isSelected = prev.includes(id);
      if (isSelected) {
        return prev.filter((item) => item !== id);
      } else {
        if (id === "non-veg" || id === "Non-Veg" || id === "NON_VEG") {
          return [id];
        } else {
          const withoutNonVeg = prev.filter(
            (item) => item !== "non-veg" && item !== "Non-Veg" && item !== "NON_VEG"
          );
          return [...withoutNonVeg, id];
        }
      }
    });
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

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (onSearch) {
      onSearch(q);
    }
    const config = getSectionSearchConfig();
    if (q) {
      router.push(`${config.targetRoute}?query=${encodeURIComponent(q)}`);
    } else {
      router.push(config.targetRoute);
    }
  };

  const handleMobileSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = mobileSearchQuery.trim();
    if (onSearch) {
      onSearch(q);
    }
    const config = getSectionSearchConfig();
    if (q) {
      router.push(`${config.targetRoute}?query=${encodeURIComponent(q)}`);
    } else {
      router.push(config.targetRoute);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setMobileSearchQuery("");
    if (onSearch) onSearch("");
    const config = getSectionSearchConfig();
    if (pathname === config.targetRoute) {
      router.push(config.targetRoute);
    }
  };

  useEffect(() => {
    if (controlledDiet !== undefined) {
      setSelectedDiet(controlledDiet);
    }
  }, [controlledDiet]);

  const handleDietSelect = (id: string) => {
    setSelectedDiet(id);
    setIsDietDropdownOpen(false);
    const isVeg = id === "veg" || id === "vegan" || id === "jain";
    setInternalVegOnly(isVeg);
    if (onVegToggle) {
      onVegToggle(isVeg);
    }
    if (onDietChange) {
      onDietChange(id);
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
                  <span className={styles.navItemText}>{item}</span>
                </button>
              );
            })}
          </nav>

          {/* 3. RIGHT SECTION */}
          <div className={styles.rightSection}>
            {/* Desktop Diet / Veg Selector Pill + Dropdown Popover */}
            {!shouldHideVegToggle && (
              <div className={styles.desktopVegWrapper}>
                <button
                  type="button"
                  className={`${styles.dietPillBtn} ${
                    selectedDiet !== "all" ? styles.dietPillBtnActive : ""
                  }`}
                  onClick={() => setIsDietDropdownOpen((prev) => !prev)}
                  aria-label="Diet Filter Options"
                  aria-expanded={isDietDropdownOpen}
                >
                  <span
                    className={styles.dietPillDot}
                    style={{ backgroundColor: getDietPillDotColor() }}
                  />
                  <span className={styles.dietPillText}>{getDietPillLabel()}</span>
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
            )}

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

            {/* Profile Avatar with Hover Dropdown (Desktop Only) */}
            <div
              className={styles.profileWrapper}
              onMouseEnter={handleProfileMouseEnter}
              onMouseLeave={handleProfileMouseLeave}
            >
              <button
                type="button"
                className={styles.profileAvatar}
                onClick={handleProfileClick}
                aria-label={session?.user ? (session.user.name || "User Profile") : "Sign In"}
                title={session?.user ? `${session.user.name || "User"} (${session.user.email || ""})` : "Sign In / Register"}
                aria-expanded={isProfileHoverOpen}
              >
                {session?.user?.name ? (
                  <div className={styles.avatarInitial}>
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

              {/* Profile Hover Dropdown Popover */}
              {isProfileHoverOpen && (
                <div
                  className={styles.profileDropdown}
                  role="menu"
                  aria-orientation="vertical"
                  onMouseEnter={handleProfileMouseEnter}
                  onMouseLeave={handleProfileMouseLeave}
                >
                  {!session?.user ? (
                    // ================= GUEST / UNAUTHENTICATED STATE =================
                    <div className={styles.profileGuestCard}>
                      <div className={styles.profileGuestHeader}>
                        <div className={styles.profileGreeting}>
                          <span className={styles.profileWelcomeTitle}>Welcome</span>
                          <span className={styles.profileWelcomeSub}>To access orders & account</span>
                        </div>
                      </div>

                      {/* Primary Login CTA */}
                      <Link
                        href="/login"
                        className={styles.profileLoginBtn}
                        onClick={closeProfileMenu}
                        role="menuitem"
                      >
                        <LogIn size={16} strokeWidth={2.4} />
                        <span>Login</span>
                      </Link>

                      <div className={styles.profileSignupPrompt}>
                        <span>New customer?</span>{" "}
                        <Link
                          href="/signup"
                          className={styles.profileSignupLink}
                          onClick={closeProfileMenu}
                        >
                          Sign Up
                        </Link>
                      </div>

                      <div className={styles.profileDivider} />

                      {/* Quick Nav Links */}
                      <div className={styles.profileNavList}>
                        <Link
                          href="/orders-desktop"
                          className={styles.profileNavItem}
                          onClick={closeProfileMenu}
                          role="menuitem"
                        >
                          <Package size={16} className={styles.profileNavIcon} />
                          <span>Orders & Reorders</span>
                        </Link>

                        <Link
                          href="/seller/login"
                          className={styles.profileNavItem}
                          onClick={closeProfileMenu}
                          role="menuitem"
                        >
                          <Store size={16} className={styles.profileNavIcon} />
                          <span>Seller / Partner Login</span>
                        </Link>

                        <Link
                          href="/auth/login/delivery"
                          className={styles.profileNavItem}
                          onClick={closeProfileMenu}
                          role="menuitem"
                        >
                          <Bike size={16} className={styles.profileNavIcon} />
                          <span>Delivery Partner</span>
                        </Link>

                        <Link
                          href="/support"
                          className={styles.profileNavItem}
                          onClick={closeProfileMenu}
                          role="menuitem"
                        >
                          <HelpCircle size={16} className={styles.profileNavIcon} />
                          <span>Help & Support</span>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    // ================= AUTHENTICATED USER STATE =================
                    <div className={styles.profileAuthCard}>
                      <div className={styles.profileUserHeader}>
                        <div className={styles.profileUserAvatarCircle}>
                          {session.user.name?.trim().charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className={styles.profileUserDetails}>
                          <span className={styles.profileUserName}>{session.user.name || "User"}</span>
                          <span className={styles.profileUserEmail}>
                            {session.user.email || "Active Account"}
                          </span>
                        </div>
                      </div>

                      <div className={styles.profileDivider} />

                      {/* Auth Nav Links */}
                      <div className={styles.profileNavList}>
                        <Link
                          href="/settings-desktop"
                          className={styles.profileNavItem}
                          onClick={closeProfileMenu}
                          role="menuitem"
                        >
                          <Settings size={16} className={styles.profileNavIcon} />
                          <span>My Profile & Settings</span>
                        </Link>

                        <Link
                          href="/orders-desktop"
                          className={styles.profileNavItem}
                          onClick={closeProfileMenu}
                          role="menuitem"
                        >
                          <Package size={16} className={styles.profileNavIcon} />
                          <span>My Orders</span>
                        </Link>

                        <Link
                          href="/my-subscription"
                          className={styles.profileNavItem}
                          onClick={closeProfileMenu}
                          role="menuitem"
                        >
                          <Calendar size={16} className={styles.profileNavIcon} />
                          <span>My Subscriptions</span>
                        </Link>

                        <Link
                          href="/delivery-addresses-desktop"
                          className={styles.profileNavItem}
                          onClick={closeProfileMenu}
                          role="menuitem"
                        >
                          <MapPin size={16} className={styles.profileNavIcon} />
                          <span>Delivery Addresses</span>
                        </Link>

                        {(session.user as any)?.role === "SELLER" && (
                          <Link
                            href="/dashboard/seller"
                            className={styles.profileNavItem}
                            onClick={closeProfileMenu}
                            role="menuitem"
                          >
                            <Store size={16} className={styles.profileNavIcon} />
                            <span>Seller Dashboard</span>
                          </Link>
                        )}

                        {((session.user as any)?.role === "ADMIN" || (session.user as any)?.role === "SUPERADMIN") && (
                          <Link
                            href="/dashboard/admin"
                            className={styles.profileNavItem}
                            onClick={closeProfileMenu}
                            role="menuitem"
                          >
                            <Shield size={16} className={styles.profileNavIcon} />
                            <span>Admin Console</span>
                          </Link>
                        )}

                        <Link
                          href="/support"
                          className={styles.profileNavItem}
                          onClick={closeProfileMenu}
                          role="menuitem"
                        >
                          <HelpCircle size={16} className={styles.profileNavIcon} />
                          <span>Help & Support</span>
                        </Link>
                      </div>

                      <div className={styles.profileDivider} />

                      <button
                        type="button"
                        className={styles.profileLogoutBtn}
                        onClick={() => {
                          closeProfileMenu();
                          performLogout({ role: (session.user as any)?.role });
                        }}
                        role="menuitem"
                      >
                        <LogOut size={16} strokeWidth={2.2} />
                        <span>Log Out</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Second Row: Mobile Search Bar + Veg Filter Pill (Mobile Only) */}
        {(!shouldHideSearch || !shouldHideVegToggle) && (
          <div className={styles.mobileSecondRow}>
            {!shouldHideSearch && (
              <form onSubmit={handleMobileSearch} className={styles.mobileSearchBar}>
                <Search size={18} color="#FF5500" strokeWidth={2.5} />
                <input
                  type="text"
                  placeholder={getSectionSearchConfig().placeholder}
                  value={mobileSearchQuery}
                  onChange={(e) => {
                    setMobileSearchQuery(e.target.value);
                    setSearchQuery(e.target.value);
                    if (onSearch) onSearch(e.target.value);
                  }}
                  className={styles.mobileSearchInput}
                  aria-label={`Search in ${getSectionSearchConfig().section}`}
                />
                {mobileSearchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className={styles.desktopClearBtn}
                    aria-label="Clear mobile search"
                    style={{ marginRight: "4px" }}
                  >
                    <X size={15} />
                  </button>
                )}
                {getSectionSearchConfig().section === "Food" && (
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
                )}
              </form>
            )}

            {/* Veg / Diet Selector Pill + Dropdown Popover */}
            {!shouldHideVegToggle && (
              <div className={styles.vegWrapper}>
                <button
                  type="button"
                  className={`${styles.dietPillBtn} ${
                    selectedDiet !== "all" ? styles.dietPillBtnActive : ""
                  }`}
                  onClick={() => setIsDietDropdownOpen((prev) => !prev)}
                  aria-label="Diet Filter Options"
                  aria-expanded={isDietDropdownOpen}
                >
                  <span
                    className={styles.dietPillDot}
                    style={{ backgroundColor: getDietPillDotColor() }}
                  />
                  <span className={styles.dietPillText}>{getDietPillLabel()}</span>
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
            )}
          </div>
        )}
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
                      const isSelected = selectedPrice === tier.id;
                      return (
                        <button
                          key={tier.id}
                          type="button"
                          className={`${styles.priceTierBtn} ${
                            isSelected ? styles.priceTierBtnActive : ""
                          }`}
                          onClick={() => handlePriceSelect(tier.id)}
                        >
                          {tier.label}
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
