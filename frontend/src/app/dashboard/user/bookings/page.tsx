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
                                <div style={{ marginTop: "auto" }}>
                                    <Link href={`/shop/${booking.room.seller.trackingId}`} style={{ display: "block", textAlign: "center", color: "var(--primary)", fontWeight: "500", padding: "10px", border: "1px solid var(--primary)", borderRadius: "8px" }}>
                                        Contact Host
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
