"use client";
import { fetchApi } from "@/lib/fetch-api";
import { useState, useEffect } from "react";
import Link from "next/link";
import QRCode from "react-qr-code";
import { ArrowLeft, User, Phone, CheckCircle, Package, Truck, Clock } from "lucide-react";

export default function SellerOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [deliveryPersons, setDeliveryPersons] = useState<any[]>([]);
    const [selectedOrderForQR, setSelectedOrderForQR] = useState<any | null>(null);
    const [businessName, setBusinessName] = useState("");
    const [upiId, setUpiId] = useState("");
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    const fetchOrders = async () => {
        try {
            const res = await fetchApi("/api/seller/orders");
            const data = await res.json();
            if (res.ok) setOrders(data.orders);
        } catch (error) {
            console.error("Failed to fetch orders");
        }
    };

    const fetchSellerData = async () => {
        try {
            const res = await fetchApi("/api/seller/profile");
            const data = await res.json();
            if (res.ok && data.user && data.user.sellerProfile) {
                setBusinessName(data.user.sellerProfile.businessName || "Kitchen");
                setUpiId(data.user.sellerProfile.upiId || "");
            }

            const dpRes = await fetchApi("/api/seller/delivery");
            const dpData = await dpRes.json();
            if (dpRes.ok) setDeliveryPersons(dpData.deliveryPersons || []);
        } catch (error) {
            console.error("Failed to fetch seller data");
        }
    }

    useEffect(() => {
        fetchOrders();
        fetchSellerData();
    }, []);

    const updateOrderStatus = async (orderId: string, status: string, isPaid?: boolean) => {
        setLoadingAction(orderId);
        try {
            const bodyPayload: any = { status };
            if (isPaid !== undefined) bodyPayload.isPaid = isPaid;

            const res = await fetchApi(`/api/seller/orders/${orderId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bodyPayload)
            });

            if (res.ok) {
                if (status === "DELIVERED") setSelectedOrderForQR(null);
                fetchOrders(); // Refresh table
            } else {
                alert("Failed to update status");
            }
        } catch (error) {
            console.error("Error updating order status");
        } finally {
            setLoadingAction(null);
        }
    };

    const assignDeliveryPerson = async (orderId: string, dpId: string) => {
        setLoadingAction(orderId);
        try {
            const res = await fetchApi(`/api/seller/orders/${orderId}/assign`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deliveryPersonId: dpId || null })
            });
            if (res.ok) fetchOrders();
            else alert("Failed to assign");
        } catch (error) {
            console.error("Assignment error", error);
        } finally {
            setLoadingAction(null);
        }
    };

    const parseItems = (itemsStr: string) => {
        try {
            const items = JSON.parse(itemsStr);
            if (!Array.isArray(items)) return [];
            return items;
        } catch {
            return [];
        }
    };

    const renderActionButtons = (order: any) => {
        if (order.status === "PENDING") {
            return (
                <button
                    onClick={() => updateOrderStatus(order.id, "PREPARING")}
                    className="btn btn-teal" style={{ width: 'auto', padding: '10px 20px', fontSize: '0.9rem', fontWeight: 'bold' }}
                    disabled={loadingAction === order.id}
                >
                    {loadingAction === order.id ? "Wait..." : "Accept & Prepare"}
                </button>
            );
        }

        if (order.status === "PREPARING" || order.status === "OUT_FOR_DELIVERY") {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <select
                                value={order.deliveryPersonId || ""}
                                onChange={(e) => assignDeliveryPerson(order.id, e.target.value)}
                                style={{
                                    padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0',
                                    fontSize: '0.85rem', backgroundColor: '#F8FAFC', minWidth: '180px'
                                }}
                                disabled={loadingAction === order.id}
                            >
                                <option value="">Assign Delivery Staff</option>
                                {deliveryPersons.filter(dp => dp.isActive).map(dp => (
                                    <option key={dp.id} value={dp.id}>{dp.name}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={() => updateOrderStatus(order.id, order.status === "PREPARING" ? "OUT_FOR_DELIVERY" : "DELIVERED", order.status === "OUT_FOR_DELIVERY")}
                            className="btn btn-teal" style={{ width: 'auto', padding: '10px 20px', fontSize: '0.9rem', fontWeight: 'bold' }}
                            disabled={loadingAction === order.id}
                        >
                            {loadingAction === order.id ? "Wait..." : (order.status === "PREPARING" ? "Start Delivery" : "Mark Delivered")}
                        </button>
                    </div>
                    {order.status === "OUT_FOR_DELIVERY" && (
                        <button
                            onClick={() => setSelectedOrderForQR(order)}
                            className="btn btn-coral" style={{ width: 'auto', padding: '10px 20px', fontSize: '0.9rem', opacity: order.isPaid ? 0.5 : 1, fontWeight: 'bold' }}
                            disabled={order.isPaid}
                        >
                            Show Payment QR
                        </button>
                    )}
                </div>
            );
        }
        return null;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <span style={{ backgroundColor: '#FCF3CF', color: '#B45309', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> PENDING</span>;
            case "PREPARING":
                return <span style={{ backgroundColor: '#DBEAFE', color: '#1E40AF', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}><Package size={14} /> PREPARING</span>;
            case "OUT_FOR_DELIVERY":
                return <span style={{ backgroundColor: '#F3E8FF', color: '#6B21A8', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}><Truck size={14} /> OUT FOR DELIVERY</span>;
            case "DELIVERED":
                return <span style={{ backgroundColor: '#DCFCE7', color: '#166534', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} /> DELIVERED</span>;
            default:
                return status;
        }
    };

    return (
        <div style={{ position: 'relative', maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1A1C23', letterSpacing: '-0.02em', marginBottom: '8px' }}>Active Orders</h1>
                    <Link href="/dashboard/seller" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F16F68', textDecoration: 'none', fontWeight: '600', fontSize: '0.95rem' }}>
                        <ArrowLeft size={18} /> Dashboard
                    </Link>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed #E2E8F0' }}>
                        <p style={{ color: '#94A3B8', fontSize: '1.1rem' }}>No orders at the moment. Good things come to those who wait!</p>
                    </div>
                ) : (
                    orders.map((order, index) => {
                        const mockOrderNumber = orders.length - index;
                        const itemsList = parseItems(order.items);
                        const fallbackCustomerName = order.user?.name || "Customer";

                        return (
                            <div key={order.id} style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', overflow: 'hidden', border: '1px solid #F1F5F9' }}>
                                <div style={{ padding: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '20px', marginBottom: '20px' }}>
                                        <div>
                                            <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ORDER ID</span>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1A1C23' }}>#{mockOrderNumber} <span style={{ fontSize: '0.9rem', color: '#94A3B8', fontWeight: '400' }}>({order.id.slice(0, 8)})</span></h3>
                                        </div>
                                        {getStatusBadge(order.status)}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
                                        <div>
                                            <h4 style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '12px' }}>Items Summary</h4>
                                            <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                                                {itemsList.length > 0 ? (
                                                    itemsList.map((item: any, i: number) => (
                                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: i === itemsList.length - 1 ? 0 : '8px' }}>
                                                            <span style={{ fontWeight: '500', color: '#334155' }}>{item.quantity}x {item.name}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span style={{ color: '#64748B' }}>1x Custom Order</span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1A1C23' }}>Total Amount</span>
                                                <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#F16F68' }}>₹{order.totalAmount}</span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                            <div>
                                                <h4 style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '12px' }}>Delivery Details</h4>
                                                <div style={{ marginBottom: '16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                                                        <User size={18} color="#94A3B8" />
                                                        <span style={{ fontWeight: '600', color: '#334155' }}>{fallbackCustomerName}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                                                        <Phone size={18} color="#94A3B8" />
                                                        <span style={{ color: '#475569' }}>{order.customerPhone || order.user?.phone || 'N/A'}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                                        <Truck size={18} color="#94A3B8" />
                                                        <span style={{ color: '#475569', fontSize: '0.9rem' }}>{order.deliveryAddress}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                                                <button
                                                    onClick={() => window.open(`/invoice/order/${order.id}`, '_blank')}
                                                    style={{
                                                        padding: '10px 18px',
                                                        fontSize: '0.85rem',
                                                        fontWeight: '700',
                                                        border: '1px solid #CBD5E1',
                                                        color: '#475569',
                                                        backgroundColor: 'white',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#F8FAFC';
                                                        e.currentTarget.style.borderColor = '#94A3B8';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'white';
                                                        e.currentTarget.style.borderColor = '#CBD5E1';
                                                    }}
                                                >
                                                    Print Invoice
                                                </button>
                                                {renderActionButtons(order)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Payment QR Modal */}
            {selectedOrderForQR && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '10px' }}>Receive Payment</h2>
                        <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '24px' }}>Scan the QR code to pay using any UPI app</p>

                        <div style={{ display: 'inline-block', padding: '20px', backgroundColor: '#F8FAFC', borderRadius: '20px', marginBottom: '24px' }}>
                            {upiId ? (
                                <QRCode value={`upi://pay?pa=${upiId}&pn=${encodeURIComponent(businessName)}&am=${selectedOrderForQR.totalAmount}&cu=INR`} size={200} />
                            ) : (
                                <div style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '0.85rem', padding: '20px', border: '2px dashed #CBD5E1', borderRadius: '16px' }}>
                                    UPI ID not found in profile. Please update profile.
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#1A1C23' }}>₹{selectedOrderForQR.totalAmount}</div>
                            <div style={{ fontSize: '0.9rem', color: '#64748B' }}>to: <span style={{ fontWeight: '700', color: '#F16F68' }}>{businessName}</span></div>
                        </div>

                        <button
                            onClick={() => setSelectedOrderForQR(null)}
                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: 'white', fontWeight: '700', color: '#475569', cursor: 'pointer' }}
                        >
                            Close QR Code
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
