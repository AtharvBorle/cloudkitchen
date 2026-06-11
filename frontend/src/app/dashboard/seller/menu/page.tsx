"use client";
import { fetchApi } from "@/lib/fetch-api";


import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function ManageMenuPage() {
    const [items, setItems] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form state
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [stockQuantity, setStockQuantity] = useState("-1");
    const [imageFile, setImageFile] = useState<File | null>(null);

    const fetchMenu = async () => {
        try {
            const res = await fetchApi("/api/seller/menu");
            const data = await res.json();
            if (res.ok) setItems(data.items);
        } catch (error) {
            console.error("Failed to fetch menu");
        }
    };

    useEffect(() => {
        fetchMenu();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const method = editingItemId ? "PUT" : "POST";
        const url = editingItemId ? `/api/seller/menu/${editingItemId}` : "/api/seller/menu";

        let bodyData: any;
        let headers: Record<string, string> = {};

        if (editingItemId) {
            // For PUT, we typically send JSON (assuming you don't need image update for MVP)
            bodyData = JSON.stringify({ name, price, description, stockQuantity: parseInt(stockQuantity) });
            headers["Content-Type"] = "application/json";
        } else {
            // For POST, use FormData for image
            const formData = new FormData();
            formData.append("name", name);
            formData.append("price", price);
            formData.append("description", description);
            formData.append("stockQuantity", stockQuantity);
            if (imageFile) formData.append("image", imageFile);
            bodyData = formData;
            // browser sets content type automatically for FormData
        }

        try {
            const res = await fetchApi(url, {
                method,
                headers,
                body: bodyData
            });

            if (res.ok) {
                closeModal();
                fetchMenu();
            } else {
                alert(`Failed to ${editingItemId ? 'update' : 'add'} item`);
            }
        } catch (error) {
            console.error("Error submitting form");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this menu item?")) return;
        try {
            const res = await fetchApi(`/api/seller/menu/${id}`, { method: "DELETE" });
            if (res.ok) fetchMenu();
            else alert("Failed to delete item.");
        } catch (error) {
            console.error("Delete error", error);
        }
    };

    const handleToggleStatus = async (item: any) => {
        try {
            const res = await fetchApi(`/api/seller/menu/${item.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isAvailable: !item.isAvailable })
            });
            if (res.ok) fetchMenu();
            else alert("Failed to change status.");
        } catch (error) {
            console.error("Status toggle error", error);
        }
    };

    const openEditModal = (item: any) => {
        setEditingItemId(item.id);
        setName(item.name);
        setPrice(item.price.toString());
        setDescription(item.description);
        setStockQuantity(item.stockQuantity?.toString() || "-1");
        setImageFile(null); // Assuming no image update for now
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItemId(null);
        setName(""); setPrice(""); setDescription(""); setStockQuantity("-1"); setImageFile(null);
    };

    // Generic placeholder if no image
    const placeholderImage = "https://via.placeholder.com/400x250?text=No+Image";

    return (
        <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '5px' }}>My Menu</h1>
                    <Link href="/dashboard/seller" style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>← Back to Dashboard</Link>
                </div>
                <button onClick={() => { closeModal(); setIsModalOpen(true); }} className="btn btn-coral" style={{ width: 'auto' }}>
                    + Add Item
                </button>
            </div>

            {/* Menu Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
                {items.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No items in your menu yet.</p>
                ) : (
                    items.map(item => (
                        <div key={item.id} style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ position: 'relative', width: '100%', height: '180px', backgroundColor: '#EEE' }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={item.imageUrl || placeholderImage} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{item.name}</h3>
                                    <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.1rem' }}>₹{item.price}</span>
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px', flex: 1 }}>{item.description}</p>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <button
                                        onClick={() => handleToggleStatus(item)}
                                        style={{
                                            backgroundColor: item.isAvailable ? '#E8F8F5' : '#FDE8E8',
                                            color: item.isAvailable ? 'var(--secondary)' : '#C81E1E',
                                            padding: '5px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', border: 'none', cursor: 'pointer'
                                        }}>
                                        {item.isAvailable ? 'Available' : 'Unavailable'}
                                    </button>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => openEditModal(item)} style={{ backgroundColor: '#E0E0E0', color: '#555', border: 'none', padding: '6px 15px', borderRadius: '4px', fontSize: '0.85rem', cursor: 'pointer' }}>Edit</button>
                                        <button onClick={() => handleDelete(item.id)} style={{ backgroundColor: '#FEE2E2', color: '#EF4444', border: 'none', padding: '6px 15px', borderRadius: '4px', fontSize: '0.85rem', cursor: 'pointer' }}>Delete</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Dish Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '500px', boxShadow: 'var(--shadow-card)' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '20px' }}>{editingItemId ? 'Edit Dish' : 'Add New Dish'}</h2>

                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="Dish Name" required />
                            </div>
                            <div className="input-group">
                                <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="input-field" placeholder="Price (₹)" required />
                            </div>
                            <div className="input-group">
                                <textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field" placeholder="Description" rows={3} style={{ resize: 'none' }} required></textarea>
                            </div>

                            <div className="input-group">
                                <label style={{ fontSize: '0.9rem', marginBottom: '5px', display: 'block', color: 'var(--text-main)' }}>Stock Quantity (-1 for unlimited):</label>
                                <input type="number" value={stockQuantity} onChange={e => setStockQuantity(e.target.value)} className="input-field" placeholder="Stock (-1 for no limit)" required />
                            </div>

                            <div className="input-group">
                                <label style={{ fontSize: '0.9rem', marginBottom: '5px', display: 'block' }}>Available Days:</label>
                                <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem' }}>
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                        <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <input type="checkbox" defaultChecked /> {day}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="input-group" style={{ marginTop: '20px' }}>
                                <label style={{ fontSize: '0.9rem', marginBottom: '5px', display: 'block' }}>Image</label>
                                <input type="file" onChange={e => setImageFile(e.target.files?.[0] || null)} className="input-field" accept="image/*" />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '30px' }}>
                                <button type="button" onClick={closeModal} className="btn" style={{ backgroundColor: '#CCC', width: 'auto', color: '#333' }}>Cancel</button>
                                <button type="submit" className="btn btn-coral" style={{ width: 'auto' }} disabled={loading}>
                                    {loading ? "Saving..." : (editingItemId ? "Update Item" : "Save Item")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
