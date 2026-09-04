"use client";

import React from "react";
import { Navbar } from "@/components/navbar";
import { FoodHeroBanner } from "@/components/restaurant-desktop/foodherobanner";
import { SubscriptionPlans } from "@/components/restaurant-desktop/subscriptionplans";
import { PopularFood } from "@/components/restaurant-desktop/popularfood";
import styles from "./restaurant.module.css";

export default function RestaurantPage() {
  return (
    <div className={styles.container}>
      {/* 1. Shared Desktop Navbar Component */}
      <Navbar
        navItems={["Food", "Mess/Tiffin", "Rooms", "Settings"]}
        initialActiveItem="Food"
      />

      <main className={styles.mainContent}>
        {/* 2. Food Hero Banner Component */}
        <FoodHeroBanner />

        {/* 3. Weekly Subscription Plans Section */}
        <SubscriptionPlans />

        {/* 4. Popular Pizzas & Sides Section Header & Category Tabs */}
        <PopularFood />
      </main>
    </div>
  );
}
