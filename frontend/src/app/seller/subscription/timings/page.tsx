import React from "react";
import ManageMealTimingsCanvas from "@/components/seller/subscription/ManageMealTimingsCanvas";

export const metadata = {
  title: "Manage Meal Timings | Kitchen Operations",
  description: "Centralized configuration for 7 predefined meal subscription slots",
};

export default function MealTimingsPage() {
  return <ManageMealTimingsCanvas />;
}
