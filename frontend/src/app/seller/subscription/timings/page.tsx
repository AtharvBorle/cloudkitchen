import React from "react";
import ManageMealTimingsCanvas from "@/components/seller/subscription/ManageMealTimingsCanvas";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manage Meal Timings | Kitchen Operations",
  description: "Centralized configuration for 6 predefined meal subscription slots",
};

export default function MealTimingsPage() {
  return <ManageMealTimingsCanvas />;
}
