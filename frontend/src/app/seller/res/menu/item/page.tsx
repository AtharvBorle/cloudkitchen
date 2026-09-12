"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ResponsiveMenuItems from "@/components/seller/seller-menu/responsive/ResponsiveMenuItems";
import { fetchApi } from "@/lib/fetch-api";

function MenuItemContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemId = searchParams.get("id");
  const [categories, setCategories] = useState<any[]>([]);
  const [initialData, setInitialData] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetchApi("/api/seller/menu");
        if (res.ok) {
          const menuData = await res.json();
          const dataPayload = menuData.data || menuData;
          if (dataPayload.foodCategories) {
            setCategories(dataPayload.foodCategories);
          }
          if (itemId && dataPayload.items) {
            const found = dataPayload.items.find((it: any) => it.id === itemId);
            if (found) {
              setInitialData(found);
            }
          }
        }
      } catch (err) {
        console.error("Error loading menu item metadata:", err);
      }
    }
    loadData();
  }, [itemId]);

  const handleSave = async (data: any) => {
    try {
      const formData = new FormData();
      formData.append("name", data.itemName);
      formData.append("price", data.price);
      formData.append("description", data.description || "");

      let itemType = "VEG";
      const types = data.selectedFoodTypes || (data.type ? [data.type] : ["Veg"]);
      if (types.includes("Non-Veg") || types.includes("Non Veg") || types.includes("NON_VEG")) {
        itemType = "NON_VEG";
      } else {
        const mappedList: string[] = [];
        if (types.includes("Veg")) mappedList.push("VEG");
        if (types.includes("Vegan")) mappedList.push("VEGAN");
        if (types.includes("Jain")) mappedList.push("JAIN");
        itemType = mappedList.length > 0 ? mappedList.join(",") : "VEG";
      }
      formData.append("itemType", itemType);

      formData.append("stockQuantity", String(data.stockQty || 24));
      formData.append("isAvailable", String(data.isInStock));

      if (data.variants && Array.isArray(data.variants)) {
        const validVariants = data.variants
          .filter((v: any) => v.name && v.name.trim().length > 0)
          .map((v: any) => ({
            id: v.id,
            name: v.name.trim(),
            price: Number(v.price) || Number(data.price) || 0
          }));
        formData.append("variants", JSON.stringify(validVariants));
      }

      let foodCatId = categories[0]?.id || "";
      if (data.category && categories.length > 0) {
        const matched = categories.find(
          (c) => c.name.toLowerCase() === data.category.toLowerCase()
        );
        if (matched) foodCatId = matched.id;
      }
      if (foodCatId) {
        formData.append("foodCategoryId", foodCatId);
      }

      if (data.imageFile) {
        formData.append("image", data.imageFile);
      }

      if (itemId) {
        const res = await fetchApi(`/api/seller/menu/${itemId}`, {
          method: "PATCH",
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          alert(err.message || "Failed to update item");
          return;
        }
      } else {
        const res = await fetchApi("/api/seller/menu", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          alert(err.message || "Failed to create item");
          return;
        }
      }
      router.push("/seller/menu");
    } catch (err: any) {
      console.error("Error saving menu item:", err);
      alert(err.message || "Error saving menu item");
    }
  };

  let parsedVariants: any[] = [];
  if (initialData?.variants) {
    try {
      const p = typeof initialData.variants === "string" ? JSON.parse(initialData.variants) : initialData.variants;
      if (Array.isArray(p)) {
        parsedVariants = p.map((v: any, idx: number) => ({
          id: v.id || String(idx + 1),
          name: v.name || "",
          price: String(v.price ?? "")
        }));
      }
    } catch {}
  }

  const parsedFoodTypes: string[] = (() => {
    if (!initialData?.itemType) return ["Veg"];
    const raw = String(initialData.itemType).split(",").map((s: string) => s.trim().toUpperCase());
    if (raw.includes("NON_VEG") || raw.includes("NON-VEG") || raw.includes("NON VEG")) {
      return ["Non-Veg"];
    }
    const res: string[] = [];
    if (raw.includes("VEG")) res.push("Veg");
    if (raw.includes("VEGAN")) res.push("Vegan");
    if (raw.includes("JAIN")) res.push("Jain");
    return res.length > 0 ? res : ["Veg"];
  })();

  const mappedType = parsedFoodTypes[0] || "Veg";

  return (
    <ResponsiveMenuItems
      key={initialData ? initialData.id : "new-item"}
      initialItemName={initialData?.name}
      initialPrice={initialData ? String(initialData.price) : undefined}
      initialCategory={initialData?.foodCategory?.name}
      initialType={mappedType}
      initialSelectedFoodTypes={parsedFoodTypes}
      initialDescription={initialData?.description}
      initialStockQty={initialData?.stockQuantity}
      initialIsInStock={initialData?.isAvailable}
      initialVariants={parsedVariants}
      initialImageUrl={initialData?.imageUrl}
      onSave={handleSave}
    />
  );
}

export default function ResponsiveMenuItemPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 24, textAlign: "center", color: "#64748B" }}>
          Loading Menu Item...
        </div>
      }
    >
      <MenuItemContent />
    </Suspense>
  );
}

