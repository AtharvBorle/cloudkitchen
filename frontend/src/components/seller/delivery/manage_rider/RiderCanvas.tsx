"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  CheckCircle2,
  Truck,
  User,
  ArrowRight,
  UserPlus,
  Edit3,
  Trash2,
  X,
  AlertTriangle,
  Loader2,
  Phone,
  Mail,
  Key,
  ShieldCheck,
  Check,
} from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";
import { validateEmail } from "@/lib/email-validation";

export interface RiderSummaryMetric {
  id: string;
  label: string;
  value: string;
  description: string;
  iconType: "card" | "check" | "truck";
}

export interface RiderWalletRecord {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  email?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  rawBalance?: number;
  codBalance: number | string;
  isActive: boolean;
  dutyStatus: "ON DUTY" | "OFF DUTY" | "ACTIVE" | "INACTIVE" | string;
  pendingDeliveriesCount?: number;
}

export interface RiderCanvasProps {
  title?: string;
  subtitle?: string;
  metrics?: RiderSummaryMetric[];
  riders?: RiderWalletRecord[];
  searchQuery?: string;
  onViewWallet?: (rider: RiderWalletRecord) => void;
  onAddDeliveryAgent?: () => void;
  onAddDeliveryBoy?: () => void;
}

const DEFAULT_METRICS: RiderSummaryMetric[] = [
  {
    id: "total_cod",
    label: "Total COD Outstanding",
    value: "₹0",
    description: "Cumulative cash held by active delivery riders",
    iconType: "card",
  },
  {
    id: "cash_collected",
    label: "Cash Collected Today",
    value: "₹0",
    description: "Deposited safely to partner cash drawers",
    iconType: "check",
  },
  {
    id: "active_squad",
    label: "Active Delivery Squad",
    value: "0 Riders Online",
    description: "Real-time geofenced tracking configured",
    iconType: "truck",
  },
];

const DEFAULT_RIDERS: RiderWalletRecord[] = [];

