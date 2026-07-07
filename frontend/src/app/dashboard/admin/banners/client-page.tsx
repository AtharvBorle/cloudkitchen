"use client";
import { fetchApi } from "@/lib/fetch-api";
import { useState, useEffect } from "react";
import { Image as ImageIcon, Plus, Trash2, Eye, Link as LinkIcon, Store, Globe, Power, Loader2, Edit2 } from "lucide-react";

type SellerType = {
    id: string;
    businessName: string;
};

type PopupBannerType = {
    id: string;
    title: string;
    imageUrl: string;
    redirectUrl: string | null;
    appliesToSellerId: string | null;
    sellerName?: string;
    sellerTrackingId?: string | null;
    isActive: boolean;
    createdAt: string;
};

export default function AdminPopupBannersClient({ sellers }: { sellers: SellerType[] }) {
    const [banners, setBanners] = useState<PopupBannerType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [canManage, setCanManage] = useState(true);
    const [editingBanner, setEditingBanner] = useState<PopupBannerType | null>(null);

    // Form State
    const [title, setTitle] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [redirectUrl, setRedirectUrl] = useState("");
    const [target, setTarget] = useState("GLOBAL");

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            const res = await fetchApi("/api/admin/popup-banners");
            const data = await res.json();
            if (res.ok) {
                setBanners(data.banners);
                if (data.canManageBanners !== undefined) {
                    setCanManage(data.canManageBanners);
                }
            }
        } catch (error) {
            console.error("Failed to fetch banners");
        } finally {
            setLoading(false);
        }
    };

    const handleResetForm = () => {
        setTitle("");
        setImageFile(null);
        setRedirectUrl("");
        setTarget("GLOBAL");
        setEditingBanner(null);
        setShowForm(false);
    };

    const handleOpenEdit = (banner: PopupBannerType) => {
        setEditingBanner(banner);
        setTitle(banner.title);
        setRedirectUrl(banner.redirectUrl || "");
        setTarget(banner.appliesToSellerId || "GLOBAL");
        setImageFile(null);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canManage) return alert("You do not have permission to manage popup banners.");
        if (!title) return alert("Title is required.");
        if (!editingBanner && !imageFile) return alert("Image file is required.");

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("redirectUrl", redirectUrl || "");
            formData.append("appliesToSellerId", target);
            if (imageFile) {
                formData.append("image", imageFile);
            }

            const url = editingBanner ? `/api/admin/popup-banners/${editingBanner.id}` : "/api/admin/popup-banners";
            const method = editingBanner ? "PUT" : "POST";

            const res = await fetchApi(url, {
                method,
                body: formData
            });

            if (res.ok) {
                handleResetForm();
                fetchBanners();
            } else {
                const err = await res.json();
                alert(err.message || `Failed to ${editingBanner ? 'update' : 'create'} banner`);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        if (!canManage) return alert("You do not have permission to manage popup banners.");
        try {
            const res = await fetchApi(`/api/admin/popup-banners/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !currentStatus })
            });

            if (res.ok) {
                setBanners(prev => prev.map(b => b.id === id ? { ...b, isActive: !currentStatus } : b));
            } else {
                const err = await res.json();
                alert(err.message || "Failed to update banner status");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!canManage) return alert("You do not have permission to manage popup banners.");
        if (!confirm("Are you sure you want to delete this popup banner? This cannot be undone.")) return;

        try {
            const res = await fetchApi(`/api/admin/popup-banners/${id}`, {
                method: "DELETE"
            });

            if (res.ok) {
                setBanners(prev => prev.filter(b => b.id !== id));
            } else {
                const err = await res.json();
                alert(err.message || "Failed to delete banner");
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div style={{ animation: "fadeIn 0.5s ease-out" }}>
            {/* View-Only Mode Warning */}
            {!canManage && (
                <div style={{
                    backgroundColor: "#fffdf5",
                    border: "1px solid #fef08a",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    color: "#854d0e",
                    fontSize: "0.9rem",
                    marginBottom: "1.5rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontWeight: "500"
                }}>
                    <span>⚠️ You are in view-only mode. You do not have permission to create, toggle, or delete popup banners. Please contact Superadmin to request access.</span>
                </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <div>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", marginBottom: "0.5rem" }}>
                        Popup Banners Manager
                    </h2>
                    <p style={{ color: "#64748b" }}>Create promotional popups that display when users visit stores.</p>
                </div>
                {!showForm && canManage && (
                    <button
                        onClick={() => setShowForm(true)}
                        style={{
                            backgroundColor: "var(--primary)",
                            color: "white",
                            border: "none",
                            padding: "10px 20px",
                            borderRadius: "8px",
                            fontWeight: "600",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer",
                            boxShadow: "0 4px 10px rgba(250, 109, 107, 0.2)"
                        }}
                    >
                        <Plus size={18} />
                        New Popup Banner
                    </button>
                )}
            </div>

            {/* Create Form */}
            {showForm && (
                <div style={{
                    backgroundColor: "white",
                    padding: "2rem",
                    borderRadius: "16px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                    border: "1px solid #f1f5f9",
                    marginBottom: "2rem"
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1e293b", margin: 0 }}>
                            {editingBanner ? "Edit Popup Banner" : "Design New Popup"}
                        </h3>
                        <button onClick={handleResetForm} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontWeight: "500" }}>Cancel</button>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Campaign Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Diwali Mega Sale 50% Off"
                                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none" }}
                                    required
                                    disabled={!canManage}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Target Audience</label>
                                <select
                                    value={target}
                                    onChange={(e) => setTarget(e.target.value)}
                                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", backgroundColor: "white", appearance: "auto" }}
                                    disabled={!canManage}
                                >
                                    <option value="GLOBAL">Global (All Users & Stores)</option>
                                    <optgroup label="Specific Stores">
                                        {sellers.map(s => <option key={s.id} value={s.id}>{s.businessName}</option>)}
                                    </optgroup>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Upload Image (Square or Portrait Recommended)</label>
                            <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                                {editingBanner?.imageUrl && (
                                    <img src={editingBanner.imageUrl} alt="Current Preview" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                    style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", backgroundColor: "white" }}
                                    required={!editingBanner}
                                    disabled={!canManage}
                                />
                            </div>
                            {editingBanner && (
                                <span style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px", display: "block" }}>
                                    Leave blank to keep the current image.
                                </span>
                            )}
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Redirect URL (Optional - Where users go when clicked)</label>
                            <input
                                type="url"
                                value={redirectUrl}
                                onChange={(e) => setRedirectUrl(e.target.value)}
                                placeholder="https://yourstore.com/promo"
                                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none" }}
                                disabled={!canManage}
                            />
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                            <button
                                type="submit"
                                disabled={isSubmitting || !canManage}
                                style={{
                                    backgroundColor: "var(--primary)", color: "white", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", cursor: (isSubmitting || !canManage) ? "not-allowed" : "pointer", opacity: (isSubmitting || !canManage) ? 0.7 : 1
                                }}
                            >
                                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                {editingBanner ? "Save Changes" : "Launch Popup Campaign"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Banners List */}
            {loading ? (
                <div style={{ padding: "4rem", textAlign: "center", color: "#64748b" }}><Loader2 size={32} className="animate-spin" style={{ margin: "0 auto" }} /></div>
            ) : banners.length === 0 ? (
                <div style={{ backgroundColor: "white", padding: "4rem 2rem", borderRadius: "16px", textAlign: "center", border: "1px dashed #cbd5e1", color: "#64748b" }}>
                    <ImageIcon size={48} color="#cbd5e1" style={{ margin: "0 auto 1rem" }} />
                    <h3 style={{ fontSize: "1.25rem", color: "#334155", marginBottom: "0.5rem" }}>No Active Popups</h3>
                    <p>{canManage ? 'Click "New Popup Banner" to create your first promotional campaign.' : 'No promotional campaigns exist yet.'}</p>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
                    {banners.map((banner) => (
                        <div key={banner.id} style={{
                            backgroundColor: "white", borderRadius: "16px", overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column"
                        }}>
                            {/* Image Preview Area */}
                            <div style={{ height: "200px", position: "relative", backgroundColor: "#f8fafc", backgroundImage: `url(${banner.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}>
                                <div style={{ position: "absolute", top: "12px", right: "12px", display: "flex", gap: "8px" }}>
                                    <span style={{
                                        padding: "4px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700", backgroundColor: banner.isActive ? "#dcfce7" : "#f1f5f9", color: banner.isActive ? "#166534" : "#64748b", boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                                    }}>
                                        {banner.isActive ? "ACTIVE" : "PAUSED"}
                                    </span>
                                </div>
                            </div>

                            {/* Info Area */}
                            <div style={{ padding: "1.25rem", flex: 1, display: "flex", flexDirection: "column" }}>
                                <h4 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>{banner.title}</h4>

                                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "#64748b", marginBottom: "6px" }}>
                                    {banner.appliesToSellerId ? <Store size={14} color="#3b82f6" /> : <Globe size={14} color="#ca8a04" />}
                                    <span style={{ fontWeight: banner.appliesToSellerId ? "600" : "500", color: banner.appliesToSellerId ? "#3b82f6" : "#ca8a04" }}>
                                        {banner.appliesToSellerId && banner.sellerTrackingId ? (
                                            <a href={`/shop/${banner.sellerTrackingId}`} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }} onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'} onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}>
                                                {banner.sellerName}
                                            </a>
                                        ) : (
                                            banner.sellerName
                                        )}
                                    </span>
                                </div>

                                {banner.redirectUrl && (
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "#64748b" }}>
                                        <LinkIcon size={14} />
                                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "200px" }}>{banner.redirectUrl}</span>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div style={{ marginTop: "auto", paddingTop: "1.25rem", display: "flex", gap: "10px", borderTop: "1px solid #f1f5f9" }}>
                                    <button
                                        onClick={() => handleToggleActive(banner.id, banner.isActive)}
                                        style={{
                                            flex: 1, padding: "8px", borderRadius: "8px", fontWeight: "600", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: canManage ? "pointer" : "not-allowed", border: "1px solid #e2e8f0", backgroundColor: "white", color: "#334155", opacity: canManage ? 1 : 0.6
                                        }}
                                        onMouseOver={(e) => { if (canManage) e.currentTarget.style.backgroundColor = "#f8fafc"; }}
                                        onMouseOut={(e) => { if (canManage) e.currentTarget.style.backgroundColor = "white"; }}
                                        disabled={!canManage}
                                    >
                                        <Power size={14} color={banner.isActive ? "#ef4444" : "#22c55e"} />
                                        {banner.isActive ? "Pause" : "Activate"}
                                    </button>
                                    <button
                                        onClick={() => handleOpenEdit(banner)}
                                        style={{
                                            padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#475569", cursor: canManage ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", opacity: canManage ? 1 : 0.6
                                        }}
                                        onMouseOver={(e) => { if (canManage) e.currentTarget.style.backgroundColor = "#f8fafc"; }}
                                        onMouseOut={(e) => { if (canManage) e.currentTarget.style.backgroundColor = "white"; }}
                                        disabled={!canManage}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(banner.id)}
                                        style={{
                                            padding: "8px 12px", borderRadius: "8px", border: "1px solid #fee2e2", backgroundColor: "#fef2f2", color: "#ef4444", cursor: canManage ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", opacity: canManage ? 1 : 0.5
                                        }}
                                        onMouseOver={(e) => { if (canManage) { e.currentTarget.style.backgroundColor = "#fee2e2"; e.currentTarget.style.borderColor = "#fca5a5"; } }}
                                        onMouseOut={(e) => { if (canManage) { e.currentTarget.style.backgroundColor = "#fef2f2"; e.currentTarget.style.borderColor = "#fee2e2"; } }}
                                        disabled={!canManage}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
