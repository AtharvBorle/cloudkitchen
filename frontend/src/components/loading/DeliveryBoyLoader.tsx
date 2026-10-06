"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./DeliveryBoyLoader.module.css";
import { Sparkles, CheckCircle2, Volume2, Flame } from "lucide-react";

export type LoaderTheme = "day" | "sunset" | "night";
export type LoaderSpeed = "normal" | "fast" | "nitro";
export type LoaderMode = "traverse" | "progress" | "runner";

export interface DeliveryBoyLoaderProps {
  progress?: number;
  mode?: LoaderMode;
  speed?: LoaderSpeed;
  theme?: LoaderTheme;
  statusText?: string;
  fullscreen?: boolean;
  onComplete?: () => void;
  interactive?: boolean;
}

const HONK_MESSAGES = [
  "Neo Cloud Bites on the way! 🛵💨",
  "Fresh & sizzling hot! 🍕🔥",
  "BEEP BEEP! Clear the lane! ⚡",
  "Speeding to your doorstep! 🚀",
  "Packed with love! 💖📦",
];

export const DeliveryBoyLoader: React.FC<DeliveryBoyLoaderProps> = ({
  progress = 45,
  mode = "traverse",
  speed = "normal",
  theme = "day",
  statusText,
  fullscreen = false,
  onComplete,
  interactive = true,
}) => {
  const [isWheelie, setIsWheelie] = useState(false);
  const [speechText, setSpeechText] = useState<string | null>(null);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [honkCount, setHonkCount] = useState(0);

  // Sound Synthesizer for scooter horn
  const playScooterHorn = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Dual-tone harmonic horn beep
      const createTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
        gain.gain.setValueAtTime(0.09, ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
      };

      // Double chirp "beep-beep!"
      createTone(440, 0, 0.1);
      createTone(554.37, 0, 0.1);
      createTone(440, 0.14, 0.1);
      createTone(554.37, 0.14, 0.1);
    } catch {
      // AudioContext blocked or silent environment
    }
  };

  const triggerHonk = () => {
    playScooterHorn();
    const nextMsg = HONK_MESSAGES[honkCount % HONK_MESSAGES.length];
    setSpeechText(nextMsg);
    setHonkCount((c) => c + 1);

    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    speechTimeoutRef.current = setTimeout(() => {
      setSpeechText(null);
    }, 2400);
  };

  const handleRiderClick = () => {
    if (!interactive) return;
    setIsWheelie(true);
    triggerHonk();
    setTimeout(() => {
      setIsWheelie(false);
    }, 850);
  };

  useEffect(() => {
    if (progress >= 100 && onComplete) {
      onComplete();
    }
  }, [progress, onComplete]);

  // Determine stage theme classes
  const themeClass =
    theme === "night"
      ? styles.themeNight
      : theme === "sunset"
      ? styles.themeSunset
      : styles.themeDay;

  // Speed class for traverser
  const speedClass =
    speed === "nitro"
      ? styles.speedNitro
      : speed === "fast"
      ? styles.speedFast
      : "";

  // Progress message default
  const defaultStatus =
    progress < 25
      ? "Cooking hot & fresh in kitchen... 🍳"
      : progress < 55
      ? "Packed securely in Neo Cloud Bites box... 📦"
      : progress < 90
      ? "Delivery partner speeding to your location... 🛵💨"
      : "Rider reaching your doorstep! 🔔";

  const displayStatus = statusText || defaultStatus;

  // Compute rider position for progress mode
  // Clamped between 2% and 82% to remain nicely inside the road container
  const progressLeft = Math.min(Math.max(progress * 0.8, 2), 82);

  return (
    <div
      className={`${styles.loaderWrapper} ${themeClass} ${
        fullscreen ? styles.fullscreenWrapper : ""
      }`}
    >
      {/* 1. SKY & PARALLAX BACKGROUND */}
      <div className={styles.skyStage}>
        {/* Sun / Moon */}
        <div
          className={`${styles.celestialBody} ${
            theme === "night"
              ? styles.moonGlow
              : theme === "sunset"
              ? styles.sunsetSun
              : styles.sunGlow
          }`}
        />

        {/* Floating Clouds */}
        <div className={styles.cloudLayer}>
          <div className={`${styles.cloudItem} ${styles.cloud1}`} />
          <div className={`${styles.cloudItem} ${styles.cloud2}`} />
          <div className={`${styles.cloudItem} ${styles.cloud3}`} />
        </div>

        {/* City Skyline */}
        <div
          className={`${styles.citySkyline} ${styles.citySkylineParallax}`}
          style={{
            backgroundImage: `radial-gradient(circle at 10px 10px, transparent 15px, rgba(15, 23, 42, 0.25) 15px),
              linear-gradient(to top, rgba(15, 23, 42, 0.4) 0%, transparent 100%)`,
          }}
        />

        {/* Target Destination Doorstep / House (Visible in Progress mode) */}
        {mode === "progress" && (
          <div className={styles.destinationPin}>
            <div className={styles.destinationHouse}>
              {progress >= 100 ? "🎉" : "🏠"}
            </div>
            <span className={styles.destinationLabel}>Your Doorstep</span>
          </div>
        )}

        {/* RIDER VEHICLE CONTAINER */}
        <div
          className={`${styles.riderAnchor} ${
            mode === "traverse" ? `${styles.riderMovingAcross} ${speedClass}` : ""
          }`}
          style={
            mode === "progress"
              ? { left: `${progressLeft}%`, transition: "left 0.4s ease-out" }
              : mode === "runner"
              ? { left: "30%" }
              : undefined
          }
          onClick={handleRiderClick}
          title="Click to honk & pop a jump!"
        >
          {/* Bobbing Engine vibration wrapper */}
          <div
            className={`${styles.riderBobbing} ${
              isWheelie ? styles.wheelieJump : ""
            }`}
          >
            {/* Interactive Speech Bubble */}
            {speechText && (
              <div className={styles.speechBubble}>{speechText}</div>
            )}

            {/* Scooter Headlight Beam */}
            <div className={styles.headlightBeam} />

            {/* Exhaust Smoke Particles */}
            <div className={styles.exhaustSmokeContainer}>
              <span className={`${styles.smokeParticle} ${styles.smoke1}`} />
              <span className={`${styles.smokeParticle} ${styles.smoke2}`} />
              <span className={`${styles.smokeParticle} ${styles.smoke3}`} />
              {speed === "nitro" && <span className={styles.nitroFire} />}
            </div>

            {/* Food Box Aroma Steam */}
            <div className={styles.foodAromaContainer}>
              <span className={`${styles.aromaItem} ${styles.aroma1}`}>🍕</span>
              <span className={`${styles.aromaItem} ${styles.aroma2}`}>♨️</span>
              <span className={`${styles.aromaItem} ${styles.aroma3}`}>✨</span>
            </div>

            {/* The Transparent Delivery Scooter Rider */}
            <Image
              src="/images/delivery-scooter-rider.png"
              alt="Neo Cloud Bites Delivery Scooter"
              width={240}
              height={240}
              priority
              className={styles.riderImage}
            />

            {/* Asphalt Contact Shadow */}
            <div className={styles.contactShadow} />
          </div>
        </div>
      </div>

      {/* 2. ROADWAY & ASPHALT */}
      <div className={styles.roadStage}>
        {/* Yellow-Black Curb strip */}
        <div className={styles.curbStrip} />
        {/* Scrolling white lane dashes */}
        <div
          className={`${styles.roadDashes} ${
            mode !== "progress" || progress < 100 ? styles.roadDashesActive : ""
          }`}
        />
      </div>

      {/* 3. STATUS & PROGRESS FOOTER */}
      <div className={styles.statusFooter}>
        <div className={styles.statusHeaderRow}>
          <div className={styles.statusTitle}>
            {progress >= 100 ? (
              <>
                <CheckCircle2 size={18} color="#10B981" />
                <span>Food Delivered Fresh & Hot!</span>
              </>
            ) : (
              <>
                <Sparkles size={16} color="#FA6D6B" />
                <span>{displayStatus}</span>
              </>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {speed === "nitro" && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "11px",
                  fontWeight: "800",
                  color: "#0284C7",
                  background: "#E0F2FE",
                  padding: "2px 8px",
                  borderRadius: "10px",
                }}
              >
                <Flame size={12} /> NITRO
              </span>
            )}
            <span className={styles.percentageBadge}>
              {Math.min(Math.round(progress), 100)}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className={styles.progressBarContainer}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
          >
            <div className={styles.progressBarGlow} />
          </div>
        </div>

        <div className={styles.statusSubtext}>
          <span>Tap delivery boy or honk horn to interact 🛵</span>
          {interactive && (
            <button
              type="button"
              onClick={triggerHonk}
              style={{
                background: "transparent",
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                color: "var(--primary, #FA6D6B)",
                fontWeight: "700",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              <Volume2 size={13} />
              <span>Honk Horn</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryBoyLoader;
