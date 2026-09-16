"use client";
import { fetchApi } from "@/lib/fetch-api";


import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { performLogout } from "@/lib/logout";
import { PhoneInput } from "@/components/common/PhoneInput/PhoneInput";

const formatDisplayName = (name: string) => {
    return name
        .split(/[_\s]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

export default function SuperadminSellersPage() {
    const router = useRouter();
    const [categories, setCategories] = useState<any[]>([]);
    const [sellers, setSellers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Category Management
    const [newCatName, setNewCatName] = useState("");
    const [newCatType, setNewCatType] = useState("FOOD");

    // Edit Modal State
    const [editingSeller, setEditingSeller] = useState<any | null>(null);
    const [editName, setEditName] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [editIsActive, setEditIsActive] = useState(true);
    const [editBusinessName, setEditBusinessName] = useState("");
    const [editType, setEditType] = useState("");
    const [editVerificationStatus, setEditVerificationStatus] = useState("PENDING");
    const [editIsOnline, setEditIsOnline] = useState(true);
    const [editFoodVerificationStatus, setEditFoodVerificationStatus] = useState("NONE");
    const [editPropertyVerificationStatus, setEditPropertyVerificationStatus] = useState("NONE");
    const [editBusinessCategory, setEditBusinessCategory] = useState("FOOD");

    const fetchData = async () => {
        try {
            // Fetch categories
            const catRes = await fetchApi("/api/superadmin/categories");
            if (catRes.ok) {
                const catData = await catRes.json();
                setCategories(catData.categories);
            }

            // Fetch advanced sellers list
            const sellerRes = await fetchApi("/api/superadmin/sellers");
            if (sellerRes.ok) {
                const sellerData = await sellerRes.json();
                setSellers(sellerData.sellers);
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Category Handlers
    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetchApi("/api/superadmin/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newCatName, type: newCatType })
            });

            if (res.ok) {
                setNewCatName("");
                fetchData();
            } else {
                alert("Failed to create category");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm("Are you sure? This may orphan items associated with it.")) return;
        try {
            const res = await fetchApi(`/api/superadmin/categories/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchData();
            } else {
                alert("Failed to delete category");
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Seller Handlers
    const handleOpenEdit = (seller: any) => {
        setEditingSeller(seller);
        setEditName(seller.name || "");
        setEditPhone(seller.phone || "");
        setEditIsActive(seller.isActive);
        setEditBusinessName(seller.businessName || "");
        setEditType(seller.type || "");
        setEditVerificationStatus(seller.verificationStatus || "PENDING");
        setEditIsOnline(seller.isOnline || false);
        setEditFoodVerificationStatus(seller.foodVerificationStatus || "NONE");
        setEditPropertyVerificationStatus(seller.propertyVerificationStatus || "NONE");
        setEditBusinessCategory(seller.businessCategory || "FOOD");
    };

    const handleUpdateSeller = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSeller) return;
        setLoading(true);

        try {
            const res = await fetchApi(`/api/superadmin/sellers/${editingSeller.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editName,
                    phone: editPhone,
                    isActive: editIsActive,
                    businessName: editBusinessName,
                    type: editType,
                    verificationStatus: editVerificationStatus,
                    isOnline: editIsOnline,
                    foodVerificationStatus: editFoodVerificationStatus,
                    propertyVerificationStatus: editPropertyVerificationStatus
                })
            });

            if (res.ok) {
                setEditingSeller(null);
                fetchData();
            } else {
                alert("Failed to update seller");
            }
        } catch (error) {
            console.error("Error updating seller");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSeller = async (sellerId: string) => {
        if (!confirm("Are you sure you want to delete this seller? All food items, rooms, and orders associated with this seller will be permanently deleted.")) return;

        try {
            const res = await fetchApi(`/api/superadmin/sellers/${sellerId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                fetchData();
            } else {
                alert("Failed to delete seller");
            }
        } catch (error) {
            console.error("Error deleting seller");
        }
    };

        const handleToggleSellerActive = async (seller: any) => {
        try {
            const res = await fetchApi(`/api/superadmin/sellers/${seller.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    isActive: !seller.isActive
                })
            });
            if (res.ok) {
                fetchData();
            } else {
                alert("Failed to toggle seller status");
            }
        } catch (error) {
            console.error("Error toggling seller status:", error);
        }
    };

    const handleLogout = () => {
        performLogout({ role: "SUPERADMIN" });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <span style={{ backgroundColor: '#FCF3CF', color: '#F39C12', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>PENDING</span>;
            case "APPROVED":
                return <span style={{ backgroundColor: '#E8F8F5', color: '#16A085', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>APPROVED</span>;
            case "REJECTED":
                return <span style={{ backgroundColor: '#FADBD8', color: '#E74C3C', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>REJECTED</span>;
            default:
                return status;
        }
    };

    // Derived categorization
    const groupedSellers = categories.reduce((acc, cat) => {
        acc[cat.name] = sellers.filter(s => s.type === cat.name);
        return acc;
    }, {} as Record<string, any[]>);

    const uncategorizedSellers = sellers.filter(s => !categories.find(c => c.name === s.type));

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F0F2F5', padding: '40px', fontFamily: "var(--font-sans)" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Sellers & Categories</h1>
                <button onClick={handleLogout} style={{ background: 'none', border: 'none', fontWeight: 'bold', color: 'var(--text-main)', cursor: 'pointer', fontSize: '1rem' }}>
                    Logout
                </button>
            </div>

            {/* Categories Management Area */}
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '20px', color: 'var(--text-main)' }}>Global Categories Dictionary</h2>
                <form onSubmit={handleCreateCategory} style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                    <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="input-field" placeholder="Category Name (e.g., Bakery)" style={{ flex: 1, marginBottom: 0 }} required />
                    <select value={newCatType} onChange={e => setNewCatType(e.target.value)} className="input-field" style={{ width: '200px', marginBottom: 0, appearance: 'auto' }}>
                        <option value="FOOD">Food / Menu</option>
                        <option value="ROOM">Room / Property</option>
                    </select>
                    <button type="submit" className="btn btn-coral" style={{ width: 'auto', padding: '14px 25px' }} disabled={loading}>
                        Add Category
                    </button>
                </form>

                <div style={{ marginTop: '20px' }}>
                    {categories.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No categories configured yet.</p>
                    ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {categories.map(cat => (
                                <div key={cat.id} style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F8F9F9', padding: '8px 15px', borderRadius: '20px', border: '1px solid #EAEAEA' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', marginRight: '10px' }}>
                                        {formatDisplayName(cat.name)} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'normal' }}>({cat.type})</span>
                                    </span>
                                    <button onClick={() => handleDeleteCategory(cat.id)} style={{ background: 'none', border: 'none', color: 'var(--coral)', cursor: 'pointer', fontWeight: 'bold' }}>&times;</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Sellers Overview Table */}
            <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '20px' }}>Registered Sellers List (Categorized)</h2>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                    <thead style={{ backgroundColor: '#F8F9F9' }}>
                        <tr>
                            <th style={{ padding: '15px 20px', borderBottom: '1px solid #EAEAEA', fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.9rem' }}>Business Info</th>
                            <th style={{ padding: '15px 20px', borderBottom: '1px solid #EAEAEA', fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.9rem' }}>Contact</th>
                            <th style={{ padding: '15px 20px', borderBottom: '1px solid #EAEAEA', fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.9rem' }}>Verification</th>
                            <th style={{ padding: '15px 20px', borderBottom: '1px solid #EAEAEA', fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.9rem', textAlign: 'center' }}>Account</th>
                            <th style={{ padding: '15px 20px', borderBottom: '1px solid #EAEAEA', fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.9rem', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map((category, index) => (
                            <React.Fragment key={`cat-group-${category.id || index}`}>
                                {groupedSellers[category.name]?.length > 0 && (
                                    <tr key={`cat-header-${category.id}`}>
                                        <td colSpan={5} style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', fontWeight: 'bold', color: '#475569', fontSize: '0.9rem', borderBottom: '1px solid #e2e8f0' }}>
                                            {category.name} ({category.type})
                                        </td>
                                    </tr>
                                )}
                                {groupedSellers[category.name]?.map((seller: any) => (
                                    <tr key={`seller-${seller.id}`} style={{ transition: 'background-color 0.2s', borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '15px 20px' }}>
                                            <div style={{ fontWeight: 'bold', color: '#334155', marginBottom: '3px' }}>{seller.businessName}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{seller.trackingId}</div>
                                        </td>
                                        <td style={{ padding: '15px 20px' }}>
                                            <div style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '3px' }}>{seller.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{seller.phone}</div>
                                        </td>
                                        <td style={{ padding: '15px 20px' }}>
                                            {getStatusBadge(seller.verificationStatus)}
                                        </td>
                                        <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                                            {seller.isActive ? (
                                                <span style={{ color: '#3b82f6', fontSize: '0.85rem', fontWeight: '600' }}>Enabled</span>
                                            ) : (
                                                <span style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: '600' }}>Disabled</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button onClick={() => handleOpenEdit(seller)} className="btn btn-teal" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem', borderRadius: '6px' }}>Edit</button>
                                                <button onClick={() => handleToggleSellerActive(seller)} className="btn" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem', borderRadius: '6px', backgroundColor: seller.isActive ? '#e2e8f0' : '#d4efdf', color: seller.isActive ? '#475569' : '#27ae60' }}>
                                                    {seller.isActive ? "Disable" : "Enable"}
                                                </button>
                                                <button onClick={() => handleDeleteSeller(seller.id)} className="btn btn-coral" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem', borderRadius: '6px' }}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}

                        {uncategorizedSellers.length > 0 && (
                            <tr key="cat-header-uncategorized">
                                <td colSpan={5} style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', fontWeight: 'bold', color: '#475569', fontSize: '0.9rem', borderBottom: '1px solid #e2e8f0' }}>
                                    Uncategorized / Other
                                </td>
                            </tr>
                        )}
                        {uncategorizedSellers.map((seller) => (
                            <tr key={`seller-${seller.id}`} style={{ transition: 'background-color 0.2s', borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '15px 20px' }}>
                                    <div style={{ fontWeight: 'bold', color: '#334155', marginBottom: '3px' }}>{seller.businessName}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Type: {seller.type || 'N/A'}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{seller.trackingId}</div>
                                </td>
                                <td style={{ padding: '15px 20px' }}>
                                    <div style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '3px' }}>{seller.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{seller.phone || seller.email}</div>
                                </td>
                                <td style={{ padding: '15px 20px' }}>
                                    {getStatusBadge(seller.verificationStatus)}
                                </td>
                                <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                                    {seller.isActive ? (
                                        <span style={{ color: '#3b82f6', fontSize: '0.85rem', fontWeight: '600' }}>Enabled</span>
                                    ) : (
                                        <span style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: '600' }}>Disabled</span>
                                    )}
                                </td>
                                <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button onClick={() => handleOpenEdit(seller)} className="btn btn-teal" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem', borderRadius: '6px' }}>Edit</button>
                                        <button onClick={() => handleToggleSellerActive(seller)} className="btn" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem', borderRadius: '6px', backgroundColor: seller.isActive ? '#e2e8f0' : '#d4efdf', color: seller.isActive ? '#475569' : '#27ae60' }}>
                                            {seller.isActive ? "Disable" : "Enable"}
                                        </button>
                                        <button onClick={() => handleDeleteSeller(seller.id)} className="btn btn-coral" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem', borderRadius: '6px' }}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}


                        {sellers.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <div style={{ fontSize: '1.1rem', marginBottom: '5px' }}>No sellers found</div>
                                    <div style={{ fontSize: '0.9rem' }}>Sellers will appear here once they register.</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editingSeller && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
                    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '5px', color: 'var(--text-main)' }}>Edit Seller Profile</h2>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '25px' }}>Modifying details for {editBusinessName || editName}</p>

                        <form onSubmit={handleUpdateSeller}>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="input-group">
                                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#475569', fontWeight: '500' }}>Business Name</label>
                                    <input type="text" value={editBusinessName} onChange={e => setEditBusinessName(e.target.value)} className="input-field" required />
                                </div>

                                <div className="input-group">
                                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#475569', fontWeight: '500' }}>Category Type</label>
                                    <select
                                        value={editType}
                                        onChange={e => setEditType(e.target.value)}
                                        className="input-field" style={{ appearance: 'auto' }} required
                                    >
                                        <option value="">Select Category...</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.name}>{formatDisplayName(cat.name)}</option>
                                        ))}
                                        {/* Fallback for sellers with types that don't match any global category exactly */}
                                        {editType && !categories.some(c => c.name === editType) && (
                                            <option value={editType}>{formatDisplayName(editType)} (Legacy)</option>
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="input-group">
                                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#475569', fontWeight: '500' }}>Owner Name</label>
                                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="input-field" required />
                                </div>

                                <div className="input-group">
                                    <PhoneInput
                                        label="Phone"
                                        value={editPhone}
                                        onChange={(val) => setEditPhone(val)}
                                        placeholder="98765 43210"
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category & Document Verifications</div>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: '#475569', fontWeight: '500' }}>Registered Category</label>
                                        <div style={{ padding: '8px 12px', backgroundColor: '#e2e8f0', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 'bold', color: '#1e293b' }}>
                                            {editBusinessCategory}
                                        </div>
                                    </div>
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: '#475569', fontWeight: '600' }}>Overall Profile Status</label>
                                        <select
                                            value={editVerificationStatus}
                                            onChange={e => setEditVerificationStatus(e.target.value)}
                                            className="input-field" style={{ appearance: 'auto', backgroundColor: 'white', border: '1px solid #cbd5e1', padding: '8px' }}
                                        >
                                            <option value="PENDING">Pending (Profile Review)</option>
                                            <option value="APPROVED">Approved (Profile Verified)</option>
                                            <option value="REJECTED">Rejected</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: '#475569', fontWeight: '600' }}>Food Verification</label>
                                        <select
                                            value={editFoodVerificationStatus}
                                            onChange={e => setEditFoodVerificationStatus(e.target.value)}
                                            className="input-field" style={{ appearance: 'auto', backgroundColor: 'white', border: '1px solid #cbd5e1', padding: '8px' }}
                                        >
                                            <option value="NONE">None (Not Registered)</option>
                                            <option value="PENDING">Pending Approval</option>
                                            <option value="APPROVED">Approved</option>
                                            <option value="REJECTED">Rejected</option>
                                        </select>
                                    </div>
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: '#475569', fontWeight: '600' }}>Property Verification</label>
                                        <select
                                            value={editPropertyVerificationStatus}
                                            onChange={e => setEditPropertyVerificationStatus(e.target.value)}
                                            className="input-field" style={{ appearance: 'auto', backgroundColor: 'white', border: '1px solid #cbd5e1', padding: '8px' }}
                                        >
                                            <option value="NONE">None (Not Registered)</option>
                                            <option value="PENDING">Pending Approval</option>
                                            <option value="APPROVED">Approved</option>
                                            <option value="REJECTED">Rejected</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: '#475569', fontWeight: '500' }}>Account Status</label>
                                        <select
                                            value={editIsActive ? "true" : "false"}
                                            onChange={e => setEditIsActive(e.target.value === "true")}
                                            className="input-field" style={{ appearance: 'auto', backgroundColor: 'white', border: '1px solid #cbd5e1', padding: '8px' }}
                                        >
                                            <option value="true">Enabled (Login Allowed)</option>
                                            <option value="false">Disabled (Login Blocked)</option>
                                        </select>
                                    </div>
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: '#475569', fontWeight: '500' }}>Store Visibility</label>
                                        <select
                                            value={editIsOnline ? "true" : "false"}
                                            onChange={e => setEditIsOnline(e.target.value === "true")}
                                            className="input-field" style={{ appearance: 'auto', backgroundColor: 'white', border: '1px solid #cbd5e1', padding: '8px' }}
                                        >
                                            <option value="true">Online (Visible to Users)</option>
                                            <option value="false">Offline (Hidden)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                                <button type="button" onClick={() => setEditingSeller(null)} className="btn" style={{ backgroundColor: '#f1f5f9', color: '#475569', width: 'auto', padding: '12px 24px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '12px 24px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)' }} disabled={loading}>
                                    {loading ? "Saving Changes..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
