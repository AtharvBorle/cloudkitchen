"use client";

import React, { useState, useRef, useEffect } from "react";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Camera,
  Heart,
  Share2,
  CheckCircle2,
  Music,
  X,
  Store,
} from "lucide-react";
import styles from "./ReelModal.module.css";

export interface ReelModalData {
  id: string;
  author: string;
  authorAvatar: StaticImageData | string;
  thumbnail: StaticImageData | string;
  videoUrl?: string;
  caption: string;
  hashtags?: string;
  partnerTitle?: string;
  views?: string;
  likes?: string;
  audioTitle?: string;
  verified?: boolean;
  kitchenId?: string;
}

interface ReelModalProps {
  isOpen: boolean;
  onClose: () => void;
  reel: ReelModalData | null;
  onNext?: () => void;
  onPrev?: () => void;
}

export const ReelModal: React.FC<ReelModalProps> = ({
  isOpen,
  onClose,
  reel,
  onNext,
  onPrev,
}) => {
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isFollowed, setIsFollowed] = useState<boolean>(false);
  const touchStartY = useRef<number | null>(null);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if ((e.key === "ArrowDown" || e.key === "ArrowRight") && onNext) {
        onNext();
      } else if ((e.key === "ArrowUp" || e.key === "ArrowLeft") && onPrev) {
        onPrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onNext, onPrev]);

  if (!isOpen || !reel) return null;

  const handleLikeToggle = () => {
    setIsLiked((prev) => !prev);
  };

  const handleFollowToggle = () => {
    setIsFollowed((prev) => !prev);
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: reel.caption,
          text: `Check out ${reel.author}'s reel on Cloud Kitchen!`,
          url: window.location.href,
        });
      } catch {
        // Share cancelled
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const endY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - endY;
    if (diff > 50 && onNext) {
      // Swiped up -> Next Reel
      onNext();
    } else if (diff < -50 && onPrev) {
      // Swiped down -> Previous Reel
      onPrev();
    }
    touchStartY.current = null;
  };

  return (
    <div
      className={styles.modalContainer}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Desktop Close Button */}
      <button
        type="button"
        className={styles.desktopCloseBtn}
        onClick={onClose}
        aria-label="Close Reel Modal"
      >
        <X size={24} />
      </button>

      {/* Desktop Previous Button */}
      {onPrev && (
        <button
          type="button"
          className={styles.desktopNavPrev}
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          aria-label="Previous Reel"
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {/* Desktop Next Button */}
      {onNext && (
        <button
          type="button"
          className={styles.desktopNavNext}
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          aria-label="Next Reel"
        >
          <ChevronRight size={28} />
        </button>
      )}

      {/* Centered Reel Phone / Player Frame */}
      <div
        className={styles.reelFrame}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background Media: Video or Full-Bleed Image */}
        <div className={styles.mediaWrapper}>
          {reel.videoUrl ? (
            <video
              src={reel.videoUrl}
              autoPlay
              loop
              muted
              playsInline
              className={styles.fullscreenVideo}
            />
          ) : (
            <Image
              src={reel.thumbnail}
              alt={reel.caption}
              fill
              priority
              className={styles.fullscreenImage}
            />
          )}
        </div>

        {/* Top & Bottom Dark Overlay Gradients */}
        <div className={styles.topGradient} />
        <div className={styles.bottomGradient} />

        {/* 1. Top Navigation Bar */}
        <header className={styles.topBar}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={onClose}
            aria-label="Back to Explore"
          >
            <ChevronLeft size={22} color="#FFFFFF" strokeWidth={2.4} />
          </button>

          <h2 className={styles.reelsTitle}>Reels</h2>

          <button
            type="button"
            className={styles.cameraBtn}
            aria-label="Open camera"
          >
            <Camera size={22} color="#FFFFFF" strokeWidth={2} />
          </button>
        </header>

        {/* 2. Main Center / Action Rail & Creator Info */}
        <main className={styles.contentArea}>
          {/* Right Action Rail (Like, Share) */}
          <div className={styles.rightActionsRail}>
            {/* Like Button */}
            <div className={styles.actionBtnGroup}>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={handleLikeToggle}
                aria-label="Like reel"
              >
                <Heart
                  size={26}
                  color={isLiked ? "#EF4444" : "#FFFFFF"}
                  fill={isLiked ? "#EF4444" : "rgba(0, 0, 0, 0.2)"}
                  strokeWidth={2}
                />
              </button>
              <span className={styles.actionLabel}>
                {reel.likes || (isLiked ? "2.5k" : "2.4k")}
              </span>
            </div>

            {/* Share Button */}
            <div className={styles.actionBtnGroup}>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={handleShare}
                aria-label="Share reel"
              >
                <Share2 size={24} color="#FFFFFF" strokeWidth={2} />
              </button>
              <span className={styles.actionLabel}>Share</span>
            </div>
          </div>

          {/* Bottom Information Box */}
          <div className={styles.bottomInfoBox}>
            {/* Creator Profile Row */}
            <div className={styles.creatorRow}>
              <div className={styles.creatorAvatarWrapper}>
                <Image
                  src={reel.authorAvatar}
                  alt={reel.author}
                  fill
                  className={styles.fullscreenImage}
                />
              </div>

              <div className={styles.creatorInfoCol}>
                <div className={styles.nameRow}>
                  <h3 className={styles.creatorName}>{reel.author}</h3>
                  <CheckCircle2 size={15} color="#3B82F6" fill="#3B82F6" />
                  <button
                    type="button"
                    className={`${styles.followBtn} ${
                      isFollowed
                        ? styles.followBtnFollowed
                        : styles.followBtnUnfollowed
                    }`}
                    onClick={handleFollowToggle}
                  >
                    {isFollowed ? "Following" : "Follow"}
                  </button>
                </div>
                <span className={styles.partnerBadge}>
                  {reel.partnerTitle || "Cloud Kitchen Partner"}
                </span>
              </div>
            </div>

            {/* Caption & Hashtags */}
            <div className={styles.captionCol}>
              <p className={styles.captionText}>{reel.caption}</p>
              {reel.hashtags && (
                <p className={styles.hashtagText}>{reel.hashtags}</p>
              )}
            </div>

            {/* Audio Tag */}
            <div className={styles.audioRow}>
              <Music size={14} color="#FFFFFF" />
              <span className={styles.audioText}>
                {reel.audioTitle || `${reel.author} • Original Audio`}
              </span>
            </div>

            {/* Direct Link to Kitchen Page if available */}
            {reel.kitchenId && (
              <Link
                href={
                  reel.kitchenId.startsWith("SHOP-") || reel.kitchenId.startsWith("shop-")
                    ? `/shop/${reel.kitchenId}`
                    : `/restaurant/${reel.kitchenId}`
                }
                className={styles.visitKitchenBtn}
                onClick={(e) => e.stopPropagation()}
              >
                <Store size={14} />
                <span>Visit Kitchen &amp; Order</span>
              </Link>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReelModal;
