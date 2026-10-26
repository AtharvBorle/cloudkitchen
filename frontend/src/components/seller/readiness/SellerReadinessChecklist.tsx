"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Camera,
  Image as ImageIcon,
  MapPin,
  CreditCard,
  Truck,
  Utensils,
  X,
  UploadCloud,
  Check,
  Loader2,
  Sparkles,
  ArrowRight,
  Edit3,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { fetchApi } from "@/lib/fetch-api";
import { compressImage } from "@/lib/image-compression";
import styles from "./SellerReadinessChecklist.module.css";

export interface ReadinessItem {
  id: "card_photo" | "cover_image" | "delivery_radius" | "operating_hours" | "upi_payment" | "delivery_person" | "menu_items";
  step: number;
  title: string;
  description: string;
  isCompleted: boolean;
  value?: any;
  count?: number;
}

export interface SellerReadinessChecklistProps {
  onCompleted?: () => void;
  initialChecklist?: ReadinessItem[];
}

const DEFAULT_ITEMS: ReadinessItem[] = [
  {
    id: "card_photo",
    step: 1,
    title: "Kitchen card grid photo upload",
    description: "Upload your kitchen's signature card photo that appears on customer search grids and the explore page.",
    isCompleted: false,
  },
  {
    id: "cover_image",
    step: 2,
    title: "Storefront cover image upload",
    description: "Upload a vibrant wide hero cover image that welcomes customers when they open your kitchen page.",
    isCompleted: false,
  },
  {
    id: "delivery_radius",
    step: 3,
    title: "Review delivery radius",
    description: "Review and configure your operational delivery range (1 to 15 km) to receive orders within your service area.",
    isCompleted: false,
    value: 5.0,
  },
  {
    id: "operating_hours",
    step: 4,
    title: "Review operating hrs",
    description: "Review and save your weekly opening & closing schedule to ensure orders only arrive while you're open.",
    isCompleted: false,
  },
  {
    id: "upi_payment",
    step: 5,
    title: "Add upi to get payments",
    description: "Set your valid UPI ID (e.g. yourkitchen@upi) to receive direct customer payments & counter settlements.",
    isCompleted: false,
  },
  {
    id: "delivery_person",
    step: 6,
    title: "Add delivery person",
    description: "Add at least one delivery rider to your fleet to assign deliveries and fulfill customer food packages.",
    isCompleted: false,
    count: 0,
  },
  {
    id: "menu_items",
    step: 7,
    title: "Add Items in menue",
    description: "Create at least one dish in your kitchen menu so hungry customers can explore, order, and pay.",
    isCompleted: false,
    count: 0,
  },
];

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function SellerReadinessChecklist({
  onCompleted,
  initialChecklist,
}: SellerReadinessChecklistProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(!initialChecklist);
  const [items, setItems] = useState<ReadinessItem[]>(initialChecklist || DEFAULT_ITEMS);
  const [activeModal, setActiveModal] = useState<ReadinessItem["id"] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Modal 1: Card Grid Photo state
  const [cardFile, setCardFile] = useState<File | null>(null);
  const [cardPreview, setCardPreview] = useState<string>("");
  const cardInputRef = useRef<HTMLInputElement>(null);

  // Modal 2: Storefront Cover Image state
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>("");
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Modal 3: Delivery Radius state
  const [deliveryRadius, setDeliveryRadius] = useState<number>(5.0);

  // Modal 4: Operating Hours state
  const [operatingHours, setOperatingHours] = useState<
    Array<{ day: string; openTime: string; closeTime: string; isOpen: boolean }>
  >(() =>
    DAYS_OF_WEEK.map((day) => ({
      day,
      openTime: "09:00",
      closeTime: "23:00",
      isOpen: true,
    }))
  );

  // Modal 5: UPI ID state
  const [upiId, setUpiId] = useState<string>("");

  // Modal 6: Delivery Person state
  const [riderForm, setRiderForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    vehicleType: "BIKE",
    vehicleNumber: "",
  });

  // Modal 7: Menu Item state
  const [menuForm, setMenuForm] = useState({
    name: "",
    price: "",
    categoryName: "Main Course",
    foodType: "VEG",
    description: "",
  });
  const [menuImageFile, setMenuImageFile] = useState<File | null>(null);
  const [menuImagePreview, setMenuImagePreview] = useState<string>("");
  const menuInputRef = useRef<HTMLInputElement>(null);

  // Fetch current readiness status
  const loadReadiness = async () => {
    try {
      setLoading(true);
      const res = await fetchApi("/api/seller/readiness");
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        if (Array.isArray(data.checklist)) {
          setItems(data.checklist);

          // Populate edit values
          data.checklist.forEach((item: any) => {
            if (item.id === "card_photo" && item.value) setCardPreview(item.value);
            if (item.id === "cover_image" && item.value) setBannerPreview(item.value);
            if (item.id === "delivery_radius" && item.value) setDeliveryRadius(Number(item.value) || 5.0);
            if (item.id === "upi_payment" && item.value) setUpiId(item.value);
            if (item.id === "operating_hours" && item.value) {
              try {
                const parsed = typeof item.value === "string" ? JSON.parse(item.value) : item.value;
                if (Array.isArray(parsed) && parsed.length > 0) setOperatingHours(parsed);
              } catch {}
            }
          });

          if (data.isReadinessCompleted) {
            setShowCelebration(true);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load readiness status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReadiness();
  }, []);

  const completedCount = items.filter((it) => it.isCompleted).length;
  const progressPercent = Math.round((completedCount / items.length) * 100);

  // Open appropriate edit modal for an item
  const handleOpenEditModal = (item: ReadinessItem) => {
    setErrorMessage("");
    setActiveModal(item.id);

    // Initialize fields based on existing values
    if (item.id === "card_photo" && item.value && !cardPreview) {
      setCardPreview(item.value);
    } else if (item.id === "cover_image" && item.value && !bannerPreview) {
      setBannerPreview(item.value);
    } else if (item.id === "delivery_radius" && item.value) {
      setDeliveryRadius(Number(item.value) || 5.0);
    } else if (item.id === "upi_payment" && item.value) {
      setUpiId(item.value);
    }
  };

  // 1. Submit Card Grid Photo
  const handleSubmitCardPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardFile && !cardPreview) {
      setErrorMessage("Please select an image file to upload for your kitchen card.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      if (cardFile) {
        const compressed = await compressImage(cardFile, { maxDimension: 1200, quality: 0.85 });
        const fd = new FormData();
        fd.append("cardImageFile", compressed);
        const res = await fetchApi("/api/seller/profile", { method: "POST", body: fd });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Failed to upload card grid photo");
        }
      }
      setActiveModal(null);
      await loadReadiness();
    } catch (err: any) {
      setErrorMessage(err.message || "Error uploading card grid image");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Submit Storefront Cover Banner
  const handleSubmitCoverImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerFile && !bannerPreview) {
      setErrorMessage("Please select an image file for your storefront cover.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      if (bannerFile) {
        const compressed = await compressImage(bannerFile, { maxDimension: 1600, quality: 0.85 });
        const fd = new FormData();
        fd.append("bannerImageFile", compressed);
        const res = await fetchApi("/api/seller/profile", { method: "POST", body: fd });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Failed to upload cover banner");
        }
      }
      setActiveModal(null);
      await loadReadiness();
    } catch (err: any) {
      setErrorMessage(err.message || "Error uploading cover banner");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Submit Delivery Radius Review
  const handleSubmitDeliveryRadius = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const res = await fetchApi("/api/seller/readiness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "delivery_radius",
          deliveryRadiusKm: deliveryRadius,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update delivery radius");
      }
      setActiveModal(null);
      await loadReadiness();
    } catch (err: any) {
      setErrorMessage(err.message || "Error saving delivery radius");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Submit Operating Hours Review
  const handleSubmitOperatingHours = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const res = await fetchApi("/api/seller/readiness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "operating_hours",
          operatingHours: operatingHours,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update operating hours");
      }
      setActiveModal(null);
      await loadReadiness();
    } catch (err: any) {
      setErrorMessage(err.message || "Error saving operating hours");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Submit UPI ID
  const handleSubmitUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUpi = upiId.trim();
    if (!cleanUpi || !cleanUpi.includes("@")) {
      setErrorMessage("Please enter a valid UPI ID with '@' (e.g. chefkitchen@okhdfcbank)");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const res = await fetchApi("/api/seller/readiness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "upi_payment",
          upiId: cleanUpi,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save UPI ID");
      }
      setActiveModal(null);
      await loadReadiness();
    } catch (err: any) {
      setErrorMessage(err.message || "Error saving UPI ID");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Submit Add Delivery Person
  const handleSubmitDeliveryPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, phone, email, password, vehicleType, vehicleNumber } = riderForm;

    if (!name.trim() || !phone.trim() || !email.trim() || !password.trim()) {
      setErrorMessage("Name, 10-digit mobile number, email, and password are required.");
      return;
    }
    const rawDigits = phone.replace(/\D/g, "");
    if (rawDigits.length !== 10) {
      setErrorMessage("Phone number must be exactly 10 digits.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const res = await fetchApi("/api/seller/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: rawDigits,
          email: email.trim().toLowerCase(),
          password: password,
          vehicleType: vehicleType || "BIKE",
          vehicleNumber: vehicleNumber.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to add delivery rider");
      }

      setRiderForm({
        name: "",
        phone: "",
        email: "",
        password: "",
        vehicleType: "BIKE",
        vehicleNumber: "",
      });
      setActiveModal(null);
      await loadReadiness();
    } catch (err: any) {
      setErrorMessage(err.message || "Error adding delivery person");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 7. Submit Add Menu Item
  const handleSubmitMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, price, categoryName, foodType, description } = menuForm;
    if (!name.trim()) {
      setErrorMessage("Item / Dish name is required.");
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setErrorMessage("Please enter a valid price in ₹ greater than 0.");
      return;
    }
    if (!description.trim()) {
      setErrorMessage("Please enter a short dish description.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("price", String(numPrice));
      fd.append("description", description.trim());
      fd.append("category", categoryName || "Main Course");
      fd.append("itemType", foodType || "VEG");
      fd.append("stockQuantity", "50");

      if (menuImageFile) {
        const compressed = await compressImage(menuImageFile, { maxDimension: 1000, quality: 0.85 });
        fd.append("image", compressed);
      }

      const res = await fetchApi("/api/seller/menu", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create menu item");
      }

      setMenuForm({
        name: "",
        price: "",
        categoryName: "Main Course",
        foodType: "VEG",
        description: "",
      });
      setMenuImageFile(null);
      setMenuImagePreview("");
      setActiveModal(null);
      await loadReadiness();
    } catch (err: any) {
      setErrorMessage(err.message || "Error creating menu item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getItemIcon = (id: ReadinessItem["id"]) => {
    switch (id) {
      case "card_photo":
        return <Camera size={20} />;
      case "cover_image":
        return <ImageIcon size={20} />;
      case "delivery_radius":
        return <MapPin size={20} />;
      case "operating_hours":
        return <Clock size={20} />;
      case "upi_payment":
        return <CreditCard size={20} />;
      case "delivery_person":
        return <Truck size={20} />;
      case "menu_items":
        return <Utensils size={20} />;
      default:
        return <CheckCircle2 size={20} />;
    }
  };

  const getActionBtnText = (item: ReadinessItem) => {
    if (item.isCompleted) {
      switch (item.id) {
        case "card_photo":
          return "Change Photo";
        case "cover_image":
          return "Change Cover";
        case "delivery_radius":
          return "Edit Radius";
        case "operating_hours":
          return "Edit Hours";
        case "upi_payment":
          return "Edit UPI";
        case "delivery_person":
          return "Add Another Rider";
        case "menu_items":
          return "Add Another Dish";
        default:
          return "Edit";
      }
    } else {
      switch (item.id) {
        case "card_photo":
          return "Upload Card Photo";
        case "cover_image":
          return "Upload Cover Banner";
        case "delivery_radius":
          return "Review Radius";
        case "operating_hours":
          return "Review Hours";
        case "upi_payment":
          return "Add UPI ID";
        case "delivery_person":
          return "Add Delivery Person";
        case "menu_items":
          return "Add Item to Menu";
        default:
          return "Complete Step";
      }
    }
  };

  return (
    <div className={styles.container}>
      {/* 1. Header Banner */}
      <div className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div className={styles.titleArea}>
            <div className={styles.badgePill}>
              <Sparkles size={14} /> Partner Onboarding Readiness
            </div>
            <h1 className={styles.title}>Complete readiness to get started</h1>
            <p className={styles.subtitle}>
              Welcome to Neo Cloud Bites! To ensure your cloud kitchen is completely prepared to receive and deliver
              customer orders smoothly, please complete the 7 setup tasks below.
            </p>
          </div>

          <div className={styles.progressCircleArea}>
            <span className={styles.progressRatio}>
              {completedCount}/{items.length}
            </span>
            <span className={styles.progressLabel}>Tasks Ready</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className={styles.progressBarTrack}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${Math.max(6, progressPercent)}%` }}
          />
        </div>
      </div>

      {/* 2. Checklist items list */}
      <div className={styles.checklistGrid}>
        {items.map((item) => {
          const isDone = item.isCompleted;

          return (
            <div
              key={item.id}
              className={`${styles.stepCard} ${isDone ? styles.stepCardCompleted : ""}`}
            >
              <div className={styles.stepLeft}>
                <div
                  className={`${styles.stepNumberCircle} ${
                    isDone ? styles.stepNumberCircleCompleted : ""
                  }`}
                >
                  {isDone ? <Check size={22} /> : item.step}
                </div>

                <div className={styles.stepInfo}>
                  <div className={styles.stepTitleRow}>
                    <h3 className={styles.stepTitle}>
                      {item.step}. {item.title}
                    </h3>
                    {isDone ? (
                      <span className={styles.statusBadgeCompleted}>
                        <Check size={12} /> Completed
                      </span>
                    ) : (
                      <span className={styles.statusBadgePending}>
                        <Clock size={12} /> Action Required
                      </span>
                    )}
                  </div>

                  <p className={styles.stepDesc}>{item.description}</p>

                  {/* Contextual preview values when completed */}
                  {isDone && item.id === "card_photo" && item.value && (
                    <img src={item.value} alt="Card Preview" className={styles.previewThumb} />
                  )}
                  {isDone && item.id === "cover_image" && item.value && (
                    <img src={item.value} alt="Cover Preview" className={styles.previewThumb} style={{ width: 72 }} />
                  )}
                  {isDone && item.id === "delivery_radius" && (
                    <span className={styles.stepPreviewValue}>
                      📍 Set to: <strong>{item.value} km radius</strong>
                    </span>
                  )}
                  {isDone && item.id === "upi_payment" && item.value && (
                    <span className={styles.stepPreviewValue}>
                      💳 UPI ID: <strong>{item.value}</strong>
                    </span>
                  )}
                  {isDone && item.id === "delivery_person" && item.count !== undefined && (
                    <span className={styles.stepPreviewValue}>
                      🛵 <strong>{item.count} delivery rider{item.count > 1 ? "s" : ""} active</strong>
                    </span>
                  )}
                  {isDone && item.id === "menu_items" && item.count !== undefined && (
                    <span className={styles.stepPreviewValue}>
                      🍲 <strong>{item.count} dish{item.count > 1 ? "es" : ""} in menu</strong>
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.stepRight}>
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(item)}
                  className={`${styles.actionBtn} ${isDone ? styles.actionBtnCompleted : ""}`}
                >
                  {isDone ? <Edit3 size={15} /> : getItemIcon(item.id)}
                  <span>{getActionBtnText(item)}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* 3. INTERACTIVE EDIT MODALS (OPENED IN EDIT MODE ON BUTTON CLICK) */}
      {/* ============================================================== */}

      {/* Modal 1: Kitchen Card Grid Photo */}
      {activeModal === "card_photo" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <div className={styles.modalIconCircle}>
                  <Camera size={20} />
                </div>
                <div>
                  <h3 className={styles.modalTitle}>Kitchen Card Grid Photo</h3>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Step 1 of 7</span>
                </div>
              </div>
              <button type="button" onClick={() => setActiveModal(null)} className={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitCardPhoto}>
              <div
                className={styles.dropzone}
                onClick={() => cardInputRef.current?.click()}
              >
                <UploadCloud size={36} className={styles.dropzoneIcon} />
                <h4 className={styles.dropzoneTitle}>Click to choose or drop kitchen photo</h4>
                <p className={styles.dropzoneHint}>Recommended: 4:3 ratio, clean food preparation photo (PNG, JPG, WebP up to 10MB)</p>
                <input
                  ref={cardInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setCardFile(f);
                      setCardPreview(URL.createObjectURL(f));
                    }
                  }}
                />
              </div>

              {cardPreview && (
                <div className={styles.previewContainer}>
                  <img src={cardPreview} alt="Kitchen Card Preview" className={styles.previewImg} />
                  <button
                    type="button"
                    onClick={() => {
                      setCardFile(null);
                      setCardPreview("");
                    }}
                    className={styles.previewRemoveBtn}
                  >
                    Remove
                  </button>
                </div>
              )}

              {errorMessage && (
                <div style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: "12px", fontWeight: "600" }}>
                  {errorMessage}
                </div>
              )}

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setActiveModal(null)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className={styles.saveBtn}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>Save & Upload Photo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Storefront Cover Image */}
      {activeModal === "cover_image" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <div className={styles.modalIconCircle}>
                  <ImageIcon size={20} />
                </div>
                <div>
                  <h3 className={styles.modalTitle}>Storefront Cover Image</h3>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Step 2 of 7</span>
                </div>
              </div>
              <button type="button" onClick={() => setActiveModal(null)} className={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitCoverImage}>
              <div
                className={styles.dropzone}
                onClick={() => bannerInputRef.current?.click()}
              >
                <UploadCloud size={36} className={styles.dropzoneIcon} />
                <h4 className={styles.dropzoneTitle}>Click to choose or drop storefront banner</h4>
                <p className={styles.dropzoneHint}>Recommended: 16:9 wide banner, high resolution hero cover image</p>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setBannerFile(f);
                      setBannerPreview(URL.createObjectURL(f));
                    }
                  }}
                />
              </div>

              {bannerPreview && (
                <div className={styles.previewContainer}>
                  <img src={bannerPreview} alt="Cover Banner Preview" className={styles.previewImg} />
                  <button
                    type="button"
                    onClick={() => {
                      setBannerFile(null);
                      setBannerPreview("");
                    }}
                    className={styles.previewRemoveBtn}
                  >
                    Remove
                  </button>
                </div>
              )}

              {errorMessage && (
                <div style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: "12px", fontWeight: "600" }}>
                  {errorMessage}
                </div>
              )}

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setActiveModal(null)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className={styles.saveBtn}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>Save & Upload Cover</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Review Delivery Radius */}
      {activeModal === "delivery_radius" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <div className={styles.modalIconCircle}>
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className={styles.modalTitle}>Review Delivery Radius</h3>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Step 3 of 7</span>
                </div>
              </div>
              <button type="button" onClick={() => setActiveModal(null)} className={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitDeliveryRadius}>
              <div className={styles.radiusDisplayCard}>
                <div className={styles.radiusValueBig}>{deliveryRadius} km</div>
                <p className={styles.radiusHint}>
                  Customers within <strong>{deliveryRadius} km</strong> from your outlet coordinates can view your kitchen and place orders.
                </p>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="0.5"
                  value={deliveryRadius}
                  onChange={(e) => setDeliveryRadius(parseFloat(e.target.value))}
                  className={styles.radiusSlider}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#64748b", marginTop: "4px" }}>
                  <span>1 km (Hyperlocal)</span>
                  <span>5 km (Standard)</span>
                  <span>15 km (Maximum)</span>
                </div>
              </div>

              {errorMessage && (
                <div style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: "12px", fontWeight: "600" }}>
                  {errorMessage}
                </div>
              )}

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setActiveModal(null)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className={styles.saveBtn}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>Confirm Delivery Radius</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Review Operating Hours */}
      {activeModal === "operating_hours" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalCard} style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <div className={styles.modalIconCircle}>
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className={styles.modalTitle}>Review Operating Hours</h3>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Step 4 of 7</span>
                </div>
              </div>
              <button type="button" onClick={() => setActiveModal(null)} className={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitOperatingHours}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Set open & close hours per day</span>
                <button
                  type="button"
                  onClick={() => {
                    setOperatingHours(
                      DAYS_OF_WEEK.map((day) => ({
                        day,
                        openTime: "09:00",
                        closeTime: "23:00",
                        isOpen: true,
                      }))
                    );
                  }}
                  style={{
                    background: "none",
                    border: "1px solid #fed7aa",
                    color: "#ea580c",
                    padding: "3px 10px",
                    borderRadius: "6px",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Apply 09:00 AM – 11:00 PM to all
                </button>
              </div>

              <div className={styles.hoursDayList}>
                {operatingHours.map((row, idx) => (
                  <div key={row.day} className={styles.hoursDayRow}>
                    <span className={styles.dayName}>{row.day}</span>
                    <div className={styles.dayTimeInputs}>
                      <input
                        type="time"
                        value={row.openTime}
                        disabled={!row.isOpen}
                        onChange={(e) => {
                          const updated = [...operatingHours];
                          updated[idx].openTime = e.target.value;
                          setOperatingHours(updated);
                        }}
                        className={styles.timeInput}
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={row.closeTime}
                        disabled={!row.isOpen}
                        onChange={(e) => {
                          const updated = [...operatingHours];
                          updated[idx].closeTime = e.target.value;
                          setOperatingHours(updated);
                        }}
                        className={styles.timeInput}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...operatingHours];
                        updated[idx].isOpen = !updated[idx].isOpen;
                        setOperatingHours(updated);
                      }}
                      className={`${styles.dayToggleBtn} ${
                        row.isOpen ? styles.dayToggleOpen : styles.dayToggleClosed
                      }`}
                    >
                      {row.isOpen ? "Open" : "Closed"}
                    </button>
                  </div>
                ))}
              </div>

              {errorMessage && (
                <div style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: "12px", fontWeight: "600" }}>
                  {errorMessage}
                </div>
              )}

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setActiveModal(null)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className={styles.saveBtn}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>Confirm Operating Hours</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Add UPI ID */}
      {activeModal === "upi_payment" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <div className={styles.modalIconCircle}>
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className={styles.modalTitle}>Add UPI ID to Get Payments</h3>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Step 5 of 7</span>
                </div>
              </div>
              <button type="button" onClick={() => setActiveModal(null)} className={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitUpi}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Your Business UPI ID</label>
                <input
                  type="text"
                  placeholder="e.g. cloudbites@okhdfcbank or 9876543210@paytm"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className={styles.formInput}
                  required
                />
                <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  This UPI ID will receive customer counter payments, QR scan payments, and settlement transfers.
                </span>
              </div>

              {upiId && upiId.includes("@") && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    padding: "16px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    marginBottom: "16px",
                  }}
                >
                  <QRCodeCanvas
                    value={`upi://pay?pa=${encodeURIComponent(upiId)}&pn=CloudKitchen&cu=INR`}
                    size={120}
                  />
                  <span style={{ fontSize: "0.8rem", color: "#16a34a", fontWeight: 700 }}>
                    ✓ Valid UPI QR Format
                  </span>
                </div>
              )}

              {errorMessage && (
                <div style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: "12px", fontWeight: "600" }}>
                  {errorMessage}
                </div>
              )}

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setActiveModal(null)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className={styles.saveBtn}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>Save UPI ID</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 6: Add Delivery Person */}
      {activeModal === "delivery_person" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <div className={styles.modalIconCircle}>
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className={styles.modalTitle}>Add Delivery Person</h3>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Step 6 of 7</span>
                </div>
              </div>
              <button type="button" onClick={() => setActiveModal(null)} className={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitDeliveryPerson}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Rider Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={riderForm.name}
                  onChange={(e) => setRiderForm({ ...riderForm, name: e.target.value })}
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Phone Number (10 Digits) *</label>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                    value={riderForm.phone}
                    onChange={(e) => setRiderForm({ ...riderForm, phone: e.target.value })}
                    className={styles.formInput}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email Address *</label>
                  <input
                    type="email"
                    placeholder="e.g. rider@cloudkitchen.com"
                    value={riderForm.email}
                    onChange={(e) => setRiderForm({ ...riderForm, email: e.target.value })}
                    className={styles.formInput}
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Login Password *</label>
                  <input
                    type="password"
                    placeholder="Password for rider app"
                    value={riderForm.password}
                    onChange={(e) => setRiderForm({ ...riderForm, password: e.target.value })}
                    className={styles.formInput}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Vehicle Type</label>
                  <select
                    value={riderForm.vehicleType}
                    onChange={(e) => setRiderForm({ ...riderForm, vehicleType: e.target.value })}
                    className={styles.formInput}
                  >
                    <option value="BIKE">Motorcycle / Bike</option>
                    <option value="SCOOTER">Scooter / Scooty</option>
                    <option value="ELECTRIC">Electric Bike / EV</option>
                    <option value="BICYCLE">Bicycle</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Vehicle Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. MH 12 AB 1234"
                  value={riderForm.vehicleNumber}
                  onChange={(e) => setRiderForm({ ...riderForm, vehicleNumber: e.target.value })}
                  className={styles.formInput}
                />
              </div>

              {errorMessage && (
                <div style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: "12px", fontWeight: "600" }}>
                  {errorMessage}
                </div>
              )}

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setActiveModal(null)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className={styles.saveBtn}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>Add Delivery Person</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 7: Add Items in Menu */}
      {activeModal === "menu_items" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <div className={styles.modalIconCircle}>
                  <Utensils size={20} />
                </div>
                <div>
                  <h3 className={styles.modalTitle}>Add Item to Menu</h3>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Step 7 of 7</span>
                </div>
              </div>
              <button type="button" onClick={() => setActiveModal(null)} className={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitMenuItem}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Dish / Item Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Butter Chicken or Paneer Butter Masala"
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Price (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 249"
                    value={menuForm.price}
                    onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
                    className={styles.formInput}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Food Type *</label>
                  <select
                    value={menuForm.foodType}
                    onChange={(e) => setMenuForm({ ...menuForm, foodType: e.target.value })}
                    className={styles.formInput}
                  >
                    <option value="VEG">Veg (Green Dot 🥦)</option>
                    <option value="NON_VEG">Non-Veg (Red Dot 🍗)</option>
                    <option value="JAIN">Jain Food</option>
                    <option value="VEGAN">Vegan</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Category</label>
                <select
                  value={menuForm.categoryName}
                  onChange={(e) => setMenuForm({ ...menuForm, categoryName: e.target.value })}
                  className={styles.formInput}
                >
                  <option value="Main Course">Main Course</option>
                  <option value="Starters">Starters & Appetizers</option>
                  <option value="Thali">Thali & Combos</option>
                  <option value="Biryani">Biryani & Rice</option>
                  <option value="Breads">Roti & Breads</option>
                  <option value="Desserts">Desserts & Sweets</option>
                  <option value="Beverages">Beverages & Shakes</option>
                  <option value="Snacks">Snacks & Fast Food</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description *</label>
                <textarea
                  placeholder="Describe your dish, key ingredients, preparation style, and spice level..."
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                  className={styles.formTextarea}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Dish Photo (Recommended)</label>
                <div
                  className={styles.dropzone}
                  style={{ padding: "16px" }}
                  onClick={() => menuInputRef.current?.click()}
                >
                  <UploadCloud size={28} className={styles.dropzoneIcon} />
                  <p className={styles.dropzoneHint}>Click to select mouth-watering dish photo</p>
                  <input
                    ref={menuInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setMenuImageFile(f);
                        setMenuImagePreview(URL.createObjectURL(f));
                      }
                    }}
                  />
                </div>
                {menuImagePreview && (
                  <div className={styles.previewContainer} style={{ marginTop: 8 }}>
                    <img src={menuImagePreview} alt="Dish Preview" className={styles.previewImg} style={{ maxHeight: 140 }} />
                    <button
                      type="button"
                      onClick={() => {
                        setMenuImageFile(null);
                        setMenuImagePreview("");
                      }}
                      className={styles.previewRemoveBtn}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {errorMessage && (
                <div style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: "12px", fontWeight: "600" }}>
                  {errorMessage}
                </div>
              )}

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setActiveModal(null)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className={styles.saveBtn}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>Save & Add to Menu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. CELEBRATION / READINESS COMPLETED MODAL */}
      {/* ============================================================== */}
      {showCelebration && (
        <div className={styles.modalOverlay}>
          <div className={styles.celebrateCard}>
            <div className={styles.celebrateIconCircle}>
              <CheckCircle2 size={42} />
            </div>
            <h2 className={styles.celebrateTitle}>Readiness Completed! 🎉</h2>
            <p className={styles.celebrateDesc}>
              Congratulations! All 7 readiness tasks are successfully completed. Your cloud kitchen storefront,
              delivery radius, operating hours, payment UPI, delivery team, and menu dishes are fully operational.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowCelebration(false);
                if (onCompleted) {
                  onCompleted();
                } else {
                  router.push("/seller/dashboard");
                }
              }}
              className={styles.celebrateBtn}
            >
              Continue to Seller Dashboard →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
