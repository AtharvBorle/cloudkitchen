"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ExploreMealPlansRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/my-subscriptions-desktop?tab=plans");
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFF4E6",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <Loader2 size={36} className="animate-spin" color="#FF5500" style={{ margin: "0 auto 12px" }} />
        <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0F172A" }}>
          Redirecting to Subscription Plans...
        </div>
      </div>
    </div>
  );
}
