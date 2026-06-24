"use client";
import { fetchApi } from "@/lib/fetch-api";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, CheckCircle, Package, Truck, XCircle, User, Phone, Star } from "lucide-react";

export default function UserOrdersList({ initialOrders }: { initialOrders: any[] }) {
    const [orders, setOrders] = useState(initialOrders);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    // Modal state
    const [reviewingOrder, setReviewingOrder] = useState<any | null>(null);
    const [overallRating, setOverallRating] = useState(5);
    const [overallComment, setOverallComment] = useState("");
    const [itemRatings, setItemRatings] = useState<{ [foodItemId: string]: { rating: number; comment: string } }>({});
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewError, setReviewError] = useState("");


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

    // Open review modal
    const openReviewModal = (order: any, parsedItems: any[]) => {
        setReviewingOrder(order);
        setOverallRating(5);
        setOverallComment("");
        setReviewError("");

        // Initialize item ratings
        const initialItemRatings: { [key: string]: { rating: number; comment: string } } = {};
        parsedItems.forEach((item: any) => {
            if (item.id) {
                initialItemRatings[item.id] = { rating: 5, comment: "" };
            }
        });
        setItemRatings(initialItemRatings);
    };

    const handleItemRatingChange = (itemId: string, rating: number) => {
        setItemRatings(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], rating }
        }));
    };

    const handleItemCommentChange = (itemId: string, comment: string) => {
        setItemRatings(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], comment }
        }));
    };

    const submitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reviewingOrder) return;

        setSubmittingReview(true);
        setReviewError("");

        try {
            const itemsArray = Object.keys(itemRatings).map(foodItemId => ({
                foodItemId,
                rating: itemRatings[foodItemId].rating,
                comment: itemRatings[foodItemId].comment
            }));

            const res = await fetchApi(`/api/user/orders/${reviewingOrder.id}/review`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rating: overallRating,
                    comment: overallComment,
                    itemRatings: itemsArray
                })
            });

            const data = await res.json();

            if (res.ok) {
                // Update local orders state
                setOrders(currentOrders =>
                    currentOrders.map(order =>
                        order.id === reviewingOrder.id
                            ? { ...order, review: data.data?.review || data.data }
                            : order
                    )
                );
                setReviewingOrder(null);
                alert("Thank you! Your feedback has been submitted successfully.");
            } else {
                setReviewError(data.message || "Failed to submit review.");
            }
        } catch (err) {
            setReviewError("An error occurred. Please try again.");
        } finally {
            setSubmittingReview(false);
        }
    };

    const renderInteractiveStars = (currentRating: number, onChange: (rating: number) => void) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <button
                    key={i}
                    type="button"
                    onClick={() => onChange(i)}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        outline: 'none'
                    }}
                >
                    <Star
                        size={28}
                        fill={i <= currentRating ? "var(--coral, #F16F68)" : "none"}
                        color={i <= currentRating ? "var(--coral, #F16F68)" : "#94A3B8"}
                    />
                </button>
            );
        }
        return <div style={{ display: 'flex', gap: '5px' }}>{stars}</div>;
    };

    const renderStaticStars = (rating: number) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Star
                    key={i}
                    size={16}
                    fill={i <= rating ? "var(--coral, #F16F68)" : "none"}
                    color={i <= rating ? "var(--coral, #F16F68)" : "#CBD5E1"}
                    style={{ marginRight: '1px' }}
                />
            );
        }
        return <div style={{ display: 'flex' }}>{stars}</div>;
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
                                <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: "2px" }}>
                                    Order ID: <span style={{ fontFamily: "monospace", fontWeight: "700", color: "#0F172A" }}>{order.id}</span>
                                </div>
                                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
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

                        {/* Rating Display / Action Button */}
                        {order.status === 'DELIVERED' && (
                            <div style={{
                                marginTop: '10px',
                                marginBottom: '15px',
                                padding: '15px',
                                backgroundColor: '#F8FAF9',
                                borderRadius: '8px',
                                border: '1px solid #EAEAEA',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '10px'
                            }}>
                                {order.review ? (
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#334155' }}>Your Review:</span>
                                            {renderStaticStars(order.review.rating)}
                                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--coral, #F16F68)' }}>{order.review.rating}/5</span>
                                        </div>
                                        {order.review.comment && (
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
                                                "{order.review.comment}"
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '500' }}>
                                            How was your food and ordering experience?
                                        </span>
                                        <button
                                            onClick={() => openReviewModal(order, items)}
                                            style={{
                                                backgroundColor: 'white',
                                                border: '2px solid var(--coral, #F16F68)',
                                                color: 'var(--coral, #F16F68)',
                                                padding: '8px 16px',
                                                borderRadius: '8px',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                fontSize: '0.85rem'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = 'var(--coral, #F16F68)';
                                                e.currentTarget.style.color = 'white';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'white';
                                                e.currentTarget.style.color = 'var(--coral, #F16F68)';
                                            }}
                                        >
                                            Rate & Review
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "bold", paddingTop: "10px", borderTop: "1px solid #EEE", flexWrap: "wrap", gap: "10px" }}>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <span>Total Amount ({order.paymentMethod})</span>
                                <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
                                    {order.status === 'PENDING' && (
                                        <button
                                            onClick={() => handleCancelOrder(order.id)}
                                            disabled={cancellingId === order.id}
                                            style={{ color: '#EF4444', fontSize: '0.85rem', textDecoration: 'underline', cursor: 'pointer', textAlign: 'left', opacity: cancellingId === order.id ? 0.5 : 1, border: 'none', background: 'none', padding: 0 }}
                                        >
                                            {cancellingId === order.id ? "Cancelling..." : "Cancel Order"}
                                        </button>
                                    )}
                                    {order.status === 'DELIVERED' && (
                                        <button
                                            onClick={() => window.open(`/invoice/order/${order.id}`, '_blank')}
                                            style={{ color: 'var(--primary, #10B981)', fontSize: '0.85rem', textDecoration: 'underline', cursor: 'pointer', border: 'none', background: 'none', padding: 0, fontWeight: '700' }}
                                        >
                                            View Invoice
                                        </button>
                                    )}
                                    {order.refund && (
                                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: order.refund.status === 'APPROVED' ? '#10B981' : order.refund.status === 'REJECTED' ? '#EF4444' : '#F59E0B' }}>
                                            Refund: {order.refund.status}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <span style={{ color: order.status === 'CANCELLED' ? 'var(--text-muted)' : 'var(--primary)', textDecoration: order.status === 'CANCELLED' ? 'line-through' : 'none' }}>₹{order.totalAmount}</span>
                        </div>
                    </div>
                );
            })}

            {/* Rating Modal Backdrop */}
            {reviewingOrder && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    backdropFilter: 'blur(5px)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 99999,
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '20px',
                        width: '100%',
                        maxWidth: '550px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{
                            padding: '20px 25px',
                            borderBottom: '1px solid #F1F5F9',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1E293B', margin: 0 }}>
                                Rate Order & Items
                            </h3>
                            <button
                                onClick={() => setReviewingOrder(null)}
                                style={{
                                    border: 'none',
                                    background: 'none',
                                    fontSize: '1.5rem',
                                    fontWeight: 'bold',
                                    color: '#64748B',
                                    cursor: 'pointer'
                                }}
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={submitReview} style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {reviewError && (
                                <div style={{
                                    padding: '12px 15px',
                                    backgroundColor: '#FEF2F2',
                                    border: '1px solid #FCA5A5',
                                    color: '#B91C1C',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    fontWeight: '500'
                                }}>
                                    {reviewError}
                                </div>
                            )}

                            {/* Section 1: Overall Rating */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <label style={{ fontWeight: '700', fontSize: '0.95rem', color: '#334155' }}>
                                    Overall Order Experience
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    {renderInteractiveStars(overallRating, setOverallRating)}
                                    <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--coral, #F16F68)' }}>
                                        {overallRating} / 5
                                    </span>
                                </div>
                                <textarea
                                    value={overallComment}
                                    onChange={(e) => setOverallComment(e.target.value)}
                                    placeholder="Write a comment about your overall food taste, packaging, and delivery..."
                                    style={{
                                        width: '100%',
                                        minHeight: '80px',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #CBD5E1',
                                        fontSize: '0.9rem',
                                        fontFamily: 'inherit',
                                        resize: 'vertical',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            {/* Section 2: Items Ratings */}
                            {Object.keys(itemRatings).length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', borderTop: '1px solid #F1F5F9', paddingTop: '20px' }}>
                                    <label style={{ fontWeight: '700', fontSize: '0.95rem', color: '#334155' }}>
                                        Rate Individual Items
                                    </label>
                                    
                                    {(() => {
                                        let parsedItems = [];
                                        try {
                                            parsedItems = typeof reviewingOrder.items === 'string' ? JSON.parse(reviewingOrder.items) : reviewingOrder.items;
                                        } catch (e) {
                                            parsedItems = [];
                                        }

                                        return parsedItems.map((item: any) => {
                                            if (!item.id) return null;
                                            const currentItemState = itemRatings[item.id] || { rating: 5, comment: "" };

                                            return (
                                                <div key={item.id} style={{
                                                    backgroundColor: '#F8FAFC',
                                                    padding: '15px',
                                                    borderRadius: '12px',
                                                    border: '1px solid #E2E8F0',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '10px'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1E293B' }}>
                                                            {item.name}
                                                        </span>
                                                        <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '500' }}>
                                                            Qty: {item.quantity}
                                                        </span>
                                                    </div>

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        {renderInteractiveStars(currentItemState.rating, (r) => handleItemRatingChange(item.id, r))}
                                                        <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--coral, #F16F68)' }}>
                                                            {currentItemState.rating}/5
                                                        </span>
                                                    </div>

                                                    <input
                                                        type="text"
                                                        value={currentItemState.comment}
                                                        onChange={(e) => handleItemCommentChange(item.id, e.target.value)}
                                                        placeholder={`Comment about ${item.name} (optional)...`}
                                                        style={{
                                                            width: '100%',
                                                            padding: '8px 12px',
                                                            borderRadius: '6px',
                                                            border: '1px solid #CBD5E1',
                                                            fontSize: '0.85rem',
                                                            fontFamily: 'inherit',
                                                            outline: 'none'
                                                        }}
                                                    />
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            )}

                            {/* Footer Buttons */}
                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                marginTop: '10px',
                                borderTop: '1px solid #F1F5F9',
                                paddingTop: '20px'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => setReviewingOrder(null)}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        backgroundColor: 'white',
                                        border: '1px solid #CBD5E1',
                                        borderRadius: '10px',
                                        fontWeight: '600',
                                        color: '#475569',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingReview}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        backgroundColor: 'var(--coral, #F16F68)',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontWeight: '700',
                                        color: 'white',
                                        cursor: 'pointer',
                                        opacity: submittingReview ? 0.7 : 1
                                    }}
                                >
                                    {submittingReview ? "Submitting..." : "Submit Review"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
