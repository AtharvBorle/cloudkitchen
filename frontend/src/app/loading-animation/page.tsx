"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import DeliveryBoyLoader, {
  LoaderMode,
  LoaderSpeed,
  LoaderTheme,
} from "@/components/loading/DeliveryBoyLoader";
import styles from "./LoadingAnimationPage.module.css";
import {
  Play,
  Pause,
  RotateCcw,
  Sun,
  Sunset,
  Moon,
  Zap,
  Volume2,
  Maximize2,
  X,
  Sparkles,
  Layers,
  ArrowRight,
  Code,
  Flame,
  CheckCircle2,
} from "lucide-react";

export default function LoadingAnimationDemoPage() {
  const [mode, setMode] = useState<LoaderMode>("traverse");
  const [speed, setSpeed] = useState<LoaderSpeed>("normal");
  const [theme, setTheme] = useState<LoaderTheme>("day");
  const [progress, setProgress] = useState<number>(45);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [activeCodeTab, setActiveCodeTab] = useState<boolean>(false);

  const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-playing progress simulator
  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsAutoPlaying(false);
            setIsCompleted(true);
            return 100;
          }
          const increment = speed === "nitro" ? 4 : speed === "fast" ? 2.5 : 1.2;
          return Math.min(prev + increment, 100);
        });
      }, 50);
    } else {
      if (autoPlayIntervalRef.current) clearInterval(autoPlayIntervalRef.current);
    }

    return () => {
      if (autoPlayIntervalRef.current) clearInterval(autoPlayIntervalRef.current);
    };
  }, [isAutoPlaying, speed]);

  const handleStartSimulation = () => {
    setProgress(0);
    setIsCompleted(false);
    setMode("progress");
    setIsAutoPlaying(true);
  };

  const handleReset = () => {
    setIsAutoPlaying(false);
    setProgress(0);
    setIsCompleted(false);
  };

  const handleMilestone = (val: number) => {
    setIsAutoPlaying(false);
    setProgress(val);
    setMode("progress");
    if (val >= 100) setIsCompleted(true);
    else setIsCompleted(false);
  };

  return (
    <div className={styles.pageContainer}>
      {/* 1. TOP STICKY HEADER */}
      <header className={styles.topHeader}>
        <div className={styles.headerInner}>
          <div className={styles.brandCol}>
            <div className={styles.scooterBadgeIcon}>🛵</div>
            <div>
              <h1 className={styles.pageTitle}>Loading Page Animation Studio</h1>
              <p className={styles.pageSubtitle}>
                Live interactive testing & customization for the website delivery scooter loader
              </p>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.fullscreenBtn}
              onClick={() => setIsFullscreenModalOpen(true)}
            >
              <Maximize2 size={16} />
              <span>Full Page Preview</span>
            </button>
            <Link
              href="/"
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "#64748B",
                textDecoration: "none",
                padding: "8px 14px",
                borderRadius: "8px",
                background: "#F1F5F9",
              }}
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* 2. MAIN LAYOUT */}
      <main className={styles.mainLayout}>
        {/* LEFT COLUMN: LIVE STAGE */}
        <section className={styles.stageCard}>
          <div className={styles.stageHeader}>
            <div className={styles.stageTitle}>
              <Sparkles size={18} color="#FA6D6B" />
              <span>Live Stage Preview</span>
            </div>

            <div className={styles.stageControlsRow}>
              <button
                type="button"
                className={`${styles.iconBtn} ${isAutoPlaying ? styles.iconBtnActive : ""}`}
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                title={isAutoPlaying ? "Pause Animation" : "Play Animation"}
              >
                {isAutoPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={handleReset}
                title="Reset to 0%"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>

          {/* THE LOADER COMPONENT */}
          <DeliveryBoyLoader
            mode={mode}
            speed={speed}
            theme={theme}
            progress={progress}
            interactive={true}
            onComplete={() => setIsCompleted(true)}
          />

          {/* Quick interactive hint */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#F8FAFC",
              padding: "12px 16px",
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              fontSize: "13px",
              color: "#475569",
            }}
          >
            <span>💡 <strong>Pro Tip:</strong> Click directly on the delivery boy or scooter to make him honk and jump!</span>
            <button
              type="button"
              onClick={() => setActiveCodeTab(!activeCodeTab)}
              style={{
                background: "transparent",
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontWeight: "700",
                color: "var(--primary, #FA6D6B)",
                cursor: "pointer",
              }}
            >
              <Code size={14} />
              <span>{activeCodeTab ? "Hide Code" : "Show Code"}</span>
            </button>
          </div>

          {/* Optional Code Snippet View */}
          {activeCodeTab && (
            <div
              style={{
                background: "#0F172A",
                color: "#E2E8F0",
                padding: "16px 20px",
                borderRadius: "14px",
                fontSize: "12.5px",
                fontFamily: "monospace",
                lineHeight: "1.6",
                overflowX: "auto",
              }}
            >
              <div style={{ color: "#94A3B8", marginBottom: "8px" }}>// How to use this loader anywhere in the app:</div>
              <div style={{ color: "#38BDF8" }}>import DeliveryBoyLoader from &quot;@/components/loading/DeliveryBoyLoader&quot;;</div>
              <br />
              <div style={{ color: "#FDE047" }}>{`// 1. As a continuous running loader between pages`}</div>
              <div>{`<DeliveryBoyLoader mode="traverse" speed="normal" theme="day" />`}</div>
              <br />
              <div style={{ color: "#FDE047" }}>{`// 2. As an order progress / data loading indicator`}</div>
              <div>{`<DeliveryBoyLoader mode="progress" progress={loadPercent} theme="sunset" />`}</div>
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: CONTROL PANEL */}
        <section className={styles.controlPanelCard}>
          {/* Section A: Movement Mode */}
          <div className={styles.controlSection}>
            <span className={styles.sectionLabel}>
              <Layers size={14} /> Animation Movement Mode
            </span>
            <div className={styles.pillGrid}>
              <button
                type="button"
                className={`${styles.pillBtn} ${mode === "traverse" ? styles.pillBtnActive : ""}`}
                onClick={() => setMode("traverse")}
              >
                <span>🚀 Across Screen</span>
              </button>
              <button
                type="button"
                className={`${styles.pillBtn} ${mode === "progress" ? styles.pillBtnActive : ""}`}
                onClick={() => setMode("progress")}
              >
                <span>📊 Linked 0-100%</span>
              </button>
              <button
                type="button"
                className={`${styles.pillBtn} ${mode === "runner" ? styles.pillBtnActive : ""}`}
                onClick={() => setMode("runner")}
              >
                <span>🛣️ Highway Run</span>
              </button>
            </div>
          </div>

          {/* Section B: Speed Selection */}
          <div className={styles.controlSection}>
            <span className={styles.sectionLabel}>
              <Zap size={14} /> Driving Speed
            </span>
            <div className={styles.pillGrid}>
              <button
                type="button"
                className={`${styles.pillBtn} ${speed === "normal" ? styles.pillBtnActive : ""}`}
                onClick={() => setSpeed("normal")}
              >
                <span>Cruise (1x)</span>
              </button>
              <button
                type="button"
                className={`${styles.pillBtn} ${speed === "fast" ? styles.pillBtnActive : ""}`}
                onClick={() => setSpeed("fast")}
              >
                <span>Rush (2x)</span>
              </button>
              <button
                type="button"
                className={`${styles.pillBtn} ${speed === "nitro" ? styles.pillBtnActive : ""}`}
                onClick={() => setSpeed("nitro")}
              >
                <Flame size={14} color="#0284C7" />
                <span>Nitro (3x)</span>
              </button>
            </div>
          </div>

          {/* Section C: Theme / Time of Day */}
          <div className={styles.controlSection}>
            <span className={styles.sectionLabel}>
              <Sun size={14} /> Time of Day Atmosphere
            </span>
            <div className={styles.pillGrid}>
              <button
                type="button"
                className={`${styles.pillBtn} ${theme === "day" ? styles.pillBtnActive : ""}`}
                onClick={() => setTheme("day")}
              >
                <Sun size={14} color="#F59E0B" />
                <span>Daylight</span>
              </button>
              <button
                type="button"
                className={`${styles.pillBtn} ${theme === "sunset" ? styles.pillBtnActive : ""}`}
                onClick={() => setTheme("sunset")}
              >
                <Sunset size={14} color="#EA580C" />
                <span>Sunset</span>
              </button>
              <button
                type="button"
                className={`${styles.pillBtn} ${theme === "night" ? styles.pillBtnActive : ""}`}
                onClick={() => setTheme("night")}
              >
                <Moon size={14} color="#38BDF8" />
                <span>Midnight</span>
              </button>
            </div>
          </div>

          {/* Section D: Manual Progress Scrubber */}
          <div className={styles.controlSection}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className={styles.sectionLabel}>
                <span>Scrub Vehicle Position</span>
              </span>
              <span style={{ fontSize: "13px", fontWeight: "800", color: "#0F172A" }}>
                {Math.round(progress)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => {
                setProgress(Number(e.target.value));
                setMode("progress");
              }}
              className={styles.sliderTrack}
            />
          </div>

          {/* Section E: Delivery Lifecycle Milestones */}
          <div className={styles.controlSection}>
            <span className={styles.sectionLabel}>
              <CheckCircle2 size={14} /> Delivery Milestones
            </span>
            <div className={styles.milestonesGrid}>
              <button
                type="button"
                className={`${styles.milestoneBtn} ${progress >= 15 && progress < 45 ? styles.milestoneActive : ""}`}
                onClick={() => handleMilestone(20)}
              >
                <span>🍳 1. Kitchen Fired</span>
              </button>
              <button
                type="button"
                className={`${styles.milestoneBtn} ${progress >= 45 && progress < 70 ? styles.milestoneActive : ""}`}
                onClick={() => handleMilestone(50)}
              >
                <span>📦 2. Box Packed</span>
              </button>
              <button
                type="button"
                className={`${styles.milestoneBtn} ${progress >= 70 && progress < 100 ? styles.milestoneActive : ""}`}
                onClick={() => handleMilestone(80)}
              >
                <span>🛵 3. On Highway</span>
              </button>
              <button
                type="button"
                className={`${styles.milestoneBtn} ${progress >= 100 ? styles.milestoneActive : ""}`}
                onClick={() => handleMilestone(100)}
              >
                <span>🎉 4. Delivered!</span>
              </button>
            </div>
          </div>

          {/* Section F: Big Action Buttons */}
          <div className={styles.actionBtnsRow}>
            <button
              type="button"
              className={styles.simulateBtn}
              onClick={handleStartSimulation}
            >
              <Play size={16} />
              <span>Simulate Loading</span>
            </button>
            <button
              type="button"
              className={styles.honkActionBtn}
              onClick={() => {
                // Trigger honk on delivery boy via custom event or button
                const btn = document.querySelector(`.${styles.pageContainer} button[title*="Honk"]`) as HTMLButtonElement;
                if (btn) btn.click();
              }}
            >
              <Volume2 size={16} />
              <span>Honk Horn 📢</span>
            </button>
          </div>
        </section>
      </main>

      {/* 3. FULLPAGE PREVIEW MODAL */}
      {isFullscreenModalOpen && (
        <div className={styles.fullscreenModal}>
          <div className={styles.fullscreenModalContent}>
            <button
              type="button"
              className={styles.closeModalBtn}
              onClick={() => setIsFullscreenModalOpen(false)}
              aria-label="Close Preview"
            >
              <X size={20} />
            </button>
            <DeliveryBoyLoader
              mode={mode}
              speed={speed}
              theme={theme}
              progress={progress}
              fullscreen={false}
              interactive={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
