"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Upload,
  Loader2,
  Sparkles,
  Layers,
  ArrowUpRight,
  X,
  RefreshCw,
} from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";
import PaginationControls from "../../common/PaginationControls";
import CreateAddonModal from "./CreateAddonModal";
import styles from "./SellerAddonsManager.module.css";

export interface AddonItemData {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "INACTIVE";
  isAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddonMetrics {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  availableCount: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export default function SellerAddonsManager() {
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReplenishModalOpen, setIsReplenishModalOpen] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState<AddonItemData | null>(null);

  // Centralized Threshold state
  const [centralizedThreshold, setCentralizedThreshold] = useState<number>(5);
  const [thresholdInput, setThresholdInput] = useState<string>("5");
  const [savingThreshold, setSavingThreshold] = useState<boolean>(false);

  // Form State
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [replenishDelta, setReplenishDelta] = useState("20");
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const broadcastAddonSync = (addonId?: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("seller-addon-updated", { detail: { id: addonId } }));
      window.dispatchEvent(new CustomEvent("seller-menu-updated"));
    }
  };

  const loadAddons = useCallback(async () => {
    try {
      setLoading(true);
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
        if (data.metrics) setMetrics(data.metrics);
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
      setLoading(false);
    }
  }, [searchQuery, statusFilter, currentPage, pageSize]);

  useEffect(() => {
    loadAddons();
  }, [loadAddons]);

  // Handle centralized threshold save
  const handleSaveCentralizedThreshold = async () => {
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
        showToast(`Centralized low-stock threshold set to ${val} for all add-ons!`);
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

  // Handle open add modal
  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEditModal = (addon: AddonItemData) => {
    setSelectedAddon(addon);
    setFormName(addon.name);
    setFormPrice(String(addon.price));
    setFormStock(String(addon.stockQuantity));
    setFormDescription(addon.description || "");
    setFormIsActive(addon.isActive);
    setIsEditModalOpen(true);
  };

  // Handle open replenish modal
  const handleOpenReplenishModal = (addon: AddonItemData) => {
    setSelectedAddon(addon);
    setReplenishDelta("20");
    setIsReplenishModalOpen(true);
  };

  // Handle image file selection
  // Save Edit Add-on
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

  // Quick Update Stock
  const handleReplenishStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddon) return;
    const qty = parseInt(replenishDelta, 10);
    if (isNaN(qty) || qty <= 0) {
      showToast("Quantity must be greater than zero");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetchApi(`/api/seller/addons/${selectedAddon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          replenishQuantity: qty,
          note: `Quick stock update +${qty} units`,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(`Stock updated (+${qty} units) for "${selectedAddon.name}"!`);
        setIsReplenishModalOpen(false);
        loadAddons();
        broadcastAddonSync(selectedAddon.id);
      } else {
        showToast(json.message || "Failed to update stock");
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to update stock");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Active Status
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
        loadAddons();
        broadcastAddonSync(addon.id);
      }
    } catch (err) {
      console.error("Failed to toggle addon status:", err);
      loadAddons();
    }
  };

  // Delete Add-on
  const handleDeleteAddon = async (addon: AddonItemData) => {
    if (!window.confirm(`Are you sure you want to delete add-on "${addon.name}"? This action cannot be undone.`)) {
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

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            backgroundColor: "#0F172A",
            color: "#FFFFFF",
            padding: "12px 20px",
            borderRadius: "10px",
            fontWeight: 600,
            fontSize: "0.88rem",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            zIndex: 1000000,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Sparkles size={16} color="#FF6B00" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Inventory Indicators & Metrics Cards (Requirement 7) */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Total Active Add-ons</span>
            <span className={styles.metricValue}>{metrics.activeCount}</span>
          </div>
          <div className={`${styles.metricIconWrapper} ${styles.iconBlue}`}>
            <Package size={22} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>In-Stock Add-ons</span>
            <span className={styles.metricValue}>{metrics.inStockCount}</span>
          </div>
          <div className={`${styles.metricIconWrapper} ${styles.iconGreen}`}>
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Low-Stock Add-ons</span>
            <span className={styles.metricValue}>{metrics.lowStockCount}</span>
          </div>
          <div className={`${styles.metricIconWrapper} ${styles.iconAmber}`}>
            <AlertTriangle size={22} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Out-of-Stock Add-ons</span>
            <span className={styles.metricValue}>{metrics.outOfStockCount}</span>
          </div>
          <div className={`${styles.metricIconWrapper} ${styles.iconRed}`}>
            <XCircle size={22} />
          </div>
        </div>
      </div>

      {/* Centralized Low-Stock Alert Threshold Setting */}
      <div className={styles.thresholdBanner}>
        <div className={styles.thresholdBannerLeft}>
          <div className={styles.thresholdBadgeIcon}>
            <AlertTriangle size={18} />
          </div>
          <div className={styles.thresholdTextGroup}>
            <span className={styles.thresholdTitle}>Centralized Low-Stock Alert Threshold</span>
            <span className={styles.thresholdSubtitle}>
              Applies to all add-ons. The system flags low stock when quantity reaches this level or lower (Default: 5).
            </span>
          </div>
        </div>
        <div className={styles.thresholdInputWrapper}>
          <span className={styles.thresholdPrefix}>Threshold:</span>
          <input
            type="number"
            min="0"
            max="999"
            value={thresholdInput}
            onChange={(e) => setThresholdInput(e.target.value)}
            className={styles.thresholdInput}
            aria-label="Centralized low-stock threshold"
          />
          <button
            type="button"
            onClick={handleSaveCentralizedThreshold}
            disabled={savingThreshold || parseInt(thresholdInput, 10) === centralizedThreshold}
            className={styles.thresholdSaveBtn}
          >
            {savingThreshold ? <Loader2 size={14} className="animate-spin" /> : "Save Threshold"}
          </button>
        </div>
      </div>

      {/* 2. Control Bar: Search & Status Filters + Add Button */}
      <div className={styles.controlBar}>
        <div className={styles.searchAndFilters}>
          <div className={styles.searchInputWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search add-ons by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterPills}>
            {[
              { id: "ALL", label: "All Add-ons" },
              { id: "AVAILABLE", label: "Available" },
              { id: "LOW_STOCK", label: "Low Stock" },
              { id: "OUT_OF_STOCK", label: "Out of Stock" },
              { id: "ACTIVE", label: "Active" },
              { id: "INACTIVE", label: "Inactive" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setStatusFilter(f.id);
                  setCurrentPage(1);
                }}
                className={`${styles.filterPill} ${
                  statusFilter === f.id ? styles.filterPillActive : ""
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className={styles.addBtn}
        >
          <Plus size={18} strokeWidth={2.8} />
          <span>Add New Add-on</span>
        </button>
      </div>

      {/* 3. Add-ons Table Card */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.addonTable}>
            <thead>
              <tr>
                <th>ADD-ON</th>
                <th>SELLING PRICE</th>
                <th>CURRENT STOCK</th>
                <th>THRESHOLD</th>
                <th>STATUS</th>
                <th>ACTIVE</th>
                <th style={{ textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`addon-skel-${idx}`}>
                    <td colSpan={7} style={{ padding: "16px 20px" }}>
                      <div
                        style={{
                          height: "24px",
                          borderRadius: "6px",
                          background:
                            "linear-gradient(90deg, #F1F5F9 0%, #E2E8F0 50%, #F1F5F9 100%)",
                          backgroundSize: "200% 100%",
                          animation: "shimmer 1.5s infinite ease-in-out",
                        }}
                      />
                    </td>
                  </tr>
                ))
              ) : addons.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>
                        <Package size={28} />
                      </div>
                      <h4 className={styles.emptyTitle}>No Add-ons Found</h4>
                      <p className={styles.emptySubtitle}>
                        {searchQuery || statusFilter !== "ALL"
                          ? "No add-ons match your current search and filters. Try adjusting your query."
                          : "You haven't created any add-ons yet. Click 'Add New Add-on' to create your first item (e.g. Extra Roti, Extra Sabji, Extra Rice)."}
                      </p>
                      {(!searchQuery && statusFilter === "ALL") && (
                        <button
                          type="button"
                          onClick={handleOpenAddModal}
                          className={styles.addBtn}
                          style={{ marginTop: "8px" }}
                        >
                          <Plus size={16} />
                          <span>Create First Add-on</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                addons.map((addon) => {
                  return (
                    <tr key={addon.id}>
                      {/* Name & Description */}
                      <td>
                        <div className={styles.addonNameCell}>
                          <div className={styles.addonMeta}>
                            <span className={styles.addonTitle}>{addon.name}</span>
                            {addon.description && (
                              <span className={styles.addonDesc} title={addon.description}>
                                {addon.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Selling Price */}
                      <td>
                        <span className={styles.priceTag}>₹{addon.price}</span>
                      </td>

                      {/* Stock Quantity + Replenish */}
                      <td>
                        <div className={styles.stockCell}>
                          <span
                            className={styles.stockNumber}
                            style={{
                              color:
                                addon.stockQuantity === 0
                                  ? "#DC2626"
                                  : addon.stockQuantity <= addon.lowStockThreshold
                                  ? "#D97706"
                                  : "#0F172A",
                            }}
                          >
                            {addon.stockQuantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenReplenishModal(addon)}
                            className={styles.replenishBtn}
                            title="Update stock for this add-on"
                          >
                            <Plus size={12} strokeWidth={3} />
                            <span>Update Stock</span>
                          </button>
                        </div>
                      </td>

                      {/* Threshold */}
                      <td>
                        <span style={{ color: "#64748B", fontWeight: 600 }}>
                          ≤ {addon.lowStockThreshold} units
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td>
                        {addon.stockStatus === "IN_STOCK" && (
                          <span className={styles.badgeInStock}>
                            <CheckCircle2 size={12} />
                            <span>In Stock</span>
                          </span>
                        )}
                        {addon.stockStatus === "LOW_STOCK" && (
                          <span className={styles.badgeLowStock}>
                            <AlertTriangle size={12} />
                            <span>Low Stock</span>
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
                      </td>

                      {/* Active Toggle Switch */}
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(addon)}
                          className={`${styles.toggleSwitch} ${
                            addon.isActive ? styles.toggleSwitchActive : ""
                          }`}
                          aria-label={`Toggle active status for ${addon.name}`}
                        >
                          <span
                            className={`${styles.toggleThumb} ${
                              addon.isActive ? styles.toggleThumbActive : ""
                            }`}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className={styles.actionBtns}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(addon)}
                            className={styles.actionIconBtn}
                            title="Edit Add-on"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddon(addon)}
                            className={`${styles.actionIconBtn} ${styles.deleteBtn}`}
                            title="Delete Add-on"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {addons.length > 0 && (
          <div style={{ padding: "16px 20px", borderTop: "1px solid #E2E8F0" }}>
            <PaginationControls
              currentPage={currentPage}
              
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={(p) => setCurrentPage(p)}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setCurrentPage(1);
              }}
              itemName="add-ons"
            />
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL 1: ADD NEW ADD-ON
          ======================================================== */}
      <CreateAddonModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
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
                    <label className={styles.formLabel}>Selling Price (₹)</label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.5"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Available Stock Qty</label>
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
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", height: "42px" }}>
                    <button
                      type="button"
                      onClick={() => setFormIsActive(!formIsActive)}
                      className={`${styles.toggleSwitch} ${formIsActive ? styles.toggleSwitchActive : ""}`}
                    >
                      <span className={`${styles.toggleThumb} ${formIsActive ? styles.toggleThumbActive : ""}`} />
                    </button>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: formIsActive ? "#16A34A" : "#64748B" }}>
                      {formIsActive ? "Active (Purchasable)" : "Inactive"}
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
                <button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Edit2 size={16} />}
                  <span>{submitting ? "Saving..." : "Update Add-on"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: QUICK REPLENISH STOCK
          ======================================================== */}
      {isReplenishModalOpen && selectedAddon && (
        <div className={styles.modalBackdrop} onClick={() => setIsReplenishModalOpen(false)}>
          <div className={styles.modalCard} style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Update Stock</h3>
              <button
                type="button"
                onClick={() => setIsReplenishModalOpen(false)}
                className={styles.closeBtn}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReplenishStock}>
              <div className={styles.modalBody}>
                <div style={{ backgroundColor: "#F8FAFC", padding: "12px 16px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: 600 }}>ITEM</div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: "#0F172A", marginTop: "2px" }}>
                    {selectedAddon.name}
                  </div>
                  <div style={{ fontSize: "0.84rem", color: "#334155", marginTop: "4px" }}>
                    Current Stock: <strong style={{ color: selectedAddon.stockQuantity === 0 ? "#DC2626" : "#0F172A" }}>{selectedAddon.stockQuantity} units</strong>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Add Quantity to Inventory <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    placeholder="e.g. 25"
                    value={replenishDelta}
                    onChange={(e) => setReplenishDelta(e.target.value)}
                    className={styles.formInput}
                  />

                  {/* Preset quick buttons */}
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
                </div>

                <div style={{ fontSize: "0.84rem", color: "#64748B", backgroundColor: "#FFF7ED", padding: "10px 14px", borderRadius: "8px", border: "1px solid #FED7AA" }}>
                  New stock will be:{" "}
                  <strong style={{ color: "#EA580C" }}>
                    {selectedAddon.stockQuantity + (parseInt(replenishDelta, 10) || 0)} units
                  </strong>
                </div>
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
                <button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  <span>{submitting ? "Updating..." : "Update Stock"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
