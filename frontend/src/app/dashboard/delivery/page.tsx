"use client";
import { fetchApi } from "@/lib/fetch-api";
import { useState, useEffect, useRef } from "react";
import { Package, MapPin, Phone, CheckCircle, Clock, Check, X, ShieldCheck, Wallet, Download } from "lucide-react";
import Script from "next/script";

// Swipe Action Component
const SwipeAction = ({ onSwipeSuccess, text = "Swipe to Deliver" }: { onSwipeSuccess: () => void, text?: string }) => {
    const [isSwiped, setIsSwiped] = useState(false);
    const [dragX, setDragX] = useState(0);
    const trackRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);
    const hasTriggeredRef = useRef(false);

    const handleDrag = (clientX: number) => {
        if (isSwiped || hasTriggeredRef.current || !trackRef.current || !thumbRef.current) return;

        const trackRect = trackRef.current.getBoundingClientRect();
        const thumbRect = thumbRef.current.getBoundingClientRect();
        const maxDrag = trackRect.width - thumbRect.width - 8; // 8px padding

        // Calculate new drag position relative to the track
        let newX = clientX - trackRect.left - (thumbRect.width / 2);

        if (newX < 0) newX = 0;
        if (newX > maxDrag) {
            newX = maxDrag;
            hasTriggeredRef.current = true;
            setIsSwiped(true);
            onSwipeSuccess();
        }

        setDragX(newX);
    };

    return (
        <div
            ref={trackRef}
            style={{
                position: 'relative',
                height: '56px',
                backgroundColor: isSwiped ? '#48BB78' : '#EDF2F7',
                borderRadius: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.3s',
                overflow: 'hidden'
            }}
        >
            <span style={{ color: isSwiped ? 'white' : '#A0AEC0', fontWeight: 'bold', zIndex: 1, pointerEvents: 'none', transition: 'opacity 0.2s', opacity: dragX > 50 ? 0 : 1 }}>
                {text}
            </span>
            {isSwiped && (
                <span style={{ color: 'white', fontWeight: 'bold', zIndex: 1, pointerEvents: 'none', position: 'absolute' }}>
                    Delivered!
                </span>
            )}

            <div
                ref={thumbRef}
                onMouseDown={(e) => {
                    e.preventDefault();
                    const onMouseMove = (moveEvent: MouseEvent) => handleDrag(moveEvent.clientX);
                    const onMouseUp = () => {
                        window.removeEventListener('mousemove', onMouseMove);
                        window.removeEventListener('mouseup', onMouseUp);
                        // Optional: Reset if not fully swiped
                        if (!hasTriggeredRef.current) {
                            setDragX(0);
                        }
                    };
                    window.addEventListener('mousemove', onMouseMove);
                    window.addEventListener('mouseup', onMouseUp);
                }}
                onTouchStart={(e) => {
                    const onTouchMove = (moveEvent: TouchEvent) => handleDrag(moveEvent.touches[0].clientX);
                    const onTouchEnd = () => {
                        window.removeEventListener('touchmove', onTouchMove);
                        window.removeEventListener('touchend', onTouchEnd);
                        if (!hasTriggeredRef.current) {
                            setDragX(0);
                        }
                    };
                    window.addEventListener('touchmove', onTouchMove, { passive: false });
                    window.addEventListener('touchend', onTouchEnd);
                }}
                style={{
                    position: 'absolute',
                    left: '4px',
                    top: '4px',
                    height: '48px',
                    width: '48px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: `translateX(${dragX}px)`,
                    transition: isSwiped ? 'none' : dragX === 0 ? 'transform 0.3s ease-out' : 'none',
                    zIndex: 2,
                    cursor: 'grab'
                }}
            >
                {isSwiped ? <Check color="#48BB78" size={24} /> : <ShieldCheck color="#A0AEC0" size={24} />}
            </div>
        </div>
    );
};

