"use client";
import { fetchApi } from "@/lib/fetch-api";


import { useState, useEffect } from "react";
import Link from "next/link";
import CameraCaptureModal from "@/app/components/CameraCaptureModal";


export default function ManageRoomsPage() {
    const [rooms, setRooms] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [forbidden, setForbidden] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [editingRoom, setEditingRoom] = useState<any | null>(null);

    // Bookings Search, Filter, Pagination States
    const [bookingSearchQuery, setBookingSearchQuery] = useState("");
    const [bookingStatusFilter, setBookingStatusFilter] = useState("ALL");
    const [bookingCurrentPage, setBookingCurrentPage] = useState(1);
    const [bookingPageSize, setBookingPageSize] = useState(5);

    useEffect(() => {
        setBookingCurrentPage(1);
    }, [bookingSearchQuery, bookingStatusFilter]);

    // Form state
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [capacity, setCapacity] = useState("1");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [showCamera, setShowCamera] = useState(false);

    const handleCameraCapture = (file: File) => {
        setImageFile(file);
    };

    const fetchRooms = async () => {
        try {
            const res = await fetchApi("/api/seller/rooms");
            if (res.status === 403) {
                try {
                    const errData = await res.json();
                    setErrorMsg(errData.error || "Property subscription not active");
                } catch {
                    setErrorMsg("Property subscription not active");
                }
                setForbidden(true);
                return;
            }
            const data = await res.json();
            if (res.ok) {
                setForbidden(false);
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
        if (editingRoom) {
            formData.append("roomId", editingRoom.id);
        }

        try {
            const url = "/api/seller/rooms";
            const method = editingRoom ? "PATCH" : "POST";
            const res = await fetchApi(url, {
                method,
                body: formData
            });

            if (res.ok) {
                setIsModalOpen(false);
                setEditingRoom(null);
                setTitle(""); setPrice(""); setDescription(""); setCapacity("1"); setImageFile(null);
                fetchRooms();
            } else {
                alert(editingRoom ? "Failed to update room" : "Failed to add room");
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

    const handleUpdateBookingStatus = async (bookingId: string, status: 'CONFIRMED' | 'CANCELLED') => {
        try {
            const res = await fetchApi("/api/seller/rooms/bookings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookingId, status })
            });
            if (res.ok) {
                fetchRooms();
            } else {
                const err = await res.json();
                alert(err.error || "Failed to update booking status");
            }
        } catch (error) {
            console.error("Failed to update booking status", error);
            alert("An error occurred");
        }
    };

    const placeholderImage = "https://placehold.co/400x250?text=No+Room+Image";

    const getFirstImage = (jsonStr: string) => {
        try {
            const arr = JSON.parse(jsonStr);
            return arr.length > 0 ? arr[0] : placeholderImage;
        } catch {
            return placeholderImage;
        }
    };

    const filteredBookings = bookings.filter((booking: any) => {
        const matchesStatus = bookingStatusFilter === "ALL" || booking.status === bookingStatusFilter;

        const roomTitle = (booking.room?.title || "").toLowerCase();
        const customerName = (booking.user?.name || "").toLowerCase();
        const customerPhone = (booking.user?.phone || "").toLowerCase();
        const id = (booking.id || "").toLowerCase();

        const searchLower = bookingSearchQuery.toLowerCase().trim();
        const matchesSearch = !searchLower ||
            roomTitle.includes(searchLower) ||
            customerName.includes(searchLower) ||
            customerPhone.includes(searchLower) ||
            id.includes(searchLower);

        return matchesStatus && matchesSearch;
    });

    const totalBookingPages = Math.ceil(filteredBookings.length / bookingPageSize);
    const paginatedBookings = filteredBookings.slice((bookingCurrentPage - 1) * bookingPageSize, bookingCurrentPage * bookingPageSize);

    if (forbidden) {
        return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "65vh", backgroundColor: "#f8fafc", padding: "1.25rem", textAlign: "center" }}>
                <div style={{ backgroundColor: "white", padding: "2.5rem 1.5rem", borderRadius: "24px", boxShadow: "0 20px 50px rgba(0,0,0,0.05)", maxWidth: "480px", width: "100%", border: "1px solid #F1F5F9" }}>
                    <div style={{ width: "72px", height: "72px", borderRadius: "50%", backgroundColor: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    </div>
                    <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0f172a", marginBottom: "0.75rem", letterSpacing: "-0.5px" }}>Property Category Locked</h1>
                    <p style={{ color: "#64748b", marginBottom: "2rem", lineHeight: "1.6", fontSize: "0.95rem" }}>
                        {errorMsg || "Access to the room listing dashboard requires an approved Property Category application and an active subscription."}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <button
                            onClick={() => {
                                window.dispatchEvent(new CustomEvent("open-category-upgrade", { detail: { category: "PROPERTY" } }));
                            }}
                            className="btn btn-coral"
                            style={{ padding: "14px", borderRadius: "12px", border: "none", fontWeight: "700", fontSize: "1.05rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                        >
                            Apply / Upgrade Property Category
                        </button>
                        <Link href="/dashboard/seller" className="btn" style={{ padding: "14px", border: "1px solid #cbd5e1", borderRadius: "12px", textDecoration: "none", fontWeight: "700", fontSize: "1.05rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "#475569" }}>
                            Go to Overview
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '5px' }}>My Rooms</h1>
                    <Link href="/dashboard/seller" style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>← Back to Dashboard</Link>
                </div>
                <button onClick={() => {
                    setEditingRoom(null);
                    setTitle(""); setPrice(""); setDescription(""); setCapacity("1"); setImageFile(null);
                    setIsModalOpen(true);
                }} className="btn" style={{ backgroundColor: '#2C3E50', color: 'white', width: 'auto' }}>
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

                                    <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                                        <button
                                            onClick={() => {
                                                setEditingRoom(room);
                                                setTitle(room.title);
                                                setPrice(room.price.toString());
                                                setDescription(room.description || "");
                                                setCapacity(room.capacity.toString());
                                                setImageFile(null);
                                                setIsModalOpen(true);
                                            }}
                                            style={{
                                                backgroundColor: '#3B82F6',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 15px',
                                                borderRadius: '4px',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                flex: 1
                                            }}
                                        >
                                            Edit
                                        </button>

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
                                                fontWeight: 'bold',
                                                flex: 1
                                            }}
                                        >
                                            {room.isAvailable ? 'Online' : 'Offline'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Received Bookings Section */}
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '20px' }}>Received Bookings</h2>

                    {/* Filter controls */}
                    {bookings.length > 0 && (
                        <div style={{ display: "flex", gap: "15px", backgroundColor: "white", padding: "15px", borderRadius: "12px", boxShadow: "var(--shadow-card)", border: "1px solid #F1F5F9", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
                            <div style={{ flex: 1, minWidth: "200px" }}>
                                <input
                                    type="text"
                                    placeholder="Search bookings by room title, customer name, phone..."
                                    value={bookingSearchQuery}
                                    onChange={(e) => setBookingSearchQuery(e.target.value)}
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
                                    value={bookingStatusFilter}
                                    onChange={(e) => setBookingStatusFilter(e.target.value)}
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
                                ) : filteredBookings.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                                            No bookings match your search criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedBookings.map((booking: any) => {
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
                                                     <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                                                         <span style={{
                                                             padding: '4px 10px',
                                                             borderRadius: '12px',
                                                             fontSize: '0.8rem',
                                                             fontWeight: 'bold',
                                                             backgroundColor: booking.status === 'CONFIRMED' ? '#d1fae5' : booking.status === 'PENDING' ? '#fef3c7' : '#fee2e2',
                                                             color: booking.status === 'CONFIRMED' ? '#059669' : booking.status === 'PENDING' ? '#d97706' : '#dc2626'
                                                         }}>
                                                             {booking.status}
                                                         </span>
                                                         {booking.status === 'PENDING' && (
                                                             <div style={{ display: 'flex', gap: '6px' }}>
                                                                 <button
                                                                     onClick={() => handleUpdateBookingStatus(booking.id, 'CONFIRMED')}
                                                                     style={{
                                                                         backgroundColor: '#10b981',
                                                                         color: 'white',
                                                                         border: 'none',
                                                                         padding: '4px 10px',
                                                                         borderRadius: '6px',
                                                                         fontSize: '0.75rem',
                                                                         fontWeight: '700',
                                                                         cursor: 'pointer',
                                                                         boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                                         transition: 'background-color 0.15s'
                                                                     }}
                                                                     onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
                                                                     onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#10b981')}
                                                                 >
                                                                     Confirm
                                                                 </button>
                                                                 <button
                                                                     onClick={() => handleUpdateBookingStatus(booking.id, 'CANCELLED')}
                                                                     style={{
                                                                         backgroundColor: '#ef4444',
                                                                         color: 'white',
                                                                         border: 'none',
                                                                         padding: '4px 10px',
                                                                         borderRadius: '6px',
                                                                         fontSize: '0.75rem',
                                                                         fontWeight: '700',
                                                                         cursor: 'pointer',
                                                                         boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                                         transition: 'background-color 0.15s'
                                                                     }}
                                                                     onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
                                                                     onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ef4444')}
                                                                 >
                                                                     Reject
                                                                 </button>
                                                             </div>
                                                         )}
                                                     </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {filteredBookings.length > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "15px", padding: "15px 20px", backgroundColor: "white", borderRadius: "8px", boxShadow: "var(--shadow-card)" }}>
                            <button
                                disabled={bookingCurrentPage === 1}
                                onClick={() => setBookingCurrentPage(prev => Math.max(prev - 1, 1))}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: "6px",
                                    border: "1px solid #E2E8F0",
                                    backgroundColor: bookingCurrentPage === 1 ? "#F1F5F9" : "white",
                                    color: bookingCurrentPage === 1 ? "#94A3B8" : "#475569",
                                    fontSize: "0.85rem",
                                    fontWeight: "700",
                                    cursor: bookingCurrentPage === 1 ? "not-allowed" : "pointer"
                                }}
                            >
                                Previous
                            </button>
                            <span style={{ fontSize: "0.9rem", color: "#64748B", fontWeight: "600" }}>
                                Page {bookingCurrentPage} of {Math.max(totalBookingPages, 1)}
                            </span>
                            <button
                                disabled={bookingCurrentPage === totalBookingPages || totalBookingPages === 0}
                                onClick={() => setBookingCurrentPage(prev => Math.min(prev + 1, totalBookingPages))}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: "6px",
                                    border: "1px solid #E2E8F0",
                                    backgroundColor: (bookingCurrentPage === totalBookingPages || totalBookingPages === 0) ? "#F1F5F9" : "white",
                                    color: (bookingCurrentPage === totalBookingPages || totalBookingPages === 0) ? "#94A3B8" : "#475569",
                                    fontSize: "0.85rem",
                                    fontWeight: "700",
                                    cursor: (bookingCurrentPage === totalBookingPages || totalBookingPages === 0) ? "not-allowed" : "pointer"
                                }}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>

            </div>

            {/* Add Room Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '500px', boxShadow: 'var(--shadow-card)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '20px' }}>{editingRoom ? "Edit Room Details" : "Add Room for Rent"}</h2>

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
                                <label style={{ fontSize: '0.9rem', marginBottom: '5px', display: 'block' }}>Image</label>
                                {editingRoom && <span style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: '5px' }}>Leave empty to keep the current image</span>}
                                {!imageFile ? (
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <label style={{ flex: 1, padding: "10px", backgroundColor: "#f8fafc", color: "#475569", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "bold", textAlign: "center", border: "1px dashed #cbd5e1" }}>
                                            Upload Photo
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                                style={{ display: "none" }}
                                            />
                                        </label>
                                        <button type="button" onClick={() => setShowCamera(true)} className="btn" style={{ flex: 1, padding: '10px', backgroundColor: '#f8fafc', color: '#334155', border: '1px dashed #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            Take Live Photo
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                                        <img src={URL.createObjectURL(imageFile)} alt="Room" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                                        <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.9rem', color: '#334155' }}>
                                            {imageFile.name}
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <label style={{ padding: '6px 12px', backgroundColor: '#e2e8f0', color: '#334155', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                                Change File
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                                    style={{ display: "none" }}
                                                />
                                            </label>
                                            <button type="button" onClick={() => setShowCamera(true)} style={{ padding: '6px 12px', backgroundColor: '#e2e8f0', color: '#334155', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', border: 'none' }}>Retake Photo</button>
                                            <button type="button" onClick={() => setImageFile(null)} style={{ padding: '6px 12px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>Remove</button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '30px' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn" style={{ backgroundColor: '#E0E0E0', width: 'auto', color: '#333' }}>Cancel</button>
                                <button type="submit" className="btn btn-coral" style={{ width: 'auto' }} disabled={loading}>
                                    {loading ? "Saving..." : (editingRoom ? "Update Room" : "Save Room")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showCamera && <CameraCaptureModal onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} skipWatermark={true} />}
        </div>
    );
}
