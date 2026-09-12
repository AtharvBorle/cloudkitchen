"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Menu as MenuIcon,
  Plus,
  Eye,
  Pencil,
  ChevronDown,
  X,
  CheckCircle2,
  AlertCircle,
  Bell,
} from "lucide-react";
import ResponsiveNavMenu from "../../nav/ResponsiveNavMenu";
import { useSellerProfile } from "@/hooks/useSellerProfile";
import styles from "./ResponsiveSellerSubscription.module.css";


export type PlanStatus = "All" | "Active" | "Paused" | "Draft";
export type PlanTier = "All" | "Bronze" | "Silver" | "Gold" | "Starter" | "Professional" | "Enterprise";
export type SortOption = "Newest" | "Subscribers" | "Price: Low to High" | "Price: High to Low";

export interface ResponsiveSubscriptionPlan {
  id: string;
  title: string;
  tier: "Bronze" | "Silver" | "Gold" | "Starter" | "Professional" | "Enterprise" | string;
  tierVariant?: "orange" | "purple" | "indigo" | "blue";
  price: string;
  subscribersCount: number;
  status: "Active" | "Paused" | "Draft";
  createdAt: string;
  billingCycle?: "Weekly" | "Monthly" | "Quarterly";
  mealsPerDay?: number;
  description?: string;
  mealTypes?: string[];
}

export interface ResponsiveSellerSubscriptionProps {
  ownerName?: string;
  plans?: ResponsiveSubscriptionPlan[];
  onCreatePlan?: () => void;
  onEditPlan?: (plan: ResponsiveSubscriptionPlan) => void;
  onPreviewPlan?: (plan: ResponsiveSubscriptionPlan) => void;
  onBack?: () => void;
  onSyncDevices?: () => void;
}

const EMPTY_PLANS: ResponsiveSubscriptionPlan[] = [];