export default function DeliveryDashboard() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY' | 'WALLET'>('ACTIVE');
    const [collectCashModalOrder, setCollectCashModalOrder] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loadingTx, setLoadingTx] = useState(false);

    const fetchOrders = async () => {
        try {
            const res = await fetchApi("/api/delivery/orders");
            const data = await res.json();
            if (res.ok) setOrders(data.orders || []);
        } catch (error) {
            console.error("Failed to fetch orders");
        } finally {
            setLoading(false);
        }
    };

    const fetchProfile = async () => {
        try {
            const res = await fetchApi("/api/delivery/profile");
            const data = await res.json();
            if (res.ok) setProfile(data.profile);
        } catch (error) {
            console.error("Failed to fetch profile");
        }
    };

    const fetchTransactions = async () => {
        setLoadingTx(true);
        try {
            const res = await fetchApi("/api/delivery/transactions");
            const data = await res.json();
            if (res.ok) setTransactions(data.transactions || []);
        } catch (error) {
            console.error("Failed to fetch transactions");
        } finally {
            setLoadingTx(false);
        }
    };

    const downloadCSV = () => {
        if (!transactions || transactions.length === 0) return;
        
        // CSV headers
        const headers = ["Date", "Time", "Transaction ID", "Type", "Amount (INR)", "Description", "Order ID", "Status"];
        
        // Map transactions to rows
        const rows = transactions.map((tx: any) => {
            const date = new Date(tx.createdAt).toLocaleDateString();
            const time = new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            let typeLabel = tx.type;
            if (tx.type === 'COD_COLLECTION') typeLabel = 'Credited (COD Collect)';
            else if (tx.type === 'SETTLEMENT') typeLabel = 'Debited (Settlement)';
            else if (tx.type === 'ADJUSTMENT') typeLabel = 'Adjustment';

            return [
                date,
                time,
                tx.id,
                typeLabel,
                tx.amount,
                tx.description || "",
                tx.orderId || "",
                tx.status
            ];
        });
        
        // Construct CSV content
        const csvContent = [
            headers.join(","),
            ...rows.map((row: any[]) => 
                row.map(value => {
                    const stringVal = String(value).replace(/"/g, '""');
                    return stringVal.includes(",") || stringVal.includes("\n") || stringVal.includes('"') 
                        ? `"${stringVal}"` 
                        : stringVal;
                }).join(",")
            )
        ].join("\n");
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `My_Transactions_${profile?.name?.replace(/\s+/g, '_') || 'delivery'}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        fetchOrders();
        fetchProfile();
    }, []);

    useEffect(() => {
        if (activeTab === 'WALLET') {
            fetchTransactions();
        }
    }, [activeTab]);

    const updateStatus = async (orderId: string, newStatus: string) => {
        try {
            const res = await fetchApi(`/api/delivery/orders/${orderId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                fetchOrders();
                fetchProfile();
            }
            else alert("Failed to update status");
        } catch (error) {
            console.error("Update error", error);
        }
    };

    const handleCollectOnline = async (orderId: string) => {
        try {
            const res = await fetchApi(`/api/delivery/orders/${orderId}/pay`);
            if (!res.ok) {
                const data = await res.json();
                alert(data.message || "Failed to initiate payment");
                return;
            }

            const data = await res.json();
            const rzpOrder = data;

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_SBd0GNxh5TYLm3",
                amount: rzpOrder.amount,
                currency: "INR",
                name: "Neo Cloud Room - Delivery",
                description: "Cash on Delivery Collection",
                order_id: rzpOrder.id,
                handler: async function (response: any) {
                    try {
                        const verifyRes = await fetchApi(`/api/delivery/orders/${orderId}/pay`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        if (verifyRes.ok) {
                            alert("Payment collected successfully! Order marked as DELIVERED.");
                            fetchOrders();
                        } else {
                            const verifyData = await verifyRes.json();
                            alert(verifyData.message || "Payment verification failed.");
                        }
                    } catch (e) {
                        alert("An error occurred during payment verification.");
                    }
                },
                theme: {
                    color: "#48BB78"
                }
            };
            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error(err);
            alert("Error trying to collect online");
        }
    };

    const handleCashCollected = async (orderId: string) => {
        // Assume money is manually collected, we just update status to DELIVERED
        await updateStatus(orderId, 'DELIVERED');
        setCollectCashModalOrder(null);
        fetchTransactions();
    };

    // Segregate orders
    const activeOrders = orders.filter(o => o.status !== 'DELIVERED');
    const historyOrders = orders.filter(o => o.status === 'DELIVERED');

    // Group history by date
    const groupedHistory = historyOrders.reduce((acc: any, order: any) => {
        const dateStr = new Date(order.updatedAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(order);
        return acc;
    }, {});


    return (
        <div>
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />
            <div style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#1A1C23', marginBottom: '8px' }}>Delivery Hub</h1>
                    <p style={{ color: '#718096', fontSize: '1.1rem' }}>Manage your pickups and deliveries in real-time.</p>
                </div>
            </div>

            {profile && (
                <div style={{
                    background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
                    borderRadius: "16px",
                    padding: "24px",
                    color: "white",
                    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.15)",
                    marginBottom: "25px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "15px"
                }}>
                    <div>
                        <div style={{ fontSize: "0.85rem", opacity: 0.8, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Outstanding COD Balance
                        </div>
                        <div style={{ fontSize: "2.2rem", fontWeight: "900", marginTop: "4px" }}>
                            ₹{profile.outstandingBalance.toFixed(2)}
                        </div>
                        <p style={{ fontSize: "0.85rem", opacity: 0.7, marginTop: "8px", maxWidth: "480px", lineHeight: "1.4" }}>
                            This shows the cash you have collected from COD orders that you owe to the seller. Settle this outstanding balance with your seller directly.
                        </p>
                    </div>
                    <div style={{
                        backgroundColor: "rgba(255, 255, 255, 0.08)",
                        padding: "12px 20px",
                        borderRadius: "12px",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        minWidth: "200px"
                    }}>
                        <div style={{ fontSize: "0.75rem", opacity: 0.7, textTransform: "uppercase", fontWeight: "600" }}>Seller Outlet</div>
                        <div style={{ fontWeight: "800", fontSize: "1rem", marginTop: "4px", color: "#10B981" }}>
                            {profile.seller?.businessName || "Your Partner Seller"}
                        </div>
                    </div>
                </div>
            )}

                {/* Tabs */}
                <div style={{ display: 'flex', backgroundColor: '#EDF2F7', padding: '4px', borderRadius: '12px', gap: '4px' }}>
                    <button
                        onClick={() => setActiveTab('ACTIVE')}
                        style={{ padding: '10px 20px', backgroundColor: activeTab === 'ACTIVE' ? 'white' : 'transparent', border: 'none', borderRadius: '8px', fontWeight: 'bold', color: activeTab === 'ACTIVE' ? 'var(--primary)' : '#718096', boxShadow: activeTab === 'ACTIVE' ? '0 2px 10px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                        Active Orders
                    </button>
                    <button
                        onClick={() => setActiveTab('HISTORY')}
                        style={{ padding: '10px 20px', backgroundColor: activeTab === 'HISTORY' ? 'white' : 'transparent', border: 'none', borderRadius: '8px', fontWeight: 'bold', color: activeTab === 'HISTORY' ? 'var(--primary)' : '#718096', boxShadow: activeTab === 'HISTORY' ? '0 2px 10px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                        History
                    </button>
                    <button
                        onClick={() => setActiveTab('WALLET')}
                        style={{ padding: '10px 20px', backgroundColor: activeTab === 'WALLET' ? 'white' : 'transparent', border: 'none', borderRadius: '8px', fontWeight: 'bold', color: activeTab === 'WALLET' ? 'var(--primary)' : '#718096', boxShadow: activeTab === 'WALLET' ? '0 2px 10px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                        Wallet & Transactions
                    </button>
                </div>


            {/* Collect Cash Modal */}
            {collectCashModalOrder && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '30px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>Collect Cash</h2>
                            <button onClick={() => setCollectCashModalOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} color="#A0AEC0" />
                            </button>
                        </div>

                        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                            <p style={{ color: '#718096', marginBottom: '10px' }}>Amount to Collect from Customer</p>
                            <h3 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#E53E3E' }}>₹{collectCashModalOrder.totalAmount}</h3>
                            <p style={{ fontSize: '0.9rem', color: '#A0AEC0', marginTop: '5px' }}>Order #{collectCashModalOrder.id.slice(-6)}</p>
                        </div>

                        <div style={{ backgroundColor: '#FFF5F5', padding: '15px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #FED7D7' }}>
                            <p style={{ fontSize: '0.9rem', color: '#C53030', textAlign: 'center', fontWeight: '500' }}>
                                Ensure you have received the exact amount in Cash or UPI before swiping. There is no undo.
                            </p>
                        </div>

                        <SwipeAction onSwipeSuccess={() => handleCashCollected(collectCashModalOrder.id)} text="Swipe to confirm Payment & Deliver" />
                    </div>
                </div>
            )}

            {loading ? (
                <p>Loading your tasks...</p>
            ) : activeTab === 'ACTIVE' ? (
                // ACTIVE ORDERS VIEW
                activeOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <Package size={60} color="#CBD5E0" style={{ marginBottom: '20px' }} />
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2D3748', marginBottom: '10px' }}>All caught up!</h3>
                        <p style={{ color: '#718096' }}>No active orders assigned to you at the moment.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                        {activeOrders.map(order => (
                            <div key={order.id} style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: order.status === 'OUT_FOR_DELIVERY' ? '6px solid #48BB78' : '6px solid #ECC94B' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', padding: '4px 12px', borderRadius: '20px', backgroundColor: order.status === 'OUT_FOR_DELIVERY' ? '#C6F6D5' : '#FEFCBF', color: order.status === 'OUT_FOR_DELIVERY' ? '#22543D' : '#744210' }}>
                                            {order.status.replace(/_/g, ' ')}
                                        </span>
                                        <span style={{ color: '#A0AEC0', fontSize: '0.9rem' }}>#{order.id.slice(-6)}</span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4A5568', marginBottom: '8px' }}>
                                                <MapPin size={18} color="#F16F68" />
                                                <span style={{ fontWeight: '600' }}>Delivery Address</span>
                                            </div>
                                            <p style={{ color: '#718096', fontSize: '0.95rem', marginLeft: '26px' }}>{order.deliveryAddress}</p>
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4A5568', marginBottom: '8px' }}>
                                                <Phone size={18} color="#48C9B0" />
                                                <span style={{ fontWeight: '600' }}>Customer Phone</span>
                                            </div>
                                            <p style={{ color: '#718096', fontSize: '0.95rem', marginLeft: '26px' }}>
                                                <a href={`tel:${order.customerPhone}`} style={{ color: 'inherit', textDecoration: 'none' }}>{order.customerPhone}</a>
                                            </p>
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4A5568', marginBottom: '8px' }}>
                                                <CheckCircle size={18} color="#4299E1" />
                                                <span style={{ fontWeight: '600' }}>Payment Mode</span>
                                            </div>
                                            <p style={{ color: '#718096', fontSize: '0.95rem', marginLeft: '26px' }}>{order.paymentMethod} {order.isPaid ? '(Paid)' : '(Unpaid)'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginLeft: '30px', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '180px' }}>
                                    {order.status === 'PENDING' || order.status === 'PREPARING' ? (
                                        <button
                                            onClick={() => updateStatus(order.id, 'OUT_FOR_DELIVERY')}
                                            style={{ backgroundColor: '#ECC94B', color: '#744210', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                                        >
                                            Mark Picked Up
                                        </button>
                                    ) : order.status === 'OUT_FOR_DELIVERY' ? (
                                        <>
                                            {/* If not paid and COD, show Collect Cash, opening modal */}
                                            {!order.isPaid && order.paymentMethod === 'COD' ? (
                                                <button
                                                    onClick={() => setCollectCashModalOrder(order)}
                                                    style={{ backgroundColor: '#48BB78', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                                                >
                                                    Collect Cash & Deliver
                                                </button>
                                            ) : (
                                                // If Paid (Online/QR), show straight swipe action without money modal
                                                <div style={{ marginTop: '5px' }}>
                                                    <SwipeAction onSwipeSuccess={() => updateStatus(order.id, 'DELIVERED')} text="Swipe to Deliver" />
                                                </div>
                                            )}

                                            {!order.isPaid && order.paymentMethod === 'COD' && (
                                                <button
                                                    onClick={() => handleCollectOnline(order.id)}
                                                    style={{ backgroundColor: '#3182CE', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', marginTop: '10px' }}
                                                >
                                                    Collect Online (Razorpay)
                                                </button>
                                            )}
                                        </>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : activeTab === 'HISTORY' ? (
                // HISTORY VIEW
                Object.keys(groupedHistory).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <Clock size={60} color="#CBD5E0" style={{ marginBottom: '20px' }} />
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2D3748', marginBottom: '10px' }}>No History Yet</h3>
                        <p style={{ color: '#718096' }}>You haven't completed any deliveries.</p>
                    </div>
                ) : (
                    <div>
                        {Object.keys(groupedHistory).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map(date => (
                            <div key={date} style={{ marginBottom: '30px' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4A5568', marginBottom: '15px', borderBottom: '2px solid #EDF2F7', paddingBottom: '8px' }}>
                                    {date} <span style={{ fontSize: '0.9rem', color: '#A0AEC0', fontWeight: 'normal', marginLeft: '10px' }}>({groupedHistory[date].length} deliveries)</span>
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {groupedHistory[date].map((order: any) => (
                                        <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '15px 20px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                                    <span style={{ fontWeight: 'bold', color: '#2D3748' }}>#{order.id.slice(-6)}</span>
                                                    <span style={{ fontSize: '0.8rem', backgroundColor: '#EBF8FF', color: '#3182CE', padding: '2px 8px', borderRadius: '12px' }}>{order.paymentMethod}</span>
                                                    <span style={{ fontSize: '0.8rem', color: '#A0AEC0' }}>
                                                        {new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p style={{ fontSize: '0.9rem', color: '#718096', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <MapPin size={14} /> {order.deliveryAddress}
                                                </p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 'bold', color: '#2D3748', fontSize: '1.1rem' }}>₹{order.totalAmount}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#48BB78', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '4px' }}>
                                                    <CheckCircle size={14} /> Delivered
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                // WALLET VIEW
                <div style={{ animation: "fadeIn 0.5s ease-out", display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        {/* Summary Card 1: Cash Owed */}
                        <div style={{ flex: 1, minWidth: '240px', backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Cash Owed to Seller</span>
                                <div style={{ backgroundColor: '#FEE2E2', padding: '6px', borderRadius: '8px' }}>
                                    <Wallet size={20} color="#EF4444" />
                                </div>
                            </div>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1E293B' }}>₹{profile?.outstandingBalance.toFixed(2)}</h3>
                            <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '5px' }}>Total COD collected but not yet remitted.</p>
                        </div>

                        {/* Summary Card 2: Total Transactions */}
                        <div style={{ flex: 1, minWidth: '240px', backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Total Transactions</span>
                                <div style={{ backgroundColor: '#E0F2FE', padding: '6px', borderRadius: '8px' }}>
                                    <Clock size={20} color="#0284C7" />
                                </div>
                            </div>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1E293B' }}>{transactions.length}</h3>
                            <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '5px' }}>All transactions in your wallet history.</p>
                        </div>
                    </div>

                    {/* Transaction History Log */}
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0F172A', margin: 0 }}>Wallet Transaction Logs</h3>
                            {transactions.length > 0 && (
                                <button
                                    onClick={downloadCSV}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid #3182CE', backgroundColor: 'white', color: '#3182CE', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', transition: 'all 0.2s' }}
                                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#EBF8FF'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
                                >
                                    <Download size={16} /> Export CSV
                                </button>
                            )}
                        </div>

                        {loadingTx ? (
                            <p style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>Loading transactions...</p>
                        ) : transactions.length === 0 ? (
                            <p style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>No transactions recorded yet.</p>
                        ) : (
                            <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                            <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>Date / Time</th>
                                            <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>Type</th>
                                            <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>Amount</th>
                                            <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>Details</th>
                                            <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map((tx: any) => {
                                            let typeColor = '#475569';
                                            let typeLabel = tx.type;
                                            let amountPrefix = '';
                                            let amountColor = '#475569';

                                            if (tx.type === 'COD_COLLECTION') {
                                                typeColor = '#16A34A';
                                                typeLabel = 'Credited (COD Collect)';
                                                amountPrefix = '+ ';
                                                amountColor = '#16A34A';
                                            } else if (tx.type === 'SETTLEMENT') {
                                                typeColor = '#2563EB';
                                                typeLabel = 'Debited (Settlement)';
                                                amountPrefix = '- ';
                                                amountColor = '#2563EB';
                                            } else if (tx.type === 'ADJUSTMENT') {
                                                typeColor = '#CA8A04';
                                                typeLabel = 'Adjustment';
                                                amountPrefix = tx.amount < 0 ? '- ' : '+ ';
                                                amountColor = tx.amount < 0 ? '#DC2626' : '#16A34A';
                                            }

                                            return (
                                                <tr key={tx.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                                    <td style={{ padding: '12px 16px', color: '#475569' }}>
                                                        {new Date(tx.createdAt).toLocaleDateString()} <br />
                                                        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                                                            {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: typeColor, backgroundColor: typeColor + '10', padding: '2px 8px', borderRadius: '12px' }}>
                                                            {typeLabel}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', fontWeight: '700', color: amountColor }}>
                                                        {amountPrefix}₹{Math.abs(tx.amount).toFixed(2)}
                                                    </td>
                                                    <td style={{ padding: '12px 16px', color: '#475569', fontSize: '0.85rem' }}>
                                                        {tx.description}
                                                        {tx.orderId && (
                                                            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>Order: #{tx.orderId.slice(-6)}</div>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#16A34A', backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '12px' }}>
                                                            {tx.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
