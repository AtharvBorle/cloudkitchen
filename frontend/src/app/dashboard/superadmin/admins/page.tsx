"use client";
import { fetchApi } from "@/lib/fetch-api";


import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { performLogout } from "@/lib/logout";
import { PhoneInput } from "@/components/common/PhoneInput/PhoneInput";
import { PasswordInput } from "@/components/common/PasswordInput/PasswordInput";
import { validateEmail } from "@/lib/email-validation";

export default function SuperadminDashboard() {
    const router = useRouter();
    const [admins, setAdmins] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Form for Adding
    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPhone, setNewPhone] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newRole, setNewRole] = useState("AGENT");

    // Edit Modal State
    const [editingAdmin, setEditingAdmin] = useState<any | null>(null);
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [editPassword, setEditPassword] = useState("");
    const [editRole, setEditRole] = useState("AGENT");
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

        // Validation
        if (!newName.trim() || newName.trim().length < 2) {
            alert("Name must be at least 2 characters long.");
            return;
        }
        const emailValidation = validateEmail(newEmail);
        if (!emailValidation.isValid) {
            alert(emailValidation.error || "Please enter a valid email address.");
            return;
        }
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(newPhone)) {
            alert("Phone number must be exactly 10 digits.");
            return;
        }
        if (newPassword.length < 6) {
            alert("Password must be at least 6 characters long.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetchApi("/api/superadmin/admins", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName, email: newEmail, phone: newPhone, password: newPassword, role: newRole })
            });

            if (res.ok) {
                setNewName(""); setNewEmail(""); setNewPhone(""); setNewPassword(""); setNewRole("AGENT");
                fetchAdmins();
            } else {
                const data = await res.json().catch(() => ({}));
                let errMsg = data.message || data.error || "Failed to create admin";
                const lower = errMsg.toLowerCase();
                if (res.status === 409 || lower.includes("already exist") || lower.includes("already registered") || lower.includes("email already in use")) {
                    errMsg = "A user with this email address already exists. Please use a different email.";
                }
                alert(errMsg);
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
        setEditRole(admin.role || "AGENT");
        setEditIsActive(admin.isActive);
        setEditCanManageOffers(admin.agentProfile?.canManageOffers || false);
        setEditCanManageBanners(admin.agentProfile?.canManageBanners || false);
    };

    const handleUpdateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAdmin) return;

        // Validation
        if (!editName.trim() || editName.trim().length < 2) {
            alert("Name must be at least 2 characters long.");
            return;
        }
        const emailValidation = validateEmail(editEmail);
        if (!emailValidation.isValid) {
            alert(emailValidation.error || "Please enter a valid email address.");
            return;
        }
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(editPhone)) {
            alert("Phone number must be exactly 10 digits.");
            return;
        }
        if (editPassword && editPassword.length < 6) {
            alert("New password must be at least 6 characters long.");
            return;
        }

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
                    role: editRole,
                    password: editPassword || undefined,
                    canManageOffers: editCanManageOffers,
                    canManageBanners: editCanManageBanners
                })
            });

            if (res.ok) {
                setEditingAdmin(null);
                fetchAdmins();
            } else {
                const data = await res.json().catch(() => ({}));
                let errMsg = data.message || data.error || "Failed to update admin";
                const lower = errMsg.toLowerCase();
                if (res.status === 409 || lower.includes("already exist") || lower.includes("already registered") || lower.includes("email already in use")) {
                    errMsg = "A user with this email address already exists. Please use a different email.";
                }
                alert(errMsg);
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

    const handleLogout = () => {
        performLogout({ role: "SUPERADMIN" });
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
                    <div style={{ flex: 1, minWidth: '220px' }}>
                        <PhoneInput
                            value={newPhone}
                            onChange={(val) => setNewPhone(val)}
                            placeholder="98765 43210"
                            showHelperText={false}
                            required
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: '180px' }}>
                        <PasswordInput
                            value={newPassword}
                            onChange={(val) => setNewPassword(val)}
                            placeholder="Password"
                            showHelperText={false}
                            required
                            minLength={6}
                            autoComplete="new-password"
                        />
                    </div>
                    <select value={newRole} onChange={e => setNewRole(e.target.value)} className="input-field" style={{ flex: 1, minWidth: '150px', marginBottom: 0, appearance: 'auto', border: '1px solid #cbd5e1' }} required>
                        <option value="AGENT">Regional Agent</option>
                        <option value="SUPPORT">Support Admin</option>
                    </select>
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
                            <th style={{ padding: '15px 20px', borderBottom: '1px solid #EAEAEA', fontWeight: 'bold', color: 'var(--text-main)' }}>Role</th>
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
                                     {admin.role === "SUPPORT" ? (
                                         <span style={{ backgroundColor: '#EBF5FB', color: '#2980B9', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>Support Admin</span>
                                     ) : (
                                         <span style={{ backgroundColor: '#FCF3CF', color: '#B7950B', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>Regional Agent</span>
                                     )}
                                 </td>
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
                                <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No admins found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editingAdmin && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
                    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '800px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>Edit Admin</h2>

                        <form onSubmit={handleUpdateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                {/* Left Column: Basic Details */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#475569', fontWeight: '500' }}>Name</label>
                                        <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="input-field" style={{ marginBottom: 0 }} required />
                                    </div>

                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#475569', fontWeight: '500' }}>Email</label>
                                        <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="input-field" style={{ marginBottom: 0 }} required />
                                    </div>

                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <PhoneInput
                                            label="Phone"
                                            value={editPhone}
                                            onChange={(val) => setEditPhone(val)}
                                            placeholder="98765 43210"
                                            required
                                        />
                                    </div>

                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <PasswordInput
                                            label="New Password (optional)"
                                            value={editPassword}
                                            onChange={(val) => setEditPassword(val)}
                                            placeholder="Leave blank to keep current"
                                            minLength={6}
                                            required={false}
                                        />
                                    </div>
                                </div>

                                {/* Right Column: Status, Role & Permissions */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#475569', fontWeight: '500' }}>Account Status</label>
                                        <select
                                            value={editIsActive ? "true" : "false"}
                                            onChange={e => setEditIsActive(e.target.value === "true")}
                                            className="input-field" style={{ appearance: 'auto', border: '1px solid #cbd5e1', marginBottom: 0 }}
                                        >
                                            <option value="true">Active</option>
                                            <option value="false">Inactive</option>
                                        </select>
                                    </div>

                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#475569', fontWeight: '500' }}>Role</label>
                                        <select
                                            value={editRole}
                                            onChange={e => setEditRole(e.target.value)}
                                            className="input-field" style={{ appearance: 'auto', border: '1px solid #cbd5e1', marginBottom: 0 }}
                                        >
                                            <option value="AGENT">Regional Agent</option>
                                            <option value="SUPPORT">Support Admin</option>
                                        </select>
                                    </div>

                                    {editRole === "AGENT" && (
                                        <div className="input-group" style={{ marginTop: '10px', marginBottom: 0 }}>
                                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '12px', color: '#475569', fontWeight: '600' }}>Agent Permissions (Global)</label>

                                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: 'pointer', userSelect: 'none' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={editCanManageOffers}
                                                    onChange={(e) => setEditCanManageOffers(e.target.checked)}
                                                    style={{ width: '18px', height: '18px', accentColor: 'var(--coral)', cursor: 'pointer' }}
                                                />
                                                <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: '500' }}>Can Manage Global Offers (Coupons)</span>
                                            </label>

                                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={editCanManageBanners}
                                                    onChange={(e) => setEditCanManageBanners(e.target.checked)}
                                                    style={{ width: '18px', height: '18px', accentColor: 'var(--coral)', cursor: 'pointer' }}
                                                />
                                                <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: '500' }}>Can Manage Global Popup Banners</span>
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                                <button type="button" onClick={() => setEditingAdmin(null)} className="btn" style={{ backgroundColor: '#f1f5f9', color: '#475569', width: 'auto', padding: '10px 24px', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-coral" style={{ width: 'auto', padding: '10px 24px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }} disabled={loading}>
                                    {loading ? "Saving Changes..." : "Update Admin"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
