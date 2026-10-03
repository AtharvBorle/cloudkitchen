"use client";

import React, { useState, useEffect, useMemo } from "react";
import { fetchApi } from "@/lib/fetch-api";
import {
  RefreshCw,
  Search,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Play,
  CheckCircle,
  ExternalLink,
  Store,
  Utensils,
  Sparkles,
  SlidersHorizontal,
  X,
  Instagram,
  Heart,
  MessageCircle,
  Trash2,
  Video,
} from "lucide-react";

interface SellerOption {
  id: string;
  businessName: string;
  trackingId: string;
  foodItems: Array<{
    id: string;
    name: string;
    price: number;
    itemType: string;
  }>;
}

interface CuratedReelItem {
  id: string;
  instagramMediaId: string;
  mediaType: string;
  mediaUrl: string;
  thumbnailUrl: string | null;
  permalink: string | null;
  caption: string;
  postedAt: string;
  likeCount: number;
  commentsCount: number;
  isPublished: boolean;
  displayOrder: number;
  categoryTag: string | null;
  customTitle: string | null;
  customSubtitle: string | null;
  redirectType: "KITCHEN" | "DISH" | "CUSTOM_URL" | "NONE";
  customRedirectUrl: string | null;
  sellerId: string | null;
  foodItemId: string | null;
  seller?: {
    id: string;
    businessName: string;
    trackingId: string;
    bannerImageUrl?: string | null;
    addressLocality?: string | null;
  } | null;
  foodItem?: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string | null;
    itemType: string;
  } | null;
}

