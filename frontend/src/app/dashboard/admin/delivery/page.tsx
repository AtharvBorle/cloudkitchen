"use client";
import { fetchApi } from "@/lib/fetch-api";
import { useState, useEffect } from "react";
import { Phone, Mail, User, ShieldCheck, X } from "lucide-react";

export default function AdminDeliveryPage() {
    const [deliveryPersons, setDeliveryPersons] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [loading, setLoading] = useState(false);

    // Selected delivery boy details for modals
    const [selectedDp, setSelectedDp] = useState<any>(null);

    // Adjust Modal handlers
    const [adjustModalOpen, setAdjustModalOpen] = useState(false);
    const [adjAmount, setAdjAmount] = useState("");
    const [adjType, setAdjType] = useState<"INCREMENT" | "DECREMENT">("DECREMENT");
    const [adjDesc, setAdjDesc] = useState("");

    // Transactions Modal handlers
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loadingTx, setLoadingTx] = useState(false);

    const fetchDeliveryPersons = async () => {
        try {
            const res = await fetchApi("/api/admin/delivery");
            const data = await res.json();
            if (res.ok) setDeliveryPersons(data.deliveryPersons || []);
        } catch (error) {
            console.error("Failed to fetch delivery staff");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchDeliveryPersons();
    }, []);

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

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', fontFamily: 'var(--font-sans)' }}>
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1A1C23', marginBottom: '5px' }}>Delivery Staff & Wallets</h1>
                <p style={{ color: '#718096' }}>Monitor delivery crew outstanding COD balances and view complete transaction history logs.</p>
            </div>

            {fetching ? (
                <p>Loading delivery staff list...</p>
            ) : deliveryPersons.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <div style={{ backgroundColor: '#FEE2E2', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <User size={30} color="#F16F68" />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '10px' }}>No Delivery Staff Found</h3>
                    <p style={{ color: '#718096', maxWidth: '400px', margin: '0 auto' }}>
                        No delivery crew registered under any sellers yet.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#718096', fontSize: '0.9rem', marginTop: '4px' }}>
                                        <Mail size={14} /> {dp.email || "No email"}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#4F46E5', fontWeight: 'bold', marginTop: '6px' }}>
                                        Seller: {dp.sellerBusinessName}
                                    </div>
                                </div>
                            </div>

                            {/* Wallet Outstanding Section */}
                            <div style={{ padding: '15px 0', borderTop: '1px solid #EDF2F7', borderBottom: '1px solid #EDF2F7', margin: '15px 0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <span style={{ fontSize: '0.8rem', color: '#718096', display: 'block', fontWeight: '500' }}>Outstanding COD Balance</span>
                                        <span style={{ fontSize: '1.25rem', fontWeight: '800', color: dp.outstandingBalance > 0 ? '#E53E3E' : '#2D3748' }}>
                                            ₹{(dp.outstandingBalance || 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => openAdjustModal(dp)}
                                        style={{ backgroundColor: '#EDF2F7', color: '#4A5568', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                        Adjust Balance
                                    </button>
                                </div>
                                <div style={{ marginTop: '10px' }}>
                                    <button
                                        onClick={() => openHistoryModal(dp)}
                                        style={{ background: 'none', border: 'none', color: '#3182CE', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
                                    >
                                        📜 View Transaction History
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '5px' }}>
                                <span style={{
                                    fontSize: '0.8rem', fontWeight: '600', padding: '4px 10px', borderRadius: '20px',
                                    backgroundColor: dp.isActive ? '#C6F6D5' : '#FED7D7',
                                    color: dp.isActive ? '#22543D' : '#822727'
                                }}>
                                    {dp.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Adjust Balance Modal */}
            {adjustModalOpen && selectedDp && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '400px', padding: '30px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>Adjust Wallet Balance</h2>
                            <button onClick={() => setAdjustModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} color="#A0AEC0" />
                            </button>
                        </div>
                        <form onSubmit={handleAdjustBalance}>
                            <p style={{ color: '#718096', fontSize: '0.9rem', marginBottom: '15px' }}>
                                Manually adjust outstanding balance for <strong>{selectedDp.name}</strong> as Operations Admin.
                            </p>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', fontWeight: '500' }}>Adjustment Action</label>
                                <select
                                    value={adjType} onChange={e => setAdjType(e.target.value as any)}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '1rem' }}
                                >
                                    <option value="DECREMENT">Decrement (Reduce Balance)</option>
                                    <option value="INCREMENT">Increment (Increase Balance)</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', fontWeight: '500' }}>Amount</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#718096', fontWeight: 'bold' }}>₹</span>
                                    <input
                                        type="number" step="0.01" min="0.01" value={adjAmount} onChange={e => setAdjAmount(e.target.value)} required
                                        style={{ width: '100%', padding: '12px 12px 12px 30px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '1.1rem', fontWeight: 'bold' }}
                                    />
                                </div>
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', fontWeight: '500' }}>Description / Reason</label>
                                <input
                                    type="text" value={adjDesc} onChange={e => setAdjDesc(e.target.value)} required
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '1rem' }}
                                    placeholder="e.g. Balance settlement adjustment"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="button" onClick={() => setAdjustModalOpen(false)}
                                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: 'white', cursor: 'pointer', fontWeight: '600' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit" disabled={loading}
                                    style={{
                                        flex: 1, padding: '12px', borderRadius: '8px', border: 'none',
                                        backgroundColor: '#1E293B', color: 'white', cursor: 'pointer', fontWeight: '600'
                                    }}
                                >
                                    {loading ? 'Adjusting...' : 'Apply Adjustment'}
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

                        <div style={{ display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
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
        </div>
    );
}
