"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/fetch-api";
import { Star, MessageSquare, Search, RefreshCw, TrendingUp } from "lucide-react";

interface Review {
    id: string;
    rating: number;
    comment?: string;
    aspects: string[];
    tags: string[];
    sentiment?: string;
    sellerReply?: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
    seller?: {
        id: string;
        name: string;
        phone?: string;
    };
    order?: {
        id: string;
        totalAmount: number;
        status: string;
    };
}

interface ReviewStats {
    totalReviews: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
    aspectCounts: Record<string, number>;
    tagCounts: Record<string, number>;
    sentimentCounts: Record<string, number>;
}

export default function AdminReviewsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewStats | null>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStar, setSelectedStar] = useState<string>("ALL");
    const [selectedSentiment, setSelectedSentiment] = useState<string>("ALL");

    useEffect(() => {
        if (status === "loading") return;
        if (!session || ((session.user as any)?.role !== "ADMIN" && (session.user as any)?.role !== "AGENT")) {
            router.push("/admin");
            return;
        }

        loadReviews();
    }, [session, status, router]);

    const loadReviews = async () => {
        setLoading(true);
        try {
            const res = await fetchApi("/api/admin/reviews");
            if (res.ok) {
                const json = await res.json();
                const data = json.data || json;
                if (data) {
                    setReviews(data.reviews || []);
                    setStats(data.stats || null);
                }
            }
        } catch (err) {
            console.error("Failed to load admin reviews:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredReviews = useMemo(() => {
        return reviews.filter((r) => {
            const matchesQuery =
                !searchQuery.trim() ||
                r.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.seller?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (r.comment && r.comment.toLowerCase().includes(searchQuery.toLowerCase())) ||
                r.aspects?.some(a => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
                r.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesStar =
                selectedStar === "ALL" || r.rating === parseInt(selectedStar, 10);

            const matchesSentiment =
                selectedSentiment === "ALL" || r.sentiment === selectedSentiment;

            return matchesQuery && matchesStar && matchesSentiment;
        });
    }, [reviews, searchQuery, selectedStar, selectedSentiment]);

    if (loading || status === "loading") {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid var(--primary)", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
                    <span style={{ color: "#64748b", fontWeight: 500 }}>Loading Customer Feedback...</span>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: "700", color: "var(--text-main)", margin: 0 }}>
                        Customer Reviews &amp; Ratings
                    </h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "4px" }}>
                        View live customer ratings, feedback tags, and suggestions submitted across stores.
                    </p>
                </div>
                <button
                    onClick={loadReviews}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        backgroundColor: "white",
                        border: "1px solid var(--surface-border)",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: "var(--text-main)"
                    }}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {/* Top Analytics Cards */}
            {stats && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                    <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", border: "1px solid var(--surface-border)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 500 }}>Total Reviews</div>
                        <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--text-main)", marginTop: "8px" }}>
                            {stats.totalReviews.toLocaleString()}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#10B981", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                            <TrendingUp size={14} /> Total customer submissions
                        </div>
                    </div>

                    <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", border: "1px solid var(--surface-border)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 500 }}>Average Rating</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "8px" }}>
                            <span style={{ fontSize: "2rem", fontWeight: "800", color: "#F59E0B" }}>
                                {stats.averageRating.toFixed(1)}
                            </span>
                            <span style={{ color: "var(--text-muted)", fontSize: "1rem" }}>/ 5.0</span>
                        </div>
                        <div style={{ display: "flex", gap: "2px", marginTop: "4px" }}>
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                    key={s}
                                    size={14}
                                    fill={s <= Math.round(stats.averageRating) ? "#F59E0B" : "none"}
                                    color={s <= Math.round(stats.averageRating) ? "#F59E0B" : "#CBD5E1"}
                                />
                            ))}
                        </div>
                    </div>

                    <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", border: "1px solid var(--surface-border)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 500 }}>Top Highlight</div>
                        <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--primary)", marginTop: "8px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                            {Object.entries(stats.aspectCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Food Taste & Quality"}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                            Most popular aspect
                        </div>
                    </div>

                    <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", border: "1px solid var(--surface-border)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 500 }}>Top Feedback Tag</div>
                        <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#10B981", marginTop: "8px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                            {Object.entries(stats.tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Super Fast Delivery"}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                            Most common tag
                        </div>
                    </div>
                </div>
            )}

            {/* Filter & Search Bar */}
            <div style={{ backgroundColor: "white", padding: "16px 20px", borderRadius: "12px", border: "1px solid var(--surface-border)", display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "260px", backgroundColor: "#F8FAFC", padding: "8px 14px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                    <Search size={18} color="#94A3B8" />
                    <input
                        type="text"
                        placeholder="Search by customer, seller, comment, or tag..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ border: "none", outline: "none", backgroundColor: "transparent", width: "100%", fontSize: "0.875rem" }}
                    />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Rating:</span>
                        <select
                            value={selectedStar}
                            onChange={(e) => setSelectedStar(e.target.value)}
                            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #E2E8F0", backgroundColor: "white", fontSize: "0.875rem" }}
                        >
                            <option value="ALL">All Stars</option>
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                        </select>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Sentiment:</span>
                        <select
                            value={selectedSentiment}
                            onChange={(e) => setSelectedSentiment(e.target.value)}
                            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #E2E8F0", backgroundColor: "white", fontSize: "0.875rem" }}
                        >
                            <option value="ALL">All Sentiments</option>
                            <option value="Loved It! Outstanding 🌟">Loved It! Outstanding 🌟</option>
                            <option value="Great Experience!">Great Experience!</option>
                            <option value="Good & Satisfying">Good &amp; Satisfying</option>
                            <option value="Fair Experience">Fair Experience</option>
                            <option value="Needs Improvement">Needs Improvement</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Reviews List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {filteredReviews.length === 0 ? (
                    <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "12px", border: "1px solid var(--surface-border)", textAlign: "center", color: "var(--text-muted)" }}>
                        <MessageSquare size={36} style={{ margin: "0 auto 12px auto", opacity: 0.5 }} />
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-main)" }}>No reviews found</h3>
                        <p style={{ fontSize: "0.875rem", marginTop: "4px" }}>No user ratings or feedback match your current filters.</p>
                    </div>
                ) : (
                    filteredReviews.map((review) => (
                        <div
                            key={review.id}
                            style={{
                                backgroundColor: "white",
                                padding: "20px",
                                borderRadius: "12px",
                                border: "1px solid var(--surface-border)",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                                display: "flex",
                                flexDirection: "column",
                                gap: "12px"
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                                        <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-main)" }}>
                                            {review.user?.name || "Customer"}
                                        </span>
                                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", backgroundColor: "#F1F5F9", padding: "2px 8px", borderRadius: "6px" }}>
                                            {review.user?.email || "No email"}
                                        </span>
                                        {review.seller && (
                                            <span style={{ fontSize: "0.75rem", color: "#475569", backgroundColor: "#E2E8F0", padding: "2px 8px", borderRadius: "6px" }}>
                                                Seller: {review.seller.name}
                                            </span>
                                        )}
                                        {review.sentiment && (
                                            <span style={{ fontSize: "0.75rem", fontWeight: 600, backgroundColor: "#FEF3C7", color: "#B45309", padding: "2px 8px", borderRadius: "12px" }}>
                                                {review.sentiment}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                                        Submitted on {new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                    </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                            key={s}
                                            size={16}
                                            fill={s <= review.rating ? "#F59E0B" : "none"}
                                            color={s <= review.rating ? "#F59E0B" : "#CBD5E1"}
                                        />
                                    ))}
                                    <span style={{ fontWeight: 700, marginLeft: "4px", fontSize: "0.875rem", color: "var(--text-main)" }}>
                                        {review.rating}.0
                                    </span>
                                </div>
                            </div>

                            {/* Comment */}
                            {review.comment && (
                                <div style={{ backgroundColor: "#F8FAFC", padding: "12px 16px", borderRadius: "8px", borderLeft: "3px solid var(--primary)", fontSize: "0.875rem", color: "#334155", lineHeight: "1.5" }}>
                                    "{review.comment}"
                                </div>
                            )}

                            {/* Aspects & Tags */}
                            {((review.aspects && review.aspects.length > 0) || (review.tags && review.tags.length > 0)) && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                    {review.aspects?.map((aspect, idx) => (
                                        <span key={`asp-${idx}`} style={{ fontSize: "0.75rem", fontWeight: 500, backgroundColor: "#EFF6FF", color: "#2563EB", padding: "3px 8px", borderRadius: "6px", border: "1px solid #DBEAFE" }}>
                                            ✓ {aspect}
                                        </span>
                                    ))}
                                    {review.tags?.map((tag, idx) => (
                                        <span key={`tag-${idx}`} style={{ fontSize: "0.75rem", fontWeight: 500, backgroundColor: "#F0FDF4", color: "#16A34A", padding: "3px 8px", borderRadius: "6px", border: "1px solid #DCFCE7" }}>
                                            ★ {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Seller reply if any */}
                            {review.sellerReply && (
                                <div style={{ backgroundColor: "#FFF7ED", border: "1px solid #FED7AA", padding: "10px 14px", borderRadius: "8px", fontSize: "0.8125rem", color: "#9A3412" }}>
                                    <strong>Seller Reply:</strong> {review.sellerReply}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
