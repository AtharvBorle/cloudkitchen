"use client";
import { fetchApi } from "@/lib/fetch-api";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Phone, Mail, User, Trash2, Edit2, Plus, ArrowLeft, X, Download } from "lucide-react";

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

    // Collect Cash Modal handlers
    const [collectModalOpen, setCollectModalOpen] = useState(false);
    const [selectedDp, setSelectedDp] = useState<any>(null);
    const [collectAmount, setCollectAmount] = useState("");

    const openCollectModal = (dp: any) => {
        setSelectedDp(dp);
        setCollectAmount(dp.outstandingBalance.toString());
        setCollectModalOpen(true);
    };

    const handleCollectCash = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDp) return;
        const val = parseFloat(collectAmount);
        if (isNaN(val) || val <= 1) {
            alert("Collection amount must be greater than ₹1");
            return;
        }
        setLoading(true);
        try {
            const res = await fetchApi(`/api/seller/delivery/${selectedDp.id}/collect`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: collectAmount })
            });
            if (res.ok) {
                setCollectModalOpen(false);
                fetchDeliveryPersons();
            } else {
                const err = await res.json();
                alert(err.message || "Failed to collect cash");
            }
        } catch (error) {
            console.error("Collect error", error);
        } finally {
            setLoading(false);
        }
    };

    // Adjust Modal handlers
    const [adjustModalOpen, setAdjustModalOpen] = useState(false);
    const [adjAmount, setAdjAmount] = useState("");
    const [adjType, setAdjType] = useState<"INCREMENT" | "DECREMENT">("DECREMENT");
    const [adjDesc, setAdjDesc] = useState("");

    const openAdjustModal = (dp: any) => {
        setSelectedDp(dp);
        setAdjAmount("");
        setAdjType("DECREMENT");
        setAdjDesc("");
        setAdjustModalOpen(true);
    };

    const handleAdjustBalance = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDp) return;
        const val = parseFloat(adjAmount);
        if (isNaN(val) || val <= 1) {
            alert("Adjustment amount must be greater than ₹1");
            return;
        }
        setLoading(true);
        try {
            const res = await fetchApi(`/api/seller/delivery/${selectedDp.id}/adjust`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: adjAmount, type: adjType, description: adjDesc })
            });
            if (res.ok) {
                setAdjustModalOpen(false);
                fetchDeliveryPersons();
            } else {
                const err = await res.json();
                alert(err.message || "Failed to adjust balance");
            }
        } catch (error) {
            console.error("Adjustment error", error);
        } finally {
            setLoading(false);
        }
    };

    // History Modal handlers
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loadingTx, setLoadingTx] = useState(false);

    const openHistoryModal = async (dp: any) => {
        setSelectedDp(dp);
        setHistoryModalOpen(true);
        setLoadingTx(true);
        try {
            const res = await fetchApi(`/api/seller/delivery/${dp.id}/transactions`);
            const data = await res.json();
            if (res.ok) {
                setTransactions(data.transactions || []);
            } else {
                alert("Failed to load transaction history");
            }
        } catch (error) {
            console.error("Load history error", error);
        } finally {
            setLoadingTx(false);
        }
    };

    const downloadCSV = () => {
        if (!transactions || transactions.length === 0) return;
        
        // CSV headers
        const headers = ["Date", "Time", "Transaction ID", "Type", "Amount (INR)", "Description", "Order ID", "Status"];
        
        // Map transactions to rows
        const rows = transactions.map((tx: any) => {
            const date = new Date(tx.createdAt).toLocaleDateString();
            const time = new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            let typeLabel = tx.type;
            if (tx.type === 'COD_COLLECTION') typeLabel = 'Credited (COD Collect)';
            else if (tx.type === 'SETTLEMENT') typeLabel = 'Debited (Settlement)';
            else if (tx.type === 'ADJUSTMENT') typeLabel = 'Adjustment';

            return [
                date,
                time,
                tx.id,
                typeLabel,
                tx.amount,
                tx.description || "",
                tx.orderId || "",
                tx.status
            ];
        });
        
        // Construct CSV content
        const csvContent = [
            headers.join(","),
            ...rows.map((row: any[]) => 
                row.map(value => {
                    const stringVal = String(value).replace(/"/g, '""');
                    return stringVal.includes(",") || stringVal.includes("\n") || stringVal.includes('"') 
                        ? `"${stringVal}"` 
                        : stringVal;
                }).join(",")
            )
        ].join("\n");
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Transactions_${selectedDp?.name?.replace(/\s+/g, '_') || 'delivery'}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
        
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone.trim())) {
            alert("Phone number must be exactly 10 digits (e.g. 9876543210).");
            return;
        }

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

    const handleDelete = async (dp: any) => {
        if (dp.outstandingBalance > 0) {
            alert(`Cannot delete ${dp.name} because they have an outstanding COD balance of ₹${dp.outstandingBalance.toFixed(2)}.`);
            return;
        }
        if (!confirm(`Are you sure you want to remove ${dp.name}?`)) return;
        try {
            const res = await fetchApi(`/api/seller/delivery/${dp.id}`, { method: "DELETE" });
            if (res.ok) {
                fetchDeliveryPersons();
            } else {
                const err = await res.json();
                alert(err.message || "Failed to delete.");
            }
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

                            <div style={{ padding: '15px 0', borderTop: '1px solid #EDF2F7', borderBottom: '1px solid #EDF2F7', margin: '15px 0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <span style={{ fontSize: '0.8rem', color: '#718096', display: 'block', fontWeight: '500' }}>Outstanding COD Balance</span>
                                        <span style={{ fontSize: '1.25rem', fontWeight: '800', color: dp.outstandingBalance > 0 ? '#E53E3E' : '#2D3748' }}>
                                            ₹{(dp.outstandingBalance || 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        {dp.outstandingBalance > 0 && (
                                            <button
                                                onClick={() => openCollectModal(dp)}
                                                style={{ backgroundColor: '#10B981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)' }}
                                            >
                                                Collect Cash
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-start' }}>
                                    <button
                                        onClick={() => openHistoryModal(dp)}
                                        style={{ background: 'none', border: 'none', color: '#3182CE', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
                                    >
                                        📜 View Transactions
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '15px' }}>
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
                                        onClick={() => handleDelete(dp)}
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

            {/* Collect Cash Modal */}
            {collectModalOpen && selectedDp && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '400px', padding: '30px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>Collect COD Cash</h2>
                            <button onClick={() => setCollectModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} color="#A0AEC0" />
                            </button>
                        </div>
                        <form onSubmit={handleCollectCash}>
                            <p style={{ color: '#718096', fontSize: '0.9rem', marginBottom: '15px' }}>
                                Confirm receiving collected COD payment from <strong>{selectedDp.name}</strong>.
                            </p>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', fontWeight: '500' }}>Outstanding Balance: ₹{selectedDp.outstandingBalance.toFixed(2)}</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#718096', fontWeight: 'bold' }}>₹</span>
                                    <input
                                        type="number" step="0.01" min="0.01" max={selectedDp.outstandingBalance} value={collectAmount} onChange={e => setCollectAmount(e.target.value)} required
                                        style={{ width: '100%', padding: '12px 12px 12px 30px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '1.1rem', fontWeight: 'bold' }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="button" onClick={() => setCollectModalOpen(false)}
                                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: 'white', cursor: 'pointer', fontWeight: '600' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit" disabled={loading}
                                    style={{
                                        flex: 1, padding: '12px', borderRadius: '8px', border: 'none',
                                        backgroundColor: '#10B981', color: 'white', cursor: 'pointer', fontWeight: '600'
                                    }}
                                >
                                    {loading ? 'Confirming...' : 'Confirm Receipt'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}



            {/* Transaction History Modal */}
            {historyModalOpen && selectedDp && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '700px', padding: '30px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>Transaction Log - {selectedDp.name}</h2>
                            <button onClick={() => setHistoryModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} color="#A0AEC0" />
                            </button>
                        </div>
                        
                        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
                            {loadingTx ? (
                                <p style={{ textAlign: 'center', padding: '20px' }}>Loading transaction history...</p>
                            ) : transactions.length === 0 ? (
                                <p style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>No transactions recorded yet.</p>
                            ) : (
                                <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#F7FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#4A5568' }}>Date / Time</th>
                                                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#4A5568' }}>Type</th>
                                                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#4A5568' }}>Amount</th>
                                                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#4A5568' }}>Details</th>
                                                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#4A5568' }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transactions.map((tx: any) => {
                                                let typeColor = '#2D3748';
                                                let typeLabel = tx.type;
                                                let amountPrefix = '';
                                                let amountColor = '#2D3748';

                                                if (tx.type === 'COD_COLLECTION') {
                                                    typeColor = '#2F855A';
                                                    typeLabel = 'Credited (COD Collect)';
                                                    amountPrefix = '+ ';
                                                    amountColor = '#2F855A';
                                                } else if (tx.type === 'SETTLEMENT') {
                                                    typeColor = '#2B6CB0';
                                                    typeLabel = 'Debited (Settlement)';
                                                    amountPrefix = '- ';
                                                    amountColor = '#2B6CB0';
                                                } else if (tx.type === 'ADJUSTMENT') {
                                                    typeColor = '#D69E2E';
                                                    typeLabel = 'Adjustment';
                                                    amountPrefix = tx.amount < 0 ? '- ' : '+ ';
                                                    amountColor = tx.amount < 0 ? '#E53E3E' : '#2F855A';
                                                }

                                                return (
                                                    <tr key={tx.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                                        <td style={{ padding: '12px 16px', color: '#4A5568' }}>
                                                            {new Date(tx.createdAt).toLocaleDateString()} <br />
                                                            <span style={{ fontSize: '0.75rem', color: '#A0AEC0' }}>
                                                                {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '12px 16px' }}>
                                                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: typeColor, backgroundColor: typeColor + '10', padding: '2px 8px', borderRadius: '12px' }}>
                                                                {typeLabel}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '12px 16px', fontWeight: '700', color: amountColor }}>
                                                            {amountPrefix}₹{Math.abs(tx.amount).toFixed(2)}
                                                        </td>
                                                        <td style={{ padding: '12px 16px', color: '#718096', fontSize: '0.85rem' }}>
                                                            {tx.description}
                                                            {tx.orderId && (
                                                                <div style={{ fontSize: '0.75rem', color: '#A0AEC0', marginTop: '2px' }}>Order: #{tx.orderId.slice(-6)}</div>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: '12px 16px' }}>
                                                            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#48BB78', backgroundColor: '#C6F6D5', padding: '2px 8px', borderRadius: '12px' }}>
                                                                {tx.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                            {transactions.length > 0 ? (
                                <button
                                    onClick={downloadCSV}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', border: '1px solid #3182CE', backgroundColor: 'white', color: '#3182CE', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}
                                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#EBF8FF'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
                                >
                                    <Download size={18} /> Export CSV
                                </button>
                            ) : <div />}
                            <button
                                onClick={() => setHistoryModalOpen(false)}
                                style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F7FAFC', cursor: 'pointer', fontWeight: '600' }}
                            >
                                Close Log
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal */}
        </div>
    );
}
