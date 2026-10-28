"use client";

import { useEffect, useState, use } from "react";
import { fetchApi } from "@/lib/fetch-api";
import { Printer, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { getOrderBreakdown, TaxCalculationResult } from "@/lib/tax-calculator";
import Link from "next/link";

export default function SellerOrderInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState<any | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) return;
        const fetchOrder = async () => {
            try {
                let res = await fetchApi(`/api/seller/orders/${id}`);
                if (!res.ok) {
                    res = await fetchApi(`/api/user/orders/${id}`);
                }
                const resData = await res.json();
                if (res.ok) {
                    const fetchedOrder = resData.data || resData;
                    const st = (fetchedOrder?.status || "").toUpperCase();
                    const isDeliveredOrCompleted = st === "DELIVERED" || st === "COMPLETED";
                    if (st === "CANCELLED" || st === "REJECTED") {
                        setError("Invoices cannot be generated for cancelled or rejected orders.");
                    } else if (!isDeliveredOrCompleted) {
                        setError("Invoices are only generated and accessible after the order has been successfully delivered or completed.");
                    } else {
                        setOrder(fetchedOrder);
                    }
                } else {
                    setError(resData.message || "Failed to retrieve seller tax invoice.");
                }
            } catch (err) {
                console.error("Error fetching seller invoice:", err);
                setError("An error occurred while loading the tax invoice.");
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F8FAFC', gap: '15px' }}>
                <Loader2 className="animate-spin" size={40} color="#0F172A" />
                <span style={{ fontSize: '1rem', color: '#64748B', fontWeight: '500' }}>Loading Seller Tax Invoice...</span>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F8FAFC', padding: '20px' }}>
                <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', textAlign: 'center', maxWidth: '440px', width: '100%' }}>
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

    // Authoritative Single Engine Calculation matching checkout/cart
    const taxCalc: TaxCalculationResult = getOrderBreakdown(order);

    // Dates and IDs
    const orderDateObj = new Date(order.createdAt || Date.now());
    const formattedDateOnly = orderDateObj.toLocaleDateString("en-IN", {
        day: "2-digit", month: "2-digit", year: "numeric"
    });
    const formattedDateTime = orderDateObj.toLocaleDateString("en-IN", {
        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true
    });

    const invoiceNo = `INV${orderDateObj.getFullYear()}${String(orderDateObj.getMonth() + 1).padStart(2, "0")}${(order.id || "").slice(0, 8).toUpperCase()}`;
    const orderNo = `ORD-${(order.id || "").slice(0, 8).toUpperCase()}`;
    const qrVerificationUrl = typeof window !== "undefined" ? window.location.href : `https://neocloudbites.com/seller/invoice/order/${order.id}`;
    const totalQuantity = taxCalc.items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);

    // Dynamic Business details (No static data)
    const sellerName = order.seller?.businessName || order.seller?.kitchenName || "NeoCloudBites Kitchen";
    const sellerStreet = [order.seller?.addressFlat, order.seller?.addressLocality].filter(Boolean).join(", ");
    const sellerCity = order.seller?.user?.city || order.seller?.city || "";
    const sellerPincode = order.seller?.user?.pincode || order.seller?.pincode || "";
    const sellerGst = order.seller?.gstNumber || "Not Applicable";

    // Dynamic Customer details (No static data)
    const customerName = order.user?.name || order.customerName || "Customer";
    const customerAddress = order.deliveryAddress?.split(" | Loc:")[0] || order.deliveryAddress || "Standard Delivery Location";
    const customerPhone = order.customerPhone || order.user?.phone || "";

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="seller-invoice-page-bg">
            <style jsx global>{`
                .seller-invoice-page-bg {
                    min-height: 100vh;
                    background-color: #F1F5F9;
                    padding: 24px 16px;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    color: #000000;
                }
                .seller-invoice-card {
                    max-width: 950px;
                    margin: 0 auto;
                    background-color: #FFFFFF;
                    padding: 36px 40px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
                    border: 1px solid #000000;
                }
                .table-responsive {
                    width: 100%;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                    margin-bottom: 18px;
                }
                .ref-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.84rem;
                    min-width: 720px;
                }
                .ref-table th, .ref-table td {
                    padding: 8px 10px;
                }
                .address-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 18px;
                }
                @media (max-width: 768px) {
                    .seller-invoice-page-bg {
                        padding: 12px 8px;
                    }
                    .seller-invoice-card {
                        padding: 20px 16px;
                    }
                    .address-grid {
                        grid-template-columns: 1fr !important;
                        gap: 16px !important;
                    }
                    .header-flex {
                        flex-direction: column !important;
                        gap: 16px !important;
                    }
                    .header-flex-right {
                        text-align: left !important;
                        flex-direction: row-reverse !important;
                        justify-content: space-between !important;
                    }
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
                    .seller-invoice-page-bg {
                        background-color: #FFFFFF !important;
                        padding: 0 !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .seller-invoice-card {
                        box-shadow: none !important;
                        border: 1px solid #000000 !important;
                        max-width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .table-responsive {
                        overflow-x: visible !important;
                    }
                    .ref-table {
                        min-width: 100% !important;
                    }
                }
            `}</style>

            {/* Top Interactive Bar (Hidden on Print) */}
            <div className="no-print" style={{ maxWidth: '950px', margin: '0 auto 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <Link
                    href="/seller/orders"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#475569', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', padding: '8px 14px', borderRadius: '8px', fontWeight: '600', fontSize: '0.85rem', textDecoration: 'none' }}
                >
                    <ArrowLeft size={15} /> Back to Orders
                </Link>

                <button 
                    onClick={handlePrint}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#FFFFFF', backgroundColor: '#0F172A', border: 'none', padding: '9px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                >
                    <Printer size={16} /> Print / Save as PDF
                </button>
            </div>

            {/* SELLER TAX INVOICE CARD */}
            <div className="seller-invoice-card">
                {/* Cut Line */}
                <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#475569', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    ✂ TEAR HERE (SELLER / KITCHEN TAX RECORD)
                </div>
                <div style={{ borderTop: '1px dashed #64748B', marginBottom: '14px' }} />

                {/* Header: Tax Invoice + Order Id/Date (Left) | Invoice No/Date/GSTIN + QR Code (Right) */}
                <div className="header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                        <div style={{ fontSize: '2.4rem', fontWeight: '900', color: '#000000', lineHeight: 1.1, marginBottom: '10px' }}>
                            Tax Invoice
                        </div>
                        <div style={{ fontSize: '0.88rem', color: '#000000', lineHeight: '1.5' }}>
                            <div><strong>Order Id:</strong> {orderNo}</div>
                            <div><strong>Order Date:</strong> {formattedDateTime}</div>
                        </div>
                    </div>

                    <div className="header-flex-right" style={{ display: 'flex', alignItems: 'center', gap: '16px', textAlign: 'right' }}>
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
                <div className="address-grid">
                    {/* Sold By */}
                    <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: '900', color: '#000000', borderBottom: '2px solid #000000', paddingBottom: '3px', marginBottom: '6px', letterSpacing: '0.03em' }}>
                            SOLD BY
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#000000', lineHeight: '1.4' }}>
                            <div style={{ fontWeight: '700' }}>{sellerName}</div>
                            {sellerStreet && <div>{sellerStreet}</div>}
                            {(sellerCity || sellerPincode) && (
                                <div>{[sellerCity, sellerPincode].filter(Boolean).join(" - ")}</div>
                            )}
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
                            {customerPhone && <div>PH: {customerPhone}</div>}
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
                            {customerPhone && <div>PH: {customerPhone}</div>}
                        </div>
                    </div>
                </div>

                {/* Solid Black Bordered Table Matching Reference 2 */}
                <div className="table-responsive">
                    <table className="ref-table" style={{ border: '2px solid #000000' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #000000', backgroundColor: '#FFFFFF' }}>
                                <th style={{ textAlign: 'left', minWidth: '190px', borderRight: '1px solid #000000', color: '#000000', fontWeight: '800' }}>Product</th>
                                <th style={{ textAlign: 'center', width: '70px', borderRight: '1px solid #000000', color: '#000000', fontWeight: '800' }}>SAC</th>
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
                                            {it.selectedAddons && it.selectedAddons.length > 0 && (
                                                <div>Add-ons: {it.selectedAddons.map((a: any) => `${a.name} (x${a.quantity || 1})`).join(', ')}</div>
                                            )}
                                            {it.sku && <div>SKU: {it.sku}</div>}
                                            <div>Price: ₹{it.unitPrice.toFixed(2)}</div>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center', borderRight: '1px solid #000000' }}>{it.hsn || '996331'}</td>
                                    <td style={{ textAlign: 'center', fontWeight: '700', borderRight: '1px solid #000000' }}>{it.quantity}</td>
                                    <td style={{ textAlign: 'right', borderRight: '1px solid #000000' }}>₹{it.grossAmount.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right', borderRight: '1px solid #000000', fontSize: '0.78rem' }}>
                                        {it.discountAmount > 0 ? `₹${it.discountAmount.toFixed(2)}` : '-'}
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
                                    Shipping and charges : ₹{taxCalc.deliveryTaxable.toFixed(2)} | shipping gst {taxCalc.deliveryTaxRate}% : ₹{taxCalc.deliveryGst.toFixed(2)}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: '800' }}>
                                    ₹{taxCalc.deliveryTotal.toFixed(2)}
                                </td>
                            </tr>

                            {/* Coupon Discount row if applied */}
                            {taxCalc.productDiscount > 0 && (
                                <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#F8FAFC' }}>
                                    <td colSpan={8} style={{ textAlign: 'right', fontWeight: '600', color: '#166534', paddingRight: '16px', borderRight: '1px solid #000000' }}>
                                        Coupon Discount {order.appliedCoupon?.code ? `(${order.appliedCoupon.code})` : ""} :
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: '800', color: '#166534' }}>
                                        -₹{taxCalc.productDiscount.toFixed(2)}
                                    </td>
                                </tr>
                            )}

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
                </div>

                {/* Footer: Registered Office (Left) | Ordered Through & Authorized Signatory (Right) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '10px', fontSize: '0.78rem', color: '#000000', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ maxWidth: '450px', lineHeight: '1.4' }}>
                        <strong>Registered Office:</strong> {[sellerName, sellerStreet, sellerCity, sellerPincode].filter(Boolean).join(", ")}.
                    </div>
                    <div style={{ textAlign: 'right', lineHeight: '1.5' }}>
                        <div>Ordered Through <strong>NEOCLOUDBITES</strong></div>
                        <div style={{ marginTop: '30px', fontStyle: 'italic', color: '#334155' }}>
                            Authorized Signatory
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
