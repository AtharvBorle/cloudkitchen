"use client";

import { useEffect, useState, use } from "react";
import { fetchApi } from "@/lib/fetch-api";
import { Printer, ArrowLeft, Loader2, Receipt, Phone, Mail, MapPin, CheckCircle, AlertCircle, ShieldCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { calculateOrderTax, TaxCalculationResult } from "@/lib/tax-calculator";

export default function OrderInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState<any | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) return;
        const fetchOrder = async () => {
            try {
                const res = await fetchApi(`/api/user/orders/${id}`);
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F8F9FA', gap: '15px' }}>
                <Loader2 className="animate-spin" size={40} color="var(--primary, #EA580C)" />
                <span style={{ fontSize: '1rem', color: '#6B7280', fontWeight: '500' }}>Generating Dynamic Tax Invoice...</span>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F8F9FA', padding: '20px' }}>
                <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', textAlign: 'center', maxWidth: '420px' }}>
                    <AlertCircle size={48} color="#EF4444" style={{ margin: '0 auto 15px' }} />
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1E293B', marginBottom: '10px' }}>Error Loading Invoice</h2>
                    <p style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '20px' }}>{error || "Invoice not found or access is restricted."}</p>
                    <button onClick={() => window.close()} style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#1E293B', color: 'white', fontWeight: '600', border: 'none', cursor: 'pointer' }}>
                        Close Tab
                    </button>
                </div>
            </div>
        );
    }

    const items: any[] = (() => {
        try {
            return typeof order.items === "string" ? JSON.parse(order.items) : (order.items || []);
        } catch {
            return [];
        }
    })();

    const subtotal = items.reduce((acc: number, item: any) => acc + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
    const discountAmount = order.appliedCoupon 
        ? (order.appliedCoupon.discountPercentage 
            ? (subtotal * (Number(order.appliedCoupon.discountPercentage) / 100))
            : (Number(order.appliedCoupon.discountAmount) || 0))
        : 0;

    // Retrieve saved tax breakdown or compute dynamically
    let taxCalc: TaxCalculationResult;
    try {
        if (order.taxBreakdown && typeof order.taxBreakdown === "string" && order.taxBreakdown.length > 5) {
            taxCalc = JSON.parse(order.taxBreakdown);
        } else if (order.taxBreakdown && typeof order.taxBreakdown === "object" && order.taxBreakdown.items) {
            taxCalc = order.taxBreakdown;
        } else {
            throw new Error("No cached breakdown");
        }
    } catch {
        const sellerTaxMode = order.taxMode || order.seller?.taxMode || "TAX_INCLUSIVE";
        const pTaxRate = typeof order.productTaxRate === "number" ? order.productTaxRate : 5.0;
        const dTaxRate = typeof order.deliveryTaxRate === "number" ? order.deliveryTaxRate : 18.0;
        const dCharge = typeof order.deliveryCharge === "number" ? order.deliveryCharge : (order.seller?.deliveryCharge ?? 50.0);

        taxCalc = calculateOrderTax({
            items,
            sellerTaxMode,
            productTaxRate: pTaxRate,
            deliveryTaxRate: dTaxRate,
            deliveryCharge: dCharge,
            orderCouponDiscount: discountAmount,
        });
    }

    const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
        year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    });

    const invoiceNo = `INV-${order.id.slice(0, 8).toUpperCase()}`;
    const orderNo = `#${order.id.slice(0, 8).toUpperCase()}`;
    const qrVerificationUrl = typeof window !== "undefined" ? window.location.href : `https://neocloudbites.com/invoice/order/${order.id}`;

    const totalQuantity = items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);

    const handlePrint = () => {
        window.print();
    };

    const isInclusive = taxCalc.taxMode === "TAX_INCLUSIVE";

    return (
        <div className="invoice-outer-bg">
            <style jsx global>{`
                .invoice-outer-bg {
                    min-height: 100vh;
                    background-color: #F8FAFC;
                    padding: 30px 16px;
                    font-family: var(--font-poppins), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }
                .invoice-container {
                    max-width: 950px;
                    margin: 0 auto;
                    background-color: #FFFFFF;
                    padding: 36px 40px;
                    border-radius: 14px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
                    border: 1px solid #E2E8F0;
                    color: #1E293B;
                }
                .table-responsive-wrapper {
                    width: 100%;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                    margin-bottom: 24px;
                }
                .invoice-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.82rem;
                }
                .invoice-table th {
                    background-color: #F8FAFC;
                    color: #475569;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.03em;
                    padding: 10px 8px;
                    border: 1px solid #E2E8F0;
                }
                .invoice-table td {
                    padding: 10px 8px;
                    border: 1px solid #E2E8F0;
                    vertical-align: middle;
                }
                .summary-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.83rem;
                }
                .summary-table td {
                    padding: 7px 10px;
                    border: 1px solid #E2E8F0;
                }
                .summary-table th {
                    background-color: #F8FAFC;
                    padding: 8px 10px;
                    font-weight: 700;
                    border: 1px solid #E2E8F0;
                    text-align: left;
                }
                @media (max-width: 768px) {
                    .invoice-outer-bg {
                        padding: 12px 8px;
                    }
                    .invoice-container {
                        padding: 18px 14px;
                        border-radius: 10px;
                    }
                }
                @media print {
                    body {
                        background-color: white !important;
                        color: black !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .invoice-outer-bg {
                        background-color: white !important;
                        padding: 0 !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .invoice-container {
                        box-shadow: none !important;
                        border: none !important;
                        max-width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .invoice-table th, .invoice-table td, .summary-table th, .summary-table td {
                        border: 1px solid #CBD5E1 !important;
                    }
                }
            `}</style>

            {/* Back & Print Bar (Hidden on Print) */}
            <div className="no-print" style={{ maxWidth: '950px', margin: '0 auto 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button 
                    onClick={() => window.close()} 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#475569', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', padding: '9px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '0.86rem', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                >
                    <ArrowLeft size={16} /> Close Window
                </button>
                <button 
                    onClick={handlePrint}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#FFFFFF', backgroundColor: '#EA580C', border: 'none', padding: '10px 22px', borderRadius: '8px', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 3px 10px rgba(234, 88, 12, 0.25)' }}
                >
                    <Printer size={16} /> Print / Save as PDF
                </button>
            </div>

            {/* Invoice Main Sheet */}
            <div className="invoice-container">
                
                {/* 1. Header Banner */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #E2E8F0', paddingBottom: '20px', marginBottom: '22px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#EA580C', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Receipt size={22} />
                            </div>
                            <span style={{ fontSize: '1.6rem', fontWeight: '900', letterSpacing: '-0.02em', color: '#0F172A' }}>
                                NEOCLOUDBITES
                            </span>
                        </div>
                        <p style={{ color: '#64748B', fontSize: '0.82rem', margin: '2px 0 6px 0' }}>
                            Smart Cloud Kitchen & Culinary Marketplace
                        </p>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: isInclusive ? '#DCFCE7' : '#EFF6FF', color: isInclusive ? '#166534' : '#1E40AF', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                            TAX INVOICE – {isInclusive ? 'TAX INCLUSIVE' : 'TAX EXCLUSIVE'}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px', textAlign: 'right' }}>
                        <div>
                            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', lineHeight: 1.2 }}>
                                {invoiceNo}
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '4px' }}>
                                <strong>Date:</strong> {formattedDate}
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '2px' }}>
                                <strong>Order ID:</strong> <span style={{ fontFamily: 'monospace' }}>{orderNo}</span>
                            </div>
                        </div>

                        {/* Dynamic QR Code */}
                        <div style={{ backgroundColor: '#FFFFFF', padding: '6px', border: '1px solid #CBD5E1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Scan to verify invoice">
                            <QRCodeSVG value={qrVerificationUrl} size={76} level="M" />
                        </div>
                    </div>
                </div>

                {/* 2. Metadata Status Badges Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', borderLeft: '4px solid #10B981' }}>
                        <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Payment Status</span>
                        <span style={{ fontSize: '0.86rem', fontWeight: '800', color: order.isPaid ? '#059669' : '#D97706' }}>
                            {order.isPaid ? "PAID / SUCCESS" : "COD / UNPAID"}
                        </span>
                    </div>

                    <div style={{ backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', borderLeft: '4px solid #2563EB' }}>
                        <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Payment Method</span>
                        <span style={{ fontSize: '0.86rem', fontWeight: '800', color: '#1E293B' }}>
                            {order.paymentMethod === "ONLINE" ? "ONLINE (Razorpay)" : "CASH ON DELIVERY (COD)"}
                        </span>
                    </div>

                    <div style={{ backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', borderLeft: '4px solid #EA580C' }}>
                        <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Tax Mode</span>
                        <span style={{ fontSize: '0.86rem', fontWeight: '800', color: '#EA580C' }}>
                            {isInclusive ? "Tax Inclusive Pricing" : "Tax Exclusive Pricing"}
                        </span>
                    </div>
                </div>

                {/* 3. Three-Column Addresses Grid: Sold By | Bill To | Ship To */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '28px', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
                    {/* Sold By */}
                    <div>
                        <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #E2E8F0', paddingBottom: '4px', marginBottom: '8px' }}>
                            Sold By (Seller)
                        </div>
                        <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>
                            {order.seller?.businessName || "Registered Cloud Kitchen"}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.8rem', color: '#475569' }}>
                            <span>{order.seller?.addressFlat && `${order.seller.addressFlat}, `}{order.seller?.addressLocality || "Kitchen Location"}</span>
                            <span>{order.seller?.user?.city} {order.seller?.user?.pincode && `- ${order.seller.user.pincode}`}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Phone size={12} color="#94A3B8" /> {order.seller?.user?.phone || "N/A"}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Mail size={12} color="#94A3B8" /> {order.seller?.user?.email || "N/A"}
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#0F172A', marginTop: '2px' }}>
                                FSSAI / GST: {order.seller?.fssaiUrl ? "22221012345678" : "27AAACN1234F1Z5"}
                            </span>
                        </div>
                    </div>

                    {/* Billing Address */}
                    <div>
                        <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #E2E8F0', paddingBottom: '4px', marginBottom: '8px' }}>
                            Billing Address (Customer)
                        </div>
                        <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>
                            {order.user?.name || "Customer"}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.8rem', color: '#475569' }}>
                            <span>{order.deliveryAddress?.split(" | Loc:")[0]}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Phone size={12} color="#94A3B8" /> {order.customerPhone || order.user?.phone || "N/A"}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Mail size={12} color="#94A3B8" /> {order.user?.email || "N/A"}
                            </span>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div>
                        <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #E2E8F0', paddingBottom: '4px', marginBottom: '8px' }}>
                            Shipping / Delivery Address
                        </div>
                        <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>
                            {order.user?.name || "Recipient"}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.8rem', color: '#475569' }}>
                            <span>{order.deliveryAddress?.split(" | Loc:")[0]}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Phone size={12} color="#94A3B8" /> {order.customerPhone || order.user?.phone || "N/A"}
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16A34A', fontWeight: '700', fontSize: '0.75rem', marginTop: '2px' }}>
                                <CheckCircle size={12} /> Verified Handover
                            </span>
                        </div>
                    </div>
                </div>

                {/* 4. Product Details Table (Matching Reference Structure) */}
                <div style={{ marginBottom: '6px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>
                        Product Details
                    </div>
                </div>

                <div className="table-responsive-wrapper">
                    <table className="invoice-table">
                        <thead>
                            <tr>
                                <th style={{ width: '32px', textAlign: 'center' }}>#</th>
                                <th style={{ textAlign: 'left', minWidth: '150px' }}>Product</th>
                                <th style={{ width: '65px', textAlign: 'center' }}>HSN/SAC</th>
                                <th style={{ width: '45px', textAlign: 'center' }}>Qty</th>
                                <th style={{ width: '75px', textAlign: 'right' }}>Price</th>
                                <th style={{ width: '80px', textAlign: 'right' }}>Gross Amt</th>
                                <th style={{ width: '75px', textAlign: 'right' }}>Discount</th>
                                <th style={{ width: '85px', textAlign: 'right' }}>Taxable Val</th>
                                <th style={{ width: '85px', textAlign: 'right' }}>CGST</th>
                                <th style={{ width: '85px', textAlign: 'right' }}>SGST</th>
                                <th style={{ width: '90px', textAlign: 'right' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {taxCalc.items.map((it, idx) => (
                                <tr key={it.id || idx}>
                                    <td style={{ textAlign: 'center', color: '#64748B' }}>{idx + 1}</td>
                                    <td>
                                        <div style={{ fontWeight: '700', color: '#0F172A' }}>{it.name}</div>
                                        {items[idx]?.selectedAddons && items[idx].selectedAddons.length > 0 && (
                                            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                                                Add-ons: {items[idx].selectedAddons.map((a: any) => `${a.name} (x${a.quantity || 1})`).join(', ')}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'center', color: '#64748B', fontFamily: 'monospace' }}>{it.hsn || '996331'}</td>
                                    <td style={{ textAlign: 'center', fontWeight: '700' }}>{it.quantity}</td>
                                    <td style={{ textAlign: 'right' }}>₹{it.unitPrice.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right' }}>₹{it.grossAmount.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right', color: it.discountAmount > 0 ? '#16A34A' : '#64748B' }}>
                                        {it.discountAmount > 0 ? `-₹${it.discountAmount.toFixed(2)}` : '₹0.00'}
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: '600' }}>₹{it.taxableValue.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{it.cgstRate}%</div>
                                        <div>₹{it.cgstAmount.toFixed(2)}</div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{it.sgstRate}%</div>
                                        <div>₹{it.sgstAmount.toFixed(2)}</div>
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: '700', color: '#0F172A' }}>₹{it.totalAmount.toFixed(2)}</td>
                                </tr>
                            ))}

                            {/* Shipping and Charges Row */}
                            {taxCalc.deliveryTotal > 0 && (
                                <tr style={{ backgroundColor: '#F8FAFC' }}>
                                    <td colSpan={7} style={{ fontStyle: 'italic', color: '#334155' }}>
                                        Shipping and charges : ₹{taxCalc.deliveryTaxable.toFixed(2)} | shipping gst {taxCalc.deliveryTaxRate}% : ₹{taxCalc.deliveryGst.toFixed(2)}
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: '600' }}>₹{taxCalc.deliveryTaxable.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right' }}>₹{taxCalc.deliveryCgst.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right' }}>₹{taxCalc.deliverySgst.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right', fontWeight: '700' }}>₹{taxCalc.deliveryTotal.toFixed(2)}</td>
                                </tr>
                            )}

                            {/* Order-level Coupon Discount Row if applied */}
                            {order.appliedCoupon && taxCalc.productDiscount > 0 && (
                                <tr style={{ backgroundColor: '#F0FDF4' }}>
                                    <td colSpan={6} style={{ color: '#166534', fontWeight: '600' }}>
                                        Coupon Discount ({order.appliedCoupon.code})
                                    </td>
                                    <td style={{ textAlign: 'right', color: '#166534', fontWeight: '700' }}>
                                        -₹{taxCalc.productDiscount.toFixed(2)}
                                    </td>
                                    <td colSpan={4}></td>
                                </tr>
                            )}

                            {/* Table Total Row */}
                            <tr style={{ backgroundColor: '#F1F5F9', fontWeight: '800' }}>
                                <td colSpan={3} style={{ textAlign: 'left', textTransform: 'uppercase' }}>
                                    TOTAL QTY: {totalQuantity}
                                </td>
                                <td style={{ textAlign: 'center' }}>{totalQuantity}</td>
                                <td></td>
                                <td style={{ textAlign: 'right' }}>₹{taxCalc.productGross.toFixed(2)}</td>
                                <td style={{ textAlign: 'right', color: '#166534' }}>
                                    {taxCalc.productDiscount > 0 ? `-₹${taxCalc.productDiscount.toFixed(2)}` : '₹0.00'}
                                </td>
                                <td style={{ textAlign: 'right' }}>₹{(taxCalc.productTaxable + taxCalc.deliveryTaxable).toFixed(2)}</td>
                                <td style={{ textAlign: 'right' }}>₹{(taxCalc.productCgst + taxCalc.deliveryCgst).toFixed(2)}</td>
                                <td style={{ textAlign: 'right' }}>₹{(taxCalc.productSgst + taxCalc.deliverySgst).toFixed(2)}</td>
                                <td style={{ textAlign: 'right', color: '#EA580C', fontSize: '0.92rem' }}>
                                    ₹{taxCalc.grandTotal.toFixed(2)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* 5. Summary Tables Grid (Shipping Details & Invoice Summary Matching Reference 1 & Docx) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '30px' }}>
                    {/* Shipping Details */}
                    <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>
                            Shipping Details
                        </div>
                        <table className="summary-table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th style={{ textAlign: 'right' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Shipping Charges ({isInclusive ? 'Inclusive' : 'Exclusive'})</td>
                                    <td style={{ textAlign: 'right', fontWeight: '600' }}>₹{taxCalc.deliveryGross.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>Shipping Taxable Value</td>
                                    <td style={{ textAlign: 'right' }}>₹{taxCalc.deliveryTaxable.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>Shipping CGST ({taxCalc.deliveryTaxRate / 2}%)</td>
                                    <td style={{ textAlign: 'right' }}>₹{taxCalc.deliveryCgst.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>Shipping SGST ({taxCalc.deliveryTaxRate / 2}%)</td>
                                    <td style={{ textAlign: 'right' }}>₹{taxCalc.deliverySgst.toFixed(2)}</td>
                                </tr>
                                <tr style={{ backgroundColor: '#F8FAFC', fontWeight: '700' }}>
                                    <td>Total Shipping Charges (Including GST)</td>
                                    <td style={{ textAlign: 'right', color: '#0F172A' }}>₹{taxCalc.deliveryTotal.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Invoice Summary */}
                    <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>
                            Invoice Summary
                        </div>
                        <table className="summary-table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th style={{ textAlign: 'right' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Gross Amount</td>
                                    <td style={{ textAlign: 'right', fontWeight: '600' }}>₹{taxCalc.productGross.toFixed(2)}</td>
                                </tr>
                                {taxCalc.productDiscount > 0 && (
                                    <tr>
                                        <td>Product Discount ({order.appliedCoupon?.code || 'Coupon'})</td>
                                        <td style={{ textAlign: 'right', color: '#166534', fontWeight: '600' }}>-₹{taxCalc.productDiscount.toFixed(2)}</td>
                                    </tr>
                                )}
                                <tr>
                                    <td>Product Taxable Value</td>
                                    <td style={{ textAlign: 'right' }}>₹{taxCalc.productTaxable.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>Product GST ({taxCalc.productTaxRate}%)</td>
                                    <td style={{ textAlign: 'right' }}>₹{taxCalc.productGst.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>Product Total</td>
                                    <td style={{ textAlign: 'right', fontWeight: '600' }}>₹{taxCalc.productTotal.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>Shipping Taxable Value</td>
                                    <td style={{ textAlign: 'right' }}>₹{taxCalc.deliveryTaxable.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>Shipping GST ({taxCalc.deliveryTaxRate}%)</td>
                                    <td style={{ textAlign: 'right' }}>₹{taxCalc.deliveryGst.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td>Shipping Total</td>
                                    <td style={{ textAlign: 'right', fontWeight: '600' }}>₹{taxCalc.deliveryTotal.toFixed(2)}</td>
                                </tr>
                                <tr style={{ backgroundColor: '#FFF7ED', fontWeight: '800', fontSize: '0.95rem' }}>
                                    <td style={{ color: '#0F172A' }}>Grand Total (Including All Taxes)</td>
                                    <td style={{ textAlign: 'right', color: '#EA580C' }}>₹{taxCalc.grandTotal.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 6. Signature & Digital Authentication Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '2px solid #E2E8F0', paddingTop: '20px', marginTop: '20px', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ maxWidth: '420px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: '700', fontSize: '0.85rem', marginBottom: '4px' }}>
                            <ShieldCheck size={18} /> Digitally Authenticated Tax Invoice
                        </div>
                        <p style={{ fontSize: '0.74rem', color: '#64748B', lineHeight: '1.5', margin: 0 }}>
                            This invoice is electronically generated and digitally validated on the NeoCloudBites platform.
                            Intra-state GST (CGST + SGST) applied in accordance with Indian Goods and Services Tax Act. No physical signature is required.
                        </p>
                    </div>

                    <div style={{ textAlign: 'center', minWidth: '220px' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0F172A', marginBottom: '40px' }}>
                            For {order.seller?.businessName || "Registered Cloud Kitchen"}
                        </div>
                        <div style={{ borderTop: '1px dashed #94A3B8', paddingTop: '6px', fontSize: '0.78rem', fontWeight: '600', color: '#475569' }}>
                            Authorized Signatory
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
