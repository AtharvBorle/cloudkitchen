"use client";

import React, { useState, useEffect, useMemo } from "react";
import ResponsiveMenu, {
  ResponsiveDishItem,
} from "@/components/seller/seller-menu/responsive/ResponsiveMenu";
import { fetchApi } from "@/lib/fetch-api";

export default function ResponsiveMenuPage() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMenu = async () => {
    try {
      const res = await fetchApi("/api/seller/menu");
      if (res.ok) {
        const data = await res.json();
        const list = data.data?.items || data.items || data.data || [];
        if (Array.isArray(list)) {
          setMenuItems(list);
        }
      }
    } catch (err) {
      console.error("Failed to load seller menu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const handleToggleAvailability = async (dishId: string, isAvailable: boolean) => {
    try {
      const formData = new FormData();
      formData.append("isAvailable", String(isAvailable));

      await fetchApi(`/api/seller/menu/${dishId}`, {
        method: "PATCH",
        body: formData,
      });

      setMenuItems((prev) =>
        prev.map((item) => (item.id === dishId ? { ...item, isAvailable } : item))
      );
    } catch (err) {
      console.error("Failed to toggle item availability:", err);
    }
  };

  const mappedDishes: ResponsiveDishItem[] | undefined = useMemo(() => {
    if (!menuItems || menuItems.length === 0) return undefined;
    return menuItems.map((item: any) => {
      let cat: "Starters" | "Mains" | "Desserts" | "Drinks" = "Mains";
      const catName = (item.foodCategory?.name || item.category?.name || "").toLowerCase();
      if (catName.includes("starter") || catName.includes("snack")) cat = "Starters";
      else if (catName.includes("dessert") || catName.includes("sweet")) cat = "Desserts";
      else if (catName.includes("drink") || catName.includes("beverage")) cat = "Drinks";

      const rawTypes = String(item.itemType || "VEG").split(",").map((s: string) => s.trim().toUpperCase());
      let parsedTypes: Array<"VEG" | "NON-VEG" | "JAIN" | "VEGAN"> = [];
      if (rawTypes.includes("NON_VEG") || rawTypes.includes("NON-VEG") || rawTypes.includes("NON VEG")) {
        parsedTypes = ["NON-VEG"];
      } else {
        if (rawTypes.includes("VEG")) parsedTypes.push("VEG");
        if (rawTypes.includes("VEGAN")) parsedTypes.push("VEGAN");
        if (rawTypes.includes("JAIN")) parsedTypes.push("JAIN");
        if (parsedTypes.length === 0) parsedTypes = ["VEG"];
      }

      return {
        id: item.id,
        name: item.name,
        price: `₹${item.price}`,
        category: cat,
        types: parsedTypes,
        stockQty: item.stockQuantity >= 0 ? item.stockQuantity : 24,
        isAvailable: item.isAvailable ?? true,
        imageUrl: item.imageUrl || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=150&auto=format&fit=crop&q=80",
      };
    });
  }, [menuItems]);

  return (
    <ResponsiveMenu
      dishes={mappedDishes}
      onToggleAvailability={handleToggleAvailability}
    />
  );
}


