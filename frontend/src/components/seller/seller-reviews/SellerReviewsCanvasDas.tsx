"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import SellerSidebar from "../sidebar/Sidebar";
import Topbar from "../nav/Topbar";
import { ResponsiveNavMenu } from "../nav/ResponsiveNavMenu";
import { useSellerProfile } from "@/hooks/useSellerProfile";
import { fetchApi } from "@/lib/fetch-api";
import { Star, Utensils, ChevronDown, Check, MessageSquare, X, Send } from "lucide-react";
import styles from "./SellerReviews.module.css";

export interface ReviewItem {
  id: string;
  customerName: string;
  orderId: string;
  date: string;
  rating: number;
  comment?: string;
  itemsOrdered: string[];
  managerResponse?: {
    date: string;
    text: string;
  };
}

export interface SellerReviewsCanvasDasProps {
  topbarTitle?: string;
  searchPlaceholder?: string;
  activeSidebarId?: string;
}

const DEFAULT_REVIEWS: ReviewItem[] = [];

const DEFAULT_RATINGS_DISTRIBUTION = [
  { label: "5 Stars", count: 0, percentage: "0%" },
  { label: "4 Stars", count: 0, percentage: "0%" },
  { label: "3 Stars", count: 0, percentage: "0%" },
  { label: "2 Stars", count: 0, percentage: "0%" },
  { label: "1 Star", count: 0, percentage: "0%" },
];

const DEFAULT_BREAKDOWN_BARS = [
  { label: "5 Star", count: 0, percentage: 0, color: "#334155" },
  { label: "4 Star", count: 0, percentage: 0, color: "#EF4444" },
  { label: "3 Star", count: 0, percentage: 0, color: "#475569" },
  { label: "2 Star", count: 0, percentage: 0, color: "#475569" },
  { label: "1 Star", count: 0, percentage: 0, color: "#475569" },
];

