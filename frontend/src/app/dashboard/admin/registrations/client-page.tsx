"use client";

import { fetchApi } from "@/lib/fetch-api";
import { useState, useMemo } from "react";
import {
    CheckCircle,
    XCircle,
    FileText,
    ExternalLink,
    Loader2,
    User,
    Phone,
    Mail,
    MapPin,
    AlertCircle,
    ZoomIn,
    ZoomOut,
    RotateCw,
    Search,
    Filter,
    Calendar,
    Clock,
    History,
    Layers,
    ShieldCheck,
    Eye,
    X,
    ChevronDown,
    SlidersHorizontal,
    CheckCircle2,
    Clock3,
} from "lucide-react";

export type ApplicationType = {
    id: string;
    businessName: string;
    trackingId?: string;
    type: string;
    businessCategory?: string;
    foodType?: string;
    ownerName: string;
    email: string;
    phone: string;
    kitchenAddress: string;
    addressFlat?: string;
    addressLocality?: string;
    addressLandmark?: string;
    adhaarUrl: string;
    fssaiUrl: string | null;
    lightBillUrl: string | null;
    passbookUrl: string | null;
    kitchenImages: string[];
    cuisineImages: string[];
    roomImages?: string[];
    createdAt: string;
    updatedAt?: string;
    verificationStatus?: string;
    verificationNote?: string | null;
    foodVerificationStatus?: string;
    propertyVerificationStatus?: string;
    agentName?: string | null;
    isOnline?: boolean;
    isActive?: boolean;
};

