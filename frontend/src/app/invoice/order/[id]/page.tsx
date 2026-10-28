"use client";

import { useEffect, useState, use } from "react";
import { fetchApi } from "@/lib/fetch-api";
import { Printer, ArrowLeft, Loader2, Utensils, AlertCircle } from "lucide-react";
import { getOrderBreakdown, TaxCalculationResult } from "@/lib/tax-calculator";

export default function CustomerOrderInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState<any | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) return;
        const fetchOrder = async () => {
            try {
                // Fetch order details
                let res = await fetchApi(`/api/user/orders/${id}`);
                if (!res.ok) {
                    res = await fetchApi(`/api/seller/orders/${id}`);
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
                    setError(resData.message || "Failed to retrieve invoice details.");
                }
            } catch (err) {
                console.error("Error fetching customer invoice:", err);
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
                <Loader2 className="animate-spin" size={40} color="#15803D" />
                <span style={{ fontSize: '1rem', color: '#64748B', fontWeight: '500' }}>Loading Customer Invoice...</span>
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

    const invoiceNo = `INV${orderDateObj.getFullYear()}${String(orderDateObj.getMonth() + 1).padStart(2, "0")}${(order.id || "").slice(0, 8).toUpperCase()}`;
    const orderNo = `ORD-${(order.id || "").slice(0, 8).toUpperCase()}`;
    const totalQuantity = taxCalc.items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);

    // Dynamic Business details (No static data)
    const sellerName = order.seller?.businessName || order.seller?.kitchenName || "NeoCloudBites Kitchen";
    const sellerStreet = [order.seller?.addressFlat, order.seller?.addressLocality].filter(Boolean).join(", ");
    const sellerCity = order.seller?.user?.city || order.seller?.city || "";
    const sellerPincode = order.seller?.user?.pincode || order.seller?.pincode || "";
    const sellerEmail = order.seller?.user?.email || order.seller?.email || "";
    const sellerPhone = order.seller?.user?.phone || order.seller?.phone || "";
    const sellerGst = order.seller?.gstNumber || "";

    // Dynamic Customer details (No static data)
    const customerName = order.user?.name || order.customerName || "Customer";
    const customerAddress = order.deliveryAddress?.split(" | Loc:")[0] || order.deliveryAddress || "Standard Delivery Location";
    const customerEmail = order.user?.email || "";
    const customerPhone = order.customerPhone || order.user?.phone || "";
    const addressType = order.addressType || "Delivery Address";

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
                    max-width: 920px;
                    margin: 0 auto;
                    background-color: #FFFFFF;
                    padding: 32px 36px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
                    border: 1px solid #CBD5E1;
                    border-radius: 4px;
                }
                .table-responsive {
                    width: 100%;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                    margin-bottom: 16px;
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
                @media (max-width: 640px) {
                    .invoice-page-bg {
                        padding: 12px 8px;
                    }
                    .invoice-card {
                        padding: 20px 16px;
                    }
                    .header-grid {
                        flex-direction: column !important;
                        gap: 16px !important;
                    }
                    .header-right {
                        text-align: left !important;
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
                    .table-responsive {
                        overflow-x: visible !important;
                    }
                    .ref-table {
                        min-width: 100% !important;
                    }
                }
            `}</style>

            {/* Top Interactive Bar (Hidden on Print) */}
            <div className="no-print" style={{ maxWidth: '920px', margin: '0 auto 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button 
                    onClick={() => {
                        if (window.opener) {
                            window.close();
                        } else {
                            window.history.back();
                        }
                    }} 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#475569', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', padding: '8px 14px', borderRadius: '8px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                    <ArrowLeft size={15} /> Back
                </button>

                <button 
                    onClick={handlePrint}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#FFFFFF', backgroundColor: '#15803D', border: 'none', padding: '9px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(21, 128, 61, 0.25)' }}
                >
                    <Printer size={16} /> Print / Save as PDF
                </button>
            </div>

            {/* CUSTOMER INVOICE CARD */}
            <div className="invoice-card">
                {/* Top Header: Logo & Seller Info (Left) | INVOICE & Order Details (Right) */}
                <div className="header-grid" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#15803D', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Utensils size={18} />
                            </div>
                            <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#15803D' }}>
                                NeoCloudBites
                            </span>
                        </div>
                        <div style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0F172A', marginBottom: '2px' }}>
                            {sellerName}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#334155', lineHeight: '1.45' }}>
                            {sellerStreet && <div>{sellerStreet}</div>}
                            {(sellerCity || sellerPincode) && (
                                <div>{[sellerCity, sellerPincode].filter(Boolean).join(" - ")}</div>
                            )}
                            {sellerEmail && <div>E-Mail Address: {sellerEmail}</div>}
                            {sellerPhone && <div>Phone Number: {sellerPhone}</div>}
                            {sellerGst ? (
                                <div>GST Number: <strong>{sellerGst}</strong></div>
                            ) : null}
                        </div>
                    </div>

                    <div className="header-right" style={{ textAlign: 'right' }}>
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
                        {customerEmail && <div>E-Mail Address: {customerEmail}</div>}
                        {customerPhone && <div>Phone Number: {customerPhone}</div>}
                        <div>Address Type: {addressType}</div>
                    </div>
                </div>

                {/* Product Table */}
                <div className="table-responsive">
                    <table className="ref-table" style={{ border: '1px solid #CBD5E1' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid #CBD5E1' }}>
                                <th style={{ width: '32px', textAlign: 'center', borderRight: '1px solid #CBD5E1' }}>#</th>
                                <th style={{ textAlign: 'left', minWidth: '170px', borderRight: '1px solid #CBD5E1' }}>Product</th>
                                <th style={{ textAlign: 'center', width: '70px', borderRight: '1px solid #CBD5E1' }}>Unit</th>
                                <th style={{ textAlign: 'right', width: '75px', borderRight: '1px solid #CBD5E1' }}>Price</th>
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
                                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>SAC: {it.hsn || '996331'}</div>
                                        {it.sku && (
                                            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>SKU: {it.sku}</div>
                                        )}
                                        {it.selectedAddons && it.selectedAddons.length > 0 && (
                                            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                                                Add-ons: {it.selectedAddons.map((a: any) => `${a.name} (x${a.quantity || 1})`).join(', ')}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>1 × {it.quantity}</td>
                                    <td style={{ textAlign: 'right', borderRight: '1px solid #E2E8F0' }}>₹{it.unitPrice.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right', borderRight: '1px solid #E2E8F0' }}>₹{it.grossAmount.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right', borderRight: '1px solid #E2E8F0', fontSize: '0.76rem' }}>
                                        {it.discountAmount > 0 ? (
                                            <div>₹{it.discountAmount.toFixed(2)}</div>
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
                                    Shipping and charges : ₹{taxCalc.deliveryTaxable.toFixed(2)} | shipping gst {taxCalc.deliveryTaxRate}% : ₹{taxCalc.deliveryGst.toFixed(2)}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: '700' }}>
                                    ₹{taxCalc.deliveryTotal.toFixed(2)}
                                </td>
                            </tr>

                            {/* Coupon Discount row if applied */}
                            {taxCalc.productDiscount > 0 && (
                                <tr style={{ borderBottom: '1px solid #CBD5E1', backgroundColor: '#F0FDF4' }}>
                                    <td colSpan={9} style={{ textAlign: 'right', fontWeight: '600', color: '#166534', paddingRight: '16px', borderRight: '1px solid #E2E8F0' }}>
                                        Coupon Discount {order.appliedCoupon?.code ? `(${order.appliedCoupon.code})` : ""} :
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
                </div>

                {/* Signature Box */}
                <div style={{ border: '1px solid #CBD5E1', borderRadius: '4px', padding: '36px 20px 14px', textAlign: 'right', marginTop: '24px' }}>
                    <span style={{ fontStyle: 'italic', fontSize: '0.88rem', color: '#334155' }}>
                        Authorized Signature
                    </span>
                </div>
            </div>
        </div>
    );
}
