"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  AlertTriangle,
  ArrowRight,
  Download,
  Calendar,
  FileSpreadsheet,
  X,
} from "lucide-react";

export interface RiderProfileInfo {
  name: string;
  phone: string;
  vehicleNumber: string;
  status: string;
}

export interface CashCollectionBalanceInfo {
  balance: string | number;
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

export interface RiderSettlementsProps {
  title?: string;
  subtitle?: string;
  riderProfile?: RiderProfileInfo;
  cashBalance?: CashCollectionBalanceInfo;
  ledgerHistory?: LedgerEntry[];
  onAddDeliveryAgent?: () => void;
  onRecordSettlement?: () => void;
}

const DEFAULT_RIDER_PROFILE: RiderProfileInfo = {
  name: "Ramesh Kumar",
  phone: "+91 98765 43210",
  vehicleNumber: "DL 3S CQ 8912",
  status: "On Duty",
};

const DEFAULT_CASH_BALANCE: CashCollectionBalanceInfo = {
  balance: "₹3,200",
  riderName: "Ramesh",
  limitAmount: "₹5,000",
  warningMessage:
    "Limit is ₹5,000. Collect cash soon to avoid automatic profile lock.",
};

const DEFAULT_LEDGER_HISTORY: LedgerEntry[] = [
  {
    id: "l1",
    type: "Collection",
    description: "Cash Collected from #NCR-8291 (Aditya Sharma)",
    amount: "+₹480",
    isPositive: true,
    dateTime: "Jan 24, 02:15 PM",
    date: "2026-01-24",
  },
  {
    id: "l2",
    type: "Settlement",
    description: "Cash Handover to Owner Console",
    amount: "-₹1,200",
    isPositive: false,
    dateTime: "Jan 24, 11:30 AM",
    date: "2026-01-24",
  },
  {
    id: "l3",
    type: "Collection",
    description: "Cash Collected from #NCR-8288 (Priya Nair)",
    amount: "+₹520",
    isPositive: true,
    dateTime: "Jan 23, 08:44 PM",
    date: "2026-01-23",
  },
  {
    id: "l4",
    type: "Adjustment",
    description: "Correction adjustment for delivery delay bonus",
    amount: "+₹100",
    isPositive: true,
    dateTime: "Jan 23, 05:00 PM",
    date: "2026-01-23",
  },
  {
    id: "l5",
    type: "Collection",
    description: "Cash Collected from #NCR-8272 (Sanjay Dutt)",
    amount: "+₹610",
    isPositive: true,
    dateTime: "Jan 22, 09:12 PM",
    date: "2026-01-22",
  },
  {
    id: "l6",
    type: "Settlement",
    description: "Cash Handover to Owner Console",
    amount: "-₹2,000",
    isPositive: false,
    dateTime: "Jan 22, 06:30 PM",
    date: "2026-01-22",
  },
  {
    id: "l7",
    type: "Collection",
    description: "Cash Collected from #NCR-8260 (Rajesh V)",
    amount: "+₹350",
    isPositive: true,
    dateTime: "Jan 21, 01:10 PM",
    date: "2026-01-21",
  },
  {
    id: "l8",
    type: "Collection",
    description: "Cash Collected from #NCR-8255 (Karan J)",
    amount: "+₹440",
    isPositive: true,
    dateTime: "Jan 20, 07:44 PM",
    date: "2026-01-20",
  },
];

export default function RiderSettlements({
  title = "Rider Management & Settlements",
  subtitle = "Manage delivery agents, view cash balance, and record settlement ledger.",
  riderProfile = DEFAULT_RIDER_PROFILE,
  cashBalance = DEFAULT_CASH_BALANCE,
  ledgerHistory = DEFAULT_LEDGER_HISTORY,
  onAddDeliveryAgent,
  onRecordSettlement,
}: RiderSettlementsProps) {
  const router = useRouter();

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

  // Filtered Ledger History by Date Range (From Date -> To Date)
  const filteredLedger = useMemo(() => {
    return ledgerHistory.filter((item) => {
      const itemDateStr = getEntryDateString(item);

      if (fromDate && itemDateStr && itemDateStr < fromDate) {
        return false;
      }
      if (toDate && itemDateStr && itemDateStr > toDate) {
        return false;
      }

      return true;
    });
  }, [ledgerHistory, fromDate, toDate]);

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
                    {riderProfile.name}
                  </span>
                  <span
                    style={{
                      fontSize: "12.5px",
                      color: "#64748B",
                      fontWeight: 400,
                    }}
                  >
                    {riderProfile.phone}
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
                    {riderProfile.vehicleNumber}
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
                      backgroundColor: "#FFF1E8",
                      color: "#F97316",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "6px",
                      letterSpacing: "0.4px",
                    }}
                  >
                    {riderProfile.status}
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
                  {typeof cashBalance.balance === "number"
                    ? `₹${cashBalance.balance.toLocaleString("en-IN")}`
                    : cashBalance.balance}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#94A3B8",
                    fontWeight: 400,
                  }}
                >
                  COD Cash currently held by {cashBalance.riderName}
                </span>
              </div>

              {/* Outstanding Warning Banner */}
              <div
                style={{
                  backgroundColor: "#FFFBEB",
                  border: "1px solid #FEF08A",
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
                    color: "#B45309",
                  }}
                >
                  Outstanding Warning
                </span>
                <span
                  style={{
                    fontSize: "11.5px",
                    color: "#D97706",
                    lineHeight: 1.4,
                  }}
                >
                  {cashBalance.warningMessage}
                </span>
              </div>

              {/* Record Settlement Button */}
              <button
                type="button"
                onClick={onRecordSettlement}
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