/* Helper Component: Smooth Numeric Counter with EaseOut */
function AnimatedCounter({
  value,
  decimals = 0,
  duration = 1100,
}: {
  value: number;
  decimals?: number;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = value * easeOut;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  if (decimals > 0) {
    return <>{displayValue.toFixed(decimals)}</>;
  }
  return <>{Math.round(displayValue).toLocaleString()}</>;
}

/* Helper Component: Staggered Star Pop-In */
function AnimatedStarRating({
  rating,
  maxStars = 5,
  size = 16,
  baseDelay = 0.05,
}: {
  rating: number;
  maxStars?: number;
  size?: number;
  baseDelay?: number;
}) {
  return (
    <div className={styles.starsRow}>
      {Array.from({ length: maxStars }).map((_, idx) => {
        const isFilled = idx < Math.floor(rating);
        const delay = baseDelay + idx * 0.07;

        return (
          <span
            key={idx}
            className={styles.animatedStar}
            style={{ animationDelay: `${delay}s` }}
          >
            <Star
              size={size}
              fill={isFilled ? "#F97316" : "none"}
              color={isFilled ? "#F97316" : "#CBD5E1"}
            />
          </span>
        );
      })}
    </div>
  );
}

export default function SellerReviewsCanvasDas({
  topbarTitle = "Reviews & Feedback",
  searchPlaceholder = "Search reviews, ratings, customer feedback...",
  activeSidebarId = "reviews",
}: SellerReviewsCanvasDasProps) {
  const seller = useSellerProfile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Live Data / API States
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>([]);
  const [overallRating, setOverallRating] = useState(0);
  const [totalReviewsCount, setTotalReviewsCount] = useState(0);
  const [ratingsDistribution, setRatingsDistribution] = useState(DEFAULT_RATINGS_DISTRIBUTION);
  const [breakdownBars, setBreakdownBars] = useState(DEFAULT_BREAKDOWN_BARS);

  // Reply Modal State
  const [replyModalReview, setReplyModalReview] = useState<ReviewItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const handleOpenReplyModal = (review: ReviewItem) => {
    setReplyModalReview(review);
    setReplyText(review.managerResponse ? review.managerResponse.text : "");
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyModalReview || !replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await fetchApi(`/api/seller/reviews/${replyModalReview.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyText: replyText.trim() }),
      });
      if (res.ok) {
        const todayFormatted = new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        setReviewsList((prev) =>
          prev.map((r) =>
            r.id === replyModalReview.id
              ? {
                  ...r,
                  managerResponse: {
                    date: todayFormatted,
                    text: replyText.trim(),
                  },
                }
              : r
          )
        );
        setReplyModalReview(null);
        setReplyText("");
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Failed to submit reply.");
      }
    } catch (err) {
      console.error("Reply error:", err);
      alert("An error occurred while submitting reply.");
    } finally {
      setSubmittingReply(false);
    }
  };

  // Filter & Sort state
  const [selectedFilter, setSelectedFilter] = useState("All Ratings");
  const [selectedSort, setSelectedSort] = useState("Newest First");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Trigger progress bar animations after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Live data integration
  useEffect(() => {
    async function loadSellerReviews() {
      try {
        const res = await fetchApi("/api/seller/reviews");
        if (res.ok) {
          const json = await res.json();
          const apiData = json.data || json;

          if (apiData) {
            const rawList = apiData.reviews || [];
            const mapped: ReviewItem[] = rawList.map((r: any) => ({
              id: r.id,
              customerName: r.user?.name || "Customer",
              orderId: r.orderId ? r.orderId.slice(-8) : r.id.slice(-8),
              date: new Date(r.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }),
              rating: r.rating || 5,
              comment: r.comment || "No comment left for this order.",
              itemsOrdered: r.itemRatings?.map((ir: any) => ir.foodItem?.name || "Item") || [],
              managerResponse: r.managerResponse
                ? {
                    date: new Date(r.managerResponse.createdAt || Date.now()).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }),
                    text: r.managerResponse.comment || r.managerResponse.text,
                  }
                : undefined,
            }));
            setReviewsList(mapped);

            const stats = apiData.stats;
            const total = stats?.totalReviews !== undefined ? stats.totalReviews : mapped.length;
            setTotalReviewsCount(total);
            setOverallRating(stats?.averageRating || 0);

            const distMap = stats?.ratingDistribution || {};
            const dist = [5, 4, 3, 2, 1].map((star) => {
              const count = distMap[star] || 0;
              const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0";
              return {
                label: star === 1 ? "1 Star" : `${star} Stars`,
                count,
                percentage: `${pct}%`,
              };
            });
            setRatingsDistribution(dist);

            const bars = [
              { label: "5 Star", count: distMap[5] || 0, percentage: total > 0 ? Number(((distMap[5] || 0) / total * 100).toFixed(1)) : 0, color: "#334155" },
              { label: "4 Star", count: distMap[4] || 0, percentage: total > 0 ? Number(((distMap[4] || 0) / total * 100).toFixed(1)) : 0, color: "#EF4444" },
              { label: "3 Star", count: distMap[3] || 0, percentage: total > 0 ? Number(((distMap[3] || 0) / total * 100).toFixed(1)) : 0, color: "#475569" },
              { label: "2 Star", count: distMap[2] || 0, percentage: total > 0 ? Number(((distMap[2] || 0) / total * 100).toFixed(1)) : 0, color: "#475569" },
              { label: "1 Star", count: distMap[1] || 0, percentage: total > 0 ? Number(((distMap[1] || 0) / total * 100).toFixed(1)) : 0, color: "#475569" },
            ];
            setBreakdownBars(bars);
          }
        }
      } catch (err) {
        console.error("Failed to load seller reviews:", err);
      }
    }

    loadSellerReviews();
  }, []);

  // Filter and Sort Processing
  const filteredAndSortedReviews = useMemo(() => {
    let list = [...reviewsList];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.customerName.toLowerCase().includes(q) ||
          r.orderId.toLowerCase().includes(q) ||
          (r.comment && r.comment.toLowerCase().includes(q)) ||
          r.itemsOrdered.some((item) => item.toLowerCase().includes(q))
      );
    }

    // Rating filter
    if (selectedFilter === "5 Stars") {
      list = list.filter((r) => r.rating === 5);
    } else if (selectedFilter === "4 Stars") {
      list = list.filter((r) => r.rating === 4);
    } else if (selectedFilter === "3 Stars") {
      list = list.filter((r) => r.rating === 3);
    } else if (selectedFilter === "2 Stars") {
      list = list.filter((r) => r.rating === 2);
    } else if (selectedFilter === "1 Star") {
      list = list.filter((r) => r.rating === 1);
    } else if (selectedFilter === "With Comments") {
      list = list.filter((r) => r.comment && !r.comment.toLowerCase().includes("no comment left"));
    }

    // Sort
    if (selectedSort === "Newest First") {
      // already in natural latest sequence
    } else if (selectedSort === "Oldest First") {
      list.reverse();
    } else if (selectedSort === "Highest Rating") {
      list.sort((a, b) => b.rating - a.rating);
    } else if (selectedSort === "Lowest Rating") {
      list.sort((a, b) => a.rating - b.rating);
    }

    return list;
  }, [reviewsList, selectedFilter, selectedSort, searchQuery]);

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        alignItems: "flex-start",
        backgroundColor: "#F7F8FB",
        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
      }}
      className="reviews-canvas-das-layout"
    >
      {/* 1. Left Side Menu Component */}
      <SellerSidebar
        activeItemId={activeSidebarId}
        isMobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        ownerName={seller.ownerName}
        partnerRole={seller.partnerRole}
        avatarInitials={seller.avatarInitials}
      />

      {/* 2. Responsive Mobile Drawer */}
      <ResponsiveNavMenu
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        activeItemId={activeSidebarId}
        ownerName={seller.ownerName}
        roleTagText={seller.partnerRole}
      />

      {/* 3. Main Workspace Area */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: "#F7F8FB",
        }}
      >
        {/* Top Header Navigation */}
        <Topbar
          title={topbarTitle}
          searchPlaceholder={searchPlaceholder}
          onMenuToggle={() => setIsMobileOpen(true)}
          onMenuClick={() => setIsMobileOpen(true)}
          ownerName={seller.ownerName}
          partnerRole={seller.partnerRole}
          avatarInitials={seller.avatarInitials}
          onSearch={(query) => setSearchQuery(query)}
        />

        {/* Content Body */}
        <main
          style={{
            flex: 1,
            padding: "28px 32px",
            boxSizing: "border-box",
            maxWidth: "1400px",
            width: "100%",
            margin: "0 auto",
          }}
        >
          <div className={styles.container}>
            {/* Page Header */}
            <div className={styles.headerSection}>
              <h1 className={styles.mainTitle}>Customer Reviews & Ratings</h1>
              <p className={styles.subTitle}>
                Monitor service satisfaction, analyze item feedback, and manage customer relations.
              </p>
            </div>

            {/* Overview Stats Cards */}
            <div className={styles.statsGrid}>
              {/* Card 1: Overall Rating */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>Overall Rating</div>
                <div className={styles.ratingBody}>
                  <div className={styles.bigRatingNumber}>
                    <AnimatedCounter value={overallRating} decimals={1} duration={1200} />
                  </div>
                  <div className={styles.starsAndBased}>
                    <AnimatedStarRating rating={overallRating} size={17} baseDelay={0.05} />
                    <div className={styles.basedText}>
                      Based on <AnimatedCounter value={totalReviewsCount} duration={1200} /><br />reviews
                    </div>
                  </div>
                </div>
                <div className={totalReviewsCount > 0 ? styles.trendGreen : styles.trendNeutral || styles.basedText}>
                  {totalReviewsCount > 0 ? "Active customer ratings" : "No reviews yet"}
                </div>
              </div>

              {/* Card 2: Review Count */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>Review Count</div>
                <div className={styles.bigCountNumber}>
                  <AnimatedCounter value={totalReviewsCount} duration={1400} />
                </div>
                <div className={styles.countSubtext}>Total customer feedback received</div>
              </div>

              {/* Card 3: Ratings Distribution */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>Ratings Distribution</div>
                <div className={styles.distList}>
                  {ratingsDistribution.map((item) => (
                    <div key={item.label} className={styles.distRow}>
                      <span className={styles.distLabel}>{item.label}</span>
                      <span className={styles.distValue}>
                        <AnimatedCounter value={item.count} duration={1000} /> ({item.percentage})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content Split: Left Review List & Right Breakdown/Activity/Alerts */}
            <div className={styles.contentRow}>
              {/* Left Column: Reviews List */}
              <div className={styles.reviewsListCol}>
                {/* Filter and Sort Controls Bar */}
                <div className={styles.controlsBar}>
                  <div className={styles.filterSortGroup}>
                    {/* Filter Dropdown */}
                    <div className={styles.controlDropdownWrapper} ref={filterRef}>
                      <button
                        type="button"
                        className={`${styles.pillButton} ${isFilterOpen ? styles.activeDropdown : ""}`}
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                      >
                        <span>Filter: {selectedFilter}</span>
                        <ChevronDown size={14} color="#64748B" />
                      </button>

                      {isFilterOpen && (
                        <div className={styles.dropdownMenu}>
                          {["All Ratings", "5 Stars", "4 Stars", "3 Stars", "2 Stars", "1 Star", "With Comments"].map(
                            (option) => (
                              <button
                                key={option}
                                type="button"
                                className={`${styles.dropdownItem} ${
                                  selectedFilter === option ? styles.dropdownItemActive : ""
                                }`}
                                onClick={() => {
                                  setSelectedFilter(option);
                                  setIsFilterOpen(false);
                                }}
                              >
                                <span>{option}</span>
                                {selectedFilter === option && <Check size={14} color="#EA580C" />}
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </div>

                    {/* Sort Dropdown */}
                    <div className={styles.controlDropdownWrapper} ref={sortRef}>
                      <button
                        type="button"
                        className={`${styles.pillButton} ${isSortOpen ? styles.activeDropdown : ""}`}
                        onClick={() => setIsSortOpen(!isSortOpen)}
                      >
                        <span>Sort: {selectedSort}</span>
                        <ChevronDown size={14} color="#64748B" />
                      </button>

                      {isSortOpen && (
                        <div className={styles.dropdownMenu}>
                          {["Newest First", "Oldest First", "Highest Rating", "Lowest Rating"].map((option) => (
                            <button
                              key={option}
                              type="button"
                              className={`${styles.dropdownItem} ${
                                selectedSort === option ? styles.dropdownItemActive : ""
                              }`}
                              onClick={() => {
                                setSelectedSort(option);
                                setIsSortOpen(false);
                              }}
                            >
                              <span>{option}</span>
                              {selectedSort === option && <Check size={14} color="#EA580C" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <span className={styles.showingCount}>
                    Showing {filteredAndSortedReviews.length > 0 ? `1-${filteredAndSortedReviews.length}` : "0"} of{" "}
                    {totalReviewsCount.toLocaleString()} reviews
                  </span>
                </div>

                {/* Reviews List Cards */}
                <div className={styles.reviewsList}>
                  {filteredAndSortedReviews.length === 0 ? (
                    <div className={styles.emptyReviewsState}>
                      {reviewsList.length === 0
                        ? "No customer reviews or ratings yet. Once customers place orders and leave feedback, their ratings and reviews will appear here."
                        : "No reviews found matching the selected filter criteria."}
                    </div>
                  ) : (
                    filteredAndSortedReviews.map((review, index) => {
                      const isNoComment =
                        !review.comment ||
                        review.comment.toLowerCase().includes("no comment left");

                      return (
                        <div
                          key={review.id}
                          className={styles.reviewCard}
                          style={{ animationDelay: `${0.1 + index * 0.08}s` }}
                        >
                          <div className={styles.reviewHeader}>
                            <div className={styles.reviewerInfo}>
                              <div className={styles.nameAndBadge}>
                                <span className={styles.customerName}>{review.customerName}</span>
                                <span className={styles.orderIdPill}>Order ID: {review.orderId}</span>
                              </div>
                              <span className={styles.reviewDate}>{review.date}</span>
                            </div>

                            <AnimatedStarRating
                              rating={review.rating}
                              size={16}
                              baseDelay={0.08 + index * 0.05}
                            />
                          </div>

                          {review.comment && (
                            <div className={styles.commentQuoteBox}>
                              <p className={isNoComment ? styles.italicComment : styles.commentText}>
                                {review.comment}
                              </p>
                            </div>
                          )}

                          {review.itemsOrdered && review.itemsOrdered.length > 0 && (
                            <div className={styles.tagList}>
                              {review.itemsOrdered.map((item, i) => (
                                <div key={i} className={styles.itemTag}>
                                  <Utensils size={13} color="#475569" />
                                  <span>{item}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {review.managerResponse && (
                            <div className={styles.managerResponseBox}>
                              <div className={styles.managerResponseHeader}>
                                <span className={styles.managerResponseTitle}>Manager Response</span>
                                <span className={styles.managerResponseDate}>
                                  {review.managerResponse.date}
                                </span>
                              </div>
                              <p className={styles.managerResponseText}>
                                {review.managerResponse.text}
                              </p>
                            </div>
                          )}

                          {/* Reply Action Button */}
                          <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              onClick={() => handleOpenReplyModal(review)}
                              style={{
                                background: "none",
                                border: "1px solid #FED7AA",
                                borderRadius: "8px",
                                padding: "6px 14px",
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "#EA580C",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                backgroundColor: "#FFF7ED",
                                transition: "all 0.15s ease",
                              }}
                            >
                              <MessageSquare size={13} />
                              <span>{review.managerResponse ? "Edit Response" : "Reply to Customer"}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Rating Breakdown, Recent Activity & Alerts */}
              <div className={styles.sidebarCol}>
                {/* Rating Breakdown Card */}
                <div className={styles.breakdownCard}>
                  <h2 className={styles.breakdownHeader}>Rating Breakdown</h2>
                  <p className={styles.breakdownSubtitle}>
                    Distribution across all customer scores
                  </p>

                  <div className={styles.breakdownList}>
                    {breakdownBars.map((item) => (
                      <div key={item.label} className={styles.breakdownRow}>
                        <span className={styles.breakdownStarLabel}>{item.label}</span>
                        <div className={styles.progressTrack}>
                          <div
                            className={styles.progressBarFill}
                            style={{
                              width: isMounted ? `${item.percentage}%` : "0%",
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                        <span className={styles.breakdownCountValue}>
                          <AnimatedCounter value={item.count} duration={1100} />
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className={styles.breakdownInsight}>
                    {totalReviewsCount > 0
                      ? "Distribution across all customer reviews and order ratings."
                      : "No customer rating distributions recorded yet."}
                  </p>
                </div>

                {/* Recent Activity Card */}
                <div className={styles.recentActivityCard}>
                  <h2 className={styles.recentActivityHeader}>Recent Activity</h2>
                  <p className={styles.recentActivityEmpty}>No new customer feedback in the last 24 hours.</p>
                </div>

                {/* Alerts Card */}
                <div className={styles.alertsCard}>
                  <h2 className={styles.alertsHeader}>Alerts</h2>
                  <p className={styles.alertsText}>Need immediate manager response.</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Manager Reply Modal */}
      {replyModalReview && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "20px",
          }}
          onClick={() => setReplyModalReview(null)}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "28px",
              maxWidth: "540px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0F172A", margin: "0 0 4px 0" }}>
                  Respond to {replyModalReview.customerName}
                </h3>
                <p style={{ fontSize: "13px", color: "#64748B", margin: 0 }}>
                  Order ID: {replyModalReview.orderId} • Rated {replyModalReview.rating} Stars
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReplyModalReview(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#94A3B8",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Original Customer Review Snippet */}
            <div
              style={{
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "10px",
                padding: "12px 16px",
                marginBottom: "20px",
                fontSize: "13px",
                color: "#475569",
                fontStyle: "italic",
              }}
            >
              &ldquo;{replyModalReview.comment || "No comment left for this order."}&rdquo;
            </div>

            <form onSubmit={handleSendReply}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>
                Your Response:
              </label>
              <textarea
                required
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Thank you for your feedback! We're glad you enjoyed..."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #CBD5E1",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  resize: "vertical",
                  marginBottom: "20px",
                  outline: "none",
                }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setReplyModalReview(null)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    backgroundColor: "#FFFFFF",
                    color: "#64748B",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReply || !replyText.trim()}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#EA580C",
                    color: "#FFFFFF",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: submittingReply || !replyText.trim() ? "not-allowed" : "pointer",
                    opacity: submittingReply || !replyText.trim() ? 0.7 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Send size={14} />
                  <span>{submittingReply ? "Submitting..." : "Send Response"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
