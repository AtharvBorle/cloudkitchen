"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Copy,
  X,
  Bell,
  Edit3,
  Trash2,
  AlertTriangle,
  Loader2,
  Check,
  Phone,
  Mail,
  Key,
  User,
} from "lucide-react";
import styles from "./ResponsiveManageRiders.module.css";
import { fetchApi } from "@/lib/fetch-api";
import { validateEmail } from "@/lib/email-validation";

export interface ManagedRiderItem {
  id: string;
  name: string;
  initials: string;
  phone: string;
  email?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  rawBalance?: number;
  codBalance?: string | number;
  pendingDeliveriesCount?: number;
  isActive?: boolean;
  status: "Online" | "Offline" | "Active" | "Inactive";
}

export interface ResponsiveManageRidersProps {
  activeRidersCount?: number;
  totalCodAmount?: string;
  riders?: ManagedRiderItem[];
  onInviteRider?: () => void;
  onSelectRider?: (rider: ManagedRiderItem) => void;
  onBack?: () => void;
  onRiderUpdated?: () => void;
}

const DEFAULT_MANAGED_RIDERS: ManagedRiderItem[] = [];

export const ResponsiveManageRiders: React.FC<ResponsiveManageRidersProps> = ({
  activeRidersCount = 0,
  totalCodAmount = "₹0",
  riders = DEFAULT_MANAGED_RIDERS,
  onInviteRider,
  onSelectRider,
  onBack,
  onRiderUpdated,
}) => {
  const router = useRouter();
  const [localRiders, setLocalRiders] = useState<ManagedRiderItem[]>(riders);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Edit Modal State
  const [editingRider, setEditingRider] = useState<ManagedRiderItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    vehicleType: "Motorcycle / Scooter",
    vehicleNumber: "",
    isActive: true,
  });
  const [editError, setEditError] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Modal State
  const [deletingRider, setDeletingRider] = useState<ManagedRiderItem | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  React.useEffect(() => {
    setLocalRiders(riders);
  }, [riders]);

  const showToast = (text: string, isError: boolean = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleBack = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onBack) {
      onBack();
    } else {
      router.push("/seller/delivery");
    }
  };

  const handleRiderClick = (rider: ManagedRiderItem) => {
    if (onSelectRider) {
      onSelectRider(rider);
    } else {
      router.push(`/seller/delivery/handover?riderId=${encodeURIComponent(rider.id)}`);
    }
  };

  // Status Toggle
  const handleToggleStatus = async (rider: ManagedRiderItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIsActive = rider.status === "Online" || rider.status === "Active" || rider.isActive === true;
    const newActive = !currentIsActive;

    setLocalRiders((prev) =>
      prev.map((r) =>
        r.id === rider.id
          ? {
              ...r,
              isActive: newActive,
              status: newActive ? ("Online" as const) : ("Offline" as const),
            }
          : r
      )
    );

    try {
      const res = await fetchApi(`/api/seller/delivery/${rider.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newActive }),
      });

      if (res.ok) {
        showToast(`${rider.name} marked as ${newActive ? "Active" : "Inactive"}`);
        if (onRiderUpdated) onRiderUpdated();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.message || "Failed to update status", true);
        setLocalRiders((prev) =>
          prev.map((r) =>
            r.id === rider.id
              ? {
                  ...r,
                  isActive: currentIsActive,
                  status: currentIsActive ? ("Online" as const) : ("Offline" as const),
                }
              : r
          )
        );
      }
    } catch {
      showToast("Network error updating status", true);
    }
  };

  // Open Edit
  const handleOpenEdit = (rider: ManagedRiderItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRider(rider);
    setEditFormData({
      name: rider.name,
      phone: rider.phone,
      email: rider.email || "",
      password: "",
      vehicleType: rider.vehicleType || "Motorcycle / Scooter",
      vehicleNumber: rider.vehicleNumber || "",
      isActive: rider.status === "Online" || rider.status === "Active" || rider.isActive === true,
    });
    setEditError("");
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRider) return;

    if (!editFormData.name.trim()) {
      setEditError("Please enter full name.");
      return;
    }

    const cleanPhone = editFormData.phone.replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10) {
      setEditError("Please enter a valid 10-digit phone number.");
      return;
    }

    if (editFormData.email.trim()) {
      const emailCheck = validateEmail(editFormData.email);
      if (!emailCheck.isValid) {
        setEditError(emailCheck.error || "Please enter a valid email address.");
        return;
      }
    }

    if (editFormData.password && editFormData.password.length < 6) {
      setEditError("Password must be at least 6 characters long.");
      return;
    }

    setEditError("");
    setIsSavingEdit(true);

    try {
      const payload: any = {
        name: editFormData.name.trim(),
        phone: cleanPhone,
        vehicleType: editFormData.vehicleType,
        vehicleNumber: editFormData.vehicleNumber.trim(),
        isActive: editFormData.isActive,
      };

      if (editFormData.email.trim()) {
        payload.email = editFormData.email.trim().toLowerCase();
      }
      if (editFormData.password.trim()) {
        payload.password = editFormData.password.trim();
      }

      const res = await fetchApi(`/api/seller/delivery/${editingRider.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast("Delivery agent updated successfully!");
        setEditingRider(null);
        if (onRiderUpdated) onRiderUpdated();
        else router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setEditError(data.message || data.error || "Failed to update agent.");
      }
    } catch (err: any) {
      setEditError(err.message || "Failed to update agent.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Open Delete
  const handleOpenDelete = (rider: ManagedRiderItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingRider(rider);
    setDeleteError("");
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingRider) return;

    const rawBal = Number(deletingRider.rawBalance) || 0;
    const pendingCount = Number(deletingRider.pendingDeliveriesCount) || 0;

    if (rawBal > 0 || pendingCount > 0) {
      setDeleteError(
        `Cannot delete agent: ${deletingRider.name} has ${
          rawBal > 0 ? `an outstanding COD balance of ₹${rawBal}` : ""
        }${rawBal > 0 && pendingCount > 0 ? " and " : ""}${
          pendingCount > 0 ? `${pendingCount} active pending deliveries` : ""
        }. Please complete deliveries/settlements first, or mark as Inactive.`
      );
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      const res = await fetchApi(`/api/seller/delivery/${deletingRider.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast(`Agent ${deletingRider.name} deleted successfully.`);
        setLocalRiders((prev) => prev.filter((r) => r.id !== deletingRider.id));
        setDeletingRider(null);
        if (onRiderUpdated) onRiderUpdated();
      } else {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.message || data.error || "Failed to delete delivery agent.");
      }
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete delivery agent.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInvite = () => {
    if (onInviteRider) {
      onInviteRider();
    } else {
      setIsInviteModalOpen(true);
    }
  };

  const handleCopyInviteLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("https://neocloud.app/rider/join?hub=bangalore-central");
      showToast("Rider onboarding link copied!");
    } else {
      showToast("Rider link ready to share!");
    }
    setIsInviteModalOpen(false);
  };

  return (
    <div className={styles.screenWrapper}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: toastMessage.isError ? "#EF4444" : "#10B981",
            color: "#FFFFFF",
            padding: "10px 18px",
            borderRadius: "10px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
            fontSize: "13px",
            fontWeight: 600,
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            maxWidth: "90%",
            textAlign: "center",
          }}
        >
          {toastMessage.isError ? <AlertTriangle size={15} /> : <Check size={15} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 420px Mobile View Container */}
      <div className={styles.mobileContainer}>
        {/* Top Header Bar */}
        <header className={styles.topBar}>
          <button
            type="button"
            className={styles.backButton}
            onClick={handleBack}
            aria-label="Back"
            title="Back"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>

          <h1 className={styles.headerTitle}>Manage Riders</h1>

          <button
            type="button"
            className={styles.iconButton}
            onClick={() => router.push("/seller/notifications")}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={20} />
          </button>
        </header>

        {/* Content Area */}
        <main className={styles.contentArea}>
          {/* Top Metric Strip */}
          <section className={styles.metricRow}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Active Riders</span>
              <span className={styles.metricValue}>{activeRidersCount}</span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Total COD</span>
              <span className={styles.metricValue}>{totalCodAmount}</span>
            </div>
          </section>

          {/* Riders List Section */}
          <section className={styles.ridersSection}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <h2 className={styles.sectionLabel}>YOUR RIDERS ({localRiders.length})</h2>
            </div>

            <div className={styles.ridersList}>
              {localRiders.length === 0 ? (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "#64748B", fontSize: "14px" }}>
                  <p style={{ margin: 0, fontWeight: 600, color: "#1E293B" }}>No delivery riders registered</p>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>Add an agent to start managing riders.</p>
                </div>
              ) : (
                localRiders.map((rider) => {
                  const isOnline =
                    rider.status === "Online" ||
                    rider.status === "Active" ||
                    rider.isActive === true;

                  return (
                    <article
                      key={rider.id}
                      className={styles.riderCard}
                      onClick={() => handleRiderClick(rider)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className={styles.riderLeft}>
                        <div className={styles.avatarCircle}>{rider.initials || rider.name.slice(0, 2).toUpperCase()}</div>
                        <div className={styles.riderInfo}>
                          <h3 className={styles.riderName}>{rider.name}</h3>
                          <p className={styles.riderPhone}>{rider.phone}</p>
                          {rider.vehicleNumber && (
                            <span style={{ fontSize: "11px", color: "#64748B" }}>
                              {rider.vehicleNumber}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={styles.riderRight}>
                        {/* Status Toggle Badge */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleStatus(rider, e)}
                          className={`${styles.statusPill} ${
                            isOnline ? styles.statusOnline : styles.statusOffline
                          }`}
                          style={{ border: "none", cursor: "pointer" }}
                          title="Tap to toggle Active/Inactive"
                        >
                          {isOnline ? "Active" : "Inactive"}
                        </button>

                        {/* Edit & Delete Action Buttons */}
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <button
                            type="button"
                            onClick={(e) => handleOpenEdit(rider, e)}
                            style={{
                              background: "#F8FAFC",
                              border: "1px solid #E2E8F0",
                              borderRadius: "6px",
                              padding: "4px 6px",
                              color: "#475569",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                            }}
                            title="Edit delivery boy"
                          >
                            <Edit3 size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleOpenDelete(rider, e)}
                            style={{
                              background: "#FEF2F2",
                              border: "1px solid #FCA5A5",
                              borderRadius: "6px",
                              padding: "4px 6px",
                              color: "#DC2626",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                            }}
                            title="Delete delivery boy"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <ChevronRight size={18} className={styles.chevronIcon} />
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>

          {/* Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
            <button
              type="button"
              className={styles.inviteButton}
              onClick={() => router.push("/seller/delivery/add-agent")}
            >
              + Add Delivery Agent
            </button>

            <button
              type="button"
              onClick={handleInvite}
              style={{
                width: "100%",
                height: "44px",
                backgroundColor: "#FFFFFF",
                color: "#F97316",
                border: "1.5px solid #FFEDD5",
                borderRadius: "14px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "inherit",
              }}
            >
              Share Onboarding Link
            </button>
          </div>
        </main>

        {/* 1. Edit Rider Modal (Mobile) */}
        {editingRider && (
          <div
            className={styles.modalOverlay}
            onClick={() => setEditingRider(null)}
          >
            <div
              className={styles.modalCard}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "380px" }}
            >
              <div className={styles.modalHeader}>
                <div className={styles.modalIconBox}>
                  <Edit3 size={20} color="#F97316" />
                </div>
                <div className={styles.modalTitleGroup}>
                  <h3 className={styles.modalTitle}>Edit Delivery Boy</h3>
                  <p className={styles.modalSubtext}>{editingRider.name}</p>
                </div>
                <button
                  type="button"
                  className={styles.modalCloseBtn}
                  onClick={() => setEditingRider(null)}
                >
                  <X size={18} />
                </button>
              </div>

              {editError && (
                <div
                  style={{
                    backgroundColor: "#FEF2F2",
                    border: "1px solid #FCA5A5",
                    color: "#DC2626",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    marginBottom: "12px",
                  }}
                >
                  {editError}
                </div>
              )}

              <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155" }}>Name *</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    required
                    style={{
                      width: "100%",
                      height: "36px",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      padding: "0 10px",
                      fontSize: "13px",
                      boxSizing: "border-box",
                      marginTop: "3px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155" }}>Phone *</label>
                  <input
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                      })
                    }
                    maxLength={10}
                    required
                    style={{
                      width: "100%",
                      height: "36px",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      padding: "0 10px",
                      fontSize: "13px",
                      boxSizing: "border-box",
                      marginTop: "3px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155" }}>Email</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    placeholder="rider@example.com"
                    style={{
                      width: "100%",
                      height: "36px",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      padding: "0 10px",
                      fontSize: "13px",
                      boxSizing: "border-box",
                      marginTop: "3px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155" }}>Vehicle No.</label>
                  <input
                    type="text"
                    value={editFormData.vehicleNumber}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, vehicleNumber: e.target.value.toUpperCase() })
                    }
                    placeholder="MH-12-AB-1234"
                    style={{
                      width: "100%",
                      height: "36px",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      padding: "0 10px",
                      fontSize: "13px",
                      boxSizing: "border-box",
                      marginTop: "3px",
                    }}
                  />
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                  <input
                    type="checkbox"
                    checked={editFormData.isActive}
                    onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                    style={{ width: "16px", height: "16px", accentColor: "#F97316" }}
                  />
                  <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#1E293B" }}>Active on duty</span>
                </label>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setEditingRider(null)}
                    style={{
                      padding: "7px 14px",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      fontSize: "12.5px",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    style={{
                      padding: "7px 18px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "#F97316",
                      color: "#FFFFFF",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      cursor: isSavingEdit ? "not-allowed" : "pointer",
                    }}
                  >
                    {isSavingEdit ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. Delete Confirmation Modal (Mobile) */}
        {deletingRider && (
          <div
            className={styles.modalOverlay}
            onClick={() => setDeletingRider(null)}
          >
            <div
              className={styles.modalCard}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "360px" }}
            >
              <div className={styles.modalHeader}>
                <div className={styles.modalIconBox} style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>
                  <Trash2 size={20} color="#DC2626" />
                </div>
                <div className={styles.modalTitleGroup}>
                  <h3 className={styles.modalTitle}>Delete Rider</h3>
                  <p className={styles.modalSubtext}>{deletingRider.name}</p>
                </div>
                <button
                  type="button"
                  className={styles.modalCloseBtn}
                  onClick={() => setDeletingRider(null)}
                >
                  <X size={18} />
                </button>
              </div>

              {deleteError ? (
                <div
                  style={{
                    backgroundColor: "#FEF2F2",
                    border: "1px solid #FCA5A5",
                    color: "#991B1B",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    lineHeight: "1.4",
                    marginBottom: "12px",
                  }}
                >
                  {deleteError}
                </div>
              ) : (
                <p style={{ fontSize: "13px", color: "#475569", margin: "8px 0 16px 0", lineHeight: "1.4" }}>
                  Are you sure you want to permanently delete delivery rider <strong>{deletingRider.name}</strong>?
                </p>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setDeletingRider(null)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "12.5px",
                  }}
                >
                  {deleteError ? "Close" : "Cancel"}
                </button>
                {!deleteError && (
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    style={{
                      padding: "7px 18px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "#DC2626",
                      color: "#FFFFFF",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      cursor: isDeleting ? "not-allowed" : "pointer",
                    }}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Invite Rider Modal */}
        {isInviteModalOpen && (
          <div
            className={styles.modalOverlay}
            onClick={() => setIsInviteModalOpen(false)}
          >
            <div
              className={styles.modalCard}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <div className={styles.modalIconBox}>
                  <UserPlus size={22} color="#F97316" />
                </div>
                <div className={styles.modalTitleGroup}>
                  <h3 className={styles.modalTitle}>Invite Delivery Partner</h3>
                  <p className={styles.modalSubtext}>Share instant onboarding link</p>
                </div>
                <button
                  type="button"
                  className={styles.modalCloseBtn}
                  onClick={() => setIsInviteModalOpen(false)}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <p className={styles.modalBodyText}>
                Send this secure link to your delivery rider. They will be automatically registered to your kitchen hub upon signup.
              </p>

              <button
                type="button"
                className={styles.modalCopyBtn}
                onClick={handleCopyInviteLink}
              >
                <Copy size={16} />
                <span>Copy Onboarding Link</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponsiveManageRiders;