export const ResponsiveSellerSubscription: React.FC<ResponsiveSellerSubscriptionProps> = ({
  ownerName,
  plans,
  onCreatePlan,
  onEditPlan,
  onPreviewPlan,
  onBack,
  onSyncDevices,
}) => {
  const router = useRouter();
  const seller = useSellerProfile();
  const effectiveOwnerName = ownerName && ownerName !== "Rahul Sharma" && ownerName !== "John Doe" ? ownerName : seller.ownerName;
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<PlanStatus>("All");
  const [tierFilter, setTierFilter] = useState<PlanTier>("All");
  const [sortBy, setSortBy] = useState<SortOption>("Newest");
  const activePlans = plans || EMPTY_PLANS;
  const [selectedPlanPreview, setSelectedPlanPreview] = useState<ResponsiveSubscriptionPlan | null>(null);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/seller/dashboard");
    }
  };

  const handleCreatePlan = () => {
    if (onCreatePlan) {
      onCreatePlan();
    } else {
      router.push("/seller/subscription/newPlan");
    }
  };

  const handleEditPlan = (plan: ResponsiveSubscriptionPlan, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEditPlan) {
      onEditPlan(plan);
    } else {
      router.push(`/seller/subscription/editPlan?id=${plan.id}`);
    }
  };

  const handlePreviewPlan = (plan: ResponsiveSubscriptionPlan, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPreviewPlan) {
      onPreviewPlan(plan);
    } else {
      setSelectedPlanPreview(plan);
    }
  };

  // Filter and sort plans
  const filteredPlans = activePlans
    .filter((plan) => {
      const matchStatus = statusFilter === "All" || plan.status === statusFilter;
      const matchTier = tierFilter === "All" || plan.tier === tierFilter;
      return matchStatus && matchTier;
    })
    .sort((a, b) => {
      if (sortBy === "Subscribers") {
        return b.subscribersCount - a.subscribersCount;
      }
      if (sortBy === "Price: Low to High") {
        const pA = parseInt(a.price.replace(/[^\d]/g, "")) || 0;
        const pB = parseInt(b.price.replace(/[^\d]/g, "")) || 0;
        return pA - pB;
      }
      if (sortBy === "Price: High to Low") {
        const pA = parseInt(a.price.replace(/[^\d]/g, "")) || 0;
        const pB = parseInt(b.price.replace(/[^\d]/g, "")) || 0;
        return pB - pA;
      }
      return 0; // default order
    });

  const getTierBadgeClass = (tierVariant?: string, tier?: string) => {
    const t = (tier || "").toLowerCase();
    if (t === "bronze" || tierVariant === "orange" || tier === "Starter") return styles.tierBronze;
    if (t === "silver" || tierVariant === "blue" || tier === "Professional") return styles.tierSilver;
    if (t === "gold" || tierVariant === "purple" || tierVariant === "indigo" || tier === "Enterprise") return styles.tierGold;
    return styles.tierBronze;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return styles.statusActive;
      case "paused":
        return styles.statusPaused;
      default:
        return styles.statusDraft;
    }
  };

  return (
    <div className={styles.screenWrapper}>
      {/* Slide-out Drawer Navigation Menu */}
      <ResponsiveNavMenu
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        activeItemId="subscription"
        ownerName={effectiveOwnerName}
        onSyncDevices={onSyncDevices}
      />

      {/* 390px Mobile View Frame */}
      <div className={styles.mobileContainer}>
        {/* Top Header Bar */}
        <header className={styles.topBar}>
          {/* Top-Left Hamburger Menu Button + Logo */}
          <div className={styles.headerLeft}>
            <button
              type="button"
              className={styles.menuButton}
              onClick={(e) => {
                e.stopPropagation();
                setIsNavMenuOpen(true);
              }}
              aria-label="Open Navigation Menu"
              title="Menu"
            >
              <MenuIcon size={24} />
            </button>
            <Link href="/seller/dashboard" className={styles.headerLogoLink} title="Neo Cloud Bites">
              <div className={styles.headerLogoWrapper}>
                <Image
                  src="/images/logo-nav.png"
                  alt="Neo Cloud Bites"
                  width={30}
                  height={30}
                  className={styles.headerLogoImg}
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Centered Title & Subtitle */}
          <div className={styles.headerCenter}>
            <h2 className={styles.headerTitle}>ALL Subscriptions</h2>
            <p className={styles.headerSubtitle}>your active plans &amp; meal deliveries</p>
          </div>

          {/* Top-Right Notification Bell */}
          <div className={styles.headerRight}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => router.push("/seller/notifications")}
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={22} />
              <span className={styles.notificationDot} />
            </button>
          </div>
        </header>


        {/* Content Area */}
        <main className={styles.contentArea}>
          {/* 1. Primary Action: + Create New Plan */}
          <button
            type="button"
            className={styles.createPlanBtn}
            onClick={handleCreatePlan}
            aria-label="Create New Plan"
          >
            <Plus size={20} strokeWidth={2.8} />
            <span>Create New Plan</span>
          </button>

          {/* 2. Filter & Sort Row (Pills) */}
          <section className={styles.filterRow} aria-label="Subscription Filters">
            {/* Status Filter Pill */}
            <button
              type="button"
              className={`${styles.filterChip} ${statusFilter !== "All" ? styles.filterChipActive : ""}`}
              onClick={() => {
                const nextStatus: Record<PlanStatus, PlanStatus> = {
                  All: "Active",
                  Active: "Paused",
                  Paused: "All",
                  Draft: "All",
                };
                setStatusFilter(nextStatus[statusFilter] || "All");
              }}
            >
              <span>Status: {statusFilter}</span>
              <ChevronDown size={14} />
            </button>

            {/* Plan Tier Filter Pill */}
            <button
              type="button"
              className={`${styles.filterChip} ${tierFilter !== "All" ? styles.filterChipActive : ""}`}
              onClick={() => {
                const nextTier: Record<PlanTier, PlanTier> = {
                  All: "Bronze",
                  Bronze: "Silver",
                  Silver: "Gold",
                  Gold: "All",
                  Starter: "Bronze",
                  Professional: "Silver",
                  Enterprise: "Gold",
                };
                setTierFilter(nextTier[tierFilter] || "All");
              }}
            >
              <span>Plan Tier: {tierFilter}</span>
              <ChevronDown size={14} />
            </button>

            {/* Sort Filter Pill */}
            <button
              type="button"
              className={`${styles.filterChip} ${sortBy !== "Newest" ? styles.filterChipActive : ""}`}
              onClick={() => {
                const nextSort: Record<SortOption, SortOption> = {
                  Newest: "Subscribers",
                  Subscribers: "Price: Low to High",
                  "Price: Low to High": "Price: High to Low",
                  "Price: High to Low": "Newest",
                };
                setSortBy(nextSort[sortBy] || "Newest");
              }}
            >
              <span>Sort: {sortBy}</span>
              <ChevronDown size={14} />
            </button>
          </section>

          {/* 3. Subscription Plans List */}
          <section className={styles.plansList} aria-label="Subscription Plans List">
            {filteredPlans.length > 0 ? (
              filteredPlans.map((plan) => {
                const tierClass = getTierBadgeClass(plan.tierVariant, plan.tier);
                const statusClass = getStatusBadgeClass(plan.status);

                return (
                  <article
                    key={plan.id}
                    className={styles.planCard}
                    onClick={(e) => handlePreviewPlan(plan, e)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handlePreviewPlan(plan, e as any);
                      }
                    }}
                  >
                    {/* Top Row: Plan Name & Actions (Eye, Pencil) */}
                    <div className={styles.cardTopRow}>
                      <h2 className={styles.planTitle}>{plan.title}</h2>
                      <div className={styles.cardActions}>
                        <button
                          type="button"
                          className={styles.iconActionBtn}
                          onClick={(e) => handlePreviewPlan(plan, e)}
                          title="View Plan Details"
                          aria-label={`Preview ${plan.title}`}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          className={styles.iconActionBtn}
                          onClick={(e) => handleEditPlan(plan, e)}
                          title="Edit Plan"
                          aria-label={`Edit ${plan.title}`}
                        >
                          <Pencil size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Tier Badge */}
                    <div className={styles.tierBadgeWrapper}>
                      <span className={`${styles.tierBadge} ${tierClass}`}>
                        {plan.tier}
                      </span>
                    </div>

                    {/* Price & Subscribers Count */}
                    <div className={styles.priceSubscribersRow}>
                      <span className={styles.priceText}>{plan.price}</span>
                      <span className={styles.subscribersText}>
                        {plan.subscribersCount} subscribers
                      </span>
                    </div>

                    {/* Status & Created Date */}
                    <div className={styles.statusDateRow}>
                      <span className={`${styles.statusBadge} ${statusClass}`}>
                        {plan.status}
                      </span>
                      <span className={styles.createdDateText}>
                        Created: {plan.createdAt}
                      </span>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className={styles.emptyState}>
                <AlertCircle size={32} color="#F97316" />
                <p className={styles.emptyText}>
                  No subscription plans match your selected filters.
                </p>
                <button
                  type="button"
                  className={styles.filterChip}
                  onClick={() => {
                    setStatusFilter("All");
                    setTierFilter("All");
                    setSortBy("Newest");
                  }}
                >
                  Reset Filters
                </button>
              </div>
            )}
          </section>
        </main>

        {/* Preview Modal Dialog */}
        {selectedPlanPreview && (

          <div
            className={styles.modalOverlay}
            onClick={() => setSelectedPlanPreview(null)}
          >
            <div
              className={styles.modalCard}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>{selectedPlanPreview.title}</h3>
                <button
                  type="button"
                  className={styles.modalCloseBtn}
                  onClick={() => setSelectedPlanPreview(null)}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className={styles.modalDetailRow}>
                <span className={styles.modalDetailLabel}>Plan Tier:</span>
                <span className={styles.modalDetailValue}>{selectedPlanPreview.tier}</span>
              </div>

              <div className={styles.modalDetailRow}>
                <span className={styles.modalDetailLabel}>Price:</span>
                <span className={styles.modalDetailValue} style={{ color: "#F97316" }}>
                  {selectedPlanPreview.price} ({selectedPlanPreview.billingCycle || "Weekly"})
                </span>
              </div>

              <div className={styles.modalDetailRow}>
                <span className={styles.modalDetailLabel}>Subscribers:</span>
                <span className={styles.modalDetailValue}>
                  {selectedPlanPreview.subscribersCount} active subscribers
                </span>
              </div>

              <div className={styles.modalDetailRow}>
                <span className={styles.modalDetailLabel}>Status:</span>
                <span className={styles.modalDetailValue}>{selectedPlanPreview.status}</span>
              </div>

              {selectedPlanPreview.mealTypes && (
                <div className={styles.modalDetailRow}>
                  <span className={styles.modalDetailLabel}>Included Meals:</span>
                  <span className={styles.modalDetailValue}>
                    {selectedPlanPreview.mealTypes.join(", ")}
                  </span>
                </div>
              )}

              {selectedPlanPreview.description && (
                <div style={{ fontSize: "13px", color: "#64748B", marginTop: "4px", lineHeight: "1.4" }}>
                  {selectedPlanPreview.description}
                </div>
              )}

              <button
                type="button"
                className={styles.modalActionBtn}
                onClick={() => {
                  const targetId = selectedPlanPreview.id;
                  setSelectedPlanPreview(null);
                  router.push(`/seller/subscription/editPlan?id=${targetId}`);
                }}
              >
                Edit Full Configuration
              </button>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponsiveSellerSubscription;
