"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Package,
  Plus,
  Search,
  SquarePen,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  RefreshCw,
  Loader2,
  Minus,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";
import PaginationControls from "../../common/PaginationControls";
import CreateAddonModal from "../addons/CreateAddonModal";
import { broadcastStockAlert } from "@/hooks/useSellerNotifications";
import type { AddonItemData, AddonMetrics } from "../addons/SellerAddonsManager";
import styles from "./ResponsiveAddonsManager.module.css";

export interface ResponsiveAddonsManagerProps {
  isCreateModalOpen?: boolean;
  onCloseCreateModal?: () => void;
  onMetricsChange?: (metrics: AddonMetrics) => void;
}

export default function ResponsiveAddonsManager({
  isCreateModalOpen = false,
  onCloseCreateModal,
  onMetricsChange,
}: ResponsiveAddonsManagerProps) {
  const [addons, setAddons] = useState<AddonItemData[]>([]);
  const [metrics, setMetrics] = useState<AddonMetrics>({
    totalCount: 0,
    activeCount: 0,
    inactiveCount: 0,
    availableCount: 0,
    inStockCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number | "All">(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Modals state
  const [localCreateOpen, setLocalCreateOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReplenishModalOpen, setIsReplenishModalOpen] = useState(false);
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState<AddonItemData | null>(null);

  // Centralized Threshold state
  const [centralizedThreshold, setCentralizedThreshold] = useState<number>(5);
  const [thresholdInput, setThresholdInput] = useState<string>("5");
  const [savingThreshold, setSavingThreshold] = useState<boolean>(false);

  // Form State for Edit Addon
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  // Replenish / Stock Form
  const [stockMode, setStockMode] = useState<"REPLENISH" | "EXACT">("REPLENISH");
  const [replenishDelta, setReplenishDelta] = useState("20");
  const [exactStockInput, setExactStockInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [updatingStockId, setUpdatingStockId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const broadcastAddonSync = (addonId?: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("seller-addon-updated", { detail: { id: addonId } })
      );
      window.dispatchEvent(new CustomEvent("seller-menu-updated"));
    }
  };

  const loadAddons = useCallback(
    async (isSilent = false) => {
      try {
        if (!isSilent) setLoading(true);
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.append("search", searchQuery.trim());
        if (statusFilter !== "ALL") params.append("status", statusFilter);
        params.append("page", String(currentPage));
        params.append("limit", String(pageSize));

        const res = await fetchApi(`/api/seller/addons?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          const data = json.data || json;
          setAddons(data.addons || []);
          if (data.metrics) {
            setMetrics(data.metrics);
            if (onMetricsChange) onMetricsChange(data.metrics);
          }
          if (data.centralizedThreshold !== undefined) {
            setCentralizedThreshold(Number(data.centralizedThreshold) || 5);
            setThresholdInput(String(data.centralizedThreshold || 5));
          }
          if (data.pagination) {
            setTotalItems(data.pagination.totalItems || 0);
            setTotalPages(data.pagination.totalPages || 1);
          }
        }
      } catch (err) {
        console.error("Failed to fetch seller add-ons:", err);
      } finally {
        if (!isSilent) setLoading(false);
      }
    },
    [searchQuery, statusFilter, currentPage, pageSize, onMetricsChange]
  );

  useEffect(() => {
    loadAddons();
  }, [loadAddons]);

  // Sync when add-ons update from outside
  useEffect(() => {
    const handleSync = () => loadAddons(true);
    window.addEventListener("seller-addon-updated", handleSync);
    return () => {
      window.removeEventListener("seller-addon-updated", handleSync);
    };
  }, [loadAddons]);

  // Stepper: 1-touch Quick Increment (+1)
  const handleStepIncrement = async (addon: AddonItemData) => {
    const newStock = addon.stockQuantity + 1;
    setUpdatingStockId(addon.id);

    // Optimistic UI
    setAddons((prev) =>
      prev.map((a) => {
        if (a.id === addon.id) {
          const nextStatus = !a.isActive
            ? "INACTIVE"
            : newStock === 0
            ? "OUT_OF_STOCK"
            : newStock <= a.lowStockThreshold
            ? "LOW_STOCK"
            : "IN_STOCK";
          return { ...a, stockQuantity: newStock, stockStatus: nextStatus };
        }
        return a;
      })
    );

    try {
      const res = await fetchApi(`/api/seller/addons/${addon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockQuantity: newStock }),
      });
      if (res.ok) {
        broadcastAddonSync(addon.id);
        broadcastStockAlert({
          itemId: addon.id,
          itemName: addon.name,
          currentStock: newStock,
          threshold: addon.lowStockThreshold,
        });
      } else {
        loadAddons(true);
      }
    } catch {
      loadAddons(true);
    } finally {
      setUpdatingStockId(null);
    }
  };

  // Stepper: 1-touch Quick Decrement (-1)
  const handleStepDecrement = async (addon: AddonItemData) => {
    if (addon.stockQuantity <= 0) return;
    const newStock = Math.max(0, addon.stockQuantity - 1);
    setUpdatingStockId(addon.id);

    // Optimistic UI
    setAddons((prev) =>
      prev.map((a) => {
        if (a.id === addon.id) {
          const nextStatus = !a.isActive
            ? "INACTIVE"
            : newStock === 0
            ? "OUT_OF_STOCK"
            : newStock <= a.lowStockThreshold
            ? "LOW_STOCK"
            : "IN_STOCK";
          return { ...a, stockQuantity: newStock, stockStatus: nextStatus };
        }
        return a;
      })
    );

    try {
      const res = await fetchApi(`/api/seller/addons/${addon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockQuantity: newStock }),
      });
      if (res.ok) {
        broadcastAddonSync(addon.id);
        broadcastStockAlert({
          itemId: addon.id,
          itemName: addon.name,
          currentStock: newStock,
          threshold: addon.lowStockThreshold,
        });
      } else {
        loadAddons(true);
      }
    } catch {
      loadAddons(true);
    } finally {
      setUpdatingStockId(null);
    }
  };

  // Toggle Active/Inactive Status
  const handleToggleActive = async (addon: AddonItemData) => {
    const nextStatus = !addon.isActive;
    // Optimistic update
    setAddons((prev) =>
      prev.map((a) =>
        a.id === addon.id
          ? {
              ...a,
              isActive: nextStatus,
              stockStatus: !nextStatus
                ? "INACTIVE"
                : a.stockQuantity === 0
                ? "OUT_OF_STOCK"
                : a.stockQuantity <= a.lowStockThreshold
                ? "LOW_STOCK"
                : "IN_STOCK",
            }
          : a
      )
    );

    try {
      const res = await fetchApi(`/api/seller/addons/${addon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      });
      if (res.ok) {
        showToast(`"${addon.name}" is now ${nextStatus ? "Active" : "Inactive"}`);
        broadcastAddonSync(addon.id);
        loadAddons(true);
      } else {
        loadAddons(true);
      }
    } catch {
      loadAddons(true);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (addon: AddonItemData) => {
    setSelectedAddon(addon);
    setFormName(addon.name);
    setFormPrice(String(addon.price));
    setFormStock(String(addon.stockQuantity));
    setFormDescription(addon.description || "");
    setFormIsActive(addon.isActive);
    setIsEditModalOpen(true);
  };

  // Open Update Stock Modal
  const handleOpenReplenish = (addon: AddonItemData) => {
    setSelectedAddon(addon);
    setStockMode("REPLENISH");
    setReplenishDelta("20");
    setExactStockInput(String(addon.stockQuantity));
    setIsReplenishModalOpen(true);
  };

  // Submit Edit Addon
  const handleUpdateAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddon) return;
    if (!formName.trim()) {
      showToast("Please enter an add-on name");
      return;
    }
    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast("Price must be greater than ₹0");
      return;
    }
    const stockNum = parseInt(formStock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      showToast("Stock quantity cannot be negative");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetchApi(`/api/seller/addons/${selectedAddon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          price: priceNum,
          stockQuantity: stockNum,
          description: formDescription.trim(),
          isActive: formIsActive,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast("Add-on updated successfully!");
        setIsEditModalOpen(false);
        loadAddons();
        broadcastAddonSync(selectedAddon.id);
      } else {
        showToast(json.message || "Failed to update add-on");
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to update add-on");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Replenish / Exact Stock
  const handleSaveStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddon) return;

    setSubmitting(true);
    try {
      let payload: any = {};
      let updatedStock = selectedAddon.stockQuantity;

      if (stockMode === "REPLENISH") {
        const delta = parseInt(replenishDelta, 10);
        if (isNaN(delta) || delta <= 0) {
          showToast("Replenish quantity must be greater than zero");
          setSubmitting(false);
          return;
        }
        payload = {
          replenishQuantity: delta,
          note: `Quick stock update +${delta} units`,
        };
        updatedStock = selectedAddon.stockQuantity + delta;
      } else {
        const exact = parseInt(exactStockInput, 10);
        if (isNaN(exact) || exact < 0) {
          showToast("Stock quantity cannot be negative");
          setSubmitting(false);
          return;
        }
        payload = {
          stockQuantity: exact,
          note: `Stock adjusted directly to ${exact} units`,
        };
        updatedStock = exact;
      }

      const res = await fetchApi(`/api/seller/addons/${selectedAddon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(`Stock updated (${updatedStock} units) for "${selectedAddon.name}"!`);
        setIsReplenishModalOpen(false);
        loadAddons();
        broadcastAddonSync(selectedAddon.id);
        broadcastStockAlert({
          itemId: selectedAddon.id,
          itemName: selectedAddon.name,
          currentStock: updatedStock,
          threshold: selectedAddon.lowStockThreshold,
        });
      } else {
        showToast(json.message || "Failed to update stock");
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to update stock");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Add-on
  const handleDeleteAddon = async (addon: AddonItemData) => {
    if (
      !window.confirm(
        `Are you sure you want to delete add-on "${addon.name}"? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const res = await fetchApi(`/api/seller/addons/${addon.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast(`Add-on "${addon.name}" deleted.`);
        loadAddons();
        broadcastAddonSync(addon.id);
      } else {
        const json = await res.json().catch(() => ({}));
        showToast(json.message || "Failed to delete add-on.");
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to delete add-on.");
    }
  };

  // Save Centralized Threshold
  const handleSaveThreshold = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(thresholdInput, 10);
    if (isNaN(val) || val < 0) {
      showToast("Threshold must be 0 or greater");
      return;
    }

    setSavingThreshold(true);
    try {
      const res = await fetchApi("/api/seller/addons/threshold", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threshold: val }),
      });

      if (res.ok) {
        setCentralizedThreshold(val);
        showToast(`Centralized low-stock threshold set to ${val} units!`);
        setIsThresholdModalOpen(false);
        loadAddons();
        broadcastAddonSync();
      } else {
        const json = await res.json().catch(() => ({}));
        showToast(json.message || "Failed to update threshold");
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to update threshold");
    } finally {
      setSavingThreshold(false);
    }
  };

  const isModalOpen = isCreateModalOpen || localCreateOpen;
  const handleCloseCreate = () => {
    setLocalCreateOpen(false);
    if (onCloseCreateModal) onCloseCreateModal();
  };

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#0F172A",
            color: "#FFFFFF",
            padding: "10px 18px",
            borderRadius: "10px",
            fontWeight: 600,
            fontSize: "13px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
            zIndex: 1000000,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            maxWidth: "90%",
            textAlign: "center",
          }}
        >
          <Sparkles size={15} color="#FF6B00" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Quick Metrics Horizontal Row */}
      <div className={styles.metricsRow}>
        <button
          type="button"
          className={`${styles.metricPill} ${statusFilter === "ALL" ? styles.metricPillActive : ""}`}
          onClick={() => {
            setStatusFilter("ALL");
            setCurrentPage(1);
          }}
        >
          <span>All Add-ons</span>
          <span className={styles.metricCount}>{metrics.totalCount}</span>
        </button>

        <button
          type="button"
          className={`${styles.metricPill} ${statusFilter === "AVAILABLE" ? styles.metricPillActive : ""}`}
          onClick={() => {
            setStatusFilter("AVAILABLE");
            setCurrentPage(1);
          }}
        >
          <span style={{ color: "#16A34A" }}>● In Stock</span>
          <span className={`${styles.metricCount} ${styles.metricCountGreen}`}>
            {metrics.inStockCount}
          </span>
        </button>

        <button
          type="button"
          className={`${styles.metricPill} ${statusFilter === "LOW_STOCK" ? styles.metricPillActive : ""}`}
          onClick={() => {
            setStatusFilter("LOW_STOCK");
            setCurrentPage(1);
          }}
        >
          <span style={{ color: "#D97706" }}>▲ Low Stock</span>
          <span className={`${styles.metricCount} ${styles.metricCountAmber}`}>
            {metrics.lowStockCount}
          </span>
        </button>

        <button
          type="button"
          className={`${styles.metricPill} ${statusFilter === "OUT_OF_STOCK" ? styles.metricPillActive : ""}`}
          onClick={() => {
            setStatusFilter("OUT_OF_STOCK");
            setCurrentPage(1);
          }}
        >
          <span style={{ color: "#DC2626" }}>✕ Out of Stock</span>
          <span className={`${styles.metricCount} ${styles.metricCountRed}`}>
            {metrics.outOfStockCount}
          </span>
        </button>
      </div>

      {/* 2. Centralized Low-Stock Threshold Mini Banner */}
      <div className={styles.thresholdCard}>
        <div className={styles.thresholdLeft}>
          <AlertTriangle size={15} color="#D97706" />
          <span>Low-Stock Alert: ≤ {centralizedThreshold} units</span>
        </div>
        <button
          type="button"
          className={styles.thresholdChangeBtn}
          onClick={() => {
            setThresholdInput(String(centralizedThreshold));
            setIsThresholdModalOpen(true);
          }}
        >
          Adjust
        </button>
      </div>

      {/* 3. Controls: Search, Filter Pills & Add Button */}
      <div className={styles.controlsSection}>
        <div className={styles.searchAndActionRow}>
          <div className={styles.searchContainer}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search add-ons..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.clearSearchBtn}
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            className={styles.addAddonBtn}
            onClick={() => setLocalCreateOpen(true)}
            aria-label="Add New Add-on"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className={styles.filterPillsRow}>
          {[
            { id: "ALL", label: "All" },
            { id: "AVAILABLE", label: "Available" },
            { id: "LOW_STOCK", label: "Low Stock" },
            { id: "OUT_OF_STOCK", label: "Out of Stock" },
            { id: "ACTIVE", label: "Active" },
            { id: "INACTIVE", label: "Inactive" },
          ].map((f) => {
            const isActive = statusFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                className={`${styles.filterPill} ${isActive ? styles.filterPillActive : ""}`}
                onClick={() => {
                  setStatusFilter(f.id);
                  setCurrentPage(1);
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Add-on Cards List */}
      <div className={styles.cardsList}>
        {loading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={`addon-skeleton-${idx}`}
              className={styles.addonCard}
              style={{
                height: "120px",
                background: "linear-gradient(90deg, #FFFFFF 0%, #F8FAFC 50%, #FFFFFF 100%)",
                animation: "pulse 1.5s infinite",
              }}
            />
          ))
        ) : addons.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Package size={26} />
            </div>
            <h4 className={styles.emptyTitle}>No Add-ons Found</h4>
            <p className={styles.emptySubtitle}>
              {searchQuery || statusFilter !== "ALL"
                ? "No items match your active filter. Try resetting search or filter pills."
                : "Add items like Extra Cheese, Extra Gravy, or Roti to offer customers customizations."}
            </p>
            {!searchQuery && statusFilter === "ALL" && (
              <button
                type="button"
                onClick={() => setLocalCreateOpen(true)}
                className={styles.addAddonBtn}
                style={{ marginTop: "6px" }}
              >
                <Plus size={16} />
                <span>Create First Add-on</span>
              </button>
            )}
          </div>
        ) : (
          addons.map((addon) => {
            const isOutOfStock = addon.stockQuantity === 0;
            const isLowStock =
              addon.stockQuantity > 0 && addon.stockQuantity <= addon.lowStockThreshold;

            return (
              <article key={addon.id} className={styles.addonCard}>
                {/* Header: Icon, Name, Price, Edit & Delete */}
                <div className={styles.cardHeader}>
                  <div className={styles.cardMainInfo}>
                    <div className={styles.addonIconBadge}>
                      <Package size={20} />
                    </div>
                    <div className={styles.addonMeta}>
                      <div className={styles.addonTitleRow}>
                        <h3 className={styles.addonTitle}>{addon.name}</h3>
                      </div>
                      <p className={styles.addonPrice}>₹{addon.price.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => handleOpenEdit(addon)}
                      aria-label={`Edit ${addon.name}`}
                      title="Edit details"
                    >
                      <SquarePen size={15} strokeWidth={2.2} />
                    </button>
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      onClick={() => handleDeleteAddon(addon)}
                      aria-label={`Delete ${addon.name}`}
                      title="Delete add-on"
                    >
                      <Trash2 size={15} strokeWidth={2.2} />
                    </button>
                  </div>
                </div>

                {/* Optional description */}
                {addon.description && (
                  <p className={styles.addonDescription}>{addon.description}</p>
                )}

                {/* Status & Threshold Row */}
                <div className={styles.statusRow}>
                  {addon.stockStatus === "IN_STOCK" && (
                    <span className={styles.badgeInStock}>
                      <CheckCircle2 size={12} />
                      <span>In Stock</span>
                    </span>
                  )}
                  {addon.stockStatus === "LOW_STOCK" && (
                    <span className={styles.badgeLowStock}>
                      <AlertTriangle size={12} />
                      <span>Low Stock ({addon.stockQuantity} left)</span>
                    </span>
                  )}
                  {addon.stockStatus === "OUT_OF_STOCK" && (
                    <span className={styles.badgeOutOfStock}>
                      <XCircle size={12} />
                      <span>Out of Stock</span>
                    </span>
                  )}
                  {addon.stockStatus === "INACTIVE" && (
                    <span className={styles.badgeInactive}>
                      <span>Inactive</span>
                    </span>
                  )}

                  <span className={styles.thresholdNote}>
                    Alert at ≤ {addon.lowStockThreshold} units
                  </span>
                </div>

                {/* Footer: Stepper, Update Stock Modal Button & Active Switch */}
                <div className={styles.cardFooter}>
                  <div className={styles.stockControlGroup}>
                    {/* Stepper (- qty +) */}
                    <div className={styles.stepperContainer}>
                      <button
                        type="button"
                        className={styles.stepperBtn}
                        onClick={() => handleStepDecrement(addon)}
                        disabled={addon.stockQuantity <= 0 || updatingStockId === addon.id}
                        aria-label="Decrease stock"
                      >
                        <Minus size={13} />
                      </button>
                      <span
                        className={styles.stepperValue}
                        style={{
                          color: isOutOfStock
                            ? "#DC2626"
                            : isLowStock
                            ? "#D97706"
                            : "#0F172A",
                        }}
                      >
                        {addon.stockQuantity}
                      </span>
                      <button
                        type="button"
                        className={styles.stepperBtn}
                        onClick={() => handleStepIncrement(addon)}
                        disabled={updatingStockId === addon.id}
                        aria-label="Increase stock"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    {/* Quick Update Stock Button */}
                    <button
                      type="button"
                      className={styles.replenishBtn}
                      onClick={() => handleOpenReplenish(addon)}
                      title="Update stock level"
                    >
                      <Plus size={11} strokeWidth={3} />
                      <span>Update Stock</span>
                    </button>
                  </div>

                  {/* Active Toggle Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={addon.isActive}
                    className={`${styles.toggleSwitch} ${
                      addon.isActive ? styles.toggleSwitchActive : ""
                    }`}
                    onClick={() => handleToggleActive(addon)}
                    aria-label={`Toggle active status for ${addon.name}`}
                  >
                    <span
                      className={`${styles.toggleThumb} ${
                        addon.isActive ? styles.toggleThumbActive : ""
                      }`}
                    />
                  </button>
                </div>
              </article>
            );
          })
        )}

        {/* Pagination */}
        {addons.length > 0 && (
          <div style={{ marginTop: "12px" }}>
            <PaginationControls
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={(p) => setCurrentPage(p)}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setCurrentPage(1);
              }}
              itemLabel="add-ons"
            />
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL 1: CREATE ADD-ON
          ======================================================== */}
      <CreateAddonModal
        isOpen={isModalOpen}
        onClose={handleCloseCreate}
        onCreated={(newAddon) => {
          showToast(`Add-on "${newAddon.name}" created successfully!`);
          loadAddons();
          broadcastAddonSync(newAddon.id);
        }}
      />

      {/* ========================================================
          MODAL 2: EDIT ADD-ON
          ======================================================== */}
      {isEditModalOpen && selectedAddon && (
        <div className={styles.modalBackdrop} onClick={() => setIsEditModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit Add-on</h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className={styles.closeBtn}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateAddon}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Add-on Name <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Price (₹) <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="any"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Stock Qty</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                      className={styles.formInput}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Status</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setFormIsActive(!formIsActive)}
                      className={`${styles.toggleSwitch} ${
                        formIsActive ? styles.toggleSwitchActive : ""
                      }`}
                    >
                      <span
                        className={`${styles.toggleThumb} ${
                          formIsActive ? styles.toggleThumbActive : ""
                        }`}
                      />
                    </button>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: formIsActive ? "#16A34A" : "#64748B",
                      }}
                    >
                      {formIsActive ? "Active (Available for orders)" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description (Optional)</label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className={styles.formTextarea}
                    placeholder="Short note about this add-on..."
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className={styles.cancelBtn}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={submitting}>
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <SquarePen size={16} />
                  )}
                  <span>{submitting ? "Saving..." : "Update Add-on"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: UPDATE STOCK / REPLENISH
          ======================================================== */}
      {isReplenishModalOpen && selectedAddon && (
        <div className={styles.modalBackdrop} onClick={() => setIsReplenishModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Update Stock Level</h3>
              <button
                type="button"
                onClick={() => setIsReplenishModalOpen(false)}
                className={styles.closeBtn}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStockUpdate}>
              <div className={styles.modalBody}>
                {/* Item Details Box */}
                <div
                  style={{
                    backgroundColor: "#F8FAFC",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 700 }}>
                    ADD-ON ITEM
                  </div>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 800,
                      color: "#0F172A",
                      marginTop: "2px",
                    }}
                  >
                    {selectedAddon.name}
                  </div>
                  <div
                    style={{
                      fontSize: "12.5px",
                      color: "#334155",
                      marginTop: "4px",
                    }}
                  >
                    Current Stock:{" "}
                    <strong
                      style={{
                        color: selectedAddon.stockQuantity === 0 ? "#DC2626" : "#0F172A",
                      }}
                    >
                      {selectedAddon.stockQuantity} units
                    </strong>
                  </div>
                </div>

                {/* Mode Selector Tabs: Replenish vs Set Exact */}
                <div
                  style={{
                    display: "flex",
                    backgroundColor: "#F1F5F9",
                    padding: "3px",
                    borderRadius: "8px",
                    gap: "4px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setStockMode("REPLENISH")}
                    style={{
                      flex: 1,
                      height: "32px",
                      borderRadius: "6px",
                      border: "none",
                      backgroundColor: stockMode === "REPLENISH" ? "#FFFFFF" : "transparent",
                      color: stockMode === "REPLENISH" ? "#EA580C" : "#64748B",
                      fontWeight: stockMode === "REPLENISH" ? 700 : 600,
                      fontSize: "12.5px",
                      cursor: "pointer",
                      boxShadow: stockMode === "REPLENISH" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    }}
                  >
                    + Add Quantity
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockMode("EXACT")}
                    style={{
                      flex: 1,
                      height: "32px",
                      borderRadius: "6px",
                      border: "none",
                      backgroundColor: stockMode === "EXACT" ? "#FFFFFF" : "transparent",
                      color: stockMode === "EXACT" ? "#EA580C" : "#64748B",
                      fontWeight: stockMode === "EXACT" ? 700 : 600,
                      fontSize: "12.5px",
                      cursor: "pointer",
                      boxShadow: stockMode === "EXACT" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    }}
                  >
                    Set Exact Stock
                  </button>
                </div>

                {stockMode === "REPLENISH" ? (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Quantity to Add</label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="1"
                      value={replenishDelta}
                      onChange={(e) => setReplenishDelta(e.target.value)}
                      className={styles.formInput}
                      placeholder="e.g. 20"
                    />

                    {/* Presets */}
                    <div className={styles.presetGroup}>
                      {[10, 20, 50, 100].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setReplenishDelta(String(num))}
                          className={styles.presetBtn}
                        >
                          +{num}
                        </button>
                      ))}
                    </div>

                    <div
                      style={{
                        marginTop: "8px",
                        fontSize: "12.5px",
                        color: "#64748B",
                        backgroundColor: "#FFF7ED",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid #FED7AA",
                      }}
                    >
                      New stock will be:{" "}
                      <strong style={{ color: "#EA580C" }}>
                        {selectedAddon.stockQuantity + (parseInt(replenishDelta, 10) || 0)} units
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>New Total Stock</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      value={exactStockInput}
                      onChange={(e) => setExactStockInput(e.target.value)}
                      className={styles.formInput}
                      placeholder="e.g. 35"
                    />
                    <div
                      style={{
                        marginTop: "8px",
                        fontSize: "12.5px",
                        color: "#64748B",
                        backgroundColor: "#FFF7ED",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid #FED7AA",
                      }}
                    >
                      Stock level will update directly to:{" "}
                      <strong style={{ color: "#EA580C" }}>
                        {parseInt(exactStockInput, 10) || 0} units
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsReplenishModalOpen(false)}
                  className={styles.cancelBtn}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={submitting}>
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <RefreshCw size={15} />
                  )}
                  <span>{submitting ? "Updating..." : "Update Stock"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: CENTRALIZED THRESHOLD ADJUST
          ======================================================== */}
      {isThresholdModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsThresholdModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Low-Stock Alert Threshold</h3>
              <button
                type="button"
                onClick={() => setIsThresholdModalOpen(false)}
                className={styles.closeBtn}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveThreshold}>
              <div className={styles.modalBody}>
                <p style={{ fontSize: "12.5px", color: "#64748B", margin: 0, lineHeight: 1.4 }}>
                  Set the threshold when the system marks add-ons as Low Stock and alerts you to
                  replenish inventory.
                </p>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Alert Threshold (Units)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="999"
                    value={thresholdInput}
                    onChange={(e) => setThresholdInput(e.target.value)}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsThresholdModalOpen(false)}
                  className={styles.cancelBtn}
                  disabled={savingThreshold}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={savingThreshold}>
                  {savingThreshold ? <Loader2 size={16} className="animate-spin" /> : null}
                  <span>{savingThreshold ? "Saving..." : "Save Threshold"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
