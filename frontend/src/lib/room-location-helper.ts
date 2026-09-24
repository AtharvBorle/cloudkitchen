import { getPincodeCoordinates } from "./geo-distance";

export interface RoomPropertyLocation {
  houseNumber: string;
  street: string;
  locality: string;
  landmark: string;
  city: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  useSellerDefaultLocation?: boolean;
  isCustomLocation?: boolean;
}

/**
 * Extracts property-specific location metadata from room description or about string.
 * Falls back to host/seller default registered address if no property-specific location was stored.
 */
export function extractRoomPropertyLocation(
  description?: string | null,
  about?: string | null,
  fallback?: {
    locality?: string;
    city?: string;
    pincode?: string;
    landmark?: string;
    addressFlat?: string;
    latitude?: number | null;
    longitude?: number | null;
  }
): RoomPropertyLocation {
  const textToScan = `${description || ""} ${about || ""}`;
  const match = textToScan.match(/<!--property_location:(.*?)-->/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      const pincode = parsed.pincode || fallback?.pincode || "";
      let lat = parsed.latitude !== undefined && parsed.latitude !== null ? Number(parsed.latitude) : (fallback?.latitude ?? null);
      let lng = parsed.longitude !== undefined && parsed.longitude !== null ? Number(parsed.longitude) : (fallback?.longitude ?? null);

      if ((lat === null || lng === null) && pincode) {
        const pinCoords = getPincodeCoordinates(pincode);
        if (pinCoords) {
          lat = pinCoords.lat;
          lng = pinCoords.lng;
        }
      }

      return {
        houseNumber: parsed.houseNumber || "",
        street: parsed.street || "",
        locality: parsed.locality || fallback?.locality || "",
        landmark: parsed.landmark || fallback?.landmark || "",
        city: parsed.city || fallback?.city || "Pune",
        pincode,
        latitude: lat,
        longitude: lng,
        useSellerDefaultLocation: Boolean(parsed.useSellerDefaultLocation),
        isCustomLocation: true,
      };
    } catch (e) {
      console.warn("Error parsing embedded room property location:", e);
    }
  }

  const pincode = fallback?.pincode || "";
  let lat = fallback?.latitude ?? null;
  let lng = fallback?.longitude ?? null;
  if ((lat === null || lng === null) && pincode) {
    const pinCoords = getPincodeCoordinates(pincode);
    if (pinCoords) {
      lat = pinCoords.lat;
      lng = pinCoords.lng;
    }
  }

  return {
    houseNumber: fallback?.addressFlat || "",
    street: "",
    locality: fallback?.locality || "",
    landmark: fallback?.landmark || "",
    city: fallback?.city || "Pune",
    pincode,
    latitude: lat,
    longitude: lng,
    useSellerDefaultLocation: false,
    isCustomLocation: false,
  };
}

/**
 * Strips HTML metadata comments and location subtitles from user-entered room description.
 */
export function cleanRoomAboutText(text?: string | null): string {
  if (!text) return "";
  return text
    .replace(/<!--property_location:.*?-->/g, "")
    .replace(/📍\s*Property\s*Location:[^\n]+/gi, "")
    .trim();
}

/**
 * Formats a clean HTML comment containing the property's location JSON.
 */
export function formatRoomLocationComment(location: {
  houseNumber?: string;
  street?: string;
  locality?: string;
  landmark?: string;
  city?: string;
  pincode?: string;
  latitude?: number | null;
  longitude?: number | null;
  useSellerDefaultLocation?: boolean;
}): string {
  const meta = {
    houseNumber: location.houseNumber?.trim() || "",
    street: location.street?.trim() || "",
    locality: location.locality?.trim() || "",
    landmark: location.landmark?.trim() || "",
    city: location.city?.trim() || "Pune",
    pincode: location.pincode?.trim() || "",
    latitude: location.latitude ?? null,
    longitude: location.longitude ?? null,
    useSellerDefaultLocation: Boolean(location.useSellerDefaultLocation),
  };
  return `<!--property_location:${JSON.stringify(meta)}-->`;
}
