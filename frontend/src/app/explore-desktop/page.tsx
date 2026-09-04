"use client";

import React from "react";
import { Navbar } from "@/components/navbar";
import { ExploreHeroBanner } from "@/components/explore-desktop/explore-herobanner";
import { CloudKitchenReels } from "@/components/explore-desktop/cloudkitchen-reels";
import { FeaturedCollections } from "@/components/explore-desktop/featured-collections";
import { CuratedDiningCollections } from "@/components/explore-desktop/curated-dining-collections";
import { WhatsOnYourMind } from "@/components/explore-desktop/whats-on-your-mind";
import { Footer } from "@/components/explore-desktop/footer";

export default function ExploreDesktopPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fdfbf7", display: "flex", flexDirection: "column" }}>
      {/* 1. Shared Navbar with Explore Active */}
      <Navbar initialActiveItem="Explore" />

      <main style={{ maxWidth: "1400px", width: "100%", margin: "0 auto", padding: "28px 32px 64px 32px", boxSizing: "border-box", flex: 1 }}>
        {/* 2. Explore Hero Banner */}
        <ExploreHeroBanner />

        {/* 3. Cloud Kitchen Reels */}
        <CloudKitchenReels />

        {/* 4. Featured Collections (Video Recipes / Streams) */}
        <FeaturedCollections />

        {/* 5. Curated Dining Collections (8 Category Cards with Badges) */}
        <CuratedDiningCollections />

        {/* 6. What's on Your Mind? (8 Meal Moment Cards) */}
        <WhatsOnYourMind />
      </main>

      {/* 7. Explore Desktop Footer */}
      <Footer />
    </div>
  );
}
