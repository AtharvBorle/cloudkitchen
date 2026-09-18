"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  AlertTriangle,
  ArrowRight,
  Download,
  Calendar,
  FileSpreadsheet,
  X,
  CheckCircle2,
  Loader2,
  DollarSign,
  CreditCard,
  ChevronDown,
} from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";

export interface RiderProfileInfo {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  vehicleNumber: string;
  status: string;
}

export interface CashCollectionBalanceInfo {
  balance: string | number;
  rawBalance?: number;
  riderName: string;
  limitAmount?: string;
  warningMessage?: string;
}

export interface LedgerEntry {
  id: string;
  type: "Collection" | "Settlement" | "Adjustment" | string;
  description: string;
  amount: string;
  isPositive: boolean;
  dateTime: string;
  date?: string;
}

export interface RiderSummaryItem {
  id: string;
  name: string;
  phone: string;
  balance: number;
  status: string;
}

export interface RiderSettlementsProps {
  title?: string;
  subtitle?: string;
  riderProfile?: RiderProfileInfo;
  cashBalance?: CashCollectionBalanceInfo;
  ledgerHistory?: LedgerEntry[];
  allRiders?: RiderSummaryItem[];
  selectedRiderId?: string;
  onSelectRider?: (riderId: string) => void;
  searchQuery?: string;
  onAddDeliveryAgent?: () => void;
  onRecordSettlement?: () => void;
  onSettlementRecorded?: (amount: number, newBalance: number) => void;
}

const DEFAULT_RIDER_PROFILE: RiderProfileInfo = {
  name: "",
  phone: "",
  vehicleNumber: "",
  status: "",
};

const DEFAULT_CASH_BALANCE: CashCollectionBalanceInfo = {
  balance: "₹0",
  rawBalance: 0,
  riderName: "",
  limitAmount: "₹5,000",
  warningMessage: "No outstanding cash currently held.",
};

const DEFAULT_LEDGER_HISTORY: LedgerEntry[] = [];

