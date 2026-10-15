import React from "react";
import type { Metadata } from "next";
import ManageMealTimingsCanvas from "@/components/seller/subscription/ManageMealTimingsCanvas";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage Meal Timings | Kitchen Operations",
  description: "Centralized configuration for 6 predefined meal subscription slots",
};

export default function ResMealTimingsPage() {
  return <ManageMealTimingsCanvas />;
}
