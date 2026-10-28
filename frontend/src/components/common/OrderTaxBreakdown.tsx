"use client";

import React from "react";
import { Receipt, FileText, Download } from "lucide-react";
import { calculateOrderTax, TaxCalculationResult } from "@/lib/tax-calculator";

export function cleanNumericPrice(val: any, defaultVal = 0): number {
  if (typeof val === "number") return isNaN(val) ? defaultVal : val;
  if (!val) return defaultVal;
  const s = String(val).trim().toLowerCase();
  if (s === "free" || s === "null" || s === "undefined") return 0;
  const cleaned = s.replace(/[^0-9.-]/g, "").trim();
  if (!cleaned) return defaultVal;
  const num = parseFloat(cleaned);
  return isNaN(num) ? defaultVal : num;
}

export function getTaxCalculationForOrder(order: any): TaxCalculationResult {
  if (order?.taxBreakdown) {
    try {
      const parsed = typeof order.taxBreakdown === "string" ? JSON.parse(order.taxBreakdown) : order.taxBreakdown;
      if (
        parsed &&
        typeof parsed.grandTotal === "number" &&
        typeof parsed.productTaxable === "number" &&
        parsed.productGross > 0
      ) {
        return parsed;
      }
    } catch {}
  }

  // Fallback calculation using order fields
  let rawItems: any[] = (() => {
    try {
      const parsed = typeof order?.items === "string" ? JSON.parse(order.items) : (order?.items || order?.rawItems || []);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return Array.isArray(order?.items) ? order.items : (Array.isArray(order?.rawItems) ? order.rawItems : []);
    }
  })();

  const sellerTaxMode = order?.taxMode || order?.seller?.taxMode || "TAX_INCLUSIVE";
  const pTaxRate = cleanNumericPrice(order?.productTaxRate, 5.0);
  const dTaxRate = cleanNumericPrice(order?.deliveryTaxRate, 18.0);

  let dCharge = 0;
  if (typeof order?.deliveryCharge === "number") {
    dCharge = order.deliveryCharge;
  } else if (order?.deliveryFee !== undefined && order?.deliveryFee !== null) {
    dCharge = cleanNumericPrice(order.deliveryFee, 0);
  } else if (typeof order?.seller?.deliveryCharge === "number") {
    dCharge = order.seller.deliveryCharge;
  }

  const couponDiscount = cleanNumericPrice(
    order?.discount ||
    order?.couponDiscount ||
    order?.productDiscount ||
    order?.appliedCoupon?.discountAmount ||
    order?.billBreakdown?.discount,
    0
  );

  const mappedItems = rawItems.map((it: any) => {
    const qty = Math.max(1, cleanNumericPrice(it.quantity || it.qty, 1));
    let price = cleanNumericPrice(it.price || it.unitPrice, 0);
    if (price === 0) {
      const totalVal = cleanNumericPrice(it.total || it.lineTotal, 0);
      if (totalVal > 0) price = Math.round((totalVal / qty) * 100) / 100;
    }
    if (price === 0) {
      const base = cleanNumericPrice(it.basePrice, 0);
      const addons = cleanNumericPrice(it.addonsTotal || it.addonsSubtotal, 0);
      if (base + addons > 0) price = base + addons;
    }
    return {
      name: it.name || "Food Item",
      quantity: qty,
      price: price,
      discountAmount: cleanNumericPrice(it.discountAmount, 0),
      addonsTotal: cleanNumericPrice(it.addonsTotal || it.addonsSubtotal, 0),
      selectedAddons: it.selectedAddons || it.addons || [],
    };
  });

  const totalItemGross = mappedItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);
  if (totalItemGross === 0) {
    const fallbackSubtotal = cleanNumericPrice(
      order?.subtotal ||
      order?.billBreakdown?.itemTotal ||
      order?.productGross ||
      (order?.totalAmount !== undefined && order?.totalAmount !== null ? order.totalAmount : undefined) ||
      order?.total ||
      order?.grandTotal,
      0
    );

    if (fallbackSubtotal > 0) {
      mappedItems.push({
        name: order?.dishName || "Ordered Items",
        quantity: 1,
        price: fallbackSubtotal,
        discountAmount: 0,
        addonsTotal: 0,
        selectedAddons: [],
      });
    }
  }

  return calculateOrderTax({
    items: mappedItems,
    sellerTaxMode,
    productTaxRate: pTaxRate,
    deliveryTaxRate: dTaxRate,
    deliveryCharge: dCharge,
    orderCouponDiscount: couponDiscount,
  });
}

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
  const calc: TaxCalculationResult = propTaxCalc || (order ? getTaxCalculationForOrder(order) : null as any);

  if (!calc) return null;

  const rawTargetId = order?.id || orderId || order?.orderId || "";
  const targetOrderId = typeof rawTargetId === "string" ? rawTargetId.replace(/^#/, "").trim() : rawTargetId;
  const effectivePaid = isPaid !== undefined ? isPaid : Boolean(order?.isPaid);
  const effectiveMethod = paymentMethod || order?.paymentMethod || (effectivePaid ? "ONLINE" : "COD");
  const isCod = effectiveMethod === "COD" || effectiveMethod === "Cash on Delivery";
  const isDelivered = (order?.status || "").toUpperCase() === "DELIVERED" || (order?.rawStatus || "").toUpperCase() === "DELIVERED" || (order?.status === "Completed");
  const isSellerView = Boolean(
    order?.sellerView ||
    order?.isSeller ||
    (typeof window !== "undefined" && window.location.pathname.startsWith("/seller"))
  );
  const canShowInvoice = showInvoiceButton && targetOrderId && isDelivered;

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
              backgroundColor: calc.grandTotal === 0 ? "#DCFCE7" : isCod ? "#FEF3C7" : "#ECFDF5",
              color: calc.grandTotal === 0 ? "#15803D" : isCod ? "#B45309" : "#047857",
            }}
          >
            {calc.grandTotal === 0 ? "FREE" : isCod ? "CASH ON DELIVERY" : "PAID"}
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
              href={`/invoice/order/${targetOrderId}?type=${isSellerView ? "seller" : "user"}`}
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
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#FFEDD5";
                e.currentTarget.style.borderColor = "#FB923C";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#FFF7ED";
                e.currentTarget.style.borderColor = "#FDBA74";
              }}
              title="Download Invoice"
            >
              <Receipt size={16} color="#EA580C" />
              <span>Download Invoice</span>
            </a>
          ) : (
            <button
              type="button"
              disabled
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
              title="Invoice available after order delivery"
            >
              <Receipt size={16} color="#94A3B8" />
              <span>Download Invoice (Available after delivery)</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderTaxBreakdown;
