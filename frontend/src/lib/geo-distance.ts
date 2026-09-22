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
  "411004": { lat: 18.5173, lng: 73.8415, locality: "Deccan Gymkhana", city: "Pune" },
  "411016": { lat: 18.5362, lng: 73.8298, locality: "Model Colony / SB Road", city: "Pune" },
  "411052": { lat: 18.4965, lng: 73.8188, locality: "Karve Nagar", city: "Pune" },
  "411058": { lat: 18.4891, lng: 73.8105, locality: "Warje", city: "Pune" },
  "411041": { lat: 18.4682, lng: 73.8368, locality: "Vadgaon Budruk / Sinhagad Rd", city: "Pune" },

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
  "411014": { lat: 18.5679, lng: 73.9143, locality: "Viman Nagar", city: "Pune" },
  "411011": { lat: 18.5284, lng: 73.8740, locality: "Koregaon Park / Bund Garden", city: "Pune" },
  "411028": { lat: 18.5089, lng: 73.9259, locality: "Hadapsar / Magarpatta", city: "Pune" },
  "411036": { lat: 18.5360, lng: 73.9015, locality: "Kalyani Nagar", city: "Pune" },
  "411037": { lat: 18.4872, lng: 73.8732, locality: "Salunke Vihar / Wanowrie", city: "Pune" },
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
