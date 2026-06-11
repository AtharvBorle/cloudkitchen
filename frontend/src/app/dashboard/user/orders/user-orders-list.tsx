"use client";
import { fetchApi } from "@/lib/fetch-api";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, CheckCircle, Package, Truck, XCircle, User, Phone } from "lucide-react";

export default function UserOrdersList({ initialOrders }: { initialOrders: any[] }) {
    const [orders, setOrders] = useState(initialOrders);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "PENDING": return <Clock size={20} color="#F59E0B" />;
            case "PREPARING": return <Package size={20} color="#3B82F6" />;
            case "OUT_FOR_DELIVERY": return <Truck size={20} color="#8B5CF6" />;
            case "DELIVERED": return <CheckCircle size={20} color="#10B981" />;
            case "CANCELLED": return <XCircle size={20} color="#EF4444" />;
            default: return <Clock size={20} color="#6B7280" />;
        }
    };

    const handleCancelOrder = async (orderId: string) => {
        if (!confirm("Are you sure you want to cancel this order?")) return;

        setCancellingId(orderId);
        try {
            const res = await fetchApi(`/api/user/orders/${orderId}`, {
                method: "PATCH"
            });

            const data = await res.json();

            if (res.ok) {
                setOrders(currentOrders =>
                    currentOrders.map(order =>
                        order.id === orderId ? { ...order, status: "CANCELLED" } : order
                    )
                );
            } else {
                alert(data.message || "Failed to cancel order");
            }
        } catch (error) {
            alert("An error occurred while canceling the order.");
        } finally {
            setCancellingId(null);
        }
    };

    if (orders.length === 0) {
        return (
            <div style={{ padding: "40px", textAlign: "center", backgroundColor: "white", borderRadius: "12px", boxShadow: "var(--shadow-card)" }}>
                <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>You haven't placed any orders yet.</p>
                <Link href="/dashboard/user/food" className="btn btn-primary">Browse Food</Link>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {orders.map((order: any) => {
                let items = [];
                try {
                    items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                } catch (e) {
                    items = [];
                }

                return (
                    <div key={order.id} style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", boxShadow: "var(--shadow-card)", borderLeft: order.status === 'CANCELLED' ? '4px solid #EF4444' : 'none', opacity: order.status === 'CANCELLED' ? 0.7 : 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", borderBottom: "1px solid #EEE", paddingBottom: "10px", flexWrap: "wrap", gap: "10px" }}>
                            <div>
                                <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{order.seller.businessName || "Cloud Kitchen"}</div>
                                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                    {mounted ? new Date(order.createdAt).toLocaleString() : new Date(order.createdAt).toISOString().split('T')[0]}
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", fontSize: "0.95rem" }}>
                                {getStatusIcon(order.status)}
                                <span style={{ color: order.status === 'CANCELLED' ? '#EF4444' : 'inherit' }}>{order.status.replace(/_/g, " ")}</span>
                            </div>
                        </div>

                        <div style={{ marginBottom: "15px" }}>
                            {Array.isArray(items) && items.map((item: any, idx: number) => (
                                <div key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                                    <span>{item.quantity} x {item.name}</span>
                                    <span>₹{item.price * item.quantity}</span>
                                </div>
                            ))}
                        </div>

                        {order.deliveryPerson && (
                            <div style={{
                                backgroundColor: '#F8FAFC', padding: '15px', borderRadius: '10px',
                                marginBottom: '15px', border: '1px solid #E2E8F0',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: '800', marginBottom: '4px', letterSpacing: '0.05em' }}>
                                        Delivery Partner
                                    </div>
                                    <div style={{ fontWeight: '700', color: '#1A1C23', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ backgroundColor: '#E2E8F0', padding: '4px', borderRadius: '50%' }}>
                                            <User size={14} />
                                        </div>
                                        {order.deliveryPerson.name}
                                    </div>
                                </div>
                                {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                                    <a
                                        href={`tel:${order.deliveryPerson.phone}`}
                                        style={{
                                            backgroundColor: '#10B981', color: 'white', padding: '10px 18px',
                                            borderRadius: '8px', textDecoration: 'none', fontSize: '0.9rem',
                                            fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px',
                                            boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
                                        }}
                                    >
                                        <Phone size={16} /> Call
                                    </a>
                                )}
                            </div>
                        )}

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "bold", paddingTop: "10px", borderTop: "1px solid #EEE", flexWrap: "wrap", gap: "10px" }}>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <span>Total Amount ({order.paymentMethod})</span>
                                {order.status === 'PENDING' && (
                                    <button
                                        onClick={() => handleCancelOrder(order.id)}
                                        disabled={cancellingId === order.id}
                                        style={{ color: '#EF4444', fontSize: '0.85rem', textDecoration: 'underline', cursor: 'pointer', textAlign: 'left', marginTop: '5px', opacity: cancellingId === order.id ? 0.5 : 1, border: 'none', background: 'none' }}
                                    >
                                        {cancellingId === order.id ? "Cancelling..." : "Cancel Order"}
                                    </button>
                                )}
                            </div>
                            <span style={{ color: order.status === 'CANCELLED' ? 'var(--text-muted)' : 'var(--primary)', textDecoration: order.status === 'CANCELLED' ? 'line-through' : 'none' }}>₹{order.totalAmount}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
