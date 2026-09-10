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
      formData.append("itemType", data.type === "Non-Veg" ? "NON_VEG" : "VEG");
      formData.append("stockQuantity", String(data.stockQty || 24));
      formData.append("isAvailable", String(data.isInStock));

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
        const res = await fetch(`/api/seller/menu/${itemId}`, {
          method: "PATCH",
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json();
          alert(err.message || "Failed to update item");
          return;
        }
      } else {
        const res = await fetch("/api/seller/menu", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json();
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

  return (
    <ResponsiveMenuItems
      key={initialData ? initialData.id : "new-item"}
      initialItemName={initialData?.name}
      initialPrice={initialData ? String(initialData.price) : undefined}
      initialCategory={initialData?.foodCategory?.name}
      initialType={initialData?.itemType === "NON_VEG" ? "Non-Veg" : "Veg"}
      initialDescription={initialData?.description}
      initialStockQty={initialData?.stockQuantity}
      initialIsInStock={initialData?.isAvailable}
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

