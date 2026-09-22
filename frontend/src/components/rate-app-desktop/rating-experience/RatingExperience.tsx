"use client";

import React, { useState } from "react";
import { Star, CheckCircle2, Send, ThumbsUp, Heart, MessageSquare, Utensils, Clock } from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";
import { broadcastReviewAlert } from "@/hooks/useSellerNotifications";
import styles from "./RatingExperience.module.css";

const SENTIMENT_LABELS: Record<number, string> = {
  1: "Needs Improvement",
  2: "Fair Experience",
  3: "Good & Satisfying",
  4: "Great Experience!",
  5: "Loved It! Outstanding 🌟",
};

const ASPECT_OPTIONS = [
  "Food Taste & Quality",
  "Delivery Speed",
  "Packaging Quality",
  "Meal Subscriptions",
  "Room Booking Comfort",
  "Customer Support",
  "App Usability & Speed",
];

const QUICK_TAGS = [
  "Delicious Meals",
  "Super Fast Delivery",
  "Fresh Ingredients",
  "Affordable Pricing",
  "Friendly Riders",
  "Easy Navigation",
  "Clean PG Rooms",
];

interface UserReview {
  id: string;
  rating: number;
  comment?: string;
  aspects: string[];
  tags: string[];
  sentiment?: string;
  createdAt: string;
  seller?: {
    id: string;
    businessName: string;
  };
  managerResponse?: {
    text: string;
    date: string;
  };
}

