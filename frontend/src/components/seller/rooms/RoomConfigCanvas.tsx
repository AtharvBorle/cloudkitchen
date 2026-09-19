"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Plus,
  Wifi,
  Tv,
  Fan,
  Laptop,
  Bell,
  Trash2,
  Sparkles,
  X,
  FileText,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";

export interface AmenityItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  selected: boolean;
}

export interface RoomConfigData {
  roomName: string;
  capacity: string;
  pricePerNight: string;
  floorNo: string;
  about: string;
  mediaPhotos: string[];
  amenities: AmenityItem[];
  houseRules: string[];
  isInstantlyBookable: boolean;
}

export interface RoomConfigCanvasProps {
  initialData?: Partial<RoomConfigData>;
  onSave?: (data: RoomConfigData) => void;
  onCancel?: () => void;
}

const DEFAULT_AMENITIES: AmenityItem[] = [
  { id: "wifi", name: "High-Speed WiFi", icon: Wifi, selected: true },
  { id: "tv", name: "Smart TV", icon: Tv, selected: true },
  { id: "ac", name: "Air Conditioning", icon: Fan, selected: true },
  { id: "desk", name: "Work Desk", icon: Laptop, selected: true },
  { id: "roomservice", name: "Room Service", icon: Bell, selected: false },
];

const DEFAULT_PHOTOS = [
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80",
];

const DEFAULT_ROOM_DATA: RoomConfigData = {
  roomName: "",
  capacity: "",
  pricePerNight: "",
  floorNo: "",
  about: "",
  mediaPhotos: [],
  amenities: DEFAULT_AMENITIES.map((a) => ({ ...a, selected: false })),
  houseRules: [],
  isInstantlyBookable: true,
};

