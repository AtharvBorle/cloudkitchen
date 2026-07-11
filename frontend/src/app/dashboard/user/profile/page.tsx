"use client";
import { fetchApi } from "@/lib/fetch-api";


import { useState, useEffect } from "react";
import { User, Phone, MapPin, Plus, Star, Edit, Trash2 } from "lucide-react";
import { useLocation } from "@/components/location-provider";
import { HouseMapPicker } from "@/components/house-map-picker";

export default function UserProfilePage() {
    const [profile, setProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingPhone, setIsSavingPhone] = useState(false);
    const [phoneInput, setPhoneInput] = useState("");
    const { refreshAddress } = useLocation();

    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
    const [addressForm, setAddressForm] = useState({
        type: "Home",
        houseNumber: "",
        street: "",
        landmark: "",
        pincode: "",
        latitude: null as number | null,
        longitude: null as number | null,
        isDefault: false
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setIsLoading(true);
        try {
            const res = await fetchApi("/api/user/profile");
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setPhoneInput(data.phone || "");
            }
        } catch (error) {
            console.error("Failed to load profile", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdatePhone = async () => {
        if (phoneInput.length !== 10) {
            alert("Mobile number must be exactly 10 digits.");
            return;
        }
        setIsSavingPhone(true);
        try {
            const res = await fetchApi("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: phoneInput })
            });
            if (res.ok) {
                alert("Phone number updated successfully!");
                fetchProfile();
            } else {
                const data = await res.json();
                alert(data.message || "Failed to update phone.");
            }
        } catch (error) {
            alert("An error occurred while saving phone number.");
        } finally {
            setIsSavingPhone(false);
        }
    };

    const handleSaveAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (addressForm.pincode.length !== 6) {
            alert("Pincode must be exactly 6 digits.");
            return;
        }
        if (addressForm.latitude === null || addressForm.longitude === null) {
            alert("Approximate location pin of the house is compulsory. Please select it on the map.");
            return;
        }
        try {
            const method = editingAddressId ? "PUT" : "POST";
            const url = editingAddressId ? `/api/user/addresses/${editingAddressId}` : "/api/user/addresses";

            const res = await fetchApi(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(addressForm)
            });

            if (res.ok) {
                setShowAddressForm(false);
                setEditingAddressId(null);
                setAddressForm({ type: "Home", houseNumber: "", street: "", landmark: "", pincode: "", latitude: null, longitude: null, isDefault: false });
                await fetchProfile();
                await refreshAddress();
            } else {
                const data = await res.json();
                alert(data.message || "Failed to save address.");
            }
        } catch (error) {
            alert("An error occurred while saving the address.");
        }
    };

    const handleDeleteAddress = async (id: string) => {
        if (!confirm("Are you sure you want to delete this address?")) return;
        try {
            const res = await fetchApi(`/api/user/addresses/${id}`, { method: "DELETE" });
            if (res.ok) {
                await fetchProfile();
                await refreshAddress();
            } else {
                alert("Failed to delete address.");
            }
        } catch (error) {
            alert("An error occurred.");
        }
    };

    const handleSetDefaultAddress = async (id: string) => {
        try {
            const res = await fetchApi(`/api/user/addresses/${id}/default`, { method: "PATCH" });
            if (res.ok) {
                await fetchProfile();
                await refreshAddress();
            } else {
                alert("Failed to set default address.");
            }
        } catch (error) {
            alert("An error occurred.");
        }
    };

    const openEditAddress = (address: any) => {
        setAddressForm({
            type: address.type,
            houseNumber: address.houseNumber,
            street: address.street,
            landmark: address.landmark || "",
            pincode: address.pincode,
            latitude: address.latitude ? parseFloat(address.latitude) : null,
            longitude: address.longitude ? parseFloat(address.longitude) : null,
            isDefault: address.isDefault
        });
        setEditingAddressId(address.id);
        setShowAddressForm(true);
    };

    if (isLoading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading Profile...</div>;
    if (!profile) return <div style={{ padding: "40px", textAlign: "center", color: 'red' }}>Failed to load profile.</div>;

    return (
        <div>
            <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "30px" }}>My Profile</h1>

            <div style={{ display: "flex", gap: "30px", flexWrap: "wrap", alignItems: "flex-start" }}>

                {/* Profile Details Card */}
                <div style={{ flex: '1 1 300px', backgroundColor: "white", padding: "30px", borderRadius: "12px", boxShadow: "var(--shadow-card)" }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', paddingBottom: '20px', borderBottom: '1px solid #EEE' }}>
                        <div style={{ width: '60px', height: '60px', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                            {profile.name?.charAt(0) || <User size={30} />}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{profile.name}</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{profile.email}</p>
                        </div>
                    </div>

                    <div style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "8px", fontWeight: '500' }}>Phone Number</label>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <div style={{ display: "flex", flex: 1, alignItems: "center", gap: "10px", backgroundColor: "#F8FAFC", padding: "12px 16px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                                <Phone size={16} color="#64748B" />
                                <input
                                    type="text"
                                    value={phoneInput}
                                    onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    placeholder="Enter 10-digit number"
                                    style={{ border: 'none', background: 'none', width: '100%', outline: 'none', fontSize: '0.95rem', fontWeight: '600', color: '#1E293B' }}
                                />
                            </div>
                            <button
                                onClick={handleUpdatePhone}
                                disabled={isSavingPhone}
                                className="btn btn-primary"
                                style={{ padding: '0 24px', fontSize: '0.9rem', width: 'auto', whiteSpace: 'nowrap' }}
                            >
                                {isSavingPhone ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Addresses Card */}
                <div style={{ flex: '2 1 500px', backgroundColor: "white", padding: "30px", borderRadius: "12px", boxShadow: "var(--shadow-card)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", paddingBottom: "15px", borderBottom: "1px solid #EEE" }}>
                        <h2 style={{ fontSize: "1.4rem", fontWeight: "bold", display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MapPin size={24} color="var(--primary)" /> Saved Addresses
                        </h2>
                        {!showAddressForm && (
                            <button onClick={() => { setEditingAddressId(null); setAddressForm({ type: "Home", houseNumber: "", street: "", landmark: "", pincode: "", latitude: null, longitude: null, isDefault: false }); setShowAddressForm(true); }} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px' }}>
                                <Plus size={18} /> Add New
                            </button>
                        )}
                    </div>

                    {showAddressForm && (
                        <div style={{ backgroundColor: '#F9FAFB', padding: '20px', borderRadius: '8px', marginBottom: '25px', border: '1px solid #EAEAEA' }}>
                            <h3 style={{ fontWeight: 'bold', marginBottom: '15px' }}>{editingAddressId ? 'Edit Address' : 'Add New Address'}</h3>
                            <form onSubmit={handleSaveAddress}>
                                <div style={{ marginBottom: '15px' }}>
                                    <HouseMapPicker
                                        latitude={addressForm.latitude}
                                        longitude={addressForm.longitude}
                                        onChange={(lat, lng, details) => {
                                            setAddressForm(prev => ({
                                                ...prev,
                                                latitude: lat,
                                                longitude: lng,
                                                pincode: details?.pincode ? details.pincode.replace(/\D/g, '').slice(0, 6) : prev.pincode,
                                                street: details?.street || prev.street,
                                                landmark: details?.landmark || prev.landmark,
                                                houseNumber: details?.houseNumber || prev.houseNumber
                                            }));
                                        }}
                                    />
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Address Type</label>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        {['Home', 'Work', 'Other'].map(type => (
                                            <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                                <input type="radio" value={type} checked={addressForm.type === type} onChange={(e) => setAddressForm({ ...addressForm, type: e.target.value })} />
                                                {type}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>House/Flat/Floor *</label>
                                    <input
                                        type="text"
                                        required
                                        value={addressForm.houseNumber}
                                        onChange={(e) => setAddressForm({ ...addressForm, houseNumber: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Street *</label>
                                    <input
                                        type="text"
                                        required
                                        value={addressForm.street}
                                        onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Landmark (Optional)</label>
                                    <input
                                        type="text"
                                        value={addressForm.landmark}
                                        onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Pincode *</label>
                                    <input
                                        type="text"
                                        required
                                        value={addressForm.pincode}
                                        onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                        className="input-field"
                                    />
                                </div>
                                {!editingAddressId && profile.addresses?.length > 0 && (
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })} />
                                        <span>Set as default address</span>
                                    </label>
                                )}
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button type="submit" className="btn btn-primary">Save Address</button>
                                    <button type="button" onClick={() => setShowAddressForm(false)} className="btn btn-secondary" style={{ backgroundColor: '#FFF', color: 'var(--text-main)', border: '1px solid #EAEAEA' }}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {!profile.addresses || profile.addresses.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "30px 20px", color: "var(--text-muted)", backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                            <MapPin size={40} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
                            <p>No addresses saved yet.</p>
                            <p style={{ fontSize: '0.9rem', marginTop: '5px' }}>Add an address to make checkout faster.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {profile.addresses.map((addr: any) => (
                                <div key={addr.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px', border: addr.isDefault ? '2px solid var(--primary)' : '1px solid #EAEAEA', borderRadius: '8px', backgroundColor: addr.isDefault ? '#FFF' : '#F9FAFB', position: 'relative' }}>
                                    {addr.isDefault && (
                                        <div style={{ position: 'absolute', top: '-10px', left: '15px', backgroundColor: 'var(--primary)', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <Star size={10} fill="white" /> Default
                                        </div>
                                    )}
                                    <div style={{ flex: 1, paddingRight: '20px' }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ padding: '3px 8px', backgroundColor: '#E0F2FE', color: '#0369A1', borderRadius: '4px', fontSize: '0.8rem' }}>{addr.type}</span>
                                        </div>
                                        <p style={{ color: 'var(--text-main)', lineHeight: '1.5' }}>
                                            {addr.houseNumber}, {addr.street} <br />
                                            {addr.landmark && <>{addr.landmark} <br /></>}
                                            {addr.pincode}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => openEditAddress(addr)} style={{ padding: '6px', color: 'var(--text-muted)', backgroundColor: '#FFF', border: '1px solid #EAEAEA', borderRadius: '6px', cursor: 'pointer' }} title="Edit"><Edit size={16} /></button>
                                            <button onClick={() => handleDeleteAddress(addr.id)} style={{ padding: '6px', color: '#EF4444', backgroundColor: '#FFF', border: '1px solid #FEE2E2', borderRadius: '6px', cursor: 'pointer' }} title="Delete"><Trash2 size={16} /></button>
                                        </div>
                                        {!addr.isDefault && (
                                            <button onClick={() => handleSetDefaultAddress(addr.id)} style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                                                Set as Default
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
