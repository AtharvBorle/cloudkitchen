"use client";

import React from "react";
import { Navbar } from "@/components/navbar";
import { ExploreHeroBanner } from "@/components/explore-desktop/explore-herobanner";
import { CloudKitchenReels } from "@/components/explore-desktop/cloudkitchen-reels";
import { FeaturedCollections } from "@/components/explore-desktop/featured-collections";
import { CuratedDiningCollections } from "@/components/explore-desktop/curated-dining-collections";
import { WhatsOnYourMind } from "@/components/explore-desktop/whats-on-your-mind";
import { Footer } from "@/components/explore-desktop/footer";
import { ExploreMobileView } from "@/components/explore-desktop/explore-mobile";
import styles from "./page.module.css";

export default function ExploreDesktopPage() {
  return (
    <div className={styles.pageContainer}>
      {/* 1. Desktop & Tablet View (>768px) */}
      <div className={styles.desktopOnly}>
        <Navbar initialActiveItem="Explore" />
        <main className={styles.desktopMain}>
          <ExploreHeroBanner />
          <CloudKitchenReels />
          <FeaturedCollections />
          <CuratedDiningCollections />
          <WhatsOnYourMind />
        </main>
        <Footer />
      </div>

      {/* 2. Mobile View (<=768px) matching exact mobile design */}
      <div className={styles.mobileOnly}>
        <ExploreMobileView />
      </div>
    </div>
  );
}