export const RatingExperience: React.FC = () => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [selectedAspects, setSelectedAspects] = useState<string[]>([
    "Food Taste & Quality",
    "Delivery Speed",
  ]);
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackHistory, setFeedbackHistory] = useState<UserReview[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  const activeRating = hoverRating !== null ? hoverRating : rating;

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetchApi("/api/user/rate-app");
      if (res.ok) {
        const json = await res.json();
        const list = json.data?.reviews || json.reviews || [];
        setFeedbackHistory(list);
      }
    } catch (err) {
      console.error("Failed to load feedback history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  React.useEffect(() => {
    loadHistory();
  }, []);

  const toggleAspect = (aspect: string) => {
    setSelectedAspects((prev) =>
      prev.includes(aspect)
        ? prev.filter((item) => item !== aspect)
        : [...prev, aspect]
    );
  };

  const addQuickTag = (tag: string) => {
    setFeedbackText((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return tag;
      if (trimmed.includes(tag)) return trimmed;
      return `${trimmed}, ${tag}`;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Collect quick tags that are in feedbackText or selected
      const detectedTags = QUICK_TAGS.filter((t) => feedbackText.includes(t));

      const response = await fetchApi("/api/user/rate-app", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          aspects: selectedAspects,
          tags: detectedTags,
          comment: feedbackText,
          sentiment: SENTIMENT_LABELS[rating] || "Good & Satisfying",
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || "Failed to submit review. Please try again.");
      }

      try {
        broadcastReviewAlert({
          customerName: "Customer",
          rating,
          comment: feedbackText,
        });
      } catch {}

      setIsSubmitted(true);
      loadHistory();
    } catch (err: any) {
      console.error("Error submitting rating:", err);
      setErrorMessage(err.message || "Something went wrong while submitting your feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setRating(5);
    setFeedbackText("");
    setSelectedAspects(["Food Taste & Quality", "Delivery Speed"]);
    setErrorMessage(null);
    loadHistory();
  };

  return (
    <div className={styles.container}>
      <div className={styles.mainCard}>
        {isSubmitted ? (
          <div className={styles.thankYouBox}>
            <div className={styles.checkIconCircle}>
              <CheckCircle2 size={36} strokeWidth={2.5} />
            </div>
            <h2 className={styles.thankYouTitle}>Thank You for Your Feedback!</h2>
            <p className={styles.thankYouText}>
              Your rating and suggestions have been recorded. Every review helps our chefs cook better meals, speed up deliveries, and improve our services!
            </p>
            <button
              type="button"
              className={styles.resetBtn}
              onClick={handleReset}
            >
              Submit Another Review
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* 1. Star Rating Hero */}
            <div className={styles.ratingHero}>
              <h2 className={styles.heroTitle}>How was your overall experience?</h2>
              <p className={styles.heroSubtitle}>
                Tap a star to rate Neo Cloud Bites
              </p>

              <div className={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const isFilled = starVal <= activeRating;
                  return (
                    <button
                      key={starVal}
                      type="button"
                      className={styles.starBtn}
                      onClick={() => setRating(starVal)}
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(null)}
                      aria-label={`${starVal} Star`}
                    >
                      <Star
                        size={36}
                        fill={isFilled ? "#FF5500" : "transparent"}
                        color={isFilled ? "#FF5500" : "#CBD5E1"}
                        strokeWidth={1.8}
                      />
                    </button>
                  );
                })}
              </div>

              <div className={styles.sentimentBadge}>
                <span>{SENTIMENT_LABELS[activeRating] || "Select a rating"}</span>
              </div>
            </div>

            {/* 2. Aspects / Categories of Experience */}
            <div className={styles.aspectsSection}>
              <h3 className={styles.sectionLabel}>What did you like most?</h3>
              <div className={styles.aspectsPills}>
                {ASPECT_OPTIONS.map((aspect) => {
                  const isSelected = selectedAspects.includes(aspect);
                  return (
                    <button
                      key={aspect}
                      type="button"
                      className={`${styles.aspectPill} ${
                        isSelected ? styles.aspectPillActive : ""
                      }`}
                      onClick={() => toggleAspect(aspect)}
                    >
                      {aspect}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Quick Compliment Tags */}
            <div className={styles.quickTagsSection}>
              <h3 className={styles.sectionLabel}>Quick Feedback Tags</h3>
              <div className={styles.quickTagsRow}>
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={styles.quickTag}
                    onClick={() => addQuickTag(tag)}
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Detailed Feedback Textarea */}
            <div className={styles.feedbackInputSection}>
              <h3 className={styles.sectionLabel}>Tell us more (Optional)</h3>
              <textarea
                placeholder="What can we do to make your dining or stay experience even better?..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className={styles.feedbackTextarea}
                rows={4}
              />
            </div>

            {errorMessage && (
              <div style={{ color: "#EF4444", fontSize: "0.875rem", marginBottom: "1rem", fontWeight: 500 }}>
                {errorMessage}
              </div>
            )}

            {/* 5. Submit Action Button */}
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              <Send size={18} />
              <span>{isSubmitting ? "Submitting Review..." : "Submit Rating & Review"}</span>
            </button>
          </form>
        )}
      </div>

      {/* 6. Past Feedback & Kitchen Responses History */}
      {feedbackHistory.length > 0 && (
        <div className={styles.historyCard}>
          <div className={styles.historyHeader}>
            <h3 className={styles.historyTitle}>
              <MessageSquare size={20} color="#FF5500" />
              <span>Your Feedback &amp; Kitchen Responses</span>
            </h3>
            <span className={styles.historyCountBadge}>
              {feedbackHistory.length} {feedbackHistory.length === 1 ? "Review" : "Reviews"}
            </span>
          </div>

          <div className={styles.historyList}>
            {feedbackHistory.map((rev) => (
              <div key={rev.id} className={styles.historyItem}>
                <div className={styles.historyTop}>
                  <div className={styles.starsAndSentiment}>
                    <div className={styles.historyStarsRow}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={15}
                          fill={s <= rev.rating ? "#FF5500" : "none"}
                          color={s <= rev.rating ? "#FF5500" : "#CBD5E1"}
                        />
                      ))}
                    </div>
                    {rev.sentiment && (
                      <span className={styles.historySentimentPill}>{rev.sentiment}</span>
                    )}
                    {rev.seller?.businessName && (
                      <span className={styles.kitchenPill}>
                        <Utensils size={12} />
                        <span>{rev.seller.businessName}</span>
                      </span>
                    )}
                  </div>
                  <span className={styles.historyDate}>
                    {new Date(rev.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {rev.comment && <div className={styles.historyComment}>"{rev.comment}"</div>}

                {((rev.aspects && rev.aspects.length > 0) || (rev.tags && rev.tags.length > 0)) && (
                  <div className={styles.historyPillsRow}>
                    {rev.aspects?.map((asp, i) => (
                      <span key={`h-asp-${i}`} className={styles.historyAspectPill}>
                        ✓ {asp}
                      </span>
                    ))}
                    {rev.tags?.map((tg, i) => (
                      <span key={`h-tag-${i}`} className={styles.historyTagPill}>
                        ★ {tg}
                      </span>
                    ))}
                  </div>
                )}

                {/* Verified Kitchen Response or Status */}
                {rev.managerResponse ? (
                  <div className={styles.managerResponseBox}>
                    <div className={styles.managerResponseHeader}>
                      <span className={styles.managerResponseTitle}>
                        <CheckCircle2 size={15} color="#EA580C" />
                        <span>Verified Kitchen / Chef Response</span>
                      </span>
                      <span className={styles.managerResponseDate}>
                        {new Date(rev.managerResponse.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <p className={styles.managerResponseText}>{rev.managerResponse.text}</p>
                  </div>
                ) : (
                  <div className={styles.awaitingResponseBadge}>
                    <Clock size={13} />
                    <span>Delivered to Kitchen • Awaiting chef response</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Community Stats Highlights */}
      <div className={styles.statsCard}>
        <div className={styles.statBlock}>
          <span className={styles.statNumber}>4.9 / 5</span>
          <span className={styles.statLabel}>Average Customer Rating</span>
        </div>
        <div className={styles.statBlock}>
          <span className={styles.statNumber}>15,000+</span>
          <span className={styles.statLabel}>Happy Meal Subscribers</span>
        </div>
        <div className={styles.statBlock}>
          <span className={styles.statNumber}>98.4%</span>
          <span className={styles.statLabel}>On-Time Doorstep Delivery</span>
        </div>
      </div>
    </div>
  );
};

export default RatingExperience;
