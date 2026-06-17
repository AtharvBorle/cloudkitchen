"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/fetch-api";
import { Star, MessageSquare, ShoppingBag, Utensils, Calendar, User } from "lucide-react";

export default function SellerReviewsPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState<"overall" | "items">("overall");

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await fetchApi("/api/seller/reviews");
                if (res.ok) {
                    const resData = await res.json();
                    setData(resData.data || resData);
                } else {
                    setError("Failed to fetch reviews data.");
                }
            } catch (err) {
                console.error("Error fetching reviews:", err);
                setError("An error occurred while loading reviews.");
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', fontSize: '1.2rem', color: 'var(--text-muted)' }}>
                Loading reviews and analytics...
            </div>
        );
    }

    if (error || !data) {
        return (
            <div style={{ padding: '20px', backgroundColor: '#FDE8E8', color: '#C81E1E', borderRadius: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                {error || "No review data found."}
            </div>
        );
    }

    const { stats, reviews, foodItemStats } = data;
    const { averageRating, totalReviews, ratingDistribution } = stats;

    const renderStars = (rating: number) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Star
                    key={i}
                    size={16}
                    fill={i <= rating ? "var(--coral, #F16F68)" : "none"}
                    color={i <= rating ? "var(--coral, #F16F68)" : "#CBD5E1"}
                    style={{ marginRight: '2px' }}
                />
            );
        }
        return <div style={{ display: 'flex' }}>{stars}</div>;
    };

    return (
        <div style={{ paddingBottom: '40px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1E293B', marginBottom: '20px' }}>
                Customer Reviews & Ratings
            </h1>

            {/* Stats Overview Panel */}
            <div style={{ display: 'flex', gap: '25px', marginBottom: '35px', flexWrap: 'wrap' }}>
                {/* Left Card: Average Rating */}
                <div style={{
                    flex: '1 1 300px',
                    backgroundColor: 'white',
                    padding: '25px',
                    borderRadius: '16px',
                    boxShadow: 'var(--shadow-card, 0 4px 20px rgba(0,0,0,0.05))',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    border: '1px solid #E2E8F0'
                }}>
                    <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                        Overall rating
                    </span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '3.5rem', fontWeight: '800', color: '#1E293B' }}>{averageRating}</span>
                        <span style={{ fontSize: '1.2rem', color: '#94A3B8', fontWeight: '600' }}>/ 5</span>
                    </div>
                    <div style={{ marginBottom: '15px' }}>{renderStars(Math.round(averageRating))}</div>
                    <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: '500' }}>
                        Based on {totalReviews} overall reviews
                    </span>
                </div>

                {/* Right Card: Rating Breakdown */}
                <div style={{
                    flex: '2 1 450px',
                    backgroundColor: 'white',
                    padding: '25px',
                    borderRadius: '16px',
                    boxShadow: 'var(--shadow-card, 0 4px 20px rgba(0,0,0,0.05))',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#334155', marginBottom: '15px' }}>Rating Breakdown</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {([5, 4, 3, 2, 1] as const).map((star) => {
                            const count = ratingDistribution[star] || 0;
                            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                            return (
                                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', minWidth: '45px', textAlign: 'right' }}>
                                        {star} Star
                                    </span>
                                    <div style={{ flex: 1, height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${percentage}%`,
                                            backgroundColor: 'var(--coral, #F16F68)',
                                            borderRadius: '4px',
                                            transition: 'width 0.6s ease'
                                        }} />
                                    </div>
                                    <span style={{ fontSize: '0.85rem', color: '#64748B', minWidth: '30px', textAlign: 'right' }}>
                                        {count}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', borderBottom: '2px solid #E2E8F0', marginBottom: '25px' }}>
                <button
                    onClick={() => setActiveTab("overall")}
                    style={{
                        padding: '12px 24px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: activeTab === "overall" ? "var(--coral, #F16F68)" : "#64748B",
                        borderBottom: activeTab === "overall" ? "3px solid var(--coral, #F16F68)" : "3px solid transparent",
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        marginBottom: '-2px'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MessageSquare size={18} />
                        Overall Service Reviews ({reviews.length})
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab("items")}
                    style={{
                        padding: '12px 24px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: activeTab === "items" ? "var(--coral, #F16F68)" : "#64748B",
                        borderBottom: activeTab === "items" ? "3px solid var(--coral, #F16F68)" : "3px solid transparent",
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        marginBottom: '-2px'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Utensils size={18} />
                        Item Ratings & Feedback ({foodItemStats.length})
                    </div>
                </button>
            </div>

            {/* Tab Contents */}
            {activeTab === "overall" ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {reviews.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', color: '#64748B' }}>
                            No service reviews received yet.
                        </div>
                    ) : (
                        reviews.map((review: any) => (
                            <div key={review.id} style={{
                                backgroundColor: 'white',
                                padding: '25px',
                                borderRadius: '16px',
                                border: '1px solid #E2E8F0',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                                transition: 'transform 0.2s, box-shadow 0.2s'
                            }} className="review-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                            <span style={{ fontWeight: '700', fontSize: '1rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <User size={16} color="#64748B" />
                                                {review.user?.name || "Anonymous Customer"}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', backgroundColor: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontWeight: '500' }}>
                                                Order ID: {review.orderId.substring(0, 8)}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#94A3B8' }}>
                                            <Calendar size={12} />
                                            {new Date(review.createdAt).toLocaleDateString("en-IN", {
                                                year: "numeric", month: "long", day: "numeric"
                                            })}
                                        </div>
                                    </div>
                                    <div>{renderStars(review.rating)}</div>
                                </div>

                                <p style={{ fontSize: '0.95rem', color: '#334155', lineHeight: '1.6', margin: '0 0 15px 0', backgroundColor: '#F8FAFC', padding: '15px', borderRadius: '8px', borderLeft: '3px solid var(--coral, #F16F68)', fontStyle: review.comment ? 'normal' : 'italic' }}>
                                    {review.comment || "No comment left for this order."}
                                </p>

                                {/* Item ratings in this order */}
                                {review.itemRatings && review.itemRatings.length > 0 && (
                                    <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '15px' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Ordered Items Rated:
                                        </span>
                                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                            {review.itemRatings.map((ir: any) => (
                                                <div key={ir.id} style={{
                                                    backgroundColor: '#FFF8F6',
                                                    border: '1px solid #FFEDEA',
                                                    borderRadius: '8px',
                                                    padding: '10px 15px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '4px',
                                                    minWidth: '200px'
                                                }}>
                                                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1E293B' }}>
                                                        {ir.foodItem?.name || "Deleted Food Item"}
                                                    </span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        {renderStars(ir.rating)}
                                                        <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--coral, #F16F68)' }}>{ir.rating}/5</span>
                                                    </div>
                                                    {ir.comment && (
                                                        <span style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px', borderTop: '1px dashed #FFDED8', paddingTop: '4px' }}>
                                                            💬 "{ir.comment}"
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {foodItemStats.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', color: '#64748B' }}>
                            You have no food items listed.
                        </div>
                    ) : (
                        foodItemStats.map((item: any) => (
                            <div key={item.id} style={{
                                backgroundColor: 'white',
                                padding: '25px',
                                borderRadius: '16px',
                                border: '1px solid #E2E8F0',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                                display: 'flex',
                                gap: '20px',
                                flexWrap: 'wrap'
                            }}>
                                {/* Item Image & Details */}
                                <div style={{ flex: '1 1 250px', display: 'flex', gap: '15px' }}>
                                    {item.imageUrl && (
                                        <div style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, backgroundColor: '#F1F5F9' }}>
                                            <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1E293B', margin: '0 0 5px 0' }}>{item.name}</h3>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--coral, #F16F68)', fontWeight: '600', marginBottom: '8px' }}>₹{item.price}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#FFF8F6', padding: '3px 8px', borderRadius: '6px', border: '1px solid #FFEDEA' }}>
                                                <Star size={14} fill="var(--coral, #F16F68)" color="var(--coral, #F16F68)" style={{ marginRight: '4px' }} />
                                                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--coral, #F16F68)' }}>{item.averageRating}</span>
                                            </div>
                                            <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '500' }}>
                                                ({item.totalRatings} ratings)
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Item Specific Reviews List */}
                                <div style={{ flex: '2 1 400px', borderLeft: '1px solid #F1F5F9', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>
                                        Item Comments
                                    </span>
                                    {item.ratings.length === 0 ? (
                                        <div style={{ fontSize: '0.85rem', color: '#94A3B8', fontStyle: 'italic', padding: '10px 0' }}>
                                            No reviews left for this item yet.
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto', paddingRight: '5px' }}>
                                            {item.ratings.map((ir: any) => (
                                                <div key={ir.id} style={{
                                                    backgroundColor: '#F8FAFC',
                                                    padding: '12px 15px',
                                                    borderRadius: '10px',
                                                    border: '1px solid #E2E8F0'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155' }}>
                                                            {ir.userName}
                                                        </span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            {renderStars(ir.rating)}
                                                            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>
                                                                {new Date(ir.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0, fontStyle: ir.comment ? 'normal' : 'italic' }}>
                                                        {ir.comment || "Rated without comments."}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
