/**
 * Backend Geographic distance calculations and known postal coordinates.
 */

export const MAX_DELIVERY_RADIUS_KM = 5.0;

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export const PINCODE_COORDINATES: Record<string, { lat: number; lng: number; locality: string; city: string }> = {
  // Pune Central & West
  "411038": { lat: 18.5074, lng: 73.8077, locality: "Kothrud", city: "Pune" },
  "411051": { lat: 18.5016, lng: 73.8216, locality: "Dattawadi / Karve Nagar", city: "Pune" },
  "411052": { lat: 18.4965, lng: 73.8188, locality: "Karve Nagar", city: "Pune" },
  "411004": { lat: 18.5173, lng: 73.8415, locality: "Deccan Gymkhana", city: "Pune" },
  "411030": { lat: 18.5124, lng: 73.8478, locality: "Sadashiv Peth / Narayan Peth", city: "Pune" },
  "411016": { lat: 18.5362, lng: 73.8298, locality: "Model Colony / SB Road", city: "Pune" },
  "411058": { lat: 18.4891, lng: 73.8105, locality: "Warje", city: "Pune" },
  "411041": { lat: 18.4682, lng: 73.8368, locality: "Vadgaon Budruk / Sinhagad Rd", city: "Pune" },
  "411023": { lat: 18.4620, lng: 73.7920, locality: "Dhayari", city: "Pune" },

  // Pune North & IT Corridor
  "411045": { lat: 18.5590, lng: 73.7868, locality: "Baner", city: "Pune" },
  "411007": { lat: 18.5580, lng: 73.8075, locality: "Aundh", city: "Pune" },
  "411021": { lat: 18.5330, lng: 73.7745, locality: "Bavdhan", city: "Pune" },
  "411057": { lat: 18.5913, lng: 73.7389, locality: "Hinjawadi", city: "Pune" },
  "411027": { lat: 18.5808, lng: 73.7997, locality: "Pimple Saudagar", city: "Pune" },
  "411017": { lat: 18.5980, lng: 73.8080, locality: "Pimpri", city: "Pune" },
  "411033": { lat: 18.6186, lng: 73.7997, locality: "Thergaon / Chinchwad", city: "Pune" },
  "411061": { lat: 18.6015, lng: 73.7885, locality: "Wakad", city: "Pune" },

  // Pune East & South
  "411001": { lat: 18.5204, lng: 73.8567, locality: "Camp / Pune Station", city: "Pune" },
  "411002": { lat: 18.5158, lng: 73.8560, locality: "Budhwar Peth / Swargate", city: "Pune" },
  "411005": { lat: 18.5314, lng: 73.8446, locality: "Shivajinagar", city: "Pune" },
  "411006": { lat: 18.5529, lng: 73.8797, locality: "Yerwada", city: "Pune" },
  "411009": { lat: 18.4912, lng: 73.8543, locality: "Parvati / Sahakar Nagar", city: "Pune" },
  "411014": { lat: 18.5679, lng: 73.9143, locality: "Viman Nagar", city: "Pune" },
  "411011": { lat: 18.5284, lng: 73.8740, locality: "Koregaon Park / Bund Garden", city: "Pune" },
  "411015": { lat: 18.5620, lng: 73.8900, locality: "Dhanori / Vishrantwadi", city: "Pune" },
  "411028": { lat: 18.5089, lng: 73.9259, locality: "Hadapsar / Magarpatta", city: "Pune" },
  "411036": { lat: 18.5360, lng: 73.9015, locality: "Kalyani Nagar", city: "Pune" },
  "411037": { lat: 18.4872, lng: 73.8732, locality: "Salunke Vihar / Wanowrie", city: "Pune" },
  "411046": { lat: 18.4550, lng: 73.8550, locality: "Katraj / Ambegaon", city: "Pune" },
  "411048": { lat: 18.4680, lng: 73.8820, locality: "Kondhwa", city: "Pune" },
  "411040": { lat: 18.5410, lng: 73.9450, locality: "Kharadi", city: "Pune" },

  // Mumbai Samples
  "400001": { lat: 18.9322, lng: 72.8354, locality: "Fort", city: "Mumbai" },
  "400050": { lat: 19.0596, lng: 72.8295, locality: "Bandra West", city: "Mumbai" },
  "400053": { lat: 19.1363, lng: 72.8277, locality: "Andheri West", city: "Mumbai" },
};

/**
 * Resolves pincode, coordinates, locality, and city from a pincode OR locality / address text.
 */
export function resolveLocationCoordinates(input?: string | null): { pincode: string; lat: number; lng: number; locality: string; city: string } | null {
  if (!input) return null;
  const str = input.trim();
  if (!str) return null;

  // 1. Direct 6-digit pincode extraction
  const pinMatch = str.match(/\b\d{6}\b/);
  if (pinMatch && PINCODE_COORDINATES[pinMatch[0]]) {
    const info = PINCODE_COORDINATES[pinMatch[0]];
    return { pincode: pinMatch[0], ...info };
  }

  // 2. Locality keyword / segment match against known PINCODE_COORDINATES
  const lower = str.toLowerCase();
  for (const [pin, info] of Object.entries(PINCODE_COORDINATES)) {
    const locLower = info.locality.toLowerCase();
    const segments = locLower.split(/[\/,]/).map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (
      lower.includes(locLower) ||
      locLower.includes(lower) ||
      segments.some((seg) => lower.includes(seg) || seg.includes(lower))
    ) {
      return { pincode: pin, ...info };
    }
  }

  return null;
}

export function getPincodeCoordinates(pincode?: string | null): { lat: number; lng: number; locality: string; city: string } | null {
  if (!pincode) return null;
  const clean = pincode.replace(/\D/g, "").slice(0, 6);
  if (clean && PINCODE_COORDINATES[clean]) {
    return PINCODE_COORDINATES[clean];
  }
  const resolved = resolveLocationCoordinates(pincode);
  return resolved ? { lat: resolved.lat, lng: resolved.lng, locality: resolved.locality, city: resolved.city } : null;
}