export default function RoomConfigCanvas({
  initialData,
  onSave,
  onCancel,
}: RoomConfigCanvasProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams ? searchParams.get("id") : null;
  const isEditMode = Boolean(roomId);

  const [formData, setFormData] = useState<RoomConfigData>({
    ...DEFAULT_ROOM_DATA,
    ...initialData,
  });
  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const [isCapacityDropdownOpen, setIsCapacityDropdownOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [customAmenityName, setCustomAmenityName] = useState("");
  const [customRuleText, setCustomRuleText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const capacityOptions = ["1 Guest", "2 Guests", "3 Guests", "4 Guests", "5+ Guests"];

  useEffect(() => {
    if (!roomId) return;
    async function loadRoom() {
      try {
        const res = await fetchApi(`/api/seller/rooms/${roomId}`);
        if (res.ok) {
          const data = await res.json();
          const room = data.data?.room || data.room;
          if (room) {
            let photos: string[] = [];
            try {
              const parsed = typeof room.images === "string" ? JSON.parse(room.images) : room.images;
              if (Array.isArray(parsed)) photos = parsed;
              else if (typeof parsed === "string") photos = [parsed];
            } catch (e) {
              if (room.images) photos = [room.images];
            }

            // Extract amenities
            let loadedAmenitiesList: string[] = [];
            if (Array.isArray(room.amenities)) {
              loadedAmenitiesList = room.amenities.map(String);
            } else if (typeof room.amenities === "string" && room.amenities.trim()) {
              try {
                const parsed = JSON.parse(room.amenities);
                if (Array.isArray(parsed)) loadedAmenitiesList = parsed.map(String);
                else loadedAmenitiesList = room.amenities.split(",").map((s: string) => s.trim());
              } catch {
                loadedAmenitiesList = room.amenities.split(",").map((s: string) => s.trim());
              }
            } else if (room.description) {
              const match = room.description.match(/Amenities:\s*([^\n]+)/i);
              if (match) {
                loadedAmenitiesList = match[1].split(",").map((s: string) => s.trim());
              }
            }

            // Map into AmenityItem[]
            const mappedAmenities: AmenityItem[] = DEFAULT_AMENITIES.map((a) => {
              const isSelected = loadedAmenitiesList.some(
                (la) => la.toLowerCase() === a.name.toLowerCase() || la.toLowerCase() === a.id.toLowerCase()
              );
              return { ...a, selected: isSelected };
            });

            // Add custom loaded amenities not present in DEFAULT_AMENITIES
            loadedAmenitiesList.forEach((la, idx) => {
              const exists = mappedAmenities.some(
                (ma) => ma.name.toLowerCase() === la.toLowerCase() || ma.id.toLowerCase() === la.toLowerCase()
              );
              if (!exists && la.trim()) {
                mappedAmenities.push({
                  id: `custom-${idx}-${Date.now()}`,
                  name: la.trim(),
                  icon: Sparkles,
                  selected: true,
                });
              }
            });

            // Extract house rules
            let loadedHouseRules: string[] = [];
            if (Array.isArray(room.houseRules)) {
              loadedHouseRules = room.houseRules.map(String).filter(Boolean);
            } else if (typeof room.houseRules === "string" && room.houseRules.trim()) {
              try {
                const parsed = JSON.parse(room.houseRules);
                if (Array.isArray(parsed)) loadedHouseRules = parsed.map(String).filter(Boolean);
                else loadedHouseRules = room.houseRules.split("\n").map((s: string) => s.trim()).filter(Boolean);
              } catch {
                loadedHouseRules = room.houseRules.split("\n").map((s: string) => s.trim()).filter(Boolean);
              }
            }

            // Extract floor
            let loadedFloor = "";
            if (typeof room.floor === "string" && room.floor.trim()) {
              loadedFloor = room.floor.trim();
            } else if (typeof room.floorNo === "string" && room.floorNo.trim()) {
              loadedFloor = room.floorNo.trim();
            }

            // Extract clean about
            let loadedAbout = "";
            if (typeof room.about === "string" && room.about.trim()) {
              loadedAbout = room.about.trim();
            } else if (typeof room.description === "string" && room.description.trim() && !room.description.startsWith("{")) {
              loadedAbout = room.description.replace(/Amenities:[^\n]+/i, "").replace(/House Rules:[^\n]+/i, "").replace(/Floor(?:\s*No)?:[^\n]+/i, "").trim();
            }
            if (loadedAbout.startsWith("{")) {
              try {
                const parsed = JSON.parse(loadedAbout);
                loadedAbout = typeof parsed.about === "string" ? parsed.about : "";
              } catch {
                loadedAbout = "";
              }
            }

            setFormData({
              roomName: room.title || "",
              capacity: `${room.capacity || 2} Guest${(room.capacity || 2) > 1 ? "s" : ""}`,
              pricePerNight: String(room.price || ""),
              floorNo: loadedFloor,
              about: loadedAbout,
              mediaPhotos: photos,
              amenities: mappedAmenities,
              houseRules: loadedHouseRules,
              isInstantlyBookable: room.isAvailable ?? true,
            });
          }
        }
      } catch (err) {
        console.error("Failed to load room details:", err);
      }
    }
    loadRoom();
  }, [roomId]);

  const handleTextChange = (field: keyof RoomConfigData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleAmenity = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.map((a) =>
        a.id === id ? { ...a, selected: !a.selected } : a
      ),
    }));
  };

  const handleDeleteAmenity = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((a) => a.id !== id),
    }));
  };

  const handleAddCustomAmenity = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customAmenityName.trim();
    if (!trimmed) return;

    // Check if already exists
    const exists = formData.amenities.some(
      (a) => a.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      // Toggle select it
      setFormData((prev) => ({
        ...prev,
        amenities: prev.amenities.map((a) =>
          a.name.toLowerCase() === trimmed.toLowerCase() ? { ...a, selected: true } : a
        ),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        amenities: [
          ...prev.amenities,
          {
            id: `custom-${Date.now()}`,
            name: trimmed,
            icon: Sparkles,
            selected: true,
          },
        ],
      }));
    }
    setCustomAmenityName("");
  };

  const handleAddHouseRule = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customRuleText.trim();
    if (!trimmed) return;
    if (formData.houseRules.includes(trimmed)) {
      setCustomRuleText("");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      houseRules: [...prev.houseRules, trimmed],
    }));
    setCustomRuleText("");
  };

  const handleDeleteHouseRule = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      houseRules: prev.houseRules.filter((_, idx) => idx !== index),
    }));
  };

  const handleToggleBookable = () => {
    setFormData((prev) => ({
      ...prev,
      isInstantlyBookable: !prev.isInstantlyBookable,
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPhotoUrls: string[] = [];
    const addedFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        alert(`Photo "${file.name}" (${sizeMB} MB) exceeds the 5MB upload limit. Please select images under 5MB.`);
        e.target.value = "";
        return;
      }
      newPhotoUrls.push(URL.createObjectURL(file));
      addedFiles.push(file);
    }

    setRawFiles((prev) => [...prev, ...addedFiles]);
    setFormData((prev) => ({
      ...prev,
      mediaPhotos: [...prev.mediaPhotos, ...newPhotoUrls],
    }));

    setToastMessage("Photos uploaded successfully");
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleDeletePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      mediaPhotos: prev.mediaPhotos.filter((_, i) => i !== index),
    }));
    setRawFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (onSave) {
      onSave(formData);
      setToastMessage("Room configuration saved successfully!");
      setTimeout(() => {
        setToastMessage(null);
      }, 1200);
      return;
    }

    if (!formData.roomName.trim()) {
      alert("Please enter a room name or identifier.");
      return;
    }

    if (!formData.pricePerNight.trim()) {
      alert("Please enter the price per night.");
      return;
    }

    setSaving(true);
    try {
      const parsedPrice = formData.pricePerNight.replace(/[^\d.]/g, "") || "2500";
      const guestsMatch = formData.capacity.match(/\d+/);
      const capacityNum = guestsMatch ? guestsMatch[0] : "2";

      const selectedAmenities = formData.amenities
        .filter((a) => a.selected)
        .map((a) => a.name);

      const bodyFormData = new FormData();
      if (roomId) {
        bodyFormData.append("roomId", roomId);
      }
      bodyFormData.append("title", formData.roomName.trim());
      bodyFormData.append("price", parsedPrice);
      bodyFormData.append("capacity", capacityNum);
      bodyFormData.append("isAvailable", String(formData.isInstantlyBookable));
      bodyFormData.append("about", formData.about || "");
      bodyFormData.append("floor", formData.floorNo || "");
      bodyFormData.append("amenities", JSON.stringify(selectedAmenities));
      bodyFormData.append("houseRules", JSON.stringify(formData.houseRules));
      bodyFormData.append("description", formData.about || "");

      if (rawFiles.length > 0) {
        bodyFormData.append("image", rawFiles[0]);
      } else if (formData.mediaPhotos.length > 0) {
        bodyFormData.append("imageUrl", formData.mediaPhotos[0]);
      }

      const endpoint = roomId ? `/api/seller/rooms/${roomId}` : "/api/seller/rooms";
      const method = roomId ? "PATCH" : "POST";

      const res = await fetchApi(endpoint, {
        method,
        body: bodyFormData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Failed to save room configuration");
        setSaving(false);
        return;
      }

      setToastMessage(isEditMode ? "Room updated successfully!" : "Room configuration saved successfully!");
      setTimeout(() => {
        setToastMessage(null);
        router.push("/seller/rooms");
      }, 1000);
    } catch (err: any) {
      console.error("Error saving room:", err);
      alert(err.message || "Error saving room");
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push("/seller/rooms");
    }
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "1200px",
        minHeight: "960px",
        backgroundColor: "#F7F8FB",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        padding: "32px",
        boxSizing: "border-box",
        fontFamily:
          "var(--font-poppins), 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        margin: "0 auto",
      }}
      className="room-config-canvas"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "32px",
            right: "32px",
            backgroundColor: "#0F172A",
            color: "#FFFFFF",
            padding: "12px 24px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* constrained-content (width: 1120, height: 725, gap: 24px) */}
      <div
        style={{
          width: "100%",
          maxWidth: "1120px",
          minHeight: "725px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          boxSizing: "border-box",
          margin: "0 auto",
        }}
        className="constrained-content"
      >
        {/* frame1 Header (width: 1120, height: 50, justify-content: space-between) */}
        <div
          style={{
            width: "100%",
            maxWidth: "1120px",
            minHeight: "50px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
          className="frame1-header"
        >
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "#0F172A",
              letterSpacing: "-0.4px",
              margin: 0,
              lineHeight: 1.25,
            }}
          >
            Room Configurator
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "#64748B",
              fontWeight: 400,
              margin: 0,
            }}
          >
            Configure parameters, pricing models, and media elements for specific hotel rooms.
          </p>
        </div>

        {/* form-card (width: 1120, height: 651, gap: 24px, padding: 32px, radius: 12px, border: 1px solid #E2E8F0, bg: #FFFFFF) */}
        <div
          style={{
            width: "100%",
            maxWidth: "1120px",
            minHeight: "651px",
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            boxShadow: "0px 4px 12px 0px rgba(0, 0, 0, 0.02)",
            padding: "32px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            boxSizing: "border-box",
          }}
          className="form-card"
        >
          {/* Card Section Title */}
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#0F172A",
              margin: 0,
            }}
          >
            Room Details
          </h2>

          {/* Field 1: Room Name / Identifier */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              style={{
                fontSize: "12.5px",
                fontWeight: 600,
                color: "#0F172A",
              }}
            >
              Room Name / Identifier
            </label>
            <input
              type="text"
              value={formData.roomName}
              onChange={(e) => handleTextChange("roomName", e.target.value)}
              placeholder="e.g. Deluxe Executive Suite 101"
              style={{
                width: "100%",
                borderRadius: "8px",
                border: "1px solid #E2E8F0",
                padding: "10px 14px",
                fontSize: "13.5px",
                color: "#0F172A",
                backgroundColor: "#FFFFFF",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Field 2, 3 & 4: Capacity, Floor No & Price / Night (₹) Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "20px",
              width: "100%",
            }}
          >
            {/* Capacity Dropdown */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                position: "relative",
              }}
            >
              <label
                style={{
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: "#0F172A",
                }}
              >
                Capacity
              </label>
              <div
                onClick={() => setIsCapacityDropdownOpen((prev) => !prev)}
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  border: "1px solid #E2E8F0",
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "#FFFFFF",
                  fontSize: "13.5px",
                  color: formData.capacity ? "#0F172A" : "#94A3B8",
                  cursor: "pointer",
                  boxSizing: "border-box",
                }}
              >
                <span>{formData.capacity || "Select capacity"}</span>
                <ChevronDown
                  size={16}
                  color="#64748B"
                  style={{
                    transform: isCapacityDropdownOpen ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s ease",
                  }}
                />
              </div>

              {/* Dropdown Options */}
              {isCapacityDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: "4px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    boxShadow: "0 10px 20px rgba(0, 0, 0, 0.08)",
                    zIndex: 20,
                    overflow: "hidden",
                  }}
                >
                  {capacityOptions.map((opt) => (
                    <div
                      key={opt}
                      onClick={() => {
                        handleTextChange("capacity", opt);
                        setIsCapacityDropdownOpen(false);
                      }}
                      style={{
                        padding: "10px 14px",
                        fontSize: "13px",
                        color: formData.capacity === opt ? "#FF5500" : "#334155",
                        fontWeight: formData.capacity === opt ? 600 : 400,
                        backgroundColor:
                          formData.capacity === opt ? "#FFF1E8" : "transparent",
                        cursor: "pointer",
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Floor No / Level */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label
                style={{
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: "#0F172A",
                }}
              >
                Floor No / Level
              </label>
              <input
                type="text"
                value={formData.floorNo}
                onChange={(e) => handleTextChange("floorNo", e.target.value)}
                placeholder="e.g. 2nd Floor, Ground"
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  border: "1px solid #E2E8F0",
                  padding: "10px 14px",
                  fontSize: "13.5px",
                  color: "#0F172A",
                  backgroundColor: "#FFFFFF",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Price / Night (₹) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label
                style={{
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: "#0F172A",
                }}
              >
                Price / Night (₹)
              </label>
              <input
                type="text"
                value={formData.pricePerNight}
                onChange={(e) => handleTextChange("pricePerNight", e.target.value)}
                placeholder="e.g. 2,800"
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  border: "1px solid #E2E8F0",
                  padding: "10px 14px",
                  fontSize: "13.5px",
                  color: "#0F172A",
                  backgroundColor: "#FFFFFF",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>

          {/* Field 4: Media / Photos */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label
              style={{
                fontSize: "12.5px",
                fontWeight: 600,
                color: "#0F172A",
              }}
            >
              Media / Photos
            </label>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              {/* Photo Thumbnails */}
              {formData.mediaPhotos.map((photoUrl, idx) => (
                <div
                  key={idx}
                  style={{
                    position: "relative",
                    width: "68px",
                    height: "68px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                    flexShrink: 0,
                  }}
                  className="photo-thumb"
                >
                  <Image
                    src={photoUrl}
                    alt={`Room photo ${idx + 1}`}
                    fill
                    sizes="68px"
                    style={{
                      objectFit: "cover",
                    }}
                    unoptimized
                  />
                  {/* Delete button overlay */}
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(idx)}
                    style={{
                      position: "absolute",
                      top: "3px",
                      right: "3px",
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(0, 0, 0, 0.6)",
                      color: "#FFFFFF",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      padding: 0,
                    }}
                    title="Remove photo"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: "68px",
                  height: "68px",
                  borderRadius: "8px",
                  border: "1.5px dashed #CBD5E1",
                  backgroundColor: "#FAFAFA",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  color: "#475569",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#FF5500";
                  e.currentTarget.style.backgroundColor = "#FFF1E8";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#CBD5E1";
                  e.currentTarget.style.backgroundColor = "#FAFAFA";
                }}
              >
                <Plus size={16} strokeWidth={2.5} color="#475569" />
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#475569",
                  }}
                >
                  Upload
                </span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept="image/*"
                  style={{ display: "none" }}
                />
              </div>
            </div>
          </div>

          {/* Field: About Property / Description */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              style={{
                fontSize: "12.5px",
                fontWeight: 600,
                color: "#0F172A",
              }}
            >
              About This Property / Description
            </label>
            <textarea
              value={formData.about}
              onChange={(e) => handleTextChange("about", e.target.value)}
              placeholder="Describe the room, building features, neighborhood highlights, and overall vibe..."
              rows={3}
              style={{
                width: "100%",
                borderRadius: "8px",
                border: "1px solid #E2E8F0",
                padding: "10px 14px",
                fontSize: "13.5px",
                color: "#0F172A",
                backgroundColor: "#FFFFFF",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </div>

          {/* Field 5: Amenities Selection */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label
                style={{
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: "#0F172A",
                }}
              >
                Amenities Selection
              </label>
              <span style={{ fontSize: "11.5px", color: "#64748B" }}>
                Click to toggle, or remove / add custom amenities
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              {formData.amenities.map((amenity) => {
                const Icon = amenity.icon;
                const isSelected = amenity.selected;

                return (
                  <div
                    key={amenity.id}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      borderRadius: "6px",
                      border: isSelected ? "1.5px solid #FF5500" : "1px solid #E2E8F0",
                      backgroundColor: isSelected ? "#FFF1E8" : "#F8FAFC",
                      overflow: "hidden",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleAmenity(amenity.id)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "7px 12px",
                        border: "none",
                        backgroundColor: "transparent",
                        color: isSelected ? "#FF5500" : "#475569",
                        fontSize: "12.5px",
                        fontWeight: isSelected ? 600 : 500,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      <Icon size={15} color={isSelected ? "#FF5500" : "#64748B"} />
                      <span>{amenity.name}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAmenity(amenity.id);
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "7px 8px 7px 2px",
                        border: "none",
                        backgroundColor: "transparent",
                        color: isSelected ? "#FF5500" : "#94A3B8",
                        cursor: "pointer",
                      }}
                      title={`Delete "${amenity.name}"`}
                    >
                      <X size={13} strokeWidth={2.4} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Add Custom Amenity Input */}
            <div style={{ display: "flex", gap: "8px", marginTop: "4px", maxWidth: "420px" }}>
              <input
                type="text"
                value={customAmenityName}
                onChange={(e) => setCustomAmenityName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomAmenity();
                  }
                }}
                placeholder="Enter custom amenity (e.g. Balcony, Geyser)"
                style={{
                  flex: 1,
                  borderRadius: "6px",
                  border: "1px solid #E2E8F0",
                  padding: "7px 12px",
                  fontSize: "12.5px",
                  color: "#0F172A",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={handleAddCustomAmenity}
                style={{
                  backgroundColor: "#FF5500",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  padding: "7px 14px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                + Add Amenity
              </button>
            </div>
          </div>

          {/* Field: House Rules */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label
                style={{
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: "#0F172A",
                }}
              >
                House Rules
              </label>
              <span style={{ fontSize: "11.5px", color: "#64748B" }}>
                Add custom rules for residents
              </span>
            </div>

            {formData.houseRules.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {formData.houseRules.map((rule, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      backgroundColor: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: "6px",
                      fontSize: "13px",
                      color: "#334155",
                    }}
                  >
                    <span>• {rule}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteHouseRule(idx)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#EF4444",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        padding: "2px",
                      }}
                      title="Remove rule"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: "8px", maxWidth: "560px" }}>
              <input
                type="text"
                value={customRuleText}
                onChange={(e) => setCustomRuleText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddHouseRule();
                  }
                }}
                placeholder="e.g. No smoking inside room, Quiet hours after 10 PM"
                style={{
                  flex: 1,
                  borderRadius: "6px",
                  border: "1px solid #E2E8F0",
                  padding: "7px 12px",
                  fontSize: "12.5px",
                  color: "#0F172A",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={handleAddHouseRule}
                style={{
                  backgroundColor: "#0F172A",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  padding: "7px 14px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                + Add Rule
              </button>
            </div>
          </div>

          {/* Field 6: Instantly Bookable Toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: "6px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#0F172A",
                }}
              >
                Instantly Bookable
              </span>
              <span
                style={{
                  fontSize: "12px",
                  color: "#64748B",
                  fontWeight: 400,
                }}
              >
                Allow users to instantly reserve this room without manual host approval.
              </span>
            </div>

            {/* Toggle Switch */}
            <div
              onClick={handleToggleBookable}
              style={{
                width: "42px",
                height: "24px",
                borderRadius: "12px",
                backgroundColor: formData.isInstantlyBookable ? "#FF5500" : "#CBD5E1",
                display: "flex",
                alignItems: "center",
                padding: "2px",
                cursor: "pointer",
                boxSizing: "border-box",
                transition: "background-color 0.2s ease",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  backgroundColor: "#FFFFFF",
                  transform: formData.isInstantlyBookable
                    ? "translateX(18px)"
                    : "translateX(0px)",
                  transition: "transform 0.2s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                }}
              />
            </div>
          </div>

          {/* Divider & Action Buttons */}
          <div
            style={{
              borderTop: "1px solid #F1F5F9",
              paddingTop: "24px",
              marginTop: "8px",
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "12px",
            }}
          >
            {/* Cancel Button */}
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              style={{
                backgroundColor: "#FFFFFF",
                color: "#475569",
                borderRadius: "6px",
                border: "1px solid #E2E8F0",
                fontSize: "13px",
                fontWeight: 600,
                padding: "9px 22px",
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.6 : 1,
                fontFamily: "inherit",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!saving) e.currentTarget.style.backgroundColor = "#F8FAFC";
              }}
              onMouseLeave={(e) => {
                if (!saving) e.currentTarget.style.backgroundColor = "#FFFFFF";
              }}
            >
              Cancel
            </button>

            {/* Save Room Details Button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                backgroundColor: "#FF5500",
                color: "#FFFFFF",
                borderRadius: "6px",
                border: "none",
                fontSize: "13px",
                fontWeight: 700,
                padding: "9px 22px",
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.8 : 1,
                fontFamily: "inherit",
                boxShadow: "0 2px 4px rgba(255, 85, 0, 0.15)",
                transition: "opacity 0.15s ease",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                if (!saving) e.currentTarget.style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                if (!saving) e.currentTarget.style.opacity = "1";
              }}
            >
              {saving && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
              <span>{saving ? (isEditMode ? "Updating..." : "Saving...") : (isEditMode ? "Update Room Details" : "Save Room Details")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
