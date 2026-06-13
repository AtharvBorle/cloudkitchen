"use client";
import { fetchApi } from "@/lib/fetch-api";


import { useState, useEffect } from "react";
import Link from "next/link";

export default function ManageRoomsPage() {
    const [rooms, setRooms] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [capacity, setCapacity] = useState("1");
    const [imageFile, setImageFile] = useState<File | null>(null);

    const fetchRooms = async () => {
        try {
            const res = await fetchApi("/api/seller/rooms");
            const data = await res.json();
            if (res.ok) {
                setRooms(data.rooms || []);
                setBookings(data.bookings || []);
            }
        } catch (error) {
            console.error("Failed to fetch rooms");
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append("title", title);
        formData.append("price", price);
        formData.append("description", description);
        formData.append("capacity", capacity);
        if (imageFile) formData.append("image", imageFile);

        try {
            const res = await fetchApi("/api/seller/rooms", {
                method: "POST",
                body: formData
            });

            if (res.ok) {
                setIsModalOpen(false);
                setTitle(""); setPrice(""); setDescription(""); setCapacity("1"); setImageFile(null);
                fetchRooms();
            } else {
                alert("Failed to add room");
            }
        } catch (error) {
            console.error("Error submitting form");
        } finally {
            setLoading(false);
        }
    };

    const toggleAvailability = async (roomId: string, currentStatus: boolean) => {
        try {
            const res = await fetchApi("/api/seller/rooms", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roomId, isAvailable: !currentStatus })
            });
            if (res.ok) fetchRooms();
        } catch (error) {
            console.error("Failed to update availability");
        }
    };

    const placeholderImage = "https://via.placeholder.com/400x250?text=No+Room+Image";

    const getFirstImage = (jsonStr: string) => {
        try {
            const arr = JSON.parse(jsonStr);
            return arr.length > 0 ? arr[0] : placeholderImage;
        } catch {
            return placeholderImage;
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '5px' }}>My Rooms</h1>
                    <Link href="/dashboard/seller" style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>← Back to Dashboard</Link>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn" style={{ backgroundColor: '#2C3E50', color: 'white', width: 'auto' }}>
                    + Add Room
                </button>
            </div>

            {/* Room List and Bookings Layout */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

                {/* Rooms Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
                    {rooms.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No rooms listed yet.</p>
                    ) : (
                        rooms.map(room => (
                            <div key={room.id} style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ position: 'relative', width: '100%', height: '200px', backgroundColor: '#EEE' }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={getFirstImage(room.images)} alt={room.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{room.title}</h3>
                                        <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.1rem' }}>₹{room.price}</span>
                                    </div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px', flex: 1 }}>{room.description}</p>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                        <button style={{ backgroundColor: '#2C3E50', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', fontSize: '0.85rem', cursor: 'pointer' }}>Delete</button>

                                        <button
                                            onClick={() => toggleAvailability(room.id, room.isAvailable)}
                                            style={{
                                                backgroundColor: room.isAvailable ? '#10b981' : '#f59e0b',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 15px',
                                                borderRadius: '4px',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {room.isAvailable ? 'Available (Online)' : 'Unavailable (Offline)'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Received Bookings Mock Section */}
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '20px' }}>Received Bookings</h2>
                    <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ backgroundColor: '#F8F9F9' }}>
                                <tr>
                                    <th style={{ padding: '15px 20px', borderBottom: '1px solid #EAEAEA' }}>Room</th>
                                    <th style={{ padding: '15px 20px', borderBottom: '1px solid #EAEAEA' }}>Customer</th>
                                    <th style={{ padding: '15px 20px', borderBottom: '1px solid #EAEAEA' }}>Dates</th>
                                    <th style={{ padding: '15px 20px', borderBottom: '1px solid #EAEAEA' }}>Amount</th>
                                    <th style={{ padding: '15px 20px', borderBottom: '1px solid #EAEAEA' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                                            No bookings received yet.
                                        </td>
                                    </tr>
                                ) : (
                                    bookings.map((booking: any) => {
                                        const start = new Date(booking.startDate);
                                        const end = new Date(booking.endDate);
                                        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

                                        // Price is estimated as room cost * days booked, logic can be adjusted later if db stores actual paid amount
                                        const estimatedAmount = (booking.room?.price || 1000) * (days === 0 ? 1 : days);

                                        return (
                                            <tr key={booking.id} style={{ borderBottom: '1px solid #EAEAEA' }}>
                                                <td style={{ padding: '15px 20px', fontWeight: '500' }}>{booking.room?.title || "Unknown Room"}</td>
                                                <td style={{ padding: '15px 20px' }}>
                                                    <div>{booking.user?.name || "Guest"}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>{booking.user?.phone || "No Phone"}</div>
                                                </td>
                                                <td style={{ padding: '15px 20px' }}>
                                                    <div style={{ fontSize: '0.9rem' }}>{start.toLocaleDateString()} to</div>
                                                    <div style={{ fontSize: '0.9rem' }}>{end.toLocaleDateString()}</div>
                                                </td>
                                                <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>₹{estimatedAmount}</td>
                                                <td style={{ padding: '15px 20px' }}>
                                                    <span style={{
                                                        padding: '4px 10px',
                                                        borderRadius: '12px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 'bold',
                                                        backgroundColor: booking.status === 'CONFIRMED' ? '#d1fae5' : '#fee2e2',
                                                        color: booking.status === 'CONFIRMED' ? '#059669' : '#dc2626'
                                                    }}>
                                                        {booking.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Add Room Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '500px', boxShadow: 'var(--shadow-card)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '20px' }}>Add Room for Rent</h2>

                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="input-field" placeholder="Room Title (e.g. Cozy Bedroom)" required />
                            </div>
                            <div className="input-group">
                                <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="input-field" placeholder="Price per night (₹)" required />
                            </div>
                            <div className="input-group">
                                <textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field" placeholder="Description & Amenities" rows={3} style={{ resize: 'none' }} required></textarea>
                            </div>

                            <div className="input-group">
                                <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} className="input-field" placeholder="Capacity (Persons)" min="1" required />
                            </div>

                            <div className="input-group" style={{ marginTop: '20px' }}>
                                <label style={{ fontSize: '0.9rem', marginBottom: '5px', display: 'block' }}>Images</label>
                                <input type="file" onChange={e => setImageFile(e.target.files?.[0] || null)} className="input-field" accept="image/*" />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '30px' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn" style={{ backgroundColor: '#E0E0E0', width: 'auto', color: '#333' }}>Cancel</button>
                                <button type="submit" className="btn btn-coral" style={{ width: 'auto' }} disabled={loading}>
                                    {loading ? "Saving..." : "Save Room"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