export default function RiderCanvas({
  title = "COD Cash Collection & Delivery Logs",
  subtitle = "Audit outstanding cash collections, manage delivery riders, and assign delivery routes.",
  metrics: initialMetrics,
  riders: initialRiders,
  searchQuery = "",
  onViewWallet,
  onAddDeliveryAgent,
  onAddDeliveryBoy,
}: RiderCanvasProps) {
  const router = useRouter();
  const [riderList, setRiderList] = useState<RiderWalletRecord[]>(initialRiders || DEFAULT_RIDERS);
  const [metricsList, setMetricsList] = useState<RiderSummaryMetric[]>(initialMetrics || DEFAULT_METRICS);
  const [isLoading, setIsLoading] = useState(false);

  // Modal States
  const [editingRider, setEditingRider] = useState<RiderWalletRecord | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    vehicleType: "Motorcycle / Scooter",
    vehicleNumber: "",
    isActive: true,
  });
  const [editFormError, setEditFormError] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Modal State
  const [deletingRider, setDeletingRider] = useState<RiderWalletRecord | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick Toast Notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const loadRiders = async () => {
    try {
      setIsLoading(true);
      const res = await fetchApi("/api/seller/delivery");
      if (res.ok) {
        const data = await res.json();
        const list = data.data?.deliveryPersons || data.deliveryPersons || data.data || [];
        if (Array.isArray(list)) {
          const mapped: RiderWalletRecord[] = list.map((dp: any) => {
            const rawBal = Number(dp.outstandingBalance) || 0;
            const isAct = dp.isActive === true;
            return {
              id: dp.id,
              userId: dp.userId,
              name: dp.name || "Unnamed Rider",
              phone: dp.phone || "",
              email: dp.email || "",
              vehicleType: dp.vehicleType || "Motorcycle / Scooter",
              vehicleNumber: dp.vehicleNumber || "",
              rawBalance: rawBal,
              codBalance: `₹${rawBal.toLocaleString("en-IN")}`,
              isActive: isAct,
              dutyStatus: isAct ? "ON DUTY" : "OFF DUTY",
              pendingDeliveriesCount: Number(dp.pendingDeliveriesCount) || 0,
            };
          });
          setRiderList(mapped);

          const totalCod = list.reduce((sum: number, dp: any) => sum + (Number(dp.outstandingBalance) || 0), 0);
          const activeCount = list.filter((dp: any) => dp.isActive).length;

          setMetricsList([
            {
              id: "total_cod",
              label: "Total COD Outstanding",
              value: `₹${totalCod.toLocaleString("en-IN")}`,
              description: "Cumulative cash held by active delivery riders",
              iconType: "card",
            },
            {
              id: "cash_collected",
              label: "Cash Collected Today",
              value: "₹0",
              description: "Deposited safely to partner cash drawers",
              iconType: "check",
            },
            {
              id: "active_squad",
              label: "Active Delivery Squad",
              value: `${activeCount} Rider${activeCount === 1 ? "" : "s"} Online`,
              description: "Real-time geofenced tracking configured",
              iconType: "truck",
            },
          ]);
        }
      }
    } catch (err) {
      console.error("Failed to load seller delivery data in RiderCanvas:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialRiders !== undefined) {
      setRiderList(initialRiders);
      return;
    }
    loadRiders();
  }, [initialRiders]);

  const metrics = metricsList;
  const filteredRiders = useMemo(() => {
    if (!searchQuery.trim()) return riderList;
    const q = searchQuery.toLowerCase().trim();
    return riderList.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.vehicleNumber && r.vehicleNumber.toLowerCase().includes(q)) ||
        r.dutyStatus.toLowerCase().includes(q) ||
        r.codBalance.toString().toLowerCase().includes(q)
    );
  }, [riderList, searchQuery]);
  const riders = filteredRiders;

  // Toggle Active/Inactive Status
  const handleToggleStatus = async (rider: RiderWalletRecord, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const newStatus = !rider.isActive;
    // Optimistic UI update
    setRiderList((prev) =>
      prev.map((r) =>
        r.id === rider.id
          ? {
              ...r,
              isActive: newStatus,
              dutyStatus: newStatus ? "ON DUTY" : "OFF DUTY",
            }
          : r
      )
    );

    try {
      const res = await fetchApi(`/api/seller/delivery/${rider.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (res.ok) {
        showToast(
          `${rider.name} marked as ${newStatus ? "Active / On Duty" : "Inactive / Off Duty"}`,
          "success"
        );
        // Recalculate metrics
        setMetricsList((prev) =>
          prev.map((m) => {
            if (m.id === "active_squad") {
              const updatedList = riderList.map((r) =>
                r.id === rider.id ? { ...r, isActive: newStatus } : r
              );
              const count = updatedList.filter((r) => r.isActive).length;
              return {
                ...m,
                value: `${count} Rider${count === 1 ? "" : "s"} Online`,
              };
            }
            return m;
          })
        );
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.message || data.error || "Failed to update status", "error");
        // Revert
        setRiderList((prev) =>
          prev.map((r) => (r.id === rider.id ? { ...r, isActive: rider.isActive } : r))
        );
      }
    } catch (err: any) {
      showToast(err.message || "Network error updating status", "error");
      setRiderList((prev) =>
        prev.map((r) => (r.id === rider.id ? { ...r, isActive: rider.isActive } : r))
      );
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (rider: RiderWalletRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingRider(rider);
    setEditFormData({
      name: rider.name,
      phone: rider.phone,
      email: rider.email || "",
      password: "",
      vehicleType: rider.vehicleType || "Motorcycle / Scooter",
      vehicleNumber: rider.vehicleNumber || "",
      isActive: rider.isActive,
    });
    setEditFormError("");
  };

  // Save Edit Delivery Boy Form
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRider) return;

    if (!editFormData.name.trim()) {
      setEditFormError("Please enter rider name.");
      return;
    }

    const cleanPhone = editFormData.phone.replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10) {
      setEditFormError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (editFormData.email.trim()) {
      const emailCheck = validateEmail(editFormData.email);
      if (!emailCheck.isValid) {
        setEditFormError(emailCheck.error || "Please enter a valid email address.");
        return;
      }
    }

    if (editFormData.password && editFormData.password.length < 6) {
      setEditFormError("Password must be at least 6 characters long.");
      return;
    }

    setEditFormError("");
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
        const data = await res.json();
        const updated = data.data?.deliveryPerson || data.deliveryPerson;

        setRiderList((prev) =>
          prev.map((r) =>
            r.id === editingRider.id
              ? {
                  ...r,
                  name: updated?.name || payload.name,
                  phone: updated?.phone || cleanPhone,
                  email: updated?.email || payload.email || r.email,
                  vehicleType: updated?.vehicleType || payload.vehicleType,
                  vehicleNumber: updated?.vehicleNumber || payload.vehicleNumber,
                  isActive: updated?.isActive !== undefined ? updated.isActive : payload.isActive,
                  dutyStatus: (updated?.isActive ?? payload.isActive) ? "ON DUTY" : "OFF DUTY",
                }
              : r
          )
        );

        showToast("Delivery agent updated successfully!", "success");
        setEditingRider(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setEditFormError(data.message || data.error || "Failed to update delivery agent.");
      }
    } catch (err: any) {
      setEditFormError(err.message || "Failed to update delivery agent.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Open Delete Confirmation
  const handleOpenDelete = (rider: RiderWalletRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeletingRider(rider);
    setDeleteError("");
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingRider) return;

    // Client-side quick check
    const rawBal = Number(deletingRider.rawBalance) || 0;
    const pendingCount = Number(deletingRider.pendingDeliveriesCount) || 0;

    if (rawBal > 0 || pendingCount > 0) {
      const reason =
        rawBal > 0 && pendingCount > 0
          ? `has an outstanding COD balance of ₹${rawBal.toLocaleString("en-IN")} and ${pendingCount} active pending deliveries`
          : rawBal > 0
          ? `has an outstanding COD balance of ₹${rawBal.toLocaleString("en-IN")}`
          : `has ${pendingCount} active pending deliver${pendingCount === 1 ? "y" : "ies"}`;

      setDeleteError(
        `Cannot delete delivery agent: ${deletingRider.name} ${reason}. Please settle balance and complete/reassign pending deliveries first, or mark the agent as Inactive.`
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
        setRiderList((prev) => prev.filter((r) => r.id !== deletingRider.id));
        showToast(`Delivery agent ${deletingRider.name} deleted successfully.`, "success");
        setDeletingRider(null);
        // Refresh metrics
        loadRiders();
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

  // Render Metric Icon Badge
  const renderMetricIcon = (type: "card" | "check" | "truck") => {
    switch (type) {
      case "card":
        return (
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              backgroundColor: "#FFF1E8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#F97316",
              flexShrink: 0,
            }}
          >
            <CreditCard size={18} color="#F97316" />
          </div>
        );
      case "check":
        return (
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              backgroundColor: "#EFF6FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#3B82F6",
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={18} color="#3B82F6" />
          </div>
        );
      case "truck":
        return (
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              backgroundColor: "#FEF3C7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#D97706",
              flexShrink: 0,
            }}
          >
            <Truck size={18} color="#D97706" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "1200px",
        minHeight: "960px",
        height: "100%",
        backgroundColor: "#F7F8FB",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        padding: "32px",
        boxSizing: "border-box",
        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
        position: "relative",
      }}
      className="rider-canvas-container"
    >
      {/* Toast Alert */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            backgroundColor: toast.type === "success" ? "#10B981" : "#EF4444",
            color: "#FFFFFF",
            padding: "12px 20px",
            borderRadius: "10px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            fontSize: "13.5px",
            fontWeight: 600,
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            animation: "fadeInDown 0.25s ease",
          }}
        >
          {toast.type === "success" ? <Check size={16} /> : <AlertTriangle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Constrained Content */}
      <div
        style={{
          width: "100%",
          maxWidth: "1120px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          boxSizing: "border-box",
        }}
        className="constrained-content"
      >
        {/* Frame 1: Header */}
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            boxSizing: "border-box",
          }}
          className="header-frame-1"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: 800,
                color: "#0F172A",
                margin: 0,
                letterSpacing: "-0.4px",
                lineHeight: 1.25,
              }}
            >
              {title}
            </h1>
            <p
              style={{
                fontSize: "13.5px",
                color: "#64748B",
                margin: 0,
                fontWeight: 400,
              }}
            >
              {subtitle}
            </p>
          </div>

          {/* Add Delivery Boy Action Button */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={
                onAddDeliveryAgent ||
                onAddDeliveryBoy ||
                (() => router.push("/seller/delivery/add-agent"))
              }
              style={{
                backgroundColor: "#F97316",
                backgroundImage: "linear-gradient(135deg, #FF5500 0%, #F97316 100%)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                padding: "10px 20px",
                fontSize: "13.5px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(249, 115, 22, 0.28)",
                transition: "all 0.18s ease",
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
              className="add-delivery-boy-btn"
            >
              <UserPlus size={16} />
              <span>Add Delivery Boy</span>
            </button>
          </div>
        </div>

        {/* Frame 2: 3 Cards Row */}
        <div
          style={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "24px",
            boxSizing: "border-box",
          }}
          className="metrics-frame-2"
        >
          {metrics.map((metric) => (
            <div
              key={metric.id}
              style={{
                width: "100%",
                minHeight: "138px",
                backgroundColor: "#FFFFFF",
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
                padding: "24px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "12px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
              }}
              className="metric-card-frame"
            >
              {/* Card Top Row: Label + Icon */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <span
                  style={{
                    fontSize: "13.5px",
                    fontWeight: 600,
                    color: "#475569",
                    lineHeight: 1.2,
                  }}
                >
                  {metric.label}
                </span>
                {renderMetricIcon(metric.iconType)}
              </div>

              {/* Card Bottom: Metric Value + Description */}
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <span
                  style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    color: "#0F172A",
                    letterSpacing: "-0.5px",
                    lineHeight: 1.15,
                  }}
                >
                  {metric.value}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 400,
                    color: "#64748B",
                    lineHeight: 1.3,
                  }}
                >
                  {metric.description}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Frame 3: Rider Status & Management Table */}
        <div
          style={{
            width: "100%",
            minHeight: "430px",
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            padding: "24px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.02)",
          }}
          className="table-frame-3"
        >
          {/* Card Header with count */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#0F172A",
                margin: 0,
                letterSpacing: "-0.2px",
              }}
            >
              Delivery Squad Roster ({riders.length})
            </h2>
            <span style={{ fontSize: "12.5px", color: "#64748B" }}>
              Toggle status, edit details, or audit COD cash collection
            </span>
          </div>

          {/* Table Container */}
          <div
            style={{
              width: "100%",
              overflowX: "auto",
              boxSizing: "border-box",
            }}
            className="rider-table-wrapper"
          >
            <table
              style={{
                width: "100%",
                minWidth: "850px",
                borderCollapse: "collapse",
                textAlign: "left",
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              }}
            >
              {/* Table Header Row */}
              <thead>
                <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <th
                    style={{
                      padding: "10px 0",
                      fontSize: "11.5px",
                      fontWeight: 700,
                      color: "#64748B",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      width: "28%",
                    }}
                  >
                    RIDER DETAILS
                  </th>
                  <th
                    style={{
                      padding: "10px 0",
                      fontSize: "11.5px",
                      fontWeight: 700,
                      color: "#64748B",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      width: "18%",
                    }}
                  >
                    PHONE NUMBER
                  </th>
                  <th
                    style={{
                      padding: "10px 0",
                      fontSize: "11.5px",
                      fontWeight: 700,
                      color: "#64748B",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      width: "15%",
                    }}
                  >
                    COD BALANCE
                  </th>
                  <th
                    style={{
                      padding: "10px 0",
                      fontSize: "11.5px",
                      fontWeight: 700,
                      color: "#64748B",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      width: "15%",
                    }}
                  >
                    STATUS
                  </th>
                  <th
                    style={{
                      padding: "10px 0",
                      fontSize: "11.5px",
                      fontWeight: 700,
                      color: "#64748B",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      textAlign: "right",
                      width: "24%",
                    }}
                  >
                    ACTIONS
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {riders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: "48px 16px",
                        textAlign: "center",
                        color: "#64748B",
                        fontSize: "14px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        <Truck size={36} color="#CBD5E1" />
                        <span style={{ fontWeight: 600, color: "#1E293B", fontSize: "15px" }}>
                          No Delivery Riders Found
                        </span>
                        <span style={{ fontSize: "13px", color: "#64748B", maxWidth: "360px" }}>
                          Register your in-house delivery squad to assign orders and track live cash-on-delivery collections.
                        </span>
                        <button
                          type="button"
                          onClick={
                            onAddDeliveryAgent ||
                            onAddDeliveryBoy ||
                            (() => router.push("/seller/delivery/add-agent"))
                          }
                          style={{
                            marginTop: "8px",
                            backgroundColor: "#F97316",
                            color: "#FFFFFF",
                            border: "none",
                            borderRadius: "8px",
                            padding: "9px 18px",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            boxShadow: "0 2px 6px rgba(249, 115, 22, 0.25)",
                          }}
                        >
                          <UserPlus size={15} />
                          <span>Add Delivery Boy</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  riders.map((rider, index) => {
                    const isAct = rider.isActive;
                    const isZeroBalance =
                      rider.codBalance === "₹0" ||
                      rider.codBalance === 0 ||
                      rider.codBalance === "0";

                    return (
                      <tr
                        key={rider.id || index}
                        style={{
                          borderBottom:
                            index !== riders.length - 1 ? "1px solid #F1F5F9" : "none",
                          transition: "background-color 0.15s ease",
                        }}
                        className="rider-table-row"
                      >
                        {/* Rider Details (Avatar + Name + Vehicle Info) */}
                        <td style={{ padding: "14px 0", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                backgroundColor: isAct ? "#ECFDF5" : "#F1F5F9",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: isAct ? "#10B981" : "#64748B",
                                flexShrink: 0,
                                border: isAct ? "1.5px solid #A7F3D0" : "1.5px solid #E2E8F0",
                              }}
                            >
                              <User size={18} />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span
                                style={{
                                  fontSize: "14px",
                                  fontWeight: 700,
                                  color: "#0F172A",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {rider.name}
                              </span>
                              <span style={{ fontSize: "11.5px", color: "#64748B" }}>
                                {rider.vehicleNumber
                                  ? `${rider.vehicleNumber} • ${rider.vehicleType || "Scooter"}`
                                  : rider.vehicleType || (rider.email ? rider.email : "Delivery Partner")}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Phone Number */}
                        <td
                          style={{
                            padding: "14px 0",
                            verticalAlign: "middle",
                            fontSize: "13.5px",
                            color: "#475569",
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {rider.phone}
                        </td>

                        {/* COD Balance */}
                        <td
                          style={{
                            padding: "14px 0",
                            verticalAlign: "middle",
                            fontSize: "14px",
                            fontWeight: 700,
                            color: isZeroBalance ? "#475569" : "#DC2626",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {typeof rider.codBalance === "number"
                            ? `₹${rider.codBalance.toLocaleString("en-IN")}`
                            : rider.codBalance}
                        </td>

                        {/* Active / Inactive Status Toggle Button */}
                        <td style={{ padding: "14px 0", verticalAlign: "middle" }}>
                          <button
                            type="button"
                            onClick={(e) => handleToggleStatus(rider, e)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 10px",
                              borderRadius: "20px",
                              fontSize: "11px",
                              fontWeight: 700,
                              letterSpacing: "0.3px",
                              border: isAct ? "1px solid #A7F3D0" : "1px solid #CBD5E1",
                              backgroundColor: isAct ? "#ECFDF5" : "#F8FAFC",
                              color: isAct ? "#059669" : "#64748B",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                              whiteSpace: "nowrap",
                            }}
                            title={`Click to mark as ${isAct ? "Inactive" : "Active"}`}
                          >
                            <span
                              style={{
                                width: "7px",
                                height: "7px",
                                borderRadius: "50%",
                                backgroundColor: isAct ? "#10B981" : "#94A3B8",
                              }}
                            />
                            <span>{isAct ? "Active" : "Inactive"}</span>
                          </button>
                        </td>

                        {/* Actions (Edit, Delete, View Wallet) */}
                        <td
                          style={{
                            padding: "14px 0",
                            verticalAlign: "middle",
                            textAlign: "right",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={(e) => handleOpenEdit(rider, e)}
                              style={{
                                border: "1px solid #E2E8F0",
                                backgroundColor: "#FFFFFF",
                                color: "#334155",
                                borderRadius: "6px",
                                padding: "5px 9px",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                transition: "all 0.15s ease",
                              }}
                              className="edit-rider-btn"
                              title="Edit delivery boy details"
                            >
                              <Edit3 size={13} color="#64748B" />
                              <span>Edit</span>
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={(e) => handleOpenDelete(rider, e)}
                              style={{
                                border: "1px solid #FEE2E2",
                                backgroundColor: "#FEF2F2",
                                color: "#DC2626",
                                borderRadius: "6px",
                                padding: "5px 9px",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                transition: "all 0.15s ease",
                              }}
                              className="delete-rider-btn"
                              title="Delete delivery boy"
                            >
                              <Trash2 size={13} color="#DC2626" />
                              <span>Delete</span>
                            </button>

                            {/* View Wallet / Ledger */}
                            <button
                              type="button"
                              onClick={() => {
                                if (onViewWallet) {
                                  onViewWallet(rider);
                                } else {
                                  router.push(
                                    `/seller/delivery/settlements?riderId=${encodeURIComponent(
                                      rider.id
                                    )}`
                                  );
                                }
                              }}
                              style={{
                                background: "none",
                                border: "none",
                                padding: "5px 4px",
                                color: "#FF5500",
                                fontSize: "12.5px",
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                                transition: "all 0.15s ease",
                              }}
                              className="view-wallet-btn"
                              title="View cash ledger & settlements"
                            >
                              <span>Wallet</span>
                              <ArrowRight size={13} strokeWidth={2.5} />
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
        </div>
      </div>

      {/* 1. Edit Delivery Boy Modal */}
      {editingRider && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onClick={() => setEditingRider(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
              border: "1px solid #E2E8F0",
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #F1F5F9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#FFF9F5",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    backgroundColor: "#FFF1E8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FF5500",
                  }}
                >
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0F172A" }}>
                    Edit Delivery Boy
                  </h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748B" }}>
                    Update rider profile and vehicle credentials
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRider(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94A3B8",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form
              onSubmit={handleSaveEdit}
              style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}
            >
              {editFormError && (
                <div
                  style={{
                    backgroundColor: "#FEF2F2",
                    border: "1px solid #FCA5A5",
                    color: "#DC2626",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    fontSize: "12.5px",
                    fontWeight: 500,
                  }}
                >
                  {editFormError}
                </div>
              )}

              {/* Name */}
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                  Full Name *
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <User size={16} color="#94A3B8" style={{ position: "absolute", left: "12px" }} />
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    required
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px 0 38px",
                      borderRadius: "8px",
                      border: "1.5px solid #CBD5E1",
                      fontSize: "13.5px",
                      color: "#0F172A",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Phone */}
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                  Mobile Number (10 digits) *
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Phone size={16} color="#94A3B8" style={{ position: "absolute", left: "12px" }} />
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
                    placeholder="9876543210"
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px 0 38px",
                      borderRadius: "8px",
                      border: "1.5px solid #CBD5E1",
                      fontSize: "13.5px",
                      color: "#0F172A",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Email */}
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                  Email Address
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Mail size={16} color="#94A3B8" style={{ position: "absolute", left: "12px" }} />
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    placeholder="rider@example.com"
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px 0 38px",
                      borderRadius: "8px",
                      border: "1.5px solid #CBD5E1",
                      fontSize: "13.5px",
                      color: "#0F172A",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Vehicle Type & Number Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                    Vehicle Type
                  </label>
                  <select
                    value={editFormData.vehicleType}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, vehicleType: e.target.value })
                    }
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "8px",
                      border: "1.5px solid #CBD5E1",
                      fontSize: "13px",
                      color: "#0F172A",
                      outline: "none",
                      backgroundColor: "#FFFFFF",
                    }}
                  >
                    <option value="Motorcycle / Scooter">Motorcycle / Scooter</option>
                    <option value="Electric Bike">Electric Bike</option>
                    <option value="Bicycle">Bicycle</option>
                    <option value="Car / Van">Car / Van</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    value={editFormData.vehicleNumber}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        vehicleNumber: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="e.g. MH-12-AB-1234"
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "8px",
                      border: "1.5px solid #CBD5E1",
                      fontSize: "13.5px",
                      color: "#0F172A",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Password (Optional update) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                  Change Password (optional)
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Key size={16} color="#94A3B8" style={{ position: "absolute", left: "12px" }} />
                  <input
                    type="password"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    placeholder="Leave empty to keep unchanged"
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px 0 38px",
                      borderRadius: "8px",
                      border: "1.5px solid #CBD5E1",
                      fontSize: "13.5px",
                      color: "#0F172A",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Active Status Checkbox */}
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  marginTop: "4px",
                  userSelect: "none",
                }}
              >
                <input
                  type="checkbox"
                  checked={editFormData.isActive}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, isActive: e.target.checked })
                  }
                  style={{ width: "16px", height: "16px", accentColor: "#FF5500" }}
                />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#1E293B" }}>
                  Agent is Active & available for order assignments
                </span>
              </label>

              {/* Modal Buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "12px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setEditingRider(null)}
                  style={{
                    padding: "9px 18px",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    color: "#475569",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  style={{
                    padding: "9px 22px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#FF5500",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: isSavingEdit ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {isSavingEdit && <Loader2 size={14} className="animate-spin" />}
                  <span>{isSavingEdit ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Delete Confirmation Modal */}
      {deletingRider && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onClick={() => setDeletingRider(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "460px",
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
              border: "1px solid #E2E8F0",
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #F1F5F9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#FEF2F2",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    backgroundColor: "#FEE2E2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#DC2626",
                  }}
                >
                  <Trash2 size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#991B1B" }}>
                    Delete Delivery Boy
                  </h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748B" }}>
                    {deletingRider.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeletingRider(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94A3B8",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {deleteError ? (
                <div
                  style={{
                    backgroundColor: "#FEF2F2",
                    border: "1.5px solid #FCA5A5",
                    color: "#991B1B",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    lineHeight: "1.4",
                    display: "flex",
                    gap: "8px",
                    alignItems: "flex-start",
                  }}
                >
                  <AlertTriangle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>{deleteError}</div>
                </div>
              ) : (
                <>
                  <p style={{ margin: 0, fontSize: "14px", color: "#334155", lineHeight: "1.5" }}>
                    Are you sure you want to permanently delete delivery agent{" "}
                    <strong>{deletingRider.name}</strong>?
                  </p>
                  <div
                    style={{
                      backgroundColor: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: "10px",
                      padding: "12px 16px",
                      fontSize: "12.5px",
                      color: "#64748B",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <div>
                      <strong>Outstanding COD:</strong>{" "}
                      <span
                        style={{
                          color:
                            (Number(deletingRider.rawBalance) || 0) > 0 ? "#DC2626" : "#10B981",
                          fontWeight: 700,
                        }}
                      >
                        {typeof deletingRider.codBalance === "number"
                          ? `₹${deletingRider.codBalance}`
                          : deletingRider.codBalance}
                      </span>
                    </div>
                    <div>
                      <strong>Active Pending Deliveries:</strong>{" "}
                      <span>{deletingRider.pendingDeliveriesCount || 0}</span>
                    </div>
                  </div>
                </>
              )}

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setDeletingRider(null)}
                  style={{
                    padding: "9px 18px",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    color: "#475569",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
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
                      padding: "9px 20px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "#DC2626",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: isDeleting ? "not-allowed" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {isDeleting && <Loader2 size={14} className="animate-spin" />}
                    <span>{isDeleting ? "Deleting..." : "Delete Delivery Boy"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .view-wallet-btn:hover {
          color: #ea580c !important;
          transform: translateX(2px);
        }
        .edit-rider-btn:hover {
          background-color: #f8fafc !important;
          border-color: #cbd5e1 !important;
        }
        .delete-rider-btn:hover {
          background-color: #fee2e2 !important;
          border-color: #fca5a5 !important;
        }
        @media (max-width: 900px) {
          .rider-canvas-container {
            padding: 20px 16px !important;
          }
          .metrics-frame-2 {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
