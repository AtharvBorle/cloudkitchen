"use client";

import { useEffect, useState, use } from "react";
import { fetchApi } from "@/lib/fetch-api";
import Link from "next/link";
import { Printer, ArrowLeft, Loader2, Receipt, Phone, Mail, MapPin, CheckCircle, AlertCircle } from "lucide-react";

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
                    setOrder(resData.data || resData);
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
                <Loader2 className="animate-spin" size={40} color="var(--primary, #10B981)" />
                <span style={{ fontSize: '1rem', color: '#6B7280', fontWeight: '500' }}>Generating Invoice...</span>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F8F9FA', padding: '20px' }}>
                <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', textAlign: 'center', maxWidth: '400px' }}>
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

    const items = (() => {
        try {
            return JSON.parse(order.items);
        } catch {
            return [];
        }
    })();

    // Calculate subtotal before discounts
    const subtotal = items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
    const discountAmount = order.appliedCoupon 
        ? (order.appliedCoupon.discountPercentage 
            ? (subtotal * (order.appliedCoupon.discountPercentage / 100))
            : (order.appliedCoupon.discountAmount || 0))
        : 0;

    const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
        year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
    });

    const handlePrint = () => {
        window.print();
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F1F5F9', padding: '40px 20px' }} className="invoice-outer-bg">
            <style jsx global>{`
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
                }
            `}</style>

            {/* Back & Print Bar (Hidden on Print) */}
            <div className="no-print" style={{ maxWidth: '850px', margin: '0 auto 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button 
                    onClick={() => window.close()} 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#475569', backgroundColor: 'white', border: '1px solid #CBD5E1', padding: '10px 18px', borderRadius: '10px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}
                >
                    <ArrowLeft size={16} /> Close Window
                </button>
                <button 
                    onClick={handlePrint}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'white', backgroundColor: '#10B981', border: 'none', padding: '10px 22px', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)', transition: 'all 0.2s' }}
                >
                    <Printer size={16} /> Print / Save as PDF
                </button>
            </div>

            {/* Invoice Container */}
            <div className="invoice-container" style={{ maxWidth: '850px', margin: '0 auto', backgroundColor: 'white', padding: '50px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0' }}>
                
                {/* Header Banner */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #F1F5F9', paddingBottom: '30px', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10B981', marginBottom: '8px' }}>
                            <Receipt size={32} />
                            <span style={{ fontSize: '1.6rem', fontWeight: '900', letterSpacing: '-0.03em', color: '#1E293B' }}>CLOUD ROOMS & KITCHEN</span>
                        </div>
                        <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: 0 }}>Premium Food Delivery & Cozy Stays Booking Platform</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '2rem', fontWeight: '900', color: '#94A3B8', letterSpacing: '0.05em', lineHeight: 1, marginBottom: '8px' }}>INVOICE</div>
                        <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '600' }}>Order ID: <span style={{ color: '#1E293B', fontFamily: 'monospace' }}>#{order.id.slice(0, 8)}</span></div>
                        <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '4px' }}>Date: {formattedDate}</div>
                    </div>
                </div>

                {/* Status Stamp Row */}
                <div style={{ display: 'flex', gap: '15px', marginBottom: '35px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '150px', backgroundColor: '#F8FAFC', padding: '15px', borderRadius: '10px', borderLeft: '4px solid #94A3B8' }}>
                        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>Payment Status</span>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: '800', color: order.isPaid ? '#10B981' : '#F59E0B' }}>
                            <CheckCircle size={16} /> {order.isPaid ? "PAID / SUCCESS" : "COD / UNPAID"}
                        </div>
                    </div>
                    <div style={{ flex: 1, minWidth: '150px', backgroundColor: '#F8FAFC', padding: '15px', borderRadius: '10px', borderLeft: '4px solid #10B981' }}>
                        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>Payment Method</span>
                        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1E293B' }}>
                            {order.paymentMethod === "ONLINE" ? "ONLINE PAYMENTS (Razorpay)" : "CASH ON DELIVERY (COD)"}
                        </div>
                    </div>
                    <div style={{ flex: 1, minWidth: '150px', backgroundColor: '#F8FAFC', padding: '15px', borderRadius: '10px', borderLeft: '4px solid #F16F68' }}>
                        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>Order Status</span>
                        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#F16F68' }}>
                            {order.status}
                        </div>
                    </div>
                </div>

                {/* Billing Addresses Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px', marginBottom: '40px' }}>
                    
                    {/* Billed By (Seller) */}
                    <div>
                        <h3 style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', marginBottom: '12px' }}>
                            Billed By / Seller
                        </h3>
                        <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1E293B', marginBottom: '6px' }}>
                            {order.seller.businessName || "Registered Cloud Kitchen"}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: '#475569' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Phone size={14} color="#94A3B8" /> {order.seller.user.phone}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Mail size={14} color="#94A3B8" /> {order.seller.user.email}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                <MapPin size={14} color="#94A3B8" style={{ marginTop: '2px', flexShrink: 0 }} /> 
                                <span>
                                    {order.seller.addressFlat && `${order.seller.addressFlat}, `}
                                    {order.seller.addressLocality}
                                    {order.seller.addressLandmark && `, Near ${order.seller.addressLandmark}`}
                                    <br />
                                    {order.seller.user.city} - {order.seller.user.pincode}
                                </span>
                            </span>
                        </div>
                    </div>

                    {/* Shipped To (Customer) */}
                    <div>
                        <h3 style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', marginBottom: '12px' }}>
                            Billed To / Customer
                        </h3>
                        <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1E293B', marginBottom: '6px' }}>
                            {order.user.name}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: '#475569' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Phone size={14} color="#94A3B8" /> {order.customerPhone || order.user.phone || "N/A"}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Mail size={14} color="#94A3B8" /> {order.user.email}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                <MapPin size={14} color="#94A3B8" style={{ marginTop: '2px', flexShrink: 0 }} /> 
                                <span>{order.deliveryAddress}</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #E2E8F0', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '800', color: '#64748B', textAlign: 'left' }}>
                            <th style={{ padding: '12px 8px', width: '40px' }}>#</th>
                            <th style={{ padding: '12px 8px' }}>Description / Item Name</th>
                            <th style={{ padding: '12px 8px', textAlign: 'center', width: '80px' }}>Qty</th>
                            <th style={{ padding: '12px 8px', textAlign: 'right', width: '120px' }}>Rate</th>
                            <th style={{ padding: '12px 8px', textAlign: 'right', width: '120px' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item: any, index: number) => (
                            <tr key={index} style={{ borderBottom: '1px solid #F1F5F9', fontSize: '0.9rem', color: '#334155' }}>
                                <td style={{ padding: '14px 8px', color: '#94A3B8' }}>{index + 1}</td>
                                <td style={{ padding: '14px 8px', fontWeight: '600', color: '#1E293B' }}>{item.name}</td>
                                <td style={{ padding: '14px 8px', textAlign: 'center' }}>{item.quantity}</td>
                                <td style={{ padding: '14px 8px', textAlign: 'right' }}>₹{(item.price || 0).toFixed(2)}</td>
                                <td style={{ padding: '14px 8px', textAlign: 'right', fontWeight: '600' }}>₹{(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Calculation Summary */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '50px' }}>
                    <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#475569' }}>
                            <span>Subtotal:</span>
                            <span style={{ fontWeight: '600' }}>₹{subtotal.toFixed(2)}</span>
                        </div>
                        {order.appliedCoupon && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#10B981' }}>
                                <span>Discount ({order.appliedCoupon.code}):</span>
                                <span style={{ fontWeight: '600' }}>-₹{discountAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#475569' }}>
                            <span>Delivery Fee & Taxes:</span>
                            <span style={{ fontWeight: '600' }}>₹0.00</span>
                        </div>
                        <div style={{ borderTop: '2px solid #E2E8F0', paddingTop: '12px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '800', color: '#1E293B' }}>
                            <span>Total Paid:</span>
                            <span style={{ color: 'var(--coral, #F16F68)' }}>₹{order.totalAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer Notes */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '20px', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: '0 0 5px' }}>Thank you for ordering with Cloud Rooms & Kitchen!</p>
                    <p style={{ fontSize: '0.75rem', color: '#CBD5E1', margin: 0 }}>This is an electronically generated invoice and does not require a physical signature.</p>
                </div>
            </div>
        </div>
    );
}
