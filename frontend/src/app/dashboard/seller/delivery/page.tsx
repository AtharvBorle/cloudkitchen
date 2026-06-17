"use client";
import { fetchApi } from "@/lib/fetch-api";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Phone, Mail, User, Trash2, Edit2, Plus, ArrowLeft } from "lucide-react";

export default function DeliveryPersonsPage() {
    const [deliveryPersons, setDeliveryPersons] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    // Form state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isActive, setIsActive] = useState(true);

    const fetchDeliveryPersons = async () => {
        try {
            const res = await fetchApi("/api/seller/delivery");
            const data = await res.json();
            if (res.ok) setDeliveryPersons(data.deliveryPersons || []);
        } catch (error) {
            console.error("Failed to fetch delivery persons");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchDeliveryPersons();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const method = editingId ? "PUT" : "POST";
        const url = editingId ? `/api/seller/delivery/${editingId}` : "/api/seller/delivery";

        try {
            const res = await fetchApi(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, phone, email, password, isActive })
            });

            if (res.ok) {
                closeModal();
                fetchDeliveryPersons();
            } else {
                const err = await res.json();
                alert(err.message || "Something went wrong");
            }
        } catch (error) {
            console.error("Error submitting form");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to remove this delivery person?")) return;
        try {
            const res = await fetchApi(`/api/seller/delivery/${id}`, { method: "DELETE" });
            if (res.ok) fetchDeliveryPersons();
            else alert("Failed to delete.");
        } catch (error) {
            console.error("Delete error", error);
        }
    };

    const openEditModal = (dp: any) => {
        setEditingId(dp.id);
        setName(dp.name);
        setPhone(dp.phone);
        setIsActive(dp.isActive);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setName("");
        setPhone("");
        setEmail("");
        setPassword("");
        setIsActive(true);
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1A1C23', marginBottom: '5px' }}>Delivery Staff</h1>
                    <Link href="/dashboard/seller" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#F16F68', textDecoration: 'none', fontSize: '0.9rem' }}>
                        <ArrowLeft size={16} /> Back to Dashboard
                    </Link>
                </div>
                <button
                    onClick={() => { closeModal(); setIsModalOpen(true); }}
                    style={{
                        backgroundColor: '#F16F68', color: 'white', border: 'none', padding: '12px 24px',
                        borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
                    }}
                >
                    <Plus size={20} /> Add Delivery Person
                </button>
            </div>

            {fetching ? (
                <p>Loading staff list...</p>
            ) : deliveryPersons.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <div style={{ backgroundColor: '#FEE2E2', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <User size={30} color="#F16F68" />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '10px' }}>No Delivery Staff Yet</h3>
                    <p style={{ color: '#718096', maxWidth: '400px', margin: '0 auto 20px' }}>
                        Add delivery persons so you can assign them to orders for faster fulfillment.
                    </p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        style={{ color: '#F16F68', backgroundColor: 'transparent', border: '1px solid #F16F68', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                    >
                        Register First Staff
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {deliveryPersons.map(dp => (
                        <div key={dp.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                                <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#F7FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4A5568' }}>
                                    <User size={24} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '2px' }}>{dp.name}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#718096', fontSize: '0.9rem' }}>
                                        <Phone size={14} /> {dp.phone}
                                    </div>
                                    {dp.email && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#718096', fontSize: '0.9rem', marginTop: '4px' }}>
                                            <Mail size={14} /> {dp.email}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '15px', borderTop: '1px solid #EDF2F7' }}>
                                <span style={{
                                    fontSize: '0.8rem', fontWeight: '600', padding: '4px 10px', borderRadius: '20px',
                                    backgroundColor: dp.isActive ? '#C6F6D5' : '#FED7D7',
                                    color: dp.isActive ? '#22543D' : '#822727'
                                }}>
                                    {dp.isActive ? 'Active' : 'Inactive'}
                                </span>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => openEditModal(dp)}
                                        style={{ backgroundColor: '#F7FAFC', border: '1px solid #E2E8F0', padding: '8px', borderRadius: '6px', cursor: 'pointer', color: '#4A5568' }}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(dp.id)}
                                        style={{ backgroundColor: '#FFF5F5', border: '1px solid #FED7D7', padding: '8px', borderRadius: '6px', cursor: 'pointer', color: '#E53E3E' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '450px', padding: '30px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '20px' }}>
                            {editingId ? 'Edit Delivery Person' : 'Add Delivery Person'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', fontWeight: '500' }}>Full Name</label>
                                <input
                                    type="text" value={name} onChange={e => setName(e.target.value)} required
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '1rem' }}
                                    placeholder="e.g. Rahul Sharma"
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', fontWeight: '500' }}>Phone Number</label>
                                <input
                                    type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '1rem' }}
                                    placeholder="e.g. 9876543210"
                                />
                            </div>

                            {!editingId && (
                                <>
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', fontWeight: '500' }}>Email Address (for login)</label>
                                        <input
                                            type="email" value={email} onChange={e => setEmail(e.target.value)} required
                                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '1rem' }}
                                            placeholder="e.g. rahul@example.com"
                                        />
                                    </div>
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', fontWeight: '500' }}>Password</label>
                                        <input
                                            type="password" value={password} onChange={e => setPassword(e.target.value)} required
                                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '1rem' }}
                                            placeholder="Min 6 characters"
                                        />
                                    </div>
                                </>
                            )}
                            {editingId && (
                                <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input
                                        type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} id="isActive"
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    <label htmlFor="isActive" style={{ fontSize: '0.95rem', fontWeight: '500' }}>Available for deliveries</label>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
                                <button
                                    type="button" onClick={closeModal}
                                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: 'white', cursor: 'pointer', fontWeight: '600' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit" disabled={loading}
                                    style={{
                                        flex: 1, padding: '12px', borderRadius: '8px', border: 'none',
                                        backgroundColor: '#F16F68', color: 'white', cursor: 'pointer', fontWeight: '600'
                                    }}
                                >
                                    {loading ? 'Saving...' : (editingId ? 'Update Staff' : 'Add Staff')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
