"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Plus,
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";
import CreateAddonModal from "./CreateAddonModal";
import type { AddonItemData } from "./SellerAddonsManager";
import styles from "./DishAddonsSelector.module.css";

export interface SelectedAddonItem {
  id: string;
  name: string;
  price: number | string;
  stockQuantity?: number;
  isActive?: boolean;
}

export interface DishAddonsSelectorProps {
  selectedAddons: SelectedAddonItem[];
  onChange: (updated: SelectedAddonItem[]) => void;
  title?: string;
  subtitle?: string;
}

export default function DishAddonsSelector({
  selectedAddons = [],
  onChange,
  title = "Dish Add-Ons",
  subtitle = "Choose extra accompaniments, breads, or sides with their own inventory",
}: DishAddonsSelectorProps) {
  const [availableAddons, setAvailableAddons] = useState<AddonItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Fetch all seller's add-ons from inventory
  const loadAvailableAddons = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetchApi(`/api/seller/addons?limit=All&t=${Date.now()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        const list: AddonItemData[] = data.addons || [];
        setAvailableAddons((prev) => {
          const map = new Map<string, AddonItemData>();
          // Put items from backend in map
          list.forEach((item) => map.set(item.id, item));
          // Preserve any newly created items that may not have propagated yet
          prev.forEach((item) => {
            if (!map.has(item.id)) {
              map.set(item.id, item);
            }
          });
          return Array.from(map.values());
        });
      }
    } catch (err) {
      console.error("Failed to load seller add-ons for menu item:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAvailableAddons();
  }, [loadAvailableAddons]);

  // Filter add-ons by search query
  const filteredAddons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return availableAddons;
    return availableAddons.filter((a) => {
      const matchName = a.name.toLowerCase().includes(q);
      const matchDesc = (a.description || "").toLowerCase().includes(q);
      return matchName || matchDesc;
    });
  }, [availableAddons, searchQuery]);

  // Check if an addon is selected
  const isSelected = (addon: AddonItemData | SelectedAddonItem) => {
    if (!addon) return false;
    return (selectedAddons || []).some(
      (s) =>
        (s.id && addon.id && s.id === addon.id) ||
        (s.name &&
          addon.name &&
          s.name.trim().toLowerCase() === addon.name.trim().toLowerCase())
    );
  };

  // Toggle selection
  const handleToggleAddon = (addon: AddonItemData) => {
    const alreadySelected = isSelected(addon);
    if (alreadySelected) {
      const updated = (selectedAddons || []).filter(
        (s) =>
          !(
            (s.id && addon.id && s.id === addon.id) ||
            (s.name &&
              addon.name &&
              s.name.trim().toLowerCase() === addon.name.trim().toLowerCase())
          )
      );
      onChange(updated);
    } else {
      const newItem: SelectedAddonItem = {
        id: addon.id,
        name: addon.name,
        price: addon.price,
        stockQuantity: addon.stockQuantity,
        isActive: addon.isActive,
      };
      onChange([...(selectedAddons || []), newItem]);
    }
  };

  // Remove selected item by chip
  const handleRemoveSelected = (item: SelectedAddonItem) => {
    const updated = (selectedAddons || []).filter(
      (s) =>
        !(
          (s.id && item.id && s.id === item.id) ||
          (s.name &&
            item.name &&
            s.name.trim().toLowerCase() === item.name.trim().toLowerCase())
        )
    );
    onChange(updated);
  };

  // Callback when a brand-new add-on is created in the modal
  const handleAddonCreated = (newAddon: AddonItemData) => {
    // 1. Reset search query so newly created add-on is instantly visible
    setSearchQuery("");

    // 2. Prepend to available add-ons
    setAvailableAddons((prev) => {
      const filtered = prev.filter(
        (a) =>
          a.id !== newAddon.id &&
          a.name.trim().toLowerCase() !== newAddon.name.trim().toLowerCase()
      );
      return [newAddon, ...filtered];
    });

    // 3. Immediately select newly created add-on for this dish
    const newItem: SelectedAddonItem = {
      id: newAddon.id,
      name: newAddon.name,
      price: newAddon.price,
      stockQuantity: newAddon.stockQuantity,
      isActive: newAddon.isActive,
    };

    const withoutOld = (selectedAddons || []).filter(
      (s) =>
        !(
          (s.id && newAddon.id && s.id === newAddon.id) ||
          (s.name &&
            newAddon.name &&
            s.name.trim().toLowerCase() === newAddon.name.trim().toLowerCase())
        )
    );
    onChange([...withoutOld, newItem]);

    // 4. Show confirmation feedback
    setFeedbackMsg(`"${newAddon.name}" created and added to dish!`);
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4000);

    // 5. Silent refresh from backend
    loadAvailableAddons(true);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h3 className={styles.title}>
            <span>{title}</span>
            <span style={{ fontSize: "0.82rem", fontWeight: 400, color: "#64748B" }}>
              (Optional)
            </span>
          </h3>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        {selectedAddons.length > 0 && (
          <span className={styles.selectedCountBadge}>
            <Sparkles size={13} />
            <span>
              {selectedAddons.length} Add-on
              {selectedAddons.length > 1 ? "s" : ""} Selected
            </span>
          </span>
        )}
      </div>

      {/* Toolbar: Search + Create Add-on Button */}
      <div className={styles.toolbar}>
        <div className={styles.searchInputWrapper}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search seller add-ons by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className={styles.createBtn}
          title="Create a new add-on with its own inventory"
        >
          <Plus size={15} strokeWidth={2.8} />
          <span>Add New Add-on</span>
        </button>
      </div>

      {/* Instant Action Feedback */}
      {feedbackMsg && (
        <div className={styles.successAlert}>
          <CheckCircle2 size={16} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Selected Add-ons Chip Strip */}
      {selectedAddons.length > 0 && (
        <div className={styles.selectedChipsStrip}>
          <span className={styles.selectedChipLabel}>Selected:</span>
          {selectedAddons.map((item) => (
            <div key={item.id || item.name} className={styles.selectedChip}>
              <span>{item.name}</span>
              <span className={styles.selectedChipPrice}>
                +₹{Number(item.price) || 0}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveSelected(item);
                }}
                className={styles.removeChipBtn}
                title="Remove from dish"
                aria-label={`Remove ${item.name}`}
              >
                <X size={12} strokeWidth={2.6} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add-ons List */}
      {loading ? (
        <div className={styles.loadingSpinner}>
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : availableAddons.length === 0 ? (
        <div className={styles.emptyState}>
          <Package size={28} color="#FF6B00" />
          <p className={styles.emptyTitle}>No Add-ons Created Yet</p>
          <p className={styles.emptySubtitle}>
            Create your first add-on (e.g. Extra Roti, Dahi, Rice, Butter) to offer
            alongside this dish.
          </p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className={styles.createBtn}
            style={{ marginTop: "4px" }}
          >
            <Plus size={15} strokeWidth={2.8} />
            <span>Create Add-on Now</span>
          </button>
        </div>
      ) : filteredAddons.length === 0 ? (
        <div className={styles.emptyState}>
          <Search size={22} color="#94A3B8" />
          <p className={styles.emptyTitle}>
            No add-ons matching &quot;{searchQuery}&quot;
          </p>
          <p className={styles.emptySubtitle}>
            Want to offer &quot;{searchQuery}&quot;? Click below to create it right away.
          </p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className={styles.createBtn}
            style={{ marginTop: "4px" }}
          >
            <Plus size={15} strokeWidth={2.8} />
            <span>Create &quot;{searchQuery}&quot;</span>
          </button>
        </div>
      ) : (
        <div className={styles.addonsListContainer}>
          {filteredAddons.map((addon) => {
            const selected = isSelected(addon);

            return (
              <div
                key={addon.id}
                onClick={() => handleToggleAddon(addon)}
                className={`${styles.addonRow} ${
                  selected ? styles.addonRowSelected : ""
                }`}
                role="checkbox"
                aria-checked={selected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleToggleAddon(addon);
                  }
                }}
              >
                <div className={styles.addonRowLeft}>
                  <div className={styles.checkboxWrapper}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => {}} // Handled by row onClick
                      className={styles.checkbox}
                      aria-label={addon.name}
                    />
                  </div>

                  <div className={styles.addonMeta}>
                    <span className={styles.addonName}>{addon.name}</span>
                    {addon.description && (
                      <span className={styles.addonDescription}>
                        {addon.description}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.addonRowRight}>
                  {/* Stock indicator badge */}
                  {!addon.isActive ? (
                    <span className={`${styles.stockBadge} ${styles.stockInactive}`}>
                      Inactive
                    </span>
                  ) : addon.stockQuantity === 0 ? (
                    <span
                      className={`${styles.stockBadge} ${styles.stockOutOfStock}`}
                    >
                      <XCircle size={12} />
                      <span>Out of stock</span>
                    </span>
                  ) : addon.stockQuantity <= addon.lowStockThreshold ? (
                    <span
                      className={`${styles.stockBadge} ${styles.stockLowStock}`}
                    >
                      <AlertTriangle size={12} />
                      <span>Low Stock ({addon.stockQuantity})</span>
                    </span>
                  ) : (
                    <span
                      className={`${styles.stockBadge} ${styles.stockInStock}`}
                    >
                      <CheckCircle2 size={12} />
                      <span>In Stock ({addon.stockQuantity})</span>
                    </span>
                  )}

                  {/* Price */}
                  <span className={styles.addonPriceBadge}>
                    + ₹{addon.price}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Popup Form for Creating a New Add-on */}
      <CreateAddonModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleAddonCreated}
      />
    </div>
  );
}
