"use client";

import React from "react";
import { ArrowLeft, Download, Printer, Phone, Mail } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { getOrderBreakdown, TaxCalculationResult } from "@/lib/tax-calculator";

interface UnifiedInvoiceViewProps {
  order: any;
  isSellerView?: boolean;
}

export const UnifiedInvoiceView: React.FC<UnifiedInvoiceViewProps> = ({ order, isSellerView = false }) => {
  // Authoritative Single Engine Calculation matching checkout/cart
  const taxCalc: TaxCalculationResult = getOrderBreakdown(order);

  // Dates and ID Formatting matching reference
  const orderDateObj = new Date(order.createdAt || Date.now());
  const formattedDateWithTime =
    orderDateObj.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) +
    ", " +
    orderDateObj
      .toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase();

  const formattedDateOnly = orderDateObj.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const rawCleanId = String(order.id || "")
    .replace(/^#(?:ncr|ord)-?/i, "")
    .replace(/^(?:ncr|ord)-?/i, "")
    .replace(/^#/, "")
    .trim();
  const shortId = rawCleanId.slice(0, 8).toUpperCase();
  const invoiceNo = `INV-${shortId}`;
  const totalQuantity = taxCalc.items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);

  // Dynamic Seller Information
  const sellerName = order.seller?.businessName || order.seller?.kitchenName || "NeoCloudBites Kitchen";
  const sellerStreet = [order.seller?.addressFlat, order.seller?.addressLocality].filter(Boolean).join(", ");
  const sellerCity = order.seller?.user?.city || order.seller?.city || "";
  const sellerPincode = order.seller?.user?.pincode || order.seller?.pincode || "";
  const sellerAddress = [sellerStreet, sellerCity, sellerPincode, "India"].filter(Boolean).join(", ");
  const sellerEmail = order.seller?.user?.email || order.seller?.email || "";
  const sellerPhone = order.seller?.user?.phone || order.seller?.phone || "";
  const sellerGst = order.seller?.gstNumber || "";
  const sellerFssai = order.seller?.fssaiNumber || order.seller?.fssaiLicense || "";

  // Dynamic Customer Information
  const customerName = order.user?.name || order.customerName || "Customer";
  const customerAddress = order.deliveryAddress?.split(" | Loc:")[0] || order.deliveryAddress || "Standard Delivery Location";
  const customerEmail = order.user?.email || "";
  const customerPhone = order.customerPhone || order.user?.phone || "";
  const addressType = order.addressType || (customerAddress.toLowerCase().includes("home") ? "Home" : "Workplace / Other");

  // Verification URL for QR code
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://dev.neocloudbites.com";
  const qrVerificationUrl = `${baseUrl}${isSellerView ? "/seller" : ""}/invoice/order/${order.id || rawCleanId}`;

  return (
    <div style={{ backgroundColor: "#F8FAFC", minHeight: "100vh", padding: "24px 16px 40px", fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)" }}>
      {/* Print Stylesheet */}
      <style jsx global>{`
        @media print {
          body {
            background-color: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .invoice-no-print {
            display: none !important;
          }
          .invoice-card-container {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            max-width: 100% !important;
            margin: 0 !important;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}</style>

      {/* Top Action Bar (Hidden in Print) */}
      <div className="invoice-no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "860px", margin: "0 auto 16px auto", flexWrap: "wrap", gap: "10px" }}>
        <button
          type="button"
          onClick={() => window.close()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 18px",
            borderRadius: "8px",
            border: "1px solid #D1D5DB",
            backgroundColor: "#FFFFFF",
            color: "#374151",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          <ArrowLeft size={16} />
          <span>Close Window</span>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 18px",
              borderRadius: "8px",
              border: "1px solid #D1D5DB",
              backgroundColor: "#FFFFFF",
              color: "#374151",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <Download size={16} />
            <span>Download PDF</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 20px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#DC2626",
              color: "#FFFFFF",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(220,38,38,0.3)",
            }}
          >
            <Printer size={16} />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* Main Invoice Card */}
      <div
        className="invoice-card-container"
        style={{
          backgroundColor: "#FFFFFF",
          maxWidth: "860px",
          margin: "0 auto",
          borderRadius: "12px",
          boxShadow: "0 4px 25px rgba(0,0,0,0.06)",
          border: "1px solid #E5E7EB",
          overflow: "hidden",
        }}
      >
        {/* Top Accent Gradient Stripe */}
        <div style={{ height: "4px", background: "linear-gradient(90deg, #F97316 0%, #DC2626 50%, #EAB308 100%)", width: "100%" }} />

        {/* Card Body */}
        <div style={{ padding: "32px 36px 28px" }}>
          {/* Header Row: Left (Logo + Brand + Seller) | Right (Invoice No + Date + Order ID + QR) */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" }}>
            {/* Left Column */}
            <div style={{ maxWidth: "480px" }}>
              {/* Brand Header */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <img
                  src="/images/logo-nav.png"
                  alt="NeoCloudBites"
                  style={{ width: "54px", height: "54px", borderRadius: "50%", objectFit: "contain", border: "1px solid #F1F5F9", flexShrink: 0 }}
                />
                <div>
                  <div style={{ fontWeight: 800, fontSize: "1.2rem", color: "#0F172A", letterSpacing: "0.02em", lineHeight: "1.2" }}>
                    NEOCLOUDBITES
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#64748B", fontWeight: 500, marginTop: "2px" }}>
                    Neocloudbites Pvt. Ltd.
                  </div>
                </div>
              </div>

              {/* Sold By (Seller) Section */}
              <div style={{ marginTop: "14px", borderTop: "1px solid #F1F5F9", paddingTop: "10px" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748B", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  SOLD BY (SELLER)
                </div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0F172A", marginTop: "3px" }}>
                  {sellerName}
                </div>

                {/* GST & FSSAI if present */}
                {(sellerGst || sellerFssai) && (
                  <div style={{ fontSize: "0.74rem", color: "#475569", marginTop: "3px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                    {sellerGst && (
                      <span>
                        <strong>GST NO:</strong> {sellerGst}
                      </span>
                    )}
                    {sellerFssai && (
                      <span>
                        <strong>FSSAI NO:</strong> {sellerFssai}
                      </span>
                    )}
                  </div>
                )}

                {/* Seller Address */}
                {sellerAddress && (
                  <div style={{ fontSize: "0.78rem", color: "#475569", marginTop: "3px", lineHeight: "1.4" }}>
                    {sellerAddress}
                  </div>
                )}

                {/* Contact row */}
                {(sellerPhone || sellerEmail) && (
                  <div style={{ fontSize: "0.74rem", color: "#475569", marginTop: "4px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
                    {sellerPhone && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Phone size={12} color="#64748B" /> {sellerPhone}
                      </span>
                    )}
                    {sellerEmail && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Mail size={12} color="#64748B" /> {sellerEmail}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Invoice Meta + QR Code */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginLeft: "auto" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, fontSize: "1.25rem", color: "#0F172A", letterSpacing: "0.02em" }}>
                  {invoiceNo}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748B", marginTop: "4px" }}>
                  Date: <strong style={{ color: "#334155" }}>{formattedDateWithTime}</strong>
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748B", marginTop: "2px" }}>
                  Order ID: <strong style={{ color: "#0F172A" }}>#{shortId}</strong>
                </div>
              </div>

              {/* QR Code */}
              <div
                style={{
                  padding: "5px",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "8px",
                  border: "1px solid #E2E8F0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <QRCodeSVG value={qrVerificationUrl} size={68} level="M" />
              </div>
            </div>
          </div>

          {/* Billing To (Customer) Section */}
          <div
            style={{
              backgroundColor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "10px",
              padding: "16px 20px",
              marginTop: "22px",
            }}
          >
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748B", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "8px" }}>
              BILLING TO (CUSTOMER)
            </div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0F172A" }}>
              {customerName}
            </div>
            <div style={{ fontSize: "0.82rem", color: "#475569", marginTop: "3px", lineHeight: "1.4" }}>
              {customerAddress}
            </div>
            <div style={{ fontSize: "0.78rem", color: "#475569", marginTop: "6px", display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center" }}>
              {customerEmail && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Mail size={12} color="#64748B" /> {customerEmail}
                </span>
              )}
              {customerPhone && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Phone size={12} color="#64748B" /> {customerPhone}
                </span>
              )}
            </div>
            <div style={{ fontSize: "0.78rem", color: "#64748B", marginTop: "5px" }}>
              Address Type : <strong style={{ color: "#334155" }}>{addressType}</strong>
            </div>
          </div>

          {/* Product Details Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px", marginBottom: "8px" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0F172A", margin: 0 }}>
              Product Details
            </h3>
            <span style={{ fontSize: "0.78rem", color: "#64748B", fontWeight: 500 }}>
              Currency: INR (₹)
            </span>
          </div>

          {/* Products Table matching reference image */}
          <div style={{ overflowX: "auto", border: "1px solid #E5E7EB", borderRadius: "8px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ backgroundColor: "#E5E7EB", color: "#374151", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em" }}>
                  <th style={{ textAlign: "center", width: "38px", padding: "10px 8px" }}>#</th>
                  <th style={{ textAlign: "left", padding: "10px 10px", minWidth: "150px" }}>PRODUCT</th>
                  <th style={{ textAlign: "center", width: "45px", padding: "10px 8px" }}>QTY</th>
                  <th style={{ textAlign: "right", width: "75px", padding: "10px 8px" }}>PRICE</th>
                  <th style={{ textAlign: "right", width: "85px", padding: "10px 8px" }}>GROSS AMT</th>
                  <th style={{ textAlign: "right", width: "75px", padding: "10px 8px" }}>DISCOUNT</th>
                  <th style={{ textAlign: "right", width: "85px", padding: "10px 8px" }}>TAXABLE VAL</th>
                  <th style={{ textAlign: "right", width: "70px", padding: "10px 8px" }}>CGST</th>
                  <th style={{ textAlign: "right", width: "70px", padding: "10px 8px" }}>SGST</th>
                  <th style={{ textAlign: "right", width: "85px", padding: "10px 10px" }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {taxCalc.items.map((it, idx) => (
                  <tr key={it.id || idx} style={{ borderBottom: "1px solid #F3F4F6", backgroundColor: "#FFFFFF" }}>
                    <td style={{ textAlign: "center", padding: "10px 8px", color: "#9CA3AF" }}>{idx + 1}</td>
                    <td style={{ padding: "10px 10px" }}>
                      <div style={{ fontWeight: 700, color: "#111827" }}>{it.name}</div>
                      {it.selectedAddons && it.selectedAddons.length > 0 && (
                        <div style={{ fontSize: "0.72rem", color: "#6B7280", marginTop: "2px" }}>
                          Add-ons: {it.selectedAddons.map((a: any) => `${a.name} (x${a.quantity || 1})`).join(", ")}
                        </div>
                      )}
                      {it.sku && <div style={{ fontSize: "0.72rem", color: "#6B7280" }}>SKU: {it.sku}</div>}
                    </td>
                    <td style={{ textAlign: "center", padding: "10px 8px", fontWeight: 700, color: "#111827" }}>{it.quantity}</td>
                    <td style={{ textAlign: "right", padding: "10px 8px", color: "#374151" }}>₹{it.unitPrice.toFixed(2)}</td>
                    <td style={{ textAlign: "right", padding: "10px 8px", color: "#374151" }}>₹{it.grossAmount.toFixed(2)}</td>
                    <td style={{ textAlign: "right", padding: "10px 8px", color: it.discountAmount > 0 ? "#059669" : "#6B7280", fontWeight: it.discountAmount > 0 ? 600 : 400 }}>
                      {it.discountAmount > 0 ? `-₹${it.discountAmount.toFixed(2)}` : "—"}
                    </td>
                    <td style={{ textAlign: "right", padding: "10px 8px", color: "#111827" }}>₹{it.taxableValue.toFixed(2)}</td>
                    <td style={{ textAlign: "right", padding: "10px 8px", fontSize: "0.78rem" }}>
                      <div style={{ fontSize: "0.68rem", color: "#9CA3AF" }}>{it.cgstRate}%</div>
                      <div style={{ color: "#374151" }}>₹{it.cgstAmount.toFixed(2)}</div>
                    </td>
                    <td style={{ textAlign: "right", padding: "10px 8px", fontSize: "0.78rem" }}>
                      <div style={{ fontSize: "0.68rem", color: "#9CA3AF" }}>{it.sgstRate}%</div>
                      <div style={{ color: "#374151" }}>₹{it.sgstAmount.toFixed(2)}</div>
                    </td>
                    <td style={{ textAlign: "right", padding: "10px 10px", fontWeight: 700, color: "#111827" }}>₹{it.totalAmount.toFixed(2)}</td>
                  </tr>
                ))}

                {/* Shipping and charges row */}
                <tr style={{ borderBottom: "1px solid #F3F4F6", backgroundColor: "#FFFFFF" }}>
                  <td style={{ textAlign: "center", padding: "10px 8px", color: "#9CA3AF" }}>—</td>
                  <td colSpan={5} style={{ padding: "10px 10px", fontStyle: "italic", color: "#4B5563", fontSize: "0.8rem" }}>
                    Shipping and charges : ₹{taxCalc.deliveryTaxable.toFixed(2)} | shipping gst {taxCalc.deliveryTaxRate}% : ₹{taxCalc.deliveryGst.toFixed(2)}
                  </td>
                  <td style={{ textAlign: "right", padding: "10px 8px", color: "#111827" }}>₹{taxCalc.deliveryTaxable.toFixed(2)}</td>
                  <td style={{ textAlign: "right", padding: "10px 8px", color: "#374151", fontSize: "0.78rem" }}>
                    <div style={{ fontSize: "0.68rem", color: "#9CA3AF" }}>{(taxCalc.deliveryTaxRate / 2).toFixed(1)}%</div>
                    <div>₹{(taxCalc.deliveryGst / 2).toFixed(2)}</div>
                  </td>
                  <td style={{ textAlign: "right", padding: "10px 8px", color: "#374151", fontSize: "0.78rem" }}>
                    <div style={{ fontSize: "0.68rem", color: "#9CA3AF" }}>{(taxCalc.deliveryTaxRate / 2).toFixed(1)}%</div>
                    <div>₹{(taxCalc.deliveryGst / 2).toFixed(2)}</div>
                  </td>
                  <td style={{ textAlign: "right", padding: "10px 10px", fontWeight: 700, color: "#111827" }}>₹{taxCalc.deliveryTotal.toFixed(2)}</td>
                </tr>

                {/* Coupon discount row if applied */}
                {taxCalc.productDiscount > 0 && (
                  <tr style={{ borderBottom: "1px solid #F3F4F6", backgroundColor: "#F0FDF4" }}>
                    <td style={{ textAlign: "center", padding: "10px 8px", color: "#9CA3AF" }}>—</td>
                    <td colSpan={4} style={{ padding: "10px 10px", color: "#059669", fontWeight: 600, fontSize: "0.8rem" }}>
                      🏷️ Coupon Discount {order.appliedCoupon?.code ? `(${order.appliedCoupon.code} applied)` : "(OFFER applied)"}
                    </td>
                    <td style={{ textAlign: "right", padding: "10px 8px", color: "#059669", fontWeight: 700 }}>
                      -₹{taxCalc.productDiscount.toFixed(2)}
                    </td>
                    <td colSpan={4} style={{ padding: "10px 8px" }}></td>
                  </tr>
                )}

                {/* Summary / Total row */}
                <tr style={{ backgroundColor: "#E5E7EB", fontWeight: 700, color: "#111827", fontSize: "0.82rem" }}>
                  <td style={{ textAlign: "center", padding: "11px 8px", color: "#6B7280" }}>{taxCalc.items.length}</td>
                  <td style={{ padding: "11px 10px" }}>TOTAL QTY:</td>
                  <td style={{ textAlign: "center", padding: "11px 8px" }}>{totalQuantity}</td>
                  <td style={{ textAlign: "right", padding: "11px 8px", color: "#6B7280" }}>—</td>
                  <td style={{ textAlign: "right", padding: "11px 8px" }}>₹{taxCalc.productGross.toFixed(2)}</td>
                  <td style={{ textAlign: "right", padding: "11px 8px", color: taxCalc.productDiscount > 0 ? "#059669" : "#6B7280" }}>
                    {taxCalc.productDiscount > 0 ? `-₹${taxCalc.productDiscount.toFixed(2)}` : "—"}
                  </td>
                  <td style={{ textAlign: "right", padding: "11px 8px" }}>₹{(taxCalc.productTaxable + taxCalc.deliveryTaxable).toFixed(2)}</td>
                  <td style={{ textAlign: "right", padding: "11px 8px" }}>₹{(taxCalc.productCgst + taxCalc.deliveryCgst).toFixed(2)}</td>
                  <td style={{ textAlign: "right", padding: "11px 8px" }}>₹{(taxCalc.productSgst + taxCalc.deliverySgst).toFixed(2)}</td>
                  <td style={{ textAlign: "right", padding: "11px 10px", fontSize: "0.94rem", fontWeight: 800 }}>₹{taxCalc.grandTotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Computer Generated Disclaimer */}
          <div style={{ textAlign: "center", fontSize: "0.76rem", color: "#9CA3AF", marginTop: "28px", marginBottom: "24px" }}>
            This is a computer-generated invoice and does not require a physical signature
          </div>

          {/* Bottom Footer */}
          <div
            style={{
              borderTop: "1px solid #E5E7EB",
              paddingTop: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.74rem",
              color: "#6B7280",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div>
              <strong>NeoCloudBites</strong> Pvt. Ltd. • Support: help@neocloudbites.com
            </div>
            <div>
              Page 1 of 1 • System Generated on {formattedDateOnly}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedInvoiceView;
