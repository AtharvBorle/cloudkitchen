"use client";
import { fetchApi } from "@/lib/fetch-api";


import { useState, useEffect } from "react";
import Link from "next/link";
import QRCode from "react-qr-code";

export default function ProfileAndQRPage() {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [isEditing, setIsEditing] = useState(false);

    // Profile State
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [businessName, setBusinessName] = useState("");
    const [city, setCity] = useState("");
    const [pincode, setPincode] = useState("");
    const [infoAddress, setInfoAddress] = useState("");
    const [upiId, setUpiId] = useState("");
    const [trackingId, setTrackingId] = useState("");
    const [shopId, setShopId] = useState("");
    const [bannerUrlPreview, setBannerUrlPreview] = useState("");

    // Original state for canceling
    const [originalData, setOriginalData] = useState<any>(null);

    const [bannerFile, setBannerFile] = useState<File | null>(null);

    // Hardcode origin for demo purposes if window is undefined
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const shopUrl = `${origin}/shop/${trackingId}`;

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetchApi("/api/seller/profile");
                const data = await res.json();
                if (res.ok) {
                    const profileData = {
                        name: data.user.name || "",
                        phone: data.user.phone || "",
                        city: data.user.city || "",
                        pincode: data.user.pincode || "",
                        businessName: data.user.sellerProfile?.businessName || "",
                        infoAddress: `${data.user.sellerProfile?.addressFlat || ""}, ${data.user.sellerProfile?.addressLocality || ""}${data.user.sellerProfile?.addressLandmark ? `, ${data.user.sellerProfile?.addressLandmark}` : ""}`,
                        upiId: data.user.sellerProfile?.upiId || "",
                        trackingId: data.user.sellerProfile?.trackingId || "",
                        shopId: data.user.sellerProfile?.id || "",
                        bannerImageUrl: data.user.sellerProfile?.bannerImageUrl || ""
                    };

                    setName(profileData.name);
                    setPhone(profileData.phone);
                    setCity(profileData.city);
                    setPincode(profileData.pincode);
                    setBusinessName(profileData.businessName);
                    setInfoAddress(profileData.infoAddress);
                    setUpiId(profileData.upiId);
                    setTrackingId(profileData.trackingId);
                    setShopId(profileData.shopId);
                    setBannerUrlPreview(profileData.bannerImageUrl);

                    setOriginalData(profileData);
                }
            } catch (error) {
                console.error("Error fetching profile");
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
            setBusinessName(originalData.businessName);
            setInfoAddress(originalData.infoAddress);
            setUpiId(originalData.upiId);
            setBannerUrlPreview(originalData.bannerImageUrl);
            setBannerFile(null);
        }
        setIsEditing(false);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append("name", name);
        formData.append("phone", phone);
        formData.append("businessName", businessName);
        formData.append("city", city);
        formData.append("pincode", pincode);
        formData.append("infoAddress", infoAddress);
        formData.append("upiId", upiId);
        if (bannerFile) formData.append("bannerImageFile", bannerFile);

        try {
            const res = await fetchApi("/api/seller/profile", {
                method: "POST",
                body: formData
            });

            const data = await res.json();
            if (res.ok) {
                alert("Profile updated successfully!");
                if (data.profile.bannerImageUrl) {
                    setBannerUrlPreview(data.profile.bannerImageUrl);
                }

                // Update original data so cancel works correctly after save
                setOriginalData({
                    name, phone, city, pincode, businessName, infoAddress, upiId, trackingId,
                    bannerImageUrl: data.profile.bannerImageUrl || bannerUrlPreview
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

    const handlePrintQR = (elementId: string, title: string) => {
        const svg = document.getElementById(elementId);
        if (!svg) return;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>${title}</title>
                        <style>
                            body { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: sans-serif; }
                            svg { width: 300px; height: 300px; margin-top: 20px;}
                        </style>
                    </head>
                    <body>
                        <h2>${title}</h2>
                        ${svg.outerHTML}
                        <script>
                            window.onload = function() { // Add slight delay to ensure rendering
                                setTimeout(() => {
                                    window.print();
                                    window.close();
                                }, 500);
                            }
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    const handleDownloadQR = (elementId: string, filename: string) => {
        const svg = document.getElementById(elementId);
        if (!svg) return;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        const padding = 20;

        img.onload = () => {
            canvas.width = img.width + padding * 2;
            canvas.height = img.height + padding * 2;
            if (ctx) {
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, padding, padding);
            }

            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = filename;
            downloadLink.href = pngFile;
            downloadLink.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    };

    if (fetching) {
        return <div>Loading profile data...</div>;
    }

    return (
        <div style={{ position: 'relative' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '30px' }}>
                Profile & Check-in QR
            </h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', alignItems: 'flex-start' }}>

                {/* Left Side: Edit Profile Form */}
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
                            <label style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Phone Number</label>
                            <input type="text" inputMode="numeric" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} className="input-field" disabled={!isEditing} required />
                        </div>

                        <div className="input-group">
                            <label style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Business Name</label>
                            <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} className="input-field" disabled={!isEditing} required />
                        </div>

                        <div className="input-group">
                            <label style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>City</label>
                            <input type="text" value={city} onChange={e => setCity(e.target.value)} className="input-field" disabled={!isEditing} required />
                        </div>

                        <div className="input-group">
                            <label style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Pincode</label>
                            <input type="text" inputMode="numeric" value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, ''))} className="input-field" disabled={!isEditing} required />
                        </div>

                        <div className="input-group">
                            <label style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Information Address</label>
                            <textarea value={infoAddress} onChange={e => setInfoAddress(e.target.value)} className="input-field" rows={3} style={{ resize: 'none' }} disabled={!isEditing} required></textarea>
                        </div>

                        <div className="input-group">
                            <label style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'block', marginBottom: '8px', color: 'var(--primary)' }}>UPI ID (for Payments)</label>
                            <input type="text" value={upiId} onChange={e => setUpiId(e.target.value)} className="input-field" placeholder="yourapi@bank" disabled={!isEditing} />
                        </div>

                        <div className="input-group" style={{ marginBottom: '30px' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Banner Image (Displayed on User Dashboard)</label>
                            {bannerUrlPreview && (
                                <div style={{ marginBottom: '10px', width: '200px', height: '120px', backgroundColor: '#EEE', borderRadius: '4px', overflow: 'hidden', opacity: isEditing ? 1 : 0.7 }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={bannerUrlPreview} alt="Banner Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            )}
                            {isEditing && (
                                <input type="file" onChange={e => setBannerFile(e.target.files?.[0] || null)} className="input-field" accept="image/*" />
                            )}
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

                {/* Right Side: QR Codes */}
                <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '30px' }}>

                    {/* Public Shop QR */}
                    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: 'var(--shadow-card)', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px' }}>Your Kitchen QR Code</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '25px' }}>Scan to view your digital menu & rooms.</p>

                        <div style={{ display: 'inline-block', padding: '15px', border: '1px dashed #CCC', borderRadius: '8px', marginBottom: '20px' }}>
                            <div style={{ backgroundColor: 'white', padding: '10px' }}>
                                {trackingId ? <QRCode id="shop-qr-code" value={shopUrl} size={180} /> : <div style={{ width: '180px', height: '180px', backgroundColor: '#EEE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>Generating...</div>}
                            </div>
                        </div>

                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Public URI:</p>
                        <a href={shopUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: 'var(--primary)', wordBreak: 'break-all', display: 'block', marginBottom: '20px' }}>
                            {shopUrl}
                        </a>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button className="btn btn-teal" style={{ width: 'auto', padding: '10px 15px', fontSize: '0.85rem' }} onClick={() => handlePrintQR('shop-qr-code', 'Shop QR Code')}>
                                Print QR
                            </button>
                            <button className="btn btn-secondary" style={{ width: 'auto', padding: '10px 15px', fontSize: '0.85rem' }} onClick={() => handleDownloadQR('shop-qr-code', 'shop_qr.png')}>
                                Download Image
                            </button>
                        </div>
                    </div>

                    {/* Payment QR */}
                    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: 'var(--shadow-card)', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px' }}>Payment QR</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '25px' }}>Sample Payment QR (Dynamic in Orders)</p>

                        <div style={{ display: 'inline-block', padding: '15px', border: '1px dashed #CCC', borderRadius: '8px', marginBottom: '20px' }}>
                            <div style={{ backgroundColor: 'white', padding: '10px' }}>
                                {upiId ? (
                                    <QRCode id="payment-qr-code" value={`upi://pay?pa=${upiId}&pn=${encodeURIComponent(businessName)}&cu=INR`} size={180} />
                                ) : (
                                    <div style={{ width: '180px', height: '180px', backgroundColor: '#EEE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '0.8rem', textAlign: 'center', padding: '20px' }}>
                                        Add your UPI ID to generate Payment QR
                                    </div>
                                )}
                            </div>
                        </div>

                        {upiId && (
                            <p style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '20px' }}>{upiId}</p>
                        )}

                        {upiId && (
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <button className="btn btn-teal" style={{ width: 'auto', padding: '10px 15px', fontSize: '0.85rem' }} onClick={() => handlePrintQR('payment-qr-code', 'Payment QR Code')}>
                                    Print QR
                                </button>
                                <button className="btn btn-secondary" style={{ width: 'auto', padding: '10px 15px', fontSize: '0.85rem' }} onClick={() => handleDownloadQR('payment-qr-code', 'payment_qr.png')}>
                                    Download Image
                                </button>
                            </div>
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
}
