"use client";

import React, { useState, useEffect, useRef } from "react";
import { fetchApi } from "@/lib/fetch-api";
import {
  Plus,
  Trash2,
  Edit2,
  Image as ImageIcon,
  ExternalLink,
  Check,
  X,
  AlertCircle,
  Smartphone,
  Monitor,
  Eye,
  ArrowUpDown,
} from "lucide-react";
import Image from "next/image";

interface PromoBannerItem {
  id: string;
  title: string;
  desktopImageUrl: string;
  mobileImageUrl?: string | null;
  redirectUrl?: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
}

export default function SuperadminBannersPage() {
  const [banners, setBanners] = useState<PromoBannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PromoBannerItem | null>(null);

  // Form inputs
  const [title, setTitle] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("/explore-desktop");
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState<number>(0);

  // File states & previews
  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [desktopPreview, setDesktopPreview] = useState<string | null>(null);
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [mobilePreview, setMobilePreview] = useState<string | null>(null);

  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await fetchApi(`/api/superadmin/promo-banners?t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        const bannerList = json.data?.banners || json.banners || [];
        setBanners(bannerList);
      } else {
        setError("Failed to load banners");
      }
    } catch (err: any) {
      console.error("Error loading banners:", err);
      setError("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openCreateModal = () => {
    setEditingBanner(null);
    setTitle("");
    setRedirectUrl("/explore-desktop");
    setIsActive(true);
    setDisplayOrder(banners.length);
    setDesktopFile(null);
    setDesktopPreview(null);
    setMobileFile(null);
    setMobilePreview(null);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (banner: PromoBannerItem) => {
    setEditingBanner(banner);
    setTitle(banner.title);
    setRedirectUrl(banner.redirectUrl || "/explore-desktop");
    setIsActive(banner.isActive);
    setDisplayOrder(banner.displayOrder);
    setDesktopFile(null);
    setDesktopPreview(banner.desktopImageUrl);
    setMobileFile(null);
    setMobilePreview(banner.mobileImageUrl || null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleDesktopFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDesktopFile(file);
      setDesktopPreview(URL.createObjectURL(file));
    }
  };

  const handleMobileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMobileFile(file);
      setMobilePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a banner title");
      return;
    }

    if (!editingBanner && !desktopFile) {
      setError("Please select a desktop banner image");
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("redirectUrl", redirectUrl.trim() || "/explore-desktop");
      formData.append("isActive", isActive ? "true" : "false");
      formData.append("displayOrder", displayOrder.toString());

      if (desktopFile) {
        formData.append("desktopImage", desktopFile);
      }
      if (mobileFile) {
        formData.append("mobileImage", mobileFile);
      }

      const url = editingBanner
        ? `/api/superadmin/promo-banners/${editingBanner.id}`
        : `/api/superadmin/promo-banners`;

      const method = editingBanner ? "PATCH" : "POST";

      const res = await fetchApi(url, {
        method,
        body: formData,
      });

      if (res.ok) {
        setSuccessMsg(editingBanner ? "Banner updated successfully!" : "New banner created!");
        setIsModalOpen(false);
        fetchBanners();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Failed to save banner");
      }
    } catch (err: any) {
      console.error("Save banner error:", err);
      setError(err?.message || "An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (banner: PromoBannerItem) => {
    try {
      const res = await fetchApi(`/api/superadmin/promo-banners/${banner.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !banner.isActive }),
      });
      if (res.ok) {
        setBanners((prev) =>
          prev.map((b) => (b.id === banner.id ? { ...b, isActive: !b.isActive } : b))
        );
      }
    } catch (err) {
      console.error("Toggle active error:", err);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the banner "${title}"?`)) return;

    try {
      setActionLoading(true);
      const res = await fetchApi(`/api/superadmin/promo-banners/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSuccessMsg("Banner deleted successfully");
        setBanners((prev) => prev.filter((b) => b.id !== id));
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setError("Failed to delete banner");
      }
    } catch (err) {
      console.error("Delete banner error:", err);
      setError("Error deleting banner");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ padding: "32px", maxWidth: "1280px", margin: "0 auto", fontFamily: "var(--font-sans, sans-serif)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--primary, #0F172A)", margin: "0 0 6px 0" }}>
            Home Promotional Banners
          </h1>
          <p style={{ fontSize: "0.95rem", color: "var(--text-muted, #64748B)", margin: 0 }}>
            Manage full-graphic promotional banners for the user homepage. Upload responsive desktop &amp; mobile graphics with click destination links.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          style={{
            backgroundColor: "#FF6B00",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "12px",
            padding: "12px 22px",
            fontSize: "0.95rem",
            fontWeight: "700",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(255, 107, 0, 0.3)",
            transition: "all 0.2s ease",
          }}
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Add New Banner</span>
        </button>
      </div>

      {/* Success / Error Messages */}
      {successMsg && (
        <div style={{ backgroundColor: "#E8FBF2", color: "#10B981", padding: "14px 18px", borderRadius: "10px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", fontWeight: "600" }}>
          <Check size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div style={{ backgroundColor: "#FEE2E2", color: "#EF4444", padding: "14px 18px", borderRadius: "10px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", fontWeight: "600" }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Dimensions Guideline Card */}
      <div
        style={{
          backgroundColor: "#FFF8F3",
          border: "1px solid #FFE4D3",
          borderRadius: "16px",
          padding: "20px 24px",
          marginBottom: "32px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#FF6B00", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Monitor size={20} />
          </div>
          <div>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", fontWeight: "700", color: "#0F172A" }}>
              Desktop Banner Graphic
            </h4>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748B", lineHeight: "1.4" }}>
              Exact Dimensions: <strong>1280 × 324 px</strong> (4:1 wide ratio). The home page automatically applies <strong>22px rounded corners</strong>.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#3B82F6", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Smartphone size={20} />
          </div>
          <div>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", fontWeight: "700", color: "#0F172A" }}>
              Mobile Banner Graphic
            </h4>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748B", lineHeight: "1.4" }}>
              Recommended: <strong>640 × 320 px</strong> (2:1 ratio). Optimized for vertical phone screens.
            </p>
          </div>
        </div>
      </div>

      {/* Banner Cards List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#64748B" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: "3px solid #FF6B00", borderTopColor: "transparent", animation: "spin 1s linear infinite", margin: "0 auto 12px auto" }} />
          <span>Loading banners...</span>
        </div>
      ) : banners.length === 0 ? (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "20px",
            padding: "50px 24px",
            textAlign: "center",
            border: "2px dashed #E2E8F0",
          }}
        >
          <div style={{ width: "60px", height: "60px", borderRadius: "50%", backgroundColor: "#FFF3EB", color: "#FF6B00", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto" }}>
            <ImageIcon size={30} />
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#0F172A", margin: "0 0 8px 0" }}>
            No Promotional Banners Yet
          </h3>
          <p style={{ fontSize: "0.9rem", color: "#64748B", maxWidth: "440px", margin: "0 auto 20px auto" }}>
            Currently the user home page uses the default fallback welcome offer. Add your first dynamic graphic banner to show custom offers and promotions!
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            style={{
              backgroundColor: "#FF6B00",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "10px",
              padding: "10px 20px",
              fontSize: "0.9rem",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            Create Banner
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "20px",
                border: "1px solid #E2E8F0",
                padding: "24px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              {/* Card Header Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      backgroundColor: "#F1F5F9",
                      color: "#475569",
                      fontSize: "0.85rem",
                      fontWeight: "700",
                    }}
                  >
                    #{index + 1}
                  </span>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#0F172A", margin: 0 }}>
                    {banner.title}
                  </h3>
                  <span
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: "700",
                      padding: "3px 10px",
                      borderRadius: "9999px",
                      backgroundColor: banner.isActive ? "#E8FBF2" : "#F1F5F9",
                      color: banner.isActive ? "#10B981" : "#64748B",
                    }}
                  >
                    {banner.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(banner)}
                    style={{
                      backgroundColor: banner.isActive ? "#FFF3EB" : "#F1F5F9",
                      color: banner.isActive ? "#FF6B00" : "#475569",
                      border: "1px solid",
                      borderColor: banner.isActive ? "#FFD8C2" : "#E2E8F0",
                      borderRadius: "8px",
                      padding: "7px 14px",
                      fontSize: "0.82rem",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    {banner.isActive ? "Deactivate" : "Activate"}
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(banner)}
                    style={{
                      backgroundColor: "#F8FAFC",
                      color: "#0F172A",
                      border: "1px solid #E2E8F0",
                      borderRadius: "8px",
                      padding: "7px 12px",
                      fontSize: "0.82rem",
                      fontWeight: "600",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      cursor: "pointer",
                    }}
                  >
                    <Edit2 size={14} />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(banner.id, banner.title)}
                    style={{
                      backgroundColor: "#FEF2F2",
                      color: "#EF4444",
                      border: "1px solid #FEE2E2",
                      borderRadius: "8px",
                      padding: "7px 12px",
                      fontSize: "0.82rem",
                      fontWeight: "600",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* Graphic Previews Row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
                {/* Desktop Preview */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontSize: "0.85rem", fontWeight: "600", color: "#475569" }}>
                    <Monitor size={15} color="#FF6B00" />
                    <span>Desktop Graphic Preview (1280 × 324)</span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "160px",
                      borderRadius: "14px",
                      overflow: "hidden",
                      position: "relative",
                      backgroundColor: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={banner.desktopImageUrl}
                      alt={`${banner.title} desktop`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                </div>

                {/* Mobile Preview */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontSize: "0.85rem", fontWeight: "600", color: "#475569" }}>
                    <Smartphone size={15} color="#3B82F6" />
                    <span>Mobile Graphic Preview {banner.mobileImageUrl ? "(Dedicated)" : "(Using Desktop fallback)"}</span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "280px",
                      height: "160px",
                      borderRadius: "14px",
                      overflow: "hidden",
                      position: "relative",
                      backgroundColor: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={banner.mobileImageUrl || banner.desktopImageUrl}
                      alt={`${banner.title} mobile`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                </div>
              </div>

              {/* Meta Row: Link + Order */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "12px",
                  borderTop: "1px solid #F1F5F9",
                  fontSize: "0.85rem",
                  color: "#64748B",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>Redirect Link:</span>
                  <a
                    href={banner.redirectUrl || "/explore-desktop"}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: "#FF6B00",
                      fontWeight: "600",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span>{banner.redirectUrl || "/explore-desktop"}</span>
                    <ExternalLink size={13} />
                  </a>
                </div>

                <div>
                  Display Order: <strong>{banner.displayOrder}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
            boxSizing: "border-box",
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "24px",
              padding: "32px",
              maxWidth: "640px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxSizing: "border-box",
              boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "1.4rem", fontWeight: "800", color: "#0F172A", margin: 0 }}>
                {editingBanner ? "Edit Promotional Banner" : "Create New Promotional Banner"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Banner Title */}
              <div>
                <label style={{ display: "block", fontSize: "0.88rem", fontWeight: "700", color: "#0F172A", marginBottom: "6px" }}>
                  Campaign / Banner Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Save 30% OFF First 2 Orders"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.95rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Desktop Image Upload (Required) */}
              <div>
                <label style={{ display: "block", fontSize: "0.88rem", fontWeight: "700", color: "#0F172A", marginBottom: "6px" }}>
                  Desktop Banner Graphic * (1280 × 324 px recommended)
                </label>
                <input
                  type="file"
                  ref={desktopInputRef}
                  accept="image/*"
                  onChange={handleDesktopFileChange}
                  style={{ display: "none" }}
                />

                <div
                  onClick={() => desktopInputRef.current?.click()}
                  style={{
                    border: "2px dashed #CBD5E1",
                    borderRadius: "14px",
                    padding: "18px",
                    textAlign: "center",
                    cursor: "pointer",
                    backgroundColor: "#F8FAFC",
                    transition: "all 0.2s ease",
                  }}
                >
                  {desktopPreview ? (
                    <div style={{ position: "relative", width: "100%", height: "140px", borderRadius: "10px", overflow: "hidden" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={desktopPreview}
                        alt="Desktop Preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <div style={{ position: "absolute", bottom: "8px", right: "8px", backgroundColor: "rgba(0,0,0,0.6)", color: "#FFFFFF", padding: "4px 8px", borderRadius: "6px", fontSize: "0.75rem" }}>
                        Click to change image
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: "#64748B" }}>
                      <Monitor size={28} color="#FF6B00" />
                      <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#0F172A" }}>
                        Click to upload Desktop Banner Image
                      </span>
                      <span style={{ fontSize: "0.78rem" }}>PNG, JPG, WEBP (Max 5MB)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Image Upload (Optional) */}
              <div>
                <label style={{ display: "block", fontSize: "0.88rem", fontWeight: "700", color: "#0F172A", marginBottom: "6px" }}>
                  Mobile Banner Graphic (Optional, 640 × 320 px recommended)
                </label>
                <input
                  type="file"
                  ref={mobileInputRef}
                  accept="image/*"
                  onChange={handleMobileFileChange}
                  style={{ display: "none" }}
                />

                <div
                  onClick={() => mobileInputRef.current?.click()}
                  style={{
                    border: "2px dashed #CBD5E1",
                    borderRadius: "14px",
                    padding: "18px",
                    textAlign: "center",
                    cursor: "pointer",
                    backgroundColor: "#F8FAFC",
                    transition: "all 0.2s ease",
                  }}
                >
                  {mobilePreview ? (
                    <div style={{ position: "relative", width: "100%", maxWidth: "240px", margin: "0 auto", height: "120px", borderRadius: "10px", overflow: "hidden" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={mobilePreview}
                        alt="Mobile Preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <div style={{ position: "absolute", bottom: "8px", right: "8px", backgroundColor: "rgba(0,0,0,0.6)", color: "#FFFFFF", padding: "4px 8px", borderRadius: "6px", fontSize: "0.75rem" }}>
                        Click to change
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: "#64748B" }}>
                      <Smartphone size={28} color="#3B82F6" />
                      <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#0F172A" }}>
                        Click to upload Mobile-Optimized Image
                      </span>
                      <span style={{ fontSize: "0.78rem" }}>If omitted, the desktop graphic will be scaled down</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Redirect URL */}
              <div>
                <label style={{ display: "block", fontSize: "0.88rem", fontWeight: "700", color: "#0F172A", marginBottom: "6px" }}>
                  Destination Link (Opens on banner click)
                </label>
                <input
                  type="text"
                  placeholder="/explore-desktop or /room-booking or /shop/SHOP-025TEA"
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.95rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                  {["/explore-desktop", "/room-booking", "/explore-desktop?category=pizza", "/explore-desktop?category=mess"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRedirectUrl(preset)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "6px",
                        border: "1px solid #E2E8F0",
                        backgroundColor: "#F8FAFC",
                        color: "#475569",
                        fontSize: "0.78rem",
                        cursor: "pointer",
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Order & Active Checkbox */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.88rem", fontWeight: "700", color: "#0F172A", marginBottom: "6px" }}>
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
                    min={0}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.95rem",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "24px" }}>
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    style={{ width: "20px", height: "20px", accentColor: "#FF6B00", cursor: "pointer" }}
                  />
                  <label htmlFor="isActiveCheck" style={{ fontSize: "0.92rem", fontWeight: "600", color: "#0F172A", cursor: "pointer" }}>
                    Active on Homepage
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: "11px 20px",
                    borderRadius: "10px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    color: "#475569",
                    fontWeight: "600",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: "11px 24px",
                    borderRadius: "10px",
                    border: "none",
                    backgroundColor: "#FF6B00",
                    color: "#FFFFFF",
                    fontWeight: "700",
                    fontSize: "0.9rem",
                    cursor: actionLoading ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 12px rgba(255, 107, 0, 0.3)",
                  }}
                >
                  {actionLoading ? "Uploading & Saving..." : editingBanner ? "Save Changes" : "Create Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
