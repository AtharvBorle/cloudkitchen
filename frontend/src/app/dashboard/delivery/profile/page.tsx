"use client";
import { fetchApi } from "@/lib/fetch-api";

import { useState, useEffect } from "react";
import { PhoneInput } from "@/components/common/PhoneInput/PhoneInput";

export default function DeliveryProfilePage() {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [isEditing, setIsEditing] = useState(false);

    // Profile State
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [city, setCity] = useState("");
    const [pincode, setPincode] = useState("");
    const [businessName, setBusinessName] = useState("");
    const [fullAddress, setFullAddress] = useState("");

    // Original state for canceling
    const [originalData, setOriginalData] = useState<any>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetchApi("/api/delivery/profile");
                const data = await res.json();
                if (res.ok) {
                    const profileData = {
                        name: data.profile.user.name || "",
                        phone: data.profile.user.phone || "",
                        city: data.profile.user.city || "",
                        pincode: data.profile.user.pincode || "",
                        businessName: data.profile.seller.businessName || "",
                        fullAddress: `${data.profile.seller.addressFlat}, ${data.profile.seller.addressLocality}${data.profile.seller.addressLandmark ? `, ${data.profile.seller.addressLandmark}` : ""}`
                    };

                    setName(profileData.name);
                    setPhone(profileData.phone);
                    setCity(profileData.city);
                    setPincode(profileData.pincode);
                    setBusinessName(profileData.businessName);
                    setFullAddress(profileData.fullAddress);

                    setOriginalData(profileData);
                }
            } catch (error) {
                console.error("Error fetching delivery profile");
            } finally {
                setFetching(false);
            }
        };

        fetchProfile();
    }, []);

    const handleCancel = () => {
        if (originalData) {
            setName(originalData.name);
            setPhone(originalData.phone);
            setCity(originalData.city);
            setPincode(originalData.pincode);
        }
        setIsEditing(false);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetchApi("/api/delivery/profile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    phone,
                    city,
                    pincode,
                })
            });

            if (res.ok) {
                alert("Profile updated successfully!");

                // Update original data so cancel works correctly after save
                setOriginalData({
                    name, phone, city, pincode, businessName, fullAddress
                });
                setIsEditing(false);
            } else {
                alert("Failed to update profile");
            }
        } catch (error) {
            console.error("Error updating");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return <div>Loading profile data...</div>;
    }

    return (
        <div style={{ position: 'relative' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '30px' }}>
                Delivery Profile
            </h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', alignItems: 'flex-start' }}>

                {/* Edit Profile Form */}
                <div style={{ flex: '1 1 300px', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: 'var(--shadow-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{isEditing ? "Edit Profile" : "Profile Information"}</h2>
                        {!isEditing && (
                            <button type="button" onClick={() => setIsEditing(true)} className="btn btn-secondary" style={{ padding: '8px 16px', width: 'auto' }}>
                                Edit Profile
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleUpdate}>
                        <div className="input-group">
                            <label style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Full Name</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" disabled={!isEditing} required />
                        </div>

                        <div className="input-group">
                            <PhoneInput
                                label="Phone Number"
                                value={phone}
                                onChange={(val) => setPhone(val)}
                                disabled={!isEditing}
                                placeholder="98765 43210"
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>City</label>
                            <input type="text" value={city} onChange={e => setCity(e.target.value)} className="input-field" disabled={!isEditing} required />
                        </div>

                        <div className="input-group">
                            <label style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Pincode</label>
                            <input type="text" value={pincode} onChange={e => setPincode(e.target.value)} className="input-field" disabled={!isEditing} required />
                        </div>

                        <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #EEE' }} />

                        <div className="input-group">
                            <label style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Assigned Kitchen</label>
                            <input type="text" value={businessName} className="input-field" disabled style={{ backgroundColor: '#F9F9F9' }} />
                        </div>

                        <div className="input-group" style={{ marginBottom: '30px' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Kitchen Address</label>
                            <textarea value={fullAddress} className="input-field" rows={2} style={{ resize: 'none', backgroundColor: '#F9F9F9' }} disabled></textarea>
                        </div>

                        {isEditing && (
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <button type="submit" className="btn btn-coral" style={{ flex: 1, padding: '12px 24px' }} disabled={loading}>
                                    {loading ? "Saving..." : "Confirm Changes and Save"}
                                </button>
                                <button type="button" onClick={handleCancel} className="btn" style={{ width: 'auto', padding: '12px 24px', backgroundColor: '#EAEAEA', color: '#333' }} disabled={loading}>
                                    Cancel
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