export default function ReelManagerPage() {
  const [reels, setReels] = useState<CuratedReelItem[]>([]);
  const [sellers, setSellers] = useState<SellerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "UNPUBLISHED">("ALL");
  const [mediaTypeFilter, setMediaTypeFilter] = useState<"ALL" | "VIDEO" | "STORY">("ALL");

  // Edit / Curation Modal
  const [editingReel, setEditingReel] = useState<CuratedReelItem | null>(null);
  const [editSellerId, setEditSellerId] = useState<string>("");
  const [editFoodItemId, setEditFoodItemId] = useState<string>("");
  const [editRedirectType, setEditRedirectType] = useState<string>("KITCHEN");
  const [editCustomTitle, setEditCustomTitle] = useState<string>("");
  const [editCustomSubtitle, setEditCustomSubtitle] = useState<string>("");
  const [editCategoryTag, setEditCategoryTag] = useState<string>("ALL");
  const [editDisplayOrder, setEditDisplayOrder] = useState<number>(0);
  const [editIsPublished, setEditIsPublished] = useState<boolean>(false);
  const [savingReel, setSavingReel] = useState<boolean>(false);

  // Video Preview Modal
  const [previewMedia, setPreviewMedia] = useState<{ url: string; caption: string; isVideo: boolean } | null>(null);

  // Fetch Reels & Sellers
  const loadData = async () => {
    setLoading(true);
    try {
      const [reelsRes, sellersRes] = await Promise.all([
        fetchApi("/api/admin/reels"),
        fetchApi("/api/admin/reels/sellers-and-dishes"),
      ]);

      if (reelsRes.ok) {
        const data = await reelsRes.json();
        setReels(data.reels || []);
      }

      if (sellersRes.ok) {
        const data = await sellersRes.json();
        setSellers(data.sellers || []);
      }
    } catch (err) {
      console.error("Failed to load reel curation data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync Instagram Media
  const handleSyncInstagram = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetchApi("/api/admin/reels/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage({
          text: `Sync Complete: ${data.data?.createdCount || 0} new reels imported, ${data.data?.updatedCount || 0} updated.`,
          type: "success",
        });
        loadData();
      } else {
        setSyncMessage({
          text: data.message || "Failed to sync with Meta Graph API.",
          type: "error",
        });
      }
    } catch (err: any) {
      setSyncMessage({ text: "Network error while contacting Meta API.", type: "error" });
    } finally {
      setSyncing(false);
    }
  };

  // Quick Toggle Publish Status
  const handleTogglePublish = async (reel: CuratedReelItem) => {
    const newStatus = !reel.isPublished;
    // Optimistic update
    setReels((prev) =>
      prev.map((r) => (r.id === reel.id ? { ...r, isPublished: newStatus } : r))
    );

    try {
      const res = await fetchApi(`/api/admin/reels/${reel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: newStatus }),
      });
      if (!res.ok) {
        // Rollback
        setReels((prev) =>
          prev.map((r) => (r.id === reel.id ? { ...r, isPublished: reel.isPublished } : r))
        );
      }
    } catch (err) {
      // Rollback
      setReels((prev) =>
        prev.map((r) => (r.id === reel.id ? { ...r, isPublished: reel.isPublished } : r))
      );
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (reel: CuratedReelItem) => {
    setEditingReel(reel);
    setEditSellerId(reel.sellerId || reel.seller?.id || "");
    setEditFoodItemId(reel.foodItemId || reel.foodItem?.id || "");
    setEditRedirectType(reel.redirectType || "KITCHEN");
    setEditCustomTitle(reel.customTitle || "");
    setEditCustomSubtitle(reel.customSubtitle || "");
    setEditCategoryTag(reel.categoryTag || "ALL");
    setEditDisplayOrder(reel.displayOrder || 0);
    setEditIsPublished(reel.isPublished);
  };

  // Selected seller's food items for dropdown
  const selectedSellerDishes = useMemo(() => {
    if (!editSellerId) return [];
    const found = sellers.find((s) => s.id === editSellerId);
    return found?.foodItems || [];
  }, [editSellerId, sellers]);

  // Save Edit Modal
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReel) return;

    setSavingReel(true);
    try {
      const res = await fetchApi(`/api/admin/reels/${editingReel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: editSellerId || null,
          foodItemId: editRedirectType === "DISH" ? editFoodItemId || null : null,
          redirectType: editRedirectType,
          customTitle: editCustomTitle.trim() || null,
          customSubtitle: editCustomSubtitle.trim() || null,
          categoryTag: editCategoryTag,
          displayOrder: Number(editDisplayOrder) || 0,
          isPublished: editIsPublished,
        }),
      });

      if (res.ok) {
        setEditingReel(null);
        loadData();
      } else {
        alert("Failed to save reel curation settings.");
      }
    } catch (err) {
      console.error("Save error", err);
    } finally {
      setSavingReel(false);
    }
  };

  // Delete Reel
  const handleDeleteReel = async (id: string) => {
    if (!confirm("Are you sure you want to remove this reel from Neo Cloud Bites?")) return;
    try {
      const res = await fetchApi(`/api/admin/reels/${id}`, { method: "DELETE" });
      if (res.ok) {
        setReels((prev) => prev.filter((r) => r.id !== id));
      } else {
        alert("Failed to delete reel.");
      }
    } catch (err) {
      console.error("Delete error", err);
    }
  };

  // Filtered Reels
  const filteredReels = useMemo(() => {
    return reels.filter((r) => {
      if (statusFilter === "PUBLISHED" && !r.isPublished) return false;
      if (statusFilter === "UNPUBLISHED" && r.isPublished) return false;

      if (mediaTypeFilter === "VIDEO" && r.mediaType === "STORY") return false;
      if (mediaTypeFilter === "STORY" && r.mediaType !== "STORY") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const captionMatch = (r.caption || "").toLowerCase().includes(q);
        const sellerMatch = (r.seller?.businessName || "").toLowerCase().includes(q);
        const dishMatch = (r.foodItem?.name || "").toLowerCase().includes(q);
        const titleMatch = (r.customTitle || "").toLowerCase().includes(q);
        if (!captionMatch && !sellerMatch && !dishMatch && !titleMatch) return false;
      }

      return true;
    });
  }, [reels, statusFilter, mediaTypeFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = reels.length;
    const published = reels.filter((r) => r.isPublished).length;
    const pending = total - published;
    const linkedSellers = new Set(reels.filter((r) => r.sellerId).map((r) => r.sellerId)).size;
    return { total, published, pending, linkedSellers };
  }, [reels]);

  return (
    <div style={{ padding: "32px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Top Banner Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
          marginBottom: "28px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: "800", margin: 0, color: "#f8fafc", letterSpacing: "-0.5px" }}>
            Reels &amp; Stories Management
          </h1>
          <p style={{ color: "#94a3b8", margin: "6px 0 0 0", fontSize: "0.95rem" }}>
            Curate seller Instagram collaborations &amp; link them directly to dishes on the User Explore section.
          </p>
        </div>

        {/* Sync Button */}
        <button
          type="button"
          onClick={handleSyncInstagram}
          disabled={syncing}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)",
            color: "#ffffff",
            border: "none",
            borderRadius: "12px",
            padding: "12px 24px",
            fontWeight: "700",
            fontSize: "0.95rem",
            cursor: syncing ? "not-allowed" : "pointer",
            boxShadow: "0 4px 16px rgba(225, 48, 108, 0.4)",
            transition: "transform 0.15s ease",
          }}
        >
          <RefreshCw size={18} className={syncing ? "animate-spin" : ""} />
          <span>{syncing ? "Syncing with Instagram..." : "Sync Instagram Media"}</span>
        </button>
      </div>

      {/* Sync Status Toast */}
      {syncMessage && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: "10px",
            marginBottom: "24px",
            fontSize: "0.9rem",
            fontWeight: "500",
            backgroundColor: syncMessage.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
            color: syncMessage.type === "success" ? "#34d399" : "#f87171",
            border: syncMessage.type === "success" ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{syncMessage.text}</span>
          <button
            type="button"
            onClick={() => setSyncMessage(null)}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "18px",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            backgroundColor: "#111827",
            border: "1px solid #1f2937",
            borderRadius: "14px",
            padding: "20px",
          }}
        >
          <span style={{ fontSize: "0.85rem", color: "#9ca3af", fontWeight: "600", textTransform: "uppercase" }}>
            Total Synced Media
          </span>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "#f8fafc", marginTop: "8px" }}>
            {stats.total}
          </div>
          <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>From @neocloudbites &amp; Collabs</span>
        </div>

        <div
          style={{
            backgroundColor: "#111827",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: "14px",
            padding: "20px",
          }}
        >
          <span style={{ fontSize: "0.85rem", color: "#34d399", fontWeight: "600", textTransform: "uppercase" }}>
            Published on Explore
          </span>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "#10b981", marginTop: "8px" }}>
            {stats.published}
          </div>
          <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>Live in User Mobile &amp; Desktop</span>
        </div>

        <div
          style={{
            backgroundColor: "#111827",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: "14px",
            padding: "20px",
          }}
        >
          <span style={{ fontSize: "0.85rem", color: "#fbbf24", fontWeight: "600", textTransform: "uppercase" }}>
            Pending Curation
          </span>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "#f59e0b", marginTop: "8px" }}>
            {stats.pending}
          </div>
          <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>Waiting for Seller / Dish Linking</span>
        </div>

        <div
          style={{
            backgroundColor: "#111827",
            border: "1px solid #1f2937",
            borderRadius: "14px",
            padding: "20px",
          }}
        >
          <span style={{ fontSize: "0.85rem", color: "#a78bfa", fontWeight: "600", textTransform: "uppercase" }}>
            Linked Cloud Kitchens
          </span>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "#c084fc", marginTop: "8px" }}>
            {stats.linkedSellers}
          </div>
          <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>Featured Seller Partners</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          backgroundColor: "#111827",
          border: "1px solid #1f2937",
          borderRadius: "14px",
          padding: "16px 20px",
          marginBottom: "28px",
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Search Input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "#1f2937",
            borderRadius: "10px",
            padding: "8px 14px",
            flex: 1,
            minWidth: "260px",
            border: "1px solid #374151",
          }}
        >
          <Search size={18} color="#9ca3af" />
          <input
            type="text"
            placeholder="Search by caption, kitchen name, or dish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: "none",
              border: "none",
              outline: "none",
              color: "#f8fafc",
              fontSize: "0.9rem",
              width: "100%",
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Badges */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {/* Status Filters */}
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              border: "1px solid",
              borderColor: statusFilter === "ALL" ? "#e1306c" : "#374151",
              backgroundColor: statusFilter === "ALL" ? "rgba(225, 48, 108, 0.2)" : "#1f2937",
              color: statusFilter === "ALL" ? "#fff" : "#9ca3af",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            All Media ({reels.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("PUBLISHED")}
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              border: "1px solid",
              borderColor: statusFilter === "PUBLISHED" ? "#10b981" : "#374151",
              backgroundColor: statusFilter === "PUBLISHED" ? "rgba(16, 185, 129, 0.2)" : "#1f2937",
              color: statusFilter === "PUBLISHED" ? "#34d399" : "#9ca3af",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Published ({stats.published})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("UNPUBLISHED")}
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              border: "1px solid",
              borderColor: statusFilter === "UNPUBLISHED" ? "#f59e0b" : "#374151",
              backgroundColor: statusFilter === "UNPUBLISHED" ? "rgba(245, 158, 11, 0.2)" : "#1f2937",
              color: statusFilter === "UNPUBLISHED" ? "#fbbf24" : "#9ca3af",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Pending Review ({stats.pending})
          </button>
        </div>
      </div>

      {/* Reels Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: "3px solid #e1306c", borderTopColor: "transparent", animation: "spin 1s linear infinite", margin: "0 auto 14px" }} />
          <p>Loading Instagram reels...</p>
        </div>
      ) : filteredReels.length === 0 ? (
        <div
          style={{
            backgroundColor: "#111827",
            border: "1px solid #1f2937",
            borderRadius: "16px",
            padding: "60px 20px",
            textAlign: "center",
          }}
        >
          <Instagram size={48} color="#6b7280" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#f8fafc", margin: "0 0 8px 0" }}>
            No Reels Found
          </h3>
          <p style={{ color: "#9ca3af", maxWidth: "450px", margin: "0 auto 20px" }}>
            No media matches the active filters. Click &quot;Sync Instagram Media&quot; above to import latest collaborated reels.
          </p>
          <button
            type="button"
            onClick={handleSyncInstagram}
            style={{
              background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "10px 20px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Sync from Instagram
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "24px",
          }}
        >
          {filteredReels.map((reel) => {
            const hasSeller = Boolean(reel.seller || reel.sellerId);
            const hasDish = Boolean(reel.foodItem || reel.foodItemId);

            return (
              <div
                key={reel.id}
                style={{
                  backgroundColor: "#111827",
                  border: reel.isPublished ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid #1f2937",
                  borderRadius: "16px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.2s ease",
                  boxShadow: reel.isPublished ? "0 4px 20px rgba(16, 185, 129, 0.08)" : "none",
                }}
              >
                {/* Media Preview Header */}
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "240px",
                    backgroundColor: "#000",
                    overflow: "hidden",
                  }}
                >
                  {/* Thumbnail / Image */}
                  <img
                    src={reel.thumbnailUrl || reel.mediaUrl || "/images/places/place-biryani.png"}
                    alt={reel.caption || "Instagram Reel"}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />

                  {/* Dark gradient overlay */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 40%, rgba(0,0,0,0.85) 100%)",
                    }}
                  />

                  {/* Top Tags & Status */}
                  <div
                    style={{
                      position: "absolute",
                      top: "12px",
                      left: "12px",
                      right: "12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: "rgba(0,0,0,0.65)",
                        backdropFilter: "blur(6px)",
                        color: "#f8fafc",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <Video size={12} color="#fd1d1d" />
                      {reel.mediaType || "REEL"}
                    </span>

                    <span
                      style={{
                        backgroundColor: reel.isPublished ? "rgba(16, 185, 129, 0.9)" : "rgba(100, 116, 139, 0.8)",
                        color: "#ffffff",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {reel.isPublished ? (
                        <>
                          <Eye size={12} /> Live on Explore
                        </>
                      ) : (
                        <>
                          <EyeOff size={12} /> Hidden
                        </>
                      )}
                    </span>
                  </div>

                  {/* Play Button Trigger */}
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewMedia({
                        url: reel.mediaUrl,
                        caption: reel.caption,
                        isVideo: reel.mediaType === "VIDEO" || reel.mediaType === "REEL" || reel.mediaUrl.endsWith(".mp4"),
                      })
                    }
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(225, 48, 108, 0.85)",
                      border: "none",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
                    }}
                    title="Watch Reel Preview"
                  >
                    <Play size={22} fill="#fff" style={{ marginLeft: "3px" }} />
                  </button>

                  {/* Bottom Stats & Instagram Link */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "10px",
                      left: "12px",
                      right: "12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      color: "#f8fafc",
                      fontSize: "0.8rem",
                    }}
                  >
                    <div style={{ display: "flex", gap: "12px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Heart size={14} color="#ef4444" fill="#ef4444" /> {reel.likeCount || 0}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <MessageCircle size={14} color="#38bdf8" /> {reel.commentsCount || 0}
                      </span>
                    </div>

                    {reel.permalink && (
                      <a
                        href={reel.permalink}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: "#93c5fd",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          textDecoration: "none",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                        }}
                      >
                        <Instagram size={13} />
                        <span>Instagram</span>
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>

                {/* Card Content & Curation Info */}
                <div style={{ padding: "18px", flex: 1, display: "flex", flexDirection: "column" }}>
                  {/* Caption */}
                  <p
                    style={{
                      fontSize: "0.88rem",
                      color: "#e2e8f0",
                      lineHeight: "1.45",
                      margin: "0 0 16px 0",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {reel.caption || "No caption provided on Instagram post."}
                  </p>

                  {/* Target Linking Box */}
                  <div
                    style={{
                      backgroundColor: "#1f2937",
                      borderRadius: "10px",
                      padding: "12px",
                      marginBottom: "16px",
                      border: "1px solid #374151",
                    }}
                  >
                    {/* Seller Link */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <Store size={15} color={hasSeller ? "#34d399" : "#9ca3af"} />
                      <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>Kitchen:</span>
                      <strong style={{ fontSize: "0.85rem", color: hasSeller ? "#f8fafc" : "#94a3b8" }}>
                        {reel.seller?.businessName || "Unassigned Kitchen"}
                      </strong>
                    </div>

                    {/* Dish Link */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Utensils size={15} color={hasDish ? "#fbbf24" : "#9ca3af"} />
                      <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>Redirection:</span>
                      <strong style={{ fontSize: "0.85rem", color: hasDish ? "#fde047" : "#94a3b8" }}>
                        {hasDish
                          ? `Dish: ${reel.foodItem?.name} (₹${reel.foodItem?.price})`
                          : reel.redirectType === "KITCHEN"
                          ? "Storefront Kitchen Page"
                          : "General Explore"}
                      </strong>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ marginTop: "auto", display: "flex", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(reel)}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid",
                        borderColor: reel.isPublished ? "rgba(239, 68, 68, 0.4)" : "rgba(16, 185, 129, 0.4)",
                        backgroundColor: reel.isPublished ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
                        color: reel.isPublished ? "#f87171" : "#34d399",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      {reel.isPublished ? (
                        <>
                          <EyeOff size={15} /> Hide
                        </>
                      ) : (
                        <>
                          <Eye size={15} /> Publish
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(reel)}
                      style={{
                        flex: 1.4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        backgroundColor: "#3b82f6",
                        border: "none",
                        color: "#fff",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      <SlidersHorizontal size={15} />
                      <span>Curate &amp; Link</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteReel(reel.id)}
                      style={{
                        padding: "9px",
                        borderRadius: "8px",
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        color: "#ef4444",
                        cursor: "pointer",
                      }}
                      title="Delete Reel"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Curate / Edit Modal */}
      {editingReel && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setEditingReel(null)}
        >
          <div
            style={{
              backgroundColor: "#111827",
              border: "1px solid #374151",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "700px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              color: "#f8fafc",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Sparkles size={22} color="#fd1d1d" />
                <h2 style={{ fontSize: "1.35rem", fontWeight: "700", margin: 0 }}>
                  Curate Reel &amp; Redirection
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingReel(null)}
                style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Instagram Source Details */}
              <div style={{ display: "flex", gap: "16px", backgroundColor: "#1f2937", padding: "14px", borderRadius: "12px" }}>
                <img
                  src={editingReel.thumbnailUrl || editingReel.mediaUrl || "/images/places/place-biryani.png"}
                  alt="Reel"
                  style={{ width: "80px", height: "100px", objectFit: "cover", borderRadius: "8px" }}
                />
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <span style={{ fontSize: "0.75rem", color: "#e1306c", fontWeight: "700" }}>
                    INSTAGRAM SOURCE
                  </span>
                  <p
                    style={{
                      fontSize: "0.82rem",
                      color: "#d1d5db",
                      margin: "4px 0",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {editingReel.caption || "No caption"}
                  </p>
                </div>
              </div>

              {/* 1. Target Seller Cloud Kitchen */}
              <div>
                <label style={{ display: "block", fontSize: "0.88rem", fontWeight: "600", color: "#e2e8f0", marginBottom: "6px" }}>
                  1. Map to Cloud Kitchen Partner
                </label>
                <select
                  value={editSellerId}
                  onChange={(e) => {
                    setEditSellerId(e.target.value);
                    setEditFoodItemId(""); // reset dish selection when seller changes
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    color: "#f8fafc",
                    fontSize: "0.9rem",
                    outline: "none",
                  }}
                >
                  <option value="">-- Select Seller / Kitchen (Optional) --</option>
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.businessName} ({s.trackingId}) - {s.foodItems?.length || 0} dishes
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Redirection Mode */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.88rem", fontWeight: "600", color: "#e2e8f0", marginBottom: "6px" }}>
                    2. Redirection Action
                  </label>
                  <select
                    value={editRedirectType}
                    onChange={(e) => setEditRedirectType(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      color: "#f8fafc",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  >
                    <option value="KITCHEN">Visit Kitchen Storefront</option>
                    <option value="DISH">Direct to Specific Dish</option>
                    <option value="NONE">View Reel Only (No Link)</option>
                  </select>
                </div>

                {/* Specific Dish (if DISH selected) */}
                <div>
                  <label style={{ display: "block", fontSize: "0.88rem", fontWeight: "600", color: "#e2e8f0", marginBottom: "6px" }}>
                    3. Target Dish
                  </label>
                  <select
                    value={editFoodItemId}
                    onChange={(e) => setEditFoodItemId(e.target.value)}
                    disabled={editRedirectType !== "DISH" || !editSellerId}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      backgroundColor: editRedirectType === "DISH" && editSellerId ? "#1f2937" : "#111827",
                      border: "1px solid #374151",
                      color: "#f8fafc",
                      fontSize: "0.9rem",
                      outline: "none",
                      opacity: editRedirectType === "DISH" && editSellerId ? 1 : 0.5,
                    }}
                  >
                    <option value="">-- Select Specific Dish --</option>
                    {selectedSellerDishes.map((dish) => (
                      <option key={dish.id} value={dish.id}>
                        {dish.name} (₹{dish.price}) - {dish.itemType}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Custom Titles override */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.88rem", fontWeight: "600", color: "#e2e8f0", marginBottom: "6px" }}>
                    Custom Title (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Dum Biryani Special"
                    value={editCustomTitle}
                    onChange={(e) => setEditCustomTitle(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      color: "#f8fafc",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.88rem", fontWeight: "600", color: "#e2e8f0", marginBottom: "6px" }}>
                    Display Order / Priority
                  </label>
                  <input
                    type="number"
                    value={editDisplayOrder}
                    onChange={(e) => setEditDisplayOrder(parseInt(e.target.value) || 0)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      color: "#f8fafc",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Publish Toggle in Modal */}
              <div
                style={{
                  backgroundColor: "#1f2937",
                  padding: "14px",
                  borderRadius: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong style={{ display: "block", fontSize: "0.95rem", color: "#f8fafc" }}>
                    Show in User Explore Section
                  </strong>
                  <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                    When enabled, this reel will be rendered for all customers browsing Explore.
                  </span>
                </div>

                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={editIsPublished}
                    onChange={(e) => setEditIsPublished(e.target.checked)}
                    style={{ width: "22px", height: "22px", accentColor: "#10b981", cursor: "pointer" }}
                  />
                </label>
              </div>

              {/* Modal Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setEditingReel(null)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "10px",
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    color: "#9ca3af",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingReel}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "10px",
                    backgroundColor: "#10b981",
                    border: "none",
                    color: "#ffffff",
                    fontWeight: "700",
                    cursor: savingReel ? "not-allowed" : "pointer",
                  }}
                >
                  {savingReel ? "Saving..." : "Save Curation Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video / Media Player Preview Modal */}
      {previewMedia && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.88)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: "20px",
          }}
          onClick={() => setPreviewMedia(null)}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "420px",
              height: "75vh",
              backgroundColor: "#000",
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewMedia(null)}
              style={{
                position: "absolute",
                top: "14px",
                right: "14px",
                zIndex: 10,
                backgroundColor: "rgba(0,0,0,0.6)",
                border: "none",
                borderRadius: "50%",
                color: "#fff",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={20} />
            </button>

            {previewMedia.isVideo ? (
              <video
                src={previewMedia.url}
                autoPlay
                controls
                loop
                playsInline
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <img
                src={previewMedia.url}
                alt="Story"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
