"use client";

import { useEffect, useState, use } from "react";
import { fetchApi } from "@/lib/fetch-api";
import { Printer, ArrowLeft, Loader2, Receipt, Store, UserCheck, AlertCircle, Utensils } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { calculateOrderTax, cleanNumericPrice, TaxCalculationResult } from "@/lib/tax-calculator";

export default function OrderInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState<any | null>(null);
    const [error, setError] = useState("");
    const [activeType, setActiveType] = useState<"user" | "seller">("user");

    useEffect(() => {
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            const typeParam = urlParams.get("type")?.toLowerCase() || urlParams.get("role")?.toLowerCase();
            if (typeParam === "seller") {
                setActiveType("seller");
            } else if (typeParam === "user") {
                setActiveType("user");
            }
        }
    }, []);

    useEffect(() => {
        if (!id) return;
        const fetchOrder = async () => {
            try {
                // Try public order endpoint first (works for all roles and guest verification)
                let res = await fetchApi(`/api/public/orders/${id}`);
                if (!res.ok) {
                    res = await fetchApi(`/api/user/orders/${id}`);
                }
                const resData = await res.json();
                if (res.ok) {
                    const fetchedOrder = resData.data || resData;
                    if (fetchedOrder && fetchedOrder.status !== "DELIVERED") {
                        setError("Invoices are only generated and accessible after the order has been successfully delivered.");
                    } else {
                        setOrder(fetchedOrder);
                    }
                } else {
                    setError(resData.message || "Failed to retrieve invoice details.");
                }
            } catch (err) {
                console.error("Error fetching order for invoice:", err);
                setError("An error occurred while loading the invoice.");
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F8FAFC', gap: '15px' }}>
                <Loader2 className="animate-spin" size={40} color="var(--primary, #EA580C)" />
                <span style={{ fontSize: '1rem', color: '#64748B', fontWeight: '500' }}>Loading Dynamic Invoice...</span>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F8FAFC', padding: '20px' }}>
                <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', textAlign: 'center', maxWidth: '440px' }}>
                    <AlertCircle size={48} color="#EF4444" style={{ margin: '0 auto 15px' }} />
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1E293B', marginBottom: '10px' }}>Error Loading Invoice</h2>
                    <p style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '20px' }}>{error || "Invoice not found or access is restricted."}</p>
                    <button onClick={() => window.close()} style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#1E293B', color: 'white', fontWeight: '600', border: 'none', cursor: 'pointer' }}>
                        Close Window
                    </button>
                </div>
            </div>
        );
    }

    // 1. Authoritative Item Extraction & Numeric Price Sanitization
    const rawItems: any[] = (() => {
        try {
            const parsed = typeof order.items === "string" ? JSON.parse(order.items) : (order.items || order.rawItems || []);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    })();

    const sellerTaxMode = order.taxMode || order.seller?.taxMode || "TAX_INCLUSIVE";
    const pTaxRate = cleanNumericPrice(order.productTaxRate, 5.0);
    const dTaxRate = cleanNumericPrice(order.deliveryTaxRate, 18.0);
    let dCharge = 0;
    if (typeof order.deliveryCharge === "number") {
        dCharge = order.deliveryCharge;
    } else if (order.deliveryFee !== undefined && order.deliveryFee !== null) {
        dCharge = cleanNumericPrice(order.deliveryFee, 0);
    } else if (typeof order.seller?.deliveryCharge === "number") {
        dCharge = order.seller.deliveryCharge;
    }

    const couponDiscount = cleanNumericPrice(
        order.discount ||
        order.couponDiscount ||
        order.productDiscount ||
        order.appliedCoupon?.discountAmount,
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
            id: it.id || it.foodItemId,
            name: it.name || "Food Item",
            quantity: qty,
            price: price,
            discountAmount: cleanNumericPrice(it.discountAmount, 0),
            addonsTotal: cleanNumericPrice(it.addonsTotal || it.addonsSubtotal, 0),
            selectedAddons: it.selectedAddons || it.addons || [],
            hsn: it.hsn || "996331",
            sku: it.sku || (it.id ? String(it.id).slice(-4) : "8"),
        };
    });

    if (mappedItems.length === 0 || mappedItems.every(i => i.price === 0)) {
        const fallbackSubtotal = cleanNumericPrice(order.subtotal || order.totalAmount || order.grandTotal, 0);
        if (fallbackSubtotal > 0) {
            mappedItems.push({
                id: "fallback",
                name: order.dishName || "Ordered Food Item",
                quantity: 1,
                price: fallbackSubtotal,
                discountAmount: 0,
                addonsTotal: 0,
                selectedAddons: [],
                hsn: "996331",
                sku: "8",
            });
        }
    }

    // 2. Perform authoritative tax calculations matching Word doc & platform settings
    const taxCalc: TaxCalculationResult = calculateOrderTax({
        items: mappedItems,
        sellerTaxMode,
        productTaxRate: pTaxRate,
        deliveryTaxRate: dTaxRate,
        deliveryCharge: dCharge,
        orderCouponDiscount: couponDiscount,
    });

    // Dates and IDs
    const orderDateObj = new Date(order.createdAt || Date.now());
    const formattedDateOnly = orderDateObj.toLocaleDateString("en-IN", {
        day: "2-digit", month: "2-digit", year: "numeric"
    });
    const formattedDateTime = orderDateObj.toLocaleDateString("en-IN", {
        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true
    });

    const invoiceNo = `INV${orderDateObj.getFullYear()}${String(orderDateObj.getMonth() + 1).padStart(2, "0")}${order.id.slice(0, 8).toUpperCase()}`;
    const orderNo = `ORD-${order.id.slice(0, 8).toUpperCase()}`;
    const qrVerificationUrl = typeof window !== "undefined" ? window.location.href : `https://neocloudbites.com/invoice/order/${order.id}`;
    const totalQuantity = mappedItems.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);

    // Business details
    const sellerName = order.seller?.businessName || order.seller?.kitchenName || "NeoCloudBites Kitchen";
    const sellerStreet = [order.seller?.addressFlat, order.seller?.addressLocality].filter(Boolean).join(", ") || "Main Street";
    const sellerCity = order.seller?.user?.city || order.seller?.city || "Pune";
    const sellerPincode = order.seller?.user?.pincode || order.seller?.pincode || "411058";
    const sellerEmail = order.seller?.user?.email || "info@neocloudbites.com";
    const sellerPhone = order.seller?.user?.phone || "+91 7030911999";
    const sellerGst = order.seller?.gstNumber || order.seller?.fssaiNumber || "27AADFY7505R1ZE";

    // Customer details
    const customerName = order.user?.name || "Customer";
    const customerAddress = order.deliveryAddress?.split(" | Loc:")[0] || `${sellerCity}, Maharashtra, India - ${sellerPincode}`;
    const customerEmail = order.user?.email || "customer@neocloudbites.com";
    const customerPhone = order.customerPhone || order.user?.phone || "+91 8208081346";
    const addressType = order.addressType || "Home";

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="invoice-page-bg">
            <style jsx global>{`
                .invoice-page-bg {
                    min-height: 100vh;
                    background-color: #F1F5F9;
                    padding: 24px 16px;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    color: #000000;
                }
                .invoice-card {
                    max-width: 950px;
                    margin: 0 auto;
                    background-color: #FFFFFF;
                    padding: 36px 40px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
                    border: 1px solid #CBD5E1;
                }
                .ref-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.84rem;
                }
                .ref-table th, .ref-table td {
                    padding: 8px 10px;
                }
                @media print {
                    @page {
                        size: A4;
                        margin: 10mm;
                    }
                    body {
                        background-color: #FFFFFF !important;
                        color: #000000 !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .invoice-page-bg {
                        background-color: #FFFFFF !important;
                        padding: 0 !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .invoice-card {
                        box-shadow: none !important;
                        border: none !important;
                        max-width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                }
            `}</style>

            {/* Top Interactive Bar (Hidden on Print) */}
            <div className="no-print" style={{ maxWidth: '950px', margin: '0 auto 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                        onClick={() => window.close()} 
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#475569', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', padding: '8px 14px', borderRadius: '8px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                        <ArrowLeft size={15} /> Close
                    </button>

                    {/* View Switcher Pills */}
                    <div style={{ display: 'inline-flex', backgroundColor: '#E2E8F0', padding: '3px', borderRadius: '8px', gap: '3px' }}>
                        <button
                            onClick={() => setActiveType("user")}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 14px',
                                borderRadius: '6px',
                                fontSize: '0.82rem',
                                fontWeight: activeType === "user" ? '700' : '500',
                                color: activeType === "user" ? '#0F172A' : '#64748B',
                                backgroundColor: activeType === "user" ? '#FFFFFF' : 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: activeType === "user" ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            <UserCheck size={14} color={activeType === "user" ? '#16A34A' : '#64748B'} /> Customer Invoice
                        </button>
                        <button
                            onClick={() => setActiveType("seller")}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 14px',
                                borderRadius: '6px',
                                fontSize: '0.82rem',
                                fontWeight: activeType === "seller" ? '700' : '500',
                                color: activeType === "seller" ? '#0F172A' : '#64748B',
                                backgroundColor: activeType === "seller" ? '#FFFFFF' : 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: activeType === "seller" ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            <Store size={14} color={activeType === "seller" ? '#EA580C' : '#64748B'} /> Seller Tax Invoice
                        </button>
                    </div>
                </div>

                <button 
                    onClick={handlePrint}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#FFFFFF', backgroundColor: activeType === "seller" ? '#0F172A' : '#15803D', border: 'none', padding: '9px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                >
                    <Printer size={16} /> Print / Save as PDF
                </button>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                INVOICE CONTENT: Renders User Invoice OR Seller Invoice
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="invoice-card">
                {activeType === "user" ? (
                    /* ─────────────────────────────────────────────────────────────
                       REFERENCE 1: USER / CUSTOMER INVOICE (media_1793099480078_908f50c4.png)
                    ───────────────────────────────────────────────────────────── */
                    <div>
                        {/* Top Header: Logo & Seller Info (Left) | INVOICE & Order Details (Right) */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#15803D', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Utensils size={18} />
                                    </div>
                                    <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#15803D' }}>
                                        NeoCloudBites
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0F172A', marginBottom: '2px' }}>
                                    {sellerName} ({sellerName})
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#334155', lineHeight: '1.4' }}>
                                    <div>{sellerStreet}, {sellerCity}</div>
                                    <div>{sellerCity}, Maharashtra - {sellerPincode}</div>
                                    <div>E-Mail Address: {sellerEmail}</div>
                                    <div>Phone Number: {sellerPhone}</div>
                                    <div>GST Number: <strong>{sellerGst}</strong></div>
                                </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '2.4rem', fontWeight: '900', color: '#15803D', letterSpacing: '0.04em', lineHeight: 1, marginBottom: '14px' }}>
                                    INVOICE
                                </div>
                                <div style={{ fontSize: '0.82rem', color: '#1E293B', lineHeight: '1.5' }}>
                                    <div>Invoice Number: <strong>{invoiceNo}</strong></div>
                                    <div>Order Id: <strong>{orderNo}</strong></div>
                                    <div>Invoice Date: <strong>{formattedDateOnly}</strong></div>
                                    <div>Order Date: <strong>{formattedDateOnly}</strong></div>
                                </div>
                            </div>
                        </div>

                        {/* Divider Line */}
                        <div style={{ borderTop: '1px solid #CBD5E1', margin: '14px 0 16px' }} />

                        {/* Bill To Section */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>
                                Bill To:
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: '1.45' }}>
                                <div style={{ fontWeight: '600', color: '#0F172A' }}>{customerName}</div>
                                <div>{customerAddress}</div>
                                <div>E-Mail Address: {customerEmail}</div>
                                <div>Phone Number: {customerPhone}</div>
                                <div>Address Type: {addressType}</div>
                            </div>
                        </div>

                        {/* Product Table Matching Reference 1 */}
                        <table className="ref-table" style={{ border: '1px solid #CBD5E1', marginBottom: '16px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid #CBD5E1' }}>
                                    <th style={{ width: '32px', textAlign: 'center', borderRight: '1px solid #CBD5E1' }}>#</th>
                                    <th style={{ textAlign: 'left', minWidth: '170px', borderRight: '1px solid #CBD5E1' }}>Product</th>
                                    <th style={{ textAlign: 'center', width: '70px', borderRight: '1px solid #CBD5E1' }}>Unit</th>
                                    <th style={{ textAlign: 'right', width: '75px', borderRight: '1px solid #CBD5E1' }}>MRP</th>
                                    <th style={{ textAlign: 'right', width: '85px', borderRight: '1px solid #CBD5E1' }}>Gross Amt</th>
                                    <th style={{ textAlign: 'right', width: '90px', borderRight: '1px solid #CBD5E1' }}>Discount</th>
                                    <th style={{ textAlign: 'right', width: '90px', borderRight: '1px solid #CBD5E1' }}>Taxable Val</th>
                                    <th style={{ textAlign: 'right', width: '80px', borderRight: '1px solid #CBD5E1' }}>CGST</th>
                                    <th style={{ textAlign: 'right', width: '80px', borderRight: '1px solid #CBD5E1' }}>SGST</th>
                                    <th style={{ textAlign: 'right', width: '90px' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {taxCalc.items.map((it, idx) => (
                                    <tr key={it.id || idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                        <td style={{ textAlign: 'center', borderRight: '1px solid #E2E8F0', color: '#475569' }}>{idx + 1}</td>
                                        <td style={{ borderRight: '1px solid #E2E8F0' }}>
                                            <div style={{ fontWeight: '700', color: '#0F172A' }}>{it.name}</div>
                                            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>HSN: {mappedItems[idx]?.hsn || '15089091'}</div>
                                            {mappedItems[idx]?.selectedAddons && mappedItems[idx].selectedAddons.length > 0 && (
                                                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                                                    Add-ons: {mappedItems[idx].selectedAddons.map((a: any) => `${a.name} (x${a.quantity || 1})`).join(', ')}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>1 × {it.quantity}</td>
                                        <td style={{ textAlign: 'right', borderRight: '1px solid #E2E8F0' }}>₹{it.unitPrice.toFixed(2)}</td>
                                        <td style={{ textAlign: 'right', borderRight: '1px solid #E2E8F0' }}>₹{it.grossAmount.toFixed(2)}</td>
                                        <td style={{ textAlign: 'right', borderRight: '1px solid #E2E8F0', fontSize: '0.76rem' }}>
                                            {it.discountAmount > 0 ? (
                                                <div>
                                                    <div>PD: ₹{it.discountAmount.toFixed(2)}</div>
                                                </div>
                                            ) : (
                                                <span style={{ color: '#64748B' }}>-</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'right', borderRight: '1px solid #E2E8F0' }}>₹{it.taxableValue.toFixed(2)}</td>
                                        <td style={{ textAlign: 'right', borderRight: '1px solid #E2E8F0', fontSize: '0.78rem' }}>
                                            <div>₹{it.cgstAmount.toFixed(2)}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#64748B' }}>({it.cgstRate}%)</div>
                                        </td>
                                        <td style={{ textAlign: 'right', borderRight: '1px solid #E2E8F0', fontSize: '0.78rem' }}>
                                            <div>₹{it.sgstAmount.toFixed(2)}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#64748B' }}>({it.sgstRate}%)</div>
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: '700', color: '#0F172A' }}>₹{it.totalAmount.toFixed(2)}</td>
                                    </tr>
                                ))}

                                {/* Shipping and charges row */}
                                <tr style={{ borderBottom: '1px solid #CBD5E1', backgroundColor: '#FAFAFA' }}>
                                    <td colSpan={9} style={{ textAlign: 'right', fontWeight: '600', paddingRight: '16px', borderRight: '1px solid #E2E8F0' }}>
                                        Shipping and charges : {taxCalc.deliveryTaxable.toFixed(2)} | shipping gst {taxCalc.deliveryTaxRate}% : {taxCalc.deliveryGst.toFixed(2)}
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: '700' }}>
                                        ₹{taxCalc.deliveryTotal.toFixed(2)}
                                    </td>
                                </tr>

                                {/* Coupon Discount row if applied */}
                                {order.appliedCoupon && taxCalc.productDiscount > 0 && (
                                    <tr style={{ borderBottom: '1px solid #CBD5E1', backgroundColor: '#F0FDF4' }}>
                                        <td colSpan={9} style={{ textAlign: 'right', fontWeight: '600', color: '#166534', paddingRight: '16px', borderRight: '1px solid #E2E8F0' }}>
                                            Coupon Discount ({order.appliedCoupon.code || 'COUPON'}) :
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: '700', color: '#166534' }}>
                                            -₹{taxCalc.productDiscount.toFixed(2)}
                                        </td>
                                    </tr>
                                )}

                                {/* Grand Total Row */}
                                <tr style={{ backgroundColor: '#FFFFFF', fontWeight: '800' }}>
                                    <td colSpan={3} style={{ textAlign: 'left', borderRight: '1px solid #E2E8F0', padding: '12px 10px' }}>
                                        TOTAL QTY: {totalQuantity}
                                    </td>
                                    <td colSpan={6} style={{ textAlign: 'right', paddingRight: '16px', borderRight: '1px solid #E2E8F0', letterSpacing: '0.02em' }}>
                                        GRAND TOTAL:
                                    </td>
                                    <td style={{ textAlign: 'right', fontSize: '1rem', color: '#0F172A', padding: '12px 10px' }}>
                                        ₹{taxCalc.grandTotal.toFixed(2)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Signature Box Matching Reference 1 */}
                        <div style={{ border: '1px solid #CBD5E1', borderRadius: '4px', padding: '36px 20px 14px', textAlign: 'right', marginTop: '24px' }}>
                            <span style={{ fontStyle: 'italic', fontSize: '0.88rem', color: '#334155' }}>
                                Authorized Signature
                            </span>
                        </div>
                    </div>
                ) : (
                    /* ─────────────────────────────────────────────────────────────
                       REFERENCE 2: SELLER TAX INVOICE (media_1793099517993_2d62ebe8.png)
                    ───────────────────────────────────────────────────────────── */
                    <div>
                        {/* Cut Line */}
                        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#475569', letterSpacing: '0.05em', marginBottom: '8px' }}>
                            ✂ TEAR HERE (ADMIN RECORD BELOW)
                        </div>
                        <div style={{ borderTop: '1px dashed #64748B', marginBottom: '14px' }} />

                        {/* Header: Tax Invoice + Order Id/Date (Left) | Invoice No/Date/GSTIN + QR Code (Right) */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <div>
                                <div style={{ fontSize: '2.4rem', fontWeight: '900', color: '#000000', lineHeight: 1.1, marginBottom: '10px' }}>
                                    Tax Invoice
                                </div>
                                <div style={{ fontSize: '0.88rem', color: '#000000', lineHeight: '1.5' }}>
                                    <div><strong>Order Id:</strong> {orderNo}</div>
                                    <div><strong>Order Date:</strong> {formattedDateTime}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', textAlign: 'right' }}>
                                <div style={{ fontSize: '0.86rem', color: '#000000', lineHeight: '1.5' }}>
                                    <div><strong>Invoice No:</strong> {invoiceNo}</div>
                                    <div><strong>Invoice Date:</strong> {formattedDateOnly}</div>
                                    <div style={{ marginTop: '4px' }}><strong>GSTIN:</strong> {sellerGst}</div>
                                </div>
                                <div style={{ border: '1px solid #000000', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <QRCodeSVG value={qrVerificationUrl} size={76} level="M" />
                                </div>
                            </div>
                        </div>

                        {/* Heavy Solid Black Divider */}
                        <div style={{ borderTop: '3px solid #000000', margin: '12px 0 16px' }} />

                        {/* 3-Column Address Grid: SOLD BY | BILLING ADDRESS | SHIPPING ADDRESS */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '18px' }}>
                            {/* Sold By */}
                            <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: '900', color: '#000000', borderBottom: '2px solid #000000', paddingBottom: '3px', marginBottom: '6px', letterSpacing: '0.03em' }}>
                                    SOLD BY
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#000000', lineHeight: '1.4' }}>
                                    <div style={{ fontWeight: '700' }}>{sellerName}</div>
                                    <div>{sellerStreet}</div>
                                    <div>{sellerCity}, Maharashtra - {sellerPincode}</div>
                                    <div>GST: {sellerGst}</div>
                                </div>
                            </div>

                            {/* Billing Address */}
                            <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: '900', color: '#000000', borderBottom: '2px solid #000000', paddingBottom: '3px', marginBottom: '6px', letterSpacing: '0.03em' }}>
                                    BILLING ADDRESS
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#000000', lineHeight: '1.4' }}>
                                    <div style={{ fontWeight: '700' }}>{customerName}</div>
                                    <div>{customerAddress}</div>
                                    <div>PH: {customerPhone}</div>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: '900', color: '#000000', borderBottom: '2px solid #000000', paddingBottom: '3px', marginBottom: '6px', letterSpacing: '0.03em' }}>
                                    SHIPPING ADDRESS
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#000000', lineHeight: '1.4' }}>
                                    <div style={{ fontWeight: '700' }}>{customerName}</div>
                                    <div>{customerAddress}</div>
                                    <div>PH: {customerPhone}</div>
                                </div>
                            </div>
                        </div>

                        {/* Solid Black Bordered Table Matching Reference 2 */}
                        <table className="ref-table" style={{ border: '2px solid #000000', marginBottom: '18px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #000000', backgroundColor: '#FFFFFF' }}>
                                    <th style={{ textAlign: 'left', minWidth: '190px', borderRight: '1px solid #000000', color: '#000000', fontWeight: '800' }}>Product</th>
                                    <th style={{ textAlign: 'center', width: '70px', borderRight: '1px solid #000000', color: '#000000', fontWeight: '800' }}>HSN</th>
                                    <th style={{ textAlign: 'center', width: '50px', borderRight: '1px solid #000000', color: '#000000', fontWeight: '800' }}>Qty</th>
                                    <th style={{ textAlign: 'right', width: '85px', borderRight: '1px solid #000000', color: '#000000', fontWeight: '800' }}>Gross Amt</th>
                                    <th style={{ textAlign: 'right', width: '85px', borderRight: '1px solid #000000', color: '#000000', fontWeight: '800' }}>Discount</th>
                                    <th style={{ textAlign: 'right', width: '85px', borderRight: '1px solid #000000', color: '#000000', fontWeight: '800' }}>Tax Val</th>
                                    <th style={{ textAlign: 'right', width: '80px', borderRight: '1px solid #000000', color: '#000000', fontWeight: '800' }}>CGST</th>
                                    <th style={{ textAlign: 'right', width: '80px', borderRight: '1px solid #000000', color: '#000000', fontWeight: '800' }}>SGST</th>
                                    <th style={{ textAlign: 'right', width: '90px', color: '#000000', fontWeight: '800' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {taxCalc.items.map((it, idx) => (
                                    <tr key={it.id || idx} style={{ borderBottom: '1px solid #000000' }}>
                                        <td style={{ borderRight: '1px solid #000000' }}>
                                            <div style={{ fontWeight: '800', color: '#000000' }}>{it.name}</div>
                                            <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: '2px', lineHeight: '1.3' }}>
                                                {mappedItems[idx]?.selectedAddons && mappedItems[idx].selectedAddons.length > 0 ? (
                                                    <div>Variant / Addons: {mappedItems[idx].selectedAddons.map((a: any) => `${a.name} (x${a.quantity || 1})`).join(', ')}</div>
                                                ) : (
                                                    <div>Variant: Standard</div>
                                                )}
                                                <div>SKU: {mappedItems[idx]?.sku || '8'}</div>
                                                <div>MRP: ₹{it.unitPrice.toFixed(2)}</div>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center', borderRight: '1px solid #000000' }}>{mappedItems[idx]?.hsn || '110100'}</td>
                                        <td style={{ textAlign: 'center', fontWeight: '700', borderRight: '1px solid #000000' }}>{it.quantity}</td>
                                        <td style={{ textAlign: 'right', borderRight: '1px solid #000000' }}>₹{it.grossAmount.toFixed(2)}</td>
                                        <td style={{ textAlign: 'right', borderRight: '1px solid #000000', fontSize: '0.78rem' }}>
                                            {it.discountAmount > 0 ? `PD: ₹${it.discountAmount.toFixed(2)}` : '-'}
                                        </td>
                                        <td style={{ textAlign: 'right', borderRight: '1px solid #000000' }}>₹{it.taxableValue.toFixed(2)}</td>
                                        <td style={{ textAlign: 'right', borderRight: '1px solid #000000', fontSize: '0.78rem' }}>
                                            <div>₹{it.cgstAmount.toFixed(2)}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#475569' }}>({it.cgstRate}%)</div>
                                        </td>
                                        <td style={{ textAlign: 'right', borderRight: '1px solid #000000', fontSize: '0.78rem' }}>
                                            <div>₹{it.sgstAmount.toFixed(2)}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#475569' }}>({it.sgstRate}%)</div>
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: '800', color: '#000000' }}>₹{it.totalAmount.toFixed(2)}</td>
                                    </tr>
                                ))}

                                {/* Shipping and charges row */}
                                <tr style={{ borderBottom: '1px solid #000000' }}>
                                    <td colSpan={8} style={{ textAlign: 'right', fontWeight: '600', paddingRight: '16px', borderRight: '1px solid #000000' }}>
                                        Shipping and charges : {taxCalc.deliveryTaxable.toFixed(2)} | shipping gst {taxCalc.deliveryTaxRate}% : {taxCalc.deliveryGst.toFixed(2)}
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: '800' }}>
                                        ₹{taxCalc.deliveryTotal.toFixed(2)}
                                    </td>
                                </tr>

                                {/* Grand Total Row */}
                                <tr style={{ fontWeight: '900' }}>
                                    <td colSpan={3} style={{ textAlign: 'left', borderRight: '1px solid #000000', padding: '10px' }}>
                                        TOTAL QTY: {totalQuantity}
                                    </td>
                                    <td colSpan={5} style={{ textAlign: 'right', paddingRight: '16px', borderRight: '1px solid #000000', letterSpacing: '0.02em' }}>
                                        GRAND TOTAL:
                                    </td>
                                    <td style={{ textAlign: 'right', fontSize: '1.05rem', color: '#000000', padding: '10px' }}>
                                        ₹{taxCalc.grandTotal.toFixed(2)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Footer: Registered Office (Left) | Ordered Through & Authorized Signatory (Right) */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '10px', fontSize: '0.78rem', color: '#000000' }}>
                            <div style={{ maxWidth: '450px', lineHeight: '1.4' }}>
                                <strong>Registered Office:</strong> {sellerName}, {sellerStreet}, {sellerCity} {sellerPincode}.
                            </div>
                            <div style={{ textAlign: 'right', lineHeight: '1.5' }}>
                                <div>Ordered Through <strong>NEOCLOUDBITES</strong></div>
                                <div style={{ marginTop: '30px', fontStyle: 'italic', color: '#334155' }}>
                                    Authorized Signatory
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
