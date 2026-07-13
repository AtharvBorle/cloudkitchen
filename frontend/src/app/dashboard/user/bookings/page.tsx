"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/fetch-api";
import Link from "next/link";
import { MapPin } from "lucide-react";
import Script from "next/script";

const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
        if ((window as any).Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.id = "razorpay-checkout-script";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

export default function UserBookingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState<any[]>([]);

    // Search, filter, pagination states
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(6);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter]);


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

    const handlePayBookingNow = async (booking: any) => {
        try {
            const res = await fetchApi(`/api/user/bookings/${booking.id}/pay`, {
                method: "POST"
            });
            if (!res.ok) {
                const err = await res.json();
                alert(err.error || "Failed to initiate booking payment");
                return;
            }

            const data = await res.json();
            const razorpayOrder = data.razorpayOrder;

            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                alert("Failed to load Razorpay SDK. Please check your internet connection.");
                return;
            }
            
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_SBd0GNxh5TYLm3",
                amount: razorpayOrder.amount,
                currency: "INR",
                name: "Neo Cloud Room",
                description: `Room Booking Payment - ${booking.room.title}`,
                order_id: razorpayOrder.id,
                handler: async function (response: any) {
                    try {
                        const verifyRes = await fetchApi(`/api/user/bookings/${booking.id}/verify`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        if (verifyRes.ok) {
                            alert("Payment successful!");
                            window.location.reload();
                        } else {
                            const verifyData = await verifyRes.json();
                            alert(verifyData.message || "Payment verification failed.");
                        }
                    } catch (e) {
                        alert("An error occurred during payment verification.");
                    }
                },
                prefill: {
                    contact: session?.user?.phone || ""
                },
                theme: {
                    color: "#16a34a"
                }
            };
            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error("Booking payment failed:", error);
            alert("An error occurred while preparing checkout.");
        }
    };

    if (status === "loading" || loading) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>Loading bookings...</div>;
    }

    const filteredBookings = bookings.filter((booking: any) => {
        const hasPassed = new Date(booking.endDate) < new Date();
        const displayStatus = hasPassed ? "COMPLETED" : booking.status;

        const matchesStatus = statusFilter === "ALL" || displayStatus === statusFilter;

        const roomTitle = booking.room.title?.toLowerCase() || "";
        const hostName = (booking.room.seller.businessName || booking.room.seller.user.name || "").toLowerCase();
        const city = booking.room.seller.user.city?.toLowerCase() || "";
        const id = booking.id?.toLowerCase() || "";

        const searchLower = searchQuery.toLowerCase().trim();
        const matchesSearch = !searchLower ||
            roomTitle.includes(searchLower) ||
            hostName.includes(searchLower) ||
            city.includes(searchLower) ||
            id.includes(searchLower);

        return matchesStatus && matchesSearch;
    });

    const totalPages = Math.ceil(filteredBookings.length / pageSize);
    const paginatedBookings = filteredBookings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div>
            <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "30px" }}>My Bookings</h1>

            {/* Filter controls */}
            {bookings.length > 0 && (
                <div style={{ display: "flex", gap: "15px", backgroundColor: "white", padding: "15px", borderRadius: "12px", boxShadow: "var(--shadow-card)", border: "1px solid #F1F5F9", marginBottom: "24px", flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ flex: 1, minWidth: "200px" }}>
                        <input
                            type="text"
                            placeholder="Search by room title, host, city, booking ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px 12px",
                                borderRadius: "8px",
                                border: "1px solid #CBD5E1",
                                fontSize: "0.85rem",
                                outline: "none"
                            }}
                        />
                    </div>
                    <div style={{ minWidth: "150px" }}>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px 12px",
                                borderRadius: "8px",
                                border: "1px solid #CBD5E1",
                                fontSize: "0.85rem",
                                outline: "none",
                                fontWeight: "600",
                                backgroundColor: "white",
                                color: "#334155"
                            }}
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="PENDING">Pending</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                </div>
            )}

            {bookings.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", backgroundColor: "white", borderRadius: "12px", boxShadow: "var(--shadow-card)" }}>
                    <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>You haven't booked any rooms yet.</p>
                    <Link href="/dashboard/user/rooms" className="btn btn-primary">Browse Rooms</Link>
                </div>
            ) : filteredBookings.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", backgroundColor: "white", borderRadius: "12px", boxShadow: "var(--shadow-card)" }}>
                    <p style={{ color: "var(--text-muted)" }}>No bookings match your search criteria.</p>
                </div>
            ) : (
                <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "25px", marginBottom: "30px" }}>
                        {paginatedBookings.map((booking: any) => {
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
                                            backgroundColor: hasPassed ? "#E5E7EB" : (booking.status === "CONFIRMED" ? "#D1FAE5" : booking.status === "PENDING" ? "#FEF3C7" : "#FEE2E2"),
                                            color: hasPassed ? "#6B7280" : (booking.status === "CONFIRMED" ? "#065F46" : booking.status === "PENDING" ? "#D97706" : "#DC2626")
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
                                        <div style={{ fontSize: "0.85rem", margin: "5px 0", padding: "10px", borderRadius: "8px", backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                                <span style={{ color: "#64748B" }}>Payment Method:</span>
                                                <span style={{ fontWeight: "600", color: "#334155" }}>
                                                    {booking.paymentMethod === "COD" ? "Pay on Check-in/out" : "Pay Online"}
                                                </span>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                                <span style={{ color: "#64748B" }}>Amount:</span>
                                                <span style={{ fontWeight: "700", color: "#0F172A" }}>
                                                    ₹{booking.totalAmount}
                                                </span>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ color: "#64748B" }}>Payment Status:</span>
                                                <span style={{ fontWeight: "bold", color: booking.isPaid ? "#16A34A" : "#F59E0B" }}>
                                                    {booking.isPaid ? "Paid" : "Unpaid"}
                                                </span>
                                            </div>
                                        </div>

                                        <Link href={`/shop/${booking.room.seller.trackingId}`} style={{ display: "block", textAlign: "center", color: "var(--primary)", fontWeight: "500", padding: "10px", border: "1px solid var(--primary)", borderRadius: "8px" }}>
                                            Contact Host
                                        </Link>

                                        {booking.status === 'CONFIRMED' && booking.paymentMethod === 'COD' && !booking.isPaid && (
                                            <button
                                                onClick={() => handlePayBookingNow(booking)}
                                                style={{
                                                    display: "block",
                                                    width: "100%",
                                                    textAlign: "center",
                                                    backgroundColor: "var(--primary)",
                                                    color: "white",
                                                    fontWeight: "bold",
                                                    padding: "10px",
                                                    border: "none",
                                                    borderRadius: "8px",
                                                    cursor: "pointer",
                                                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                                    transition: "background-color 0.2s"
                                                }}
                                                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#15803d")}
                                                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "var(--primary)")}
                                            >
                                                Pay Now
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

                    {/* Pagination Controls */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", backgroundColor: "white", borderRadius: "12px", boxShadow: "var(--shadow-card)" }}>
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            style={{
                                padding: "8px 16px",
                                borderRadius: "8px",
                                border: "1px solid #E2E8F0",
                                backgroundColor: currentPage === 1 ? "#F1F5F9" : "white",
                                color: currentPage === 1 ? "#94A3B8" : "#475569",
                                fontSize: "0.85rem",
                                fontWeight: "700",
                                cursor: currentPage === 1 ? "not-allowed" : "pointer"
                            }}
                        >
                            Previous
                        </button>
                        <span style={{ fontSize: "0.9rem", color: "#64748B", fontWeight: "600" }}>
                            Page {currentPage} of {Math.max(totalPages, 1)}
                        </span>
                        <button
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            style={{
                                padding: "8px 16px",
                                borderRadius: "8px",
                                border: "1px solid #E2E8F0",
                                backgroundColor: (currentPage === totalPages || totalPages === 0) ? "#F1F5F9" : "white",
                                color: (currentPage === totalPages || totalPages === 0) ? "#94A3B8" : "#475569",
                                fontSize: "0.85rem",
                                fontWeight: "700",
                                cursor: (currentPage === totalPages || totalPages === 0) ? "not-allowed" : "pointer"
                            }}
                        >
                            Next
                        </button>
                    </div>
                </>
            )}

        </div>
    );
}
