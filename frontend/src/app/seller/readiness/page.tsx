"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ConsoleSidebar from "@/components/seller/sidebar/Sidebar";
import Topbar from "@/components/seller/nav/Topbar";
import { SellerReadinessChecklist } from "@/components/seller";
import styles from "@/components/seller/seller-dashboard/SellerDashboard.module.css";
import { fetchApi } from "@/lib/fetch-api";

export default function SellerReadinessPage() {
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [statusData, setStatusData] = useState<any>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetchApi("/api/seller/dashboard/status");
      if (res.ok) {
        const json = await res.json();
        setStatusData(json.data || json);
      }
    } catch (err) {
      console.error("Failed to load status:", err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className={styles.appContainer}>
      <ConsoleSidebar isMobileOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />

      <div className={styles.mainWrapper}>
        <Topbar
          onMenuToggle={() => setIsMobileOpen(true)}
          title="Onboarding Readiness"
        />

        <main className={styles.mainContent}>
          <SellerReadinessChecklist
            onCompleted={() => {
              router.push("/seller/dashboard");
            }}
          />
        </main>
      </div>
    </div>
  );
}
