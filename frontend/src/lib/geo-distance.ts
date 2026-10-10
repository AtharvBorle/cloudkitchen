/**
 * Geographic distance calculations and known postal coordinates for cloud kitchen delivery radius.
 */

export const MAX_DELIVERY_RADIUS_KM = 5.0;

/**
 * Calculates the great-circle distance between two geographic coordinates using the Haversine formula.
 * @param lat1 Latitude of point 1 in decimal degrees
 * @param lon1 Longitude of point 1 in decimal degrees
 * @param lat2 Latitude of point 2 in decimal degrees
 * @param lon2 Longitude of point 2 in decimal degrees
 * @returns Distance in kilometers rounded to 1 decimal place
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Number(distance.toFixed(1));
}

/**
 * Formats distance in km for UI badges (e.g. "1.2 km", "850 m")
 */
export function formatDistance(distanceKm?: number | null): string {
  if (distanceKm === undefined || distanceKm === null || isNaN(distanceKm)) {
    return "";
  }
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Standard Pune and major urban pincode coordinates map
 * Used for instant resolution if GPS / map pin coordinates are not yet available.
 */
export const PINCODE_COORDINATES: Record<string, { lat: number; lng: number; locality: string; city: string }> = {
  // Pune Central & West
  "411038": { lat: 18.5074, lng: 73.8077, locality: "Kothrud", city: "Pune" },
  "411051": { lat: 18.5016, lng: 73.8216, locality: "Karve Nagar", city: "Pune" },
  "411052": { lat: 18.4965, lng: 73.8188, locality: "Karve Nagar", city: "Pune" },
  "411004": { lat: 18.5173, lng: 73.8415, locality: "Deccan Gymkhana", city: "Pune" },
  "411030": { lat: 18.5124, lng: 73.8478, locality: "Sadashiv Peth", city: "Pune" },
  "411016": { lat: 18.5362, lng: 73.8298, locality: "SB Road", city: "Pune" },
  "411058": { lat: 18.4891, lng: 73.8105, locality: "Warje", city: "Pune" },
  "411041": { lat: 18.4682, lng: 73.8368, locality: "Sinhagad Road", city: "Pune" },
  "411023": { lat: 18.4620, lng: 73.7920, locality: "Dhayari", city: "Pune" },

  // Pune North & IT Corridor
  "411045": { lat: 18.5590, lng: 73.7868, locality: "Baner", city: "Pune" },
  "411007": { lat: 18.5580, lng: 73.8075, locality: "Aundh", city: "Pune" },
  "411021": { lat: 18.5330, lng: 73.7745, locality: "Bavdhan", city: "Pune" },
  "411057": { lat: 18.5913, lng: 73.7389, locality: "Hinjawadi", city: "Pune" },
  "411027": { lat: 18.5808, lng: 73.7997, locality: "Pimple Saudagar", city: "Pune" },
  "411017": { lat: 18.5980, lng: 73.8080, locality: "Pimpri", city: "Pune" },
  "411033": { lat: 18.6186, lng: 73.7997, locality: "Chinchwad", city: "Pune" },
  "411061": { lat: 18.6015, lng: 73.7885, locality: "Wakad", city: "Pune" },

  // Pune East & South
  "411001": { lat: 18.5204, lng: 73.8567, locality: "Camp", city: "Pune" },
  "411002": { lat: 18.5158, lng: 73.8560, locality: "Swargate", city: "Pune" },
  "411005": { lat: 18.5314, lng: 73.8446, locality: "Shivajinagar", city: "Pune" },
  "411006": { lat: 18.5529, lng: 73.8797, locality: "Yerwada", city: "Pune" },
  "411009": { lat: 18.4912, lng: 73.8543, locality: "Sahakar Nagar", city: "Pune" },
  "411014": { lat: 18.5679, lng: 73.9143, locality: "Viman Nagar", city: "Pune" },
  "411011": { lat: 18.5284, lng: 73.8740, locality: "Koregaon Park", city: "Pune" },
  "411015": { lat: 18.5620, lng: 73.8900, locality: "Vishrantwadi", city: "Pune" },
  "411028": { lat: 18.5089, lng: 73.9259, locality: "Hadapsar", city: "Pune" },
  "411036": { lat: 18.5360, lng: 73.9015, locality: "Kalyani Nagar", city: "Pune" },
  "411037": { lat: 18.4872, lng: 73.8732, locality: "Wanowrie", city: "Pune" },
  "411046": { lat: 18.4550, lng: 73.8550, locality: "Katraj", city: "Pune" },
  "411048": { lat: 18.4680, lng: 73.8820, locality: "Kondhwa", city: "Pune" },
  "411040": { lat: 18.5410, lng: 73.9450, locality: "Kharadi", city: "Pune" },

  // Mumbai Samples
  "400001": { lat: 18.9322, lng: 72.8354, locality: "Fort", city: "Mumbai" },
  "400050": { lat: 19.0596, lng: 72.8295, locality: "Bandra West", city: "Mumbai" },
  "400053": { lat: 19.1363, lng: 72.8277, locality: "Andheri West", city: "Mumbai" },
};

/**
 * Returns coordinate and locality info for a given 6-digit pincode if available.
 */
export function getPincodeCoordinates(pincode?: string | null): { lat: number; lng: number; locality: string; city: string } | null {
  if (!pincode) return null;
  const clean = pincode.replace(/\D/g, "").slice(0, 6);
  return PINCODE_COORDINATES[clean] || null;
}

export interface LocationAddressInput {
  pincode?: string | null;
  locality?: string | null;
  city?: string | null;
  street?: string | null;
  landmark?: string | null;
  formattedAddress?: string | null;
  [key: string]: any;
}

/**
 * Formats a clean, descriptive, concise 2-4 word delivery location indicator
 * for the top navigation bar (e.g. "Paud Road, Kothrud, Pune", "Karve Nagar, Pune", "Baner Road, Pune").
 * Strictly prevents redundant city repeats like "Pune, Pune" or "Kothrud, Pune, Pune".
 */
export function formatShortDeliveryLocation(addr?: LocationAddressInput | null): string {
  if (!addr) return "Select Location";

  const pin = (addr.pincode || "").replace(/\D/g, "").slice(0, 6);
  const pinLookup = pin ? PINCODE_COORDINATES[pin] : null;

  let city = (addr.city || pinLookup?.city || "Pune").trim();
  const cityLower = city.toLowerCase();

  const isGeneric = (str?: string | null) => {
    if (!str) return true;
    const l = str.toLowerCase().trim();
    return (
      l === "pune" ||
      l === "current location" ||
      l === "pune area" ||
      l === "select location" ||
      l === "your location" ||
      l === cityLower
    );
  };

  let locality = (addr.locality || "").trim();
  if (isGeneric(locality)) {
    locality = pinLookup?.locality || "";
  }

  let street = (addr.street || "").trim();
  if (isGeneric(street)) {
    street = "";
  }

  // If both locality and street are still empty or generic, try extracting from formattedAddress
  if ((!locality || isGeneric(locality)) && (!street || isGeneric(street)) && addr.formattedAddress) {
    const rawParts = addr.formattedAddress.split(",").map((s) => s.trim()).filter(Boolean);
    const meaningful = rawParts.filter((p) => {
      const l = p.toLowerCase();
      if (
        l === "india" ||
        l === "maharashtra" ||
        l === cityLower ||
        /^\d{6}$/.test(p) ||
        l.includes("district")
      ) {
        return false;
      }
      if (/^(shop|flat|house|plot|room|bldg|building|h\.?\s*no|f\.?\s*no)\b/i.test(l) || /^[#\d\-\/\s]+$/.test(p)) {
        return false;
      }
      return true;
    });
    if (meaningful.length > 0) {
      if (meaningful.length >= 2) {
        street = meaningful[0];
        locality = meaningful[1];
      } else {
        locality = meaningful[0];
      }
    }
  }

  // Fallback to pincode locality if still missing
  if ((!locality || isGeneric(locality)) && pinLookup?.locality) {
    locality = pinLookup.locality;
  }

  // Clean locality and street: remove trailing/leading commas, remove duplicate city occurrences
  const cleanPart = (str: string) => {
    if (!str) return "";
    return str
      .replace(new RegExp(`\\b${city}\\b`, "gi"), "")
      .replace(/,\s*,/g, ",")
      .replace(/^[\s,]+|[\s,]+$/g, "")
      .trim();
  };

  locality = cleanPart(locality);
  street = cleanPart(street);

  // If street contains locality or vice versa, avoid redundancy
  if (street && locality) {
    if (street.toLowerCase().includes(locality.toLowerCase())) {
      locality = "";
    } else if (locality.toLowerCase().includes(street.toLowerCase())) {
      street = "";
    }
  }

  const parts: string[] = [];
  if (street) {
    // Simplify street if too long (e.g. "Shop 12, Paud Road" -> "Paud Road")
    const subParts = street.split(",").map((s) => s.trim()).filter(Boolean);
    const bestStreet =
      subParts.find((s) => /\b(road|rd|chowk|lane|nagar|colony|gali|highway|bypass|corner)\b/i.test(s)) ||
      subParts[subParts.length - 1] ||
      street;
    parts.push(bestStreet);
  }
  if (locality && !parts.some((p) => p.toLowerCase().includes(locality.toLowerCase()))) {
    // If locality has multiple slashes e.g. "Dattawadi / Karve Nagar", pick primary/first
    const locClean = locality.split(/[\/,]/)[0].trim();
    parts.push(locClean);
  }

  if (city) {
    parts.push(city);
  }

  // Deduplicate parts case-insensitively
  const unique: string[] = [];
  for (const p of parts) {
    if (p && !unique.some((u) => u.toLowerCase() === p.toLowerCase())) {
      unique.push(p);
    }
  }

  // Limit to at most 3 segments (e.g. "Paud Road, Kothrud, Pune")
  const result = unique.slice(0, 3).join(", ");
  return result || (pin ? `PIN ${pin}` : "Select Location");
}
