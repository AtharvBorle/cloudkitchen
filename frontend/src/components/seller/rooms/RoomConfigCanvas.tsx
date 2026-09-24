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
  MapPin,
  Navigation,
  Search,
  Building,
  CheckCircle2,
  Map,
} from "lucide-react";
import { fetchApi } from "@/lib/fetch-api";
import { HouseMapPicker } from "@/components/house-map-picker";
import {
  extractRoomPropertyLocation,
  cleanRoomAboutText,
  formatRoomLocationComment,
} from "@/lib/room-location-helper";
import { getPincodeCoordinates } from "@/lib/geo-distance";

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
  // Property Location details
  useSellerDefaultLocation: boolean;
  houseNumber: string;
  street: string;
  locality: string;
  landmark: string;
  city: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
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
  useSellerDefaultLocation: false,
  houseNumber: "",
  street: "",
  locality: "",
  landmark: "",
  city: "Pune",
  pincode: "",
  latitude: 18.5204,
  longitude: 73.8567,
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

  interface PhotoItem {
    id: string;
    url: string;
    file?: File;
    isExisting: boolean;
  }

  const [photoItems, setPhotoItems] = useState<PhotoItem[]>(() => {
    if (initialData?.mediaPhotos && initialData.mediaPhotos.length > 0) {
      return initialData.mediaPhotos.map((url, idx) => ({
        id: `init-${idx}-${Date.now()}`,
        url,
        isExisting: true,
      }));
    }
    return [];
  });

  const [saving, setSaving] = useState(false);
  const [isCapacityDropdownOpen, setIsCapacityDropdownOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [customAmenityName, setCustomAmenityName] = useState("");
  const [customRuleText, setCustomRuleText] = useState("");
  const [sellerProfile, setSellerProfile] = useState<any>(null);

  // Map & location search states
  const [locationSearchInput, setLocationSearchInput] = useState("");
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const capacityOptions = ["1 Guest", "2 Guests", "3 Guests", "4 Guests", "5+ Guests"];

  // 1. Fetch Seller Profile on mount for default fallback address
  useEffect(() => {
    async function loadSellerProfile() {
      try {
        const res = await fetchApi("/api/seller/profile");
        if (res.ok) {
          const json = await res.json();
          const profile = json.data?.profile || json.profile || json.data;
          if (profile) {
            setSellerProfile(profile);
          }
        }
      } catch (e) {
        console.warn("Could not load seller profile for default address:", e);
      }
    }
    loadSellerProfile();
  }, []);

  // 2. Load existing room details in edit mode
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

            const items: PhotoItem[] = photos.map((url, idx) => ({
              id: `existing-${idx}-${Date.now()}`,
              url,
              isExisting: true,
            }));
            setPhotoItems(items);

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
              loadedAbout = room.description
                .replace(/Amenities:[^\n]+/i, "")
                .replace(/House Rules:[^\n]+/i, "")
                .replace(/Floor(?:\s*No)?:[^\n]+/i, "")
                .trim();
            }
            if (loadedAbout.startsWith("{")) {
              try {
                const parsed = JSON.parse(loadedAbout);
                loadedAbout = typeof parsed.about === "string" ? parsed.about : "";
              } catch {
                loadedAbout = "";
              }
            }

            // Extract property-specific location metadata
            const parsedLoc = extractRoomPropertyLocation(
              room.description,
              room.about,
              {
                locality: room.sellerLocality || room.seller?.addressLocality || "",
                landmark: room.sellerLandmark || room.seller?.addressLandmark || "",
                city: room.sellerCity || room.seller?.user?.city || "Pune",
                pincode: room.sellerPincode || room.seller?.user?.pincode || "",
                addressFlat: room.seller?.addressFlat || "",
                latitude: room.sellerLatitude ?? room.latitude ?? null,
                longitude: room.sellerLongitude ?? room.longitude ?? null,
              }
            );

            // Strip metadata comments from about textarea
            const cleanedAbout = cleanRoomAboutText(loadedAbout);

            setFormData({
              roomName: room.title || "",
              capacity: `${room.capacity || 2} Guest${(room.capacity || 2) > 1 ? "s" : ""}`,
              pricePerNight: String(room.price || ""),
              floorNo: loadedFloor,
              about: cleanedAbout,
              mediaPhotos: photos,
              amenities: mappedAmenities,
              houseRules: loadedHouseRules,
              isInstantlyBookable: room.isAvailable ?? true,
              useSellerDefaultLocation: parsedLoc.useSellerDefaultLocation || false,
              houseNumber: parsedLoc.houseNumber || "",
              street: parsedLoc.street || "",
              locality: parsedLoc.locality || "",
              landmark: parsedLoc.landmark || "",
              city: parsedLoc.city || "Pune",
              pincode: parsedLoc.pincode || "",
              latitude: parsedLoc.latitude ?? 18.5204,
              longitude: parsedLoc.longitude ?? 73.8567,
            });
          }
        }
      } catch (err) {
        console.error("Failed to load room details:", err);
      }
    }
    loadRoom();
  }, [roomId]);

  const handleTextChange = (field: keyof RoomConfigData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Toggle between Default Registered Address and Custom Property Location
  const handleLocationModeToggle = (useDefault: boolean) => {
    if (useDefault && sellerProfile) {
      const defaultPin = sellerProfile.user?.pincode || sellerProfile.pincode || "";
      let defLat = sellerProfile.latitude ?? null;
      let defLng = sellerProfile.longitude ?? null;
      if ((defLat === null || defLng === null) && defaultPin) {
        const pinCoords = getPincodeCoordinates(defaultPin);
        if (pinCoords) {
          defLat = pinCoords.lat;
          defLng = pinCoords.lng;
        }
      }

      setFormData((prev) => ({
        ...prev,
        useSellerDefaultLocation: true,
        houseNumber: sellerProfile.addressFlat || "",
        street: sellerProfile.addressStreet || "",
        locality: sellerProfile.addressLocality || "",
        landmark: sellerProfile.addressLandmark || "",
        city: sellerProfile.user?.city || sellerProfile.city || "Pune",
        pincode: defaultPin,
        latitude: defLat ?? 18.5204,
        longitude: defLng ?? 73.8567,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        useSellerDefaultLocation: false,
      }));
    }
  };

  // Live GPS Detector
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          useSellerDefaultLocation: false,
        }));
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const pincode = addr.postcode || "";
            const locality =
              addr.suburb ||
              addr.neighbourhood ||
              addr.city_district ||
              addr.quarter ||
              addr.residential ||
              "";
            const street = addr.road || addr.street || "";
            const landmark = addr.amenity || addr.shop || addr.building || "";
            const city = addr.city || addr.town || addr.village || "Pune";
            const houseNumber = addr.house_number || "";

            setFormData((prev) => ({
              ...prev,
              houseNumber: houseNumber || prev.houseNumber,
              street: street || prev.street,
              locality: locality || prev.locality,
              landmark: landmark || prev.landmark,
              city: city || prev.city,
              pincode: pincode || prev.pincode,
            }));
          }
        } catch (e) {
          console.error("Reverse geocoding error:", e);
        } finally {
          setIsDetectingGps(false);
          setToastMessage("Location detected via GPS!");
          setTimeout(() => setToastMessage(null), 2500);
        }
      },
      (err) => {
        console.error("GPS error:", err);
        setIsDetectingGps(false);
        alert("Unable to detect GPS position. Please check location permissions or select on map.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Map Area / Address Search
  const handleSearchLocation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = locationSearchInput.trim();
    if (!query) return;

    setIsSearchingLocation(true);
    try {
      const fullQuery = query.toLowerCase().includes("pune") ? query : `${query}, Pune, Maharashtra`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          fullQuery
        )}&limit=1&addressdetails=1`
      );
      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const first = results[0];
          const lat = parseFloat(first.lat);
          const lng = parseFloat(first.lon);
          const addr = first.address || {};
          const pincode = addr.postcode || "";
          const locality =
            addr.suburb ||
            addr.neighbourhood ||
            addr.city_district ||
            addr.quarter ||
            query.split(",")[0].trim();
          const street = addr.road || "";
          const landmark = addr.amenity || addr.shop || "";
          const city = addr.city || addr.town || addr.village || "Pune";

          setFormData((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            locality: locality || prev.locality,
            pincode: pincode || prev.pincode,
            street: street || prev.street,
            landmark: landmark || prev.landmark,
            city: city || prev.city,
            useSellerDefaultLocation: false,
          }));
          setToastMessage(`Pinned to ${locality || query}!`);
          setTimeout(() => setToastMessage(null), 2500);
        } else {
          alert(`No map coordinates found for "${query}". Try adding specific landmark or area name.`);
        }
      }
    } catch (err) {
      console.error("Location search failed:", err);
      alert("Failed to search location. Please try again or click directly on the map.");
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Map Pin change handler (from Leaflet OpenStreetMap)
  const handleMapChange = (lat: number, lng: number, details?: any) => {
    setFormData((prev) => {
      const updatedPincode = details?.pincode || prev.pincode;
      return {
        ...prev,
        latitude: lat,
        longitude: lng,
        locality: details?.street || details?.neighbourhood || prev.locality,
        pincode: updatedPincode,
        street: details?.street || prev.street,
        landmark: details?.landmark || prev.landmark,
        houseNumber: details?.houseNumber || prev.houseNumber,
        useSellerDefaultLocation: false,
      };
    });
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

    const exists = formData.amenities.some(
      (a) => a.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
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

    const newItems: PhotoItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        alert(`Photo "${file.name}" (${sizeMB} MB) exceeds the 5MB upload limit. Please select images under 5MB.`);
        e.target.value = "";
        return;
      }
      newItems.push({
        id: `new-${Date.now()}-${i}-${Math.random()}`,
        url: URL.createObjectURL(file),
        file,
        isExisting: false,
      });
    }

    setPhotoItems((prev) => [...prev, ...newItems]);
    setFormData((prev) => ({
      ...prev,
      mediaPhotos: [...prev.mediaPhotos, ...newItems.map((item) => item.url)],
    }));

    e.target.value = "";
    setToastMessage("Photos uploaded successfully");
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleDeletePhoto = (index: number) => {
    setPhotoItems((prev) => {
      const target = prev[index];
      if (target && target.url.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(target.url);
        } catch (e) {}
      }
      const updated = prev.filter((_, i) => i !== index);
      setFormData((fPrev) => ({
        ...fPrev,
        mediaPhotos: updated.map((item) => item.url),
      }));
      return updated;
    });
  };

  const handleSave = async () => {
    if (onSave) {
      onSave({
        ...formData,
        mediaPhotos: photoItems.map((p) => p.url),
      });
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

      // Serialize location metadata into description / about
      const locationComment = formatRoomLocationComment({
        houseNumber: formData.houseNumber,
        street: formData.street,
        locality: formData.locality,
        landmark: formData.landmark,
        city: formData.city,
        pincode: formData.pincode,
        latitude: formData.latitude,
        longitude: formData.longitude,
        useSellerDefaultLocation: formData.useSellerDefaultLocation,
      });

      const cleanAbout = cleanRoomAboutText(formData.about);
      const combinedAbout = cleanAbout ? `${cleanAbout}\n\n${locationComment}` : locationComment;

      const bodyFormData = new FormData();
      if (roomId) {
        bodyFormData.append("roomId", roomId);
      }
      bodyFormData.append("title", formData.roomName.trim());
      bodyFormData.append("price", parsedPrice);
      bodyFormData.append("capacity", capacityNum);
      bodyFormData.append("isAvailable", String(formData.isInstantlyBookable));
      bodyFormData.append("about", combinedAbout);
      bodyFormData.append("description", combinedAbout);
      bodyFormData.append("floor", formData.floorNo || "");
      bodyFormData.append("amenities", JSON.stringify(selectedAmenities));
      bodyFormData.append("houseRules", JSON.stringify(formData.houseRules));

      // Append property location specific fields
      bodyFormData.append("locality", formData.locality || "");
      bodyFormData.append("city", formData.city || "Pune");
      bodyFormData.append("pincode", formData.pincode || "");
      bodyFormData.append("landmark", formData.landmark || "");
      bodyFormData.append("houseNumber", formData.houseNumber || "");
      if (formData.latitude !== null && formData.latitude !== undefined) {
        bodyFormData.append("latitude", String(formData.latitude));
      }
      if (formData.longitude !== null && formData.longitude !== undefined) {
        bodyFormData.append("longitude", String(formData.longitude));
      }

      const existingUrls = photoItems
        .filter((p) => p.isExisting && !p.url.startsWith("blob:"))
        .map((p) => p.url);
      const newFiles = photoItems
        .filter((p) => p.file)
        .map((p) => p.file as File);

      bodyFormData.append("existingImages", JSON.stringify(existingUrls));
      for (const file of newFiles) {
        bodyFormData.append("images", file);
      }
      if (existingUrls.length > 0) {
        bodyFormData.append("imageUrl", existingUrls[0]);
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

      {/* Constrained Content */}
      <div
        style={{
          width: "100%",
          maxWidth: "1120px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          boxSizing: "border-box",
          margin: "0 auto",
        }}
        className="constrained-content"
      >
        {/* Header */}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
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
            {isEditMode ? "Edit Room Details" : "Room Configurator"}
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "#64748B",
              fontWeight: 400,
              margin: 0,
            }}
          >
            Configure room parameters, distinct property location, pricing models, and media elements.
          </p>
        </div>

        {/* Form Card */}
        <div
          style={{
            width: "100%",
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            boxShadow: "0px 4px 12px 0px rgba(0, 0, 0, 0.02)",
            padding: "32px",
            display: "flex",
            flexDirection: "column",
            gap: "28px",
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
            Basic Details
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

          {/* Media / Photos */}
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
              {photoItems.map((item, idx) => (
                <div
                  key={item.id || idx}
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
                    src={item.url}
                    alt={`Room photo ${idx + 1}`}
                    fill
                    sizes="68px"
                    style={{
                      objectFit: "cover",
                    }}
                    unoptimized
                  />
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

          {/* About Property / Description */}
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

          {/* ========================================================================= */}
          {/* PROPERTY LOCATION & ADDRESS SECTION (Multi-Property Location Support)   */}
          {/* ========================================================================= */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              padding: "20px",
              backgroundColor: "#F8FAFC",
              borderRadius: "10px",
              border: "1px solid #E2E8F0",
            }}
          >
            {/* Section Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    backgroundColor: "#FFF1E8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FF5500",
                  }}
                >
                  <MapPin size={20} />
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: "14.5px",
                      fontWeight: 700,
                      color: "#0F172A",
                      margin: 0,
                    }}
                  >
                    Property Location & Address
                  </h3>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#64748B",
                      margin: 0,
                      marginTop: "2px",
                    }}
                  >
                    Specify the exact address for this room so guests searching for areas like Hinjawadi or Kothrud find this property.
                  </p>
                </div>
              </div>

              {/* Live Coordinates Badge */}
              {formData.latitude !== null && formData.longitude !== null && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px",
                    backgroundColor: "#ECFDF5",
                    border: "1px solid #A7F3D0",
                    borderRadius: "6px",
                    fontSize: "11.5px",
                    color: "#065F46",
                    fontWeight: 500,
                  }}
                >
                  <CheckCircle2 size={13} color="#10B981" />
                  <span>
                    Pinned: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                  </span>
                </div>
              )}
            </div>

            {/* Location Source Choice Mode */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                width: "100%",
              }}
            >
              {/* Option 1: Custom Property Address */}
              <div
                onClick={() => handleLocationModeToggle(false)}
                style={{
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: !formData.useSellerDefaultLocation ? "1.5px solid #FF5500" : "1px solid #E2E8F0",
                  backgroundColor: !formData.useSellerDefaultLocation ? "#FFF8F5" : "#FFFFFF",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  transition: "all 0.15s ease",
                }}
              >
                <input
                  type="radio"
                  name="propertyLocationMode"
                  checked={!formData.useSellerDefaultLocation}
                  onChange={() => handleLocationModeToggle(false)}
                  style={{ marginTop: "3px", accentColor: "#FF5500", cursor: "pointer" }}
                />
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>
                    Custom Property Address
                  </div>
                  <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "2px" }}>
                    Independent address for this specific PG, flat, or building
                  </div>
                </div>
              </div>

              {/* Option 2: Use Seller Registered Address */}
              <div
                onClick={() => handleLocationModeToggle(true)}
                style={{
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: formData.useSellerDefaultLocation ? "1.5px solid #FF5500" : "1px solid #E2E8F0",
                  backgroundColor: formData.useSellerDefaultLocation ? "#FFF8F5" : "#FFFFFF",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  transition: "all 0.15s ease",
                }}
              >
                <input
                  type="radio"
                  name="propertyLocationMode"
                  checked={formData.useSellerDefaultLocation}
                  onChange={() => handleLocationModeToggle(true)}
                  style={{ marginTop: "3px", accentColor: "#FF5500", cursor: "pointer" }}
                />
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>
                    Use Registered Host Address
                  </div>
                  <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "2px" }}>
                    {sellerProfile
                      ? `${sellerProfile.addressLocality || ""}, ${sellerProfile.user?.city || "Pune"} (${sellerProfile.user?.pincode || ""})`
                      : "Same address as your registered host profile"}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Location Tools: Map Search & GPS */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
                backgroundColor: "#FFFFFF",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #E2E8F0",
              }}
            >
              {/* Search Bar on Map */}
              <div style={{ display: "flex", flex: 1, minWidth: "260px", gap: "6px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flex: 1,
                    backgroundColor: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "6px",
                    padding: "6px 12px",
                  }}
                >
                  <Search size={15} color="#64748B" />
                  <input
                    type="text"
                    value={locationSearchInput}
                    onChange={(e) => setLocationSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSearchLocation();
                      }
                    }}
                    placeholder="Search area (e.g. Hinjawadi, Kothrud, Baner, Wakad)..."
                    style={{
                      border: "none",
                      outline: "none",
                      backgroundColor: "transparent",
                      fontSize: "12.5px",
                      color: "#0F172A",
                      width: "100%",
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSearchLocation}
                  disabled={isSearchingLocation}
                  style={{
                    backgroundColor: "#0F172A",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 14px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: isSearchingLocation ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isSearchingLocation ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : null}
                  <span>Find on Map</span>
                </button>
              </div>

              {/* Use Live GPS Button */}
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={isDetectingGps}
                style={{
                  backgroundColor: "#FFF1E8",
                  color: "#FF5500",
                  border: "1px solid #FFD0B8",
                  borderRadius: "6px",
                  padding: "7px 14px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: isDetectingGps ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                }}
              >
                {isDetectingGps ? (
                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <Navigation size={14} />
                )}
                <span>Use Current GPS</span>
              </button>
            </div>

            {/* Interactive OpenStreetMap Leaflet Map Picker */}
            <div
              style={{
                borderRadius: "8px",
                overflow: "hidden",
                border: "1px solid #CBD5E1",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              }}
            >
              <div
                style={{
                  backgroundColor: "#F1F5F9",
                  padding: "8px 14px",
                  fontSize: "11.5px",
                  color: "#475569",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #E2E8F0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Map size={14} color="#FF5500" />
                  <span>
                    <strong>OpenStreetMap Pin:</strong> Drag the marker or click on the map to pinpoint property location.
                  </span>
                </div>
                <span style={{ color: "#64748B", fontSize: "11px" }}>
                  Auto reverse-geocodes locality & pincode
                </span>
              </div>
              <div style={{ width: "100%", height: "260px", position: "relative" }}>
                <HouseMapPicker
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onChange={handleMapChange}
                />
              </div>
            </div>

            {/* Structured Address Form Fields */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "14px",
                width: "100%",
              }}
            >
              {/* Flat / Building / House No */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#0F172A" }}>
                  House / Flat / Building No
                </label>
                <input
                  type="text"
                  value={formData.houseNumber}
                  onChange={(e) => handleTextChange("houseNumber", e.target.value)}
                  placeholder="e.g. Flat 302, Sai Residency"
                  style={{
                    borderRadius: "6px",
                    border: "1px solid #E2E8F0",
                    padding: "8px 12px",
                    fontSize: "13px",
                    color: "#0F172A",
                    backgroundColor: "#FFFFFF",
                    outline: "none",
                  }}
                />
              </div>

              {/* Area / Locality (PRIMARY SEARCH IDENTITY) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#FF5500" }}>
                    Area / Locality *
                  </label>
                  <span style={{ fontSize: "11px", color: "#64748B" }}>Used for customer search</span>
                </div>
                <input
                  type="text"
                  value={formData.locality}
                  onChange={(e) => handleTextChange("locality", e.target.value)}
                  placeholder="e.g. Hinjawadi Phase 1, Kothrud, Baner"
                  style={{
                    borderRadius: "6px",
                    border: "1.5px solid #FFD0B8",
                    padding: "8px 12px",
                    fontSize: "13px",
                    color: "#0F172A",
                    backgroundColor: "#FFFFFF",
                    outline: "none",
                  }}
                />
              </div>

              {/* Landmark / Street */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#0F172A" }}>
                  Landmark / Street (Optional)
                </label>
                <input
                  type="text"
                  value={formData.landmark}
                  onChange={(e) => handleTextChange("landmark", e.target.value)}
                  placeholder="e.g. Near Cognizant, Behind MIT College"
                  style={{
                    borderRadius: "6px",
                    border: "1px solid #E2E8F0",
                    padding: "8px 12px",
                    fontSize: "13px",
                    color: "#0F172A",
                    backgroundColor: "#FFFFFF",
                    outline: "none",
                  }}
                />
              </div>

              {/* City & Pincode Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#0F172A" }}>
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleTextChange("city", e.target.value)}
                    placeholder="e.g. Pune"
                    style={{
                      borderRadius: "6px",
                      border: "1px solid #E2E8F0",
                      padding: "8px 12px",
                      fontSize: "13px",
                      color: "#0F172A",
                      backgroundColor: "#FFFFFF",
                      outline: "none",
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#0F172A" }}>
                    6-Digit Pincode
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      handleTextChange("pincode", val);
                      if (val.length === 6) {
                        const coords = getPincodeCoordinates(val);
                        if (coords) {
                          setFormData((prev) => ({
                            ...prev,
                            pincode: val,
                            latitude: coords.lat,
                            longitude: coords.lng,
                            locality: prev.locality || coords.locality,
                          }));
                        }
                      }
                    }}
                    placeholder="e.g. 411057"
                    style={{
                      borderRadius: "6px",
                      border: "1px solid #E2E8F0",
                      padding: "8px 12px",
                      fontSize: "13px",
                      color: "#0F172A",
                      backgroundColor: "#FFFFFF",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Amenities Selection */}
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

          {/* House Rules */}
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

          {/* Instantly Bookable Toggle */}
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
