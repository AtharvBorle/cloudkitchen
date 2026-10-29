"use client";

import React from "react";
import { Receipt, FileText, Download } from "lucide-react";
import { 
  getOrderBreakdown, 
  getTaxCalculationForOrder, 
  cleanNumericPrice, 
  TaxCalculationResult 
} from "@/lib/tax-calculator";

export { cleanNumericPrice, getTaxCalculationForOrder, getOrderBreakdown };

export interface OrderTaxBreakdownProps {
  order?: any;
  taxCalc?: TaxCalculationResult;
  isPaid?: boolean;
  paymentMethod?: string;
  showInvoiceButton?: boolean;
  orderId?: string;
  style?: React.CSSProperties;
}

export const OrderTaxBreakdown: React.FC<OrderTaxBreakdownProps> = ({
  order,
  taxCalc: propTaxCalc,
  isPaid,
  paymentMethod,
  showInvoiceButton = true,
  orderId,
  style,
}) => {
  const calc: TaxCalculationResult = propTaxCalc || (order ? getOrderBreakdown(order) : null as any);

  if (!calc) return null;

  const rawTargetId = order?.id || orderId || order?.orderId || "";
  const targetOrderId = typeof rawTargetId === "string" ? rawTargetId.replace(/^#/, "").trim() : rawTargetId;
  const effectivePaid = isPaid !== undefined ? isPaid : Boolean(order?.isPaid);
  const rawMethod = paymentMethod || order?.paymentMethod || (effectivePaid ? "ONLINE" : "COD");
  const methodUpper = String(rawMethod).toUpperCase();
  const isCod = methodUpper.includes("COD") || methodUpper.includes("CASH");
  const isDelivered = (order?.status || "").toUpperCase() === "DELIVERED" || (order?.rawStatus || "").toUpperCase() === "DELIVERED" || (order?.status === "Completed");
  const isPaidConfirmed = effectivePaid || (!isCod && (methodUpper.includes("ONLINE") || methodUpper.includes("PAID") || methodUpper.includes("UPI") || methodUpper.includes("CARD"))) || (isCod && (isDelivered || effectivePaid));
  const isSellerView = Boolean(
    order?.sellerView ||
    order?.isSeller ||
    (typeof window !== "undefined" && window.location.pathname.startsWith("/seller"))
  );
  const canShowInvoice = showInvoiceButton && targetOrderId && isDelivered;

  const invoiceHref = isSellerView
    ? `/seller/invoice/order/${targetOrderId}`
    : `/invoice/order/${targetOrderId}`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "7px",
        width: "100%",
        fontFamily: "inherit",
        ...style,
      }}
    >
      {/* Item Subtotal / Gross */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.88rem", color: "#475569" }}>
        <span>Item Total (Subtotal):</span>
        <span style={{ fontWeight: 600, color: "#0F172A" }}>₹{calc.productGross.toFixed(2)}</span>
      </div>

      {/* Discount / Coupon if applied */}
      {calc.productDiscount > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.86rem", color: "#16A34A" }}>
          <span>
            Coupon Discount {order?.couponCode || order?.appliedCoupon?.code ? `(${order?.couponCode || order?.appliedCoupon?.code})` : ""}
          </span>
          <span style={{ fontWeight: 700 }}>-₹{calc.productDiscount.toFixed(2)}</span>
        </div>
      )}

      {/* Product Taxable Value */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem", color: "#64748B" }}>
        <span>Product Taxable Value:</span>
        <span style={{ fontWeight: 500 }}>₹{calc.productTaxable.toFixed(2)}</span>
      </div>

      {/* CGST */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem", color: "#64748B" }}>
        <span>CGST ({calc.productTaxRate / 2}%):</span>
        <span style={{ fontWeight: 500 }}>₹{calc.productCgst.toFixed(2)}</span>
      </div>

      {/* SGST */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem", color: "#64748B" }}>
        <span>SGST ({calc.productTaxRate / 2}%):</span>
        <span style={{ fontWeight: 500 }}>₹{calc.productSgst.toFixed(2)}</span>
      </div>

      {/* Delivery Charges & Delivery GST */}
      {calc.deliveryTotal > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.88rem", color: "#475569", marginTop: "2px" }}>
            <span>Delivery Charges:</span>
            <span style={{ fontWeight: 600, color: "#0F172A" }}>₹{calc.deliveryGross.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "#64748B", paddingLeft: "10px" }}>
            <span>
              Delivery GST ({calc.deliveryTaxRate}%: CGST ₹{calc.deliveryCgst.toFixed(2)} + SGST ₹{calc.deliverySgst.toFixed(2)}):
            </span>
            <span style={{ fontWeight: 500 }}>₹{calc.deliveryGst.toFixed(2)}</span>
          </div>
        </>
      )}

      {/* Tax Mode Tag */}
      <div style={{ margin: "5px 0", display: "flex", justifyContent: "flex-end" }}>
        <span
          style={{
            fontSize: "0.72rem",
            fontWeight: 700,
            padding: "3px 9px",
            borderRadius: "9999px",
            backgroundColor: calc.taxMode === "TAX_INCLUSIVE" ? "#DCFCE7" : "#EFF6FF",
            color: calc.taxMode === "TAX_INCLUSIVE" ? "#166534" : "#1E40AF",
            border: `1px solid ${calc.taxMode === "TAX_INCLUSIVE" ? "#BBF7D0" : "#BFDBFE"}`,
            display: "inline-block",
          }}
        >
          {calc.taxMode === "TAX_INCLUSIVE" ? "Tax Inclusive Pricing (GST included)" : "Tax Exclusive Pricing (GST added)"}
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: "100%", height: "1px", backgroundColor: "#E2E8F0", margin: "4px 0" }} />

      {/* Grand Total Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "1rem", fontWeight: 700, color: "#0F172A", paddingTop: "2px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>Grand Total:</span>
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: "6px",
              backgroundColor: calc.grandTotal === 0 ? "#DCFCE7" : (isCod && !isPaidConfirmed) ? "#FEF3C7" : isPaidConfirmed ? "#ECFDF5" : "#FEF3C7",
              color: calc.grandTotal === 0 ? "#15803D" : (isCod && !isPaidConfirmed) ? "#B45309" : isPaidConfirmed ? "#047857" : "#B45309",
            }}
          >
            {calc.grandTotal === 0
              ? "FREE"
              : isCod
              ? (isPaidConfirmed ? "PAID (COD)" : "CASH ON DELIVERY")
              : (isPaidConfirmed ? "PAID" : "PENDING")}
          </span>
        </div>
        <span style={{ fontSize: "1.08rem", fontWeight: 800, color: "#EA580C" }}>
          ₹{calc.grandTotal.toFixed(2)}
        </span>
      </div>

      {/* Download Invoice Button */}
      {showInvoiceButton && targetOrderId && (
        <div style={{ marginTop: "10px" }}>
          {isDelivered ? (
            <a
              href={invoiceHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "9px 16px",
                borderRadius: "8px",
                backgroundColor: "#FFF7ED",
                border: "1.5px solid #FDBA74",
                color: "#C2410C",
                fontSize: "0.88rem",
                fontWeight: 700,
                textDecoration: "none",
                transition: "all 0.15s ease",
                boxShadow: "0 1px 3px rgba(234, 88, 12, 0.08)",
                cursor: "pointer",
              }}
            >
              <Download size={15} />
              <span>Download Invoice</span>
            </a>
          ) : (
            <button
              type="button"
              disabled
              title="Tax invoice will be available for download once order is marked delivered."
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "9px 16px",
                borderRadius: "8px",
                backgroundColor: "#F1F5F9",
                border: "1.5px solid #CBD5E1",
                color: "#94A3B8",
                fontSize: "0.88rem",
                fontWeight: 600,
                cursor: "not-allowed",
                opacity: 0.75,
              }}
            >
              <FileText size={15} />
              <span>Invoice (Available After Delivery)</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderTaxBreakdown;
