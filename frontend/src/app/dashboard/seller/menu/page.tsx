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
    const [pincodeList, setPincodeList] = useState<string[]>([]);
    const [pincodeInput, setPincodeInput] = useState("");
    const [placeNameInput, setPlaceNameInput] = useState("");
    const [servedPincodes, setServedPincodes] = useState<any[]>([]);
    const [addingPincode, setAddingPincode] = useState(false);
    const [sellerFoodType, setSellerFoodType] = useState("BOTH");
    const [itemType, setItemType] = useState("VEG");
    const [foodCategories, setFoodCategories] = useState<any[]>([]);
    const [foodCategoryId, setFoodCategoryId] = useState("");
    const [foodSubCategoryId, setFoodSubCategoryId] = useState("");
    const [openTime, setOpenTime] = useState("");
    const [closeTime, setCloseTime] = useState("");
    const [dailyHours, setDailyHours] = useState<Record<string, { isOpen: boolean, openTime: string, closeTime: string }>>({
        Mon: { isOpen: true, openTime: "08:00", closeTime: "22:00" },
        Tue: { isOpen: true, openTime: "08:00", closeTime: "22:00" },
        Wed: { isOpen: true, openTime: "08:00", closeTime: "22:00" },
        Thu: { isOpen: true, openTime: "08:00", closeTime: "22:00" },
        Fri: { isOpen: true, openTime: "08:00", closeTime: "22:00" },
        Sat: { isOpen: true, openTime: "08:00", closeTime: "22:00" },
        Sun: { isOpen: true, openTime: "08:00", closeTime: "22:00" }
    });

    const handleDailyHoursChange = (day: string, field: 'isOpen' | 'openTime' | 'closeTime', value: any) => {
        setDailyHours(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                [field]: value
            }
        }));
    };

    const fetchMenu = async () => {
        try {
            const res = await fetchApi("/api/seller/menu");
            const data = await res.json();
            if (res.ok) {
                setItems(data.items || []);
                setServedPincodes(data.servedPincodes || []);
                setSellerFoodType(data.foodType || "BOTH");
                setFoodCategories(data.foodCategories || []);
            }
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

        const formData = new FormData();
        formData.append("name", name);
        formData.append("price", price);
        formData.append("description", description);
        formData.append("stockQuantity", stockQuantity);
        
        const deliveryPincodesStr = pincodeList.join(", ");
        formData.append("deliveryPincodes", deliveryPincodesStr);
        if (openTime) formData.append("openTime", openTime);
        if (closeTime) formData.append("closeTime", closeTime);
        formData.append("operationalHours", JSON.stringify(dailyHours));
        formData.append("itemType", sellerFoodType === "VEG" ? "VEG" : itemType);
        if (foodCategoryId) formData.append("foodCategoryId", foodCategoryId);
        if (foodSubCategoryId) formData.append("foodSubCategoryId", foodSubCategoryId);
        
        if (imageFile) {
            formData.append("image", imageFile);
        }

        try {
            const res = await fetchApi(url, {
                method,
                body: formData
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
        setPincodeList(item.deliveryPincodes ? item.deliveryPincodes.split(",").map((p: string) => p.trim()) : []);
        setOpenTime(item.openTime || "");
        setCloseTime(item.closeTime || "");
        if (item.operationalHours) {
            try {
                const hours = typeof item.operationalHours === 'string'
                    ? JSON.parse(item.operationalHours)
                    : item.operationalHours;
                setDailyHours(hours);
            } catch (e) {
                console.error("Failed to parse operationalHours on edit", e);
            }
        } else {
            setDailyHours({
                Mon: { isOpen: true, openTime: item.openTime || "08:00", closeTime: item.closeTime || "22:00" },
                Tue: { isOpen: true, openTime: item.openTime || "08:00", closeTime: item.closeTime || "22:00" },
                Wed: { isOpen: true, openTime: item.openTime || "08:00", closeTime: item.closeTime || "22:00" },
                Thu: { isOpen: true, openTime: item.openTime || "08:00", closeTime: item.closeTime || "22:00" },
                Fri: { isOpen: true, openTime: item.openTime || "08:00", closeTime: item.closeTime || "22:00" },
                Sat: { isOpen: true, openTime: item.openTime || "08:00", closeTime: item.closeTime || "22:00" },
                Sun: { isOpen: true, openTime: item.openTime || "08:00", closeTime: item.closeTime || "22:00" }
            });
        }
        setImageFile(null); // Assuming no image update for now
        setItemType(item.itemType || "VEG");
        setFoodCategoryId(item.foodCategoryId || "");
        setFoodSubCategoryId(item.foodSubCategoryId || "");
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItemId(null);
        setName(""); setPrice(""); setDescription(""); setStockQuantity("-1"); setImageFile(null);
        setPincodeList([]);
        setItemType("VEG");
        setFoodCategoryId("");
        setFoodSubCategoryId("");
        setOpenTime("");
        setCloseTime("");
        setDailyHours({
            Mon: { isOpen: true, openTime: "08:00", closeTime: "22:00" },
            Tue: { isOpen: true, openTime: "08:00", closeTime: "22:00" },
            Wed: { isOpen: true, openTime: "08:00", closeTime: "22:00" },
            Thu: { isOpen: true, openTime: "08:00", closeTime: "22:00" },
            Fri: { isOpen: true, openTime: "08:00", closeTime: "22:00" },
            Sat: { isOpen: true, openTime: "08:00", closeTime: "22:00" },
            Sun: { isOpen: true, openTime: "08:00", closeTime: "22:00" }
        });
        setPincodeInput("");
        setPlaceNameInput("");
    };

    // Generic placeholder if no image
    const placeholderImage = "https://placehold.co/400x250?text=No+Image";

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
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        {item.name}
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.7rem',
                                            fontWeight: 'bold',
                                            color: 'white',
                                            backgroundColor: item.itemType === 'NON_VEG' ? '#EF4444' : '#10B981'
                                        }}>
                                            {item.itemType === 'NON_VEG' ? 'Non-Veg' : 'Veg'}
                                        </span>
                                    </h3>
                                    {item.foodCategory && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '2px', marginBottom: '5px', width: '100%' }}>
                                            <span style={{ backgroundColor: '#E0F2FE', color: '#0369A1', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                📁 {item.foodCategory.name}
                                            </span>
                                            {item.foodSubCategory && (
                                                <span style={{ backgroundColor: '#F0FDF4', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                    🏷️ {item.foodSubCategory.name}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.1rem' }}>₹{item.price}</span>
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '10px', flex: 1 }}>{item.description}</p>
                                <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid #EEE', paddingTop: '10px' }}>
                                    <div><strong>Stock:</strong> {item.stockQuantity === -1 ? 'Unlimited' : item.stockQuantity === 0 ? 'Out of Stock (0)' : item.stockQuantity}</div>
                                    <div style={{ marginTop: '5px', marginBottom: '5px' }}>
                                        <strong>Operational Hours:</strong>
                                        <div style={{ marginTop: '3px', display: 'flex', flexDirection: 'column', gap: '2px', backgroundColor: '#F8FAFC', padding: '6px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', maxHeight: '100px', overflowY: 'auto' }}>
                                            {item.operationalHours ? (
                                                (() => {
                                                    try {
                                                        const hours = typeof item.operationalHours === 'string' ? JSON.parse(item.operationalHours) : item.operationalHours;
                                                        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                                                            const d = hours[day];
                                                            const dayName = day === 'Mon' ? 'Monday' : day === 'Tue' ? 'Tuesday' : day === 'Wed' ? 'Wednesday' : day === 'Thu' ? 'Thursday' : day === 'Fri' ? 'Friday' : day === 'Sat' ? 'Saturday' : 'Sunday';
                                                            return (
                                                                <div key={day} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                                                    <span>{dayName}:</span>
                                                                    <span style={{ fontWeight: 'bold', color: d?.isOpen ? '#10B981' : '#EF4444' }}>
                                                                        {d?.isOpen ? `${d.openTime} - ${d.closeTime}` : 'Closed'}
                                                                    </span>
                                                                </div>
                                                            );
                                                        });
                                                    } catch {
                                                        return <span style={{ fontSize: '0.75rem', color: '#EF4444' }}>Error parsing hours</span>;
                                                    }
                                                })()
                                            ) : (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                                    <span>Daily:</span>
                                                    <span style={{ fontWeight: 'bold', color: (item.openTime && item.closeTime) ? '#10B981' : '#10B981' }}>
                                                        {item.openTime && item.closeTime ? `${item.openTime} - ${item.closeTime}` : 'Always Open'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={
                                        item.deliveryPincodes ? item.deliveryPincodes.split(",").map((p: string) => {
                                            const pin = p.trim();
                                            const found = servedPincodes.find(sp => sp.pincode === pin);
                                            return found ? `${pin} (${found.name})` : pin;
                                        }).join(", ") : "Default (Local Pincode only)"
                                    }>
                                        <strong>Delivery Pincodes:</strong> {
                                            item.deliveryPincodes ? item.deliveryPincodes.split(",").map((p: string) => {
                                                const pin = p.trim();
                                                const found = servedPincodes.find(sp => sp.pincode === pin);
                                                return found ? `${pin} (${found.name})` : pin;
                                            }).join(", ") : "Default (Local Pincode only)"
                                        }
                                    </div>
                                </div>

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
                    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '500px', boxShadow: 'var(--shadow-card)', maxHeight: '90vh', overflowY: 'auto' }}>
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
                                <label style={{ fontSize: '0.9rem', marginBottom: '5px', display: 'block', color: 'var(--text-main)', fontWeight: 'bold' }}>Food Type:</label>
                                {sellerFoodType === "VEG" ? (
                                    <div style={{ padding: '8px 12px', backgroundColor: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                        Veg (Default for Veg Only Seller)
                                    </div>
                                ) : (
                                    <select value={itemType} onChange={e => setItemType(e.target.value)} className="input-field" required style={{ appearance: 'auto' }}>
                                        <option value="VEG">Veg</option>
                                        <option value="NON_VEG">Non-Veg</option>
                                    </select>
                                )}
                            </div>

                            {/* Food Category Dropdowns */}
                            <div className="input-group">
                                <label style={{ fontSize: '0.9rem', marginBottom: '5px', display: 'block', color: 'var(--text-main)', fontWeight: 'bold' }}>Food Category:</label>
                                <select
                                    value={foodCategoryId}
                                    onChange={(e) => {
                                        setFoodCategoryId(e.target.value);
                                        setFoodSubCategoryId("");
                                    }}
                                    className="input-field"
                                    style={{ appearance: 'auto' }}
                                >
                                    <option value="">Select Category...</option>
                                    {foodCategories.map((fc) => (
                                        <option key={fc.id} value={fc.id}>{fc.name}</option>
                                    ))}
                                </select>
                            </div>

                            {foodCategoryId && (
                                <div className="input-group">
                                    <label style={{ fontSize: '0.9rem', marginBottom: '5px', display: 'block', color: 'var(--text-main)', fontWeight: 'bold' }}>Food Sub-Category:</label>
                                    <select
                                        value={foodSubCategoryId}
                                        onChange={(e) => setFoodSubCategoryId(e.target.value)}
                                        className="input-field"
                                        style={{ appearance: 'auto' }}
                                    >
                                        <option value="">Select Sub-Category...</option>
                                        {(foodCategories.find((fc) => fc.id === foodCategoryId)?.subCategories || []).map((sub: any) => (
                                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="input-group">
                                <label style={{ fontSize: '0.9rem', marginBottom: '5px', display: 'block', color: 'var(--text-main)', fontWeight: 'bold' }}>
                                    Select Centralized Delivery Pincodes:
                                </label>
                                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '10px', backgroundColor: '#F8FAFC', marginBottom: '15px' }}>
                                    {servedPincodes.length === 0 ? (
                                        <p style={{ fontSize: '0.85rem', color: '#94A3B8', fontStyle: 'italic', margin: 0 }}>No centralized pincodes added yet. Add one below!</p>
                                    ) : (
                                        servedPincodes.map(sp => (
                                            <div key={sp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-main)', cursor: 'pointer', flex: 1, userSelect: 'none' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={pincodeList.includes(sp.pincode)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setPincodeList([...pincodeList, sp.pincode]);
                                                            } else {
                                                                setPincodeList(pincodeList.filter(p => p !== sp.pincode));
                                                            }
                                                        }}
                                                    />
                                                    <strong>{sp.pincode}</strong> - {sp.name}
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        if (confirm(`Remove ${sp.pincode} (${sp.name}) from centralized list?`)) {
                                                            try {
                                                                const deleteRes = await fetchApi(`/api/seller/menu/pincodes/${sp.id}`, { method: 'DELETE' });
                                                                if (deleteRes.ok) {
                                                                    setServedPincodes(servedPincodes.filter(p => p.id !== sp.id));
                                                                    setPincodeList(pincodeList.filter(p => p !== sp.pincode));
                                                                } else {
                                                                    alert("Failed to delete pincode");
                                                                }
                                                            } catch (err) {
                                                                console.error(err);
                                                            }
                                                        }
                                                    }}
                                                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.8rem', padding: '2px 6px' }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <label style={{ fontSize: '0.9rem', marginBottom: '5px', display: 'block', color: 'var(--text-main)', fontWeight: 'bold' }}>
                                    Add New Centralized Pincode:
                                </label>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        value={pincodeInput}
                                        onChange={e => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                                        placeholder="Pincode (e.g. 411028)"
                                        style={{ flex: 1, padding: '8px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }}
                                    />
                                    <input
                                        type="text"
                                        value={placeNameInput}
                                        onChange={e => setPlaceNameInput(e.target.value)}
                                        placeholder="Place Name (e.g. Hadapsar)"
                                        style={{ flex: 1.5, padding: '8px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const pin = pincodeInput.trim();
                                            const name = placeNameInput.trim();
                                            if (!pin || !name) {
                                                alert("Please enter both Pincode and Place Name");
                                                return;
                                            }
                                            setAddingPincode(true);
                                            try {
                                                const addRes = await fetchApi('/api/seller/menu/pincodes', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ pincode: pin, name })
                                                });
                                                const resData = await addRes.json();
                                                if (addRes.ok) {
                                                    const newPin = resData.pincode || resData;
                                                    setServedPincodes([...servedPincodes, newPin]);
                                                    if (!pincodeList.includes(pin)) {
                                                        setPincodeList([...pincodeList, pin]);
                                                    }
                                                    setPincodeInput("");
                                                    setPlaceNameInput("");
                                                } else {
                                                    alert(resData.message || "Failed to add pincode");
                                                }
                                            } catch (err) {
                                                console.error("Error adding pincode", err);
                                            } finally {
                                                setAddingPincode(false);
                                            }
                                        }}
                                        disabled={addingPincode}
                                        className="btn btn-secondary"
                                        style={{ width: 'auto', padding: '8px 15px', whiteSpace: 'nowrap', fontSize: '0.9rem', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        {addingPincode ? '...' : 'Add'}
                                    </button>
                                </div>

                                <div style={{ marginTop: '20px', borderTop: '1px solid #E2E8F0', paddingTop: '15px' }}>
                                    <label style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '10px', display: 'block', color: 'var(--text-main)' }}>
                                        Day-wise Operational Hours:
                                    </label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                                            const dayData = dailyHours[day] || { isOpen: false, openTime: '08:00', closeTime: '22:00' };
                                            return (
                                                <div key={day} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '10px' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '0.9rem', width: '100px', cursor: 'pointer', userSelect: 'none' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={dayData.isOpen}
                                                            onChange={(e) => handleDailyHoursChange(day, 'isOpen', e.target.checked)}
                                                        />
                                                        {day === 'Mon' ? 'Monday' :
                                                         day === 'Tue' ? 'Tuesday' :
                                                         day === 'Wed' ? 'Wednesday' :
                                                         day === 'Thu' ? 'Thursday' :
                                                         day === 'Fri' ? 'Friday' :
                                                         day === 'Sat' ? 'Saturday' : 'Sunday'}
                                                    </label>
                                                    
                                                    {dayData.isOpen ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <input
                                                                type="time"
                                                                value={dayData.openTime}
                                                                onChange={(e) => handleDailyHoursChange(day, 'openTime', e.target.value)}
                                                                style={{ padding: '4px 8px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '0.85rem' }}
                                                            />
                                                            <span style={{ fontSize: '0.85rem', color: '#64748B' }}>to</span>
                                                            <input
                                                                type="time"
                                                                value={dayData.closeTime}
                                                                onChange={(e) => handleDailyHoursChange(day, 'closeTime', e.target.value)}
                                                                style={{ padding: '4px 8px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '0.85rem' }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontStyle: 'italic' }}>Closed all day</span>
                                                     )}
                                                </div>
                                            );
                                        })}
                                    </div>
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
