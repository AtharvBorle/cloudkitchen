"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/fetch-api";
import Link from "next/link";
import { MapPin } from "lucide-react";

export default function UserBookingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState<any[]>([]);

    // Refund Modal state
    const [refundingBooking, setRefundingBooking] = useState<any | null>(null);
    const [refundReason, setRefundReason] = useState("");
    const [submittingRefund, setSubmittingRefund] = useState(false);

    useEffect(() => {
        if (status === "loading") return;

        if (!session || session.user.role !== "USER") {
            router.push("/user");
            return;
        }

        const fetchBookings = async () => {
            try {
                const res = await fetchApi("/api/user/bookings");
                if (res.ok) {
                    const data = await res.json();
                    setBookings(data);
                }
            } catch (error) {
                console.error("Error fetching user bookings:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [session, status, router]);

    if (status === "loading" || loading) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>Loading bookings...</div>;
    }

    return (
        <div>
            <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "30px" }}>My Bookings</h1>

            {bookings.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", backgroundColor: "white", borderRadius: "12px", boxShadow: "var(--shadow-card)" }}>
                    <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>You haven't booked any rooms yet.</p>
                    <Link href="/dashboard/user/rooms" className="btn btn-primary">Browse Rooms</Link>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "25px" }}>
                    {bookings.map((booking: any) => {
                        const hasPassed = new Date(booking.endDate) < new Date();
                        return (
                            <div key={booking.id} style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", boxShadow: "var(--shadow-card)", display: "flex", flexDirection: "column" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                                    <h3 style={{ fontWeight: "bold", fontSize: "1.2rem", color: "var(--text-main)" }}>{booking.room.title}</h3>
                                    <span style={{
                                        padding: "4px 10px",
                                        borderRadius: "20px",
                                        fontSize: "0.8rem",
                                        fontWeight: "bold",
                                        backgroundColor: hasPassed ? "#E5E7EB" : "#D1FAE5",
                                        color: hasPassed ? "#6B7280" : "#065F46"
                                    }}>
                                        {hasPassed ? "Completed" : booking.status}
                                    </span>
                                </div>
                                <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "15px", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                                    <MapPin size={16} style={{ marginTop: "2px", flexShrink: 0 }} />
                                    <span>
                                        Hosted by {booking.room.seller.businessName || booking.room.seller.user.name} <br />
                                        {booking.room.seller.user.city} - {booking.room.seller.user.pincode}
                                    </span>
                                </div>
                                <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                                    <div style={{ flex: 1, backgroundColor: "#F9FAFB", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
                                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "5px" }}>Check In</div>
                                        <div style={{ fontWeight: "bold" }}>{new Date(booking.startDate).toLocaleDateString()}</div>
                                    </div>
                                    <div style={{ flex: 1, backgroundColor: "#F9FAFB", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
                                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "5px" }}>Check Out</div>
                                        <div style={{ fontWeight: "bold" }}>{new Date(booking.endDate).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <Link href={`/shop/${booking.room.seller.trackingId}`} style={{ display: "block", textAlign: "center", color: "var(--primary)", fontWeight: "500", padding: "10px", border: "1px solid var(--primary)", borderRadius: "8px" }}>
                                        Contact Host
                                    </Link>
                                    {booking.status === 'CONFIRMED' && !booking.refund && (
                                        <button
                                            onClick={() => setRefundingBooking(booking)}
                                            style={{ display: "block", width: "100%", textAlign: "center", color: "var(--coral, #F16F68)", fontWeight: "700", padding: "10px", border: "1px solid var(--coral, #F16F68)", borderRadius: "8px", background: "none", cursor: "pointer" }}
                                        >
                                            Request Refund
                                        </button>
                                    )}
                                    {booking.refund && (
                                        <div style={{ textAlign: "center", fontSize: "0.85rem", fontWeight: "bold", color: booking.refund.status === 'APPROVED' ? '#10B981' : booking.refund.status === 'REJECTED' ? '#EF4444' : '#F59E0B' }}>
                                            Refund Status: {booking.refund.status}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            {/* Refund Modal */}
            {refundingBooking && (() => {
                const start = new Date(refundingBooking.startDate);
                const end = new Date(refundingBooking.endDate);
                const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                const bookingAmount = nights * refundingBooking.room.price;

                return (
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
                            maxWidth: '500px',
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
                                    Request Stay Refund
                                </h3>
                                <button
                                    onClick={() => {
                                        setRefundingBooking(null);
                                        setRefundReason("");
                                    }}
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

                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    if (!refundingBooking || !refundReason.trim()) return;

                                    setSubmittingRefund(true);
                                    try {
                                        const res = await fetchApi("/api/refunds", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                bookingId: refundingBooking.id,
                                                amount: bookingAmount,
                                                reason: refundReason.trim()
                                            })
                                        });

                                        if (res.ok) {
                                            const data = await res.json();
                                            const newRefund = data.data || data;

                                            setBookings(current =>
                                                current.map(b => b.id === refundingBooking.id ? { ...b, refund: newRefund } : b)
                                            );

                                            alert("Refund request submitted successfully! Super Admin will review it.");
                                            setRefundingBooking(null);
                                            setRefundReason("");
                                        } else {
                                            const err = await res.json();
                                            alert(err.message || "Failed to submit refund request.");
                                        }
                                    } catch (error) {
                                        console.error("Refund request error:", error);
                                        alert("An error occurred. Please try again.");
                                    } finally {
                                        setSubmittingRefund(false);
                                    }
                                }}
                                style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}
                            >
                                <div style={{ backgroundColor: "#FFF8F7", padding: "12px 15px", borderRadius: "8px", border: "1px solid #FEE2E2" }}>
                                    <span style={{ display: "block", fontSize: "0.8rem", color: "#64748B", fontWeight: "600" }}>REFUNDABLE STAY AMOUNT ({nights} nights)</span>
                                    <strong style={{ fontSize: "1.4rem", color: "var(--coral, #F16F68)" }}>₹{bookingAmount}</strong>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontWeight: '700', fontSize: '0.95rem', color: '#334155' }}>
                                        Reason for Refund
                                    </label>
                                    <textarea
                                        value={refundReason}
                                        onChange={(e) => setRefundReason(e.target.value)}
                                        placeholder="Please provide details on why you are requesting a refund for this property stay..."
                                        required
                                        style={{
                                            width: '100%',
                                            minHeight: '100px',
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

                                <div style={{
                                    display: 'flex',
                                    gap: '12px',
                                    borderTop: '1px solid #F1F5F9',
                                    paddingTop: '20px'
                                }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRefundingBooking(null);
                                            setRefundReason("");
                                        }}
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
                                        disabled={submittingRefund || !refundReason.trim()}
                                        style={{
                                            flex: 1,
                                            padding: '12px',
                                            backgroundColor: 'var(--coral, #F16F68)',
                                            border: 'none',
                                            borderRadius: '10px',
                                            fontWeight: '700',
                                            color: 'white',
                                            cursor: 'pointer',
                                            opacity: submittingRefund ? 0.7 : 1
                                        }}
                                    >
                                        {submittingRefund ? "Submitting..." : "Submit Request"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
