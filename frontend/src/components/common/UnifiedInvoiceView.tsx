"use client";

import React, { useState } from "react";
import { ArrowLeft, Download, Printer, Phone, Mail, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { getOrderBreakdown, TaxCalculationResult } from "@/lib/tax-calculator";

interface UnifiedInvoiceViewProps {
  order: any;
  isSellerView?: boolean;
}

export const UnifiedInvoiceView: React.FC<UnifiedInvoiceViewProps> = ({ order, isSellerView = false }) => {
  const [isDownloading, setIsDownloading] = useState(false);

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
  const shortId = rawCleanId.length > 20 ? rawCleanId.slice(0, 8).toUpperCase() : rawCleanId;
  const invoiceNo = `INV${shortId}`;
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

  // Direct PDF Download (no print preview dialog, downloads .pdf directly)
  const handleDownloadPdf = async () => {
    const element = document.getElementById("invoice-sheet");
    if (!element || isDownloading) return;

    try {
      setIsDownloading(true);
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(element, {
        scale: 2, // 2x DPI for crisp 300dpi-equivalent resolution
        useCORS: true,
        logging: false,
        backgroundColor: "#FFFFFF",
        windowWidth: 1024,
        onclone: (clonedDoc) => {
          const sheet = clonedDoc.getElementById("invoice-sheet");
          if (sheet) {
            sheet.style.width = "860px";
            sheet.style.maxWidth = "860px";
            sheet.style.minWidth = "860px";
            const tableWrapper = sheet.querySelector(".invoice-table-wrapper");
            if (tableWrapper) {
              tableWrapper.style.overflow = "visible";
              tableWrapper.style.width = "100%";
            }
            const table = sheet.querySelector(".invoice-table-wrapper table");
            if (table) {
              table.style.minWidth = "100%";
              table.style.width = "100%";
            }
          }
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfPageWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();

      // Small printable margin (8mm)
      const margin = 8;
      const contentWidth = pdfPageWidth - margin * 2;
      const contentHeight = (canvas.height * contentWidth) / canvas.width;

      if (contentHeight <= pdfPageHeight - margin * 2) {
        pdf.addImage(imgData, "PNG", margin, margin, contentWidth, contentHeight, undefined, "FAST");
      } else {
        // Multi-page slicing if the invoice exceeds a single page
        let heightLeft = contentHeight;
        let position = margin;
        pdf.addImage(imgData, "PNG", margin, position, contentWidth, contentHeight, undefined, "FAST");
        heightLeft -= (pdfPageHeight - margin * 2);

        while (heightLeft > 0) {
          position = position - (pdfPageHeight - margin * 2);
          pdf.addPage();
          pdf.addImage(imgData, "PNG", margin, position, contentWidth, contentHeight, undefined, "FAST");
          heightLeft -= (pdfPageHeight - margin * 2);
        }
      }

      pdf.save(`${invoiceNo}.pdf`);
    } catch (err) {
      console.error("Direct PDF download failed, falling back to print dialog:", err);
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="invoice-page-wrapper" style={{ backgroundColor: "#F8FAFC", minHeight: "100vh", padding: "24px 16px 40px", fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)" }}>
      {/* Print Stylesheet */}
      <style jsx global>{`
        @media print {
          html, body {
            background-color: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .invoice-no-print,
          .chatbot-widget-root,
          div[style*="z-index: 9999"],
          div[style*="z-index: 99999"],
          [class*="chatbot" i],
          [id*="chatbot" i] {
            display: none !important;
            visibility: hidden !important;
          }
          .invoice-card-container {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
          }
          .invoice-table-wrapper {
            overflow: visible !important;
            border: 1px solid #e5e7eb !important;
          }
          .invoice-table-wrapper table {
            width: 100% !important;
            table-layout: fixed !important;
          }
          @page {
            size: portrait;
            margin: 8mm;
          }
        }

        @media screen and (max-width: 768px) {
          .invoice-page-wrapper {
            padding: 12px 8px 30px !important;
          }
          .invoice-card-body {
            padding: 18px 14px 20px !important;
          }
          .invoice-scroll-hint {
            display: inline-flex !important;
          }
          .invoice-header-meta {
            margin-top: 12px !important;
            margin-left: 0 !important;
            width: 100% !important;
            justify-content: space-between !important;
          }
        }
      `}</style>

      {/* Top Action Bar (Hidden in Print) */}
      <div className="invoice-no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "860px", margin: "0 auto 16px auto", flexWrap: "wrap", gap: "10px" }}>
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              window.close();
            }
          }}
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
            transition: "all 0.15s ease",
          }}
        >
          <ArrowLeft size={16} />
          <span>Close Window</span>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Direct PDF Download Button */}
          <button
            type="button"
            disabled={isDownloading}
            onClick={handleDownloadPdf}
            title="Download PDF directly to your device"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 18px",
              borderRadius: "8px",
              border: "1px solid #D1D5DB",
              backgroundColor: isDownloading ? "#F3F4F6" : "#FFFFFF",
              color: "#374151",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: isDownloading ? "wait" : "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              transition: "all 0.15s ease",
            }}
          >
            {isDownloading ? (
              <>
                <Loader2 className="animate-spin" size={16} color="#DC2626" />
                <span>Downloading PDF...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Download PDF</span>
              </>
            )}
          </button>

          {/* Print Invoice Button (For physical printing) */}
          <button
            type="button"
            onClick={() => window.print()}
            title="Print invoice on physical printer"
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
              transition: "all 0.15s ease",
            }}
          >
            <Printer size={16} />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* Main Invoice Card (Captured directly for PDF) */}
      <div
        id="invoice-sheet"
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
        <div className="invoice-card-body" style={{ padding: "32px 34px 28px" }}>
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
            <div className="invoice-header-meta" style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginLeft: "auto" }}>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0F172A", margin: 0 }}>
              Product Details
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="invoice-scroll-hint" style={{ fontSize: "0.72rem", color: "#EA580C", fontWeight: 600, display: "none", alignItems: "center", gap: "4px" }}>
                <span>&larr; Scroll table horizontally &rarr;</span>
              </span>
              <span style={{ fontSize: "0.78rem", color: "#64748B", fontWeight: 500 }}>
                Currency: INR (₹)
              </span>
            </div>
          </div>

          {/* Products Table - Responsive scroll wrapper */}
          <div
            className="invoice-table-wrapper"
            style={{
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              width: "100%",
              backgroundColor: "#FFFFFF",
            }}
          >
            <table
              style={{
                width: "100%",
                minWidth: "740px",
                tableLayout: "fixed",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "0.8rem",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#E5E7EB", color: "#374151", fontSize: "0.71rem", fontWeight: 700, letterSpacing: "0.03em" }}>
                  <th style={{ textAlign: "center", width: "4%", minWidth: "28px", padding: "9px 4px" }}>#</th>
                  <th style={{ textAlign: "left", width: "25%", minWidth: "150px", padding: "9px 8px" }}>PRODUCT</th>
                  <th style={{ textAlign: "center", width: "5%", minWidth: "38px", padding: "9px 4px" }}>QTY</th>
                  <th style={{ textAlign: "right", width: "10%", minWidth: "70px", padding: "9px 6px" }}>PRICE</th>
                  <th style={{ textAlign: "right", width: "10%", minWidth: "78px", padding: "9px 6px" }}>GROSS AMT</th>
                  <th style={{ textAlign: "right", width: "9%", minWidth: "70px", padding: "9px 6px" }}>DISCOUNT</th>
                  <th style={{ textAlign: "right", width: "11%", minWidth: "82px", padding: "9px 6px" }}>TAXABLE VAL</th>
                  <th style={{ textAlign: "right", width: "8%", minWidth: "64px", padding: "9px 6px" }}>CGST</th>
                  <th style={{ textAlign: "right", width: "8%", minWidth: "64px", padding: "9px 6px" }}>SGST</th>
                  <th style={{ textAlign: "right", width: "10%", minWidth: "76px", padding: "9px 8px" }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {taxCalc.items.map((it, idx) => (
                  <tr key={it.id || idx} style={{ borderBottom: "1px solid #F3F4F6", backgroundColor: "#FFFFFF" }}>
                    <td style={{ textAlign: "center", padding: "9px 4px", color: "#9CA3AF" }}>{idx + 1}</td>
                    <td style={{ padding: "9px 8px", wordBreak: "break-word" }}>
                      <div style={{ fontWeight: 700, color: "#111827", lineHeight: "1.3" }}>{it.name}</div>
                      {it.selectedAddons && it.selectedAddons.length > 0 && (
                        <div style={{ fontSize: "0.71rem", color: "#6B7280", marginTop: "2px", lineHeight: "1.2" }}>
                          Add-ons: {it.selectedAddons.map((a: any) => `${a.name} (x${a.quantity || 1})`).join(", ")}
                        </div>
                      )}
                      {it.sku && <div style={{ fontSize: "0.71rem", color: "#6B7280" }}>SKU: {it.sku}</div>}
                    </td>
                    <td style={{ textAlign: "center", padding: "9px 4px", fontWeight: 700, color: "#111827" }}>{it.quantity}</td>
                    <td style={{ textAlign: "right", padding: "9px 6px", color: "#374151", whiteSpace: "nowrap" }}>₹{it.unitPrice.toFixed(2)}</td>
                    <td style={{ textAlign: "right", padding: "9px 6px", color: "#374151", whiteSpace: "nowrap" }}>₹{it.grossAmount.toFixed(2)}</td>
                    <td style={{ textAlign: "right", padding: "9px 6px", color: it.discountAmount > 0 ? "#059669" : "#6B7280", fontWeight: it.discountAmount > 0 ? 600 : 400, whiteSpace: "nowrap" }}>
                      {it.discountAmount > 0 ? `-₹${it.discountAmount.toFixed(2)}` : "—"}
                    </td>
                    <td style={{ textAlign: "right", padding: "9px 6px", color: "#111827", whiteSpace: "nowrap" }}>₹{it.taxableValue.toFixed(2)}</td>
                    <td style={{ textAlign: "right", padding: "9px 6px", fontSize: "0.78rem" }}>
                      <div style={{ fontSize: "0.68rem", color: "#9CA3AF" }}>{it.cgstRate}%</div>
                      <div style={{ color: "#374151", whiteSpace: "nowrap" }}>₹{it.cgstAmount.toFixed(2)}</div>
                    </td>
                    <td style={{ textAlign: "right", padding: "9px 6px", fontSize: "0.78rem" }}>
                      <div style={{ fontSize: "0.68rem", color: "#9CA3AF" }}>{it.sgstRate}%</div>
                      <div style={{ color: "#374151", whiteSpace: "nowrap" }}>₹{it.sgstAmount.toFixed(2)}</div>
                    </td>
                    <td style={{ textAlign: "right", padding: "9px 8px", fontWeight: 700, color: "#111827", whiteSpace: "nowrap" }}>₹{it.totalAmount.toFixed(2)}</td>
                  </tr>
                ))}

                {/* Shipping and charges row */}
                <tr style={{ borderBottom: "1px solid #F3F4F6", backgroundColor: "#FFFFFF" }}>
                  <td style={{ textAlign: "center", padding: "9px 4px", color: "#9CA3AF" }}>—</td>
                  <td colSpan={5} style={{ padding: "9px 8px", fontStyle: "italic", color: "#4B5563", fontSize: "0.79rem" }}>
                    Shipping and charges : ₹{taxCalc.deliveryTaxable.toFixed(2)} | shipping gst {taxCalc.deliveryTaxRate}% : ₹{taxCalc.deliveryGst.toFixed(2)}
                  </td>
                  <td style={{ textAlign: "right", padding: "9px 6px", color: "#111827", whiteSpace: "nowrap" }}>₹{taxCalc.deliveryTaxable.toFixed(2)}</td>
                  <td style={{ textAlign: "right", padding: "9px 6px", color: "#374151", fontSize: "0.78rem" }}>
                    <div style={{ fontSize: "0.68rem", color: "#9CA3AF" }}>{(taxCalc.deliveryTaxRate / 2).toFixed(1)}%</div>
                    <div style={{ whiteSpace: "nowrap" }}>₹{(taxCalc.deliveryGst / 2).toFixed(2)}</div>
                  </td>
                  <td style={{ textAlign: "right", padding: "9px 6px", color: "#374151", fontSize: "0.78rem" }}>
                    <div style={{ fontSize: "0.68rem", color: "#9CA3AF" }}>{(taxCalc.deliveryTaxRate / 2).toFixed(1)}%</div>
                    <div style={{ whiteSpace: "nowrap" }}>₹{(taxCalc.deliveryGst / 2).toFixed(2)}</div>
                  </td>
                  <td style={{ textAlign: "right", padding: "9px 8px", fontWeight: 700, color: "#111827", whiteSpace: "nowrap" }}>₹{taxCalc.deliveryTotal.toFixed(2)}</td>
                </tr>

                {/* Coupon discount row if applied */}
                {taxCalc.productDiscount > 0 && (
                  <tr style={{ borderBottom: "1px solid #F3F4F6", backgroundColor: "#F0FDF4" }}>
                    <td style={{ textAlign: "center", padding: "9px 4px", color: "#9CA3AF" }}>—</td>
                    <td colSpan={4} style={{ padding: "9px 8px", color: "#059669", fontWeight: 600, fontSize: "0.79rem" }}>
                      🏷️ Coupon Discount {order.appliedCoupon?.code ? `(${order.appliedCoupon.code} applied)` : "(OFFER applied)"}
                    </td>
                    <td style={{ textAlign: "right", padding: "9px 6px", color: "#059669", fontWeight: 700, whiteSpace: "nowrap" }}>
                      -₹{taxCalc.productDiscount.toFixed(2)}
                    </td>
                    <td colSpan={4} style={{ padding: "9px 6px" }}></td>
                  </tr>
                )}

                {/* Summary / Total row */}
                <tr style={{ backgroundColor: "#E5E7EB", fontWeight: 700, color: "#111827", fontSize: "0.8rem" }}>
                  <td style={{ textAlign: "center", padding: "10px 4px", color: "#6B7280" }}>{taxCalc.items.length}</td>
                  <td style={{ padding: "10px 8px" }}>TOTAL QTY:</td>
                  <td style={{ textAlign: "center", padding: "10px 4px" }}>{totalQuantity}</td>
                  <td style={{ textAlign: "right", padding: "10px 6px", color: "#6B7280" }}>—</td>
                  <td style={{ textAlign: "right", padding: "10px 6px", whiteSpace: "nowrap" }}>₹{taxCalc.productGross.toFixed(2)}</td>
                  <td style={{ textAlign: "right", padding: "10px 6px", color: taxCalc.productDiscount > 0 ? "#059669" : "#6B7280", whiteSpace: "nowrap" }}>
                    {taxCalc.productDiscount > 0 ? `-₹${taxCalc.productDiscount.toFixed(2)}` : "—"}
                  </td>
                  <td style={{ textAlign: "right", padding: "10px 6px", whiteSpace: "nowrap" }}>₹{(taxCalc.productTaxable + taxCalc.deliveryTaxable).toFixed(2)}</td>
                  <td style={{ textAlign: "right", padding: "10px 6px", whiteSpace: "nowrap" }}>₹{(taxCalc.productCgst + taxCalc.deliveryCgst).toFixed(2)}</td>
                  <td style={{ textAlign: "right", padding: "10px 6px", whiteSpace: "nowrap" }}>₹{(taxCalc.productSgst + taxCalc.deliverySgst).toFixed(2)}</td>
                  <td style={{ textAlign: "right", padding: "10px 8px", fontSize: "0.92rem", fontWeight: 800, whiteSpace: "nowrap" }}>₹{taxCalc.grandTotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Computer Generated Disclaimer */}
          <div style={{ textAlign: "center", fontSize: "0.76rem", color: "#9CA3AF", marginTop: "26px", marginBottom: "22px" }}>
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
              <strong>NeoCloudBites</strong> Pvt. Ltd. • Support: hello@neocloudbites.com
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
