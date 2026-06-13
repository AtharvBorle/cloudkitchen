"use client";
import { fetchApi } from "@/lib/fetch-api";


import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export default function SuperadminDashboard() {
    const router = useRouter();
    const [admins, setAdmins] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Form for Adding
    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPhone, setNewPhone] = useState("");
    const [newPassword, setNewPassword] = useState("");

    // Edit Modal State
    const [editingAdmin, setEditingAdmin] = useState<any | null>(null);
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [editPassword, setEditPassword] = useState("");
    const [editIsActive, setEditIsActive] = useState(true);
    const [editCanManageOffers, setEditCanManageOffers] = useState(false);
    const [editCanManageBanners, setEditCanManageBanners] = useState(false);

    const fetchAdmins = async () => {
        try {
            const res = await fetchApi("/api/superadmin/admins");
            const data = await res.json();
            if (res.ok) setAdmins(data.agents);
        } catch (error) {
            console.error("Failed to fetch admins");
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetchApi("/api/superadmin/admins", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName, email: newEmail, phone: newPhone, password: newPassword })
            });

            if (res.ok) {
                setNewName(""); setNewEmail(""); setNewPhone(""); setNewPassword("");
                fetchAdmins();
            } else {
                const data = await res.json();
                alert(data.message || "Failed to create admin");
            }
        } catch (error) {
            console.error("Error creating admin");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenEdit = (admin: any) => {
        setEditingAdmin(admin);
        setEditName(admin.name);
        setEditEmail(admin.email);
        setEditPhone(admin.phone);
        setEditPassword("");
        setEditIsActive(admin.isActive);
        setEditCanManageOffers(admin.agentProfile?.canManageOffers || false);
        setEditCanManageBanners(admin.agentProfile?.canManageBanners || false);
    };

    const handleUpdateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAdmin) return;
        setLoading(true);

        try {
            const res = await fetchApi(`/api/superadmin/admins/${editingAdmin.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editName,
                    email: editEmail,
                    phone: editPhone,
                    isActive: editIsActive,
                    password: editPassword || undefined,
                    canManageOffers: editCanManageOffers,
                    canManageBanners: editCanManageBanners
                })
            });

            if (res.ok) {
                setEditingAdmin(null);
                fetchAdmins();
            } else {
                alert("Failed to update admin");
            }
        } catch (error) {
            console.error("Error updating admin");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAdmin = async (adminId: string) => {
        if (!confirm("Are you sure you want to delete this admin? Everything related will be removed.")) return;

        try {
            const res = await fetchApi(`/api/superadmin/admins/${adminId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                fetchAdmins();
            } else {
                alert("Failed to delete admin");
            }
        } catch (error) {
            console.error("Error deleting");
        }
    };

    const handleLogout = async () => {
        await signOut({ callbackUrl: window.location.origin + "/admin" });
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F0F2F5', padding: '40px', fontFamily: "var(--font-sans)" }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Super Admin Panel</h1>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <Link href="/dashboard/superadmin" style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: '500' }}>Overview</Link>
                    <button onClick={handleLogout} style={{ background: 'none', border: 'none', fontWeight: 'bold', color: 'var(--coral)', cursor: 'pointer', fontSize: '1rem' }}>
                        Logout
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #EAEAEA', marginBottom: '30px', overflowX: 'auto', gap: '5px' }}>
                <Link href="/dashboard/superadmin" style={{ padding: '10px 20px', color: 'var(--text-muted)', fontWeight: 'bold', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    Dashboard Overview
                </Link>
                <div style={{ padding: '10px 20px', borderBottom: '2px solid var(--coral)', color: 'var(--coral)', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Manage Admins
                </div>
                <Link href="/dashboard/superadmin/sellers" style={{ padding: '10px 20px', color: 'var(--text-muted)', fontWeight: 'bold', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    Manage Sellers
                </Link>
                <Link href="/dashboard/superadmin/subscriptions" style={{ padding: '10px 20px', color: 'var(--text-muted)', fontWeight: 'bold', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    System Settings
                </Link>
            </div>

            {/* Add New Admin Form Area */}
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '20px', color: 'var(--text-main)' }}>Add New Admin</h2>
                <form onSubmit={handleCreateAdmin} style={{ display: 'flex', gap: '15px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="input-field" placeholder="Admin Name" style={{ flex: 1, minWidth: '150px', marginBottom: 0 }} required />
                    <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="input-field" placeholder="Email" style={{ flex: 1, minWidth: '150px', marginBottom: 0 }} required />
                    <input type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} className="input-field" placeholder="Phone" style={{ flex: 1, minWidth: '150px', marginBottom: 0 }} required />
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-field" placeholder="Password" style={{ flex: 1, minWidth: '150px', marginBottom: 0 }} required />
                    <button type="submit" className="btn btn-coral" style={{ width: 'auto', padding: '12px 25px' }} disabled={loading}>
                        Create Admin
                    </button>
                </form>
            </div>

            {/* Admins Table */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                    <thead style={{ backgroundColor: '#F8F9F9' }}>
                        <tr>
                            <th style={{ padding: '15px 20px', borderBottom: '1px solid #EAEAEA', fontWeight: 'bold', color: 'var(--text-main)' }}>ID</th>
                            <th style={{ padding: '15px 20px', borderBottom: '1px solid #EAEAEA', fontWeight: 'bold', color: 'var(--text-main)' }}>Name</th>
                            <th style={{ padding: '15px 20px', borderBottom: '1px solid #EAEAEA', fontWeight: 'bold', color: 'var(--text-main)' }}>Email</th>
                            <th style={{ padding: '15px 20px', borderBottom: '1px solid #EAEAEA', fontWeight: 'bold', color: 'var(--text-main)' }}>Status</th>
                            <th style={{ padding: '15px 20px', borderBottom: '1px solid #EAEAEA', fontWeight: 'bold', color: 'var(--text-main)', textAlign: 'right' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {admins.map((admin, index) => (
                            <tr key={admin.id} style={{ transition: 'background-color 0.2s', borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '15px 20px', color: '#64748b' }}>{index + 1}</td>
                                <td style={{ padding: '15px 20px', color: '#334155', fontWeight: '500' }}>{admin.name}</td>
                                <td style={{ padding: '15px 20px', color: '#475569' }}>{admin.email}</td>
                                <td style={{ padding: '15px 20px', color: '#475569' }}>
                                    {admin.isActive ? (
                                        <span style={{ backgroundColor: '#E8F8F5', color: '#16A085', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>Active</span>
                                    ) : (
                                        <span style={{ backgroundColor: '#FADBD8', color: '#E74C3C', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>Inactive</span>
                                    )}
                                </td>
                                <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button onClick={() => handleOpenEdit(admin)} className="btn btn-teal" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem', borderRadius: '6px' }}>Edit</button>
                                        <button onClick={() => handleDeleteAdmin(admin.id)} className="btn btn-coral" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem', borderRadius: '6px' }}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {admins.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No admins found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editingAdmin && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
                    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '20px', color: 'var(--text-main)' }}>Edit Admin</h2>

                        <form onSubmit={handleUpdateAdmin}>
                            <div className="input-group">
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#475569', fontWeight: '500' }}>Name</label>
                                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="input-field" required />
                            </div>

                            <div className="input-group">
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#475569', fontWeight: '500' }}>Email</label>
                                <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="input-field" required />
                            </div>

                            <div className="input-group">
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#475569', fontWeight: '500' }}>Phone</label>
                                <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="input-field" required />
                            </div>

                            <div className="input-group">
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#475569', fontWeight: '500' }}>New Password (optional)</label>
                                <input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} className="input-field" placeholder="Leave blank to keep current" />
                            </div>

                            <div className="input-group">
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#475569', fontWeight: '500' }}>Account Status</label>
                                <select
                                    value={editIsActive ? "true" : "false"}
                                    onChange={e => setEditIsActive(e.target.value === "true")}
                                    className="input-field" style={{ appearance: 'auto', border: '1px solid #cbd5e1' }}
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>

                            <div className="input-group" style={{ marginTop: '15px' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '10px', color: '#475569', fontWeight: '500' }}>Agent Permissions (Global)</label>

                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={editCanManageOffers}
                                        onChange={(e) => setEditCanManageOffers(e.target.checked)}
                                        style={{ width: '16px', height: '16px', accentColor: 'var(--coral)' }}
                                    />
                                    <span style={{ fontSize: '0.9rem', color: '#334155' }}>Can Manage Global Offers (Coupons)</span>
                                </label>

                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={editCanManageBanners}
                                        onChange={(e) => setEditCanManageBanners(e.target.checked)}
                                        style={{ width: '16px', height: '16px', accentColor: 'var(--coral)' }}
                                    />
                                    <span style={{ fontSize: '0.9rem', color: '#334155' }}>Can Manage Global Popup Banners</span>
                                </label>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '30px' }}>
                                <button type="button" onClick={() => setEditingAdmin(null)} className="btn" style={{ backgroundColor: '#f1f5f9', color: '#475569', width: 'auto', padding: '10px 20px', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-coral" style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px' }} disabled={loading}>
                                    {loading ? "Waiting..." : "Update Admin"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
