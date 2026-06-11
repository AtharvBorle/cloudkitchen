"use client";
import { fetchApi } from "@/lib/fetch-api";


import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Save } from "lucide-react";

export default function SellerInventoryPage() {
    const [inventory, setInventory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const res = await fetchApi("/api/seller/menu");
            const data = await res.json();
            if (res.ok) setInventory(data.items || []);
        } catch (error) {
            console.error("Failed to fetch inventory", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const handleFieldChange = (id: string, field: string, value: any) => {
        setInventory(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleSave = async (id: string) => {
        setSaving(id);
        const itemToSave = inventory.find(i => i.id === id);
        if (!itemToSave) return;

        try {
            const res = await fetchApi(`/api/seller/menu/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    price: parseFloat(itemToSave.price),
                    stockQuantity: parseInt(itemToSave.stockQuantity),
                    isAvailable: itemToSave.isAvailable
                })
            });

            if (!res.ok) {
                alert("Failed to update item.");
                fetchInventory(); // Revert on failure
            }
        } catch (error) {
            console.error("Save error", error);
            alert("An error occurred.");
        } finally {
            setSaving(null);
        }
    };

    return (
        <div style={{ paddingBottom: '50px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '5px' }}>Inventory Management</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Quickly edit stock, prices, and availability.</p>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading inventory...</div>
            ) : inventory.length === 0 ? (
                <div style={{ backgroundColor: '#F8F9F9', padding: '40px', textAlign: 'center', borderRadius: '12px', color: 'var(--text-muted)' }}>
                    No menu items found. <Link href="/dashboard/seller/menu" style={{ color: "var(--teal)", textDecoration: "underline" }}>Add items in Manage Menu</Link>.
                </div>
            ) : (
                <div className="table-responsive" style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: 'var(--shadow-card)' }}>
                    <table style={{ minWidth: '800px', width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: '#F8F9F9', borderBottom: '2px solid #EAEAEA' }}>
                            <tr>
                                <th style={{ padding: '15px 20px', color: 'var(--text-muted)', fontWeight: 'bold' }}>Item Name</th>
                                <th style={{ padding: '15px 20px', color: 'var(--text-muted)', fontWeight: 'bold', width: '150px' }}>Price (₹)</th>
                                <th style={{ padding: '15px 20px', color: 'var(--text-muted)', fontWeight: 'bold', width: '150px' }}>Stock Quantity</th>
                                <th style={{ padding: '15px 20px', color: 'var(--text-muted)', fontWeight: 'bold', width: '150px', textAlign: 'center' }}>Status</th>
                                <th style={{ padding: '15px 20px', color: 'var(--text-muted)', fontWeight: 'bold', width: '120px', textAlign: 'center' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventory.map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #EAEAEA' }}>
                                    <td style={{ padding: '15px 20px', fontWeight: '500', color: 'var(--text-main)' }}>
                                        {item.name}
                                    </td>
                                    <td style={{ padding: '15px 20px' }}>
                                        <input
                                            type="number"
                                            value={item.price}
                                            onChange={(e) => handleFieldChange(item.id, 'price', e.target.value)}
                                            style={{ width: '100%', padding: '8px', border: '1px solid #CCC', borderRadius: '4px', textAlign: 'right' }}
                                        />
                                    </td>
                                    <td style={{ padding: '15px 20px' }}>
                                        <input
                                            type="number"
                                            value={item.stockQuantity}
                                            onChange={(e) => handleFieldChange(item.id, 'stockQuantity', e.target.value)}
                                            style={{ width: '100%', padding: '8px', border: '1px solid #CCC', borderRadius: '4px', textAlign: 'right' }}
                                        />
                                    </td>
                                    <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                                        <select
                                            value={item.isAvailable ? "true" : "false"}
                                            onChange={(e) => handleFieldChange(item.id, 'isAvailable', e.target.value === "true")}
                                            style={{
                                                padding: '8px',
                                                border: '1px solid #CCC',
                                                borderRadius: '4px',
                                                backgroundColor: item.isAvailable ? '#E8F8F5' : '#FEE2E2',
                                                color: item.isAvailable ? 'var(--teal)' : '#B91C1C',
                                                fontWeight: 'bold',
                                                width: '100%',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="true">Available</option>
                                            <option value="false">Unavailable</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                                        <button
                                            onClick={() => handleSave(item.id)}
                                            disabled={saving === item.id}
                                            className="btn btn-primary"
                                            style={{ width: 'auto', padding: '8px 15px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                        >
                                            {saving === item.id ? "Saving..." : <><Save size={16} /> Save</>}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