export default function RiderSettlements({
  title = "Rider Management & Settlements",
  subtitle = "Manage delivery agents, view cash balance, and record settlement ledger.",
  riderProfile = DEFAULT_RIDER_PROFILE,
  cashBalance = DEFAULT_CASH_BALANCE,
  ledgerHistory = DEFAULT_LEDGER_HISTORY,
  allRiders = [],
  selectedRiderId,
  onSelectRider,
  searchQuery = "",
  onAddDeliveryAgent,
  onRecordSettlement,
  onSettlementRecorded,
}: RiderSettlementsProps) {
  const router = useRouter();

  // Local state for interactive balance & ledger updates
  const [currentBalance, setCurrentBalance] = useState<number>(() => {
    if (typeof cashBalance.rawBalance === "number") return cashBalance.rawBalance;
    if (typeof cashBalance.balance === "number") return cashBalance.balance;
    const num = parseFloat(String(cashBalance.balance).replace(/[^0-9.]/g, ""));
    return isNaN(num) ? 0 : num;
  });

  const [currentLedger, setCurrentLedger] = useState<LedgerEntry[]>(ledgerHistory);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [settleAmount, setSettleAmount] = useState<string>("");
  const [settlePaymentMode, setSettlePaymentMode] = useState<string>("CASH");
  const [settleNote, setSettleNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof cashBalance.rawBalance === "number") {
      setCurrentBalance(cashBalance.rawBalance);
    } else if (typeof cashBalance.balance === "number") {
      setCurrentBalance(cashBalance.balance);
    } else {
      const num = parseFloat(String(cashBalance.balance).replace(/[^0-9.]/g, ""));
      setCurrentBalance(isNaN(num) ? 0 : num);
    }
  }, [cashBalance]);

  useEffect(() => {
    setCurrentLedger(ledgerHistory);
  }, [ledgerHistory]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleOpenRecordModal = () => {
    if (onRecordSettlement) {
      onRecordSettlement();
      return;
    }
    setSettleAmount(currentBalance > 0 ? currentBalance.toString() : "1000");
    setSettlePaymentMode("CASH");
    setSettleNote("");
    setIsRecordModalOpen(true);
  };

  const handleConfirmSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(settleAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert("Please enter a valid settlement amount greater than ₹0");
      return;
    }

    if (amountVal > currentBalance && currentBalance > 0) {
      alert(`Settlement amount cannot exceed current outstanding balance of ₹${currentBalance.toLocaleString("en-IN")}`);
      return;
    }

    const riderId = riderProfile.id || selectedRiderId;
    setIsSubmitting(true);
    try {
      if (riderId) {
        const res = await fetchApi(`/api/seller/delivery/${riderId}/collect`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amountVal,
            description: settleNote ? `Cash settlement (${settlePaymentMode}) - ${settleNote}` : `Cash handover to owner console (${settlePaymentMode})`,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          alert(errData?.message || errData?.error || "Failed to record settlement");
          setIsSubmitting(false);
          return;
        }
      }

      const newBal = Math.max(0, currentBalance - amountVal);
      setCurrentBalance(newBal);

      const newEntry: LedgerEntry = {
        id: `tx-settle-${Date.now()}`,
        type: "Settlement",
        description: settleNote ? `Cash handover (${settlePaymentMode}): ${settleNote}` : `Cash Handover to Owner Console (${settlePaymentMode})`,
        amount: `-₹${amountVal.toLocaleString("en-IN")}`,
        isPositive: false,
        dateTime: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric" }) + ", " + new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        date: new Date().toISOString().slice(0, 10),
      };

      setCurrentLedger((prev) => [newEntry, ...prev]);
      setIsRecordModalOpen(false);
      showToast(`Settlement of ₹${amountVal.toLocaleString("en-IN")} recorded successfully for ${riderProfile.name}!`);
      if (onSettlementRecorded) {
        onSettlementRecorded(amountVal, newBal);
      }
    } catch (err) {
      console.error("Settlement error:", err);
      alert("Failed to submit settlement. Please check network connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Date Filter States (From Date -> To Date)
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Helper to extract YYYY-MM-DD from an entry
  const getEntryDateString = (entry: LedgerEntry): string => {
    if (entry.date) return entry.date;
    const directDate = new Date(entry.dateTime);
    if (!isNaN(directDate.getTime())) {
      return directDate.toISOString().slice(0, 10);
    }
    const withYear = new Date(`${entry.dateTime}, ${new Date().getFullYear()}`);
    if (!isNaN(withYear.getTime())) {
      return withYear.toISOString().slice(0, 10);
    }
    return "";
  };

  // Filtered Ledger History by Date Range & Search Query
  const filteredLedger = useMemo(() => {
    return currentLedger.filter((item) => {
      const itemDateStr = getEntryDateString(item);

      if (fromDate && itemDateStr && itemDateStr < fromDate) {
        return false;
      }
      if (toDate && itemDateStr && itemDateStr > toDate) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          item.description.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q) ||
          item.amount.toLowerCase().includes(q) ||
          item.dateTime.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [currentLedger, fromDate, toDate, searchQuery]);

  const handleClearDateFilter = () => {
    setFromDate("");
    setToDate("");
  };

  // Download CSV Handler
  const handleDownloadCsv = () => {
    const headers = ["Type", "Description", "Amount", "Date & Time"];
    const rows = filteredLedger.map((item) => [
      `"${item.type.replace(/"/g, '""')}"`,
      `"${item.description.replace(/"/g, '""')}"`,
      `"${item.amount.replace(/"/g, '""')}"`,
      `"${item.dateTime.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `rider_ledger_${riderProfile.name.toLowerCase().replace(/\s+/g, "_")}_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Render badge based on ledger entry type
  const renderTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case "collection":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#EFF6FF",
              color: "#3B82F6",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 600,
              padding: "3px 8px",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
            }}
          >
            Collection
          </span>
        );
      case "settlement":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#FFF1E8",
              color: "#F97316",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 600,
              padding: "3px 8px",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
            }}
          >
            Settlement
          </span>
        );
      case "adjustment":
      default:
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#F1F5F9",
              color: "#64748B",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 600,
              padding: "3px 8px",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
            }}
          >
            Adjustment
          </span>
        );
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
      }}
      className="rider-settlements-container"
    >
      {/* Constrained Content (Width: 1120px, Gap: 24px) */}
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
        {/* Section Header (Width: 1120px, Height: 50px, Justify: space-between) */}
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxSizing: "border-box",
            flexWrap: "wrap",
            gap: "12px",
          }}
          className="section-header"
        >
          {/* Header Title & Subtitle */}
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

          {/* Add Delivery Agent Button */}
          <button
            type="button"
            onClick={
              onAddDeliveryAgent ||
              (() => router.push("/seller/riderMng/settlements/add-agent"))
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
            }}
            className="add-agent-btn"
          >
            Add Delivery Agent
          </button>
        </div>

        {/* Two-Pane Layout (Width: 1120px, Gap: 24px) */}
        <div
          style={{
            width: "100%",
            display: "flex",
            gap: "24px",
            alignItems: "flex-start",
            boxSizing: "border-box",
          }}
          className="two-pane-wrapper"
        >
          {/* Frame 1: Left Cards Column (Width: 340px, Gap: 20px) */}
          <div
            style={{
              width: "340px",
              minWidth: "340px",
              maxWidth: "340px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              boxSizing: "border-box",
            }}
            className="left-frame-1"
          >
            {/* 1. Primary Rider Profile Card */}
            <div
              style={{
                width: "100%",
                backgroundColor: "#FFFFFF",
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
                padding: "20px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
              }}
              className="rider-profile-card"
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#0F172A",
                    margin: 0,
                    letterSpacing: "-0.2px",
                  }}
                >
                  Primary Rider Profile
                </h2>
                {allRiders && allRiders.length > 1 && (
                  <select
                    value={riderProfile.id || selectedRiderId}
                    onChange={(e) => onSelectRider && onSelectRider(e.target.value)}
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#FF5500",
                      backgroundColor: "#FFF7ED",
                      border: "1px solid #FFEDD5",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      cursor: "pointer",
                      outline: "none",
                      maxWidth: "150px",
                    }}
                  >
                    {allRiders.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Rider Avatar + Name + Phone */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    backgroundColor: "#FFF1E8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#F97316",
                    flexShrink: 0,
                  }}
                >
                  <User size={20} color="#F97316" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
                  <span
                    style={{
                      fontSize: "14.5px",
                      fontWeight: 700,
                      color: "#0F172A",
                    }}
                  >
                    {riderProfile.name || "No Rider Selected"}
                  </span>
                  <span
                    style={{
                      fontSize: "12.5px",
                      color: "#64748B",
                      fontWeight: 400,
                    }}
                  >
                    {riderProfile.phone || "—"}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div
                style={{
                  width: "100%",
                  height: "1px",
                  backgroundColor: "#F1F5F9",
                }}
              />

              {/* Vehicle Number & Status Key-Values */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: "12.5px", color: "#64748B" }}>
                    Vehicle Number
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#0F172A",
                      fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    }}
                  >
                    {riderProfile.vehicleNumber || "—"}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: "12.5px", color: "#64748B" }}>
                    Status
                  </span>
                  <span
                    style={{
                      backgroundColor: (riderProfile.status || "").toLowerCase().includes("on") ? "#FFF1E8" : "#F1F5F9",
                      color: (riderProfile.status || "").toLowerCase().includes("on") ? "#F97316" : "#64748B",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "6px",
                      letterSpacing: "0.4px",
                    }}
                  >
                    {riderProfile.status || "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Cash Collection Balance Card */}
            <div
              style={{
                width: "100%",
                backgroundColor: "#FFFFFF",
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
                padding: "20px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
              }}
              className="cash-balance-card"
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <h2
                  style={{
                    fontSize: "13.5px",
                    fontWeight: 700,
                    color: "#475569",
                    margin: 0,
                  }}
                >
                  Cash Collection Balance
                </h2>
                <span
                  style={{
                    fontSize: "28px",
                    fontWeight: 800,
                    color: "#0F172A",
                    letterSpacing: "-0.5px",
                    lineHeight: 1.15,
                  }}
                >
                  ₹{currentBalance.toLocaleString("en-IN")}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#94A3B8",
                    fontWeight: 400,
                  }}
                >
                  COD Cash currently held by {cashBalance.riderName || riderProfile.name || "Rider"}
                </span>
              </div>

              {/* Outstanding Warning Banner */}
              <div
                style={{
                  backgroundColor: currentBalance > 0 ? "#FFFBEB" : "#F0FDF4",
                  border: `1px solid ${currentBalance > 0 ? "#FEF08A" : "#BBF7D0"}`,
                  borderRadius: "8px",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "3px",
                  boxSizing: "border-box",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: currentBalance > 0 ? "#B45309" : "#15803D",
                  }}
                >
                  {currentBalance > 0 ? "Outstanding Warning" : "Balance Settled"}
                </span>
                <span
                  style={{
                    fontSize: "11.5px",
                    color: currentBalance > 0 ? "#D97706" : "#16A34A",
                    lineHeight: 1.4,
                  }}
                >
                  {currentBalance > 0
                    ? `Limit is ₹5,000. Collect cash soon to settle outstanding balance.`
                    : `All cash collected by ${riderProfile.name || "rider"} is fully settled.`}
                </span>
              </div>

              {/* Record Settlement Button */}
              <button
                type="button"
                onClick={handleOpenRecordModal}
                style={{
                  width: "100%",
                  height: "42px",
                  backgroundColor: "#F97316",
                  backgroundImage: "linear-gradient(135deg, #FF5500 0%, #F97316 100%)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "13.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(249, 115, 22, 0.25)",
                  transition: "all 0.18s ease",
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                }}
                className="record-settlement-btn"
              >
                Record Settlement
              </button>
            </div>
          </div>

          {/* Frame 2: Right Ledger Table Card (Width: 756px, Padding: 24px, Radius: 12px, Background: #FFFFFF, Border: 1px solid #E2E8F0) */}
          <div
            style={{
              flex: "1 1 756px",
              minWidth: 0,
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              padding: "24px",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
            }}
            className="right-frame-2"
          >
            {/* Header Row: Title on Left + Download CSV Button on Right */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
              }}
              className="ledger-header-row"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h2
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#0F172A",
                    margin: 0,
                    letterSpacing: "-0.2px",
                  }}
                >
                  Rider Ledger History
                </h2>
                <span
                  style={{
                    backgroundColor: "#F1F5F9",
                    color: "#64748B",
                    fontSize: "11.5px",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "12px",
                  }}
                >
                  {filteredLedger.length} records
                </span>
              </div>

              {/* Attractive Download CSV Button */}
              <button
                type="button"
                onClick={handleDownloadCsv}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  backgroundColor: "#FFFFFF",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: "8px",
                  padding: "7px 15px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: "#0F172A",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                }}
                className="download-csv-btn"
                title="Download current ledger records as CSV"
              >
                <FileSpreadsheet size={15} color="#FF5500" />
                <span>Download CSV</span>
                <Download size={13} color="#64748B" style={{ marginLeft: "2px" }} />
              </button>
            </div>

            {/* Date Filter Bar Row: From Date to To Date */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
                padding: "10px 14px",
                backgroundColor: "#F8FAFC",
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
                boxSizing: "border-box",
              }}
              className="ledger-date-filter-bar"
            >
              {/* Date Inputs Range */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#334155",
                    fontSize: "12.5px",
                    fontWeight: 600,
                  }}
                >
                  <Calendar size={15} color="#FF5500" />
                  <span>Filter by Date:</span>
                </div>

                {/* From Date */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <label
                    htmlFor="from-date-input"
                    style={{
                      fontSize: "12px",
                      color: "#64748B",
                      fontWeight: 500,
                    }}
                  >
                    From
                  </label>
                  <input
                    id="from-date-input"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    style={{
                      padding: "5px 10px",
                      borderRadius: "6px",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      fontSize: "12px",
                      color: "#0F172A",
                      outline: "none",
                      fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                      cursor: "pointer",
                      height: "32px",
                      boxSizing: "border-box",
                    }}
                    className="date-filter-input"
                  />
                </div>

                {/* To Date */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <label
                    htmlFor="to-date-input"
                    style={{
                      fontSize: "12px",
                      color: "#64748B",
                      fontWeight: 500,
                    }}
                  >
                    To
                  </label>
                  <input
                    id="to-date-input"
                    type="date"
                    value={toDate}
                    min={fromDate || undefined}
                    onChange={(e) => setToDate(e.target.value)}
                    style={{
                      padding: "5px 10px",
                      borderRadius: "6px",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      fontSize: "12px",
                      color: "#0F172A",
                      outline: "none",
                      fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                      cursor: "pointer",
                      height: "32px",
                      boxSizing: "border-box",
                    }}
                    className="date-filter-input"
                  />
                </div>
              </div>

              {/* Reset/Clear Filter Button */}
              {(fromDate || toDate) && (
                <button
                  type="button"
                  onClick={handleClearDateFilter}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "5px 10px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#64748B",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  className="clear-date-filter-btn"
                  title="Clear date filter"
                >
                  <X size={13} color="#EF4444" />
                  <span>Reset date filter</span>
                </button>
              )}
            </div>

            {/* Table Container */}
            <div
              style={{
                width: "100%",
                overflowX: "auto",
                boxSizing: "border-box",
              }}
              className="ledger-table-wrapper"
            >
              <table
                style={{
                  width: "100%",
                  minWidth: "600px",
                  borderCollapse: "collapse",
                  textAlign: "left",
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                }}
              >
                {/* Table Header Row */}
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid #F1F5F9",
                    }}
                  >
                    <th
                      style={{
                        padding: "8px 0",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#64748B",
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                        width: "16%",
                      }}
                    >
                      TYPE
                    </th>
                    <th
                      style={{
                        padding: "8px 0",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#64748B",
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                        width: "48%",
                      }}
                    >
                      DESCRIPTION
                    </th>
                    <th
                      style={{
                        padding: "8px 0",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#64748B",
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                        width: "16%",
                      }}
                    >
                      AMOUNT
                    </th>
                    <th
                      style={{
                        padding: "8px 0",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#64748B",
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                        textAlign: "right",
                        width: "20%",
                      }}
                    >
                      DATE & TIME
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody>
                  {filteredLedger.length > 0 ? (
                    filteredLedger.map((item, index) => {
                      const isSettlement =
                        item.type.toLowerCase() === "settlement" ||
                        item.amount.startsWith("-");

                      return (
                        <tr
                          key={item.id || index}
                          style={{
                            borderBottom:
                              index !== filteredLedger.length - 1
                                ? "1px solid #F8FAFC"
                                : "none",
                            transition: "background-color 0.15s ease",
                          }}
                          className="ledger-table-row"
                        >
                          {/* Type Badge */}
                          <td style={{ padding: "10px 0", verticalAlign: "middle" }}>
                            {renderTypeBadge(item.type)}
                          </td>

                          {/* Description */}
                          <td
                            style={{
                              padding: "10px 8px 10px 0",
                              verticalAlign: "middle",
                              fontSize: "13px",
                              fontWeight: 600,
                              color: "#1E293B",
                            }}
                          >
                            {item.description}
                          </td>

                          {/* Amount (+ in blue, - in orange/red) */}
                          <td
                            style={{
                              padding: "10px 0",
                              verticalAlign: "middle",
                              fontSize: "13px",
                              fontWeight: 700,
                              color: isSettlement ? "#EA580C" : "#2563EB",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.amount}
                          </td>

                          {/* Date & Time */}
                          <td
                            style={{
                              padding: "10px 0",
                              verticalAlign: "middle",
                              fontSize: "12px",
                              color: "#64748B",
                              fontWeight: 400,
                              textAlign: "right",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.dateTime}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          padding: "36px 0",
                          textAlign: "center",
                          color: "#94A3B8",
                          fontSize: "13px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span>No transactions found for the selected date range.</span>
                          {(fromDate || toDate) && (
                            <button
                              type="button"
                              onClick={handleClearDateFilter}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#FF5500",
                                fontSize: "12.5px",
                                fontWeight: 600,
                                cursor: "pointer",
                                textDecoration: "underline",
                              }}
                            >
                              Reset date filter
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Record Settlement Modal */}
      {isRecordModalOpen && (
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
          onClick={() => setIsRecordModalOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "480px",
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
                padding: "20px 24px",
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
                  <DollarSign size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0F172A" }}>
                    Record Cash Settlement
                  </h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748B" }}>
                    Handover COD cash from {riderProfile.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
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

            {/* Modal Body */}
            <form onSubmit={handleConfirmSettlement} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Rider Info Badge */}
              <div
                style={{
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0F172A" }}>
                    {riderProfile.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748B" }}>
                    {riderProfile.phone}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>CURRENT DUE</div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "#EA580C" }}>
                    ₹{currentBalance.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              {/* Settlement Amount Input */}
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Settlement Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  required
                  placeholder="Enter amount collected"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1.5px solid #CBD5E1",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#0F172A",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                {/* Quick Select Amount Chips */}
                <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => setSettleAmount(currentBalance.toString())}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      border: "1px solid #FFEDD5",
                      backgroundColor: "#FFF7ED",
                      color: "#EA580C",
                      fontSize: "11.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Full Balance (₹{currentBalance.toLocaleString("en-IN")})
                  </button>
                  {currentBalance > 1000 && (
                    <button
                      type="button"
                      onClick={() => setSettleAmount("1000")}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "6px",
                        border: "1px solid #E2E8F0",
                        backgroundColor: "#F8FAFC",
                        color: "#475569",
                        fontSize: "11.5px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      ₹1,000
                    </button>
                  )}
                  {currentBalance > 2000 && (
                    <button
                      type="button"
                      onClick={() => setSettleAmount("2000")}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "6px",
                        border: "1px solid #E2E8F0",
                        backgroundColor: "#F8FAFC",
                        color: "#475569",
                        fontSize: "11.5px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      ₹2,000
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Mode Selection */}
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Payment Mode
                </label>
                <select
                  value={settlePaymentMode}
                  onChange={(e) => setSettlePaymentMode(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1.5px solid #CBD5E1",
                    fontSize: "13.5px",
                    color: "#0F172A",
                    fontWeight: 600,
                    backgroundColor: "#FFFFFF",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="CASH">Physical Cash Handover</option>
                  <option value="UPI">Direct UPI Transfer</option>
                  <option value="BANK_TRANSFER">Bank Deposit / IMPS</option>
                </select>
              </div>

              {/* Reference Note */}
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Reference / Notes (Optional)
                </label>
                <input
                  type="text"
                  value={settleNote}
                  onChange={(e) => setSettleNote(e.target.value)}
                  placeholder="e.g. Received at kitchen counter"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1.5px solid #CBD5E1",
                    fontSize: "13.5px",
                    color: "#0F172A",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: "11px",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    color: "#475569",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    flex: 2,
                    padding: "11px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#FF5500",
                    backgroundImage: "linear-gradient(135deg, #FF5500 0%, #F97316 100%)",
                    color: "#FFFFFF",
                    fontSize: "13.5px",
                    fontWeight: 700,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 2px 8px rgba(249, 115, 22, 0.3)",
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Confirm & Record Settlement</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            backgroundColor: "#0F172A",
            color: "#FFFFFF",
            padding: "12px 20px",
            borderRadius: "10px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "13.5px",
            fontWeight: 600,
            zIndex: 99999,
          }}
        >
          <CheckCircle2 size={18} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}

      <style jsx>{`
        .add-agent-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.38) !important;
        }
        .record-settlement-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.38) !important;
        }
        .download-csv-btn:hover {
          border-color: #FF5500 !important;
          color: #FF5500 !important;
          background-color: #FFF9F5 !important;
          transform: translateY(-1px);
          box-shadow: 0 3px 10px rgba(255, 85, 0, 0.15) !important;
        }
        .date-filter-input:focus {
          border-color: #FF5500 !important;
          box-shadow: 0 0 0 2px rgba(255, 85, 0, 0.12) !important;
        }
        .clear-date-filter-btn:hover {
          border-color: #EF4444 !important;
          color: #EF4444 !important;
          background-color: #FEF2F2 !important;
        }
        .ledger-table-row:hover {
          background-color: #FAFAFA !important;
        }
        @media (max-width: 1024px) {
          .two-pane-wrapper {
            flex-direction: column !important;
          }
          .left-frame-1 {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 100% !important;
          }
          .right-frame-2 {
            width: 100% !important;
          }
        }
        @media (max-width: 768px) {
          .rider-settlements-container {
            padding: 20px 16px !important;
          }
          .ledger-header-row {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .download-csv-btn {
            width: 100% !important;
            justify-content: center !important;
          }
        }
      `}</style>
    </div>
  );
}