export default function RegistrationsClient({ initialApplications }: { initialApplications: ApplicationType[] }) {
    const [applications, setApplications] = useState<ApplicationType[]>(initialApplications);
    const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // History Filters & Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
    const [datePreset, setDatePreset] = useState<string>("ALL");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [sortBy, setSortBy] = useState<"NEWEST" | "OLDEST" | "NAME_ASC">("NEWEST");

    // Revision State
    const [revisionAppId, setRevisionAppId] = useState<string | null>(null);
    const [revisionNote, setRevisionNote] = useState("");
    const [revisionChecks, setRevisionChecks] = useState({
        adhaar: false,
        fssai: false,
        lightBill: false,
        passbook: false,
        kitchenImages: false,
        cuisineImages: false,
        roomImages: false,
    });

    // Image Modal State
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [imageRotation, setImageRotation] = useState(0);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const res = await fetchApi("/api/admin/registrations");
            if (res.ok) {
                const data = await res.json();
                setApplications(data);
            }
        } catch (err) {
            console.error("Refresh error:", err);
        } finally {
            setIsRefreshing(false);
        }
    };

    const openImage = (e: React.MouseEvent, url: string) => {
        e.preventDefault();
        setSelectedImage(url);
        setZoomLevel(1);
        setImageRotation(0);
    };

    const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.5, 3));
    const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.5, 0.5));
    const handleRotate = () => setImageRotation((prev) => (prev + 90) % 360);
    const closeImage = () => setSelectedImage(null);

    const handleAction = async (sellerId: string, action: "APPROVE" | "REJECT" | "REVISION") => {
        setProcessingId(sellerId);
        try {
            const bodyData: any = { sellerId, action };
            if (action === "REVISION") {
                let generatedNote = "Please re-upload the following documents:\n";
                if (revisionChecks.adhaar) generatedNote += "- Aadhaar Card\n";
                if (revisionChecks.fssai) generatedNote += "- FSSAI Certificate\n";
                if (revisionChecks.lightBill) generatedNote += "- Electricity Bill (Light Bill)\n";
                if (revisionChecks.passbook) generatedNote += "- Bank Passbook\n";
                if (revisionChecks.kitchenImages) generatedNote += "- Kitchen Images\n";
                if (revisionChecks.cuisineImages) generatedNote += "- Cuisine / Food Images\n";
                if (revisionChecks.roomImages) generatedNote += "- Room Photos\n";

                if (revisionNote.trim() !== "") {
                    generatedNote += `\nAdditional Notes from Admin:\n${revisionNote}`;
                }
                bodyData.verificationNote = generatedNote;
            }

            const res = await fetchApi("/api/admin/registrations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bodyData),
            });

            if (res.ok) {
                const updatedRes = await res.json();
                const updatedProfile = updatedRes.data?.profile || updatedRes.profile;
                const newStatus = action === "APPROVE" ? "APPROVED" : action === "REVISION" ? "REVISION" : "REJECTED";

                setApplications((prev) =>
                    prev.map((app) => {
                        if (app.id === sellerId) {
                            return {
                                ...app,
                                ...(updatedProfile || {}),
                                verificationStatus: newStatus,
                                verificationNote: bodyData.verificationNote || app.verificationNote,
                                updatedAt: new Date().toISOString(),
                            };
                        }
                        return app;
                    })
                );
            } else {
                alert(`Failed to ${action.toLowerCase()} application. Please try again.`);
            }
        } catch (error) {
            console.error("Action error:", error);
            alert("An error occurred.");
        } finally {
            setProcessingId(null);
            if (action === "REVISION") {
                setRevisionAppId(null);
                setRevisionNote("");
                setRevisionChecks({
                    adhaar: false,
                    fssai: false,
                    lightBill: false,
                    passbook: false,
                    kitchenImages: false,
                    cuisineImages: false,
                    roomImages: false,
                });
            }
        }
    };

    // Partition applications
    const pendingApplications = useMemo(() => {
        return applications.filter((app) => {
            const isOverallPending = app.verificationStatus === "PENDING" || app.verificationStatus === "REVISION";
            const isFoodPending = app.foodVerificationStatus === "PENDING" || app.foodVerificationStatus === "REVISION";
            const isPropPending = app.propertyVerificationStatus === "PENDING" || app.propertyVerificationStatus === "REVISION";
            return isOverallPending || isFoodPending || isPropPending;
        });
    }, [applications]);

    // Compute metrics
    const metrics = useMemo(() => {
        const total = applications.length;
        const approved = applications.filter(
            (a) => a.verificationStatus === "APPROVED" && a.foodVerificationStatus !== "PENDING" && a.propertyVerificationStatus !== "PENDING"
        ).length;
        const rejected = applications.filter(
            (a) => a.verificationStatus === "REJECTED" || a.foodVerificationStatus === "REJECTED" || a.propertyVerificationStatus === "REJECTED"
        ).length;
        const revision = applications.filter(
            (a) => a.verificationStatus === "REVISION" || a.foodVerificationStatus === "REVISION" || a.propertyVerificationStatus === "REVISION"
        ).length;
        const pending = pendingApplications.length;

        const approvedPct = total > 0 ? Math.round((approved / total) * 100) : 0;

        return { total, approved, approvedPct, rejected, revision, pending };
    }, [applications, pendingApplications]);

    // Filter & Search Applications for History Tab
    const filteredHistoryApplications = useMemo(() => {
        return applications.filter((app) => {
            // 1. Full text search
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matches =
                    app.businessName?.toLowerCase().includes(q) ||
                    app.ownerName?.toLowerCase().includes(q) ||
                    app.email?.toLowerCase().includes(q) ||
                    app.phone?.toLowerCase().includes(q) ||
                    app.kitchenAddress?.toLowerCase().includes(q) ||
                    app.type?.toLowerCase().includes(q) ||
                    app.trackingId?.toLowerCase().includes(q) ||
                    app.verificationNote?.toLowerCase().includes(q) ||
                    app.id?.toLowerCase().includes(q);

                if (!matches) return false;
            }

            // 2. Status filter
            if (statusFilter !== "ALL") {
                if (statusFilter === "APPROVED") {
                    const isApproved =
                        app.verificationStatus === "APPROVED" ||
                        app.foodVerificationStatus === "APPROVED" ||
                        app.propertyVerificationStatus === "APPROVED";
                    if (!isApproved) return false;
                } else if (statusFilter === "REJECTED") {
                    const isRejected =
                        app.verificationStatus === "REJECTED" ||
                        app.foodVerificationStatus === "REJECTED" ||
                        app.propertyVerificationStatus === "REJECTED";
                    if (!isRejected) return false;
                } else if (statusFilter === "REVISION") {
                    const isRevision =
                        app.verificationStatus === "REVISION" ||
                        app.foodVerificationStatus === "REVISION" ||
                        app.propertyVerificationStatus === "REVISION";
                    if (!isRevision) return false;
                } else if (statusFilter === "PENDING") {
                    const isPending =
                        app.verificationStatus === "PENDING" ||
                        app.foodVerificationStatus === "PENDING" ||
                        app.propertyVerificationStatus === "PENDING";
                    if (!isPending) return false;
                }
            }

            // 3. Category / Application Type filter
            if (categoryFilter !== "ALL") {
                if (categoryFilter === "NEW_REGISTRATION") {
                    if (app.verificationStatus === "APPROVED" && app.foodVerificationStatus === "NONE" && app.propertyVerificationStatus === "NONE") {
                        // is an approved new registration or ongoing
                    } else if (app.verificationStatus === "APPROVED" && (app.foodVerificationStatus === "PENDING" || app.propertyVerificationStatus === "PENDING")) {
                        return false; // this is category upgrade
                    }
                } else if (categoryFilter === "UPGRADE") {
                    const isUpgrade =
                        app.verificationStatus === "APPROVED" &&
                        (app.foodVerificationStatus !== "NONE" || app.propertyVerificationStatus !== "NONE");
                    if (!isUpgrade) return false;
                } else if (categoryFilter === "FOOD") {
                    const isFood =
                        (app.type || "").toLowerCase().includes("food") ||
                        (app.businessCategory || "").includes("FOOD") ||
                        (app.foodVerificationStatus || "") !== "NONE";
                    if (!isFood) return false;
                } else if (categoryFilter === "PROPERTY") {
                    const isProp =
                        (app.type || "").toLowerCase().includes("room") ||
                        (app.type || "").toLowerCase().includes("property") ||
                        (app.businessCategory || "").includes("PROPERTY") ||
                        (app.propertyVerificationStatus || "") !== "NONE";
                    if (!isProp) return false;
                }
            }

            // 4. Date filter
            const appDate = new Date(app.createdAt);
            const now = new Date();

            if (datePreset === "TODAY") {
                const isToday =
                    appDate.getDate() === now.getDate() &&
                    appDate.getMonth() === now.getMonth() &&
                    appDate.getFullYear() === now.getFullYear();
                if (!isToday) return false;
            } else if (datePreset === "YESTERDAY") {
                const yesterday = new Date(now);
                yesterday.setDate(now.getDate() - 1);
                const isYesterday =
                    appDate.getDate() === yesterday.getDate() &&
                    appDate.getMonth() === yesterday.getMonth() &&
                    appDate.getFullYear() === yesterday.getFullYear();
                if (!isYesterday) return false;
            } else if (datePreset === "LAST_7_DAYS") {
                const cutoff = new Date(now);
                cutoff.setDate(now.getDate() - 7);
                if (appDate < cutoff) return false;
            } else if (datePreset === "LAST_30_DAYS") {
                const cutoff = new Date(now);
                cutoff.setDate(now.getDate() - 30);
                if (appDate < cutoff) return false;
            } else if (datePreset === "THIS_MONTH") {
                const isThisMonth =
                    appDate.getMonth() === now.getMonth() &&
                    appDate.getFullYear() === now.getFullYear();
                if (!isThisMonth) return false;
            } else if (datePreset === "CUSTOM" || startDate || endDate) {
                if (startDate) {
                    const start = new Date(startDate);
                    start.setHours(0, 0, 0, 0);
                    if (appDate < start) return false;
                }
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    if (appDate > end) return false;
                }
            }

            return true;
        }).sort((a, b) => {
            if (sortBy === "NEWEST") {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            } else if (sortBy === "OLDEST") {
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            } else if (sortBy === "NAME_ASC") {
                return (a.businessName || "").localeCompare(b.businessName || "");
            }
            return 0;
        });
    }, [applications, searchQuery, statusFilter, categoryFilter, datePreset, startDate, endDate, sortBy]);

    const handleResetFilters = () => {
        setSearchQuery("");
        setStatusFilter("ALL");
        setCategoryFilter("ALL");
        setDatePreset("ALL");
        setStartDate("");
        setEndDate("");
        setSortBy("NEWEST");
    };

    const hasActiveFilters =
        Boolean(searchQuery) ||
        statusFilter !== "ALL" ||
        categoryFilter !== "ALL" ||
        datePreset !== "ALL" ||
        Boolean(startDate) ||
        Boolean(endDate);

    const renderStatusBadge = (app: ApplicationType) => {
        const isNewSeller = app.verificationStatus !== "APPROVED";
        const isOverallRevision = app.verificationStatus === "REVISION";
        const isCategoryRevision =
            app.foodVerificationStatus === "REVISION" || app.propertyVerificationStatus === "REVISION";
        const isOverallRejected = app.verificationStatus === "REJECTED";
        const isCategoryRejected =
            app.foodVerificationStatus === "REJECTED" || app.propertyVerificationStatus === "REJECTED";
        const isApproved = app.verificationStatus === "APPROVED";

        return (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                {/* Main Status Tag */}
                {isApproved ? (
                    <span
                        style={{
                            fontSize: "0.75rem",
                            padding: "4px 10px",
                            backgroundColor: "#DCFCE7",
                            color: "#166534",
                            borderRadius: "20px",
                            fontWeight: "700",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                        }}
                    >
                        <CheckCircle size={13} color="#166534" />
                        Approved
                    </span>
                ) : isOverallRejected ? (
                    <span
                        style={{
                            fontSize: "0.75rem",
                            padding: "4px 10px",
                            backgroundColor: "#FEE2E2",
                            color: "#991B1B",
                            borderRadius: "20px",
                            fontWeight: "700",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                        }}
                    >
                        <XCircle size={13} color="#991B1B" />
                        Rejected
                    </span>
                ) : isOverallRevision ? (
                    <span
                        style={{
                            fontSize: "0.75rem",
                            padding: "4px 10px",
                            backgroundColor: "#FEF3C7",
                            color: "#B45309",
                            borderRadius: "20px",
                            fontWeight: "700",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                        }}
                    >
                        <AlertCircle size={13} color="#B45309" />
                        Changes Requested (Revision)
                    </span>
                ) : (
                    <span
                        style={{
                            fontSize: "0.75rem",
                            padding: "4px 10px",
                            backgroundColor: "#EFF6FF",
                            color: "#1D4ED8",
                            borderRadius: "20px",
                            fontWeight: "700",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                        }}
                    >
                        <Clock size={13} color="#1D4ED8" />
                        Pending Review
                    </span>
                )}

                {/* Application Context Tag */}
                {isNewSeller ? (
                    <span
                        style={{
                            fontSize: "0.75rem",
                            padding: "4px 10px",
                            backgroundColor: "#F1F5F9",
                            color: "#475569",
                            borderRadius: "20px",
                            fontWeight: "600",
                        }}
                    >
                        New Seller Onboarding
                    </span>
                ) : (
                    <span
                        style={{
                            fontSize: "0.75rem",
                            padding: "4px 10px",
                            backgroundColor: "#E0E7FF",
                            color: "#3730A3",
                            borderRadius: "20px",
                            fontWeight: "600",
                        }}
                    >
                        Category Upgrade (
                        {[
                            app.foodVerificationStatus !== "NONE" && "FOOD",
                            app.propertyVerificationStatus !== "NONE" && "PROPERTY",
                        ]
                            .filter(Boolean)
                            .join(" & ") || "Verified Seller"}
                        )
                    </span>
                )}

                {(isCategoryRevision || (app.verificationNote && app.verificationStatus === "PENDING")) && (
                    <span
                        style={{
                            fontSize: "0.75rem",
                            padding: "4px 10px",
                            backgroundColor: "#FEF9C3",
                            color: "#854D0E",
                            borderRadius: "20px",
                            fontWeight: "600",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                        }}
                    >
                        <RotateCw size={12} color="#854D0E" />
                        Re-applied / Revised
                    </span>
                )}
            </div>
        );
    };

    return (
        <div style={{ animation: "fadeIn 0.4s ease-out" }}>
            {/* Header with Title and Tabs */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "1.5rem",
                    flexWrap: "wrap",
                    gap: "16px",
                }}
            >
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                        <div
                            style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "10px",
                                backgroundColor: "var(--primary)",
                                color: "#FFFFFF",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <ShieldCheck size={20} />
                        </div>
                        <h2 style={{ fontSize: "1.6rem", fontWeight: "700", color: "#0F172A", margin: 0 }}>
                            Application Manager
                        </h2>
                    </div>
                    <p style={{ color: "#64748B", fontSize: "0.92rem", margin: 0 }}>
                        Review incoming seller applications, request revisions, and explore complete application history with filters.
                    </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "9px 16px",
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #E2E8F0",
                            borderRadius: "10px",
                            fontSize: "0.88rem",
                            fontWeight: "600",
                            color: "#0F172A",
                            cursor: isRefreshing ? "not-allowed" : "pointer",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                            transition: "all 0.15s ease",
                        }}
                    >
                        <RotateCw size={15} className={isRefreshing ? "animate-spin" : ""} />
                        <span>{isRefreshing ? "Refreshing..." : "Refresh Applications"}</span>
                    </button>
                </div>
            </div>

            {/* Navigation Tabs (Active Queue vs Application History) */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    borderBottom: "1px solid #E2E8F0",
                    marginBottom: "1.75rem",
                    paddingBottom: "2px",
                }}
            >
                <button
                    type="button"
                    onClick={() => setActiveTab("pending")}
                    style={{
                        padding: "10px 18px",
                        border: "none",
                        background: "transparent",
                        fontSize: "0.95rem",
                        fontWeight: activeTab === "pending" ? 700 : 500,
                        color: activeTab === "pending" ? "var(--primary)" : "#64748B",
                        borderBottom: activeTab === "pending" ? "2px solid var(--primary)" : "2px solid transparent",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "all 0.15s ease",
                    }}
                >
                    <Layers size={17} />
                    <span>Pending Review Queue</span>
                    <span
                        style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "12px",
                            backgroundColor: activeTab === "pending" ? "#FFF1E8" : "#F1F5F9",
                            color: activeTab === "pending" ? "#F97316" : "#64748B",
                        }}
                    >
                        {pendingApplications.length}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("history")}
                    style={{
                        padding: "10px 18px",
                        border: "none",
                        background: "transparent",
                        fontSize: "0.95rem",
                        fontWeight: activeTab === "history" ? 700 : 500,
                        color: activeTab === "history" ? "var(--primary)" : "#64748B",
                        borderBottom: activeTab === "history" ? "2px solid var(--primary)" : "2px solid transparent",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "all 0.15s ease",
                    }}
                >
                    <History size={17} />
                    <span>Application History</span>
                    <span
                        style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "12px",
                            backgroundColor: activeTab === "history" ? "#FFF1E8" : "#F1F5F9",
                            color: activeTab === "history" ? "#F97316" : "#64748B",
                        }}
                    >
                        {applications.length}
                    </span>
                </button>
            </div>

            {/* TAB 1: PENDING QUEUE */}
            {activeTab === "pending" && (
                <div>
                    {pendingApplications.length === 0 ? (
                        <div
                            style={{
                                backgroundColor: "white",
                                padding: "4rem 2rem",
                                borderRadius: "16px",
                                textAlign: "center",
                                border: "1px dashed #CBD5E1",
                                color: "#64748B",
                            }}
                        >
                            <CheckCircle size={48} color="#10B981" style={{ margin: "0 auto 1rem", opacity: 0.6 }} />
                            <h3 style={{ fontSize: "1.25rem", color: "#1E293B", marginBottom: "0.5rem", fontWeight: 700 }}>
                                All caught up!
                            </h3>
                            <p style={{ margin: "0 0 1.5rem" }}>There are no pending applications needing action right now.</p>
                            <button
                                type="button"
                                onClick={() => setActiveTab("history")}
                                style={{
                                    padding: "9px 18px",
                                    backgroundColor: "#F8FAFC",
                                    border: "1px solid #CBD5E1",
                                    borderRadius: "8px",
                                    fontWeight: 600,
                                    color: "#334155",
                                    cursor: "pointer",
                                    fontSize: "0.88rem",
                                }}
                            >
                                View Application History ({applications.length})
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                            {pendingApplications.map((app) => (
                                <ApplicationCard
                                    key={app.id}
                                    app={app}
                                    processingId={processingId}
                                    handleAction={handleAction}
                                    setRevisionAppId={setRevisionAppId}
                                    openImage={openImage}
                                    renderStatusBadge={renderStatusBadge}
                                    showActions={true}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: APPLICATION HISTORY */}
            {activeTab === "history" && (
                <div>
                    {/* Metrics Summary Strip */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                            gap: "12px",
                            marginBottom: "1.5rem",
                        }}
                    >
                        <div
                            style={{
                                backgroundColor: "#FFFFFF",
                                padding: "14px 18px",
                                borderRadius: "12px",
                                border: "1px solid #F1F5F9",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                            }}
                        >
                            <span style={{ fontSize: "0.78rem", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>
                                Total Received
                            </span>
                            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0F172A", marginTop: "4px" }}>
                                {metrics.total}
                            </div>
                        </div>

                        <div
                            style={{
                                backgroundColor: "#FFFFFF",
                                padding: "14px 18px",
                                borderRadius: "12px",
                                border: "1px solid #F1F5F9",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                            }}
                        >
                            <span style={{ fontSize: "0.78rem", color: "#166534", fontWeight: 600, textTransform: "uppercase" }}>
                                Approved
                            </span>
                            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#16A34A", marginTop: "4px" }}>
                                {metrics.approved}{" "}
                                <span style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: 600 }}>
                                    ({metrics.approvedPct}%)
                                </span>
                            </div>
                        </div>

                        <div
                            style={{
                                backgroundColor: "#FFFFFF",
                                padding: "14px 18px",
                                borderRadius: "12px",
                                border: "1px solid #F1F5F9",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                            }}
                        >
                            <span style={{ fontSize: "0.78rem", color: "#B45309", fontWeight: 600, textTransform: "uppercase" }}>
                                Changes Requested
                            </span>
                            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#D97706", marginTop: "4px" }}>
                                {metrics.revision}
                            </div>
                        </div>

                        <div
                            style={{
                                backgroundColor: "#FFFFFF",
                                padding: "14px 18px",
                                borderRadius: "12px",
                                border: "1px solid #F1F5F9",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                            }}
                        >
                            <span style={{ fontSize: "0.78rem", color: "#991B1B", fontWeight: 600, textTransform: "uppercase" }}>
                                Rejected
                            </span>
                            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#EF4444", marginTop: "4px" }}>
                                {metrics.rejected}
                            </div>
                        </div>

                        <div
                            style={{
                                backgroundColor: "#FFFFFF",
                                padding: "14px 18px",
                                borderRadius: "12px",
                                border: "1px solid #F1F5F9",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                            }}
                        >
                            <span style={{ fontSize: "0.78rem", color: "#1D4ED8", fontWeight: 600, textTransform: "uppercase" }}>
                                Pending Action
                            </span>
                            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#2563EB", marginTop: "4px" }}>
                                {metrics.pending}
                            </div>
                        </div>
                    </div>

                    {/* Filter & Search Toolbar */}
                    <div
                        style={{
                            backgroundColor: "#FFFFFF",
                            borderRadius: "14px",
                            border: "1px solid #E2E8F0",
                            padding: "16px",
                            marginBottom: "1.5rem",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                        }}
                    >
                        {/* Search Input Row */}
                        <div style={{ display: "flex", gap: "12px", marginBottom: "14px", flexWrap: "wrap" }}>
                            <div style={{ flex: 1, minWidth: "260px", position: "relative" }}>
                                <Search
                                    size={17}
                                    color="#94A3B8"
                                    style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
                                />
                                <input
                                    type="text"
                                    placeholder="Search by business name, owner name, phone, email, address, tracking ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        width: "100%",
                                        height: "42px",
                                        padding: "0 36px 0 40px",
                                        borderRadius: "9px",
                                        border: "1px solid #CBD5E1",
                                        fontSize: "0.9rem",
                                        color: "#0F172A",
                                        outline: "none",
                                        boxSizing: "border-box",
                                        backgroundColor: "#F8FAFC",
                                    }}
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery("")}
                                        style={{
                                            position: "absolute",
                                            right: "12px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            color: "#94A3B8",
                                            padding: 0,
                                        }}
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Sort Dropdown */}
                            <div style={{ width: "200px" }}>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    style={{
                                        width: "100%",
                                        height: "42px",
                                        padding: "0 12px",
                                        borderRadius: "9px",
                                        border: "1px solid #CBD5E1",
                                        fontSize: "0.88rem",
                                        color: "#0F172A",
                                        backgroundColor: "#F8FAFC",
                                        outline: "none",
                                        fontWeight: 500,
                                    }}
                                >
                                    <option value="NEWEST">Newest Applied First</option>
                                    <option value="OLDEST">Oldest Applied First</option>
                                    <option value="NAME_ASC">Business Name (A-Z)</option>
                                </select>
                            </div>
                        </div>

                        {/* Filter Controls Row */}
                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                            {/* Status Filter */}
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "0.82rem", color: "#64748B", fontWeight: 600 }}>Status:</span>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    style={{
                                        height: "36px",
                                        padding: "0 10px",
                                        borderRadius: "8px",
                                        border: "1px solid #CBD5E1",
                                        fontSize: "0.85rem",
                                        color: "#0F172A",
                                        backgroundColor: "#FFFFFF",
                                        fontWeight: 600,
                                    }}
                                >
                                    <option value="ALL">All Statuses ({applications.length})</option>
                                    <option value="APPROVED">Approved ({metrics.approved})</option>
                                    <option value="REVISION">Changes Requested ({metrics.revision})</option>
                                    <option value="REJECTED">Rejected ({metrics.rejected})</option>
                                    <option value="PENDING">Pending Review ({metrics.pending})</option>
                                </select>
                            </div>

                            {/* Category Filter */}
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "0.82rem", color: "#64748B", fontWeight: 600 }}>Type:</span>
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    style={{
                                        height: "36px",
                                        padding: "0 10px",
                                        borderRadius: "8px",
                                        border: "1px solid #CBD5E1",
                                        fontSize: "0.85rem",
                                        color: "#0F172A",
                                        backgroundColor: "#FFFFFF",
                                        fontWeight: 600,
                                    }}
                                >
                                    <option value="ALL">All Types</option>
                                    <option value="NEW_REGISTRATION">New Seller Onboarding</option>
                                    <option value="UPGRADE">Category Upgrade Requests</option>
                                    <option value="FOOD">Food & Kitchen Stores</option>
                                    <option value="PROPERTY">Rooms & Property Stays</option>
                                </select>
                            </div>

                            {/* Date Presets Filter */}
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "0.82rem", color: "#64748B", fontWeight: 600 }}>Date:</span>
                                <select
                                    value={datePreset}
                                    onChange={(e) => {
                                        setDatePreset(e.target.value);
                                        if (e.target.value !== "CUSTOM") {
                                            setStartDate("");
                                            setEndDate("");
                                        }
                                    }}
                                    style={{
                                        height: "36px",
                                        padding: "0 10px",
                                        borderRadius: "8px",
                                        border: "1px solid #CBD5E1",
                                        fontSize: "0.85rem",
                                        color: "#0F172A",
                                        backgroundColor: "#FFFFFF",
                                        fontWeight: 600,
                                    }}
                                >
                                    <option value="ALL">All Time</option>
                                    <option value="TODAY">Today</option>
                                    <option value="YESTERDAY">Yesterday</option>
                                    <option value="LAST_7_DAYS">Last 7 Days</option>
                                    <option value="LAST_30_DAYS">Last 30 Days</option>
                                    <option value="THIS_MONTH">This Month</option>
                                    <option value="CUSTOM">Custom Date Range</option>
                                </select>
                            </div>

                            {/* Custom Date Pickers */}
                            {(datePreset === "CUSTOM" || startDate || endDate) && (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                        <span style={{ fontSize: "0.8rem", color: "#64748B" }}>From:</span>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => {
                                                setStartDate(e.target.value);
                                                setDatePreset("CUSTOM");
                                            }}
                                            style={{
                                                height: "36px",
                                                padding: "0 8px",
                                                borderRadius: "8px",
                                                border: "1px solid #CBD5E1",
                                                fontSize: "0.85rem",
                                                color: "#0F172A",
                                                backgroundColor: "#FFFFFF",
                                            }}
                                        />
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                        <span style={{ fontSize: "0.8rem", color: "#64748B" }}>To:</span>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => {
                                                setEndDate(e.target.value);
                                                setDatePreset("CUSTOM");
                                            }}
                                            style={{
                                                height: "36px",
                                                padding: "0 8px",
                                                borderRadius: "8px",
                                                border: "1px solid #CBD5E1",
                                                fontSize: "0.85rem",
                                                color: "#0F172A",
                                                backgroundColor: "#FFFFFF",
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Reset Button */}
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    style={{
                                        height: "36px",
                                        padding: "0 12px",
                                        borderRadius: "8px",
                                        border: "1px solid #FEE2E2",
                                        backgroundColor: "#FEF2F2",
                                        color: "#EF4444",
                                        fontSize: "0.82rem",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        marginLeft: "auto",
                                    }}
                                >
                                    <X size={14} />
                                    Reset Filters
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Results Count Strip */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "1rem",
                            padding: "0 4px",
                        }}
                    >
                        <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#475569" }}>
                            Showing {filteredHistoryApplications.length} of {applications.length} applications
                        </span>
                    </div>

                    {/* History Applications List */}
                    {filteredHistoryApplications.length === 0 ? (
                        <div
                            style={{
                                backgroundColor: "white",
                                padding: "4rem 2rem",
                                borderRadius: "16px",
                                textAlign: "center",
                                border: "1px dashed #CBD5E1",
                                color: "#64748B",
                            }}
                        >
                            <Search size={44} color="#94A3B8" style={{ margin: "0 auto 1rem", opacity: 0.6 }} />
                            <h3 style={{ fontSize: "1.2rem", color: "#1E293B", marginBottom: "0.5rem", fontWeight: 700 }}>
                                No matching applications found
                            </h3>
                            <p style={{ margin: "0 0 1.25rem", fontSize: "0.9rem" }}>
                                Try adjusting your search query, status, or date range filters.
                            </p>
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                style={{
                                    padding: "8px 18px",
                                    backgroundColor: "var(--primary)",
                                    color: "#FFFFFF",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    fontSize: "0.88rem",
                                }}
                            >
                                Clear All Filters
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                            {filteredHistoryApplications.map((app) => (
                                <ApplicationCard
                                    key={app.id}
                                    app={app}
                                    processingId={processingId}
                                    handleAction={handleAction}
                                    setRevisionAppId={setRevisionAppId}
                                    openImage={openImage}
                                    renderStatusBadge={renderStatusBadge}
                                    showActions={true}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Revision Modal */}
            {revisionAppId && (() => {
                const targetApp = applications.find((a) => a.id === revisionAppId);
                const isCategoryUpgrade = targetApp?.verificationStatus === "APPROVED";
                const isFoodPending =
                    targetApp?.foodVerificationStatus === "PENDING" || targetApp?.foodVerificationStatus === "REVISION";
                const isPropertyPending =
                    targetApp?.propertyVerificationStatus === "PENDING" || targetApp?.propertyVerificationStatus === "REVISION";

                return (
                    <div
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "rgba(15, 23, 42, 0.65)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 1000,
                            padding: "1rem",
                            backdropFilter: "blur(4px)",
                        }}
                    >
                        <div
                            style={{
                                backgroundColor: "white",
                                borderRadius: "16px",
                                padding: "2rem",
                                width: "100%",
                                maxWidth: "520px",
                                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                                maxHeight: "90vh",
                                overflowY: "auto",
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                                <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#0F172A", margin: 0 }}>
                                    Request Document Revision
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setRevisionAppId(null)}
                                    style={{ border: "none", background: "none", cursor: "pointer", color: "#94A3B8" }}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <p style={{ color: "#64748B", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                                Select the specific documents that need to be corrected or re-uploaded by{" "}
                                <strong>{targetApp?.businessName || targetApp?.ownerName}</strong>.
                            </p>

                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "1.5rem" }}>
                                {!isCategoryUpgrade && (
                                    <>
                                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#334155" }}>
                                            <input
                                                type="checkbox"
                                                checked={revisionChecks.adhaar}
                                                onChange={(e) => setRevisionChecks((prev) => ({ ...prev, adhaar: e.target.checked }))}
                                            />
                                            Aadhaar Card (Front / Back)
                                        </label>
                                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#334155" }}>
                                            <input
                                                type="checkbox"
                                                checked={revisionChecks.lightBill}
                                                onChange={(e) => setRevisionChecks((prev) => ({ ...prev, lightBill: e.target.checked }))}
                                            />
                                            Electricity Bill (Light Bill)
                                        </label>
                                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#334155" }}>
                                            <input
                                                type="checkbox"
                                                checked={revisionChecks.passbook}
                                                onChange={(e) => setRevisionChecks((prev) => ({ ...prev, passbook: e.target.checked }))}
                                            />
                                            Bank Passbook
                                        </label>
                                    </>
                                )}

                                {(!isCategoryUpgrade || isFoodPending) && (
                                    <>
                                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#334155" }}>
                                            <input
                                                type="checkbox"
                                                checked={revisionChecks.fssai}
                                                onChange={(e) => setRevisionChecks((prev) => ({ ...prev, fssai: e.target.checked }))}
                                            />
                                            FSSAI Certificate License
                                        </label>
                                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#334155" }}>
                                            <input
                                                type="checkbox"
                                                checked={revisionChecks.kitchenImages}
                                                onChange={(e) => setRevisionChecks((prev) => ({ ...prev, kitchenImages: e.target.checked }))}
                                            />
                                            Kitchen Photos
                                        </label>
                                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#334155" }}>
                                            <input
                                                type="checkbox"
                                                checked={revisionChecks.cuisineImages}
                                                onChange={(e) => setRevisionChecks((prev) => ({ ...prev, cuisineImages: e.target.checked }))}
                                            />
                                            Cuisine / Food Photos
                                        </label>
                                    </>
                                )}

                                {(!isCategoryUpgrade || isPropertyPending) && (
                                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#334155" }}>
                                        <input
                                            type="checkbox"
                                            checked={revisionChecks.roomImages}
                                            onChange={(e) => setRevisionChecks((prev) => ({ ...prev, roomImages: e.target.checked }))}
                                        />
                                        Room Photos
                                    </label>
                                )}
                            </div>

                            <div style={{ marginBottom: "1.75rem" }}>
                                <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "600", color: "#334155", marginBottom: "8px" }}>
                                    Additional Instructions for Seller
                                </label>
                                <textarea
                                    value={revisionNote}
                                    onChange={(e) => setRevisionNote(e.target.value)}
                                    placeholder="E.g. Aadhaar card photo is blurry. Please upload clear scans with legible text."
                                    style={{
                                        width: "100%",
                                        height: "90px",
                                        padding: "10px",
                                        borderRadius: "8px",
                                        border: "1px solid #CBD5E1",
                                        fontSize: "0.9rem",
                                        boxSizing: "border-box",
                                        resize: "vertical",
                                    }}
                                />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button
                                    type="button"
                                    onClick={() => setRevisionAppId(null)}
                                    style={{
                                        padding: "9px 18px",
                                        borderRadius: "8px",
                                        border: "1px solid #E2E8F0",
                                        backgroundColor: "white",
                                        fontWeight: "600",
                                        color: "#64748B",
                                        cursor: "pointer",
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleAction(revisionAppId, "REVISION")}
                                    disabled={processingId === revisionAppId}
                                    style={{
                                        padding: "9px 20px",
                                        borderRadius: "8px",
                                        border: "none",
                                        backgroundColor: "#D97706",
                                        color: "white",
                                        fontWeight: "600",
                                        cursor: processingId === revisionAppId ? "not-allowed" : "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    {processingId === revisionAppId ? <Loader2 size={16} className="animate-spin" /> : <AlertCircle size={16} />}
                                    Send Revision Request
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Image Preview & Zoom Modal */}
            {selectedImage && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.85)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 2000,
                        padding: "1.5rem",
                    }}
                    onClick={closeImage}
                >
                    <div
                        style={{
                            position: "relative",
                            maxWidth: "90vw",
                            maxHeight: "85vh",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Control Bar */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                backgroundColor: "#1E293B",
                                padding: "8px 16px",
                                borderRadius: "30px",
                                marginBottom: "14px",
                                boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                            }}
                        >
                            <button
                                type="button"
                                onClick={handleZoomOut}
                                title="Zoom Out"
                                style={{ background: "none", border: "none", color: "#FFFFFF", cursor: "pointer", padding: "4px" }}
                            >
                                <ZoomOut size={18} />
                            </button>
                            <span style={{ color: "#94A3B8", fontSize: "0.85rem", fontWeight: 600 }}>
                                {Math.round(zoomLevel * 100)}%
                            </span>
                            <button
                                type="button"
                                onClick={handleZoomIn}
                                title="Zoom In"
                                style={{ background: "none", border: "none", color: "#FFFFFF", cursor: "pointer", padding: "4px" }}
                            >
                                <ZoomIn size={18} />
                            </button>
                            <div style={{ width: "1px", height: "16px", backgroundColor: "#334155" }} />
                            <button
                                type="button"
                                onClick={handleRotate}
                                title="Rotate 90°"
                                style={{ background: "none", border: "none", color: "#FFFFFF", cursor: "pointer", padding: "4px" }}
                            >
                                <RotateCw size={18} />
                            </button>
                            <div style={{ width: "1px", height: "16px", backgroundColor: "#334155" }} />
                            <button
                                type="button"
                                onClick={closeImage}
                                title="Close"
                                style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", padding: "4px" }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Image Viewer Frame */}
                        <div
                            style={{
                                overflow: "auto",
                                maxWidth: "88vw",
                                maxHeight: "75vh",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "#0F172A",
                                borderRadius: "12px",
                                padding: "10px",
                            }}
                        >
                            <img
                                src={selectedImage}
                                alt="Document View"
                                style={{
                                    maxWidth: "100%",
                                    maxHeight: "100%",
                                    objectFit: "contain",
                                    transform: `scale(${zoomLevel}) rotate(${imageRotation}deg)`,
                                    transition: "transform 0.2s ease-out",
                                    borderRadius: "8px",
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Reusable Application Card Component
interface ApplicationCardProps {
    app: ApplicationType;
    processingId: string | null;
    handleAction: (sellerId: string, action: "APPROVE" | "REJECT" | "REVISION") => void;
    setRevisionAppId: (id: string) => void;
    openImage: (e: React.MouseEvent, url: string) => void;
    renderStatusBadge: (app: ApplicationType) => React.ReactNode;
    showActions?: boolean;
}

function ApplicationCard({
    app,
    processingId,
    handleAction,
    setRevisionAppId,
    openImage,
    renderStatusBadge,
    showActions = true,
}: ApplicationCardProps) {
    const isPending =
        app.verificationStatus === "PENDING" ||
        app.verificationStatus === "REVISION" ||
        app.foodVerificationStatus === "PENDING" ||
        app.foodVerificationStatus === "REVISION" ||
        app.propertyVerificationStatus === "PENDING" ||
        app.propertyVerificationStatus === "REVISION";

    const isCategoryUpgrade = app.verificationStatus === "APPROVED";

    return (
        <div
            style={{
                backgroundColor: "white",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                border: "1px solid #F1F5F9",
                overflow: "hidden",
            }}
        >
            {/* Card Header */}
            <div
                style={{
                    padding: "1.25rem 1.5rem",
                    backgroundColor: "#FAFBFC",
                    borderBottom: "1px solid #F1F5F9",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "12px",
                }}
            >
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                            {app.businessName}
                        </h3>
                        <span
                            style={{
                                fontSize: "0.75rem",
                                padding: "3px 9px",
                                backgroundColor: (app.type || "").toLowerCase().includes("food") ? "#FEF08A" : "#BAE6FD",
                                color: (app.type || "").toLowerCase().includes("food") ? "#CA8A04" : "#0284C7",
                                borderRadius: "20px",
                                fontWeight: "700",
                                textTransform: "uppercase",
                            }}
                        >
                            {app.type || "STORE"}
                        </span>
                        {renderStatusBadge(app)}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "6px", flexWrap: "wrap" }}>
                        {app.trackingId && (
                            <span style={{ fontSize: "0.82rem", color: "#64748B", fontWeight: 600 }}>
                                ID: <span style={{ color: "#0F172A" }}>{app.trackingId}</span>
                            </span>
                        )}
                        <span style={{ fontSize: "0.82rem", color: "#64748B", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <Calendar size={13} color="#94A3B8" />
                            Applied: {new Date(app.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        {app.updatedAt && app.updatedAt !== app.createdAt && (
                            <span style={{ fontSize: "0.82rem", color: "#64748B", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <Clock3 size={13} color="#94A3B8" />
                                Updated: {new Date(app.updatedAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                        )}
                    </div>
                </div>

                {/* Header Action Buttons */}
                {showActions && (
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                            type="button"
                            onClick={() => handleAction(app.id, "REJECT")}
                            disabled={processingId === app.id}
                            style={{
                                padding: "8px 16px",
                                borderRadius: "8px",
                                fontWeight: "600",
                                backgroundColor: "white",
                                color: "#EF4444",
                                border: "1px solid #FCA5A5",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "0.85rem",
                                cursor: processingId === app.id ? "not-allowed" : "pointer",
                                opacity: processingId === app.id ? 0.7 : 1,
                                transition: "all 0.15s ease",
                            }}
                        >
                            <XCircle size={15} />
                            Reject
                        </button>

                        <button
                            type="button"
                            onClick={() => setRevisionAppId(app.id)}
                            disabled={processingId === app.id}
                            style={{
                                padding: "8px 16px",
                                borderRadius: "8px",
                                fontWeight: "600",
                                backgroundColor: "white",
                                color: "#D97706",
                                border: "1px solid #FCD34D",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "0.85rem",
                                cursor: processingId === app.id ? "not-allowed" : "pointer",
                                opacity: processingId === app.id ? 0.7 : 1,
                                transition: "all 0.15s ease",
                            }}
                        >
                            <AlertCircle size={15} />
                            Request Revision
                        </button>

                        <button
                            type="button"
                            onClick={() => handleAction(app.id, "APPROVE")}
                            disabled={processingId === app.id}
                            style={{
                                padding: "8px 20px",
                                borderRadius: "8px",
                                fontWeight: "600",
                                backgroundColor: "#10B981",
                                color: "white",
                                border: "1px solid #10B981",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "0.85rem",
                                cursor: processingId === app.id ? "not-allowed" : "pointer",
                                opacity: processingId === app.id ? 0.7 : 1,
                                boxShadow: "0 2px 6px rgba(16, 185, 129, 0.2)",
                                transition: "all 0.15s ease",
                            }}
                        >
                            {processingId === app.id ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                            {isCategoryUpgrade ? "Approve Upgrade" : "Approve Seller"}
                        </button>
                    </div>
                )}
            </div>

            {/* Verification Note Highlight (if present) */}
            {app.verificationNote && (
                <div
                    style={{
                        padding: "10px 1.5rem",
                        backgroundColor: "#FFFBEB",
                        borderBottom: "1px solid #FEF3C7",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                    }}
                >
                    <AlertCircle size={17} color="#D97706" style={{ marginTop: "2px", flexShrink: 0 }} />
                    <div>
                        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#92400E", textTransform: "uppercase" }}>
                            Admin Verification Note / Feedback:
                        </span>
                        <p style={{ fontSize: "0.88rem", color: "#78350F", margin: "2px 0 0", whiteSpace: "pre-line" }}>
                            {app.verificationNote}
                        </p>
                    </div>
                </div>
            )}

            {/* Details Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", padding: "1.5rem" }}>
                {/* Personal & Business Info */}
                <div>
                    <h4
                        style={{
                            fontSize: "0.82rem",
                            textTransform: "uppercase",
                            color: "#94A3B8",
                            fontWeight: "700",
                            marginBottom: "1rem",
                            letterSpacing: "0.5px",
                        }}
                    >
                        Seller & Contact Details
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div
                                style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "50%",
                                    backgroundColor: "#F1F5F9",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <User size={18} color="#64748B" />
                            </div>
                            <div>
                                <p style={{ fontSize: "0.78rem", color: "#64748B", margin: 0 }}>Full Name</p>
                                <p style={{ fontWeight: "600", color: "#334155", margin: 0, fontSize: "0.92rem" }}>
                                    {app.ownerName}
                                </p>
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div
                                style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "50%",
                                    backgroundColor: "#F1F5F9",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Phone size={18} color="#64748B" />
                            </div>
                            <div>
                                <p style={{ fontSize: "0.78rem", color: "#64748B", margin: 0 }}>Phone Number</p>
                                <p style={{ fontWeight: "600", color: "#334155", margin: 0, fontSize: "0.92rem" }}>
                                    {app.phone}
                                </p>
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div
                                style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "50%",
                                    backgroundColor: "#F1F5F9",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Mail size={18} color="#64748B" />
                            </div>
                            <div>
                                <p style={{ fontSize: "0.78rem", color: "#64748B", margin: 0 }}>Email Address</p>
                                <p style={{ fontWeight: "600", color: "#334155", margin: 0, fontSize: "0.92rem" }}>
                                    {app.email}
                                </p>
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div
                                style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "50%",
                                    backgroundColor: "#F1F5F9",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <MapPin size={18} color="#64748B" />
                            </div>
                            <div>
                                <p style={{ fontSize: "0.78rem", color: "#64748B", margin: 0 }}>Kitchen / Property Address</p>
                                <p style={{ fontWeight: "600", color: "#334155", margin: 0, fontSize: "0.92rem" }}>
                                    {app.kitchenAddress || "Not specified"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Documents & Photos */}
                <div>
                    <h4
                        style={{
                            fontSize: "0.82rem",
                            textTransform: "uppercase",
                            color: "#94A3B8",
                            fontWeight: "700",
                            marginBottom: "1rem",
                            letterSpacing: "0.5px",
                        }}
                    >
                        Submitted Documentation
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {/* Aadhaar Card */}
                        {(() => {
                            let adhaarUrls: string[] = [];
                            const isAadhaar = app.adhaarUrl?.startsWith("[");
                            try {
                                if (isAadhaar) {
                                    adhaarUrls = JSON.parse(app.adhaarUrl);
                                } else if (app.adhaarUrl) {
                                    adhaarUrls = [app.adhaarUrl];
                                }
                            } catch {
                                adhaarUrls = app.adhaarUrl ? [app.adhaarUrl] : [];
                            }

                            return adhaarUrls.map((url, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        border: "1px solid #E2E8F0",
                                        borderRadius: "10px",
                                        padding: "0.75rem 1rem",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div
                                            style={{
                                                width: "36px",
                                                height: "36px",
                                                borderRadius: "8px",
                                                backgroundColor: "#EFF6FF",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <FileText size={18} color="#3B82F6" />
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: "600", color: "#334155", margin: 0, fontSize: "0.88rem" }}>
                                                {isAadhaar
                                                    ? `Aadhaar Card ${adhaarUrls.length > 1 ? (idx === 0 ? "(Front)" : "(Back)") : ""}`
                                                    : "Identity / PAN Proof"}
                                            </p>
                                            <p style={{ fontSize: "0.75rem", color: "#64748B", margin: 0 }}>Identity Verification</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => openImage(e, url)}
                                        style={{
                                            padding: "6px 14px",
                                            backgroundColor: "#F8FAFC",
                                            color: "#334155",
                                            borderRadius: "6px",
                                            fontSize: "0.82rem",
                                            fontWeight: "600",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "4px",
                                            border: "1px solid #E2E8F0",
                                            cursor: "pointer",
                                        }}
                                    >
                                        View <ExternalLink size={13} />
                                    </button>
                                </div>
                            ));
                        })()}

                        {/* FSSAI Certificate */}
                        <div
                            style={{
                                border: "1px solid #E2E8F0",
                                borderRadius: "10px",
                                padding: "0.75rem 1rem",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div
                                    style={{
                                        width: "36px",
                                        height: "36px",
                                        borderRadius: "8px",
                                        backgroundColor: "#F0FDF4",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <FileText size={18} color="#22C55E" />
                                </div>
                                <div>
                                    <p style={{ fontWeight: "600", color: "#334155", margin: 0, fontSize: "0.88rem" }}>
                                        FSSAI Certificate License
                                    </p>
                                    <p style={{ fontSize: "0.75rem", color: "#64748B", margin: 0 }}>Food Safety License</p>
                                </div>
                            </div>
                            {app.fssaiUrl ? (
                                <button
                                    type="button"
                                    onClick={(e) => app.fssaiUrl && openImage(e, app.fssaiUrl)}
                                    style={{
                                        padding: "6px 14px",
                                        backgroundColor: "#F8FAFC",
                                        color: "#334155",
                                        borderRadius: "6px",
                                        fontSize: "0.82rem",
                                        fontWeight: "600",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        border: "1px solid #E2E8F0",
                                        cursor: "pointer",
                                    }}
                                >
                                    View <ExternalLink size={13} />
                                </button>
                            ) : (
                                <span style={{ fontSize: "0.8rem", color: "#94A3B8", fontStyle: "italic", padding: "6px 12px" }}>
                                    Not provided
                                </span>
                            )}
                        </div>

                        {/* Electricity Bill (Light Bill) */}
                        <div
                            style={{
                                border: "1px solid #E2E8F0",
                                borderRadius: "10px",
                                padding: "0.75rem 1rem",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div
                                    style={{
                                        width: "36px",
                                        height: "36px",
                                        borderRadius: "8px",
                                        backgroundColor: "#FFF7ED",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <FileText size={18} color="#F97316" />
                                </div>
                                <div>
                                    <p style={{ fontWeight: "600", color: "#334155", margin: 0, fontSize: "0.88rem" }}>
                                        Electricity Bill (Light Bill)
                                    </p>
                                    <p style={{ fontSize: "0.75rem", color: "#64748B", margin: 0 }}>Premises Address Proof</p>
                                </div>
                            </div>
                            {app.lightBillUrl ? (
                                <button
                                    type="button"
                                    onClick={(e) => app.lightBillUrl && openImage(e, app.lightBillUrl)}
                                    style={{
                                        padding: "6px 14px",
                                        backgroundColor: "#F8FAFC",
                                        color: "#334155",
                                        borderRadius: "6px",
                                        fontSize: "0.82rem",
                                        fontWeight: "600",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        border: "1px solid #E2E8F0",
                                        cursor: "pointer",
                                    }}
                                >
                                    View <ExternalLink size={13} />
                                </button>
                            ) : (
                                <span style={{ fontSize: "0.8rem", color: "#94A3B8", fontStyle: "italic", padding: "6px 12px" }}>
                                    Not provided
                                </span>
                            )}
                        </div>

                        {/* Bank Passbook */}
                        <div
                            style={{
                                border: "1px solid #E2E8F0",
                                borderRadius: "10px",
                                padding: "0.75rem 1rem",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div
                                    style={{
                                        width: "36px",
                                        height: "36px",
                                        borderRadius: "8px",
                                        backgroundColor: "#FAF5FF",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <FileText size={18} color="#A855F7" />
                                </div>
                                <div>
                                    <p style={{ fontWeight: "600", color: "#334155", margin: 0, fontSize: "0.88rem" }}>
                                        Bank Passbook / Statement
                                    </p>
                                    <p style={{ fontSize: "0.75rem", color: "#64748B", margin: 0 }}>Payout & Settlement Proof</p>
                                </div>
                            </div>
                            {app.passbookUrl ? (
                                <button
                                    type="button"
                                    onClick={(e) => app.passbookUrl && openImage(e, app.passbookUrl)}
                                    style={{
                                        padding: "6px 14px",
                                        backgroundColor: "#F8FAFC",
                                        color: "#334155",
                                        borderRadius: "6px",
                                        fontSize: "0.82rem",
                                        fontWeight: "600",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        border: "1px solid #E2E8F0",
                                        cursor: "pointer",
                                    }}
                                >
                                    View <ExternalLink size={13} />
                                </button>
                            ) : (
                                <span style={{ fontSize: "0.8rem", color: "#94A3B8", fontStyle: "italic", padding: "6px 12px" }}>
                                    Not provided
                                </span>
                            )}
                        </div>

                        {/* Kitchen Photos Gallery */}
                        {app.kitchenImages && app.kitchenImages.length > 0 && (
                            <div style={{ marginTop: "0.5rem" }}>
                                <h5 style={{ fontSize: "0.82rem", color: "#64748B", marginBottom: "0.4rem", fontWeight: "600" }}>
                                    Kitchen Photos ({app.kitchenImages.length})
                                </h5>
                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                    {app.kitchenImages.map((img, i) => (
                                        <div
                                            key={i}
                                            onClick={(e) => openImage(e, img)}
                                            style={{
                                                cursor: "pointer",
                                                width: "70px",
                                                height: "70px",
                                                borderRadius: "8px",
                                                overflow: "hidden",
                                                border: "1px solid #E2E8F0",
                                                backgroundColor: "#F8FAFC",
                                                transition: "transform 0.15s ease",
                                            }}
                                            onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                                            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                                        >
                                            <img src={img} alt={`Kitchen ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Cuisine Photos Gallery */}
                        {app.cuisineImages && app.cuisineImages.length > 0 && (
                            <div style={{ marginTop: "0.5rem" }}>
                                <h5 style={{ fontSize: "0.82rem", color: "#64748B", marginBottom: "0.4rem", fontWeight: "600" }}>
                                    Food & Cuisine Photos ({app.cuisineImages.length})
                                </h5>
                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                    {app.cuisineImages.map((img, i) => (
                                        <div
                                            key={i}
                                            onClick={(e) => openImage(e, img)}
                                            style={{
                                                cursor: "pointer",
                                                width: "70px",
                                                height: "70px",
                                                borderRadius: "8px",
                                                overflow: "hidden",
                                                border: "1px solid #E2E8F0",
                                                backgroundColor: "#F8FAFC",
                                                transition: "transform 0.15s ease",
                                            }}
                                            onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                                            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                                        >
                                            <img src={img} alt={`Cuisine ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Room Photos Gallery */}
                        {app.roomImages && app.roomImages.length > 0 && (
                            <div style={{ marginTop: "0.5rem" }}>
                                <h5 style={{ fontSize: "0.82rem", color: "#64748B", marginBottom: "0.4rem", fontWeight: "600" }}>
                                    Room Photos ({app.roomImages.length})
                                </h5>
                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                    {app.roomImages.map((img, i) => (
                                        <div
                                            key={i}
                                            onClick={(e) => openImage(e, img)}
                                            style={{
                                                cursor: "pointer",
                                                width: "70px",
                                                height: "70px",
                                                borderRadius: "8px",
                                                overflow: "hidden",
                                                border: "1px solid #E2E8F0",
                                                backgroundColor: "#F8FAFC",
                                                transition: "transform 0.15s ease",
                                            }}
                                            onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                                            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                                        >
                                            <img src={img} alt={`Room ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
