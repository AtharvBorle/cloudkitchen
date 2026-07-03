"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/fetch-api";
import CameraCaptureModal from "@/app/components/CameraCaptureModal";

export default function SellerSidebar({ isMobileOpen, onClose }: { isMobileOpen?: boolean; onClose?: () => void }) {
    const pathname = usePathname();
    const [isMobile, setIsMobile] = useState(false);
    const [statusData, setStatusData] = useState<any>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalCategory, setModalCategory] = useState<"FOOD" | "PROPERTY" | null>(null);
    const [categoryPlans, setCategoryPlans] = useState<any[]>([]);

    useEffect(() => {
        const checkScreen = () => setIsMobile(window.innerWidth <= 768);
        checkScreen();
        window.addEventListener("resize", checkScreen);
        return () => window.removeEventListener("resize", checkScreen);
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await fetchApi("/api/seller/dashboard/status");
            if (res.ok) {
                const data = await res.json();
                setStatusData(data.data || data);
            }
        } catch (err) {
            console.error("Failed to fetch dashboard status in sidebar:", err);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const [submitting, setSubmitting] = useState(false);
    const [fssaiFile, setFssaiFile] = useState<File | null>(null);
    const [kitchenImages, setKitchenImages] = useState<(File | null)[]>([null, null, null]);
    const [cuisineImages, setCuisineImages] = useState<(File | null)[]>([null, null, null]);
    const [roomImages, setRoomImages] = useState<(File | null)[]>([null, null, null]);
    const [cameraMode, setCameraMode] = useState<'fssai' | 'kitchen0' | 'kitchen1' | 'kitchen2' | 'cuisine0' | 'cuisine1' | 'cuisine2' | 'room0' | 'room1' | 'room2' | null>(null);

    const handleCameraCapture = (file: File) => {
        if (cameraMode === 'fssai') {
            setFssaiFile(file);
        } else if (cameraMode?.startsWith('kitchen')) {
            const idx = parseInt(cameraMode.replace('kitchen', ''));
            const copy = [...kitchenImages];
            copy[idx] = file;
            setKitchenImages(copy);
        } else if (cameraMode?.startsWith('cuisine')) {
            const idx = parseInt(cameraMode.replace('cuisine', ''));
            const copy = [...cuisineImages];
            copy[idx] = file;
            setCuisineImages(copy);
        } else if (cameraMode?.startsWith('room')) {
            const idx = parseInt(cameraMode.replace('room', ''));
            const copy = [...roomImages];
            copy[idx] = file;
            setRoomImages(copy);
        }
        setCameraMode(null);
    };

    const renderFieldInput = (
        label: string,
        file: File | null,
        setFile: (f: File | null) => void,
        cameraModeName: string,
        required: boolean
    ) => {
        return (
            <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                    {label} {required && " *"}
                </label>
                {!file ? (
                    <div style={{ display: "flex", gap: "8px" }}>
                        <label style={{ flex: 1, padding: "8px", backgroundColor: "#f8fafc", color: "#475569", borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "600", textAlign: "center", border: "1px dashed #cbd5e1" }}>
                            Upload
                            <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                style={{ display: "none" }}
                            />
                        </label>
                        <button
                            type="button"
                            onClick={() => setCameraMode(cameraModeName as any)}
                            style={{ flex: 1, padding: "8px", backgroundColor: "#f8fafc", color: "#475569", borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "600", textAlign: "center", border: "1px dashed #cbd5e1" }}
                        >
                            Take Photo
                        </button>
                    </div>
                ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "8px", backgroundColor: "#f8fafc" }}>
                        <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.8rem", color: "#334155" }}>
                            {file.name}
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                            <label style={{ padding: "4px 8px", backgroundColor: "#e2e8f0", color: "#334155", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "600" }}>
                                Change
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    style={{ display: "none" }}
                                />
                            </label>
                            <button
                                type="button"
                                onClick={() => setFile(null)}
                                style={{ padding: "4px 8px", backgroundColor: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "600" }}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("category", modalCategory!);

            if (modalCategory === "FOOD") {
                if (fssaiFile) formData.append("fssaiFile", fssaiFile);
                kitchenImages.forEach((img, idx) => {
                    if (img) formData.append(`kitchenImage_${idx}`, img);
                });
                cuisineImages.forEach((img, idx) => {
                    if (img) formData.append(`cuisineImage_${idx}`, img);
                });
            } else if (modalCategory === "PROPERTY") {
                roomImages.forEach((img, idx) => {
                    if (img) formData.append(`roomImage_${idx}`, img);
                });
            }

            const res = await fetchApi("/api/seller/category-application", {
                method: "POST",
                body: formData
            });

            if (res.ok) {
                alert(`Successfully submitted application for ${modalCategory === "FOOD" ? "Food" : "Property"} verification!`);
                setFssaiFile(null);
                setKitchenImages([null, null, null]);
                setCuisineImages([null, null, null]);
                setRoomImages([null, null, null]);
                setModalOpen(false);
                await fetchStatus();
            } else {
                const errData = await res.json();
                alert(errData.message || "Failed to submit application");
            }
        } catch (error) {
            console.error("Error applying for category:", error);
            alert("An error occurred. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const isFoodActive = statusData ? statusData.isFoodActive : true;
    const isPropertyActive = statusData ? statusData.isPropertyActive : true;

    const handleCategoryClick = async (e: React.MouseEvent, category: "FOOD" | "PROPERTY", isActive: boolean) => {
        if (isActive) {
            if (onClose) onClose();
            return;
        }
        e.preventDefault();
        setModalCategory(category);
        setModalOpen(true);
        setCategoryPlans([]);

        const verification = category === "FOOD"
            ? (statusData?.sellerProfile?.foodVerificationStatus || "NONE")
            : (statusData?.sellerProfile?.propertyVerificationStatus || "NONE");

        if (verification !== "APPROVED") {
            return;
        }

        try {
            const res = await fetchApi(`/api/seller/subscription/plans?category=${category}`);
            if (res.ok) {
                const data = await res.json();
                setCategoryPlans(data.data || data || []);
            }
        } catch (error) {
            console.error("Failed to load category plans:", error);
        }
    };

    const getLinkStyle = (path: string, exact = false) => {
        const isActive = exact ? pathname === path : pathname.startsWith(path);
        if (isActive) {
            return {
                display: 'block',
                padding: '12px 20px',
                borderRadius: '4px',
                marginBottom: '5px',
                backgroundColor: 'var(--coral, #F16F68)',
                color: 'white',
                fontWeight: '500'
            };
        }
        return {
            display: 'block',
            padding: '12px 20px',
            borderRadius: '4px',
            marginBottom: '5px',
            color: '#A0AEC0',
            borderBottom: '1px solid #2D303E'
        };
    };

    const sidebarContent = (
        <>
            <div style={{ padding: '20px', fontSize: '1.25rem', fontWeight: 'bold', borderBottom: '1px solid #2D303E', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Kitchen Dashboard
                {isMobile && <button onClick={onClose} style={{ color: 'white', fontSize: '1.5rem' }}>&times;</button>}
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', padding: '0 10px' }}>
                <Link href="/dashboard/seller" style={getLinkStyle('/dashboard/seller', true)} onClick={onClose}>
                    Overview
                </Link>

                <Link 
                    href="/dashboard/seller/menu" 
                    style={getLinkStyle('/dashboard/seller/menu')} 
                    onClick={(e) => handleCategoryClick(e, "FOOD", isFoodActive)}
                >
                    Manage Menu
                </Link>

                <Link 
                    href="/dashboard/seller/inventory" 
                    style={getLinkStyle('/dashboard/seller/inventory')} 
                    onClick={(e) => handleCategoryClick(e, "FOOD", isFoodActive)}
                >
                    Inventory & Stock
                </Link>

                <Link 
                    href="/dashboard/seller/orders" 
                    style={getLinkStyle('/dashboard/seller/orders')} 
                    onClick={(e) => handleCategoryClick(e, "FOOD", isFoodActive)}
                >
                    Orders
                </Link>

                <Link 
                    href="/dashboard/seller/delivery" 
                    style={getLinkStyle('/dashboard/seller/delivery')} 
                    onClick={(e) => handleCategoryClick(e, "FOOD", isFoodActive)}
                >
                    Delivery Persons
                </Link>

                <Link href="/dashboard/seller/offers" style={getLinkStyle('/dashboard/seller/offers')} onClick={onClose}>
                    Offers & Coupons
                </Link>

                <Link href="/dashboard/seller/reviews" style={getLinkStyle('/dashboard/seller/reviews')} onClick={onClose}>
                    Reviews & Feedback
                </Link>

                <Link 
                    href="/dashboard/seller/rooms" 
                    style={getLinkStyle('/dashboard/seller/rooms')} 
                    onClick={(e) => handleCategoryClick(e, "PROPERTY", isPropertyActive)}
                >
                    Rooms
                </Link>

                <Link href="/dashboard/seller/profile" style={getLinkStyle('/dashboard/seller/profile')} onClick={onClose}>
                    Profile & QR
                </Link>

                <Link href="/dashboard/seller/support" style={getLinkStyle('/dashboard/seller/support')} onClick={onClose}>
                    Support & Tickets
                </Link>

                <button
                    onClick={async (e) => {
                        e.preventDefault();
                        await signOut({ callbackUrl: window.location.origin + "/seller" });
                    }}
                    style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '12px 20px',
                        color: '#A0AEC0',
                        marginTop: '10px',
                        cursor: 'pointer',
                        background: 'none',
                        border: 'none',
                        fontFamily: 'inherit',
                        fontSize: 'inherit'
                    }}
                >
                    Logout
                </button>
            </nav>
        </>
    );

    return (
        <>
            {isMobile ? (
                <div style={{
                    position: 'fixed', top: 0, left: 0, height: '100vh', width: '250px',
                    backgroundColor: '#1A1C23', color: 'white', zIndex: 100,
                    transform: isMobileOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.3s ease-in-out',
                    display: 'flex', flexDirection: 'column',
                    boxShadow: isMobileOpen ? '5px 0 15px rgba(0,0,0,0.5)' : 'none'
                }}>
                    {sidebarContent}
                </div>
            ) : (
                <aside style={{ width: '250px', backgroundColor: '#1A1C23', color: 'white', display: 'flex', flexDirection: 'column', minHeight: '100vh', flexShrink: 0 }}>
                    {sidebarContent}
                </aside>
            )}

            {modalOpen && modalCategory && (() => {
                const verification = modalCategory === "FOOD"
                    ? (statusData?.sellerProfile?.foodVerificationStatus || "NONE")
                    : (statusData?.sellerProfile?.propertyVerificationStatus || "NONE");

                return (
                    <div style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 99999,
                        color: "#1e293b",
                        padding: "1rem"
                    }}>
                        <div style={{
                            backgroundColor: "white",
                            borderRadius: "20px",
                            padding: "2rem",
                            maxWidth: "480px",
                            width: "100%",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                            textAlign: "center",
                            border: "1px solid #e2e8f0"
                        }}>
                            {verification === "PENDING" ? (
                                <>
                                    <div style={{
                                        width: "60px",
                                        height: "60px",
                                        borderRadius: "50%",
                                        backgroundColor: "#fef3c7",
                                        color: "#d97706",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "1.5rem",
                                        fontWeight: "bold",
                                        margin: "0 auto 1rem"
                                    }}>
                                        ⏳
                                    </div>
                                    <h3 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "0.5rem" }}>
                                        Verification Pending
                                    </h3>
                                    <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: "1.5", marginBottom: "1.5rem" }}>
                                        Your request to add the {modalCategory.toLowerCase()} category is under review. Our admins will verify your documents shortly.
                                    </p>
                                    <div style={{ display: "flex", gap: "10px" }}>
                                        <button
                                            onClick={() => setModalOpen(false)}
                                            style={{
                                                flex: 1,
                                                padding: "10px",
                                                border: "1px solid #cbd5e1",
                                                borderRadius: "10px",
                                                backgroundColor: "white",
                                                cursor: "pointer",
                                                fontWeight: "600"
                                            }}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </>
                            ) : verification !== "APPROVED" ? (
                                <form onSubmit={handleFormSubmit} style={{ textAlign: "left" }}>
                                    <h3 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "0.5rem", textAlign: "center" }}>
                                        {modalCategory === "FOOD" ? "Food Category Verification" : "Property Category Verification"}
                                    </h3>
                                    <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: "1.5", marginBottom: "1.5rem", textAlign: "center" }}>
                                        Please upload the required verification documents to add this category.
                                    </p>

                                    {verification === "REJECTED" && (
                                        <div style={{ backgroundColor: "#fef2f2", color: "#b91c1c", padding: "10px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1rem", fontWeight: "500" }}>
                                            Your previous request was rejected. Please re-upload correct documents.
                                        </div>
                                    )}

                                    {verification === "REVISION" && (
                                        <div style={{ backgroundColor: "#fffbeb", color: "#b45309", padding: "10px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1rem", fontWeight: "500" }}>
                                            <strong>Revision requested:</strong> {statusData?.sellerProfile?.verificationNote || "Please re-upload your documents."}
                                        </div>
                                    )}

                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "320px", overflowY: "auto", paddingRight: "4px" }}>
                                        {modalCategory === "FOOD" && (
                                            <>
                                                {renderFieldInput(
                                                    "FSSAI Certificate File (PDF/Image)",
                                                    fssaiFile,
                                                    setFssaiFile,
                                                    "fssai",
                                                    !statusData?.sellerProfile?.fssaiUrl
                                                )}

                                                <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px", marginTop: "4px" }}>
                                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#334155", marginBottom: "8px" }}>
                                                        Kitchen Images (Upload 1 to 3 images) *
                                                    </label>
                                                    {renderFieldInput("Kitchen Image 1", kitchenImages[0], (f) => {
                                                        const copy = [...kitchenImages];
                                                        copy[0] = f;
                                                        setKitchenImages(copy);
                                                    }, "kitchen0", !statusData?.sellerProfile?.kitchenImages || JSON.parse(statusData.sellerProfile.kitchenImages).length === 0)}
                                                    {renderFieldInput("Kitchen Image 2", kitchenImages[1], (f) => {
                                                        const copy = [...kitchenImages];
                                                        copy[1] = f;
                                                        setKitchenImages(copy);
                                                    }, "kitchen1", false)}
                                                    {renderFieldInput("Kitchen Image 3", kitchenImages[2], (f) => {
                                                        const copy = [...kitchenImages];
                                                        copy[2] = f;
                                                        setKitchenImages(copy);
                                                    }, "kitchen2", false)}
                                                </div>

                                                <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px", marginTop: "4px" }}>
                                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#334155", marginBottom: "8px" }}>
                                                        Cuisine / Food Images (Upload 1 to 3 images) *
                                                    </label>
                                                    {renderFieldInput("Cuisine Image 1", cuisineImages[0], (f) => {
                                                        const copy = [...cuisineImages];
                                                        copy[0] = f;
                                                        setCuisineImages(copy);
                                                    }, "cuisine0", !statusData?.sellerProfile?.cuisineImages || JSON.parse(statusData.sellerProfile.cuisineImages).length === 0)}
                                                    {renderFieldInput("Cuisine Image 2", cuisineImages[1], (f) => {
                                                        const copy = [...cuisineImages];
                                                        copy[1] = f;
                                                        setCuisineImages(copy);
                                                    }, "cuisine1", false)}
                                                    {renderFieldInput("Cuisine Image 3", cuisineImages[2], (f) => {
                                                        const copy = [...cuisineImages];
                                                        copy[2] = f;
                                                        setCuisineImages(copy);
                                                    }, "cuisine2", false)}
                                                </div>
                                            </>
                                        )}

                                        {modalCategory === "PROPERTY" && (
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#334155", marginBottom: "8px" }}>
                                                    Room Images (Upload 1 to 3 photos) *
                                                </label>
                                                {renderFieldInput("Room Image 1", roomImages[0], (f) => {
                                                    const copy = [...roomImages];
                                                    copy[0] = f;
                                                    setRoomImages(copy);
                                                }, "room0", !statusData?.sellerProfile?.roomImages || JSON.parse(statusData.sellerProfile.roomImages).length === 0)}
                                                {renderFieldInput("Room Image 2", roomImages[1], (f) => {
                                                    const copy = [...roomImages];
                                                    copy[1] = f;
                                                    setRoomImages(copy);
                                                }, "room1", false)}
                                                {renderFieldInput("Room Image 3", roomImages[2], (f) => {
                                                    const copy = [...roomImages];
                                                    copy[2] = f;
                                                    setRoomImages(copy);
                                                }, "room2", false)}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: "flex", gap: "10px", marginTop: "1.5rem" }}>
                                        <button
                                            type="button"
                                            onClick={() => setModalOpen(false)}
                                            style={{
                                                flex: 1,
                                                padding: "10px",
                                                border: "1px solid #cbd5e1",
                                                borderRadius: "10px",
                                                backgroundColor: "white",
                                                cursor: "pointer",
                                                fontWeight: "600"
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            style={{
                                                flex: 1,
                                                padding: "10px",
                                                borderRadius: "10px",
                                                backgroundColor: "var(--coral, #F16F68)",
                                                color: "white",
                                                border: "none",
                                                cursor: submitting ? "not-allowed" : "pointer",
                                                fontWeight: "600",
                                                opacity: submitting ? 0.7 : 1
                                            }}
                                        >
                                            {submitting ? "Uploading..." : "Submit Documents"}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div style={{
                                        width: "60px",
                                        height: "60px",
                                        borderRadius: "50%",
                                        backgroundColor: "#fee2e2",
                                        color: "#ef4444",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "1.5rem",
                                        fontWeight: "bold",
                                        margin: "0 auto 1rem"
                                    }}>
                                        🔒
                                    </div>
                                    <h3 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "0.5rem" }}>
                                        {modalCategory === "FOOD" ? "Activate Food Services" : "Activate Room Bookings"}
                                    </h3>
                                    <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: "1.5", marginBottom: "1.5rem" }}>
                                        You currently do not have an active subscription plan for this category. Upgrade now to enable these dashboard features and expand your business!
                                    </p>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "1.5rem" }}>
                                        {categoryPlans.length === 0 ? (
                                            <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Loading available plans...</div>
                                        ) : (
                                            categoryPlans.map(plan => (
                                                <Link
                                                    key={plan.id}
                                                    href={`/dashboard/seller/payment?planId=${plan.id}&category=${modalCategory}`}
                                                    onClick={() => setModalOpen(false)}
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                        backgroundColor: "#f8fafc",
                                                        padding: "12px 16px",
                                                        borderRadius: "12px",
                                                        border: "1px solid #e2e8f0",
                                                        textDecoration: "none",
                                                        color: "inherit",
                                                        transition: "all 0.2s"
                                                    }}
                                                >
                                                    <div style={{ textAlign: "left" }}>
                                                        <div style={{ fontWeight: "700", fontSize: "0.95rem" }}>{plan.name}</div>
                                                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{plan.durationMonths} Months</div>
                                                    </div>
                                                    <div style={{ fontWeight: "800", color: "var(--coral, #F16F68)" }}>
                                                        ₹{plan.price} →
                                                    </div>
                                                </Link>
                                            ))
                                        )}
                                    </div>

                                    <div style={{ display: "flex", gap: "10px" }}>
                                        <button
                                            onClick={() => setModalOpen(false)}
                                            style={{
                                                flex: 1,
                                                padding: "10px",
                                                border: "1px solid #cbd5e1",
                                                borderRadius: "10px",
                                                backgroundColor: "white",
                                                cursor: "pointer",
                                                fontWeight: "600"
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <Link
                                            href={`/dashboard/seller/payment?category=${modalCategory}`}
                                            onClick={() => setModalOpen(false)}
                                            style={{
                                                flex: 1,
                                                padding: "10px",
                                                borderRadius: "10px",
                                                backgroundColor: "var(--coral, #F16F68)",
                                                color: "white",
                                                textAlign: "center",
                                                textDecoration: "none",
                                                fontWeight: "600",
                                                fontSize: "0.95rem"
                                            }}
                                        >
                                            View All Plans
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                );
            })()}
            {cameraMode && (
                <CameraCaptureModal
                    onCapture={handleCameraCapture}
                    onClose={() => setCameraMode(null)}
                />
            )}
        </>
    );
}
