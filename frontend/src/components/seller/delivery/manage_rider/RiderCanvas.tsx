"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CreditCard, CheckCircle2, Truck, User, ArrowRight } from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";

export interface RiderSummaryMetric {
  id: string;
  label: string;
  value: string;
  description: string;
  iconType: "card" | "check" | "truck";
}

export interface RiderWalletRecord {
  id: string;
  name: string;
  phone: string;
  codBalance: number | string;
  dutyStatus: "ON DUTY" | "OFF DUTY" | string;
}

export interface RiderCanvasProps {
  title?: string;
  subtitle?: string;
  metrics?: RiderSummaryMetric[];
  riders?: RiderWalletRecord[];
  onViewWallet?: (rider: RiderWalletRecord) => void;
}

const DEFAULT_METRICS: RiderSummaryMetric[] = [
  {
    id: "total_cod",
    label: "Total COD Outstanding",
    value: "₹8,200",
    description: "Cumulative cash held by active delivery riders",
    iconType: "card",
  },
  {
    id: "cash_collected",
    label: "Cash Collected Today",
    value: "₹1,200",
    description: "Deposited safely to partner cash drawers",
    iconType: "check",
  },
  {
    id: "active_squad",
    label: "Active Delivery Squad",
    value: "3 Riders Online",
    description: "Real-time geofenced tracking configured",
    iconType: "truck",
  },
];

const DEFAULT_RIDERS: RiderWalletRecord[] = [
  {
    id: "r1",
    name: "Rahul Kumar",
    phone: "+91 98765 43210",
    codBalance: "₹2,450",
    dutyStatus: "ON DUTY",
  },
  {
    id: "r2",
    name: "Vikram Singh",
    phone: "+91 87654 32109",
    codBalance: "₹1,800",
    dutyStatus: "ON DUTY",
  },
  {
    id: "r3",
    name: "Arjun Sharma",
    phone: "+91 76543 21098",
    codBalance: "₹3,150",
    dutyStatus: "ON DUTY",
  },
  {
    id: "r4",
    name: "Amit Yadav",
    phone: "+91 95432 10987",
    codBalance: "₹800",
    dutyStatus: "OFF DUTY",
  },
  {
    id: "r5",
    name: "Deepak Joshi",
    phone: "+91 99988 77665",
    codBalance: "₹0",
    dutyStatus: "OFF DUTY",
  },
];

export default function RiderCanvas({
  title = "COD Cash Collection & Delivery Logs",
  subtitle = "Audit outstanding cash collections and assign delivery routes to riders.",
  metrics: initialMetrics,
  riders: initialRiders,
  onViewWallet,
}: RiderCanvasProps) {
  const router = useRouter();
  const [riderList, setRiderList] = React.useState<RiderWalletRecord[]>(initialRiders || DEFAULT_RIDERS);
  const [metricsList, setMetricsList] = React.useState<RiderSummaryMetric[]>(initialMetrics || DEFAULT_METRICS);

  React.useEffect(() => {
    if (initialRiders) {
      setRiderList(initialRiders);
      return;
    }

    async function loadRiders() {
      try {
        const res = await fetchApi("/api/seller/delivery");
        if (res.ok) {
          const data = await res.json();
          const list = data.data?.deliveryPersons || data.deliveryPersons || data.data || [];
          if (Array.isArray(list) && list.length > 0) {
            const mapped: RiderWalletRecord[] = list.map((dp: any) => ({
              id: dp.id,
              name: dp.name,
              phone: dp.phone || "+91 98765 00000",
              codBalance: `₹${(dp.outstandingBalance || 0).toLocaleString("en-IN")}`,
              dutyStatus: dp.isActive ? "ON DUTY" : "OFF DUTY",
            }));
            setRiderList(mapped);

            const totalCod = list.reduce((sum: number, dp: any) => sum + (dp.outstandingBalance || 0), 0);
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
      }
    }

    loadRiders();
  }, [initialRiders]);

  const metrics = metricsList;
  const riders = riderList;

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
      }}
      className="rider-canvas-container"
    >
      {/* Constrained Content (Width: 1120px, Height: 666px, Gap: 24px) */}
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
        {/* Frame 1: Header (Width: 1120px, Height: 50px, Justify: space-between) */}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "4px",
            boxSizing: "border-box",
          }}
          className="header-frame-1"
        >
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

        {/* Frame 2: 3 Cards Row (Width: 1120px, Height: 138px, Gap: 24px) */}
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

        {/* Frame 3: Rider Status Table Card (Width: 1120px, Height: 430px, Gap: 16px, Padding: 24px, Radius: 12px, Background: #FFFFFF, Border: 1px solid #E2E8F0) */}
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
          {/* Card Title */}
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#0F172A",
              margin: 0,
              letterSpacing: "-0.2px",
            }}
          >
            Rider status & outstanding wallets
          </h2>

          {/* Table Container with Horizontal Scrolling on small screens */}
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
                minWidth: "750px",
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
                      padding: "10px 0",
                      fontSize: "11.5px",
                      fontWeight: 700,
                      color: "#64748B",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      width: "25%",
                    }}
                  >
                    RIDER NAME
                  </th>
                  <th
                    style={{
                      padding: "10px 0",
                      fontSize: "11.5px",
                      fontWeight: 700,
                      color: "#64748B",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      width: "23%",
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
                      width: "18%",
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
                      width: "16%",
                    }}
                  >
                    DUTY STATUS
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
                      width: "18%",
                    }}
                  >
                    LEDGER TRANSACTION
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {riders.map((rider, index) => {
                  const isOnDuty =
                    rider.dutyStatus.toUpperCase() === "ON DUTY";
                  const isZeroBalance =
                    rider.codBalance === "₹0" ||
                    rider.codBalance === 0 ||
                    rider.codBalance === "0";

                  return (
                    <tr
                      key={rider.id || index}
                      style={{
                        borderBottom:
                          index !== riders.length - 1
                            ? "1px solid #F1F5F9"
                            : "none",
                        transition: "background-color 0.15s ease",
                      }}
                      className="rider-table-row"
                    >
                      {/* Rider Name with Avatar */}
                      <td style={{ padding: "14px 0", verticalAlign: "middle" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              backgroundColor: "#F1F5F9",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#64748B",
                              flexShrink: 0,
                            }}
                          >
                            <User size={16} />
                          </div>
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

                      {/* Duty Status Badge */}
                      <td style={{ padding: "14px 0", verticalAlign: "middle" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "10.5px",
                            fontWeight: 700,
                            letterSpacing: "0.4px",
                            textTransform: "uppercase",
                            backgroundColor: isOnDuty
                              ? "#FFF1E8"
                              : "#F1F5F9",
                            color: isOnDuty ? "#F97316" : "#64748B",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {rider.dutyStatus}
                        </span>
                      </td>

                      {/* Ledger Transaction Action */}
                      <td
                        style={{
                          padding: "14px 0",
                          verticalAlign: "middle",
                          textAlign: "right",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (onViewWallet) {
                              onViewWallet(rider);
                            } else {
                              router.push("/seller/riderMng/settlements");
                            }
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            padding: "4px 0",
                            color: "#FF5500",
                            fontSize: "13px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontFamily:
                              "var(--font-poppins), 'Poppins', sans-serif",
                            transition: "all 0.15s ease",
                          }}
                          className="view-wallet-btn"
                        >
                          <span>View Wallet</span>
                          <ArrowRight size={14} strokeWidth={2.5} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style jsx>{`
        .view-wallet-btn:hover {
          color: #EA580C !important;
          transform: translateX(2px);
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
